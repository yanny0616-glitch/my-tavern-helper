import { ViewState, PanelController, NotificationFields } from '../types';

type PanelOptions = {
  doc: Document;
  initialOpen: boolean;
  getState: () => ViewState;
  onOpenChange: (open: boolean) => void;
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

const S = {
  // launcher 用 absolute 定位在 body 内右下角
  launcher: [
    'position:absolute',
    'right:8px',
    'bottom:calc(env(safe-area-inset-bottom, 0px) + 50px)',
    'z-index:99999',
    'min-width:44px',
    'height:36px',
    'padding:0 10px',
    'border:1px solid rgba(255,255,255,0.2)',
    'border-radius:999px',
    'background:#1f2937',
    'color:#fff',
    'font-size:12px',
    'font-weight:700',
    'box-shadow:0 8px 20px rgba(0,0,0,0.28)',
    'cursor:pointer',
  ].join(';'),
  // overlay 跟角色卡管理器一样：fixed + 明确 100vw/100vh
  overlay: [
    'position:fixed',
    'inset:0',
    'width:100vw',
    'height:100vh',
    'min-height:100vh',
    'height:100dvh',
    'min-height:100dvh',
    'display:none',
    'align-items:center',
    'justify-content:center',
    'padding:16px',
    'box-sizing:border-box',
    'z-index:99999',
  ].join(';'),
  backdrop: [
    'position:absolute',
    'inset:0',
    'background:rgba(0,0,0,0.4)',
    'backdrop-filter:blur(6px)',
    '-webkit-backdrop-filter:blur(6px)',
  ].join(';'),
  panel: [
    'position:relative',
    'z-index:1',
    'width:min(360px, calc(100vw - 32px))',
    'max-height:min(600px, 90vh)',
    'display:flex',
    'flex-direction:column',
    'overflow:hidden',
    'border:1px solid rgba(255,255,255,0.16)',
    'border-radius:18px',
    'background:linear-gradient(180deg, rgba(13,18,28,0.97), rgba(20,28,43,0.97))',
    'color:#ecf3ff',
    'box-shadow:0 18px 48px rgba(0,0,0,0.38)',
    'backdrop-filter:blur(12px)',
    'font-size:13px',
    'line-height:1.5',
  ].join(';'),
  card: 'padding:12px;border-radius:14px;background:rgba(255,255,255,0.06);',
  cardDim: 'padding:12px;border-radius:14px;background:rgba(255,255,255,0.04);',
  row: 'display:flex;align-items:center;justify-content:space-between;gap:12px;',
  bold: 'font-weight:700;',
  sub: 'font-size:12px;color:#9fb0cc;',
  meta: 'font-size:12px;color:#c7d6ef;',
  toggleBtn:
    'width:100%;padding:12px;border-radius:14px;border:none;font-size:14px;font-weight:700;cursor:pointer;transition:background 0.2s;',
  smallBtn:
    'padding:8px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.06);color:#fff;font-size:12px;font-weight:600;cursor:pointer;',
  errorBox:
    'display:none;padding:10px 12px;border-radius:12px;background:rgba(127,29,29,0.28);border:1px solid rgba(248,113,113,0.26);color:#ffd6d6;font-size:12px;',
};

function buildHTML(): string {
  return `
    <!-- Header (flex-shrink:0, 不被压缩) -->
    <div style="${S.row};padding:16px 16px 12px;flex-shrink:0;">
      <div>
        <div style="font-size:16px;font-weight:700;">后台助手</div>
        <div data-role="subtitle" style="${S.sub}"></div>
      </div>
      <button data-role="close" type="button" style="width:28px;height:28px;border-radius:999px;border:1px solid rgba(255,255,255,0.16);background:rgba(255,255,255,0.06);color:#fff;cursor:pointer;font-size:14px;">×</button>
    </div>

    <!-- Body (可滚动) -->
    <div style="flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;padding:0 16px 16px;display:grid;gap:10px;">
      <!-- Keep-alive toggle button -->
      <button data-role="ka-toggle" type="button" style="${S.toggleBtn}"></button>

      <!-- Auto resume + test row -->
      <div style="${S.cardDim};${S.row}">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
          <input data-role="ka-auto-resume" type="checkbox" style="width:16px;height:16px;" />
          <span style="${S.sub}">自动恢复</span>
        </label>
        <div style="display:flex;gap:6px;">
          <button data-role="ka-test" type="button" style="${S.smallBtn}">测试播放</button>
        </div>
      </div>

      <!-- Keep-alive info (collapsed by default) -->
      <div data-role="ka-info" style="${S.meta};padding:0 4px;display:grid;gap:2px;">
        <span data-role="ka-meta"></span>
      </div>

      <!-- Keep-alive error -->
      <div data-role="ka-error" style="${S.errorBox}"></div>

      <!-- Divider -->
      <div style="height:1px;background:rgba(255,255,255,0.08);margin:2px 0;"></div>

      <!-- Notification section -->
      <div style="${S.cardDim};display:grid;gap:10px;">
        <label style="${S.row};cursor:pointer;">
          <div>
            <div style="${S.bold}">生成完成通知</div>
            <div style="${S.sub}">AI 回复完成后发送系统通知</div>
          </div>
          <input data-role="noti-enabled" type="checkbox" style="width:18px;height:18px;" />
        </label>
        <div style="${S.row}">
          <span data-role="noti-status" style="${S.meta}"></span>
          <div style="display:flex;gap:6px;">
            <button data-role="noti-permission" type="button" style="${S.smallBtn}">授权</button>
            <button data-role="noti-test" type="button" style="${S.smallBtn}">测试</button>
          </div>
        </div>

        <!-- Bark 推送 -->
        <div style="display:grid;gap:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.06);">
          <label style="${S.row};cursor:pointer;">
            <div>
              <div style="${S.bold}">Bark 推送</div>
              <div style="${S.sub}">iOS 后台也能收到通知</div>
            </div>
            <input data-role="bark-enabled" type="checkbox" style="width:18px;height:18px;">
          </label>
          <div data-role="bark-config" style="display:none;gap:6px;">
            <input data-role="bark-url" type="text" placeholder="https://api.day.app/你的key/" style="width:100% !important;padding:8px 10px !important;border-radius:8px !important;border:1px solid rgba(255,255,255,0.5) !important;background:#1a1f2e !important;color:#ffffff !important;font-size:13px !important;box-sizing:border-box !important;-webkit-text-fill-color:#ffffff !important;">
            <div data-role="bark-status" style="font-size:12px;color:#93c5a8;"></div>
          </div>
        </div>

        <!-- Notification fields config (可折叠) -->
        <div style="padding-top:6px;border-top:1px solid rgba(255,255,255,0.06);">
          <button data-role="noti-fields-toggle" type="button" style="display:flex;align-items:center;gap:6px;background:none;border:none;color:#93a8c8;font-size:12px;cursor:pointer;padding:0;">
            <span data-role="noti-fields-arrow" style="font-size:10px;transition:transform 0.2s;">▶</span>
            通知显示内容
          </button>
          <div data-role="noti-fields" style="display:none;padding-top:8px;gap:6px;">
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
              <label style="display:flex;align-items:center;gap:4px;color:#dbe6f5;font-size:12px;cursor:pointer;"><input data-field="characterName" type="checkbox" style="width:14px;height:14px;">角色名</label>
              <label style="display:flex;align-items:center;gap:4px;color:#dbe6f5;font-size:12px;cursor:pointer;"><input data-field="duration" type="checkbox" style="width:14px;height:14px;">耗时</label>
              <label style="display:flex;align-items:center;gap:4px;color:#dbe6f5;font-size:12px;cursor:pointer;"><input data-field="tokenCount" type="checkbox" style="width:14px;height:14px;">tokens</label>
              <label style="display:flex;align-items:center;gap:4px;color:#dbe6f5;font-size:12px;cursor:pointer;"><input data-field="reasoningDuration" type="checkbox" style="width:14px;height:14px;">思考耗时</label>
              <label style="display:flex;align-items:center;gap:4px;color:#dbe6f5;font-size:12px;cursor:pointer;"><input data-field="timeToFirstToken" type="checkbox" style="width:14px;height:14px;">首字时间</label>
              <label style="display:flex;align-items:center;gap:4px;color:#dbe6f5;font-size:12px;cursor:pointer;"><input data-field="model" type="checkbox" style="width:14px;height:14px;">模型</label>
              <label style="display:flex;align-items:center;gap:4px;color:#dbe6f5;font-size:12px;cursor:pointer;"><input data-field="api" type="checkbox" style="width:14px;height:14px;">API</label>
              <label style="display:flex;align-items:center;gap:4px;color:#dbe6f5;font-size:12px;cursor:pointer;"><input data-field="preview" type="checkbox" style="width:14px;height:14px;">正文预览</label>
            </div>
            <label data-role="noti-preview-len" style="display:flex;align-items:center;gap:6px;color:#dbe6f5;font-size:12px;">
              <span>预览字数</span>
              <input data-field="previewLength" type="number" min="20" max="200" step="10" style="width:60px !important;padding:4px 6px !important;border-radius:6px !important;border:1px solid rgba(255,255,255,0.5) !important;background:#1a1f2e !important;color:#ffffff !important;-webkit-text-fill-color:#ffffff !important;font-size:12px !important;">
            </label>
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

const OVERLAY_ID = 'bg-helper-overlay';
const PANEL_ID = 'bg-helper-panel';
const LAUNCHER_ID = 'bg-helper-launcher';

export function setupPanel(options: PanelOptions): PanelController {
  const { doc } = options;

  // 清除旧实例
  doc.getElementById(OVERLAY_ID)?.remove();
  doc.getElementById(LAUNCHER_ID)?.remove();

  const launcher = doc.createElement('button');
  launcher.id = LAUNCHER_ID;
  launcher.type = 'button';
  launcher.textContent = '后台';
  launcher.title = '后台助手面板';
  launcher.setAttribute('aria-label', '后台助手面板');
  launcher.style.cssText = S.launcher;

  const overlay = doc.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.style.cssText = S.overlay;

  const backdrop = doc.createElement('div');
  backdrop.style.cssText = S.backdrop;
  overlay.appendChild(backdrop);

  const panel = doc.createElement('div');
  panel.id = PANEL_ID;
  panel.style.cssText = S.panel;
  panel.innerHTML = buildHTML();
  overlay.appendChild(panel);

  const $ = (role: string) => panel.querySelector(`[data-role="${role}"]`) as HTMLElement;
  const $input = (role: string) => $(role) as HTMLInputElement;
  const $btn = (role: string) => $(role) as HTMLButtonElement;

  const render = () => {
    const state = options.getState();
    const ka = state.keepAlive;
    const noti = state.notification;

    // Subtitle
    $('subtitle').textContent = state.deviceName;

    // Keep-alive toggle button
    const toggleBtn = $btn('ka-toggle');
    if (ka.playing) {
      toggleBtn.textContent = '⏸ 停止保活';
      toggleBtn.style.background = '#166534';
      toggleBtn.style.color = '#d7ffe9';
    } else if (ka.enabled) {
      toggleBtn.textContent = '⏳ 等待恢复...';
      toggleBtn.style.background = '#92400e';
      toggleBtn.style.color = '#fef3c7';
    } else {
      toggleBtn.textContent = '▶ 开始保活';
      toggleBtn.style.background = '#1e3a5f';
      toggleBtn.style.color = '#d9f5ff';
    }

    $input('ka-auto-resume').checked = ka.autoResume;

    // Keep-alive meta — 只在保活开启时显示
    const parts: string[] = [];
    if (ka.enabled && ka.attempts > 0) parts.push(`${ka.attempts}次重连`);
    if (ka.enabled && ka.lastStartedAt) parts.push(`上次 ${formatTime(ka.lastStartedAt)}`);
    if (ka.enabled && ka.visibilityState === 'hidden') parts.push('后台');
    $('ka-meta').textContent = parts.join(' · ');
    $('ka-info').style.display = parts.length ? 'grid' : 'none';

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
    if (lenInput) lenInput.value = String(noti.fields.previewLength);
    const previewLenRow = $('noti-preview-len');
    if (previewLenRow) previewLenRow.style.display = noti.fields.preview ? 'flex' : 'none';

    // Launcher color
    launcher.style.background = ka.playing ? '#166534' : ka.enabled ? '#92400e' : '#1f2937';
  };

  const open = () => {
    overlay.style.display = 'flex';
    // 滚动 body 到顶部
    const body = panel.querySelector('[style*="overflow-y:auto"]');
    if (body) body.scrollTop = 0;
    options.onOpenChange(true);
    render();
  };

  const close = () => {
    overlay.style.display = 'none';
    options.onOpenChange(false);
  };

  const toggle = () => {
    overlay.style.display === 'none' ? open() : close();
  };

  // Events
  launcher.addEventListener('click', toggle);
  $('close').addEventListener('click', close);
  backdrop.addEventListener('click', close);

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

  // 通知字段折叠/展开
  let fieldsOpen = false;
  const fieldsContent = $('noti-fields');
  const fieldsArrow = $('noti-fields-arrow');
  $btn('noti-fields-toggle').addEventListener('click', () => {
    fieldsOpen = !fieldsOpen;
    fieldsContent.style.display = fieldsOpen ? 'grid' : 'none';
    fieldsArrow.style.transform = fieldsOpen ? 'rotate(90deg)' : '';
  });

  // Notification field toggles
  const fieldCheckboxes = panel.querySelectorAll<HTMLInputElement>('[data-field]');
  fieldCheckboxes.forEach(cb => {
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

  doc.body.appendChild(launcher);
  doc.body.appendChild(overlay);

  render();
  if (options.initialOpen) open();

  return {
    open,
    close,
    refresh: render,
    dispose: () => {
      launcher.remove();
      overlay.remove();
    },
  };
}
