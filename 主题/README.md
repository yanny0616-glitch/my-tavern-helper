# SP·数据库 主题

为 [SP·数据库（shujuku）](https://github.com/AlbusKen/shujuku) 插件制作的可导入主题，「鎏金」系列一深一浅，成对使用。

| 文件 | 主题名 | 明暗 | 风格 |
| --- | --- | --- | --- |
| `鎏金夜阙.theme.json` | 鎏金·夜阙 | 深色 | 深靛夜幕 + 鎏金强调，宋体排版 |
| `鎏金晨光.theme.json` | 鎏金·晨光 | 浅色 | 暖纸底色 + 金褐强调，宋体排版 |

## 导入方法

1. 下载想要的 `.theme.json` 文件到本地；
2. 打开酒馆中 SP·数据库 的主界面，进入 **设置 → 主题**；
3. 点击 **导入主题**，选择刚下载的 JSON 文件；
4. 导入成功后会自动切换到新主题，之后也可以在主题下拉框中随时切换。

## 自定义

主题文件是纯 JSON，可以直接编辑后重新导入（若 ID 冲突，插件会自动重命名）：

- `theme.variables`：核心颜色变量（`--acu-bg-*` 背景、`--acu-text-*` 文字、`--acu-accent*` 强调色、`--acu-radius-*` 圆角等），主体风格由这里决定；
- `theme.fontFamily`：整体字体，想换回黑体可改为系统 sans-serif 字体栈；
- `theme.customCSS`：组件级样式覆盖，其中 `#popup` 会被自动替换为弹窗根选择器；
- `theme.windowChromeVariables` / `toastVariables` / `visualizerVariables`：窗口标题栏、Toast 提示、可视化编辑器的独立覆盖入口，留空则回退到核心变量；
- `theme.previewColors`：主题选择器里的预览色块，不影响实际样式。

> 注：导入时插件只读取 `formatVersion` 和 `theme` 两个字段，`templateMeta` 等其余字段仅作说明用途。
