import { reloadOnChatChange } from '@util/script';

const BUTTON_SETTINGS = 'Gemini 429自动重试设置';

const RetrySettingsSchema = z
  .object({
    enabled: z.boolean().prefault(true),
    maxRetries: z.coerce
      .number()
      .transform(value => _.clamp(Number.isFinite(value) ? Math.round(value) : 3, 1, 20))
      .prefault(3),
    retryDelayMs: z.coerce
      .number()
      .transform(value => _.clamp(Number.isFinite(value) ? Math.round(value) : 1500, 200, 30000))
      .prefault(1500),
    showToasts: z.boolean().prefault(true),
    swipeCompatEnabled: z.boolean().prefault(true),
    dbCompatEnabled: z.boolean().prefault(false),
    dbCompatMaxRetries: z.coerce
      .number()
      .transform(value => _.clamp(Number.isFinite(value) ? Math.round(value) : 2, 1, 10))
      .prefault(2),
  })
  .prefault({});

type RetrySettings = z.infer<typeof RetrySettingsSchema>;

const RATE_LIMIT_PATTERNS = [
  /\b429\b/i,
  /too\s+many\s+requests/i,
  /rate\s*limit/i,
  /resource[\s_-]*exhausted/i,
  /quota[\s_-]*exceeded/i,
  /请求过于频繁|请求频繁|速率限制|触发限流|资源耗尽|达到请求上限|429错误/i,
];

const DB_PLANNER_FAILURE_TOAST_PATTERNS = [
  /剧情规划失败/i,
  /规划失败/i,
  /注入失败/i,
  /数据库.*失败/i,
  /TavernDB.*失败/i,
];

const DB_PLANNER_INJECTION_MARKERS = [
  '以上是用户的本轮输入',
  '以下是正文写作指导',
  'Round 0 解析',
  '<thought>',
  '<content>',
];

const SWIPE_RIGHT_SELECTORS = [
  '.swipe_right',
  '.mes_swipe_right',
  '.swipe-right',
  '[data-action="swipe-right"]',
  '[aria-label*="下一条"]',
  '[aria-label*="下一个"]',
  '[title*="下一条"]',
  '[title*="Swipe right"]',
  '[title*="next swipe"]',
  '#swipe_right',
];

let settings: RetrySettings = loadSettings();
let pendingRetryTimer: ReturnType<typeof setTimeout> | null = null;
let pendingRetryMessageId: number | null = null;
let pendingRetryAttempt = 0;
let pendingRetryMode: RetryMode = 'regenerate';
let $settingsModal: JQuery | null = null;
let toastObserver: MutationObserver | null = null;
let lastSentUserMessageId: number | null = null;
let lastSentUserMessageText = '';
let lastSentAt = 0;
let dbCompatRetrying = false;
let lastPlannerFailureToastText = '';
let lastPlannerFailureToastAt = 0;
let swipeIntentListener: ((event: Event) => void) | null = null;
let lastSwipeIntentMessageId: number | null = null;
let lastSwipeIntentAt = 0;
let restoreNetwork429Hook: (() => void) | null = null;
let networkHookWatchTimer: ReturnType<typeof setInterval> | null = null;
let restoreFetchDescriptorHook: (() => void) | null = null;
let lastNetwork429At = 0;

const retryAttempts = new Map<number, number>();
const maxWarnedMessageIds = new Set<number>();
const retryModeByMessageId = new Map<number, RetryMode>();
const forceRetryByMessageId = new Map<number, RetryMode>();
const dbCompatAttemptsByMessage = new Map<string, number>();
const SWIPE_INTENT_WINDOW_MS = 15000;
const NETWORK_429_DEBOUNCE_MS = 900;
const NETWORK_HOOK_WATCH_INTERVAL_MS = 2000;
const NETWORK_HOOK_TAG = '__gemini429_retry_hook__';
const NETWORK_HOOK_BASE = '__gemini429_retry_base__';
const NETWORK_HOOK_FETCH_GETTER_TAG = '__gemini429_retry_fetch_getter__';

type RetryMode = 'swipe' | 'regenerate';

function loadSettings(): RetrySettings {
  try {
    return RetrySettingsSchema.parse(getVariables({ type: 'script', script_id: getScriptId() }));
  } catch (error) {
    console.warn('[Gemini429重试] 读取设置失败，使用默认值', error);
    return RetrySettingsSchema.parse({});
  }
}

function saveSettings() {
  replaceVariables(settings, { type: 'script', script_id: getScriptId() });
}

function updateButtons() {
  replaceScriptButtons([{ name: BUTTON_SETTINGS, visible: true }]);
}

function notifyInfo(message: string) {
  if (settings.showToasts) {
    toastr.info(message);
  }
}

function notifyWarn(message: string) {
  if (settings.showToasts) {
    toastr.warning(message);
  }
}

function parentWindow(): Window {
  return window.parent ?? window;
}

function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value ?? '');
  } catch {
    return '';
  }
}

function getCurrentSwipeText(message: Record<string, any>) {
  if (Array.isArray(message.swipes) && message.swipes.length > 0) {
    const swipeId = typeof message.swipe_id === 'number' ? message.swipe_id : message.swipes.length - 1;
    const currentSwipe = message.swipes[swipeId];
    if (typeof currentSwipe === 'string') {
      return currentSwipe;
    }
  }
  return typeof message.message === 'string' ? message.message : '';
}

