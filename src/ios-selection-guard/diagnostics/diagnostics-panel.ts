import { formatCrashStateForDisplay } from './diagnostics-text';
import { loadState, saveState } from '../core/state';
import { Disposable, FeatureSettings } from '../core/types';

type DiagnosticsPanelOptions = {
  getSettings: () => FeatureSettings;
  onChangeSettings: (next: FeatureSettings) => void;
};

export function setupDiagnosticsPanel(doc: Document, options: DiagnosticsPanelOptions): Disposable {
  const hostWin = doc.defaultView ?? window;
  const LIVE_REFRESH_MS = 450;
  const button = doc.createElement('button');
  button.id = 'th-ios-diag-btn';
  button.type = 'button';
  button.title = 'iOS诊断（可拖拽）';
  button.setAttribute('aria-label', 'iOS诊断');
  button.innerHTML =
    '<svg viewBox="0 0 576 512" width="16" height="16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M142.4 21.9c5.6 16.8-3.5 34.9-20.2 40.5L96 71.1V192c0 53 43 96 96 96s96-43 96-96V71.1l-26.1-8.7c-16.8-5.6-25.8-23.7-20.2-40.5s23.7-25.8 40.5-20.2l26.1 8.7C334.4 19.1 352 43.5 352 71.1V192c0 77.2-54.6 141.6-127.3 156.7C231 404.6 278.4 448 336 448c61.9 0 112-50.1 112-112V265.3c-28.3-12.3-48-40.5-48-73.3c0-44.2 35.8-80 80-80s80 35.8 80 80c0 32.8-19.7 61-48 73.3V336c0 97.2-78.8 176-176 176c-92.9 0-168.9-71.9-175.5-163.1C87.2 334.2 32 269.6 32 192V71.1c0-27.5 17.6-52 43.8-60.7l26.1-8.7c16.8-5.6 34.9 3.5 40.5 20.2zM480 224c17.7 0 32-14.3 32-32s-14.3-32-32-32s-32 14.3-32 32s14.3 32 32 32z"></path></svg>';
  button.style.cssText = [
    'position:fixed',
    'right:8px',
    'top:calc(env(safe-area-inset-top, 0px) + 8px)',
    'bottom:auto',
    'z-index:2147483647',
    'width:32px',
    'height:32px',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'padding:0',
    'border-radius:999px',
    'border:1px solid rgba(255,255,255,0.25)',
    'background:rgba(0,0,0,0.72)',
    'color:#fff',
    'line-height:0',
    'touch-action:none',
    'cursor:grab',
    'user-select:none',
  ].join(';');

  const panel = doc.createElement('div');
  panel.id = 'th-ios-diag-panel';
  panel.style.cssText = [
    'display:none',
    'position:fixed',
    'left:8px',
    'top:8px',
    'z-index:2147483647',
    'width:min(88vw, 360px)',
    'height:min(50vh, 300px)',
    'max-height:calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 16px)',
    'background:rgba(15,17,21,0.96)',
    'border:1px solid rgba(255,255,255,0.2)',
    'border-radius:10px',
    'box-shadow:0 8px 28px rgba(0,0,0,0.35)',
    'padding:8px',
    'flex-direction:column',
    'gap:6px',
  ].join(';');

  const actions = doc.createElement('div');
  actions.style.cssText = 'display:flex;gap:8px;justify-content:space-between;align-items:center;';
  const leftActions = doc.createElement('div');
  leftActions.style.cssText = 'position:relative;display:flex;gap:8px;align-items:center;';
  const settingsBtn = doc.createElement('button');
  settingsBtn.type = 'button';
  settingsBtn.title = '功能设置';
  settingsBtn.setAttribute('aria-label', '功能设置');
  settingsBtn.innerHTML =
    '<svg viewBox="0 0 512 512" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M78.6 77.8C86.6 69.8 99.6 69.8 107.6 77.8L144 114.1 180.4 77.8C188.4 69.8 201.4 69.8 209.4 77.8C217.4 85.8 217.4 98.8 209.4 106.8L173.1 143.1 209.4 179.4C217.4 187.4 217.4 200.4 209.4 208.4C201.4 216.4 188.4 216.4 180.4 208.4L144 172.1 107.6 208.4C99.6 216.4 86.6 216.4 78.6 208.4C70.6 200.4 70.6 187.4 78.6 179.4L114.9 143.1 78.6 106.8C70.6 98.8 70.6 85.8 78.6 77.8zM302.6 303.8C310.6 295.8 323.6 295.8 331.6 303.8L368 340.1 404.4 303.8C412.4 295.8 425.4 295.8 433.4 303.8C441.4 311.8 441.4 324.8 433.4 332.8L397.1 369.1 433.4 405.4C441.4 413.4 441.4 426.4 433.4 434.4C425.4 442.4 412.4 442.4 404.4 434.4L368 398.1 331.6 434.4C323.6 442.4 310.6 442.4 302.6 434.4C294.6 426.4 294.6 413.4 302.6 405.4L338.9 369.1 302.6 332.8C294.6 324.8 294.6 311.8 302.6 303.8zM256 0C291.3 0 320 28.7 320 64L320 96L352 96C387.3 96 416 124.7 416 160L416 192L448 192C483.3 192 512 220.7 512 256C512 291.3 483.3 320 448 320L416 320L416 352C416 387.3 387.3 416 352 416L320 416L320 448C320 483.3 291.3 512 256 512C220.7 512 192 483.3 192 448L192 416L160 416C124.7 416 96 387.3 96 352L96 320L64 320C28.7 320 0 291.3 0 256C0 220.7 28.7 192 64 192L96 192L96 160C96 124.7 124.7 96 160 96L192 96L192 64C192 28.7 220.7 0 256 0zM256 160C202.9 160 160 202.9 160 256C160 309.1 202.9 352 256 352C309.1 352 352 309.1 352 256C352 202.9 309.1 160 256 160z"></path></svg>';
  const title = doc.createElement('div');
  title.textContent = 'iOS诊断';
  title.style.cssText = 'font-size:12px;color:#d7deea;font-weight:600;';
  const rightActions = doc.createElement('div');
  rightActions.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;';
  const iconBtnStyle = [
    'width:28px',
    'height:28px',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'padding:0',
    'border-radius:6px',
    'border:1px solid rgba(255,255,255,0.25)',
    'background:#232833',
    'color:#fff',
    'line-height:0',
  ].join(';');
  settingsBtn.style.cssText = iconBtnStyle;

  const settingsMenu = doc.createElement('div');
  settingsMenu.style.cssText = [
    'display:none',
    'position:absolute',
    'top:34px',
    'left:0',
    'min-width:220px',
    'background:#141925',
    'border:1px solid rgba(255,255,255,0.2)',
    'border-radius:8px',
    'padding:8px',
    'z-index:2147483647',
    'box-shadow:0 8px 20px rgba(0,0,0,0.35)',
  ].join(';');

  const refreshBtn = doc.createElement('button');
  refreshBtn.type = 'button';
  refreshBtn.title = '刷新';
  refreshBtn.setAttribute('aria-label', '刷新');
  refreshBtn.innerHTML =
    '<svg viewBox="0 0 512 512" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M105.1 202.6c7.7-21.8 19.1-42.6 34.2-61.7c50.6-63.9 143.5-74.5 207.3-23.9l12.5 9.9l-38.9 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l96 0c13.3 0 24-10.7 24-24l0-96c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 34.9l-17.8-14.1C289 13.9 166.7 27.8 92.3 121.6c-19 24-33.4 50.4-43 78.1c-4.4 12.5 2.2 26.2 14.8 30.6s26.2-2.2 30.6-14.8zm342.8 79c-12.6-4.4-26.2 2.2-30.6 14.8c-7.7 21.8-19.1 42.6-34.2 61.7c-50.6 63.9-143.5 74.5-207.3 23.9l-12.5-9.9l38.9 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-96 0c-13.3 0-24 10.7-24 24l0 96c0 13.3 10.7 24 24 24s24-10.7 24-24l0-34.9l17.8 14.1c104.9 83.2 227.2 69.3 301.6-24.5c19-24 33.4-50.4 43-78.1c4.4-12.5-2.2-26.2-14.8-30.6z"></path></svg>';
  refreshBtn.style.cssText = iconBtnStyle;

  const copyBtn = doc.createElement('button');
  copyBtn.type = 'button';
  copyBtn.title = '复制';
  copyBtn.setAttribute('aria-label', '复制');
  copyBtn.innerHTML =
    '<svg viewBox="0 0 448 512" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M384 336l0-192c0-35.3-28.7-64-64-64L192 80c-35.3 0-64 28.7-64 64l0 192c0 35.3 28.7 64 64 64l128 0c35.3 0 64-28.7 64-64zM192 32l128 0c61.9 0 112 50.1 112 112l0 192c0 61.9-50.1 112-112 112l-128 0c-61.9 0-112-50.1-112-112l0-192C80 82.1 130.1 32 192 32zM64 128c17.7 0 32 14.3 32 32l0 224c0 53 43 96 96 96l96 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-96 0C103.6 544 32 472.4 32 384L32 160c0-17.7 14.3-32 32-32z"></path></svg>';
  copyBtn.style.cssText = iconBtnStyle;

  const clearBtn = doc.createElement('button');
  clearBtn.type = 'button';
  clearBtn.title = '清空';
  clearBtn.setAttribute('aria-label', '清空');
  clearBtn.innerHTML =
    '<svg viewBox="0 0 448 512" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M135.2 17.7C140.6 7.1 151.5 0 163.4 0L284.6 0c11.9 0 22.8 7.1 28.2 17.7L328 48 432 48c8.8 0 16 7.2 16 16s-7.2 16-16 16l-16 0-21.2 339.3C392.3 469.2 363 496 327.9 496L120.1 496c-35.1 0-64.4-26.8-66.9-76.7L32 80 16 80C7.2 80 0 72.8 0 64S7.2 48 16 48L120 48l15.2-30.3zM160 176c8.8 0 16 7.2 16 16l0 192c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-192c0-8.8 7.2-16 16-16zm128 0c8.8 0 16 7.2 16 16l0 192c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-192c0-8.8 7.2-16 16-16z"></path></svg>';
  clearBtn.style.cssText = iconBtnStyle;

  const closeBtn = doc.createElement('button');
  closeBtn.type = 'button';
  closeBtn.title = '关闭';
  closeBtn.setAttribute('aria-label', '关闭');
  closeBtn.innerHTML =
    '<svg viewBox="0 0 384 512" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"></path></svg>';
  closeBtn.style.cssText = iconBtnStyle;

  rightActions.appendChild(refreshBtn);
  rightActions.appendChild(copyBtn);
  rightActions.appendChild(clearBtn);
  rightActions.appendChild(closeBtn);
  leftActions.appendChild(settingsBtn);
  leftActions.appendChild(title);
  leftActions.appendChild(settingsMenu);
  actions.appendChild(leftActions);
  actions.appendChild(rightActions);

  const output = doc.createElement('div');
  output.style.cssText = [
    'margin:0',
    'flex:1',
    'overflow:auto',
    'font-size:12px',
    'line-height:1.4',
    'color:#d7deea',
    'background:#141925',
    'border-radius:8px',
    'padding:8px',
  ].join(';');

  panel.appendChild(actions);
  panel.appendChild(output);
  doc.body.appendChild(button);
  doc.body.appendChild(panel);

  const clamp = (n: number, min: number, max: number): number => {
    if (max < min) {
      return min;
    }
    return Math.min(Math.max(n, min), max);
  };

  const placePanelNearButton = () => {
    if (panel.style.display === 'none' || !panel.style.display) {
      return;
    }
    const gap = 6;
    const minGap = 4;
    const vw = hostWin.innerWidth;
    const vh = hostWin.innerHeight;
    const buttonRect = button.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();

    let left = buttonRect.left + buttonRect.width - panelRect.width;
    left = clamp(left, minGap, vw - panelRect.width - minGap);

    let top = buttonRect.bottom + gap;
    const maxTop = vh - panelRect.height - minGap;
    if (top > maxTop) {
      top = buttonRect.top - panelRect.height - gap;
    }
    top = clamp(top, minGap, maxTop);

    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
    panel.style.right = 'auto';
  };

  const placeButtonSafely = () => {
    const vw = hostWin.innerWidth;
    const vh = hostWin.innerHeight;
    const rect = button.getBoundingClientRect();
    const minGap = 4;
    const maxLeft = Math.max(minGap, vw - rect.width - minGap);
    const maxTop = Math.max(minGap, vh - rect.height - minGap);
    const clampedLeft = Math.min(Math.max(rect.left, minGap), maxLeft);
    const clampedTop = Math.min(Math.max(rect.top, minGap), maxTop);
    if (Math.abs(clampedLeft - rect.left) > 1 || Math.abs(clampedTop - rect.top) > 1) {
      button.style.left = `${clampedLeft}px`;
      button.style.top = `${clampedTop}px`;
      button.style.right = 'auto';
      button.style.bottom = 'auto';
    }
    placePanelNearButton();
  };

  let lastRenderedText = '';
  let lastPaintedText = '';
  const sectionOpenState = new Map<string, boolean>();
  let liveRefreshTimer = 0;

  const rememberSectionState = () => {
    const detailsNodes = output.querySelectorAll('details[data-section]');
    for (const node of detailsNodes) {
      const title = node.getAttribute('data-section');
      if (!title) {
        continue;
      }
      sectionOpenState.set(title, (node as HTMLDetailsElement).open);
    }
  };

  const startLiveRefresh = () => {
    if (liveRefreshTimer) {
      return;
    }
    liveRefreshTimer = hostWin.setInterval(() => {
      if (panel.style.display === 'none' || !panel.style.display) {
        return;
      }
      render();
    }, LIVE_REFRESH_MS);
  };

  const stopLiveRefresh = () => {
    if (!liveRefreshTimer) {
      return;
    }
    hostWin.clearInterval(liveRefreshTimer);
    liveRefreshTimer = 0;
  };

  const render = () => {
    const state = loadState();
    const text = formatCrashStateForDisplay(state);
    lastRenderedText = text;
    if (text === lastPaintedText) {
      return;
    }
    rememberSectionState();
    lastPaintedText = text;
    output.innerHTML = '';
    const lines = text.split('\n');
    const sections: Array<{ title: string; lines: string[] }> = [];
    let current: { title: string; lines: string[] } | null = null;
    for (const line of lines) {
      if (/^\[.+\]$/.test(line.trim())) {
        current = { title: line.trim(), lines: [] };
        sections.push(current);
      } else {
        if (!current) {
          current = { title: '[诊断信息]', lines: [] };
          sections.push(current);
        }
        current.lines.push(line);
      }
    }
    for (const section of sections) {
      const details = doc.createElement('details');
      const isLogSection = section.title.includes('事件日志');
      details.setAttribute('data-section', section.title);
      details.open = sectionOpenState.get(section.title) ?? isLogSection;
      details.style.cssText = 'margin:0 0 8px 0;border:1px solid rgba(255,255,255,0.08);border-radius:6px;';

      const summary = doc.createElement('summary');
      summary.textContent = section.title;
      summary.style.cssText =
        'cursor:pointer;list-style:none;padding:6px 8px;background:#1b2230;border-radius:6px;color:#dfe6f5;font-weight:600;';

      const body = doc.createElement('pre');
      body.textContent = section.lines.join('\n').trim() || '（空）';
      body.style.cssText =
        'margin:0;padding:8px;white-space:pre-wrap;word-break:break-word;color:#d7deea;background:transparent;border-radius:0 0 6px 6px;';

      details.appendChild(summary);
      details.appendChild(body);
      details.addEventListener('toggle', () => {
        sectionOpenState.set(section.title, details.open);
      });
      output.appendChild(details);
    }
  };
  const renderSettingsMenu = () => {
    settingsMenu.innerHTML = '';
    const settings = options.getSettings();
    const items: Array<{ key: keyof FeatureSettings; label: string }> = [
      { key: 'enableCrashGuard', label: '崩溃守护' },
      { key: 'enableSelectionGuard', label: '选区修复' },
      { key: 'enableMemorySnapshot', label: '内存快照' },
      { key: 'enableHeavyMode', label: '手动轻量模式' },
      { key: 'enableAutoLightModeOnBackground', label: '后台自动轻量模式' },
    ];
    for (const item of items) {
      const row = doc.createElement('button');
      row.type = 'button';
      row.style.cssText = [
        'width:100%',
        'display:flex',
        'justify-content:space-between',
        'align-items:center',
        'margin:0 0 6px 0',
        'padding:6px 8px',
        'border-radius:6px',
        'border:1px solid rgba(255,255,255,0.15)',
        'background:#1b2230',
        'color:#d7deea',
        'font-size:12px',
      ].join(';');
      const label = doc.createElement('span');
      label.textContent = item.label;
      const value = doc.createElement('span');
      value.textContent = settings[item.key] ? '开' : '关';
      value.style.color = settings[item.key] ? '#6ad58f' : '#f48c8c';
      row.appendChild(label);
      row.appendChild(value);
      row.addEventListener('click', () => {
        const current = options.getSettings();
        const next: FeatureSettings = { ...current, [item.key]: !current[item.key] };
        options.onChangeSettings(next);
        renderSettingsMenu();
        render();
      });
      settingsMenu.appendChild(row);
    }
  };

  const open = () => {
    render();
    renderSettingsMenu();
    panel.style.display = 'flex';
    placePanelNearButton();
    startLiveRefresh();
  };

  const close = () => {
    panel.style.display = 'none';
    stopLiveRefresh();
  };

  const toggle = () => {
    if (panel.style.display === 'none' || !panel.style.display) {
      open();
    } else {
      close();
    }
  };

  const copy = async () => {
    const text = lastRenderedText || formatCrashStateForDisplay(loadState());
    const defaultBtnBg = '#232833';
    let copyStatusTimer = 0;
    const flashCopyStatus = (label: string, bgColor: string) => {
      copyBtn.title = label;
      copyBtn.style.backgroundColor = bgColor;
      if (copyStatusTimer) {
        hostWin.clearTimeout(copyStatusTimer);
      }
      copyStatusTimer = hostWin.setTimeout(() => {
        copyBtn.title = '复制';
        copyBtn.style.backgroundColor = defaultBtnBg;
      }, 1200);
    };
    const setCopyStatus = (label: string) => {
      flashCopyStatus(label, label === '已复制' ? '#1f6f43' : '#7f1d1d');
    };
    const fallbackExecCopy = () => {
      const textarea = doc.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', 'true');
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      textarea.style.left = '-9999px';
      doc.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      let ok = false;
      try {
        ok = doc.execCommand('copy');
      } catch {
        ok = false;
      } finally {
        textarea.remove();
      }
      return ok;
    };

    try {
      if (hostWin.navigator.clipboard?.writeText) {
        await hostWin.navigator.clipboard.writeText(text);
        setCopyStatus('已复制');
        return;
      }
      if (fallbackExecCopy()) {
        setCopyStatus('已复制');
        return;
      }
      setCopyStatus('复制失败');
    } catch (err) {
      if (fallbackExecCopy()) {
        setCopyStatus('已复制');
        return;
      }
      const reason = err instanceof Error ? err.message : String(err ?? 'unknown');
      setCopyStatus('复制失败');
      console.warn('[ios-crash-guard] copy failed:', reason);
    }
  };

  const clearLogs = () => {
    const next = loadState();
    next.events = [];
    saveState(next);
    render();
    const defaultBtnBg = '#232833';
    clearBtn.title = '已清空';
    clearBtn.style.backgroundColor = '#1f6f43';
    hostWin.setTimeout(() => {
      clearBtn.title = '清空';
      clearBtn.style.backgroundColor = defaultBtnBg;
    }, 1200);
  };

  let dragging = false;
  let dragMoved = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let startLeft = 0;
  let startTop = 0;
  let suppressClickUntil = 0;
  let activePointerId = -1;

  const beginDrag = (clientX: number, clientY: number) => {
    const rect = button.getBoundingClientRect();
    dragging = true;
    dragMoved = false;
    dragStartX = clientX;
    dragStartY = clientY;
    startLeft = rect.left;
    startTop = rect.top;
    button.style.cursor = 'grabbing';
  };

  const moveDrag = (clientX: number, clientY: number) => {
    if (!dragging) {
      return;
    }
    const dx = clientX - dragStartX;
    const dy = clientY - dragStartY;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      dragMoved = true;
    }
    const rect = button.getBoundingClientRect();
    const minGap = 4;
    const nextLeft = clamp(startLeft + dx, minGap, hostWin.innerWidth - rect.width - minGap);
    const nextTop = clamp(startTop + dy, minGap, hostWin.innerHeight - rect.height - minGap);
    button.style.left = `${nextLeft}px`;
    button.style.top = `${nextTop}px`;
    button.style.right = 'auto';
    button.style.bottom = 'auto';
    placePanelNearButton();
  };

  const endDrag = () => {
    if (!dragging) {
      return;
    }
    dragging = false;
    button.style.cursor = 'grab';
    if (dragMoved) {
      suppressClickUntil = Date.now() + 250;
    }
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }
    activePointerId = event.pointerId;
    beginDrag(event.clientX, event.clientY);
    if (button.setPointerCapture) {
      button.setPointerCapture(event.pointerId);
    }
    event.preventDefault();
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!dragging || event.pointerId !== activePointerId) {
      return;
    }
    moveDrag(event.clientX, event.clientY);
    event.preventDefault();
  };

  const onPointerUp = (event: PointerEvent) => {
    if (event.pointerId !== activePointerId) {
      return;
    }
    if (button.releasePointerCapture && button.hasPointerCapture(event.pointerId)) {
      button.releasePointerCapture(event.pointerId);
    }
    endDrag();
    activePointerId = -1;
    event.preventDefault();
  };

  const onTouchStart = (event: TouchEvent) => {
    if (event.touches.length < 1) {
      return;
    }
    const t = event.touches[0];
    beginDrag(t.clientX, t.clientY);
    event.preventDefault();
  };

  const onTouchMove = (event: TouchEvent) => {
    if (!dragging || event.touches.length < 1) {
      return;
    }
    const t = event.touches[0];
    moveDrag(t.clientX, t.clientY);
    event.preventDefault();
  };

  const onTouchEnd = (event: TouchEvent) => {
    endDrag();
    event.preventDefault();
  };

  const onMouseDown = (event: MouseEvent) => {
    if (event.button !== 0) {
      return;
    }
    beginDrag(event.clientX, event.clientY);
    event.preventDefault();
  };

  const onMouseMove = (event: MouseEvent) => {
    if (!dragging) {
      return;
    }
    moveDrag(event.clientX, event.clientY);
    event.preventDefault();
  };

  const onMouseUp = () => {
    endDrag();
  };

  const onButtonClick = () => {
    if (Date.now() < suppressClickUntil) {
      return;
    }
    toggle();
  };
  const onSettingsClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (panel.style.display === 'none' || !panel.style.display) {
      open();
    }
    const show = settingsMenu.style.display === 'none' || !settingsMenu.style.display;
    settingsMenu.style.display = show ? 'block' : 'none';
  };
  const onPanelClick = (event: MouseEvent) => {
    const target = event.target as Node | null;
    if (!target) {
      return;
    }
    if (!settingsMenu.contains(target) && target !== settingsBtn) {
      settingsMenu.style.display = 'none';
    }
  };

  const supportsPointer = typeof hostWin.PointerEvent !== 'undefined';
  if (supportsPointer) {
    button.addEventListener('pointerdown', onPointerDown, true);
    button.addEventListener('pointermove', onPointerMove, true);
    button.addEventListener('pointerup', onPointerUp, true);
    button.addEventListener('pointercancel', onPointerUp, true);
  } else {
    button.addEventListener('touchstart', onTouchStart, { capture: true, passive: false });
    hostWin.addEventListener('touchmove', onTouchMove, { capture: true, passive: false });
    hostWin.addEventListener('touchend', onTouchEnd, { capture: true, passive: false });
    button.addEventListener('mousedown', onMouseDown, true);
    hostWin.addEventListener('mousemove', onMouseMove, true);
    hostWin.addEventListener('mouseup', onMouseUp, true);
  }
  button.addEventListener('click', onButtonClick, true);
  settingsBtn.addEventListener('click', onSettingsClick, true);
  panel.addEventListener('click', onPanelClick, true);
  closeBtn.addEventListener('click', close, true);
  refreshBtn.addEventListener('click', render, true);
  clearBtn.addEventListener('click', clearLogs, true);
  copyBtn.addEventListener('click', () => {
    void copy();
  });
  hostWin.addEventListener('resize', placeButtonSafely, true);
  hostWin.addEventListener('orientationchange', placeButtonSafely, true);
  hostWin.visualViewport?.addEventListener('resize', placeButtonSafely, true);
  hostWin.setTimeout(placeButtonSafely, 0);

  return {
    dispose: () => {
      if (supportsPointer) {
        button.removeEventListener('pointerdown', onPointerDown, true);
        button.removeEventListener('pointermove', onPointerMove, true);
        button.removeEventListener('pointerup', onPointerUp, true);
        button.removeEventListener('pointercancel', onPointerUp, true);
      } else {
        button.removeEventListener('touchstart', onTouchStart, true);
        hostWin.removeEventListener('touchmove', onTouchMove, true);
        hostWin.removeEventListener('touchend', onTouchEnd, true);
        button.removeEventListener('mousedown', onMouseDown, true);
        hostWin.removeEventListener('mousemove', onMouseMove, true);
        hostWin.removeEventListener('mouseup', onMouseUp, true);
      }
      button.removeEventListener('click', onButtonClick, true);
      settingsBtn.removeEventListener('click', onSettingsClick, true);
      panel.removeEventListener('click', onPanelClick, true);
      closeBtn.removeEventListener('click', close, true);
      refreshBtn.removeEventListener('click', render, true);
      clearBtn.removeEventListener('click', clearLogs, true);
      hostWin.removeEventListener('resize', placeButtonSafely, true);
      hostWin.removeEventListener('orientationchange', placeButtonSafely, true);
      hostWin.visualViewport?.removeEventListener('resize', placeButtonSafely, true);
      button.remove();
      panel.remove();
      stopLiveRefresh();
    },
  };
}
