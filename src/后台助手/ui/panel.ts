import { ViewState, PanelController, NotificationFields } from '../types';

type PanelOptions = {
  doc: Document;
  initialOpen: boolean;
  getState: () => ViewState;
  onOpenChange: (open: boolean) => void;
  onThemeToggle: () => void;
  onKeepAliveToggle: (enabled: boolean) => void;
  onAutoResumeToggle: (enabled: boolean) => void;
  onKeepAliveTest: () => void;
  onNotificationToggle: (enabled: boolean) => void;
  onNotificationFieldChange: (fields: Partial<NotificationFields>) => void;
  onBarkEnabledChange: (enabled: boolean) => void;
  onBarkUrlChange: (url: string) => void;
  onRequestPermission: () => void;
  onTestNotification: () => void;
};

const CSS_ID = 'bg-helper-css';
const OVERLAY_ID = 'bg-helper-overlay';
const PANEL_ID = 'bg-helper-panel';
const LAUNCHER_ID = 'bg-helper-launcher';

function buildCSS(): string {
  return `
    /* ====== 主题变量 ====== */
    #${OVERLAY_ID}[data-theme="dark"] {
      --bh-bg: linear-gradient(180deg, rgba(13,18,28,0.97), rgba(20,28,43,0.97));
      --bh-surface: rgba(255,255,255,0.06);
      --bh-surface-hover: rgba(255,255,255,0.1);
      --bh-border: rgba(255,255,255,0.12);
      --bh-text: #ecf3ff;
      --bh-text-sub: #9fb0cc;
      --bh-text-meta: #c7d6ef;
      --bh-input-bg: #1a1f2e;
      --bh-input-border: rgba(255,255,255,0.4);
      --bh-backdrop: rgba(0,0,0,0.4);
      --bh-btn-bg: rgba(255,255,255,0.06);
      --bh-btn-border: rgba(255,255,255,0.14);
      --bh-btn-hover: rgba(255,255,255,0.12);
      --bh-btn-active: rgba(255,255,255,0.18);
      --bh-success: #93c5a8;
      --bh-error-bg: rgba(127,29,29,0.28);
      --bh-error-border: rgba(248,113,113,0.26);
      --bh-error-text: #ffd6d6;
    }
    #${OVERLAY_ID}[data-theme="light"] {
      --bh-bg: linear-gradient(180deg, #ffffff, #f5f3f0);
      --bh-surface: rgba(0,0,0,0.04);
      --bh-surface-hover: rgba(0,0,0,0.07);
      --bh-border: rgba(0,0,0,0.1);
      --bh-text: #1a1a1a;
      --bh-text-sub: #666666;
      --bh-text-meta: #555555;
      --bh-input-bg: #ffffff;
      --bh-input-border: rgba(0,0,0,0.2);
      --bh-backdrop: rgba(0,0,0,0.25);
      --bh-btn-bg: rgba(0,0,0,0.05);
      --bh-btn-border: rgba(0,0,0,0.12);
      --bh-btn-hover: rgba(0,0,0,0.08);
      --bh-btn-active: rgba(0,0,0,0.14);
      --bh-success: #2d8a56;
      --bh-error-bg: rgba(220,38,38,0.08);
      --bh-error-border: rgba(220,38,38,0.2);
      --bh-error-text: #b91c1c;
    }

    /* ====== Overlay ====== */
    #${OVERLAY_ID} {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      min-height: 100vh;
      height: 100dvh;
      min-height: 100dvh;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 16px;
      box-sizing: border-box;
      z-index: 99999;
    }
    #${OVERLAY_ID}.open { display: flex; }

    /* ====== Backdrop ====== */
    #${OVERLAY_ID} .bh-backdrop {
      position: absolute;
      inset: 0;
      background: var(--bh-backdrop);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
    }

    /* ====== Panel ====== */
    #${PANEL_ID} {
      position: relative;
      z-index: 1;
      width: min(360px, calc(100vw - 32px));
      max-height: min(600px, 90vh);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid var(--bh-border);
      border-radius: 18px;
      background: var(--bh-bg);
      color: var(--bh-text);
      box-shadow: 0 18px 48px rgba(0,0,0,0.3);
      font-size: 13px;
      line-height: 1.5;
    }

    /* ====== Header ====== */
    #${PANEL_ID} .bh-header {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px 10px;
    }
    #${PANEL_ID} .bh-title { font-size: 16px; font-weight: 700; }
    #${PANEL_ID} .bh-subtitle { font-size: 12px; color: var(--bh-text-sub); }

    /* ====== Body ====== */
    #${PANEL_ID} .bh-body {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
      padding: 0 16px 16px;
      display: grid;
      gap: 10px;
    }

    /* ====== Buttons ====== */
    #${PANEL_ID} .bh-icon-btn {
      width: 30px;
      height: 30px;
      border-radius: 999px;
      border: 1px solid var(--bh-btn-border);
      background: var(--bh-btn-bg);
      color: var(--bh-text);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      transition: background 0.15s, transform 0.1s;
    }
    #${PANEL_ID} .bh-icon-btn:hover { background: var(--bh-btn-hover); }
    #${PANEL_ID} .bh-icon-btn:active { background: var(--bh-btn-active); transform: scale(0.93); }

    #${PANEL_ID} .bh-btn {
      padding: 8px 12px;
      border-radius: 10px;
      border: 1px solid var(--bh-btn-border);
      background: var(--bh-btn-bg);
      color: var(--bh-text);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s, transform 0.1s;
    }
    #${PANEL_ID} .bh-btn:hover { background: var(--bh-btn-hover); }
    #${PANEL_ID} .bh-btn:active { background: var(--bh-btn-active); transform: scale(0.96); }

    #${PANEL_ID} .bh-toggle-btn {
      width: 100%;
      padding: 12px;
      border-radius: 14px;
      border: none;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s, transform 0.1s;
    }
    #${PANEL_ID} .bh-toggle-btn:hover { filter: brightness(1.1); }
    #${PANEL_ID} .bh-toggle-btn:active { transform: scale(0.98); }

    /* ====== Cards ====== */
    #${PANEL_ID} .bh-card {
      padding: 12px;
      border-radius: 14px;
      background: var(--bh-surface);
    }

    /* ====== Row ====== */
    #${PANEL_ID} .bh-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    /* ====== Inputs ====== */
    #${PANEL_ID} input[type="text"],
    #${PANEL_ID} input[type="number"] {
      padding: 8px 10px !important;
      border-radius: 8px !important;
      border: 1px solid var(--bh-input-border) !important;
      background: var(--bh-input-bg) !important;
      color: var(--bh-text) !important;
      -webkit-text-fill-color: var(--bh-text) !important;
      font-size: 13px !important;
      box-sizing: border-box !important;
    }

    #${PANEL_ID} input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    /* ====== Meta text ====== */
    #${PANEL_ID} .bh-meta { font-size: 12px; color: var(--bh-text-meta); }
    #${PANEL_ID} .bh-sub { font-size: 12px; color: var(--bh-text-sub); }
    #${PANEL_ID} .bh-bold { font-weight: 700; }
    #${PANEL_ID} .bh-success { color: var(--bh-success); }

    /* ====== Error ====== */
    #${PANEL_ID} .bh-error {
      display: none;
      padding: 10px 12px;
      border-radius: 12px;
      background: var(--bh-error-bg);
      border: 1px solid var(--bh-error-border);
      color: var(--bh-error-text);
      font-size: 12px;
    }

    /* ====== Divider ====== */
    #${PANEL_ID} .bh-divider {
      height: 1px;
      background: var(--bh-border);
      margin: 2px 0;
    }

    /* ====== Collapsible ====== */
    #${PANEL_ID} .bh-collapse-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: none;
      border: none;
      color: var(--bh-text-sub);
      font-size: 12px;
      cursor: pointer;
      padding: 0;
      transition: color 0.15s;
    }
    #${PANEL_ID} .bh-collapse-btn:hover { color: var(--bh-text); }
    #${PANEL_ID} .bh-collapse-arrow {
      font-size: 10px;
      transition: transform 0.2s;
    }

  `;
}