function getCurrentSwipeInfo(message: Record<string, any>) {
  if (!Array.isArray(message.swipes_info) || message.swipes_info.length === 0) {
    return '';
  }
  const swipeId = typeof message.swipe_id === 'number' ? message.swipe_id : message.swipes_info.length - 1;
  const currentInfo = message.swipes_info[swipeId];
  return safeStringify(currentInfo);
}

function buildMessageDiagnosticText(message: Record<string, any>) {
  return [
    getCurrentSwipeText(message),
    safeStringify(message.extra),
    safeStringify(message.data),
    getCurrentSwipeInfo(message),
    safeStringify(message.swipe_info),
  ]
    .filter(text => typeof text === 'string' && text.trim().length > 0)
    .join('\n');
}

function isRateLimitFailure(text: string) {
  if (!text || !text.trim()) {
    return false;
  }
  return RATE_LIMIT_PATTERNS.some(pattern => pattern.test(text));
}

function isGenerateRequestUrl(url: string) {
  return /\/api\/backends\/chat-completions\/generate/i.test(url);
}

function markNetworkHook<T extends (...args: any[]) => any>(fn: T, base: (...args: any[]) => any): T {
  (fn as any)[NETWORK_HOOK_TAG] = true;
  (fn as any)[NETWORK_HOOK_BASE] = base;
  return fn;
}

function isMarkedNetworkHook(fn: unknown): fn is ((...args: any[]) => any) & Record<string, any> {
  return typeof fn === 'function' && Boolean((fn as any)[NETWORK_HOOK_TAG]);
}

function getMarkedNetworkHookBase(fn: unknown) {
  if (!isMarkedNetworkHook(fn)) {
    return null;
  }
  const base = (fn as any)[NETWORK_HOOK_BASE];
  return typeof base === 'function' ? base : null;
}

function createFetchNetworkHook(
  p: Window,
  baseFetch: (...args: any[]) => Promise<Response>,
): (...args: any[]) => Promise<Response> {
  return markNetworkHook(
    async (...args: any[]) => {
      const input = args[0];
      const url = typeof input === 'string' ? input : (input?.url ?? '');
      const response = await baseFetch.apply(p, args);
      try {
        if (response?.status === 429 && isGenerateRequestUrl(url)) {
          handleNetwork429('fetch', url);
        }
      } catch {
        // ignore
      }
      return response;
    },
    baseFetch as (...args: any[]) => any,
  ) as (...args: any[]) => Promise<Response>;
}

function handleNetwork429(source: 'fetch' | 'xhr', url: string) {
  if (!settings.enabled) {
    return;
  }

  if (!isGenerateRequestUrl(url)) {
    return;
  }

  const now = Date.now();
  if (now - lastNetwork429At < NETWORK_429_DEBOUNCE_MS) {
    return;
  }
  lastNetwork429At = now;

  const canUseSwipeIntent =
    settings.swipeCompatEnabled &&
    typeof lastSwipeIntentMessageId === 'number' &&
    now - lastSwipeIntentAt <= SWIPE_INTENT_WINDOW_MS;

  let targetMessageId: number | null = null;
  let mode: RetryMode = 'regenerate';
  if (canUseSwipeIntent) {
    targetMessageId = lastSwipeIntentMessageId as number;
    mode = 'swipe';
  } else {
    const target = getLastAssistantMessage();
    if (target && typeof target.message_id === 'number') {
      targetMessageId = target.message_id;
      mode = getRetryMode(targetMessageId, `network429:${source}`);
      if (mode !== 'swipe' && canSwipeRetryForMessage(targetMessageId)) {
        mode = 'swipe';
      }
    }
  }

  if (typeof targetMessageId !== 'number') {
    return;
  }

  const attempts = retryAttempts.get(targetMessageId) ?? 0;
  if (attempts >= settings.maxRetries) {
    if (!maxWarnedMessageIds.has(targetMessageId)) {
      maxWarnedMessageIds.add(targetMessageId);
      notifyWarn(`Gemini 429 自动重试已达到上限 (${settings.maxRetries})`);
    }
    return;
  }

  retryModeByMessageId.set(targetMessageId, mode);
  forceRetryByMessageId.set(targetMessageId, mode);
  scheduleRetry(targetMessageId, attempts + 1, `network429:${source}`, mode);
}

function isDbPlannerFailureToast(text: string) {
  if (!text || !text.trim()) {
    return false;
  }
  return DB_PLANNER_FAILURE_TOAST_PATTERNS.some(pattern => pattern.test(text));
}

function hasDbPlannerInjection(text: string) {
  if (!text || !text.trim()) {
    return false;
  }
  return DB_PLANNER_INJECTION_MARKERS.some(marker => text.includes(marker));
}

function getLastUserMessage(): Record<string, any> | null {
  const messages = getChatMessages('0-{{lastMessageId}}', { role: 'user', include_swipes: false }) as Array<
    Record<string, any>
  >;
  if (!messages.length) {
    return null;
  }
  return messages[messages.length - 1] ?? null;
}

function getUserMessageForDbRetry() {
  if (typeof lastSentUserMessageId === 'number') {
    const message = getMessageById(lastSentUserMessageId);
    if (message && message.role === 'user') {
      return message;
    }
  }
  const fallback = getLastUserMessage();
  return fallback && fallback.role === 'user' ? fallback : null;
}

