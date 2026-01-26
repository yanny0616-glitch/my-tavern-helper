# CardHub（脚本版）

CardHub 是酒馆助手脚本形态的角色卡管理器，目标是后续可平滑迁移为 SillyTavern 扩展。

注意：开发时是实时编译更新，发布/导入最新脚本需要打包。

## 入口与注入（仅实时编辑时需要,实时编辑时无需刷新和重新打包，可在完成所有任务后统一打包）

- 注入方式：正则脚本内 `import 'http://localhost:5500/dist/角色卡管理插件/index.js'`
- 入口位置：角色管理页面顶部 + 左侧魔法棒菜单
- 入口脚本挂载：`src/角色卡管理插件/entry/portal.ts`

## 关键结构与挂载点

- 挂载根节点：`div.cardhub-root`（Vue 根组件）
- 额外挂载容器：`div.cardhub-mount`（脚本动态创建）
- 全局样式注入：`<style data-cardhub-style="${getScriptId()}">` 注入到 `head`
- 弹窗背景：`.cardhub-backdrop`
- 主面板：`.cardhub-panel`

## 弹窗规范（统一居中与移动端适配）

- 统一方案：弹窗外层使用 `cardhub-modal`，弹窗面板使用 `cardhub-modal__panel`
- 推荐原因：已在 `entry/portal.styles.ts` 里做了统一居中与移动端尺寸兜底，避免弹窗被顶到上方或跑到右下角
- 非强制方案：你可以不用这两个类，但需要自行补齐弹窗定位与移动端尺寸规则，并确保不被其他样式覆盖
- 默认约定：新增弹窗优先使用这两个类，除非确实需要自定义布局或交互

## 入口按钮相关（方便迁移）

入口按钮是脚本创建的 DOM 节点，并在 `entry/buttons.ts` 里统一注册。后续迁移扩展时只需要替换入口注入逻辑，不需要动 UI 组件。

- 入口按钮 class：`.cardhub-entry-button`
- 菜单入口 class：`.cardhub-menu-entry`
- 打开/关闭控制器：`createCardHubController()` 返回 `{ open, close, toggle, refresh, destroy }`

## 主要代码目录

- `index.ts`：脚本入口，初始化与注册
- `entry/`：入口挂载 + 按钮注入（`portal.ts`、`portal.controller.ts`、`portal.mount.ts`、`portal.styles.ts`）
- `ui/`：Vue UI（`App.vue`）
- `ui/components/`：管理弹窗组件（`ManageModal.vue`、`ManageOverview.vue`、`ManageContent.vue`）
- `ui/composables/`：UI 逻辑拆分
  - `useTagFilters.ts`：标签筛选
  - `useTagEditing.ts`：单卡标签编辑
  - `useBatchTags.ts`：批量标签与标签管理弹窗
  - `useLibraryActions.ts`：导入/导出/私库/删除等动作
- `services/`：数据读取/导入导出/标签同步
- `state/`：界面状态、列表状态
- `types/`：类型定义

## 数据来源与存储

- 酒馆角色卡（已导入）：直接读取 SillyTavern 角色列表
- 私有库（未导入）：全局变量 `cardhub_state`（内部的 `library`）或浏览器 IndexedDB

## 可编辑接口（SillyTavern 后端）

用于在插件内编辑角色卡字段或世界书内容时对接的接口（当前项目只用到角色卡字段编辑）：

- `/api/characters/edit-attribute`：改单字段
- `/api/characters/edit`：合并更新整卡字段
- `/api/characters/merge-attributes`：合并字段
- `/api/worldinfo/edit`：编辑世界书条目

## 已实现功能

- 搜索：角色名/标签
- 筛选：已导入 / 未导入 / 收藏
- 排序：最近聊天、名称、标签数量、导入时间
- 筛选：新增重复筛选（私有库/已导入重复）
- 标签：显示、添加、移除（同步到酒馆标签）
- 标签管理：筛选与批量标签管理
- 管理弹窗：大图、开场白、最近聊天、角色详情
- 导入：支持 `png/json` 导入私有库
- 导出：默认 `png`（私有库 `json` 仍可导出）
- 删除：支持移到私有库或永久删除
- 设置：私有库存储位置（变量 / IndexedDB）、列表显示（每页数量/备注摘要/标签行数/头像大小/同步酒馆标签）、默认导出格式、私有库备份导出
- 修复：部分主题/美化导致弹窗上移或被遮挡

## 弹窗层级约定

为避免被酒馆主题/美化插件遮挡，弹窗统一使用固定层级区间，新增弹窗请沿用该区间，不再随意抬高层级：

- 管理弹窗：200100
- 管理详情/查看器：200200
- 开场白/世界书：200300 / 200310
- 标签管理：200400
- 导出：200500
- 配色：200600
- 设置：200700
- 确认弹窗：200800
- 备注弹窗：200900

## 重要函数入口（定位用）

- 入口挂载：`ensureMounted()`（`entry/portal.controller.ts`）
- 刷新数据：`refreshCharacters()`（`entry/portal.controller.ts`）
- 打开管理弹窗：`openManage(card)`（`ui/App.vue`）
- 标签更新：`applyTagUpdate()`（`ui/App.vue`）
- 标签筛选：`useTagFilters()`（`ui/composables/useTagFilters.ts`）
- 单卡标签编辑：`useTagEditing()`（`ui/composables/useTagEditing.ts`）
- 批量标签：`useBatchTags()`（`ui/composables/useBatchTags.ts`）
- 导入/导出/删除：`useLibraryActions()`（`ui/composables/useLibraryActions.ts`）

## 可拓展方向

- 批量管理：批量打标签/移除标签/批量删除（含筛选条件保存）
- 列表排序：最近使用、导入时间、名称、标签数量；支持置顶/固定
- 角色详情增强：抽屉式详情/对话统计/最近聊天预览
- 库管理：重复检测、同名合并、导入时预览对比
- 世界书、QR、分组/树形分类、去重、预览增强