function buildHTML(): string {
  return `
    <div class="bh-backdrop"></div>
    <div id="${PANEL_ID}">
      <!-- Header -->
      <div class="bh-header">
        <div>
          <div class="bh-title">后台助手</div>
          <div class="bh-subtitle" data-role="subtitle"></div>
        </div>
        <div style="display:flex;gap:6px;">
          <button data-role="theme" class="bh-icon-btn" type="button" title="切换主题"><i class="fa-solid fa-circle-half-stroke"></i></button>
          <button data-role="close" class="bh-icon-btn" type="button" title="关闭"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>

      <!-- Body -->
      <div class="bh-body">
        <!-- Keep-alive toggle -->
        <button data-role="ka-toggle" class="bh-toggle-btn" type="button"></button>

        <!-- Auto resume + test -->
        <div class="bh-card bh-row">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
            <input data-role="ka-auto-resume" type="checkbox" />
            <span class="bh-sub">自动恢复</span>
          </label>
          <button data-role="ka-test" class="bh-btn" type="button"><i class="fa-solid fa-play" style="margin-right:4px;font-size:10px;"></i>测试</button>
        </div>

        <!-- Keep-alive meta -->
        <div data-role="ka-info" class="bh-meta" style="padding:0 4px;"></div>

        <!-- Keep-alive error -->
        <div data-role="ka-error" class="bh-error"></div>

        <div class="bh-divider"></div>

        <!-- Notification -->
        <div class="bh-card" style="display:grid;gap:10px;">
          <label class="bh-row" style="cursor:pointer;">
            <div>
              <div class="bh-bold"><i class="fa-solid fa-bell" style="margin-right:5px;font-size:12px;"></i>生成完成通知</div>
              <div class="bh-sub">AI 回复完成后发送系统通知</div>
            </div>
            <input data-role="noti-enabled" type="checkbox" />
          </label>
          <div class="bh-row">
            <span data-role="noti-status" class="bh-meta"></span>
            <div style="display:flex;gap:6px;">
              <button data-role="noti-permission" class="bh-btn" type="button"><i class="fa-solid fa-key" style="margin-right:4px;font-size:10px;"></i>授权</button>
              <button data-role="noti-test" class="bh-btn" type="button"><i class="fa-solid fa-paper-plane" style="margin-right:4px;font-size:10px;"></i>测试</button>
            </div>
          </div>

          <!-- Bark -->
          <div style="padding-top:6px;border-top:1px solid var(--bh-border);display:grid;gap:8px;">
            <label class="bh-row" style="cursor:pointer;">
              <div>
                <div class="bh-bold"><i class="fa-brands fa-apple" style="margin-right:5px;font-size:12px;"></i>Bark 推送</div>
                <div class="bh-sub">iOS 后台也能收到通知</div>
              </div>
              <input data-role="bark-enabled" type="checkbox" />
            </label>
            <div data-role="bark-config" style="display:none;gap:6px;">
              <input data-role="bark-url" type="text" placeholder="https://api.day.app/你的key/" style="width:100%;" />
              <div data-role="bark-status" class="bh-meta bh-success"></div>
            </div>
          </div>

          <!-- Fields (collapsible) -->
          <div style="padding-top:6px;border-top:1px solid var(--bh-border);">
            <button data-role="noti-fields-toggle" class="bh-collapse-btn" type="button">
              <span data-role="noti-fields-arrow" class="bh-collapse-arrow">▶</span>
              <i class="fa-solid fa-sliders" style="font-size:11px;"></i>
              通知显示内容
            </button>
            <div data-role="noti-fields" style="display:none;padding-top:8px;gap:6px;">
              <div style="display:flex;flex-wrap:wrap;gap:6px;">
                <label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer;"><input data-field="characterName" type="checkbox">角色名</label>
                <label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer;"><input data-field="duration" type="checkbox">耗时</label>
                <label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer;"><input data-field="tokenCount" type="checkbox">tokens</label>
                <label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer;"><input data-field="reasoningDuration" type="checkbox">思考耗时</label>
                <label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer;"><input data-field="timeToFirstToken" type="checkbox">首字时间</label>
                <label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer;"><input data-field="model" type="checkbox">模型</label>
                <label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer;"><input data-field="api" type="checkbox">API</label>
                <label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer;"><input data-field="preview" type="checkbox">正文预览</label>
              </div>
              <label data-role="noti-preview-len" style="display:flex;align-items:center;gap:6px;font-size:12px;">
                <span>预览字数</span>
                <input data-field="previewLength" type="number" min="20" max="200" step="10" style="width:60px;" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function formatTime(ts: number | null): string {
  if (!ts) return '';
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}

export function setupPanel(options: PanelOptions): PanelController {
  const { doc } = options;

  // 清除旧实例
  doc.getElementById(OVERLAY_ID)?.remove();
  doc.getElementById(LAUNCHER_ID)?.remove(); // 兼容旧版
  doc.getElementById(CSS_ID)?.remove();

  // 注入 CSS
  const styleEl = doc.createElement('style');
  styleEl.id = CSS_ID;
  styleEl.textContent = buildCSS();
  (doc.head ?? doc.documentElement).appendChild(styleEl);

  // Overlay
  const overlay = doc.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.innerHTML = buildHTML();

  const panel = overlay.querySelector(`#${PANEL_ID}`) as HTMLDivElement;
  const backdrop = overlay.querySelector('.bh-backdrop') as HTMLDivElement;

  const $ = (role: string) => panel.querySelector(`[data-role="${role}"]`) as HTMLElement;
  const $input = (role: string) => $(role) as HTMLInputElement;
  const $btn = (role: string) => $(role) as HTMLButtonElement;

  const render = () => {
    const state = options.getState();
    const ka = state.keepAlive;
    const noti = state.notification;

    // Theme
    overlay.setAttribute('data-theme', state.theme);

    // Subtitle
    $('subtitle').textContent = state.deviceName;

    // Keep-alive toggle
    const toggleBtn = $btn('ka-toggle');
    if (ka.playing) {
      toggleBtn.innerHTML = '<i class="fa-solid fa-pause" style="margin-right:6px;"></i>停止保活';
      toggleBtn.style.background = '#166534';
      toggleBtn.style.color = '#d7ffe9';
    } else if (ka.enabled) {
      toggleBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right:6px;"></i>等待恢复...';
      toggleBtn.style.background = '#92400e';
      toggleBtn.style.color = '#fef3c7';
    } else {
      toggleBtn.innerHTML = '<i class="fa-solid fa-play" style="margin-right:6px;"></i>开始保活';
      toggleBtn.style.background = '#1e3a5f';
      toggleBtn.style.color = '#d9f5ff';
    }

    $input('ka-auto-resume').checked = ka.autoResume;

    // Keep-alive meta
    const parts: string[] = [];
    if (ka.enabled && ka.attempts > 0) parts.push(`${ka.attempts}次重连`);
    if (ka.enabled && ka.lastStartedAt) parts.push(`上次 ${formatTime(ka.lastStartedAt)}`);
    if (ka.enabled && ka.visibilityState === 'hidden') parts.push('后台');
    $('ka-info').textContent = parts.join(' · ');
    $('ka-info').style.display = parts.length ? 'block' : 'none';

    // Error
    const errorBox = $('ka-error');
    errorBox.textContent = ka.errorText;
    errorBox.style.display = ka.errorText ? 'block' : 'none';

    // Notification
    $input('noti-enabled').checked = noti.enabled;
    const statusParts = [noti.permissionStatus];
    if (noti.lastNotifiedAt) statusParts.push(`上次 ${formatTime(noti.lastNotifiedAt)}`);
    $('noti-status').textContent = statusParts.join(' · ');

    // Bark
    $input('bark-enabled').checked = noti.barkEnabled;
    $('bark-config').style.display = noti.barkEnabled ? 'grid' : 'none';
    const barkInput = panel.querySelector('[data-role="bark-url"]') as HTMLInputElement;
    if (barkInput && barkInput !== doc.activeElement) barkInput.value = noti.barkUrl;
    $('bark-status').textContent =
      noti.barkEnabled && noti.barkUrl ? '已配置' : noti.barkEnabled ? '请填入 Bark URL' : '';

    // Notification fields
    const fieldNames = [
      'characterName',
      'duration',
      'tokenCount',
      'reasoningDuration',
      'timeToFirstToken',
      'model',
      'api',
      'preview',
    ] as const;
    for (const name of fieldNames) {
      const cb = panel.querySelector(`[data-field="${name}"]`) as HTMLInputElement | null;
      if (cb) cb.checked = noti.fields[name];
    }
    const lenInput = panel.querySelector('[data-field="previewLength"]') as HTMLInputElement | null;
    if (lenInput && lenInput !== doc.activeElement) lenInput.value = String(noti.fields.previewLength);
    const previewLenRow = $('noti-preview-len');
    if (previewLenRow) previewLenRow.style.display = noti.fields.preview ? 'flex' : 'none';

  };

  const open = () => {
    overlay.classList.add('open');
    const body = panel.querySelector('.bh-body');
    if (body) body.scrollTop = 0;
    options.onOpenChange(true);
    render();
  };

  const close = () => {
    overlay.classList.remove('open');
    options.onOpenChange(false);
  };

  // ====== Events ======
  backdrop.addEventListener('click', close);
  $btn('close').addEventListener('click', close);
  $btn('theme').addEventListener('click', () => options.onThemeToggle());

  $btn('ka-toggle').addEventListener('click', () => {
    const state = options.getState();
    options.onKeepAliveToggle(!state.keepAlive.enabled);
  });

  $input('ka-auto-resume').addEventListener('change', e => {
    options.onAutoResumeToggle((e.currentTarget as HTMLInputElement).checked);
  });

  $btn('ka-test').addEventListener('click', () => options.onKeepAliveTest());

  $input('noti-enabled').addEventListener('change', e => {
    options.onNotificationToggle((e.currentTarget as HTMLInputElement).checked);
  });

  // Fields collapse
  let fieldsOpen = false;
  const fieldsContent = $('noti-fields');
  const fieldsArrow = $('noti-fields-arrow');
  $btn('noti-fields-toggle').addEventListener('click', () => {
    fieldsOpen = !fieldsOpen;
    fieldsContent.style.display = fieldsOpen ? 'grid' : 'none';
    fieldsArrow.style.transform = fieldsOpen ? 'rotate(90deg)' : '';
  });

  // Field checkboxes
  panel.querySelectorAll<HTMLInputElement>('[data-field]').forEach(cb => {
    const fieldName = cb.getAttribute('data-field')!;
    if (fieldName === 'previewLength') {
      cb.addEventListener('change', () => {
        options.onNotificationFieldChange({ previewLength: Number(cb.value) || 80 });
      });
    } else {
      cb.addEventListener('change', () => {
        options.onNotificationFieldChange({ [fieldName]: cb.checked });
      });
    }
  });

  // Bark
  $input('bark-enabled').addEventListener('change', e => {
    options.onBarkEnabledChange((e.currentTarget as HTMLInputElement).checked);
  });
  (panel.querySelector('[data-role="bark-url"]') as HTMLInputElement).addEventListener('change', e => {
    options.onBarkUrlChange((e.currentTarget as HTMLInputElement).value.trim());
  });

  $btn('noti-permission').addEventListener('click', () => options.onRequestPermission());
  $btn('noti-test').addEventListener('click', () => options.onTestNotification());

  // Mount
  doc.body.appendChild(overlay);

  render();
  if (options.initialOpen) open();

  return {
    open,
    close,
    refresh: render,
    dispose: () => {
      overlay.remove();
      styleEl.remove();
    },
  };
}