function buildDbRetryKey(messageText: string) {
  return messageText.trim().slice(0, 400);
}

function resendViaSendInput(rawText: string) {
  const p = parentWindow() as Window & { $?: JQueryStatic; SillyTavern?: { activateSendButtons?: () => void } };
  const doc = p.document;
  const $ = p.$;
  if (typeof $ === 'function') {
    const $input = $(
      '#send_textarea, #sendTextArea, #send-textarea, textarea#send_textarea, textarea#sendTextArea, textarea#send-textarea, textarea[name="send_textarea"]',
    ).first();
    const $send = $('#send_but, #send_button, #send, .send_button').first();
    if (!$input.length || !$send.length) {
      return false;
    }
    $input.val(rawText);
    $input.trigger('input');
    $input.trigger('change');
    p.SillyTavern?.activateSendButtons?.();
    $send.trigger('mousedown');
    $send.trigger('mouseup');
    $send.trigger('click');
    return true;
  }

  const input = doc.querySelector(
    '#send_textarea, #sendTextArea, #send-textarea, textarea#send_textarea, textarea#sendTextArea, textarea#send-textarea, textarea[name="send_textarea"]',
  ) as HTMLTextAreaElement | HTMLInputElement | null;
  const send = doc.querySelector('#send_but, #send_button, #send, .send_button') as HTMLElement | null;
  if (!input || !send) {
    return false;
  }
  input.value = rawText;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  send.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
  send.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
  send.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  send.click();
  return true;
}

async function retryDbPlannerInjection(messageId: number, rawText: string, attempt: number) {
  if (dbCompatRetrying) {
    return;
  }
  dbCompatRetrying = true;
  try {
    try {
      const p = parentWindow() as Window & { SillyTavern?: { stopGeneration?: () => boolean } };
      p.SillyTavern?.stopGeneration?.();
    } catch (error) {
      console.warn('[Gemini429重试] 停止当前生成失败，继续执行数据库兼容重试', error);
    }

    await new Promise<void>(resolve => setTimeout(resolve, 150));

    const target = getMessageById(messageId);
    if (!target || target.role !== 'user') {
      notifyWarn('数据库兼容重试已取消：未定位到出错用户楼层。');
      return;
    }
    // 只删除出错的用户楼层，绝不删除 AI 楼层。
    await deleteChatMessages([messageId], { refresh: 'all' });

    await new Promise<void>(resolve => setTimeout(resolve, 120));
    const resent = resendViaSendInput(rawText);
    if (resent) {
      notifyInfo(`数据库注入失败，已自动重试 ${attempt}/${settings.dbCompatMaxRetries}`);
    } else {
      notifyWarn('数据库兼容重试失败：未找到输入框或发送按钮。');
    }
  } catch (error) {
    console.warn('[Gemini429重试] 数据库注入兼容重试执行失败', error);
    notifyWarn('数据库兼容重试执行失败，请手动重发。');
  } finally {
    dbCompatRetrying = false;
  }
}

function handleDbPlannerFailureToast(toastText: string) {
  if (!settings.dbCompatEnabled || dbCompatRetrying) {
    return;
  }

  const now = Date.now();
  if (toastText === lastPlannerFailureToastText && now - lastPlannerFailureToastAt < 1500) {
    return;
  }
  lastPlannerFailureToastText = toastText;
  lastPlannerFailureToastAt = now;

  const candidate = getUserMessageForDbRetry();
  if (!candidate || typeof candidate.message_id !== 'number') {
    return;
  }
  const rawText = String(candidate.message || '');
  if (!rawText.trim()) {
    return;
  }
  if (hasDbPlannerInjection(rawText)) {
    return;
  }

  if (lastSentAt && now - lastSentAt > 30000) {
    return;
  }

  const key = buildDbRetryKey(rawText);
  const attempts = dbCompatAttemptsByMessage.get(key) ?? 0;
  if (attempts >= settings.dbCompatMaxRetries) {
    notifyWarn(`数据库注入自动重试已达到上限 (${settings.dbCompatMaxRetries})`);
    return;
  }
  dbCompatAttemptsByMessage.set(key, attempts + 1);
  if (dbCompatAttemptsByMessage.size > 80) {
    dbCompatAttemptsByMessage.clear();
  }
  void retryDbPlannerInjection(candidate.message_id, rawText, attempts + 1);
}

function startToastObserver() {
  if (toastObserver || !settings.dbCompatEnabled) {
    return;
  }

  const doc = parentWindow().document;
  const target = doc.querySelector('#toast-container') ?? doc.body;
  if (!target) {
    return;
  }

  const readText = (node: Node) => {
    if (!(node instanceof HTMLElement)) {
      return '';
    }
    const text = node.textContent?.trim() ?? '';
    if (text) {
      return text;
    }
    const child = node.querySelector('.toast-message');
    return child?.textContent?.trim() ?? '';
  };

  toastObserver = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of Array.from(mutation.addedNodes)) {
        const text = readText(node);
        if (isDbPlannerFailureToast(text)) {
          handleDbPlannerFailureToast(text);
        }
      }
    }
  });
  toastObserver.observe(target, { childList: true, subtree: true });
}

function stopToastObserver() {
  if (!toastObserver) {
    return;
  }
  toastObserver.disconnect();
  toastObserver = null;
}

