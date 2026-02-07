import { reloadOnChatChange } from '@util/script';

const BUTTON_SETTINGS = '后台生成通知设置';
const AUDIO_DATA_URI =
  'data:audio/wav;base64,UklGRqQMAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YYAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';

let keepAliveAudio: HTMLAudioElement | null = null;
let keepAliveEnabled = false;
let $settingsModal: JQuery | null = null;
let generationStartedAt: number | null = null;
let keepAliveStatusText = '未开启';
let keepAliveErrorText = '';

function updateButtons() {
  replaceScriptButtons([{ name: BUTTON_SETTINGS, visible: true }]);
}

function ensureAudio() {
  if (keepAliveAudio) {
    return;
  }
  const parentWindow = window.parent ?? window;
  const parentDocument = parentWindow.document;
  const audio = parentDocument.createElement('audio');
  audio.src = AUDIO_DATA_URI;
  audio.loop = true;
  audio.preload = 'auto';
  audio.setAttribute('playsinline', 'true');
  audio.setAttribute('webkit-playsinline', 'true');
  audio.volume = 0.01;
  audio.muted = false;
  audio.style.display = 'none';
  audio.onplay = () => setKeepAliveStatus('播放中');
  audio.onpause = () => setKeepAliveStatus('已暂停');
  audio.onended = () => setKeepAliveStatus('已结束');
  parentDocument.body.appendChild(audio);
  keepAliveAudio = audio;
}

function getNotificationApi(): typeof Notification | null {
  try {
    if (window.parent && 'Notification' in window.parent) {
      return window.parent.Notification;
    }
  } catch (error) {
    console.warn('无法访问父页面 Notification', error);
  }
  if ('Notification' in window) {
    return Notification;
  }
  return null;
}

function getNotificationDebugInfo() {
  let parentOrigin = 'unknown';
  let frameOrigin = 'unknown';
  let parentPermission = 'unknown';
  let framePermission = 'unknown';
  const api = getNotificationApi();

  try {
    parentOrigin = window.parent?.location?.origin ?? 'unknown';
  } catch {
    parentOrigin = 'cross-origin';
  }

  try {
    frameOrigin = window.location?.origin ?? 'unknown';
  } catch {
    frameOrigin = 'unknown';
  }

  try {
    parentPermission = window.parent?.Notification?.permission ?? 'unknown';
  } catch {
    parentPermission = 'cross-origin';
  }

  try {
    framePermission = Notification.permission ?? 'unknown';
  } catch {
    framePermission = 'unknown';
  }

  return {
    apiAvailable: Boolean(api),
    parentOrigin,
    frameOrigin,
    parentPermission,
    framePermission,
  };
}

async function requestNotificationPermission() {
  const api = getNotificationApi();
  if (!api) {
    console.warn('当前浏览器不支持系统通知。');
    return false;
  }
  if (api.permission === 'granted') {
    return true;
  }
  const permission = await api.requestPermission();
  if (permission !== 'granted') {
    console.warn('未授予系统通知权限，可在浏览器设置中开启。');
    return false;
  }
  console.info('系统通知权限已开启。');
  return true;
}

function isNotificationGranted() {
  const api = getNotificationApi();
  return Boolean(api && api.permission === 'granted');
}

function notifyGenerationDone(messageId?: number) {
  const api = getNotificationApi();
  if (api && api.permission === 'granted') {
    void sendNotification(api, messageId);
  }
}

function getCurrentCharacterInfo(): { name: string; icon?: string } {
  try {
    const chid = Number(SillyTavern.characterId);
    const character = Number.isFinite(chid) ? SillyTavern.characters?.[chid] : undefined;
    const name = character?.name || '当前角色';
    if (character?.avatar && typeof SillyTavern.getThumbnailUrl === 'function') {
      try {
        const icon = SillyTavern.getThumbnailUrl('avatar', character.avatar);
        return { name, icon };
      } catch (error) {
        console.warn('获取角色头像失败', error);
      }
    }
    return { name };
  } catch (error) {
    console.warn('获取角色信息失败', error);
    return { name: '当前角色' };
  }
}

async function sendNotification(api: typeof Notification, messageId?: number) {
  const { name, icon } = getCurrentCharacterInfo();
  const message = typeof messageId === 'number' ? getChatMessages(messageId)[0] : getChatMessages(-1)[0];
  const time = getMessageTimeString(message);
  const durationMs = typeof generationStartedAt === 'number' ? Date.now() - generationStartedAt : null;
  const duration = durationMs !== null ? formatDuration(durationMs) : null;
  const tokenCount = await getTokenCountSafe(message?.message);

  const lines = [`角色：${name}`, `时间：${time}`];
  if (duration) {
    lines.push(`耗时：${duration}`);
  }
  if (typeof tokenCount === 'number') {
    lines.push(`输出 tokens：${tokenCount}`);
  }

  const options: NotificationOptions = { body: lines.join('\n') };
  if (icon) {
    options.icon = icon;
  }
  new api('生成已完成', options);
}

