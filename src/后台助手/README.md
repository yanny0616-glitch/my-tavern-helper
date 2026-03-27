# 后台助手

合并了 iOS 后台保活和生成完成通知两个功能的酒馆助手脚本。

## 功能

### 后台保活
- 循环播放无声音频，防止 iOS/浏览器杀死后台页面
- 支持自动恢复：切后台/回前台时自动重新播放
- 可视化状态面板，实时显示播放状态和运行信息

### 生成完成通知
- AI 生成回复完成后，通过浏览器系统通知提醒
- 显示角色名、生成时间、耗时、输出 token 数
- 需要浏览器通知权限授权

## 目录结构

```text
src/后台助手/
  index.ts                 入口，装配所有模块
  types.ts                 共享类型定义
  README.md                项目说明
  core/
    constants.ts           常量、脚本按钮名、空白音频数据
    env.ts                 环境检测 (iOS)
    schema.ts              设置项 schema (zod)
    settings.ts            设置读写
    audio-controller.ts    保活音频控制与自动恢复
    notification.ts        生成完成通知
  ui/
    panel.ts               统一控制面板
```

## 运行方式

构建单入口：

```powershell
$env:TAVERN_HELPER_ENTRY='后台助手'; pnpm build
```

构建产物：`dist/后台助手/index.js`

## 使用说明

1. 在酒馆中导入 `dist/后台助手/index.js`
2. 右下角出现「后台」浮动按钮，点击打开控制面板
3. 开启「后台保活」后会循环播放无声音频
4. 开启「生成完成通知」后，AI 回复完成会发系统通知
5. 首次使用通知功能需点击「申请通知权限」

## 注意事项

- iOS 锁屏/低电量/系统回收时仍可能中断保活
- 通知功能依赖浏览器 Notification API，需 HTTPS 或 localhost
- 所有设置自动保存到脚本变量中