function getMessageById(messageId: number): Record<string, any> | null {
  const message = getChatMessages(messageId, { role: 'all', include_swipes: true })?.[0] as Record<string, any>;
  return message ?? null;
}

function getMessageElementById(messageId: number) {
  const selector = `#chat .mes[mesid="${messageId}"], #chat .mes[mesid='${messageId}'], .mes[mesid="${messageId}"], .mes[mesid='${messageId}']`;
  const message = parentWindow().document.querySelector(selector);
  return message instanceof HTMLElement ? message : null;
}

function getLastAssistantMessage(): Record<string, any> | null {
  const messages = getChatMessages('0-{{lastMessageId}}', { role: 'assistant', include_swipes: true }) as Array<
    Record<string, any>
  >;
  if (!Array.isArray(messages) || messages.length === 0) {
    return null;
  }
  return messages[messages.length - 1] ?? null;
}

function clearPendingRetry() {
  if (pendingRetryTimer) {
    clearTimeout(pendingRetryTimer);
  }
  pendingRetryTimer = null;
  pendingRetryMessageId = null;
  pendingRetryAttempt = 0;
  pendingRetryMode = 'regenerate';
}

function scheduleRetry(messageId: number, attempt: number, reason: string, mode: RetryMode) {
  if (
    pendingRetryTimer &&
    pendingRetryMessageId === messageId &&
    pendingRetryAttempt === attempt &&
    pendingRetryMode === mode
  ) {
    return;
  }

  clearPendingRetry();
  pendingRetryMessageId = messageId;
  pendingRetryAttempt = attempt;
  pendingRetryMode = mode;

  pendingRetryTimer = setTimeout(() => {
    void runRetry(messageId, attempt, reason, mode);
  }, settings.retryDelayMs);
}

function isGeneratingNow() {
  try {
    return typeof builtin?.duringGenerating === 'function' && builtin.duringGenerating() === true;
  } catch {
    return false;
  }
}

function isElementUsable(element: HTMLElement) {
  if (element.hasAttribute('disabled')) {
    return false;
  }
  const style = parentWindow().getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden' && style.pointerEvents !== 'none';
}

function triggerClick(element: HTMLElement) {
  try {
    const w = parentWindow() as Window & { $?: (target: HTMLElement) => JQuery<HTMLElement> };
    if (typeof w.$ === 'function') {
      const $element = w.$(element);
      $element.trigger('pointerdown');
      $element.trigger('mousedown');
      $element.trigger('mouseup');
      $element.trigger('click');
      return true;
    }
  } catch (error) {
    console.warn('[Gemini429重试] jQuery 点击失败，回退到原生事件', error);
  }

  element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
  element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  element.click();
  return true;
}

function findSwipeRightButton(root: ParentNode): HTMLElement | null {
  for (const selector of SWIPE_RIGHT_SELECTORS) {
    const buttons = Array.from(root.querySelectorAll(selector)).filter(
      (element): element is HTMLElement => element instanceof HTMLElement,
    );

    for (let i = buttons.length - 1; i >= 0; i--) {
      if (isElementUsable(buttons[i])) {
        return buttons[i];
      }
    }
  }
  return null;
}

function canSwipeRetryForMessage(messageId: number) {
  if (!settings.swipeCompatEnabled) {
    return false;
  }
  const messageElement = getMessageElementById(messageId);
  if (!messageElement) {
    return false;
  }
  return Boolean(findSwipeRightButton(messageElement));
}

function matchesSwipeRightSelector(element: Element) {
  return SWIPE_RIGHT_SELECTORS.some(selector => {
    try {
      return element.matches(selector);
    } catch {
      return false;
    }
  });
}

function recordSwipeIntent(messageId: number) {
  // 手动右滑视为“全新一轮”，清空历史计数，避免把上一次动作的次数累计到这一次。
  clearPendingRetry();
  retryAttempts.clear();
  maxWarnedMessageIds.clear();
  forceRetryByMessageId.clear();
  retryModeByMessageId.set(messageId, 'swipe');
  lastSwipeIntentMessageId = messageId;
  lastSwipeIntentAt = Date.now();
}

function captureSwipeIntentFromElement(element: Element) {
  const messageElement = element.closest('.mes[mesid]');
  if (messageElement instanceof HTMLElement) {
    const messageId = Number(messageElement.getAttribute('mesid'));
    if (Number.isFinite(messageId)) {
      recordSwipeIntent(messageId);
      return;
    }
  }

  // 某些主题/插件的右箭头不在 `.mes[mesid]` 内，兜底用当前最后一条 AI 楼层作为右滑意图目标。
  const fallback = getLastAssistantMessage();
  if (fallback && typeof fallback.message_id === 'number') {
    recordSwipeIntent(fallback.message_id);
  }
}

