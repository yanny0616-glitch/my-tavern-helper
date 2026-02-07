export const portalStyles = `
@import url('https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');

.em-overlay {
  position: fixed;
  inset: 0;
  width: var(--em-viewport-w, 100%);
  height: var(--em-viewport-h, 100%);
  min-width: 100%;
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(10, 12, 20, 0.72);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 10000;
  box-sizing: border-box;
}

.em-modal {
  position: relative;
  width: min(980px, calc(var(--em-viewport-w, 100%) - 48px));
  height: min(820px, calc(var(--em-viewport-h, 100%) - 120px));
  pointer-events: auto;
}

.em-modal.dragged {
  position: fixed;
}

.em-dragbar {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 100%;
  cursor: move;
  user-select: none;
  touch-action: none;
  z-index: 1;
}

.em-close {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(30, 41, 59, 0.9);
  color: #e2e8f0;
  font-size: 12px;
  cursor: pointer;
}

.em-close.icon-only {
  width: 28px;
  height: 28px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.em-root {
  height: 100%;
  color: #e2e8f0;
  font-family: 'Zen Maru Gothic', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background:
    radial-gradient(circle at 12% 18%, rgba(56, 189, 248, 0.24), transparent 40%),
    radial-gradient(circle at 80% 14%, rgba(34, 197, 94, 0.24), transparent 35%),
    radial-gradient(circle at 12% 90%, rgba(248, 113, 113, 0.2), transparent 40%),
    linear-gradient(160deg, #0b1020 0%, #111827 40%, #0b1226 100%);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 48px rgba(0,0,0,0.45);
  border: 1px solid rgba(255,255,255,0.08);
}

.em-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(6px);
}

.em-title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  position: relative;
  z-index: 2;
}

.em-actions {
  display: flex;
  gap: 8px;
  position: relative;
  z-index: 2;
}

.em-btn {
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: 0.2s ease;
  color: #e2e8f0;
  background: rgba(30, 41, 59, 0.7);
}

.em-btn.icon-only {
  width: 32px;
  height: 32px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.em-btn.has-badge {
  position: relative;
}

.em-btn.has-badge::after {
  content: attr(data-count);
  position: absolute;
  top: -6px;
  right: -6px;
  background: #f59e0b;
  color: #111827;
  font-size: 10px;
  font-weight: 700;
  border-radius: 999px;
  padding: 2px 5px;
  min-width: 16px;
  text-align: center;
  box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.9);
}

.em-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.25);
}

.em-btn.primary {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  border-color: rgba(34, 197, 94, 0.6);
}

.em-btn.danger {
  background: linear-gradient(135deg, #f87171, #ef4444);
  border-color: rgba(248, 113, 113, 0.6);
  color: #111827;
}

.em-body {
  padding: 14px 18px 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.em-toolbar-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: nowrap;
  min-height: 40px;
}

.em-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 0 2px;
  flex-shrink: 0;
  margin-left: auto;
}

.em-search {
  width: 100%;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(15, 23, 42, 0.75);
  color: #e2e8f0;
  padding: 10px 12px;
  font-size: 13px;
  outline: none;
}

.em-hint {
  font-size: 11px;
  color: rgba(226, 232, 240, 0.65);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.em-list {
  padding: 0 18px 18px;
  overflow: auto;
  flex: 1;
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.em-item {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 14px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.2);
}

.em-item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.em-action-delete {
  width: 34px;
  height: 34px;
  padding: 0;
  border-radius: 10px;
  border: 1px solid rgba(248, 113, 113, 0.5);
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: 0.2s ease;
}

.em-action-delete:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.em-item-name {
  font-size: 14px;
  font-weight: 600;
}

.em-update-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 6px;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.4);
  font-size: 11px;
}

.em-item-meta {
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  color: rgba(148, 163, 184, 0.8);
}

.em-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  margin-left: 6px;
}

.em-tag.core {
  color: #f8fafc;
  background: rgba(148, 163, 184, 0.2);
}

.em-status {
  margin-top: 4px;
  font-size: 12px;
  font-weight: 600;
}

.em-status.enabled {
  color: #34d399;
}

.em-status.disabled {
  color: #fbbf24;
}

.em-update-select {
  width: 36px;
  height: 34px;
  padding: 0;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(30, 41, 59, 0.7);
  color: #e2e8f0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: 0.2s ease;
}

.em-update-select.selected {
  background: rgba(34, 197, 94, 0.25);
  border-color: rgba(34, 197, 94, 0.6);
  color: #22c55e;
}

.em-toggle-switch {
  position: relative;
  width: 50px;
  height: 26px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(30, 41, 59, 0.7);
  cursor: pointer;
  transition: 0.2s ease;
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.25);
  padding: 0;
  line-height: 0;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  box-sizing: border-box;
}

.em-toggle-switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #f8fafc;
  transform: none;
  transition: 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}

.em-toggle-switch.on {
  background: linear-gradient(135deg, #34d399, #22c55e);
  border-color: rgba(34, 197, 94, 0.6);
}

.em-toggle-switch.on::after {
  left: calc(100% - 24px);
}

.em-toggle-switch:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.em-empty {
  border-radius: 12px;
  border: 1px dashed rgba(148, 163, 184, 0.3);
  padding: 12px;
  text-align: center;
  font-size: 12px;
  color: rgba(226, 232, 240, 0.7);
  background: rgba(15, 23, 42, 0.6);
}

.em-loading {
  font-size: 12px;
  color: rgba(226, 232, 240, 0.7);
}

.em-confirm {
  position: fixed;
  inset: 0;
  background: rgba(10, 12, 20, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.em-confirm-card {
  width: min(420px, 86vw);
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 14px;
  padding: 16px 18px;
  color: #e2e8f0;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
}

.em-confirm-title {
  font-size: 14px;
  font-weight: 700;
}

.em-confirm-desc {
  margin-top: 6px;
  font-size: 12px;
  color: rgba(226, 232, 240, 0.75);
}

.em-confirm-actions {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 640px) {
  .em-modal {
    width: calc(var(--em-viewport-w, 100%) - 24px);
    height: calc(var(--em-viewport-h, 100%) - 24px);
    position: fixed;
    inset: 12px;
  }
  .em-modal.dragged {
    position: fixed;
    left: auto;
    top: auto;
    right: auto;
    bottom: auto;
  }
  .em-header {
    flex-direction: row;
    align-items: center;
    padding: 12px 14px;
  }
  .em-title {
    font-size: 14px;
    letter-spacing: 0.5px;
  }
  .em-actions {
    gap: 6px;
  }
  .em-dragbar {
    display: none;
  }
  .em-toolbar {
    gap: 6px;
  }
  .em-btn.icon-only {
    width: 28px;
    height: 28px;
  }
  .em-hint {
    font-size: 10px;
  }
}

@media (min-width: 900px) {
  .em-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1200px) {
  .em-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
`;
