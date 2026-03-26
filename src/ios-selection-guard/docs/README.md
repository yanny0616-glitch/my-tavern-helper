# iOS Selection Guard: 设计与实现说明

本文档描述 `src/ios-selection-guard` 脚本的目标、结构、运行流程和扩展方式，方便后续维护和 AI 代码理解。你每次开始修改代码的时候必须阅读本文档，并且在更新代码后更新此文档

## 1. 脚本目标

这个脚本做三件事：

1. iOS 文本选中修复
在 iOS 上，复制后页面常残留选中态，导致点击失效或误操作；脚本会在合适时机清理选区并退出编辑态。

2. 崩溃/异常诊断
采集页面异常退出特征、`error`、`unhandledrejection`，并在页面上提供可拖拽诊断浮窗。

3. 降级保护（safe mode）
当检测到短时间疑似崩溃次数过高时，自动关闭动画/过渡/毛玻璃，降低再次崩溃概率。

## 2. 代码结构

目录：`src/ios-selection-guard`

- `index.ts`
入口与编排层。只负责初始化和生命周期收敛，不放业务细节。

- `core/env.ts`
环境识别（是否 iOS）。

- `core/types.ts`
共享类型定义（`CrashState`、`Disposable`）。

- `core/constants.ts`
可调参数常量（心跳间隔、崩溃窗口、去重窗口等）。

- `core/state.ts`  
状态读写与事件工具：`loadState/saveState/pushEvent`，含本地时间格式化、错误详情格式化、JSON 安全序列化。

- `core/settings.ts`  
功能开关持久化（localStorage），用于在 UI 中切换脚本行为。

- `core/heavy-mode.ts`  
手动轻量模式样式注入（手动轻量化页面，减少 iOS 崩溃和卡顿）。

- `core/safe-mode.ts`  
自动轻量模式样式注入（关闭动画/过渡/滤镜）。

- `guards/crash-guard.ts`
崩溃判断和异常采集核心逻辑。

- `guards/selection-guard.ts`
iOS 选区/输入选区修复逻辑。

- `diagnostics/diagnostics-text.ts`
诊断面板文本格式化与中文解释转换。

- `diagnostics/diagnostics-panel.ts`
诊断 UI：图标浮标、可拖拽、弹层、刷新/复制/清空/关闭行为。

## 3. 运行流程

1. 入口 `index.ts` 启动后，先创建诊断浮窗（桌面和 iOS 都可见）。
2. 若不是 iOS，只保留诊断浮窗。
3. 若是 iOS，额外启动：
   - `setupCrashGuard`：心跳、错误捕获、疑似崩溃统计、自动轻量模式触发。  
   - `setupSelectionGuard`：文本选中态清理。
4. `pagehide` 时统一 `dispose`，释放事件监听和定时器。

## 4. 崩溃判定策略（当前）

- 判定“疑似崩溃”条件：
  - 上次不是正常退出 (`cleanExit=false`)
  - 上次心跳距现在小于 `CRASH_WINDOW_MS`
  - 启动已超过 `START_GUARD_MS`（避免刚启动误判）

- 达到 `DEGRADE_THRESHOLD` 后：
  - 进入自动轻量模式 `DEGRADE_FOR_MS`
  - 自动记录事件，供诊断面板查看

## 5. 事件日志策略

- 时间戳为本地时间格式：`YYYY-MM-DDTHH:mm:ss.SSS`
- 同一消息在 `EVENT_DEDUPE_WINDOW_MS` 内去重，避免刷屏
- 最多保留 `MAX_EVENTS` 条
- 错误消息保留：
  - 短路径：`bar.js:line:col`
  - 完整路径：`(full: https://.../foo/bar.js:line:col)`
  - 栈摘要：`stack=...`

## 6. 诊断面板行为

- 浮标按钮：
  - Font Awesome 风格图标
  - 可拖拽
  - 点击切换面板开关

- 面板：
  - 跟随浮标弹出（优先下方，空间不足时自动上翻）
  - 左上角新增“功能设置”入口，可直接开关功能
  - 图标按钮：刷新 / 复制 / 清空 / 关闭
  - 清空仅清 `events`，不会清状态字段（如 `crashCount`）

- 功能设置（可持久化）：
  - 崩溃守护：开关异常采集与崩溃统计
  - 选区修复：开关 iOS 文本选区清理
  - 内存快照：报错时追加 `mem/domNodes` 信息
  - 手动轻量模式：手动进入轻量模式（禁动画、滤镜、阴影，隐藏 video/canvas）
  - 后台自动轻量模式：页面进入后台自动开启轻量模式，回到前台后恢复

- 复制行为：
  - 优先 `navigator.clipboard.writeText`
  - 失败时回退 `execCommand('copy')`
  - 再失败才报复制失败

## 7. 构建方式

全量构建：

```powershell
pnpm build
```

单脚本构建（推荐调试此脚本）：

```powershell
$env:TAVERN_HELPER_ENTRY='ios-selection-guard'; pnpm build
```

产物位置：

- `dist/ios-selection-guard/index.js`

## 8. 扩展建议

若后续继续扩展，建议优先在对应模块扩展，而不是回到入口文件：

- 新增错误采集字段：`core/state.ts` / `guards/crash-guard.ts`
- 新增 UI 控件：`diagnostics/diagnostics-panel.ts`
- 修改文案：`diagnostics/diagnostics-text.ts`
- 调参数：`core/constants.ts`

这样可以保证入口保持稳定、可测试点清晰、回归风险更低。