function startSwipeIntentListener() {
  if (swipeIntentListener || !settings.swipeCompatEnabled) {
    return;
  }

  const doc = parentWindow().document;
  swipeIntentListener = event => {
    // 只把真实用户点击视为“手动右滑意图”，脚本触发的点击不参与重置计数。
    if (!event.isTrusted) {
      return;
    }
    const path = (
      typeof (event as Event & { composedPath?: () => EventTarget[] }).composedPath === 'function'
        ? (event as Event & { composedPath: () => EventTarget[] }).composedPath()
        : []
    ) as EventTarget[];

    for (const target of path) {
      if (!(target instanceof Element)) {
        continue;
      }
      if (!matchesSwipeRightSelector(target)) {
        continue;
      }
      captureSwipeIntentFromElement(target);
      return;
    }

    if (!(event.target instanceof Element)) {
      return;
    }
    const nearest = event.target.closest(SWIPE_RIGHT_SELECTORS.join(', '));
    if (nearest instanceof Element) {
      captureSwipeIntentFromElement(nearest);
    }
  };
  doc.addEventListener('pointerdown', swipeIntentListener, true);
  doc.addEventListener('mousedown', swipeIntentListener, true);
  doc.addEventListener('click', swipeIntentListener, true);
}

function stopSwipeIntentListener() {
  if (!swipeIntentListener) {
    return;
  }
  const doc = parentWindow().document;
  doc.removeEventListener('pointerdown', swipeIntentListener, true);
  doc.removeEventListener('mousedown', swipeIntentListener, true);
  doc.removeEventListener('click', swipeIntentListener, true);
  swipeIntentListener = null;
}

function ensureNetwork429HookInstalled() {
  const p = parentWindow() as Window & { fetch?: (...args: any[]) => Promise<Response>; XMLHttpRequest?: any };
  const URL_KEY = '__gemini429_retry_url__';

  const fetchDesc = Object.getOwnPropertyDescriptor(p, 'fetch');
  const canProxyFetchByDescriptor =
    Boolean(fetchDesc) && fetchDesc!.configurable === true && typeof fetchDesc!.get === 'function';

  if (canProxyFetchByDescriptor) {
    const getter = fetchDesc!.get as (() => unknown) & Record<string, any>;
    if (!getter[NETWORK_HOOK_FETCH_GETTER_TAG]) {
      const originalDesc = fetchDesc!;
      const cache = new WeakMap<(...args: any[]) => Promise<Response>, (...args: any[]) => Promise<Response>>();

      const hookedGetter = function (this: Window) {
        const raw = originalDesc.get?.call(this);
        if (typeof raw !== 'function') {
          return raw;
        }
        const rawFetch = raw as (...args: any[]) => Promise<Response>;
        const cached = cache.get(rawFetch);
        if (cached) {
          return cached;
        }
        const wrapped = createFetchNetworkHook(p, rawFetch);
        cache.set(rawFetch, wrapped);
        return wrapped;
      };
      (hookedGetter as any)[NETWORK_HOOK_FETCH_GETTER_TAG] = true;

      Object.defineProperty(p, 'fetch', {
        configurable: true,
        enumerable: originalDesc.enumerable ?? true,
        get: hookedGetter,
        set: function (this: Window, value: any) {
          if (typeof originalDesc.set === 'function') {
            originalDesc.set.call(this, value);
          }
        },
      });

      restoreFetchDescriptorHook = () => {
        try {
          Object.defineProperty(p, 'fetch', originalDesc);
        } catch {
          // ignore
        }
        restoreFetchDescriptorHook = null;
      };
    }
  } else if (typeof p.fetch === 'function' && !isMarkedNetworkHook(p.fetch)) {
    p.fetch = createFetchNetworkHook(p, p.fetch) as typeof p.fetch;
  }

  const xhrProto = p.XMLHttpRequest?.prototype;
  if (!xhrProto) {
    return;
  }

  const currentOpen = xhrProto.open;
  if (typeof currentOpen === 'function' && !isMarkedNetworkHook(currentOpen)) {
    const previousOpen = currentOpen;
    const wrappedOpen = markNetworkHook(
      function (this: XMLHttpRequest, method: string, url: string, ...rest: any[]) {
        try {
          (this as any)[URL_KEY] = String(url ?? '');
        } catch {
          // ignore
        }
        return previousOpen.call(this, method, url, ...rest);
      },
      previousOpen as (...args: any[]) => any,
    );
    xhrProto.open = wrappedOpen;
  }

  const currentSend = xhrProto.send;
  if (typeof currentSend === 'function' && !isMarkedNetworkHook(currentSend)) {
    const previousSend = currentSend;
    const wrappedSend = markNetworkHook(
      function (this: XMLHttpRequest, ...args: any[]) {
        try {
          this.addEventListener(
            'loadend',
            () => {
              try {
                const url = String((this as any)[URL_KEY] ?? '');
                if (Number(this.status) === 429 && isGenerateRequestUrl(url)) {
                  handleNetwork429('xhr', url);
                }
              } catch {
                // ignore
              }
            },
            { once: true },
          );
        } catch {
          // ignore
        }
        return previousSend.apply(this, args);
      },
      previousSend as (...args: any[]) => any,
    );
    xhrProto.send = wrappedSend;
  }
}

