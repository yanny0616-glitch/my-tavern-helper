/**
 * iOS 长按选中文字后触摸卡死修复
 *
 * 问题: iOS WebKit 中，双击/长按选中文字并拖拽后，
 * 页面触摸交互完全卡死——按钮有视觉反馈但不触发动作，
 * 页面切换也不生效，只能刷新。
 * 疑似 iOS 文本交互层 (text interaction overlay) 卡住，劫持了所有触摸事件。
 *
 * 修复: 检测卡死状态（短按点击时 touchend 触发但 click 没有跟随触发），
 * 然后强制清除 selection、blur 焦点、重新派发 click 来恢复交互。
 * 通过触摸时长和移动距离区分点击与拖拽，避免误判。
 */

const doc = window.parent?.document;

function isIOS(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// 判定为"点击"的阈值
const TAP_MAX_DURATION = 500; // 按住不超过 500ms
const TAP_MAX_DISTANCE = 15;  // 移动不超过 15px

$(() => {
  if (!doc || !isIOS()) {
    return;
  }

  let touchStartTime = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let pendingTouch: { target: EventTarget | null; x: number; y: number } | null = null;
  let clickFired = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  // 强制恢复交互
  const forceRecover = (target: EventTarget | null, x: number, y: number) => {
    // 1. 清除选区
    const sel = doc.getSelection();
    if (sel) {
      sel.removeAllRanges();
    }

    // 2. blur 当前焦点元素，解除焦点陷阱
    if (doc.activeElement && doc.activeElement !== doc.body) {
      (doc.activeElement as HTMLElement).blur?.();
    }

    // 3. 对目标重新派发 click，让本次点击生效
    if (target instanceof Element) {
      target.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
      }));
    }

    console.info('[ios-touch-fix] recovered from stuck state');
  };

  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) {
      return;
    }
    const touch = e.touches[0];
    touchStartTime = Date.now();
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (e.changedTouches.length !== 1) {
      return;
    }

    const touch = e.changedTouches[0];
    const duration = Date.now() - touchStartTime;
    const dx = Math.abs(touch.clientX - touchStartX);
    const dy = Math.abs(touch.clientY - touchStartY);

    // 不是点击（长按或拖拽），不处理
    if (duration > TAP_MAX_DURATION || dx > TAP_MAX_DISTANCE || dy > TAP_MAX_DISTANCE) {
      return;
    }

    pendingTouch = { target: e.target, x: touch.clientX, y: touch.clientY };
    clickFired = false;

    // 正常情况下 touchend 后 ~300ms 内会触发 click
    // 如果没触发，说明卡住了
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = null;
      if (!clickFired && pendingTouch) {
        forceRecover(pendingTouch.target, pendingTouch.x, pendingTouch.y);
      }
      pendingTouch = null;
    }, 400);
  };

  const onClick = () => {
    clickFired = true;
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    pendingTouch = null;
  };

  doc.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
  doc.addEventListener('touchend', onTouchEnd, { capture: true, passive: true });
  doc.addEventListener('click', onClick, true);
  console.info('[ios-touch-fix] enabled');

  $(window).on('pagehide', () => {
    if (timer !== null) {
      clearTimeout(timer);
    }
    doc.removeEventListener('touchstart', onTouchStart, true);
    doc.removeEventListener('touchend', onTouchEnd, true);
    doc.removeEventListener('click', onClick, true);
  });
});
