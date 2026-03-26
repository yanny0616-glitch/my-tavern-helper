import { CrashState } from '../core/types';

export function formatCrashStateForDisplay(state: CrashState): string {
  const now = Date.now();
  const safeModeLeftMs = Math.max(0, state.degradeUntil - now);
  const safeModeLeftMin = Math.ceil(safeModeLeftMs / 60000);
  const isErrorEvent = (message: string) =>
    message.startsWith('error ') || message.startsWith('unhandledrejection ');
  const translateEvent = (line: string) => {
    const spaceIdx = line.indexOf(' ');
    const stamp = spaceIdx > 0 ? line.slice(0, spaceIdx) : '';
    const message = spaceIdx > 0 ? line.slice(spaceIdx + 1) : line;
    let translated = message;
    if (message.startsWith('likely_crash_detected')) {
      translated = `疑似崩溃：上次可能异常退出（${message.replace('likely_crash_detected ', '')}）`;
    } else if (message.startsWith('safe_mode_enabled')) {
      translated = '已开启自动轻量模式（临时关闭动画/过渡效果）';
    } else if (message.startsWith('visibility=')) {
      translated = `页面可见性变化：${message.replace('visibility=', '')}`;
    } else if (message.startsWith('error ')) {
      translated = `脚本报错：${message.replace('error ', '')}`;
    } else if (message.startsWith('unhandledrejection ')) {
      translated = `未处理异步异常：${message.replace('unhandledrejection ', '')}`;
    } else if (message.startsWith('interaction_lock_suspected')) {
      translated = `疑似交互锁态：${message.replace('interaction_lock_suspected ', '')}`;
    } else if (message.startsWith('interaction_recover_attempt')) {
      const detail = message.replace('interaction_recover_attempt', '').trim();
      translated = detail ? `交互恢复尝试：${detail}` : '交互恢复尝试';
    } else if (message === 'interaction_recovered') {
      translated = '交互恢复成功';
    } else if (message === 'interaction_recover_failed') {
      translated = '交互恢复失败';
    } else if (message === 'clean_exit') {
      translated = '正常离开页面';
    }
    return stamp ? `${stamp} ${translated}` : translated;
  };
  const parseLine = (line: string) => {
    const spaceIdx = line.indexOf(' ');
    const stamp = spaceIdx > 0 ? line.slice(0, spaceIdx) : '';
    const message = spaceIdx > 0 ? line.slice(spaceIdx + 1) : line;
    return { stamp, message };
  };
  const errorEvents = state.events
    .map(line => {
      const { stamp, message } = parseLine(line);
      return { stamp, message, translated: translateEvent(line) };
    })
    .filter(item => isErrorEvent(item.message));
  const errorTop = (() => {
    const counter = new Map<string, number>();
    for (const item of errorEvents) {
      const key = item.message.replace(/\s+stack=.*/s, '').trim();
      counter.set(key, (counter.get(key) ?? 0) + 1);
    }
    return [...counter.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k, v]) => `${k.replace(/^error\s+/, '').replace(/^unhandledrejection\s+/, '')} (${v}次)`);
  })();
  const crashWindow = (() => {
    let markerIndex = -1;
    for (let i = state.events.length - 1; i >= 0; i--) {
      if (state.events[i].includes(' likely_crash_detected ')) {
        markerIndex = i;
        break;
      }
    }
    if (markerIndex < 0) {
      return {
        before: [],
        after: errorEvents.slice(-5).map(item => item.translated),
      };
    }
    const before = state.events
      .slice(Math.max(0, markerIndex - 30), markerIndex)
      .map(line => {
        const { message } = parseLine(line);
        return { line, message };
      })
      .filter(item => isErrorEvent(item.message))
      .slice(-10)
      .map(item => translateEvent(item.line));
    const after = state.events
      .slice(markerIndex + 1)
      .map(line => {
        const { message } = parseLine(line);
        return { line, message };
      })
      .filter(item => isErrorEvent(item.message))
      .slice(0, 5)
      .map(item => translateEvent(item.line));
    return { before, after };
  })();

  const lines = [
    '[iOS 崩溃诊断]',
    `是否正常退出：${state.cleanExit ? '是' : '否（上次可能异常中断）'}`,
    `近期疑似崩溃次数：${state.crashCount}`,
    `最近启动时间：${state.lastStartAt ? new Date(state.lastStartAt).toLocaleString() : '无'}`,
    `最近心跳时间：${state.lastHeartbeatAt ? new Date(state.lastHeartbeatAt).toLocaleString() : '无'}`,
    `最近正常退出时间：${state.lastPagehideAt ? new Date(state.lastPagehideAt).toLocaleString() : '无'}`,
    `自动轻量模式：${state.degradeUntil > now ? `开启中（剩余约 ${safeModeLeftMin} 分钟）` : '关闭'}`,
    '',
    '[错误分组 TOP]',
    ...(errorTop.length > 0 ? errorTop : ['暂无错误事件']),
    '',
    '[崩溃关键窗口（仅错误）]',
    ...(crashWindow.before.length > 0 ? ['崩溃前（最多10条）', ...crashWindow.before] : ['崩溃前（最多10条）: 无']),
    ...(crashWindow.after.length > 0 ? ['崩溃后（最多5条）', ...crashWindow.after] : ['崩溃后（最多5条）: 无']),
    '',
    '[事件日志（新到旧）]',
    ...(state.events.length > 0 ? state.events.map(translateEvent) : ['暂无事件']),
    '',
    '[怎么看]',
    '1) 高频出现“脚本报错/未处理异步异常”时，优先排查对应插件或脚本。',
    '2) 若反复出现“疑似崩溃”，通常是页面卡死或系统回收导致。',
    '3) 自动轻量模式开启时会降低动画负载，用于减少再次崩溃概率。',
  ];
  return lines.join('\n');
}
