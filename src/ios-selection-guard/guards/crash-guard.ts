import { CRASH_WINDOW_MS, DEGRADE_FOR_MS, DEGRADE_THRESHOLD, HEARTBEAT_MS, START_GUARD_MS } from '../core/constants';
import { applySafeMode } from '../core/safe-mode';
import { formatErrorEventDetails, loadState, nowMs, pushEvent, safeStringify, saveState } from '../core/state';
import { Disposable } from '../core/types';

type CrashGuardOptions = {
  getEnableMemorySnapshot: () => boolean;
};

function collectMemorySnapshot(doc: Document): string {
  const nodeCount = doc.querySelectorAll('*').length;
  const perf = performance as Performance & {
    memory?: {
      usedJSHeapSize?: number;
      totalJSHeapSize?: number;
      jsHeapSizeLimit?: number;
    };
  };
  const mem = perf.memory;
  if (!mem) {
    return `mem=unavailable domNodes=${nodeCount}`;
  }
  const usedMB = mem.usedJSHeapSize ? Math.round(mem.usedJSHeapSize / 1024 / 1024) : 0;
  const totalMB = mem.totalJSHeapSize ? Math.round(mem.totalJSHeapSize / 1024 / 1024) : 0;
  const limitMB = mem.jsHeapSizeLimit ? Math.round(mem.jsHeapSizeLimit / 1024 / 1024) : 0;
  return `mem=${usedMB}/${totalMB}/${limitMB}MB domNodes=${nodeCount}`;
}

export function setupCrashGuard(doc: Document, options: CrashGuardOptions): Disposable {
  const state = loadState();
  const now = nowMs();
  const likelyCrash =
    !state.cleanExit &&
    state.lastHeartbeatAt > 0 &&
    now - state.lastHeartbeatAt < CRASH_WINDOW_MS &&
    now - state.lastStartAt > START_GUARD_MS;

  if (likelyCrash) {
    state.crashCount += 1;
    pushEvent(state, `likely_crash_detected count=${state.crashCount}`);
  } else if (now - state.lastStartAt > DEGRADE_FOR_MS) {
    state.crashCount = 0;
  }

  state.cleanExit = false;
  state.lastStartAt = now;
  state.lastHeartbeatAt = now;

  if (state.crashCount >= DEGRADE_THRESHOLD) {
    state.degradeUntil = Math.max(state.degradeUntil, now + DEGRADE_FOR_MS);
    pushEvent(state, `safe_mode_enabled until=${state.degradeUntil}`);
  }

  if (state.degradeUntil > now) {
    applySafeMode(doc);
  }

  saveState(state);

  const touchState = () => {
    const next = loadState();
    next.lastHeartbeatAt = nowMs();
    saveState(next);
  };

  const onVisibility = () => {
    const next = loadState();
    pushEvent(next, `visibility=${document.visibilityState}`);
    next.lastHeartbeatAt = nowMs();
    saveState(next);
  };

  const onError = (event: ErrorEvent) => {
    const next = loadState();
    const memoryTail = options.getEnableMemorySnapshot() ? ` [${collectMemorySnapshot(doc)}]` : '';
    pushEvent(next, `error ${formatErrorEventDetails(event)}${memoryTail}`);
    saveState(next);
  };

  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    const next = loadState();
    const reason = safeStringify(event.reason ?? 'unknown');
    const memoryTail = options.getEnableMemorySnapshot() ? ` [${collectMemorySnapshot(doc)}]` : '';
    pushEvent(next, `unhandledrejection ${reason}${memoryTail}`);
    saveState(next);
  };

  const markCleanExit = () => {
    const next = loadState();
    next.cleanExit = true;
    next.lastPagehideAt = nowMs();
    next.lastHeartbeatAt = next.lastPagehideAt;
    pushEvent(next, 'clean_exit');
    saveState(next);
  };

  const intervalId = window.setInterval(touchState, HEARTBEAT_MS);
  window.addEventListener('visibilitychange', onVisibility, true);
  window.addEventListener('error', onError, true);
  window.addEventListener('unhandledrejection', onUnhandledRejection, true);
  window.addEventListener('pagehide', markCleanExit, true);
  window.addEventListener('beforeunload', markCleanExit, true);

  return {
    dispose: () => {
      window.clearInterval(intervalId);
      window.removeEventListener('visibilitychange', onVisibility, true);
      window.removeEventListener('error', onError, true);
      window.removeEventListener('unhandledrejection', onUnhandledRejection, true);
      window.removeEventListener('pagehide', markCleanExit, true);
      window.removeEventListener('beforeunload', markCleanExit, true);
    },
  };
}
