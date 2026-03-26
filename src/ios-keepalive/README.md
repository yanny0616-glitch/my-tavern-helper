# iOS KeepAlive

这是一个全新的酒馆助手脚本项目，目标是为 iOS 场景提供“空白音频后台保活 + 可视化控制面板”。

## 目录结构

```text
src/ios-keepalive/
  index.ts                  脚本入口，负责装配各模块
  types.ts                  共享类型定义
  README.md                 项目说明
  core/
    constants.ts            常量、脚本按钮名、空白音频数据
    env.ts                  iOS 环境识别
    schema.ts               设置项 schema 与默认值
    settings.ts             读取/保存脚本变量
    audio-controller.ts     空白音频控制与自动恢复逻辑
  ui/
    panel.ts                浮动按钮和控制面板
```

## 模块职责

- `index.ts`
  只做初始化、模块连接、生命周期回收。

- `core/audio-controller.ts`
  负责创建隐藏音频、播放、停止、测试、自动恢复，不处理界面。

- `core/settings.ts`
  负责脚本变量持久化，不掺杂业务流程。

- `ui/panel.ts`
  只负责界面渲染和用户交互，把业务动作交给外部回调。

- `types.ts`
  集中维护跨模块共用的数据结构，避免接口散落。

## 运行方式

构建单入口：

```powershell
$env:TAVERN_HELPER_ENTRY='ios-keepalive'; pnpm build
```

构建产物：

- `dist/ios-keepalive/index.js`

## 使用说明

1. 在酒馆中导入 `dist/ios-keepalive/index.js`
2. 打开脚本后，右下角会出现 `保活` 浮动按钮
3. 首次点击 `开始保活` 时，浏览器会把这次点击当作用户手势
4. 成功后会持续循环播放一段无声音频，并在切后台/回前台时尝试自动恢复

## 注意事项

- iOS 仍可能在锁屏、低电量、系统回收时中断页面
- 这个脚本只能尽量提高后台存活概率，不能承诺绝对保活
- 面板开关和自动恢复设置会保存到脚本变量中
