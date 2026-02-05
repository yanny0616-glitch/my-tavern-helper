# 扩展管理器

内部维护用的扩展管理脚本。核心目标：可视化当前可见扩展，并能写入 `disabledExtensions` 进行禁用/启用。

## 界面按钮行为

- 刷新列表：重新扫描 DOM + 重新读取 `disabledExtensions`，刷新列表显示
- 更新扩展：检查更新并更新（优先更新已选择项，否则更新全部可更新项）
- 全选可更新：把可更新的扩展全部加入更新队列
- 清空选择：清空更新队列
- 重载页面：触发 `window.parent.location.reload()`，让禁用/启用变更生效
- 启用/禁用：仅对 third-party 生效，修改 `disabledExtensions`
- 删除扩展：仅对 third-party 生效，弹窗确认后删除

## 数据来源与合并规则

- third-party 已启用：由 DOM 资源扫描得到（`dom-scan.ts`）
  - 识别路径：`/scripts/extensions/third-party/{name}/`
  - 入口：`scanThirdPartyFromDom(doc)`
- third-party 已禁用：从 `extensionSettings.disabledExtensions` 中读取
  - 只采集 `third-party/{name}` 前缀
  - 入口：`getDisabledThirdParty(ctx)`
- core 扩展：由 DOM 资源扫描得到（只读展示）
  - 入口：`scanCoreFromDom(doc)`
- 合并：`buildEntries(doc, ctx)` 将已启用与已禁用 third-party 合并并排序，core 直接附加

## 写入与持久化

- 变更入口：`setThirdPartyDisabled(ctx, name, disabled)`
- 写入位置：`extensionSettings.disabledExtensions`
- 持久化：`ctx.saveSettingsDebounced?.()`

## 更新与删除（直接走后端 API）

- 检查更新：`POST /api/extensions/version`
- 更新扩展：`POST /api/extensions/update`
- 删除扩展：`window.SillyTavern.uninstallExtension`（存在则优先用）
  - 回退接口：`POST /api/extensions/uninstall`

## 模块分工

- `index.ts`：入口，注册扩展页按钮、初始化控制器
- `entry/`：入口与挂载
  - `portal.controller.ts`：打开/关闭/刷新控制器
  - `portal.mount.ts`：挂载 Vue 与注入样式
  - `portal.styles.ts`：界面样式字符串
  - `buttons.ts`：扩展页入口按钮
- `ui/`：Vue 界面
  - `App.vue`：主界面
- `services/`：数据与酒馆交互
  - `entries.ts`：读取/写回扩展状态
  - `dom-scan.ts`：DOM 扫描
  - `updates.ts`：更新/删除扩展
  - `tavern.ts`：SillyTavern 上下文封装
- `state/`：界面状态
  - `store.ts`：响应式状态
- `types/`：类型定义

## 已知限制

- 未加载且不在 `disabledExtensions` 中的 third-party 无法被发现
- 变更后需要 Reload 才能生效
- iOS/移动端避免拖动：小屏关闭拖动以防止误触

## 适配说明

- 遮罩层使用 `--em-viewport-w/h` 变量以避免移动端地址栏导致的视口高度异常
- 手机端固定居中显示，不允许拖动

## 使用方式

1. 加载脚本
2. 右下角显示面板
3. 修改状态后点 Reload 生效
