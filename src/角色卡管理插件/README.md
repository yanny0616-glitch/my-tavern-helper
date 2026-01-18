# CardHub（脚本版）

CardHub 是酒馆助手脚本形态的角色卡管理器，目标是后续可平滑迁移为 SillyTavern 扩展。

## 入口与注入（仅实时编辑时需要）

- 注入方式：正则脚本内 `import 'http://localhost:5500/dist/角色卡管理插件/index.js'`
- 入口位置：角色管理页面顶部 + 左下角魔法棒菜单
- 入口脚本挂载：`src/角色卡管理插件/entry/portal.ts`

## 关键结构与挂载点

- 挂载根节点：`div.cardhub-root`（Vue 根组件）
- 额外挂载容器：`div.cardhub-mount`（脚本动态创建）
- 全局样式注入：`<style data-cardhub-style="${getScriptId()}">` 注入到 `head`
- 弹窗背景：`.cardhub-backdrop`
- 主面板：`.cardhub-panel`

## 入口按钮相关（方便迁移）

入口按钮是脚本创建的 DOM 节点，并在 `entry/portal.ts` 里统一注册。后续迁移扩展时只需要替换入口注入逻辑，不需要动 UI 组件。

- 入口按钮 class：`.cardhub-entry-button`
- 菜单入口 class：`.cardhub-menu-entry`
- 打开/关闭控制器：`createCardHubController()` 返回 `{ open, close, toggle, refresh, destroy }`

## 主要代码目录

- `index.ts`：脚本入口，初始化与注册
- `entry/`：入口挂载 + 按钮注入（`portal.ts`）
- `ui/`：Vue UI（`App.vue`）
- `services/`：数据读取/导入导出/标签同步
- `state/`：界面状态、列表状态
- `types/`：类型定义

## 数据来源与存储

- 酒馆角色卡（已导入）：直接读取 SillyTavern 角色列表
- 私有库（未导入）：存储在脚本变量 `cardhub_library`

## 已实现功能

- 搜索：角色名/标签
- 筛选：已导入 / 未导入
- 标签：显示、添加、移除（同步到酒馆标签）
- 预览弹窗：图片 + 基础信息
- 管理弹窗：大图、开场白、最近聊天
- 导入：支持 `png/json` 导入私有库
- 导出：默认 `png`（私有库 `json` 仍可导出）

## 重要函数入口（定位用）

- 入口挂载：`ensureMounted()`（`entry/portal.ts`）
- 刷新数据：`refreshCharacters()`（`entry/portal.ts`）
- 打开管理弹窗：`openManage(card)`（`ui/App.vue`）
- 标签更新：`applyTagUpdate()`（`ui/App.vue`）
- 导入：`handleImportFiles()`（`ui/App.vue`）
- 导出：`exportCard()`（`ui/App.vue`）
- 删除/移动：`manageDelete()`（`ui/App.vue`）

## 当前问题

- 管理弹窗样式尚未完全补全（需要补到 `entry/portal.ts` 注入样式）
- 标签同步/筛选存在个别不一致（需再排查）
- 脚本构建失败时入口会消失，缺少显式提示

## 待实现

- 管理弹窗：删除/移动到私有库的完整交互与二次确认 UI
- 批量导出确认弹窗的 UI（现在是浏览器 confirm）
- 角色卡详情扩展：描述、设定、示例对话完整展示
- 私有库与酒馆库同步/去重策略
- 世界书、QR、分组/树形分类、去重、预览增强
- 入口位置/菜单命名可配置
