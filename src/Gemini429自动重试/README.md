# Gemini429自动重试（脚本说明）

## 1. 脚本定位
- 文件：`src/Gemini429自动重试/index.ts`
- 类型：酒馆助手脚本（后台运行，无 `index.html`）
- 目标：
  - 当生成结果出现 `429 / 限流 / 资源耗尽` 时自动重试
  - 避免“重发用户输入导致新开楼层”
  - 区分生成模式进行重试：
    - `swipe` 模式：走右箭头重试
    - 其他模式（`normal/regenerate/continue`）：走 `regenerate` 重试

---

## 2. 依赖接口（来自 Tavern Helper / SillyTavern）

### 2.1 事件
- `eventOn(...)`
- `tavern_events.MESSAGE_RECEIVED`
- `tavern_events.GENERATION_ENDED`
- `tavern_events.GENERATION_STOPPED`
- `tavern_events.MESSAGE_SWIPED`

### 2.2 按钮与脚本变量
- `replaceScriptButtons(...)`
- `getButtonEvent(...)`
- `getVariables(...)`
- `replaceVariables(...)`
- `getScriptId()`

### 2.3 消息读写
- `getChatMessages(...)`
- `setChatMessages(...)`

### 2.4 生成与状态
- `builtin.duringGenerating()`
- `SillyTavern.generate('swipe' | 'regenerate')`

### 2.5 生命周期
- `reloadOnChatChange()`（来自 `@util/script`）
- `$(window).on('pagehide', ...)`

---

## 3. 配置结构（持久化）
配置由 `RetrySettingsSchema` 定义，保存在脚本变量（`type: 'script'`）中。

```ts
{
  enabled: boolean,      // 默认 true
  maxRetries: number,    // 默认 3，强制夹紧到 [1, 20]
  retryDelayMs: number,  // 默认 1500，强制夹紧到 [200, 30000]
  showToasts: boolean    // 默认 true
}
```

### 3.1 配置读写函数
- `loadSettings()`: `getVariables` + `zod parse`，失败回落默认值
- `saveSettings()`: `replaceVariables(settings, { type: 'script', script_id })`

---

## 4. 核心状态（内存）
- `pendingRetryTimer`: 当前待执行重试计时器
- `pendingRetryMessageId`: 当前待执行消息 ID
- `pendingRetryAttempt`: 当前待执行重试次数
- `pendingRetryMode`: 当前待执行模式（`'swipe' | 'regenerate'`）
- `retryAttempts: Map<number, number>`：每条消息已重试次数
- `maxWarnedMessageIds: Set<number>`：达到上限后的提示去重
- `retryModeByMessageId: Map<number, RetryMode>`：记录消息对应的重试模式

---

## 5. 429/限流检测机制
> 这是“前端文本特征检测”，不是直接读取后端 HTTP 状态码。

### 5.1 关键词规则
`RATE_LIMIT_PATTERNS` 包含中英文规则：
- `429`
- `too many requests`
- `rate limit`
- `resource exhausted`
- `quota exceeded`
- 中文限流关键词（请求频繁/速率限制/资源耗尽等）

### 5.2 检测数据来源
`buildMessageDiagnosticText(message)` 会拼接：
- 当前可见消息文本（优先当前 swipe）
- `extra / data / swipes_info / swipe_info` 的 JSON 串

最终由 `isRateLimitFailure(text)` 判断是否命中。

---

## 6. 重试模式判定

### 6.1 规则
- `normalizeRetryMode(type)`：
  - `type === 'swipe'` -> `'swipe'`
  - 其他 -> `'regenerate'`
- `getRetryMode(messageId, source)` 优先级：
  1. `retryModeByMessageId` 中已有映射
  2. `source` 字符串包含 `swipe`
  3. 默认 `'regenerate'`

### 6.2 模式行为
- `swipe`：
  1. 尝试先切到最后一页 swipe（`ensureCurrentIsLastSwipe`）
  2. 点右箭头（优先消息内按钮，降级全局按钮，最后调用 `generate('swipe')`）
- `regenerate`：
  - 直接调用 `generate('regenerate')`

---

## 7. 调度与并发控制

### 7.1 `scheduleRetry(messageId, attempt, reason, mode)`
- 同一 `(messageId + attempt + mode)` 若已排队，直接跳过
- 否则替换旧任务，按 `retryDelayMs` 延迟执行 `runRetry`

### 7.2 `runRetry(...)` 关键流程
1. 清理 pending 状态
2. 再次验证开关、消息存在、是否仍然是 429/限流失败
3. 如果仍在生成中（`builtin.duringGenerating()`），重新排队
4. 计数 + 按模式执行重试
5. 成功/失败提示

### 7.3 上限控制
- 当 `attempts >= maxRetries`：
  - 不再继续重试
  - 仅提示一次（通过 `maxWarnedMessageIds` 去重）

---

## 8. UI（脚本设置弹窗）
按钮名：`Gemini 429自动重试设置`

弹窗项：
- 启用自动重试
- 最大重试次数
- 重试间隔（ms）
- 显示重试提示
- 立即检查一次

保存流程：
1. 读取输入
2. 过 `RetrySettingsSchema.parse(...)`（自动纠错）
3. `saveSettings()`

---

## 9. 事件流（主逻辑入口）
`init()` 里绑定：

1. `MESSAGE_RECEIVED(messageId, type)`
   - 只处理 `normal/regenerate/swipe/continue`
   - 记录 `retryModeByMessageId`
   - `queueInspect(messageId, source)`

2. `GENERATION_ENDED(messageId)`
   - `queueInspect(messageId, 'generation_ended')`

3. `GENERATION_STOPPED()`
   - `queueInspect(undefined, 'generation_stopped')`

4. `MESSAGE_SWIPED(messageId)`
   - `queueInspect(messageId, 'message_swiped')`

---

## 10. 为什么不会“发送新消息”
本脚本没有写输入框、没有点击发送按钮、没有构造用户消息。

它只做两类动作：
- swipe 右箭头流程
- regenerate 流程

因此不会主动新增用户消息楼层。

---

## 11. 给后续 AI 的编辑约束（非常重要）
后续修改请遵守：

1. 只改 `src/Gemini429自动重试/index.ts`
2. 保持模式分流不变：
   - `swipe` -> 右箭头重试
   - 其他 -> `regenerate` 重试
3. **不要**新增“重发用户输入”逻辑
4. 新配置项必须接入 `RetrySettingsSchema`，并兼容旧变量
5. 保留 `pagehide` 清理（定时器/弹窗/监听）

建议给 AI 的指令模板：

```text
请仅修改 src/Gemini429自动重试/index.ts。
保持现有模式分流：swipe 用右箭头，其他用 regenerate。
不要新增发送按钮或重发输入逻辑。
新增设置必须写入 RetrySettingsSchema 并保持向后兼容。
```

---

## 12. 可扩展点（后续可选）
1. 精确 HTTP 429 检测：
   - 拦截 `fetch/XHR`，仅在 `status === 429` 时触发
2. 仅 Gemini 模型启用：
   - 读取当前模型，非 Gemini 直接跳过
3. 指数退避：
   - `delay = baseDelay * 2^(attempt-1)`
4. 超限自动停用：
   - 达到上限后自动 `enabled = false` 并保存