function startNetwork429Hook() {
  ensureNetwork429HookInstalled();

  if (restoreNetwork429Hook) {
    return;
  }

  networkHookWatchTimer = setInterval(() => {
    try {
      ensureNetwork429HookInstalled();
    } catch {
      // ignore
    }
  }, NETWORK_HOOK_WATCH_INTERVAL_MS);

  restoreNetwork429Hook = () => {
    if (networkHookWatchTimer) {
      clearInterval(networkHookWatchTimer);
      networkHookWatchTimer = null;
    }

    const p = parentWindow() as Window & { fetch?: (...args: any[]) => Promise<Response>; XMLHttpRequest?: any };

    if (restoreFetchDescriptorHook) {
      restoreFetchDescriptorHook();
    } else if (isMarkedNetworkHook(p.fetch)) {
      const base = getMarkedNetworkHookBase(p.fetch);
      if (base) {
        p.fetch = base as typeof p.fetch;
      }
    }

    const xhrProto = p.XMLHttpRequest?.prototype;
    if (xhrProto) {
      if (isMarkedNetworkHook(xhrProto.open)) {
        const openBase = getMarkedNetworkHookBase(xhrProto.open);
        if (openBase) {
          xhrProto.open = openBase;
        }
      }
      if (isMarkedNetworkHook(xhrProto.send)) {
        const sendBase = getMarkedNetworkHookBase(xhrProto.send);
        if (sendBase) {
          xhrProto.send = sendBase;
        }
      }
    }

    restoreNetwork429Hook = null;
  };
}

function stopNetwork429Hook() {
  restoreNetwork429Hook?.();
}

function triggerSwipeRightForMessage(messageId: number) {
  const message = getMessageElementById(messageId);
  if (!message) {
    return false;
  }

  const button = findSwipeRightButton(message);
  if (!button) {
    return false;
  }
  return triggerClick(button);
}

async function triggerSwipeRightViaContext(messageId: number) {
  try {
    const p = parentWindow() as Window & { SillyTavern?: { getContext?: () => any } };
    const st = (p.SillyTavern ?? (typeof SillyTavern !== 'undefined' ? SillyTavern : null)) as any;
    const context = st?.getContext?.() ?? st;
    const swipeRight = context?.swipe?.right;
    if (typeof swipeRight !== 'function') {
      return false;
    }

    const messageElement = getMessageElementById(messageId);
    await swipeRight(null, {
      source: 'gemini429-auto-retry',
      repeated: false,
      message: messageElement ?? undefined,
    });
    return true;
  } catch (error) {
    console.warn('[Gemini429重试] 无法调用 SillyTavern.getContext().swipe.right', error);
    return false;
  }
}

async function triggerSillyTavernRegenerateGenerate() {
  const w = parentWindow() as Window & {
    SillyTavern?: { generate?: (type: string) => unknown; getContext?: () => any };
    TavernHelper?: { generate?: (config: Record<string, any>) => Promise<unknown> | unknown };
  };
  const st = (w.SillyTavern ?? (typeof SillyTavern !== 'undefined' ? SillyTavern : null)) as any;
  const context = st?.getContext?.() ?? st;

  try {
    if (typeof context?.generate === 'function') {
      await Promise.resolve(context.generate('regenerate'));
      return true;
    }
  } catch (error) {
    console.warn('[Gemini429重试] 无法调用 SillyTavern.getContext().generate("regenerate")', error);
  }

  try {
    if (typeof st?.generate === 'function') {
      await Promise.resolve(st.generate('regenerate'));
      return true;
    }
  } catch (error) {
    console.warn('[Gemini429重试] 无法调用 SillyTavern.generate("regenerate")', error);
  }

  try {
    const helper = (w.TavernHelper ?? (typeof TavernHelper !== 'undefined' ? TavernHelper : null)) as {
      generate?: (config: Record<string, any>) => Promise<unknown> | unknown;
    } | null;
    if (helper && typeof helper.generate === 'function') {
      await Promise.resolve(
        helper.generate({
          generation_id: `gemini429-regenerate-${Date.now()}`,
          user_input: '',
          should_silence: false,
        }),
      );
      return true;
    }
  } catch (error) {
    console.warn('[Gemini429重试] 无法调用 TavernHelper.generate 作为重新生成兜底', error);
  }

  return false;
}

async function ensureCurrentIsLastSwipe(message: Record<string, any>) {
  if (!Array.isArray(message.swipes) || message.swipes.length === 0) {
    return;
  }

  const messageId = message.message_id;
  if (typeof messageId !== 'number') {
    return;
  }

  const currentSwipeId = typeof message.swipe_id === 'number' ? message.swipe_id : 0;
  const lastSwipeId = message.swipes.length - 1;
  if (currentSwipeId >= lastSwipeId) {
    return;
  }

  try {
    await setChatMessages([{ message_id: messageId, swipe_id: lastSwipeId }], { refresh: 'affected' });
    await new Promise<void>(resolve => setTimeout(resolve, 80));
  } catch (error) {
    console.warn('[Gemini429重试] 切换到最后一页 swipe 失败，继续尝试直接右滑', error);
  }
}

