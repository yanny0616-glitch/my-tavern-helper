import { createApp, watch } from 'vue';
import { createScriptIdDiv } from '../../../util/script';
import { fetchCharacterSummaries } from '../services/characterSource';
import { loadLibrary } from '../services/libraryService';
import { cardHubState, setCharacters, setLibrary, setLoading, setOpen } from '../state/store';
import type { EntrySource } from '../types';
import App from '../ui/App.vue';

type CardHubController = {
  open: (source?: EntrySource) => void;
  close: () => void;
  toggle: (source?: EntrySource) => void;
  refresh: () => Promise<void>;
  destroy: () => void;
};

let app: ReturnType<typeof createApp> | null = null;
let $mount: JQuery<HTMLDivElement> | null = null;
let $style: JQuery<HTMLElement> | null = null;

function ensureMounted() {
  if ($mount) {
    return;
  }

  $style = $(`<style>`)
    .attr('data-cardhub-style', getScriptId())
    .text(
      `
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
        border: none;
        padding: 6px 14px;
        border-radius: 999px;
        background: var(--cardhub-accent);
        color: var(--cardhub-accent-text);
        cursor: pointer;
        font-size: 12px;
        height: 32px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background-color 160ms ease, transform 120ms ease, box-shadow 160ms ease, color 160ms ease;
        box-shadow: 0 6px 16px rgba(var(--cardhub-accent-rgb), 0.2);
      }

      .cardhub-button:hover {
        background: rgba(var(--cardhub-accent-rgb), 0.85);
        color: var(--cardhub-accent-text);
        box-shadow: 0 8px 18px rgba(var(--cardhub-accent-rgb), 0.3);
      }

      .cardhub-button:active {
        transform: translateY(1px);
      }

      .cardhub-button.is-ghost {
        background: rgba(var(--cardhub-surface-rgb), 0.75);
        color: var(--cardhub-text-muted);
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.6);
        box-shadow: none;
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
        height: 1px;
        width: 100%;
        background: rgba(var(--cardhub-border-rgb), 0.6);
        margin: 8px 0;
      }

      .cardhub-section-title {
        font-size: 12px;
        color: var(--cardhub-text);
        text-transform: uppercase;
        letter-spacing: 1px;
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
        box-shadow: 0 6px 14px rgba(var(--cardhub-border-rgb), 0.18);
      }

      .cardhub-chip.is-active {
        background: var(--cardhub-accent-strong);
        color: var(--cardhub-accent-strong-text);
        box-shadow: 0 10px 20px rgba(43, 32, 24, 0.18);
      }

      .cardhub-chip:not(.is-active):hover {
        background: rgba(var(--cardhub-surface-rgb), 0.98);
        transform: translateY(-1px);
      }

      .cardhub-placeholder {
        font-size: 12px;
        color: var(--cardhub-text-muted);
      }

      .cardhub-tag-filter {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
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
      }

      .cardhub-chip--more {
        margin-top: 4px;
      }

      .cardhub-filter-row {
        display: grid;
        gap: 12px;
      }

      .cardhub-filter-block {
        display: grid;
        gap: 8px;
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

      .cardhub-card:active {
        transform: translateY(0);
      }

      .cardhub-card__avatar {
        width: 42px;
        height: 42px;
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
        background: var(--cardhub-accent-strong);
        color: var(--cardhub-accent-strong-text);
        padding: 6px 12px;
        border-radius: 12px;
        font-size: 12px;
        cursor: pointer;
        transition: transform 120ms ease, box-shadow 160ms ease, background-color 160ms ease;
        box-shadow: 0 8px 16px rgba(43, 32, 24, 0.2);
      }

      .cardhub-card__actions {
        grid-column: span 2;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-top: 10px;
      }

      .cardhub-card__action.is-secondary {
        background: rgba(var(--cardhub-surface-alt-rgb), 0.95);
        color: var(--cardhub-text);
        box-shadow: 0 8px 16px rgba(43, 32, 24, 0.12);
      }

      .cardhub-card__action:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 14px rgba(43, 32, 24, 0.15);
      }

      .cardhub-card__action:active {
        transform: translateY(0);
      }

      .cardhub-preview {
        position: fixed;
        inset: 0;
        background: rgba(24, 16, 10, 0.45);
        backdrop-filter: blur(6px);
        display: grid;
        place-items: center;
        z-index: 100000;
      }

      .cardhub-preview__panel {
        width: min(520px, 92vw);
        background: var(--cardhub-surface-alt);
        border-radius: 26px;
        box-shadow: var(--cardhub-shadow-strong);
        padding: 20px;
        position: relative;
        display: grid;
        gap: 14px;
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

      .cardhub-preview__avatar {
        width: 100%;
        height: 260px;
        border-radius: 18px;
        background: rgba(var(--cardhub-surface-alt-rgb), 0.9);
        display: grid;
        place-items: center;
        overflow: hidden;
      }

      .cardhub-preview__avatar img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .cardhub-preview__info {
        display: grid;
        gap: 6px;
      }

      .cardhub-preview__name {
        font-size: 20px;
        font-weight: 700;
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

      .cardhub-preview__actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .cardhub-manage {
        position: fixed;
        inset: 0;
        background: rgba(24, 16, 10, 0.45);
        backdrop-filter: blur(6px);
        display: grid;
        place-items: center;
        z-index: 100001;
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

      .cardhub-manage__detail-label {
        font-size: 11px;
        color: var(--cardhub-text-muted);
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .cardhub-manage__detail-content {
        font-size: 12px;
        line-height: 1.5;
        color: var(--cardhub-text);
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        word-break: break-word;
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
        border: none;
        border-radius: 12px;
        padding: 6px 12px;
        font-size: 12px;
        cursor: pointer;
        text-transform: none;
        transition: background-color 160ms ease, transform 120ms ease, box-shadow 160ms ease;
      }

      .cardhub-manage__btn.is-primary {
        background: var(--cardhub-accent-strong);
        color: var(--cardhub-accent-strong-text);
      }

      .cardhub-manage__btn.is-secondary {
        background: rgba(var(--cardhub-surface-alt-rgb), 0.95);
        color: var(--cardhub-text);
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
        background: var(--cardhub-accent-strong);
      }

      .cardhub-manage__btn.is-secondary:hover {
        background: rgba(var(--cardhub-surface-alt-rgb), 0.98);
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

      .cardhub-manage__opening {
        padding: 6px 0;
        border-bottom: 1px dashed rgba(var(--cardhub-border-rgb), 0.5);
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

      .cardhub-manage__chat-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }

      .cardhub-manage__chat-tag {
        padding: 2px 6px;
        border-radius: 999px;
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.5);
        background: rgba(var(--cardhub-surface-rgb), 0.9);
        font-size: 10px;
        color: var(--cardhub-text-muted);
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

      .cardhub-manage__empty {
        font-size: 12px;
        color: var(--cardhub-text-muted);
      }

      .cardhub-manage__actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .cardhub-confirm {
        position: fixed;
        inset: 0;
        background: rgba(24, 16, 10, 0.55);
        backdrop-filter: blur(6px);
        display: grid;
        place-items: center;
        z-index: 200000;
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
        border: none;
        border-radius: 999px;
        font-size: 12px;
        cursor: pointer;
        transition: transform 120ms ease, box-shadow 160ms ease, background-color 160ms ease, border-color 160ms ease;
      }

      .cardhub-confirm__button.is-confirm {
        background: var(--cardhub-accent);
        color: var(--cardhub-accent-text);
      }

      .cardhub-confirm__button.is-cancel {
        background: transparent;
        color: var(--cardhub-text-muted);
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.6);
      }

      .cardhub-confirm__button.is-danger {
        background: var(--cardhub-accent-strong);
        color: var(--cardhub-accent-strong-text);
      }

      .cardhub-confirm__button:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 14px rgba(43, 32, 24, 0.18);
      }

      .cardhub-confirm__button:active {
        transform: translateY(0);
      }

      .cardhub-tag-manager {
        position: fixed;
        inset: 0;
        background: rgba(24, 16, 10, 0.55);
        backdrop-filter: blur(6px);
        display: grid;
        place-items: center;
        z-index: 100011;
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
        border: none;
        border-radius: 999px;
        padding: 6px 12px;
        font-size: 12px;
        cursor: pointer;
        transition: transform 120ms ease, box-shadow 160ms ease, background-color 160ms ease;
      }

      .cardhub-tag-manager__btn.is-primary {
        background: var(--cardhub-accent-strong);
        color: var(--cardhub-accent-strong-text);
      }

      .cardhub-tag-manager__btn.is-secondary {
        background: transparent;
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
        position: fixed;
        inset: 0;
        background: rgba(24, 16, 10, 0.55);
        backdrop-filter: blur(6px);
        display: grid;
        place-items: center;
        z-index: 100003;
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
        border: none;
        border-radius: 999px;
        font-size: 12px;
        cursor: pointer;
        transition: transform 120ms ease, box-shadow 160ms ease, background-color 160ms ease;
      }

      .cardhub-export__btn.is-primary {
        background: var(--cardhub-accent);
        color: var(--cardhub-accent-text);
      }

      .cardhub-export__btn.is-secondary {
        background: transparent;
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

      .cardhub-batch {
        position: fixed;
        inset: 0;
        background: rgba(24, 16, 10, 0.55);
        backdrop-filter: blur(6px);
        display: grid;
        place-items: center;
        z-index: 100004;
      }

      .cardhub-batch__panel {
        width: min(720px, 92vw);
        max-height: 86vh;
        background: var(--cardhub-surface-alt);
        border-radius: 20px;
        padding: 18px 18px 14px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        box-shadow: var(--cardhub-shadow-strong);
        overflow: hidden;
        margin: auto;
      }

      .cardhub-batch__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .cardhub-batch__title {
        font-size: 16px;
        font-weight: 600;
      }

      .cardhub-batch__subtitle {
        font-size: 12px;
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
        border: none;
        border-radius: 999px;
        font-size: 12px;
        cursor: pointer;
        transition: transform 120ms ease, box-shadow 160ms ease, background-color 160ms ease;
      }

      .cardhub-batch__btn.is-primary {
        background: var(--cardhub-accent);
        color: var(--cardhub-accent-text);
      }

      .cardhub-batch__btn.is-secondary {
        background: transparent;
        color: var(--cardhub-text-muted);
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.7);
      }

      .cardhub-batch__btn.is-ghost {
        background: rgba(var(--cardhub-accent-rgb), 0.12);
        color: var(--cardhub-accent-strong);
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
        position: fixed;
        inset: 0;
        background: rgba(24, 16, 10, 0.55);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: grid;
        place-items: center;
        z-index: 100005;
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
        border: none;
        border-radius: 999px;
        font-size: 12px;
        cursor: pointer;
        transition: transform 120ms ease, box-shadow 160ms ease, background-color 160ms ease;
      }

      .cardhub-theme__btn.is-primary {
        background: var(--cardhub-accent);
        color: var(--cardhub-accent-text);
      }

      .cardhub-theme__btn.is-secondary {
        background: transparent;
        color: var(--cardhub-text-muted);
        border: 1px solid rgba(var(--cardhub-border-rgb), 0.6);
      }

      .cardhub-theme__btn:hover {
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
      .cardhub-preview__close:focus-visible,
      .cardhub-confirm__button:focus-visible,
      .cardhub-export__btn:focus-visible,
      .cardhub-batch__btn:focus-visible,
      .cardhub-tag-manager__btn:focus-visible,
      .cardhub-tag-manager__tab:focus-visible,
      .cardhub-theme__btn:focus-visible {
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
          position: absolute !important;
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
        }

        .cardhub-filter-row {
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .cardhub-filter-block {
          gap: 6px;
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

        .cardhub-chip-row,
        .cardhub-tag-filter {
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

        .cardhub-chip-row::-webkit-scrollbar,
        .cardhub-tag-filter::-webkit-scrollbar {
          height: 4px;
        }

        .cardhub-chip-row::-webkit-scrollbar-thumb,
        .cardhub-tag-filter::-webkit-scrollbar-thumb {
          background: rgba(106, 63, 42, 0.15);
          border-radius: 999px;
        }

        .cardhub-chip {
          font-size: 11px;
          padding: 6px 10px;
          min-height: 30px;
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
          width: 40px;
          height: 40px;
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

        .cardhub-preview,
        .cardhub-manage {
          position: absolute !important;
          inset: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 16px !important;
          box-sizing: border-box !important;
          overflow-y: auto !important;
        }

        .cardhub-preview__panel,
        .cardhub-manage__panel {
          width: calc(100vw - 32px) !important;
          max-width: 360px !important;
          max-height: calc(100vh - 32px) !important;
          max-height: calc(100dvh - 32px) !important;
          border-radius: 18px !important;
          padding: 16px !important;
          overflow: auto !important;
          overflow-x: hidden !important;
        }

        .cardhub-preview__avatar {
          height: 180px;
          border-radius: 14px;
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

        .cardhub-preview__actions {
          gap: 8px;
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

        .cardhub-manage__detail-content {
          font-size: 11px;
          overflow-wrap: anywhere;
          word-break: break-word;
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

        .cardhub-manage__chat-label {
          font-size: 10px;
        }

        .cardhub-manage__chat-tag {
          font-size: 9px;
        }

        .cardhub-manage__chat-text {
          -webkit-line-clamp: 2;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .cardhub-manage__actions {
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .cardhub-export {
          position: fixed !important;
          inset: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 16px !important;
          box-sizing: border-box !important;
        }

        .cardhub-export__panel {
          width: calc(100vw - 32px) !important;
          max-width: 360px !important;
          max-height: calc(100vh - 32px) !important;
          max-height: calc(100dvh - 32px) !important;
          border-radius: 18px !important;
          padding: 16px !important;
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

        .cardhub-tag-manager {
          position: fixed !important;
          inset: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 16px !important;
          box-sizing: border-box !important;
        }

        .cardhub-tag-manager__panel {
          width: calc(100vw - 32px) !important;
          max-width: 360px !important;
          max-height: calc(100vh - 32px) !important;
          max-height: calc(100dvh - 32px) !important;
          border-radius: 18px !important;
          padding: 16px !important;
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

        .cardhub-batch {
          position: fixed !important;
          inset: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 16px !important;
          box-sizing: border-box !important;
        }

        .cardhub-batch__panel {
          width: calc(100vw - 32px) !important;
          max-width: 360px !important;
          max-height: calc(100vh - 32px) !important;
          max-height: calc(100dvh - 32px) !important;
          border-radius: 18px !important;
          padding: 12px !important;
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

        .cardhub-theme {
          position: fixed !important;
          inset: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          height: 100dvh !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 16px !important;
          box-sizing: border-box !important;
          background: rgba(24, 16, 10, 0.55) !important;
          backdrop-filter: blur(10px) !important;
          -webkit-backdrop-filter: blur(10px) !important;
        }

        .cardhub-theme__panel {
          width: calc(100vw - 32px) !important;
          max-width: 360px !important;
          max-height: calc(100vh - 32px) !important;
          max-height: calc(100dvh - 32px) !important;
          border-radius: 18px !important;
          padding: 12px !important;
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
      }
    `,
    )
    .appendTo('head');

  $mount = createScriptIdDiv().addClass('cardhub-mount').appendTo('body');
  app = createApp(App);
  app.mount($mount[0]);

  watch(
    () => cardHubState.open,
    () => {},
    { immediate: true },
  );
}

async function refreshCharacters() {
  setLoading(true);
  try {
    const characters = await fetchCharacterSummaries();
    setCharacters(characters);
    setLibrary(loadLibrary());
  } finally {
    setLoading(false);
  }
}

export function createCardHubController(): CardHubController {
  return {
    open: (source = 'manual') => {
      ensureMounted();
      setOpen(true, source);
    },
    close: () => {
      setOpen(false);
    },
    toggle: (source = 'manual') => {
      ensureMounted();
      setOpen(!cardHubState.open, source);
    },
    refresh: async () => {
      ensureMounted();
      await refreshCharacters();
    },
    destroy: () => {
      if (app) {
        app.unmount();
      }
      if ($mount) {
        $mount.remove();
      }
      if ($style) {
        $style.remove();
      }
      app = null;
      $mount = null;
      $style = null;
    },
  };
}