function getMessageTimeString(message?: { data?: Record<string, any>; extra?: Record<string, any> }) {
  const candidates = [
    message?.data?.time,
    message?.data?.timestamp,
    message?.data?.send_date,
    message?.extra?.time,
    message?.extra?.timestamp,
    message?.extra?.send_date,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return new Date(candidate).toLocaleString();
    }
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate;
    }
  }
  return new Date().toLocaleString();
}

function formatDuration(durationMs: number) {
  if (durationMs < 1000) {
    return `${durationMs} ms`;
  }
  return `${(durationMs / 1000).toFixed(1)} 秒`;
}

async function getTokenCountSafe(message?: string) {
  if (!message || typeof SillyTavern?.getTokenCountAsync !== 'function') {
    return null;
  }
  try {
    return await SillyTavern.getTokenCountAsync(message);
  } catch (error) {
    console.warn('计算输出 token 失败', error);
    return null;
  }
}

async function startKeepAlive() {
  ensureAudio();
  try {
    await tryPlayAudio();
    keepAliveEnabled = true;
    setKeepAliveStatus('播放中');
    updateButtons();
    toastr.success('后台保活音频已开启。');
    await requestNotificationPermission();
  } catch (error) {
    keepAliveEnabled = false;
    setKeepAliveStatus('播放失败');
    updateButtons();
    console.warn('静音音频播放失败', error);
    toastr.error('无法播放静音音频，请在脚本按钮点击后再试。');
  }
}

function stopKeepAlive() {
  if (keepAliveAudio) {
    keepAliveAudio.pause();
    keepAliveAudio.currentTime = 0;
    keepAliveAudio.remove();
    keepAliveAudio = null;
  }
  keepAliveEnabled = false;
  setKeepAliveStatus('已关闭');
  toastr.info('后台保活音频已关闭。');
}

function setKeepAliveStatus(text: string) {
  keepAliveStatusText = text;
  $settingsModal?.find('[data-role="keepalive-status"]').text(`音频状态：${keepAliveStatusText}`);
}

function setKeepAliveError(text: string) {
  keepAliveErrorText = text;
  $settingsModal?.find('[data-role="keepalive-error"]').text(keepAliveErrorText);
}

function explainPlayError(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError') {
      return '播放被浏览器拦截：需要用户交互触发';
    }
    if (error.name === 'NotSupportedError') {
      return '浏览器不支持该音频格式';
    }
  }
  return '播放失败：未知原因';
}

async function tryPlayAudio(tempVolume?: number) {
  ensureAudio();
  const audio = keepAliveAudio!;
  const previousVolume = audio.volume;
  if (typeof tempVolume === 'number') {
    audio.volume = tempVolume;
  }
  try {
    await audio.play();
    setKeepAliveError('');
  } catch (error) {
    setKeepAliveError(explainPlayError(error));
    throw error;
  } finally {
    if (typeof tempVolume === 'number') {
      audio.volume = previousVolume;
    }
  }
}

function getNotificationStatusText() {
  const api = getNotificationApi();
  if (!api) {
    return '当前浏览器不支持系统通知';
  }
  if (api.permission === 'granted') {
    return '已授权';
  }
  if (api.permission === 'denied') {
    return '已拒绝';
  }
  return '未授权';
}

function renderSettingsModal() {
  const keepAliveChecked = keepAliveEnabled ? 'checked' : '';
  const notifyStatus = getNotificationStatusText();
  const debug = getNotificationDebugInfo();
  return `
    <div data-role="overlay" style="position: fixed; left: 0; top: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.45); z-index: 2147483647; display: flex; align-items: center; justify-content: center; padding: 16px; overflow: auto;">
      <div style="width: min(360px, 92vw); max-height: calc(100vh - 32px); overflow: auto; background: #fff; color: #111; border-radius: 12px; box-shadow: 0 12px 30px rgba(0,0,0,0.25); padding: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div style="font-weight: 600; font-size: 16px;">后台生成通知设置</div>
          <button data-action="close" style="border: 0; background: transparent; font-size: 18px; line-height: 1; cursor: pointer;">×</button>
        </div>
        <div style="display: grid; gap: 12px;">
          <label style="display: flex; align-items: center; gap: 8px; font-size: 14px;">
            <input type="checkbox" data-role="keepalive" ${keepAliveChecked} />
            <span>开启后台保活音频</span>
          </label>
          <div style="display: flex; align-items: center; gap: 8px; font-size: 14px;">
            <button data-action="keepalive-start" style="padding: 6px 10px; border: 1px solid #ccc; background: #f7f7f7; border-radius: 6px; cursor: pointer;">开始播放</button>
            <button data-action="keepalive-stop" style="padding: 6px 10px; border: 1px solid #ccc; background: #f7f7f7; border-radius: 6px; cursor: pointer;">停止播放</button>
            <button data-action="keepalive-test" style="padding: 6px 10px; border: 1px solid #ccc; background: #f7f7f7; border-radius: 6px; cursor: pointer;">测试播放</button>
          </div>
          <div style="font-size: 12px; color: #666; line-height: 1.4;">
            <span data-role="keepalive-status">音频状态：${keepAliveStatusText}</span>（iOS 可能仍会限制后台播放）
          </div>
          <div style="font-size: 12px; color: #b33; line-height: 1.4;" data-role="keepalive-error">${keepAliveErrorText}</div>
          <div style="display: flex; align-items: center; gap: 8px; font-size: 14px;">
            <button data-action="notify" style="padding: 6px 10px; border: 1px solid #ccc; background: #f7f7f7; border-radius: 6px; cursor: pointer;">申请系统通知权限</button>
            <span data-role="notify-status">状态：${notifyStatus}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; font-size: 14px;">
            <button data-action="test-notify" style="padding: 6px 10px; border: 1px solid #ccc; background: #f7f7f7; border-radius: 6px; cursor: pointer;">测试系统通知</button>
            <span data-role="test-status">仅发送系统通知</span>
          </div>
          <div style="font-size: 12px; color: #666; line-height: 1.4;">
            当前来源：${debug.parentOrigin} | 通知权限：${debug.parentPermission} | iframe 权限：${debug.framePermission}
          </div>
          <div style="font-size: 12px; color: #666; line-height: 1.4;">
            iOS 后台会限制脚本运行，保活音频只能尽量减少暂停，不保证锁屏后持续运行。
          </div>
        </div>
      </div>
    </div>
  `;
}