async function runRetry(messageId: number, attempt: number, reason: string, mode: RetryMode) {
  clearPendingRetry();

  if (!settings.enabled) {
    return;
  }

  const message = getMessageById(messageId);
  if (!message || message.role !== 'assistant') {
    forceRetryByMessageId.delete(messageId);
    return;
  }

  const forcedByNetwork = forceRetryByMessageId.has(messageId);
  if (forcedByNetwork) {
    forceRetryByMessageId.delete(messageId);
  }

  if (!forcedByNetwork && !isRateLimitFailure(buildMessageDiagnosticText(message))) {
    retryAttempts.delete(messageId);
    maxWarnedMessageIds.delete(messageId);
    return;
  }

  if (isGeneratingNow()) {
    scheduleRetry(messageId, attempt, `${reason}:busy`, mode);
    return;
  }

  retryAttempts.set(messageId, attempt);
  let actualMode: RetryMode = mode;
  let retried = false;
  if (mode === 'swipe') {
    await ensureCurrentIsLastSwipe(message);
    retried = triggerSwipeRightForMessage(messageId);
    if (!retried) {
      retried = await triggerSwipeRightViaContext(messageId);
    }
  } else {
    retried = await triggerSillyTavernRegenerateGenerate();
    if (!retried && canSwipeRetryForMessage(messageId)) {
      actualMode = 'swipe';
      await ensureCurrentIsLastSwipe(message);
      retried = triggerSwipeRightForMessage(messageId);
      if (!retried) {
        retried = await triggerSwipeRightViaContext(messageId);
      }
    }
  }

  if (retried) {
    const modeText = actualMode === 'swipe' ? '右箭头' : '重新生成';
    notifyInfo(`Gemini 429 自动重试 ${attempt}/${settings.maxRetries}（${modeText}）`);
  } else if (actualMode === 'swipe') {
    notifyWarn('自动重试失败：未找到右箭头，请手动点一次右箭头。');
  } else {
    notifyWarn('自动重试失败：无法触发重新生成，请手动点一次重生。');
  }
}

function normalizeRetryMode(type: string): RetryMode {
  if (!settings.swipeCompatEnabled) {
    return 'regenerate';
  }
  return type === 'swipe' ? 'swipe' : 'regenerate';
}

function getRetryMode(messageId: number, source: string): RetryMode {
  if (!settings.swipeCompatEnabled) {
    return 'regenerate';
  }
  if (retryModeByMessageId.has(messageId)) {
    return retryModeByMessageId.get(messageId)!;
  }
  if (lastSwipeIntentMessageId === messageId && Date.now() - lastSwipeIntentAt <= SWIPE_INTENT_WINDOW_MS) {
    return 'swipe';
  }
  if (source.includes('swipe')) {
    return 'swipe';
  }
  if (source.includes('network429') && canSwipeRetryForMessage(messageId)) {
    return 'swipe';
  }
  return 'regenerate';
}

function inspectAndRetry(messageId?: number, source = 'unknown') {
  if (!settings.enabled) {
    return;
  }

  const target = typeof messageId === 'number' ? getMessageById(messageId) : getLastAssistantMessage();
  if (!target || target.role !== 'assistant' || typeof target.message_id !== 'number') {
    return;
  }

  const targetMessageId = target.message_id;
  const mode = getRetryMode(targetMessageId, source);
  const failed = isRateLimitFailure(buildMessageDiagnosticText(target));
  if (!failed) {
    retryAttempts.delete(targetMessageId);
    maxWarnedMessageIds.delete(targetMessageId);
    return;
  }

  const attempts = retryAttempts.get(targetMessageId) ?? 0;
  if (attempts >= settings.maxRetries) {
    if (!maxWarnedMessageIds.has(targetMessageId)) {
      maxWarnedMessageIds.add(targetMessageId);
      notifyWarn(`Gemini 429 自动重试已达到上限 (${settings.maxRetries})`);
    }
    return;
  }

  scheduleRetry(targetMessageId, attempts + 1, source, mode);
}

function queueInspect(messageId?: number, source = 'unknown') {
  setTimeout(() => {
    inspectAndRetry(messageId, source);
  }, 120);
}

function closeSettingsModal() {
  $settingsModal?.remove();
  $settingsModal = null;
}

function renderSettingsModal() {
  return `
    <div data-role="overlay" style="position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 2147483647; display: flex; align-items: center; justify-content: center; padding: 16px; overflow: auto;">
      <div style="width: min(420px, 94vw); background: #fff; color: #111; border-radius: 12px; box-shadow: 0 12px 30px rgba(0,0,0,0.24); padding: 16px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <div style="font-size: 16px; font-weight: 600;">Gemini 429 自动重试</div>
          <button data-action="close" style="border: 0; background: transparent; cursor: pointer; font-size: 18px;">×</button>
        </div>

        <div style="display: grid; gap: 10px; font-size: 14px;">
          <label style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" data-role="enabled" ${settings.enabled ? 'checked' : ''} />
            <span>启用自动重试（仅检测 429/限流错误）</span>
          </label>

          <label style="display: grid; gap: 6px;">
            <span>最大重试次数</span>
            <input type="number" min="1" max="20" step="1" data-role="maxRetries" value="${settings.maxRetries}" style="padding: 6px 8px; border: 1px solid #ccc; border-radius: 6px;" />
          </label>

          <label style="display: grid; gap: 6px;">
            <span>重试间隔（毫秒）</span>
            <input type="number" min="200" max="30000" step="100" data-role="retryDelayMs" value="${settings.retryDelayMs}" style="padding: 6px 8px; border: 1px solid #ccc; border-radius: 6px;" />
          </label>

          <label style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" data-role="showToasts" ${settings.showToasts ? 'checked' : ''} />
            <span>显示重试提示</span>
          </label>

          <label style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" data-role="swipeCompatEnabled" ${settings.swipeCompatEnabled ? 'checked' : ''} />
            <span>启用右箭头重roll兼容（仅在原楼层重试）</span>
          </label>

          <hr style="border: 0; border-top: 1px solid #eee; margin: 4px 0;" />

          <label style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" data-role="dbCompatEnabled" ${settings.dbCompatEnabled ? 'checked' : ''} />
            <span>启用数据库注入失败兼容重试</span>
          </label>

          <label style="display: grid; gap: 6px;">
            <span>数据库兼容重试次数</span>
            <input type="number" min="1" max="10" step="1" data-role="dbCompatMaxRetries" value="${settings.dbCompatMaxRetries}" style="padding: 6px 8px; border: 1px solid #ccc; border-radius: 6px;" />
          </label>

          <div style="display: flex; gap: 8px; margin-top: 4px;">
            <button data-action="save" style="padding: 6px 10px; border: 1px solid #ccc; border-radius: 6px; background: #f7f7f7; cursor: pointer;">保存</button>
            <button data-action="check-now" style="padding: 6px 10px; border: 1px solid #ccc; border-radius: 6px; background: #f7f7f7; cursor: pointer;">立即检查一次</button>
          </div>

          <div data-role="status" style="font-size: 12px; color: #666; line-height: 1.5;">
            当前状态：${settings.enabled ? '已启用' : '未启用'}，最多重试 ${settings.maxRetries} 次，每次间隔 ${settings.retryDelayMs} ms。
          </div>
        </div>
      </div>
    </div>
  `;
}

