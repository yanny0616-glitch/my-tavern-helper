export function buildStyleText() {
  return `
    @import url('https://cdn.jsdelivr.net/gh/lxgw/LxgwWenkai-Webfont@1.7.0/style.css');
    @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css');

    .macro-root {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
      font-family: "LXGW WenKai", "PingFang SC", "Microsoft YaHei", sans-serif;
      color: var(--macro-text, #f5f5f7);
      background: transparent;
      --macro-bg: #f6f1ea;
      --macro-surface: #ffffff;
      --macro-surface-alt: #f1ebe4;
      --macro-text: #1c1c1c;
      --macro-text-muted: #6a5f54;
      --macro-accent: #d9934f;
      --macro-border: #e3d6c9;
      --macro-shadow: 0 22px 48px rgba(43, 34, 24, 0.22);
      --macro-ring: rgba(217, 147, 79, 0.18);
      z-index: 9999;
    }

    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: transparent;
    }

    .macro-root.open {
      display: flex;
    }

    .macro-root.open .macro-panel {
      animation: macro-panel-enter 0.22s ease;
    }

    .macro-root.open .macro-backdrop {
      animation: macro-backdrop-fade 0.22s ease;
    }

    .macro-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(12, 14, 18, 0.52);
      backdrop-filter: blur(8px) saturate(1.05);
    }

    .macro-panel {
      position: relative;
      width: min(920px, 100%);
      max-width: 100%;
      max-height: min(720px, 86vh);
      height: auto;
      background: var(--macro-surface) !important;
      border: 1px solid var(--macro-border) !important;
      border-radius: 22px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: var(--macro-shadow);
      z-index: 1;
      color: var(--macro-text) !important;
    }

    .macro-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--macro-border);
      background: linear-gradient(135deg, rgba(217, 147, 79, 0.18), rgba(255, 250, 243, 0.9));
    }

    .macro-header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .macro-title__main {
      font-size: 18px;
      font-weight: 600;
      letter-spacing: 0.6px;
    }

    .macro-title__sub {
      font-size: 12px;
      color: var(--macro-text-muted);
      margin-top: 4px;
    }

    .macro-close {
      border: 1px solid var(--macro-border);
      background: var(--macro-surface);
      color: var(--macro-text);
      border-radius: 999px;
      width: 34px;
      height: 34px;
      padding: 0;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .macro-icon-btn {
      border: 1px solid var(--macro-border);
      background: var(--macro-surface);
      color: var(--macro-text);
      border-radius: 999px;
      width: 32px;
      height: 32px;
      padding: 0;
      cursor: pointer;
      font-size: 12px;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .macro-icon {
      font-size: 14px;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      opacity: 0.88;
    }

    .macro-icon.is-pinned {
      color: var(--macro-accent);
      opacity: 1;
    }

    .macro-icon-btn,
    .macro-btn,
    .macro-close,
    .macro-select {
      transition:
        background-color 0.18s ease,
        border-color 0.18s ease,
        box-shadow 0.18s ease,
        transform 0.18s ease;
    }

    .macro-icon-btn:hover,
    .macro-close:hover {
      background: color-mix(in srgb, var(--macro-surface) 78%, var(--macro-accent) 22%);
      border-color: color-mix(in srgb, var(--macro-border) 40%, var(--macro-accent) 60%);
    }

    .macro-btn:hover {
      background: color-mix(in srgb, var(--macro-surface) 78%, var(--macro-accent) 22%);
      border-color: color-mix(in srgb, var(--macro-border) 40%, var(--macro-accent) 60%);
    }

    .macro-icon-btn:active,
    .macro-btn:active,
    .macro-close:active {
      transform: translateY(1px) scale(0.98);
    }

    .macro-icon-btn.is-ghost {
      border-color: transparent;
      background: transparent;
      width: 26px;
      height: 26px;
    }

    .macro-icon-btn.is-ghost:hover {
      background: color-mix(in srgb, var(--macro-surface) 70%, var(--macro-accent) 30%);
    }

    .macro-btn:disabled,
    .macro-icon-btn:disabled,
    .macro-close:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .macro-icon-btn:focus-visible,
    .macro-btn:focus-visible,
    .macro-close:focus-visible,
    .macro-select:focus-visible {
      outline: none;
      border-color: var(--macro-accent);
      box-shadow: 0 0 0 3px var(--macro-ring);
    }

    .macro-body {
      flex: 1;
      display: grid;
      grid-template-columns: 280px minmax(0, 1fr);
      min-height: 0;
      min-width: 0;
      overflow-x: hidden;
    }

    .macro-sidebar {
      border-right: 1px solid var(--macro-border) !important;
      background: color-mix(in srgb, var(--macro-surface) 70%, var(--macro-surface-alt) 30%) !important;
      display: flex;
      flex-direction: column;
      min-height: 0;
      min-width: 0;
      color: var(--macro-text) !important;
    }

    .macro-section-title {
      padding: 14px 16px;
      font-size: 12px;
      color: var(--macro-text-muted);
      text-transform: uppercase;
      letter-spacing: 1.2px;
    }

    .macro-list {
      flex: 1;
      overflow: auto;
      overflow-x: hidden;
      padding: 0 12px 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .macro-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .macro-subtitle {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.4px;
      color: var(--macro-text-muted);
      padding: 2px 6px 0;
    }

    .macro-empty-list {
      font-size: 12px;
      color: var(--macro-text-muted);
      padding: 6px 6px 2px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .macro-empty-list .macro-btn {
      align-self: flex-start;
    }

    .macro-item {
      border: 1px solid transparent;
      background: color-mix(in srgb, var(--macro-surface) 92%, transparent);
      border-radius: 12px;
      padding: 10px 12px;
      margin-bottom: 0;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 4px;
      text-align: left;
      color: inherit;
      width: 100%;
      box-sizing: border-box;
    }

    .macro-item:focus-visible {
      outline: none;
      border-color: var(--macro-accent);
      box-shadow: 0 0 0 3px var(--macro-ring);
    }

    .macro-item__row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 10px;
    }

    .macro-item__actions {
      display: flex;
      gap: 6px;
      flex-shrink: 0;
    }

    .macro-search {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 16px 10px;
    }

    .macro-search-input {
      flex: 1;
      border: 1px solid var(--macro-border);
      background: var(--macro-surface);
      color: var(--macro-text);
      border-radius: 999px;
      padding: 6px 12px;
      font-size: 12px;
    }

    .macro-search-input:focus {
      outline: none;
      border-color: var(--macro-accent);
      box-shadow: 0 0 0 3px var(--macro-ring);
    }

    .macro-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 0 16px 10px;
    }

    .macro-filter-chip {
      border: 1px solid var(--macro-border);
      background: var(--macro-surface);
      color: var(--macro-text);
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 12px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.18s ease;
    }

    .macro-filter-chip.active {
      background: color-mix(in srgb, var(--macro-accent) 20%, var(--macro-surface) 80%);
      border-color: color-mix(in srgb, var(--macro-border) 40%, var(--macro-accent) 60%);
      color: var(--macro-text);
    }

    .macro-filter-chip:hover {
      background: color-mix(in srgb, var(--macro-surface) 78%, var(--macro-accent) 22%);
      border-color: color-mix(in srgb, var(--macro-border) 40%, var(--macro-accent) 60%);
    }

    .macro-filter-chip .macro-icon {
      font-size: 12px;
    }

    .macro-item__actions .macro-icon-btn {
      width: 28px;
      height: 28px;
    }

    .macro-item.active {
      border-color: var(--macro-accent);
      background: color-mix(in srgb, var(--macro-accent) 12%, var(--macro-surface) 88%);
    }

    .macro-item__name {
      font-size: 14px;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .macro-item__meta {
      font-size: 12px;
      color: var(--macro-text-muted);
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .macro-actions {
      display: flex;
      gap: 8px;
      padding: 12px 16px 16px;
      border-top: 1px solid var(--macro-border);
    }

    .macro-content {
      display: flex;
      flex-direction: column;
      gap: 18px;
      padding: 18px 20px;
      overflow: auto;
      overflow-x: hidden;
      min-width: 0;
      background: var(--macro-surface) !important;
      color: var(--macro-text) !important;
    }

    .macro-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .macro-field label {
      font-size: 13px;
      color: var(--macro-text-muted);
    }

    .macro-input,
    .macro-textarea {
      width: 100%;
      background: var(--macro-surface-alt) !important;
      color: var(--macro-text) !important;
      border: 1px solid var(--macro-border) !important;
      border-radius: 12px;
      padding: 10px 12px;
      font-size: 14px;
      box-shadow: none !important;
    }

    .macro-textarea {
      min-height: 140px;
      resize: vertical;
    }

    .macro-input:focus,
    .macro-textarea:focus {
      outline: none;
      border-color: var(--macro-accent) !important;
      box-shadow: 0 0 0 3px var(--macro-ring) !important;
    }

    .macro-root input,
    .macro-root textarea {
      background: var(--macro-surface-alt) !important;
      color: var(--macro-text) !important;
      border-color: var(--macro-border) !important;
      box-shadow: none !important;
      filter: none !important;
    }

    .macro-empty {
      font-size: 13px;
      color: var(--macro-text-muted);
      padding: 8px 0;
    }

    .macro-toggle-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
    }

    .macro-toggle {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
    }

    .macro-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 2px 8px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--macro-surface-alt) 70%, transparent);
      border: 1px solid color-mix(in srgb, var(--macro-border) 80%, transparent);
      font-size: 11px;
      color: var(--macro-text-muted);
    }

    .macro-tag .macro-icon {
      font-size: 12px;
      opacity: 0.8;
    }

    .macro-theme-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .macro-theme-modal {
      position: absolute;
      inset: 0;
      background: rgba(12, 14, 18, 0.55);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      z-index: 2;
    }

    .macro-library-modal {
      position: absolute;
      inset: 0;
      background: rgba(12, 14, 18, 0.55);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      z-index: 2;
    }

    .macro-library-panel {
      width: min(920px, 100%);
      max-height: min(760px, 90vh);
      background: var(--macro-surface);
      border: 1px solid var(--macro-border);
      border-radius: 18px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: var(--macro-shadow);
    }

    .macro-library-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px 0;
    }

    .macro-library-body {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 8px 0 12px;
      overflow: auto;
      flex: 1;
    }

    .macro-library-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
      padding: 0 20px 12px;
      min-height: 0;
    }

    .macro-library-grid.is-editing {
      grid-template-columns: minmax(0, 1fr) minmax(0, 360px);
    }

    .macro-library-list,
    .macro-library-editor {
      min-width: 0;
      min-height: 0;
    }

    .macro-library-editor {
      border-left: 1px solid var(--macro-border);
      padding-left: 16px;
      overflow: auto;
      max-height: 100%;
    }

    .macro-library-list .macro-list {
      padding: 0;
    }

    .macro-editor {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .macro-library-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 14px 20px;
      border-top: 1px solid var(--macro-border);
      background: var(--macro-surface-alt);
    }

    .macro-library-body .macro-search,
    .macro-library-body .macro-filters {
      padding: 0 20px 10px;
    }

    .macro-theme-panel {
      width: min(720px, 92vw);
      background: var(--macro-surface);
      border: 1px solid var(--macro-border);
      border-radius: 18px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-shadow: var(--macro-shadow);
    }

    .macro-theme-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px 0;
    }

    .macro-theme-title {
      font-size: 18px;
      font-weight: 600;
    }

    .macro-theme-sub {
      font-size: 12px;
      color: var(--macro-text-muted);
      margin-top: 4px;
    }

    .macro-theme-body {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 0 20px;
    }

    .macro-theme-presets {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .macro-theme-preset {
      border: 1px solid var(--macro-border);
      background: rgba(12, 14, 20, 0.12);
      color: var(--macro-text);
      border-radius: 999px;
      padding: 6px 14px;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .macro-theme-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
    }

    .macro-theme-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 0 20px 18px;
    }

    .macro-select {
      appearance: none;
      background: var(--macro-surface-alt) !important;
      color: var(--macro-text) !important;
      border: 1px solid var(--macro-border) !important;
      border-radius: 12px;
      padding: 8px 36px 8px 12px;
      font-size: 13px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%236a5f54' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 10px center;
      background-size: 14px;
    }

    .macro-scope-row {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .macro-scope-hint {
      font-size: 12px;
      color: var(--macro-text-muted);
      max-width: 220px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .macro-theme-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      background: color-mix(in srgb, var(--macro-surface) 86%, var(--macro-text) 14%);
      border: 1px solid var(--macro-border);
      border-radius: 12px;
      padding: 8px 10px;
      font-size: 12px;
      color: var(--macro-text-muted);
    }

    .macro-theme-item input[type="color"] {
      border: none;
      background: transparent;
      width: 36px;
      height: 24px;
      padding: 0;
    }

    .macro-btn {
      border: 1px solid var(--macro-border);
      background: color-mix(in srgb, var(--macro-surface) 88%, var(--macro-text) 12%);
      color: var(--macro-text);
      border-radius: 12px;
      padding: 8px 12px;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .macro-btn.is-primary {
      border-color: var(--macro-accent);
      background: var(--macro-accent);
      color: #05131b;
      font-weight: 600;
    }

    .macro-btn.is-ghost {
      background: transparent;
    }

    .macro-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 14px 20px;
      border-top: 1px solid var(--macro-border);
      background: linear-gradient(180deg, color-mix(in srgb, var(--macro-surface) 90%, transparent), var(--macro-surface-alt));
    }

    .macro-list::-webkit-scrollbar,
    .macro-content::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    .macro-list::-webkit-scrollbar-thumb,
    .macro-content::-webkit-scrollbar-thumb {
      background: color-mix(in srgb, var(--macro-text) 15%, transparent);
      border-radius: 999px;
    }

    @media (max-width: 900px) {
      .macro-root {
        padding: 12px;
      }

      .macro-body {
        grid-template-columns: 1fr;
      }

      .macro-sidebar {
        border-right: none;
        border-bottom: 1px solid var(--macro-border);
      }

      .macro-library-grid {
        grid-template-columns: 1fr;
      }

      .macro-library-editor {
        border-left: none;
        border-top: 1px solid var(--macro-border);
        padding-left: 0;
        padding-top: 16px;
      }
    }

    @media (max-width: 640px) {
      .macro-panel,
      .macro-library-panel {
        width: 100%;
        max-height: 92vh;
        border-radius: 16px;
      }
    }

    @keyframes macro-panel-enter {
      from {
        opacity: 0;
        transform: translateY(10px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes macro-backdrop-fade {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
  `;
}
