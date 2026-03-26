import { Disposable } from '../core/types';
import { loadState, pushEvent, saveState } from '../core/state';

function isEditable(el: Element | null): boolean {
  if (!el) {
    return false;
  }
  const tag = el.tagName.toLowerCase();
  if (el instanceof HTMLElement && el.isContentEditable) {
    return true;
  }
  return tag === 'textarea' || tag === 'input';
}

function getInputSelectionRange(el: Element | null): { start: number; end: number } | null {
  if (!el) {
    return null;
  }
  if (el instanceof HTMLTextAreaElement) {
    return { start: el.selectionStart ?? 0, end: el.selectionEnd ?? 0 };
  }
  if (el instanceof HTMLInputElement) {
    return { start: el.selectionStart ?? 0, end: el.selectionEnd ?? 0 };
  }
  return null;
}

function hasActiveInputSelection(doc: Document): boolean {
  const active = doc.activeElement;
  const range = getInputSelectionRange(active);
  return Boolean(range && range.start !== range.end);
}

function clearInputSelection(doc: Document): void {
  const active = doc.activeElement;
  const range = getInputSelectionRange(active);
  if (!range) {
    return;
  }
  if (active instanceof HTMLTextAreaElement || active instanceof HTMLInputElement) {
    const caret = range.end;
    active.setSelectionRange(caret, caret);
  }
}

function closestEditable(el: Element | null): Element | null {
  let current = el;
  while (current) {
    if (isEditable(current)) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

function hasActiveSelection(doc: Document): boolean {
  const selection = doc.getSelection();
  return !!selection && !selection.isCollapsed;
}

function clearSelection(doc: Document): void {
  const selection = doc.getSelection();
  if (selection && !selection.isCollapsed) {
    selection.removeAllRanges();
  }
}

function blurEditable(doc: Document): void {
  const active = doc.activeElement;
  if (active instanceof HTMLElement && isEditable(active)) {
    active.blur();
  }
}

export function setupSelectionGuard(doc: Document): Disposable {
  const RECOVER_WINDOW_MS = 3000;
  const RETRY_DELAYS = [0, 120, 320];
  let recoverWindowUntil = 0;
  let hasPendingRecovery = false;
  let recoverFailTimer = 0;
  const delayedTimers: number[] = [];

  const log = (message: string) => {
    const next = loadState();
    pushEvent(next, message);
    saveState(next);
  };

  const hasActiveTextSelection = () => {
    const sel = doc.getSelection();
    return Boolean(sel && !sel.isCollapsed);
  };

  const enterRecoverWindow = (reason: string) => {
    const now = Date.now();
    if (now < recoverWindowUntil) {
      return;
    }
    recoverWindowUntil = now + RECOVER_WINDOW_MS;
    log(`interaction_lock_suspected reason=${reason}`);
  };

  const forceRecover = () => {
    clearSelection(doc);
    clearInputSelection(doc);
    blurEditable(doc);
  };

  const scheduleRecoverSequence = () => {
    const now = Date.now();
    if (now > recoverWindowUntil) {
      return;
    }
    if (hasPendingRecovery) {
      return;
    }
    hasPendingRecovery = true;
    log('interaction_recover_attempt');
    for (const delay of RETRY_DELAYS) {
      const timerId = window.setTimeout(() => {
        forceRecover();
      }, delay);
      delayedTimers.push(timerId);
    }
    recoverFailTimer = window.setTimeout(() => {
      if (Date.now() <= recoverWindowUntil) {
        log('interaction_recover_failed');
      }
      hasPendingRecovery = false;
    }, 800);
  };

  const clearRecoverState = () => {
    hasPendingRecovery = false;
    recoverWindowUntil = 0;
    if (recoverFailTimer) {
      window.clearTimeout(recoverFailTimer);
      recoverFailTimer = 0;
    }
    while (delayedTimers.length) {
      const timer = delayedTimers.pop();
      if (timer) {
        window.clearTimeout(timer);
      }
    }
  };

  const onPointerDown = (event: Event) => {
    const target = event.target as Element | null;
    if (closestEditable(target)) {
      return;
    }
    if (Date.now() <= recoverWindowUntil) {
      scheduleRecoverSequence();
      return;
    }
    if (!hasActiveSelection(doc) && !hasActiveInputSelection(doc)) {
      return;
    }
    enterRecoverWindow('selection_active_on_pointerdown');
    scheduleRecoverSequence();
  };

  const onCopyLike = () => {
    enterRecoverWindow('copy_or_cut');
    scheduleRecoverSequence();
  };

  const onSelectionChange = () => {
    if (hasActiveTextSelection()) {
      enterRecoverWindow('selectionchange');
    }
  };

  const onSelectStart = () => {
    enterRecoverWindow('selectstart');
  };

  const onContextMenu = () => {
    enterRecoverWindow('contextmenu');
  };

  const onTouchEnd = () => {
    if (hasActiveTextSelection()) {
      enterRecoverWindow('touchend_with_selection');
    }
  };

  const onClick = (event: Event) => {
    if (Date.now() > recoverWindowUntil) {
      return;
    }
    const target = event.target as Element | null;
    if (closestEditable(target)) {
      return;
    }
    log('interaction_recovered');
    clearRecoverState();
  };

  doc.addEventListener('touchstart', onPointerDown, true);
  doc.addEventListener('mousedown', onPointerDown, true);
  doc.addEventListener('copy', onCopyLike, true);
  doc.addEventListener('cut', onCopyLike, true);
  doc.addEventListener('selectionchange', onSelectionChange, true);
  doc.addEventListener('selectstart', onSelectStart, true);
  doc.addEventListener('contextmenu', onContextMenu, true);
  doc.addEventListener('touchend', onTouchEnd, true);
  doc.addEventListener('click', onClick, true);

  return {
    dispose: () => {
      clearRecoverState();
      doc.removeEventListener('touchstart', onPointerDown, true);
      doc.removeEventListener('mousedown', onPointerDown, true);
      doc.removeEventListener('copy', onCopyLike, true);
      doc.removeEventListener('cut', onCopyLike, true);
      doc.removeEventListener('selectionchange', onSelectionChange, true);
      doc.removeEventListener('selectstart', onSelectStart, true);
      doc.removeEventListener('contextmenu', onContextMenu, true);
      doc.removeEventListener('touchend', onTouchEnd, true);
      doc.removeEventListener('click', onClick, true);
    },
  };
}