function openSettingsModal() {
  closeSettingsModal();

  const doc = parentWindow().document;
  const wrapper = doc.createElement('div');
  wrapper.setAttribute('script_id', getScriptId());
  wrapper.innerHTML = renderSettingsModal();

  $settingsModal = $(wrapper);
  $settingsModal.appendTo(doc.body);

  $settingsModal.find('[data-action="close"]').on('click', closeSettingsModal);
  $settingsModal.find('[data-role="overlay"]').on('click', event => {
    if (event.target === event.currentTarget) {
      closeSettingsModal();
    }
  });

  $settingsModal.find('[data-action="save"]').on('click', () => {
    const enabled = $settingsModal?.find('[data-role="enabled"]').prop('checked') === true;
    const maxRetries = Number($settingsModal?.find('[data-role="maxRetries"]').val());
    const retryDelayMs = Number($settingsModal?.find('[data-role="retryDelayMs"]').val());
    const showToasts = $settingsModal?.find('[data-role="showToasts"]').prop('checked') === true;
    const swipeCompatEnabled = $settingsModal?.find('[data-role="swipeCompatEnabled"]').prop('checked') === true;
    const dbCompatEnabled = $settingsModal?.find('[data-role="dbCompatEnabled"]').prop('checked') === true;
    const dbCompatMaxRetries = Number($settingsModal?.find('[data-role="dbCompatMaxRetries"]').val());

    settings = RetrySettingsSchema.parse({
      enabled,
      maxRetries,
      retryDelayMs,
      showToasts,
      swipeCompatEnabled,
      dbCompatEnabled,
      dbCompatMaxRetries,
    });
    saveSettings();
    if (settings.swipeCompatEnabled) {
      startSwipeIntentListener();
    } else {
      stopSwipeIntentListener();
    }
    if (settings.dbCompatEnabled) {
      startToastObserver();
    } else {
      stopToastObserver();
    }

    notifyInfo('Gemini 429 自动重试设置已保存');
    closeSettingsModal();
  });

  $settingsModal.find('[data-action="check-now"]').on('click', () => {
    inspectAndRetry(undefined, 'manual-check');
    $settingsModal?.find('[data-role="status"]').text('已触发检查：若最后一条 AI 回复是 429/限流错误，会自动重试。');
  });
}

function init() {
  console.info('[Gemini429重试] 脚本已加载');
  settings = loadSettings();
  updateButtons();

  eventOn(getButtonEvent(BUTTON_SETTINGS), () => {
    openSettingsModal();
  });

  if (settings.dbCompatEnabled) {
    startToastObserver();
  }
  if (settings.swipeCompatEnabled) {
    startSwipeIntentListener();
  }
  startNetwork429Hook();

  eventOn(tavern_events.MESSAGE_SENT, messageId => {
    const message = getMessageById(messageId);
    if (!message || message.role !== 'user') {
      return;
    }
    lastSentUserMessageId = messageId;
    lastSentUserMessageText = String(message.message || '');
    lastSentAt = Date.now();
    if (hasDbPlannerInjection(lastSentUserMessageText)) {
      dbCompatAttemptsByMessage.delete(buildDbRetryKey(lastSentUserMessageText));
    }
  });

  eventOn(tavern_events.MESSAGE_RECEIVED, (messageId, type) => {
    if (['normal', 'regenerate', 'swipe', 'continue'].includes(type)) {
      retryModeByMessageId.set(messageId, normalizeRetryMode(type));
      queueInspect(messageId, `message_received:${type}`);
    }
  });

  eventOn(tavern_events.GENERATION_ENDED, messageId => {
    queueInspect(messageId, 'generation_ended');
  });

  eventOn(tavern_events.GENERATION_STOPPED, () => {
    queueInspect(undefined, 'generation_stopped');
  });

  eventOn(tavern_events.MESSAGE_SWIPED, messageId => {
    queueInspect(messageId, 'message_swiped');
  });

  const stopReload = reloadOnChatChange();

  $(window).on('pagehide', () => {
    clearPendingRetry();
    stopToastObserver();
    stopSwipeIntentListener();
    stopNetwork429Hook();
    closeSettingsModal();
    stopReload.stop();
  });
}

$(() => {
  errorCatched(init)();
});
