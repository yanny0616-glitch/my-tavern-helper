import { EVENT_DEDUPE_WINDOW_MS, MAX_EVENTS, STORAGE_KEY } from './constants';
import { CrashState } from './types';

export function nowMs(): number {
  return Date.now();
}

export function parseState(raw: string | null): CrashState {
  const fallback: CrashState = {
    cleanExit: true,
    crashCount: 0,
    lastHeartbeatAt: 0,
    lastStartAt: 0,
    lastPagehideAt: 0,
    degradeUntil: 0,
    events: [],
  };
  if (!raw) {
    return fallback;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<CrashState>;
    return {
      cleanExit: Boolean(parsed.cleanExit),
      crashCount: Number(parsed.crashCount) || 0,
      lastHeartbeatAt: Number(parsed.lastHeartbeatAt) || 0,
      lastStartAt: Number(parsed.lastStartAt) || 0,
      lastPagehideAt: Number(parsed.lastPagehideAt) || 0,
      degradeUntil: Number(parsed.degradeUntil) || 0,
      events: Array.isArray(parsed.events) ? parsed.events.slice(-MAX_EVENTS) : [],
    };
  } catch {
    return fallback;
  }
}

export function loadState(): CrashState {
  return parseState(localStorage.getItem(STORAGE_KEY));
}

export function saveState(state: CrashState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function formatLocalStamp(date: Date): string {
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  return (
    `${date.getFullYear()}-` +
    `${pad(date.getMonth() + 1)}-` +
    `${pad(date.getDate())}T` +
    `${pad(date.getHours())}:` +
    `${pad(date.getMinutes())}:` +
    `${pad(date.getSeconds())}.` +
    `${pad(date.getMilliseconds(), 3)}`
  );
}

export function pushEvent(state: CrashState, message: string): void {
  const normalized = message.replace(/\s+/g, ' ').trim();
  const signature = getEventSignature(normalized);
  const windowMs = getDedupeWindowMs(normalized, signature);
  const now = Date.now();
  const stamp = formatLocalStamp(new Date(now));
  for (let i = state.events.length - 1; i >= 0; i--) {
    const line = state.events[i];
    const spaceIdx = line.indexOf(' ');
    const lastStamp = spaceIdx > 0 ? line.slice(0, spaceIdx) : '';
    const lastMessage = spaceIdx > 0 ? line.slice(spaceIdx + 1).trim() : line.trim();
    const lastMs = Date.parse(lastStamp);
    if (!Number.isFinite(lastMs)) {
      continue;
    }
    if (now - lastMs > Math.max(windowMs, EVENT_DEDUPE_WINDOW_MS * 3)) {
      break;
    }
    if (now - lastMs < windowMs && getEventSignature(lastMessage) === signature) {
      return;
    }
  }
  state.events.push(`${stamp} ${normalized}`);
  if (state.events.length > MAX_EVENTS) {
    state.events = state.events.slice(-MAX_EVENTS);
  }
}

function getEventSignature(message: string): string {
  let normalized = message.replace(/\s+/g, ' ').trim();
  if (normalized.startsWith('error ') || normalized.startsWith('unhandledrejection ')) {
    normalized = normalized.replace(/\s*\[mem=[^\]]+\]\s*$/i, '');
    normalized = normalized.replace(/\s+stack=.*/i, '');
  }
  if (normalized.startsWith('interaction_recover_attempt')) {
    return 'interaction_recover_attempt';
  }
  if (normalized.startsWith('interaction_lock_suspected')) {
    return 'interaction_lock_suspected';
  }
  if (normalized.startsWith('interaction_recovered')) {
    return 'interaction_recovered';
  }
  if (normalized.startsWith('interaction_recover_failed')) {
    return 'interaction_recover_failed';
  }
  return normalized;
}

function getDedupeWindowMs(message: string, signature: string): number {
  if (signature === 'interaction_recover_attempt') {
    return 12000;
  }
  if (signature === 'interaction_lock_suspected') {
    return 12000;
  }
  if (signature === 'interaction_recovered' || signature === 'interaction_recover_failed') {
    return 8000;
  }
  if (message.startsWith('error ') || message.startsWith('unhandledrejection ')) {
    return 10000;
  }
  if (message.startsWith('visibility=')) {
    return 6000;
  }
  return EVENT_DEDUPE_WINDOW_MS;
}

export function safeStringify(value: unknown): string {
  try {
    if (typeof value === 'string') {
      return value;
    }
    if (value instanceof Error) {
      return value.stack || `${value.name}: ${value.message}`;
    }
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function formatErrorEventDetails(event: ErrorEvent): string {
  const message = event.message || 'unknown';
  const file = event.filename || 'unknown-file';
  const line = event.lineno || 0;
  const col = event.colno || 0;
  const fileNoQuery = file.split('#')[0]?.split('?')[0] || file;
  const shortFile = fileNoQuery.split('/').pop()?.split('\\').pop() || fileNoQuery;
  const shortLoc = `${shortFile}:${line}:${col}`;
  const fullLoc = `${file}:${line}:${col}`;
  const where = shortLoc === fullLoc ? shortLoc : `${shortLoc} (full: ${fullLoc})`;
  const stack =
    event.error instanceof Error
      ? (event.error.stack ?? `${event.error.name}: ${event.error.message}`)
      : '';
  const tail = stack ? ` stack=${stack.replace(/\s+/g, ' ').slice(0, 500)}` : '';
  return `${message} @ ${where}${tail}`;
}
