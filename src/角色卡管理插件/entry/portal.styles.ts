export const cardHubStyles = `
      .cardhub-root {
        position: fixed;
        inset: 0;
        width: 100vw;
        height: 100vh;
        min-height: 100vh;
        height: 100dvh;
        min-height: 100dvh;
        z-index: 9999;
        font-family: "ZCOOL XiaoWei", "STSong", "Songti SC", "SimSun", serif;
        color: var(--cardhub-text, #1b1b1b);
        --cardhub-bg-start: #fff9f0;
        --cardhub-bg-end: #f3e4d4;
        --cardhub-surface: #fffaf4;
        --cardhub-surface-alt: #fff6ea;
        --cardhub-text: #1b1b1b;
        --cardhub-text-muted: #7d5b46;
        --cardhub-accent: #e7b191;
        --cardhub-accent-strong: #3a2a22;
        --cardhub-border: #e2c7b3;
        --cardhub-surface-rgb: 255, 250, 244;
        --cardhub-surface-alt-rgb: 255, 246, 234;
        --cardhub-border-rgb: 226, 199, 179;
        --cardhub-accent-rgb: 231, 177, 145;
        --cardhub-accent-strong-rgb: 58, 42, 34;
        --cardhub-accent-text: #1b1b1b;
        --cardhub-accent-strong-text: #ffffff;
        --cardhub-shadow-strong: 0 26px 70px rgba(43, 32, 24, 0.22);
        --cardhub-shadow-soft: 0 12px 26px rgba(43, 32, 24, 0.16);
        display: none;
        align-items: center;
        justify-content: center;
      }

      .cardhub-root.open {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .cardhub-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(6px);
        opacity: 0;
        transition: opacity 180ms ease;
      }

      .cardhub-root.open .cardhub-backdrop {
        opacity: 1;
      }

      .cardhub-root.open .cardhub-backdrop {
        animation: cardhub-backdrop-in 220ms ease;
      }

      .cardhub-panel {
        position: relative;
        width: min(980px, 94%);
        max-height: 92%;
        background: linear-gradient(160deg, var(--cardhub-bg-start), var(--cardhub-bg-end));
        border-radius: 28px;
        box-shadow: var(--cardhub-shadow-strong);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        z-index: 1;
        opacity: 0;
        transform: translateY(8px) scale(0.985);
        transition: opacity 180ms ease, transform 180ms ease;
      }

      .cardhub-root.open .cardhub-panel {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      .cardhub-root.open .cardhub-panel {
        animation: cardhub-panel-in 240ms ease;
      }

      .cardhub-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
        border-bottom: 1px solid rgba(var(--cardhub-border-rgb), 0.6);
      }

      .cardhub-title__main {
        font-size: 26px;
        letter-spacing: 2px;
      }

      .cardhub-title__sub {
        font-size: 12px;
        color: var(--cardhub-text-muted);
        margin-left: 10px;
      }

      .cardhub-actions {
        display: flex;
        gap: 10px;
      }

      .cardhub-theme-trigger {
        border: none;
        background: rgba(var(--cardhub-border-rgb), 0.35);
        color: var(--cardhub-text);
        width: 34px;
        height: 34px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 160ms ease, transform 120ms ease;
      }

      .cardhub-theme-trigger:hover {
        background: rgba(var(--cardhub-border-rgb), 0.6);
      }

      .cardhub-theme-trigger:active {
        transform: scale(0.96);
      }

      .cardhub-settings-trigger {
        border: none;
        background: rgba(var(--cardhub-border-rgb), 0.35);
        color: var(--cardhub-text);
        width: 34px;
        height: 34px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 160ms ease, transform 120ms ease;
      }

      .cardhub-settings-trigger:hover {
        background: rgba(var(--cardhub-border-rgb), 0.6);
      }

      .cardhub-settings-trigger:active {
        transform: scale(0.96);
      }

      .cardhub-close {
        border: none;
        background: rgba(var(--cardhub-border-rgb), 0.4);
        color: var(--cardhub-text);
        width: 34px;
        height: 34px;
        border-radius: 999px;
        font-size: 20px;
        line-height: 34px;
        text-align: center;
        cursor: pointer;
        transition: background-color 160ms ease, transform 120ms ease;
      }

      .cardhub-close:hover {
        background: rgba(var(--cardhub-border-rgb), 0.65);
      }

      .cardhub-close:active {
        transform: scale(0.96);
      }

      .cardhub-toolbar {
        display: flex;
        gap: 8px;
        padding: 12px 20px;
        flex-wrap: wrap;
        align-items: center;
      }

      .cardhub-search {
        flex: 1;
        min-width: 180px;
        border-radius: 999px;
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.7);
        padding: 6px 12px;
        background: var(--cardhub-surface);
        color: var(--cardhub-text);
        height: 32px;
      }

      .cardhub-button {
        border: 1px solid rgba(var(--cardhub-accent-rgb), 0.6);
        padding: 6px 14px;
        border-radius: 999px;
        background: linear-gradient(
          135deg,
          rgba(var(--cardhub-accent-rgb), 0.95) 0%,
          rgba(var(--cardhub-accent-rgb), 0.75) 100%
        );
        color: var(--cardhub-accent-text);
        cursor: pointer;
        font-size: 12px;
        height: 32px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background-color 160ms ease, transform 120ms ease, box-shadow 160ms ease, color 160ms ease;
        box-shadow:
          0 8px 18px rgba(var(--cardhub-accent-rgb), 0.25),
          inset 0 1px 0 rgba(255, 255, 255, 0.55);
      }

      .cardhub-button:hover {
        background: linear-gradient(
          135deg,
          rgba(var(--cardhub-accent-rgb), 0.98) 0%,
          rgba(var(--cardhub-accent-rgb), 0.82) 100%
        );
        color: var(--cardhub-accent-text);
        box-shadow:
          0 10px 22px rgba(var(--cardhub-accent-rgb), 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.65);
      }

      .cardhub-button:active {
        transform: translateY(1px);
      }

      .cardhub-button.is-ghost {
        background: rgba(var(--cardhub-surface-rgb), 0.92);
        color: var(--cardhub-text);
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.75);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.55);
      }

      .cardhub-button.is-ghost:hover {
        background: rgba(var(--cardhub-surface-rgb), 0.95);
        border-color: rgba(var(--cardhub-border-rgb), 0.85);
      }

      .cardhub-import-input {
        display: none;
      }

      .cardhub-button,
      .cardhub-export__btn,
      .cardhub-batch__btn,
      .cardhub-theme__btn,
      .cardhub-settings__btn,
      .cardhub-confirm__button {
        height: 32px;
        padding: 6px 12px;
        line-height: 1;
        font-weight: 500;
        letter-spacing: 0.2px;
      }

      .cardhub-body {
        display: grid;
        grid-template-columns: minmax(160px, 220px) 1fr;
        gap: 0;
        flex: 1;
        min-height: 0;
      }

      .cardhub-sidebar {
        padding: 20px;
        border-right: 1px solid rgba(var(--cardhub-border-rgb), 0.6);
        display: flex;
        flex-direction: column;
        gap: 12px;
        overflow: auto;
        min-height: 0;
      }

      .cardhub-chip-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .cardhub-divider {
        height: 2px;
        width: 100%;
        background: linear-gradient(
          90deg,
          rgba(var(--cardhub-border-rgb), 0) 0%,
          rgba(var(--cardhub-border-rgb), 0.7) 50%,
          rgba(var(--cardhub-border-rgb), 0) 100%
        );
        margin: 8px 0;
      }

      .cardhub-section-title {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: var(--cardhub-text);
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: 600;
      }

      .cardhub-section-title::before {
        content: "";
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: rgba(var(--cardhub-accent-rgb), 0.6);
        box-shadow:
          0 0 0 2px rgba(var(--cardhub-accent-rgb), 0.2),
          0 4px 8px rgba(43, 32, 24, 0.12);
      }

      .cardhub-chip {
        text-align: left;
        border: none;
        background: rgba(var(--cardhub-surface-alt-rgb), 0.92);
        border-radius: 12px;
        padding: 8px 10px;
        cursor: pointer;
        font-size: 12px;
        color: var(--cardhub-text);
        transition: background-color 160ms ease, color 160ms ease, transform 120ms ease, box-shadow 160ms ease;
        box-shadow:
          0 6px 14px rgba(var(--cardhub-border-rgb), 0.18),
          0 0 0 1px rgba(var(--cardhub-border-rgb), 0.35);
      }

      .cardhub-chip.is-active {
        background: var(--cardhub-accent-strong);
        color: var(--cardhub-accent-strong-text);
        box-shadow:
          0 12px 22px rgba(43, 32, 24, 0.2),
          0 0 0 1px rgba(var(--cardhub-accent-strong-rgb), 0.45);
      }

      .cardhub-chip:not(.is-active):hover {
        background: rgba(var(--cardhub-surface-rgb), 0.98);
        transform: translateY(-1px);
      }

      .cardhub-root {
        --cardhub-tag-row-height: 28px;
        --cardhub-tag-row-gap: 6px;
        --cardhub-tag-row-padding: 20px;
      }

      .cardhub-tag-filter {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding: 10px;
        border-radius: 16px;
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.55);
        background: rgba(var(--cardhub-surface-rgb), 0.85);
        box-shadow: 0 10px 18px rgba(43, 32, 24, 0.08);
      }

      .cardhub-tag-filter__chip {
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.85);
        background: rgba(var(--cardhub-surface-alt-rgb), 0.96);
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 12px;
        color: var(--cardhub-text);
        cursor: pointer;
        transition: background-color 160ms ease, color 160ms ease, border-color 160ms ease, transform 120ms ease, box-shadow 160ms ease;
        box-shadow: 0 6px 14px rgba(var(--cardhub-border-rgb), 0.24);
      }

      .cardhub-tag-filter__chip.is-active {
        background: var(--cardhub-accent-strong);
        color: var(--cardhub-accent-strong-text);
        border-color: transparent;
        box-shadow: 0 10px 20px rgba(43, 32, 24, 0.18);
      }

      .cardhub-tag-filter__chip:not(.is-active):hover {
        border-color: rgba(var(--cardhub-border-rgb), 0.85);
        background: rgba(var(--cardhub-surface-rgb), 0.98);
        transform: translateY(-1px);
      }

      .cardhub-chip--clear {
        margin-top: 8px;
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.65);
        background: rgba(var(--cardhub-surface-alt-rgb), 0.85);
        color: var(--cardhub-text-muted);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
      }

      .cardhub-chip--more {
        margin-top: 4px;
        border: 1px solid rgba(var(--cardhub-accent-rgb), 0.45);
        background: linear-gradient(
          135deg,
          rgba(var(--cardhub-accent-rgb), 0.2) 0%,
          rgba(var(--cardhub-surface-alt-rgb), 0.95) 100%
        );
        color: var(--cardhub-accent-strong);
        box-shadow:
          0 8px 16px rgba(var(--cardhub-accent-rgb), 0.18),
          inset 0 1px 0 rgba(255, 255, 255, 0.6);
      }

      .cardhub-chip--more:hover {
        background: linear-gradient(
          135deg,
          rgba(var(--cardhub-accent-rgb), 0.28) 0%,
          rgba(var(--cardhub-surface-alt-rgb), 0.98) 100%
        );
        border-color: rgba(var(--cardhub-accent-rgb), 0.6);
      }

      .cardhub-filter-row {
        display: grid;
        gap: 12px;
      }

      .cardhub-filter-block {
        display: grid;
        gap: 8px;
        padding: 10px 12px;
        border-radius: 16px;
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.6);
        background: rgba(var(--cardhub-surface-rgb), 0.85);
        box-shadow: 0 10px 18px rgba(43, 32, 24, 0.08);
      }

      .cardhub-filter-block + .cardhub-filter-block {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px dashed rgba(var(--cardhub-border-rgb), 0.35);
      }

      .cardhub-content {
        padding: 20px;
        overflow: auto;
        flex: 1;
        min-height: 0;
      }

      .cardhub-grid-wrap {
        display: grid;
        gap: 12px;
      }

      .cardhub-pagination {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 10px;
        flex-wrap: wrap;
      }

      .cardhub-pagination__status {
        font-size: 12px;
        color: var(--cardhub-text-muted);
      }

      .cardhub-pagination__actions {
        display: flex;
        gap: 8px;
        align-items: center;
        margin-right: auto;
      }

      .cardhub-pagination__button {
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.8);
        background: rgba(var(--cardhub-surface-rgb), 0.95);
        color: var(--cardhub-text-muted);
        border-radius: 999px;
        padding: 4px 10px;
        font-size: 11px;
        cursor: pointer;
        transition: background-color 160ms ease, border-color 160ms ease, transform 120ms ease, box-shadow 160ms ease;
        box-shadow: 0 6px 14px rgba(43, 32, 24, 0.08);
      }

      .cardhub-pagination__button:disabled {
        opacity: 0.4;
        cursor: default;
      }

      .cardhub-pagination__button:not(:disabled):hover {
        background: rgba(255, 255, 255, 1);
        border-color: rgba(var(--cardhub-border-rgb), 0.95);
        transform: translateY(-1px);
        box-shadow: 0 8px 16px rgba(43, 32, 24, 0.12);
      }

      .cardhub-pagination__button:not(:disabled):active {
        transform: translateY(0);
      }

      .cardhub-loading,
      .cardhub-empty {
        padding: 40px 0;
        text-align: center;
        color: var(--cardhub-text-muted);
      }

      .cardhub-grid {
        display: grid;
        gap: 14px;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        justify-items: center;
      }

      .cardhub-card {
        background: rgba(var(--cardhub-surface-rgb), 0.9);
        border-radius: 18px;
        padding: 14px;
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 12px;
        align-items: center;
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.5);
        cursor: pointer;
        transition: transform 140ms ease, box-shadow 180ms ease, border-color 180ms ease;
        width: 100%;
        max-width: 260px;
      }

      .cardhub-card:hover {
        transform: translateY(-2px);
        border-color: rgba(var(--cardhub-border-rgb), 0.8);
        box-shadow: var(--cardhub-shadow-soft);
      }

      .cardhub-card.is-duplicate {
        border-color: rgba(200, 110, 80, 0.75);
        box-shadow:
          0 12px 20px rgba(200, 110, 80, 0.18),
          inset 0 0 0 1px rgba(200, 110, 80, 0.25);
      }

      .cardhub-card:active {
        transform: translateY(0);
      }

      .cardhub-card__avatar {
        width: var(--cardhub-avatar-size, 42px);
        height: var(--cardhub-avatar-size, 42px);
        border-radius: 12px;
        background: linear-gradient(135deg, var(--cardhub-bg-start), var(--cardhub-accent));
        background-size: cover;
        background-position: center;
        color: var(--cardhub-text);
        display: grid;
        place-items: center;
        font-weight: 700;
      }

      .cardhub-card__avatar.has-avatar span {
        display: none;
      }

      .cardhub-card__info {
        min-width: 0;
      }

      .cardhub-card__name {
        font-size: 14px;
        font-weight: 600;
        min-width: 0;
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .cardhub-card__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .cardhub-fav {
        border: none;
        background: rgba(var(--cardhub-border-rgb), 0.3);
        color: var(--cardhub-text-muted);
        width: 26px;
        height: 26px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background-color 160ms ease, color 160ms ease, transform 120ms ease;
      }

      .cardhub-fav.is-active {
        background: var(--cardhub-accent-strong);
        color: var(--cardhub-accent-strong-text);
        box-shadow:
          0 6px 14px rgba(var(--cardhub-accent-strong-rgb), 0.35),
          0 0 0 2px rgba(var(--cardhub-accent-strong-rgb), 0.25);
        transform: scale(1.06);
      }

      .cardhub-fav:hover {
        background: rgba(var(--cardhub-border-rgb), 0.55);
      }

      .cardhub-fav:active {
        transform: scale(0.96);
      }

      .cardhub-card__meta {
        display: flex;
        gap: 8px;
        font-size: 11px;
        color: var(--cardhub-text-muted);
      }

      .cardhub-card__note {
        margin-top: 6px;
        font-size: 11px;
        color: var(--cardhub-text-muted);
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        word-break: break-word;
      }

      .cardhub-card__tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 8px;
        align-items: center;
      }

      .cardhub-tag {
        border: 1px solid rgba(var(--cardhub-accent-strong-rgb), 0.45);
        background: rgba(var(--cardhub-accent-strong-rgb), 0.18);
        border-radius: 999px;
        padding: 4px 8px;
        font-size: 11px;
        color: var(--cardhub-text);
        cursor: pointer;
        transition: background-color 160ms ease, border-color 160ms ease, transform 120ms ease;
      }

      .cardhub-tag:hover {
        background: rgba(var(--cardhub-surface-rgb), 0.98);
        border-color: rgba(var(--cardhub-border-rgb), 0.9);
        transform: translateY(-1px);
      }

      .cardhub-tag__remove {
        margin-left: 4px;
        font-weight: 700;
        color: var(--cardhub-text);
      }

      .cardhub-tag.is-add {
        background: transparent;
        border-style: dashed;
        color: var(--cardhub-text);
      }

      .cardhub-tag-input {
        border: 1px dashed rgba(var(--cardhub-border-rgb), 0.9);
        background: rgba(var(--cardhub-surface-rgb), 0.98);
        border-radius: 999px;
        padding: 4px 10px;
        font-size: 11px;
        min-width: 80px;
        max-width: 100%;
        color: var(--cardhub-text);
        outline: none;
        height: 24px;
        line-height: 16px;
      }

      .cardhub-tag-edit {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
        max-width: 100%;
      }

      .cardhub-tag-confirm {
        border: none;
        background: rgba(var(--cardhub-accent-rgb), 0.2);
        color: var(--cardhub-text);
        width: 22px;
        height: 22px;
        border-radius: 999px;
        cursor: pointer;
        font-size: 12px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .cardhub-tag-input:focus {
        border-color: rgba(var(--cardhub-border-rgb), 1);
      }

      .cardhub-card__action {
        grid-column: span 2;
        margin-top: 10px;
        border: none;
        background: linear-gradient(
          135deg,
          rgba(var(--cardhub-accent-strong-rgb), 0.98) 0%,
          rgba(var(--cardhub-accent-strong-rgb), 0.78) 100%
        );
        color: var(--cardhub-accent-strong-text);
        padding: 6px 12px;
        border-radius: 12px;
        font-size: 12px;
        cursor: pointer;
        transition: transform 120ms ease, box-shadow 160ms ease, background-color 160ms ease;
        box-shadow:
          0 10px 22px rgba(43, 32, 24, 0.22),
          0 0 0 1px rgba(var(--cardhub-accent-strong-rgb), 0.35);
      }

      .cardhub-card__actions {
        grid-column: span 2;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-top: 10px;
      }

      .cardhub-card__action.is-secondary {
        background: rgba(var(--cardhub-surface-alt-rgb), 0.98);
        color: var(--cardhub-text);
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.6);
        box-shadow:
          0 10px 20px rgba(43, 32, 24, 0.16),
          0 0 0 1px rgba(var(--cardhub-border-rgb), 0.55);
      }

      .cardhub-card__action:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 14px rgba(43, 32, 24, 0.15);
      }

      .cardhub-card__action:active {
        transform: translateY(0);
      }

      .cardhub-preview__close {
        position: absolute;
        top: 14px;
        right: 14px;
        border: none;
        width: 30px;
        height: 30px;
        border-radius: 999px;
        background: rgba(var(--cardhub-border-rgb), 0.5);
        color: var(--cardhub-text);
        font-size: 18px;
        cursor: pointer;
        transition: background-color 160ms ease, transform 120ms ease;
      }

      .cardhub-preview__close:hover {
        background: rgba(var(--cardhub-border-rgb), 0.75);
      }

      .cardhub-preview__close:active {
        transform: scale(0.96);
      }

      .cardhub-preview__name {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 20px;
        font-weight: 700;
      }

      .cardhub-note-trigger {
        border: none;
        width: 26px;
        height: 26px;
        border-radius: 999px;
        background: rgba(var(--cardhub-border-rgb), 0.35);
        color: var(--cardhub-text);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 12px;
        transition: background-color 160ms ease, transform 120ms ease;
      }

      .cardhub-note-trigger:hover {
        background: rgba(var(--cardhub-border-rgb), 0.55);
      }

      .cardhub-note-trigger:active {
        transform: scale(0.96);
      }

      .cardhub-preview__meta {
        display: flex;
        gap: 10px;
        font-size: 12px;
        color: var(--cardhub-text-muted);
      }

      .cardhub-preview__tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .cardhub-preview__tag {
        padding: 6px 10px;
        border-radius: 999px;
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.6);
        background: rgba(var(--cardhub-surface-rgb), 0.98);
        font-size: 12px;
        color: var(--cardhub-text-muted);
      }

      .cardhub-manage {
        background: rgba(24, 16, 10, 0.45);
        backdrop-filter: blur(6px);
        z-index: 200100;
      }

      .cardhub-manage__panel {
        width: min(760px, 94vw);
        max-height: 88vh;
        background: var(--cardhub-surface-alt);
        border-radius: 26px;
        box-shadow: var(--cardhub-shadow-strong);
        padding: 22px;
        position: relative;
        display: grid;
        gap: 16px;
        overflow: auto;
        overflow-x: hidden;
      }

      .cardhub-manage__top {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 16px;
        align-items: start;
      }

      .cardhub-manage__media {
        width: 220px;
        aspect-ratio: 3 / 4;
        height: auto;
        border-radius: 18px;
        background: rgba(var(--cardhub-surface-alt-rgb), 0.9);
        display: grid;
        place-items: center;
        overflow: hidden;
      }

      .cardhub-manage__media img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .cardhub-manage__summary {
        display: grid;
        gap: 6px;
      }

      .cardhub-manage__overview {
        display: grid;
        gap: 10px;
        margin-top: 10px;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      }

      .cardhub-manage__overview-card {
        background: rgba(var(--cardhub-surface-rgb), 0.85);
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.5);
        border-radius: 14px;
        padding: 10px 12px;
        display: grid;
        gap: 4px;
      }

      .cardhub-manage__overview-label {
        font-size: 10px;
        color: var(--cardhub-text-muted);
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .cardhub-manage__overview-value {
        font-size: 13px;
        font-weight: 600;
        color: var(--cardhub-text);
      }

      .cardhub-manage__overview-hint {
        font-size: 11px;
        color: var(--cardhub-text-muted);
      }

      .cardhub-manage__overview-action {
        justify-self: start;
        border: none;
        background: transparent;
        color: var(--cardhub-text-muted);
        font-size: 11px;
        cursor: pointer;
        padding: 0;
      }

      .cardhub-manage__section {
        display: grid;
        gap: 8px;
      }

      .cardhub-manage__details {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }

      .cardhub-manage__detail {
        background: rgba(var(--cardhub-surface-rgb), 0.98);
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.5);
        border-radius: 16px;
        padding: 12px 14px;
        display: grid;
        gap: 6px;
      }

      .cardhub-manage__detail-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 8px;
      }

      .cardhub-manage__detail-label {
        font-size: 11px;
        color: var(--cardhub-text-muted);
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .cardhub-manage__detail-edit {
        border: none;
        background: rgba(var(--cardhub-border-rgb), 0.35);
        color: var(--cardhub-text);
        width: 22px;
        height: 22px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 12px;
        margin-top: 2px;
        transition: background-color 160ms ease, transform 120ms ease;
      }

      .cardhub-manage__detail-edit:hover {
        background: rgba(var(--cardhub-border-rgb), 0.55);
      }

      .cardhub-manage__detail-edit:active {
        transform: scale(0.96);
      }

      .cardhub-manage__detail-content {
        font-size: 12px;
        line-height: 1.5;
        color: var(--cardhub-text);
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        word-break: break-word;
      }

      .cardhub-manage__detail-toggle {
        justify-self: end;
        border: none;
        background: transparent;
        color: var(--cardhub-text-muted);
        font-size: 11px;
        cursor: pointer;
        padding: 2px 0;
      }

      .cardhub-manage__toggle {
        border: none;
        background: transparent;
        color: var(--cardhub-text-muted);
        font-size: 11px;
        cursor: pointer;
      }

      .cardhub-manage__label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        font-size: 12px;
        color: var(--cardhub-text-muted);
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .cardhub-manage__btn {
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.7);
        border-radius: 12px;
        padding: 6px 12px;
        font-size: 12px;
        cursor: pointer;
        text-transform: none;
        background: rgba(var(--cardhub-surface-rgb), 0.9);
        color: var(--cardhub-text);
        transition: background-color 160ms ease, transform 120ms ease, box-shadow 160ms ease, border-color 160ms ease;
      }

      .cardhub-manage__btn.is-primary {
        background: linear-gradient(
          135deg,
          rgba(var(--cardhub-accent-strong-rgb), 0.98) 0%,
          rgba(var(--cardhub-accent-strong-rgb), 0.78) 100%
        );
        color: var(--cardhub-accent-strong-text);
        border-color: rgba(var(--cardhub-accent-strong-rgb), 0.6);
        box-shadow:
          0 8px 18px rgba(43, 32, 24, 0.22),
          inset 0 1px 0 rgba(255, 255, 255, 0.25);
      }

      .cardhub-manage__btn.is-secondary {
        background: rgba(var(--cardhub-surface-alt-rgb), 0.98);
        color: var(--cardhub-text);
        border-color: rgba(var(--cardhub-border-rgb), 0.8);
      }

      .cardhub-manage__jump-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }

      .cardhub-manage__btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 14px rgba(43, 32, 24, 0.15);
      }

      .cardhub-manage__btn.is-primary:hover {
        background: linear-gradient(
          135deg,
          rgba(var(--cardhub-accent-strong-rgb), 1) 0%,
          rgba(var(--cardhub-accent-strong-rgb), 0.82) 100%
        );
      }

      .cardhub-manage__btn.is-secondary:hover {
        background: rgba(var(--cardhub-surface-alt-rgb), 1);
      }

      .cardhub-manage__btn:active {
        transform: translateY(0);
      }

      .cardhub-manage__content {
        background: rgba(var(--cardhub-surface-rgb), 0.98);
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.5);
        border-radius: 16px;
        padding: 12px 14px;
        font-size: 12px;
        line-height: 1.5;
        color: var(--cardhub-text);
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        word-break: break-word;
      }

      .cardhub-openings__panel {
        width: min(720px, 92vw);
        max-width: 720px;
        max-height: 80vh;
        background: var(--cardhub-surface-alt);
        border-radius: 22px;
        box-shadow: var(--cardhub-shadow-strong);
        padding: 18px 20px;
        display: grid;
        gap: 10px;
        overflow: auto;
        overflow-x: hidden;
      }

      .cardhub-openings {
        background: rgba(24, 16, 10, 0.45);
        backdrop-filter: blur(6px);
        z-index: 200300;
      }

      .cardhub-worldbook {
        background: rgba(24, 16, 10, 0.45);
        backdrop-filter: blur(6px);
        z-index: 200310;
      }

      .cardhub-worldbook__panel {
        width: min(720px, 92vw);
        max-height: 80vh;
        background: var(--cardhub-surface-alt);
        border-radius: 22px;
        box-shadow: var(--cardhub-shadow-strong);
        padding: 18px 20px;
        display: grid;
        gap: 10px;
        overflow: auto;
        overflow-x: hidden;
      }

      .cardhub-worldbook__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .cardhub-worldbook__title {
        font-size: 16px;
        font-weight: 600;
        color: var(--cardhub-text);
      }

      .cardhub-worldbook__meta {
        display: flex;
        gap: 8px;
        font-size: 11px;
        color: var(--cardhub-text-muted);
      }

      .cardhub-worldbook__list {
        display: grid;
        gap: 10px;
      }

      .cardhub-worldbook__item {
        text-align: left;
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.5);
        background: rgba(var(--cardhub-surface-rgb), 0.98);
        border-radius: 14px;
        padding: 10px 12px;
        cursor: pointer;
        transition: transform 120ms ease, box-shadow 160ms ease;
      }

      .cardhub-worldbook__item:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 16px rgba(43, 32, 24, 0.12);
      }

      .cardhub-worldbook__item-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: var(--cardhub-text);
        flex-wrap: wrap;
      }

      .cardhub-worldbook__item-index {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 999px;
        background: rgba(var(--cardhub-border-rgb), 0.15);
        color: var(--cardhub-text-muted);
        white-space: nowrap;
      }

      .cardhub-worldbook__item-name {
        font-weight: 600;
        color: var(--cardhub-text);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 100%;
      }

      .cardhub-worldbook__item-strategy {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 999px;
        background: rgba(var(--cardhub-border-rgb), 0.12);
        color: var(--cardhub-text-muted);
        white-space: nowrap;
      }

      .cardhub-worldbook__item-strategy.is-constant {
        background: rgba(38, 110, 207, 0.16);
        color: #2d6bd6;
      }

      .cardhub-worldbook__item-strategy.is-selective {
        background: rgba(46, 159, 83, 0.16);
        color: #2f8f54;
      }

      .cardhub-worldbook__item-strategy.is-vectorized {
        background: rgba(130, 106, 224, 0.16);
        color: #6f5bd1;
      }

      .cardhub-worldbook__item-disabled {
        font-size: 11px;
        color: var(--cardhub-text-muted);
      }

      .cardhub-worldbook__item-preview {
        margin-top: 4px;
        font-size: 12px;
        color: var(--cardhub-text-muted);
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        word-break: break-word;
      }

      .cardhub-openings__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 6px;
      }

      .cardhub-openings__title {
        font-size: 16px;
        font-weight: 600;
        color: var(--cardhub-text);
      }

      .cardhub-openings__meta {
        display: flex;
        gap: 8px;
        font-size: 11px;
        color: var(--cardhub-text-muted);
        margin-bottom: 10px;
      }

      .cardhub-openings__list {
        display: grid;
        gap: 10px;
      }

      .cardhub-openings__item {
        text-align: left;
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.5);
        background: rgba(var(--cardhub-surface-rgb), 0.98);
        border-radius: 14px;
        padding: 10px 12px;
        cursor: pointer;
        transition: transform 120ms ease, box-shadow 160ms ease;
      }

      .cardhub-openings__item:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 16px rgba(43, 32, 24, 0.12);
      }

      .cardhub-openings__item-title {
        font-size: 11px;
        color: var(--cardhub-text-muted);
        margin-bottom: 4px;
      }

      .cardhub-openings__item-preview {
        font-size: 12px;
        color: var(--cardhub-text);
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        word-break: break-word;
      }

      .cardhub-manage__opening-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 11px;
        color: var(--cardhub-text-muted);
        margin-bottom: 8px;
      }

      .cardhub-manage__opening-meta-value {
        color: var(--cardhub-text);
        font-weight: 600;
      }

      .cardhub-manage__opening {
        padding: 6px 0;
        border-bottom: 1px dashed rgba(var(--cardhub-border-rgb), 0.5);
      }

      .cardhub-manage__opening-title {
        font-size: 11px;
        color: var(--cardhub-text-muted);
        margin-bottom: 4px;
      }

      .cardhub-manage__opening-body {
        font-size: 12px;
        color: var(--cardhub-text);
        line-height: 1.5;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        word-break: break-word;
      }

      .cardhub-manage__opening-toggle {
        margin-top: 6px;
        border: none;
        background: transparent;
        color: var(--cardhub-text-muted);
        font-size: 11px;
        cursor: pointer;
        padding: 0;
      }

      .cardhub-manage__opening:last-child {
        border-bottom: none;
      }

      .cardhub-manage__chat {
        display: grid;
        gap: 10px;
      }

      .cardhub-manage__chat-row {
        display: grid;
        grid-template-columns: minmax(140px, 220px) 1fr;
        gap: 12px;
        font-size: 12px;
        color: var(--cardhub-text);
        align-items: start;
        padding: 6px 8px;
        border-radius: 10px;
        cursor: pointer;
      }

      .cardhub-manage__chat-row:hover {
        background: rgba(var(--cardhub-border-rgb), 0.2);
      }

      .cardhub-manage__chat-main {
        display: grid;
        gap: 4px;
      }

      .cardhub-manage__chat-name {
        flex: 0 0 auto;
        font-weight: 600;
        color: var(--cardhub-text);
        word-break: break-word;
      }

      .cardhub-manage__chat-label {
        font-size: 11px;
        color: var(--cardhub-text-muted);
        word-break: break-word;
      }

      .cardhub-manage__chat-text {
        color: var(--cardhub-text);
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        overflow-wrap: anywhere;
        word-break: break-word;
      }

      .cardhub-manage__pager {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin-top: 8px;
      }

      .cardhub-manage__pager-btn {
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.6);
        background: rgba(var(--cardhub-surface-rgb), 0.95);
        color: var(--cardhub-text-muted);
        border-radius: 999px;
        padding: 4px 10px;
        font-size: 11px;
        cursor: pointer;
      }

      .cardhub-manage__pager-btn:disabled {
        opacity: 0.5;
        cursor: default;
      }

      .cardhub-manage__pager-status {
        font-size: 11px;
        color: var(--cardhub-text-muted);
      }

      .cardhub-manage__empty {
        font-size: 12px;
        color: var(--cardhub-text-muted);
      }

      .cardhub-manage__actions {
        padding-top: 12px;
        border-top: 1px dashed rgba(var(--cardhub-border-rgb), 0.6);
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .cardhub-confirm {
        background: rgba(24, 16, 10, 0.55);
        backdrop-filter: blur(6px);
        z-index: 200800;
      }

      .cardhub-confirm__panel {
        width: min(460px, 92vw);
        background: var(--cardhub-surface-alt);
        border-radius: 22px;
        box-shadow: var(--cardhub-shadow-strong);
        padding: 18px 20px;
        display: grid;
        gap: 12px;
      }

      .cardhub-confirm__title {
        font-size: 16px;
        font-weight: 600;
        color: var(--cardhub-text);
      }

      .cardhub-confirm__message {
        font-size: 13px;
        line-height: 1.5;
        color: var(--cardhub-text);
        white-space: pre-wrap;
      }

      .cardhub-confirm__actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        flex-wrap: wrap;
      }

      .cardhub-confirm__button {
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.6);
        border-radius: 999px;
        font-size: 12px;
        cursor: pointer;
        transition: transform 120ms ease, box-shadow 160ms ease, background-color 160ms ease, border-color 160ms ease;
      }

      .cardhub-confirm__button.is-confirm {
        background: linear-gradient(
          135deg,
          rgba(var(--cardhub-accent-rgb), 0.95) 0%,
          rgba(var(--cardhub-accent-rgb), 0.72) 100%
        );
        color: var(--cardhub-accent-text);
        border-color: rgba(var(--cardhub-accent-rgb), 0.55);
      }

      .cardhub-confirm__button.is-cancel {
        background: rgba(var(--cardhub-surface-rgb), 0.85);
        color: var(--cardhub-text-muted);
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.6);
      }

      .cardhub-confirm__button.is-danger {
        background: linear-gradient(
          135deg,
          rgba(var(--cardhub-accent-strong-rgb), 0.98) 0%,
          rgba(var(--cardhub-accent-strong-rgb), 0.78) 100%
        );
        color: var(--cardhub-accent-strong-text);
        border-color: rgba(var(--cardhub-accent-strong-rgb), 0.55);
      }

      .cardhub-confirm__button:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 14px rgba(43, 32, 24, 0.18);
      }

      .cardhub-confirm__button:active {
        transform: translateY(0);
      }

      .cardhub-root .cardhub-modal {
        position: fixed !important;
        inset: 0 !important;
        display: grid !important;
        place-items: center !important;
        width: 100vw !important;
        height: 100vh !important;
        height: 100dvh !important;
      }

      .cardhub-root .cardhub-modal__panel {
        position: fixed !important;
        left: 50vw !important;
        top: 50vh !important;
        transform: translate(-50%, -50%) !important;
        margin: 0 !important;
      }

      .cardhub-note {
        background: rgba(24, 16, 10, 0.55);
        backdrop-filter: blur(6px);
        z-index: 200900;
      }

      .cardhub-settings {
        z-index: 200700;
      }

      .cardhub-settings__panel {
        z-index: 200701;
      }

      .cardhub-note__panel {
        width: min(520px, 92vw);
        background: var(--cardhub-surface-alt);
        border-radius: 22px;
        box-shadow: var(--cardhub-shadow-strong);
        padding: 18px 20px;
        display: grid;
        gap: 12px;
        position: relative;
      }

      .cardhub-note__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .cardhub-note__title {
        font-size: 16px;
        font-weight: 600;
        color: var(--cardhub-text);
      }

      .cardhub-note__input {
        width: 100%;
        min-height: 120px;
        border-radius: 14px;
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.6);
        padding: 10px 12px;
        font-size: 13px;
        color: var(--cardhub-text);
        background: rgba(var(--cardhub-surface-rgb), 0.9);
        resize: vertical;
      }

      .cardhub-note__actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }

      .cardhub-note__btn {
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.6);
        border-radius: 999px;
        padding: 8px 14px;
        font-size: 12px;
        cursor: pointer;
        transition: transform 120ms ease, box-shadow 160ms ease, background-color 160ms ease;
      }

      .cardhub-note__btn.is-primary {
        background: linear-gradient(
          135deg,
          rgba(var(--cardhub-accent-strong-rgb), 0.98) 0%,
          rgba(var(--cardhub-accent-strong-rgb), 0.78) 100%
        );
        color: var(--cardhub-accent-strong-text);
        border-color: rgba(var(--cardhub-accent-strong-rgb), 0.55);
      }

      .cardhub-edit {
        background: rgba(24, 16, 10, 0.55);
        backdrop-filter: blur(6px);
        z-index: 200900;
      }

      .cardhub-edit__panel {
        width: min(540px, 92vw);
        background: var(--cardhub-surface-alt);
        border-radius: 22px;
        box-shadow: var(--cardhub-shadow-strong);
        padding: 18px 20px;
        display: grid;
        gap: 12px;
        position: relative;
      }

      .cardhub-edit__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .cardhub-edit__title {
        font-size: 16px;
        font-weight: 600;
        color: var(--cardhub-text);
      }

      .cardhub-edit__input {
        width: 100%;
        min-height: 140px;
        border-radius: 14px;
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.6);
        padding: 10px 12px;
        font-size: 13px;
        color: var(--cardhub-text);
        background: rgba(var(--cardhub-surface-rgb), 0.9);
        resize: vertical;
      }

      .cardhub-edit__actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }

      .cardhub-edit__btn {
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.6);
        border-radius: 999px;
        padding: 8px 14px;
        font-size: 12px;
        cursor: pointer;
        transition: transform 120ms ease, box-shadow 160ms ease, background-color 160ms ease;
      }

      .cardhub-edit__btn.is-primary {
        background: linear-gradient(
          135deg,
          rgba(var(--cardhub-accent-strong-rgb), 0.98) 0%,
          rgba(var(--cardhub-accent-strong-rgb), 0.78) 100%
        );
        color: var(--cardhub-accent-strong-text);
        border-color: rgba(var(--cardhub-accent-strong-rgb), 0.55);
      }

      .cardhub-manage-viewer {
        background: rgba(24, 16, 10, 0.45);
        backdrop-filter: blur(6px);
        z-index: 200200;
      }

      .cardhub-manage-viewer__panel {
        width: min(620px, 92vw);
        max-height: 80vh;
        background: var(--cardhub-surface-alt);
        border-radius: 24px;
        box-shadow: var(--cardhub-shadow-strong);
        padding: 18px 20px;
        position: relative;
        display: grid;
        gap: 12px;
        overflow: auto;
        overflow-x: hidden;
      }

      .cardhub-manage-viewer__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .cardhub-manage-viewer__title {
        font-size: 16px;
        font-weight: 600;
      }

      .cardhub-manage-viewer__content {
        font-size: 13px;
        line-height: 1.6;
        color: var(--cardhub-text);
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        word-break: break-word;
      }

      .cardhub-note__btn.is-secondary {
        background: rgba(var(--cardhub-surface-rgb), 0.85);
        color: var(--cardhub-text-muted);
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.6);
      }

      .cardhub-note__btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 14px rgba(43, 32, 24, 0.18);
      }

      .cardhub-edit__btn.is-secondary {
        background: rgba(var(--cardhub-surface-rgb), 0.85);
        color: var(--cardhub-text-muted);
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.6);
      }

      .cardhub-edit__btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 14px rgba(43, 32, 24, 0.18);
      }

      .cardhub-tag-manager {
        background: rgba(24, 16, 10, 0.55);
        backdrop-filter: blur(6px);
        z-index: 200400;
      }

      .cardhub-tag-manager__panel {
        width: min(700px, 92vw);
        max-height: 82vh;
        background: var(--cardhub-surface-alt);
        border-radius: 22px;
        box-shadow: var(--cardhub-shadow-strong);
        padding: 18px 20px;
        display: grid;
        gap: 12px;
        overflow: hidden;
        grid-template-rows: auto auto 1fr;
        position: relative;
      }

      .cardhub-tag-manager__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .cardhub-tag-manager__title {
        font-size: 16px;
        font-weight: 600;
        color: var(--cardhub-text);
      }

      .cardhub-tag-manager__subtitle {
        font-size: 12px;
        color: var(--cardhub-text-muted);
      }

      .cardhub-tag-manager__tabs {
        display: flex;
        gap: 8px;
      }

      .cardhub-tag-manager__tab {
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.6);
        background: rgba(var(--cardhub-surface-rgb), 0.9);
        border-radius: 999px;
        padding: 6px 12px;
        font-size: 12px;
        color: var(--cardhub-text);
        cursor: pointer;
        transition: background-color 160ms ease, border-color 160ms ease, transform 120ms ease;
      }

      .cardhub-tag-manager__tab.is-active {
        background: var(--cardhub-accent-strong);
        color: var(--cardhub-accent-strong-text);
        border-color: transparent;
      }

      .cardhub-tag-manager__tab:not(.is-active):hover {
        transform: translateY(-1px);
      }

      .cardhub-tag-manager__section {
        display: grid;
        gap: 12px;
        min-height: 0;
      }

      .cardhub-tag-manager__actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .cardhub-tag-manager__spacer {
        flex: 1;
      }

      .cardhub-tag-manager__btn {
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.6);
        border-radius: 999px;
        padding: 6px 12px;
        font-size: 12px;
        cursor: pointer;
        transition: transform 120ms ease, box-shadow 160ms ease, background-color 160ms ease;
      }

      .cardhub-tag-manager__btn.is-primary {
        background: linear-gradient(
          135deg,
          rgba(var(--cardhub-accent-strong-rgb), 0.98) 0%,
          rgba(var(--cardhub-accent-strong-rgb), 0.78) 100%
        );
        color: var(--cardhub-accent-strong-text);
        border-color: rgba(var(--cardhub-accent-strong-rgb), 0.55);
      }

      .cardhub-tag-manager__btn.is-secondary {
        background: rgba(var(--cardhub-surface-rgb), 0.85);
        color: var(--cardhub-text-muted);
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.6);
      }

      .cardhub-tag-manager__btn:disabled {
        opacity: 0.5;
        cursor: default;
      }

      .cardhub-tag-manager__btn:not(:disabled):hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 14px rgba(43, 32, 24, 0.18);
      }

      .cardhub-tag-manager__list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        overflow: auto;
        padding-right: 4px;
      }

      .cardhub-tag-manager__chip {
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.5);
        background: rgba(var(--cardhub-surface-rgb), 0.9);
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 12px;
        color: var(--cardhub-text);
        cursor: pointer;
        transition: background-color 160ms ease, color 160ms ease, border-color 160ms ease, transform 120ms ease;
      }

      .cardhub-tag-manager__chip.is-active {
        background: var(--cardhub-accent-strong);
        color: var(--cardhub-accent-strong-text);
        border-color: transparent;
      }

      .cardhub-tag-manager__chip:hover {
        transform: translateY(-1px);
      }

      .cardhub-tag-manager__batch {
        display: grid;
        grid-template-rows: auto auto auto auto 1fr;
        min-height: 0;
      }

      .cardhub-tag-manager__batch .cardhub-batch__list {
        max-height: none;
        min-height: 0;
        overflow: auto;
      }

      .cardhub-export {
        background: rgba(24, 16, 10, 0.55);
        backdrop-filter: blur(6px);
        z-index: 200500;
      }

      .cardhub-export__panel {
        width: min(720px, 92vw);
        max-height: 86vh;
        background: var(--cardhub-surface-alt);
        border-radius: 22px;
        box-shadow: var(--cardhub-shadow-strong);
        padding: 18px 20px;
        display: grid;
        gap: 12px;
        overflow: hidden;
        margin: auto;
        position: relative;
      }

      .cardhub-export__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .cardhub-export__title {
        font-size: 16px;
        font-weight: 600;
        color: var(--cardhub-text);
      }

      .cardhub-export__subtitle {
        font-size: 12px;
        color: var(--cardhub-text-muted);
      }

      .cardhub-export__toolbar {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .cardhub-export__filters {
        display: grid;
        gap: 10px;
      }

      .cardhub-export__search {
        border-radius: 999px;
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.7);
        padding: 6px 12px;
        background: var(--cardhub-surface);
        color: var(--cardhub-text);
      }

      .cardhub-export__filter-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .cardhub-export__chip {
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.6);
        background: rgba(var(--cardhub-surface-rgb), 0.85);
        border-radius: 999px;
        padding: 4px 10px;
        font-size: 11px;
        color: var(--cardhub-text-muted);
        cursor: pointer;
        transition: background-color 160ms ease, color 160ms ease, border-color 160ms ease, transform 120ms ease;
      }

      .cardhub-export__chip.is-active {
        background: var(--cardhub-accent-strong);
        color: var(--cardhub-accent-strong-text);
        border-color: transparent;
      }

      .cardhub-export__chip:not(.is-active):hover {
        border-color: rgba(var(--cardhub-border-rgb), 0.85);
        background: rgba(var(--cardhub-surface-rgb), 0.98);
        transform: translateY(-1px);
      }

      .cardhub-export__chip--clear {
        margin-left: auto;
      }

      .cardhub-export__spacer {
        flex: 1;
      }

      .cardhub-export__btn {
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.6);
        border-radius: 999px;
        font-size: 12px;
        cursor: pointer;
        transition: transform 120ms ease, box-shadow 160ms ease, background-color 160ms ease;
      }

      .cardhub-export__btn.is-primary {
        background: linear-gradient(
          135deg,
          rgba(var(--cardhub-accent-rgb), 0.95) 0%,
          rgba(var(--cardhub-accent-rgb), 0.72) 100%
        );
        color: var(--cardhub-accent-text);
        border-color: rgba(var(--cardhub-accent-rgb), 0.55);
      }

      .cardhub-export__btn.is-secondary {
        background: rgba(var(--cardhub-surface-rgb), 0.85);
        color: var(--cardhub-text-muted);
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.6);
      }

      .cardhub-export__btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 14px rgba(43, 32, 24, 0.18);
      }

      .cardhub-export__list {
        display: grid;
        gap: 8px;
        overflow: auto;
        padding-right: 4px;
        max-height: 58vh;
      }

      .cardhub-export__item {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 10px;
        align-items: center;
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.5);
        border-radius: 14px;
        padding: 10px 12px;
        background: rgba(var(--cardhub-surface-rgb), 0.9);
        cursor: pointer;
      }

      .cardhub-export__item:hover {
        border-color: rgba(var(--cardhub-border-rgb), 0.8);
      }

      .cardhub-export__checkbox {
        width: 16px;
        height: 16px;
      }

      .cardhub-export__main {
        display: grid;
        gap: 4px;
      }

      .cardhub-export__name {
        font-size: 13px;
        font-weight: 600;
        color: var(--cardhub-text);
      }

      .cardhub-export__meta {
        display: flex;
        gap: 10px;
        font-size: 11px;
        color: var(--cardhub-text-muted);
      }

      .cardhub-export__tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .cardhub-export__tag {
        padding: 3px 8px;
        border-radius: 999px;
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.5);
        background: rgba(var(--cardhub-surface-rgb), 0.98);
        font-size: 10px;
        color: var(--cardhub-text-muted);
      }

      .cardhub-batch__filters {
        display: grid;
        gap: 6px;
      }

      .cardhub-batch__search {
        border-radius: 999px;
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.7);
        padding: 8px 12px;
        font-size: 13px;
        background: rgba(var(--cardhub-surface-rgb), 0.85);
      }

      .cardhub-batch__hint {
        font-size: 11px;
        color: var(--cardhub-text-muted);
      }

      .cardhub-batch__field input {
        width: 100%;
        border-radius: 12px;
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.7);
        padding: 10px 12px;
        font-size: 13px;
        background: rgba(var(--cardhub-surface-rgb), 0.85);
      }

      .cardhub-batch__suggestions {
        display: grid;
        gap: 8px;
      }

      .cardhub-batch__suggest-title {
        font-size: 12px;
        color: var(--cardhub-text-muted);
      }

      .cardhub-batch__suggest-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .cardhub-batch__chip {
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.6);
        background: rgba(var(--cardhub-surface-rgb), 0.9);
        border-radius: 999px;
        padding: 4px 8px;
        font-size: 11px;
        color: var(--cardhub-text);
        cursor: pointer;
        transition: background-color 160ms ease, color 160ms ease, border-color 160ms ease;
      }

      .cardhub-batch__chip.is-active {
        background: var(--cardhub-accent-strong);
        color: var(--cardhub-accent-strong-text);
        border-color: transparent;
      }

      .cardhub-batch__toolbar {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .cardhub-batch__spacer {
        flex: 1;
      }

      .cardhub-batch__btn {
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.6);
        border-radius: 999px;
        font-size: 12px;
        cursor: pointer;
        transition: transform 120ms ease, box-shadow 160ms ease, background-color 160ms ease;
      }

      .cardhub-batch__btn.is-primary {
        background: linear-gradient(
          135deg,
          rgba(var(--cardhub-accent-rgb), 0.95) 0%,
          rgba(var(--cardhub-accent-rgb), 0.72) 100%
        );
        color: var(--cardhub-accent-text);
        border-color: rgba(var(--cardhub-accent-rgb), 0.55);
      }

      .cardhub-batch__btn.is-secondary {
        background: rgba(var(--cardhub-surface-rgb), 0.85);
        color: var(--cardhub-text-muted);
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.7);
      }

      .cardhub-batch__btn.is-ghost {
        background: rgba(var(--cardhub-accent-rgb), 0.12);
        color: var(--cardhub-accent-strong);
        border-color: rgba(var(--cardhub-accent-rgb), 0.3);
      }

      .cardhub-batch__btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 14px rgba(43, 32, 24, 0.18);
      }

      .cardhub-batch__list {
        display: grid;
        gap: 8px;
        overflow: auto;
        padding-right: 6px;
        max-height: 42vh;
      }

      .cardhub-batch__item {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 12px;
        padding: 10px 12px;
        border-radius: 12px;
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.4);
        background: rgba(var(--cardhub-surface-alt-rgb), 0.75);
        cursor: pointer;
        transition: border-color 160ms ease;
      }

      .cardhub-batch__item:hover {
        border-color: rgba(var(--cardhub-border-rgb), 0.8);
      }

      .cardhub-batch__checkbox {
        width: 16px;
        height: 16px;
      }

      .cardhub-batch__main {
        display: grid;
        gap: 4px;
      }

      .cardhub-batch__name {
        font-size: 13px;
        font-weight: 600;
      }

      .cardhub-batch__meta {
        display: flex;
        gap: 10px;
        font-size: 11px;
        color: var(--cardhub-text-muted);
      }

      .cardhub-batch__tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .cardhub-batch__tag {
        padding: 3px 8px;
        border-radius: 999px;
        background: rgba(var(--cardhub-surface-rgb), 0.98);
        font-size: 10px;
        color: var(--cardhub-text-muted);
      }

      .cardhub-theme {
        background: rgba(24, 16, 10, 0.55);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 200600;
      }

      .cardhub-theme__panel {
        width: min(640px, 92vw);
        max-height: calc(100% - 48px);
        background: var(--cardhub-surface-alt);
        border-radius: 22px;
        box-shadow: var(--cardhub-shadow-strong);
        padding: 18px 20px;
        display: grid;
        gap: 14px;
        overflow: auto;
        margin: auto;
        position: relative;
      }

      .cardhub-theme__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .cardhub-theme__title {
        font-size: 16px;
        font-weight: 600;
        color: var(--cardhub-text);
      }

      .cardhub-theme__subtitle {
        font-size: 12px;
        color: var(--cardhub-text-muted);
      }

      .cardhub-theme__grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
      }

      .cardhub-theme__field {
        display: grid;
        gap: 6px;
        font-size: 12px;
        color: var(--cardhub-text);
        background: rgba(var(--cardhub-surface-rgb), 0.9);
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.5);
        border-radius: 14px;
        padding: 10px 12px;
      }

      .cardhub-theme__field input[type='color'] {
        width: 100%;
        height: 36px;
        border: none;
        background: transparent;
        cursor: pointer;
      }

      .cardhub-theme__actions {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      .cardhub-theme__presets {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .cardhub-theme__preset {
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.6);
        background: rgba(var(--cardhub-surface-rgb), 0.9);
        color: var(--cardhub-text-muted);
        border-radius: 999px;
        padding: 4px 10px;
        font-size: 11px;
        cursor: pointer;
        transition: background-color 160ms ease, border-color 160ms ease, transform 120ms ease;
      }

      .cardhub-theme__preset:hover {
        background: rgba(var(--cardhub-surface-rgb), 0.98);
        border-color: rgba(var(--cardhub-border-rgb), 0.9);
        transform: translateY(-1px);
      }

      .cardhub-theme__spacer {
        flex: 1;
      }

      .cardhub-theme__btn {
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.6);
        border-radius: 999px;
        font-size: 12px;
        cursor: pointer;
        transition: transform 120ms ease, box-shadow 160ms ease, background-color 160ms ease;
      }

      .cardhub-theme__btn.is-primary {
        background: linear-gradient(
          135deg,
          rgba(var(--cardhub-accent-rgb), 0.95) 0%,
          rgba(var(--cardhub-accent-rgb), 0.72) 100%
        );
        color: var(--cardhub-accent-text);
        border-color: rgba(var(--cardhub-accent-rgb), 0.55);
      }

      .cardhub-theme__btn.is-secondary {
        background: rgba(var(--cardhub-surface-rgb), 0.85);
        color: var(--cardhub-text-muted);
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.6);
      }

      .cardhub-theme__btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 14px rgba(43, 32, 24, 0.18);
      }

      .cardhub-settings__panel {
        width: min(560px, 92vw);
        max-height: calc(100% - 48px);
        background: var(--cardhub-surface-alt);
        border-radius: 22px;
        box-shadow: var(--cardhub-shadow-strong);
        padding: 18px 20px;
        display: grid;
        gap: 16px;
        overflow: auto;
        margin: auto;
        position: relative;
      }

      .cardhub-settings__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .cardhub-settings__title {
        font-size: 16px;
        font-weight: 600;
        color: var(--cardhub-text);
      }

      .cardhub-settings__subtitle {
        font-size: 12px;
        color: var(--cardhub-text-muted);
      }

      .cardhub-settings__section {
        display: grid;
        gap: 12px;
      }

      .cardhub-settings__label {
        font-size: 13px;
        font-weight: 600;
        color: var(--cardhub-text);
      }

      .cardhub-settings__hint {
        font-size: 12px;
        color: var(--cardhub-text-muted);
        line-height: 1.5;
      }

      .cardhub-settings__options {
        display: grid;
        gap: 10px;
      }

      .cardhub-settings__options--compact {
        gap: 8px;
      }

      .cardhub-settings__row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 8px 10px;
        border-radius: 12px;
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.4);
        background: rgba(var(--cardhub-surface-rgb), 0.75);
        font-size: 12px;
        color: var(--cardhub-text);
      }

      .cardhub-settings__select {
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.6);
        border-radius: 999px;
        padding: 4px 10px;
        font-size: 12px;
        background: rgba(var(--cardhub-surface-rgb), 0.95);
        color: var(--cardhub-text);
      }

      .cardhub-settings__toggle input {
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 6px;
        border: 2px solid rgba(var(--cardhub-accent-rgb), 0.5);
        background: rgba(var(--cardhub-surface-rgb), 0.95);
        display: grid;
        place-items: center;
        cursor: pointer;
        transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
      }

      .cardhub-settings__toggle input:checked {
        background: rgba(var(--cardhub-accent-rgb), 0.9);
        border-color: rgba(var(--cardhub-accent-rgb), 0.9);
        box-shadow: 0 6px 12px rgba(var(--cardhub-accent-rgb), 0.25);
      }

      .cardhub-settings__toggle input:checked::after {
        content: '';
        width: 8px;
        height: 8px;
        border-radius: 4px;
        background: var(--cardhub-accent-strong-text);
      }

      .cardhub-settings__radio {
        gap: 6px;
        justify-content: flex-start;
      }

      .cardhub-settings__option {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 10px;
        align-items: flex-start;
        padding: 10px 12px;
        border-radius: 14px;
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.6);
        background: rgba(var(--cardhub-surface-rgb), 0.92);
        box-shadow: 0 10px 18px rgba(43, 32, 24, 0.08);
        cursor: pointer;
      }

      .cardhub-settings__option.is-active {
        border-color: rgba(var(--cardhub-accent-rgb), 0.75);
        box-shadow:
          0 12px 22px rgba(43, 32, 24, 0.16),
          0 0 0 1px rgba(var(--cardhub-accent-rgb), 0.4);
      }

      .cardhub-settings__option.is-disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .cardhub-settings__option input {
        margin-top: 2px;
      }

      .cardhub-settings__option-body {
        display: grid;
        gap: 6px;
      }

      .cardhub-settings__option-title {
        font-size: 13px;
        font-weight: 600;
        color: var(--cardhub-text);
      }

      .cardhub-settings__option-desc {
        font-size: 12px;
        color: var(--cardhub-text-muted);
        line-height: 1.4;
      }

      .cardhub-settings__option-warn {
        font-size: 11px;
        color: #b94b3b;
      }

      .cardhub-settings__backup {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      .cardhub-settings__actions {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      .cardhub-settings__spacer {
        flex: 1;
      }

      .cardhub-settings__btn {
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.6);
        border-radius: 999px;
        font-size: 12px;
        cursor: pointer;
        transition: transform 120ms ease, box-shadow 160ms ease, background-color 160ms ease;
      }

      .cardhub-settings__btn.is-primary {
        background: linear-gradient(
          135deg,
          rgba(var(--cardhub-accent-rgb), 0.95) 0%,
          rgba(var(--cardhub-accent-rgb), 0.72) 100%
        );
        color: var(--cardhub-accent-text);
        border-color: rgba(var(--cardhub-accent-rgb), 0.55);
      }

      .cardhub-settings__btn.is-secondary {
        background: rgba(var(--cardhub-surface-rgb), 0.85);
        color: var(--cardhub-text-muted);
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.6);
      }

      .cardhub-settings__btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        box-shadow: none;
        transform: none;
      }

      .cardhub-settings__btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 14px rgba(43, 32, 24, 0.18);
      }

      .cardhub-button:focus-visible,
      .cardhub-chip:focus-visible,
      .cardhub-tag-filter__chip:focus-visible,
      .cardhub-tag:focus-visible,
      .cardhub-card__action:focus-visible,
      .cardhub-fav:focus-visible,
      .cardhub-pagination__button:focus-visible,
      .cardhub-manage__btn:focus-visible,
      .cardhub-close:focus-visible,
      .cardhub-theme-trigger:focus-visible,
      .cardhub-settings-trigger:focus-visible,
      .cardhub-preview__close:focus-visible,
      .cardhub-confirm__button:focus-visible,
      .cardhub-export__btn:focus-visible,
      .cardhub-batch__btn:focus-visible,
      .cardhub-tag-manager__btn:focus-visible,
      .cardhub-tag-manager__tab:focus-visible,
      .cardhub-theme__btn:focus-visible,
      .cardhub-settings__btn:focus-visible {
        outline: 2px solid rgba(var(--cardhub-accent-rgb), 0.6);
        outline-offset: 2px;
      }

      @keyframes cardhub-panel-in {
        0% {
          opacity: 0;
          transform: translateY(12px) scale(0.97);
        }
        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes cardhub-backdrop-in {
        0% {
          opacity: 0;
        }
        100% {
          opacity: 1;
        }
      }
      @media (max-width: 720px) {
        .cardhub-root {
          position: fixed !important;
          inset: 0 !important;
          z-index: 99999 !important;
          display: none;
          align-items: center !important;
          justify-content: center !important;
          padding: 16px !important;
          box-sizing: border-box !important;
          overflow-y: auto !important;
          width: 100vw !important;
          height: 100vh !important;
          min-height: 100vh !important;
          height: 100dvh !important;
          min-height: 100dvh !important;
        }

        .cardhub-root.open {
          display: flex !important;
        }

        .cardhub-backdrop {
          position: absolute !important;
          inset: 0 !important;
          z-index: 99998 !important;
          background: rgba(0, 0, 0, 0.4) !important;
          backdrop-filter: blur(8px) !important;
        }

        .cardhub-panel {
          position: relative !important;
          transform: none !important;
          width: 100% !important;
          height: 100% !important;
          max-height: 100% !important;
          max-width: none !important;
          margin: 0 !important;
          border-radius: 20px !important;
          box-shadow: 0 16px 64px rgba(0, 0, 0, 0.35) !important;
          display: flex !important;
          flex-direction: column !important;
          z-index: 100000 !important;
          overflow: hidden !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
        }

        .cardhub-header {
          flex-shrink: 0;
          padding: 10px 12px;
          border-bottom: 1px solid rgba(var(--cardhub-border-rgb), 0.6);
          position: sticky;
          top: 0;
          z-index: 3;
          background: var(--cardhub-surface-alt);
        }

        .cardhub-title__main {
          font-size: 18px;
        }

        .cardhub-title__sub {
          font-size: 10px;
        }

        .cardhub-close {
          width: 26px;
          height: 26px;
          font-size: 15px;
          line-height: 26px;
        }

        .cardhub-theme-trigger {
          width: 26px;
          height: 26px;
          font-size: 12px;
        }

        .cardhub-settings-trigger {
          width: 26px;
          height: 26px;
          font-size: 12px;
        }

        .cardhub-toolbar {
          flex-shrink: 0;
          display: flex;
          flex-wrap: wrap;
          column-gap: 6px;
          row-gap: 8px;
          padding: 8px 12px;
          position: sticky;
          top: 44px;
          z-index: 2;
          background: var(--cardhub-surface-alt);
        }

        .cardhub-search {
          width: 100%;
          font-size: 12px;
          padding: 6px 10px;
          height: 34px;
        }

        .cardhub-toolbar {
          column-gap: 6px;
          row-gap: 8px;
        }

        .cardhub-button {
          flex: 0 1 auto;
          min-width: 0;
          font-size: 11px;
          padding: 6px 10px;
          height: 32px;
          line-height: 1;
        }

        .cardhub-body {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          overflow: auto;
          -webkit-overflow-scrolling: touch;
          padding-bottom: env(safe-area-inset-bottom);
          scroll-padding-bottom: env(safe-area-inset-bottom);
        }

        .cardhub-sidebar {
          flex-shrink: 0;
          border-right: none;
          border-bottom: 1px solid rgba(var(--cardhub-border-rgb), 0.6);
          padding: 8px 10px;
          max-height: none;
          overflow: visible;
          background: rgba(var(--cardhub-surface-rgb), 0.65);
          border-radius: 12px;
          margin: 0 10px 8px;
          gap: 8px;
        }

        .cardhub-section-title {
          font-size: 9px;
          margin-bottom: 4px;
          line-height: 1.2;
        }

        .cardhub-filter-row {
          grid-template-columns: 1fr;
          gap: 10px;
          align-items: start;
        }

        .cardhub-filter-block {
          gap: 6px;
          min-width: 0;
          align-content: start;
        }

        .cardhub-filter-block .cardhub-chip-row {
          flex-wrap: wrap;
          overflow: visible;
          mask-image: none;
          -webkit-mask-image: none;
        }

        .cardhub-divider {
          margin: 4px 0;
        }

        .cardhub-chip-row {
          display: flex;
          flex-wrap: nowrap;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          gap: 6px;
          padding-bottom: 4px;
          mask-image: linear-gradient(90deg, transparent 0%, #000 12px, #000 calc(100% - 12px), transparent 100%);
          -webkit-mask-image: linear-gradient(
            90deg,
            transparent 0%,
            #000 12px,
            #000 calc(100% - 12px),
            transparent 100%
          );
        }

        .cardhub-chip-row::-webkit-scrollbar {
          height: 4px;
        }

        .cardhub-chip-row::-webkit-scrollbar-thumb {
          background: rgba(106, 63, 42, 0.15);
          border-radius: 999px;
        }

        .cardhub-tag-filter {
          display: flex;
          flex-wrap: wrap;
          overflow-y: auto;
          overflow-x: hidden;
          gap: 6px;
          padding-bottom: 6px;
          max-height: calc(
            (var(--cardhub-tag-row-height, 28px) * var(--cardhub-tag-rows, 2)) +
              (var(--cardhub-tag-row-gap, 6px) * (var(--cardhub-tag-rows, 2) - 1)) +
              var(--cardhub-tag-row-padding, 20px)
          );
          align-content: flex-start;
          mask-image: none;
          -webkit-mask-image: none;
        }

        .cardhub-tag-filter::-webkit-scrollbar {
          width: 4px;
        }

        .cardhub-tag-filter::-webkit-scrollbar-thumb {
          background: rgba(106, 63, 42, 0.15);
          border-radius: 999px;
        }

        .cardhub-chip {
          font-size: 10px;
          padding: 5px 9px;
          min-height: 28px;
          line-height: 1;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .cardhub-tag-filter__chip {
          font-size: 10px;
          padding: 5px 9px;
          min-height: 28px;
          line-height: 1;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .cardhub-content {
          flex: 1;
          min-height: 0;
          overflow: visible;
          padding: 10px;
          padding-bottom: calc(10px + env(safe-area-inset-bottom));
        }

        .cardhub-pagination {
          align-items: flex-start;
          position: sticky;
          bottom: 0;
          background: var(--cardhub-surface-alt);
          padding: 8px 12px 6px;
          padding-right: 72px;
          border-top: 1px solid rgba(var(--cardhub-border-rgb), 0.5);
          z-index: 1;
        }

        .cardhub-pagination__actions {
          width: 100%;
        }

        .cardhub-pagination__button {
          flex: 1;
          text-align: center;
        }

        .cardhub-pagination__status {
          position: absolute;
          right: 12px;
          top: 10px;
          font-size: 10px;
          white-space: nowrap;
        }

        .cardhub-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          justify-content: center;
          justify-items: center;
        }

        .cardhub-card {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 10px;
          padding: 10px;
          border-radius: 14px;
          min-width: 0;
          width: 100%;
          max-width: none;
        }

        .cardhub-card__avatar {
          width: var(--cardhub-avatar-size-mobile, 40px);
          height: var(--cardhub-avatar-size-mobile, 40px);
          flex-shrink: 0;
          border-radius: 10px;
        }

        .cardhub-card__info {
          flex: 1;
          min-width: 0;
        }

        .cardhub-card__name {
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cardhub-fav {
          width: 22px;
          height: 22px;
          font-size: 11px;
        }

        .cardhub-card__meta {
          font-size: 10px;
          gap: 6px;
        }

        .cardhub-card__note {
          font-size: 10px;
        }

        .cardhub-card__tags {
          margin-top: 4px;
          gap: 4px;
        }

        .cardhub-tag {
          font-size: 9px;
          padding: 3px 6px;
          color: var(--cardhub-text);
        }

        .cardhub-tag-confirm {
          width: 20px;
          height: 20px;
          font-size: 11px;
        }

        .cardhub-card__actions {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex-shrink: 0;
        }

        .cardhub-card__action {
          padding: 5px 10px;
          font-size: 10px;
          border-radius: 8px;
        }

        .cardhub-preview__name {
          font-size: 16px;
        }

        .cardhub-preview__meta {
          font-size: 11px;
        }

        .cardhub-preview__tag {
          font-size: 10px;
          padding: 4px 8px;
        }

        .cardhub-manage__top {
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .cardhub-manage__media {
          width: 120px;
          margin: 0 auto;
        }

        .cardhub-manage__overview {
          grid-template-columns: 1fr;
        }

        .cardhub-manage__overview-value {
          font-size: 12px;
        }

        .cardhub-manage__overview-hint {
          font-size: 10px;
        }

        .cardhub-manage__label {
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;
          font-size: 10px;
        }

        .cardhub-manage__details {
          grid-template-columns: 1fr;
        }

        .cardhub-manage__detail-label {
          font-size: 10px;
        }

        .cardhub-manage__detail-edit {
          width: 20px;
          height: 20px;
          font-size: 11px;
        }

        .cardhub-manage__detail-content {
          font-size: 11px;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .cardhub-manage__detail-toggle,
        .cardhub-manage__toggle,
        .cardhub-manage__opening-toggle {
          font-size: 10px;
        }

        .cardhub-manage__btn {
          width: 100%;
          text-align: center;
          font-size: 10px;
        }

        .cardhub-manage__jump-row {
          width: 100%;
        }

        .cardhub-manage__content {
          font-size: 11px;
          padding: 10px;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .cardhub-manage__chat-row {
          grid-template-columns: 1fr;
          gap: 3px;
          font-size: 11px;
        }

        .cardhub-manage__opening-title {
          font-size: 10px;
        }

        .cardhub-manage__opening-body {
          font-size: 11px;
        }

        .cardhub-manage__chat-label {
          font-size: 10px;
        }

        .cardhub-manage__chat-text {
          -webkit-line-clamp: 2;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .cardhub-manage__pager {
          gap: 8px;
        }

        .cardhub-manage__pager-btn {
          font-size: 10px;
          padding: 4px 8px;
        }

        .cardhub-manage__pager-status {
          font-size: 10px;
        }

        .cardhub-manage__actions {
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .cardhub-export__toolbar {
          gap: 6px;
        }

        .cardhub-export__filters {
          gap: 8px;
        }

        .cardhub-export__search {
          font-size: 12px;
          padding: 6px 10px;
        }

        .cardhub-export__btn {
          font-size: 11px;
          padding: 6px 10px;
          height: 28px;
        }

        .cardhub-export__list {
          max-height: 48vh;
        }

        .cardhub-export__item {
          grid-template-columns: auto 1fr;
          gap: 8px;
          padding: 8px 10px;
        }

        .cardhub-export__name {
          font-size: 12px;
        }

        .cardhub-export__meta {
          font-size: 10px;
        }

        .cardhub-export__tag {
          font-size: 9px;
        }

        .cardhub-note__input {
          min-height: 100px;
          font-size: 12px;
        }

        .cardhub-edit__input {
          min-height: 110px;
          font-size: 12px;
        }

        .cardhub-tag-manager__tab {
          font-size: 11px;
          padding: 5px 10px;
        }

        .cardhub-tag-manager__btn {
          font-size: 11px;
          padding: 6px 10px;
          height: 28px;
        }

        .cardhub-tag-manager__chip {
          font-size: 10px;
          padding: 5px 9px;
        }

        .cardhub-batch__toolbar {
          gap: 6px;
        }

        .cardhub-batch__search,
        .cardhub-batch__field input {
          font-size: 12px;
          padding: 6px 10px;
        }

        .cardhub-batch__chip {
          font-size: 10px;
          padding: 3px 6px;
        }

        .cardhub-batch__btn {
          font-size: 11px;
          padding: 6px 10px;
          height: 28px;
        }

        .cardhub-batch__list {
          max-height: 40vh;
        }

        .cardhub-tag-manager__batch .cardhub-batch__list {
          max-height: none;
        }

        .cardhub-batch__name {
          font-size: 12px;
        }

        .cardhub-batch__meta {
          font-size: 10px;
        }

        .cardhub-batch__tag {
          font-size: 9px;
        }

        .cardhub-theme__grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 10px;
        }

        .cardhub-theme__field {
          font-size: 11px;
          padding: 6px 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex: 1 1 calc(50% - 6px);
          min-width: 0;
        }

        .cardhub-theme__field span {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cardhub-theme__field input[type='color'] {
          height: 26px;
          width: 70px;
        }

        .cardhub-theme__btn {
          font-size: 11px;
          padding: 6px 10px;
          height: 28px;
        }

        .cardhub-theme__presets {
          gap: 6px;
        }

        .cardhub-theme__preset {
          font-size: 10px;
          padding: 4px 8px;
        }

        .cardhub-settings__panel {
          width: min(360px, 92vw);
          padding: 14px;
          gap: 12px;
        }

        .cardhub-settings__label {
          font-size: 12px;
        }

        .cardhub-settings__hint {
          font-size: 11px;
        }

        .cardhub-settings__option {
          grid-template-columns: 1fr;
          gap: 6px;
        }

        .cardhub-settings__option input {
          margin: 0;
        }

        .cardhub-settings__option-title {
          font-size: 12px;
        }

        .cardhub-settings__option-desc {
          font-size: 11px;
        }

        .cardhub-settings__btn {
          font-size: 11px;
          padding: 6px 10px;
          height: 28px;
        }

        .cardhub-root .cardhub-modal {
          position: fixed !important;
          inset: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          height: 100dvh !important;
          display: grid !important;
          place-items: center !important;
          padding: 16px !important;
          box-sizing: border-box !important;
          overflow-y: auto !important;
        }

        .cardhub-root .cardhub-modal__panel {
          position: fixed !important;
          left: 50vw !important;
          top: 50vh !important;
          transform: translate(-50%, -50%) !important;
          margin: 0 !important;
          width: calc(100vw - 32px) !important;
          max-width: 360px !important;
          max-height: calc(100vh - 32px) !important;
          max-height: calc(100dvh - 32px) !important;
          border-radius: 18px !important;
          padding: 16px !important;
          overflow: auto !important;
          overflow-x: hidden !important;
        }
      }
    `;