function closeSettingsModal() {
  $settingsModal?.remove();
  $settingsModal = null;
}

function openSettingsModal() {
  closeSettingsModal();
  const parentWindow = window.parent ?? window;
  const parentDocument = parentWindow.document;
  const overlay = parentDocument.createElement('div');
  overlay.setAttribute('script_id', getScriptId());
  overlay.innerHTML = renderSettingsModal();

  $settingsModal = $(overlay);
  $settingsModal.appendTo(parentDocument.body);

  $settingsModal.find('[data-action="close"]').on('click', () => {
    closeSettingsModal();
  });
  $settingsModal.find('[data-role="overlay"]').on('click', event => {
    if (event.target === event.currentTarget) {
      closeSettingsModal();
    }
  });

  $settingsModal.find('[data-role="keepalive"]').on('change', event => {
    const checked = (event.currentTarget as HTMLInputElement).checked;
    if (checked) {
      void startKeepAlive().then(() => {
        $settingsModal?.find('[data-role="keepalive"]').prop('checked', keepAliveEnabled);
      });
    } else {
      stopKeepAlive();
    }
  });
  $settingsModal.find('[data-action="keepalive-start"]').on('click', () => {
    void startKeepAlive().then(() => {
      $settingsModal?.find('[data-role="keepalive"]').prop('checked', keepAliveEnabled);
    });
  });
  $settingsModal.find('[data-action="keepalive-stop"]').on('click', () => {
    stopKeepAlive();
    $settingsModal?.find('[data-role="keepalive"]').prop('checked', false);
  });
  $settingsModal.find('[data-action="keepalive-test"]').on('click', () => {
    void (async () => {
      try {
        await tryPlayAudio(0.2);
        setKeepAliveStatus('测试播放中');
        setTimeout(() => {
          if (keepAliveAudio) {
            keepAliveAudio.pause();
            keepAliveAudio.currentTime = 0;
          }
          setKeepAliveStatus('测试完成');
        }, 400);
      } catch {
        setKeepAliveStatus('测试失败');
      }
    })();
  });

  $settingsModal.find('[data-action="notify"]').on('click', () => {
    void requestNotificationPermission().then(() => {
      $settingsModal?.find('[data-role="notify-status"]').text(`状态：${getNotificationStatusText()}`);
    });
  });

  $settingsModal.find('[data-action="test-notify"]').on('click', () => {
    void requestNotificationPermission().then(granted => {
      if (!granted) {
        $settingsModal?.find('[data-role="test-status"]').text('发送失败：未授权');
        return;
      }
        try {
          notifyGenerationDone(getLastMessageId());
        $settingsModal?.find('[data-role="test-status"]').text('已发送系统通知');
      } catch (error) {
        console.warn('系统通知发送失败', error);
        $settingsModal?.find('[data-role="test-status"]').text('发送失败：浏览器拦截');
      }
    });
  });
}

function init() {
  console.info('[后台生成通知] 脚本已加载');
  updateButtons();
  eventOn(getButtonEvent(BUTTON_SETTINGS), () => {
    openSettingsModal();
  });

  eventOn(tavern_events.GENERATION_STARTED, () => {
    generationStartedAt = Date.now();
  });
  eventOn(tavern_events.GENERATION_STOPPED, () => {
    generationStartedAt = null;
  });
  eventOn(tavern_events.GENERATION_ENDED, message_id => {
    notifyGenerationDone(message_id);
    generationStartedAt = null;
  });
  eventOn(iframe_events.GENERATION_STARTED, () => {
    generationStartedAt = Date.now();
  });
  eventOn(iframe_events.GENERATION_ENDED, (_text, message_id) => {
    notifyGenerationDone(message_id);
    generationStartedAt = null;
  });

  const stopReload = reloadOnChatChange();

  $(window).on('pagehide', () => {
    stopReload.stop();
    closeSettingsModal();
    stopKeepAlive();
  });
}

$(() => {
  errorCatched(init)();
});
