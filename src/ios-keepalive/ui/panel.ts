import { KeepAliveViewState, PanelController } from '../types';

type SetupKeepAlivePanelOptions = {
  doc: Document;
  initialOpen: boolean;
  getState: () => KeepAliveViewState;
  onOpenChange: (open: boolean) => void;
  onToggleEnabled: (next: boolean) => void;
  onToggleAutoResume: (next: boolean) => void;
  onStart: () => void;
  onStop: () => void;
  onTest: () => void;
};

export function setupKeepAlivePanel(options: SetupKeepAlivePanelOptions): PanelController {
  const { doc } = options;
  const launcher = doc.createElement('button');
  launcher.type = 'button';
  launcher.textContent = '保活';
  launcher.title = 'iOS 后台保活面板';
  launcher.setAttribute('aria-label', 'iOS 后台保活面板');
  launcher.style.cssText = [
    'position:fixed',
    'right:12px',
    'bottom:calc(env(safe-area-inset-bottom, 0px) + 12px)',
    'z-index:2147483647',
    'min-width:48px',
    'height:40px',
    'padding:0 12px',
    'border:1px solid rgba(255,255,255,0.2)',
    'border-radius:999px',
    'background:#1f2937',
    'color:#fff',
    'font-size:13px',
    'font-weight:700',
    'box-shadow:0 10px 24px rgba(0,0,0,0.28)',
  ].join(';');

  const panel = doc.createElement('div');
  panel.style.cssText = [
    'display:none',
    'position:fixed',
    'right:12px',
    'bottom:calc(env(safe-area-inset-bottom, 0px) + 60px)',
    'z-index:2147483647',
    'width:min(92vw, 380px)',
    'max-height:min(72vh, 620px)',
    'overflow:auto',
    'border:1px solid rgba(255,255,255,0.16)',
    'border-radius:18px',
    'background:linear-gradient(180deg, rgba(13,18,28,0.97), rgba(20,28,43,0.97))',
    'color:#ecf3ff',
    'box-shadow:0 18px 48px rgba(0,0,0,0.38)',
    'backdrop-filter:blur(12px)',
    'padding:16px',
    'font-size:13px',
    'line-height:1.5',
  ].join(';');

  panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;">
      <div>
        <div style="font-size:16px;font-weight:700;">iOS 后台保活</div>
        <div data-role="subtitle" style="font-size:12px;color:#9fb0cc;"></div>
      </div>
      <button data-role="close" type="button" style="width:32px;height:32px;border-radius:999px;border:1px solid rgba(255,255,255,0.16);background:rgba(255,255,255,0.06);color:#fff;">×</button>
    </div>

    <div style="display:grid;gap:12px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border-radius:14px;background:rgba(255,255,255,0.06);">
        <div>
          <div style="font-weight:700;">当前状态</div>
          <div data-role="status-text" style="font-size:12px;color:#c7d6ef;"></div>
        </div>
        <div data-role="status-badge" style="padding:6px 10px;border-radius:999px;font-size:12px;font-weight:700;background:#374151;color:#fff;">未启动</div>
      </div>

      <label style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border-radius:14px;background:rgba(255,255,255,0.04);">
        <div>
          <div style="font-weight:700;">开启后台保活</div>
          <div style="font-size:12px;color:#9fb0cc;">持续循环播放无声音频</div>
        </div>
        <input data-role="enabled" type="checkbox" style="width:18px;height:18px;" />
      </label>

      <label style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border-radius:14px;background:rgba(255,255,255,0.04);">
        <div>
          <div style="font-weight:700;">自动恢复播放</div>
          <div style="font-size:12px;color:#9fb0cc;">切后台/回前台时自动补一次播放</div>
        </div>
        <input data-role="auto-resume" type="checkbox" style="width:18px;height:18px;" />
      </label>

      <div style="display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));gap:8px;">
        <button data-role="start" type="button" style="padding:10px 12px;border-radius:12px;border:1px solid rgba(102,227,163,0.24);background:#143322;color:#d7ffe9;font-weight:700;">开始保活</button>
        <button data-role="stop" type="button" style="padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.06);color:#fff;font-weight:700;">停止</button>
        <button data-role="test" type="button" style="padding:10px 12px;border-radius:12px;border:1px solid rgba(125,211,252,0.24);background:#0f2940;color:#d9f5ff;font-weight:700;">测试</button>
      </div>

      <div style="padding:12px;border-radius:14px;background:rgba(255,255,255,0.04);display:grid;gap:8px;">
        <div style="font-weight:700;">运行信息</div>
        <div data-role="meta-visibility" style="color:#c7d6ef;"></div>
        <div data-role="meta-audio" style="color:#c7d6ef;"></div>
        <div data-role="meta-attempts" style="color:#c7d6ef;"></div>
        <div data-role="meta-last-start" style="color:#c7d6ef;"></div>
        <div data-role="meta-last-error" style="color:#c7d6ef;"></div>
      </div>

      <div data-role="error-box" style="display:none;padding:12px;border-radius:14px;background:rgba(127,29,29,0.28);border:1px solid rgba(248,113,113,0.26);color:#ffd6d6;"></div>

      <div style="padding:12px;border-radius:14px;background:rgba(255,255,255,0.04);color:#b7c8e6;">
        <div style="font-weight:700;color:#e7f0ff;margin-bottom:6px;">说明</div>
        <div data-role="hint"></div>
      </div>
    </div>
  `;

  const closeButton = panel.querySelector('[data-role="close"]') as HTMLButtonElement;
  const subtitle = panel.querySelector('[data-role="subtitle"]') as HTMLDivElement;
  const statusText = panel.querySelector('[data-role="status-text"]') as HTMLDivElement;
  const statusBadge = panel.querySelector('[data-role="status-badge"]') as HTMLDivElement;
  const enabledCheckbox = panel.querySelector('[data-role="enabled"]') as HTMLInputElement;
  const autoResumeCheckbox = panel.querySelector('[data-role="auto-resume"]') as HTMLInputElement;
  const startButton = panel.querySelector('[data-role="start"]') as HTMLButtonElement;
  const stopButton = panel.querySelector('[data-role="stop"]') as HTMLButtonElement;
  const testButton = panel.querySelector('[data-role="test"]') as HTMLButtonElement;
  const visibilityMeta = panel.querySelector('[data-role="meta-visibility"]') as HTMLDivElement;
  const audioMeta = panel.querySelector('[data-role="meta-audio"]') as HTMLDivElement;
  const attemptsMeta = panel.querySelector('[data-role="meta-attempts"]') as HTMLDivElement;
  const lastStartMeta = panel.querySelector('[data-role="meta-last-start"]') as HTMLDivElement;
  const lastErrorMeta = panel.querySelector('[data-role="meta-last-error"]') as HTMLDivElement;
  const errorBox = panel.querySelector('[data-role="error-box"]') as HTMLDivElement;
  const hint = panel.querySelector('[data-role="hint"]') as HTMLDivElement;

  const render = () => {
    const state = options.getState();
    subtitle.textContent = state.isIOS ? '当前设备：iOS' : '当前设备：非 iOS（可用于调试）';
    statusText.textContent = state.statusText;
    statusBadge.textContent = state.playing ? '播放中' : state.enabled ? '待恢复' : '已关闭';
    statusBadge.style.background = state.playing ? '#166534' : state.enabled ? '#92400e' : '#374151';

    enabledCheckbox.checked = state.enabled;
    autoResumeCheckbox.checked = state.autoResume;

    visibilityMeta.textContent = `页面可见性：${state.visibilityLabel}`;
    audioMeta.textContent = `音频元素：${state.audioAttached ? '已挂载到父页面' : '尚未创建'}`;
    attemptsMeta.textContent = `累计播放尝试：${state.attempts} 次`;
    lastStartMeta.textContent = `最近成功播放：${state.lastStartedAtLabel}`;
    lastErrorMeta.textContent = `最近错误时间：${state.lastErrorAtLabel}`;
    hint.textContent = state.hintText;

    errorBox.textContent = state.errorText;
    errorBox.style.display = state.errorText ? 'block' : 'none';

    launcher.style.background = state.playing ? '#166534' : state.enabled ? '#92400e' : '#1f2937';
  };

  const open = () => {
    panel.style.display = 'block';
    options.onOpenChange(true);
    render();
  };

  const close = () => {
    panel.style.display = 'none';
    options.onOpenChange(false);
  };

  const toggle = () => {
    if (panel.style.display === 'none' || !panel.style.display) {
      open();
      return;
    }
    close();
  };

  const onEnabledChange = (event: Event) => {
    options.onToggleEnabled((event.currentTarget as HTMLInputElement).checked);
  };

  const onAutoResumeChange = (event: Event) => {
    options.onToggleAutoResume((event.currentTarget as HTMLInputElement).checked);
  };

  launcher.addEventListener('click', toggle, true);
  closeButton.addEventListener('click', close, true);
  enabledCheckbox.addEventListener('change', onEnabledChange);
  autoResumeCheckbox.addEventListener('change', onAutoResumeChange);
  startButton.addEventListener('click', options.onStart, true);
  stopButton.addEventListener('click', options.onStop, true);
  testButton.addEventListener('click', options.onTest, true);

  doc.body.appendChild(launcher);
  doc.body.appendChild(panel);

  render();
  if (options.initialOpen) {
    open();
  }

  return {
    open,
    close,
    refresh: render,
    dispose: () => {
      launcher.removeEventListener('click', toggle, true);
      closeButton.removeEventListener('click', close, true);
      enabledCheckbox.removeEventListener('change', onEnabledChange);
      autoResumeCheckbox.removeEventListener('change', onAutoResumeChange);
      startButton.removeEventListener('click', options.onStart, true);
      stopButton.removeEventListener('click', options.onStop, true);
      testButton.removeEventListener('click', options.onTest, true);
      launcher.remove();
      panel.remove();
    },
  };
}
