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
    .text(`
      .cardhub-root {
        position: fixed;
        inset: 0;
        z-index: 9999;
        font-family: "ZCOOL XiaoWei", "STSong", "Songti SC", "SimSun", serif;
        color: #1b1b1b;
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

      .cardhub-panel {
        position: relative;
        width: min(980px, 94%);
        max-height: 92%;
        background: linear-gradient(160deg, #fff9f0, #f3e4d4);
        border-radius: 28px;
        box-shadow: 0 30px 90px rgba(0, 0, 0, 0.28);
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

      .cardhub-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
        border-bottom: 1px solid rgba(86, 59, 44, 0.15);
      }

      .cardhub-title__main {
        font-size: 26px;
        letter-spacing: 2px;
      }

      .cardhub-title__sub {
        font-size: 12px;
        color: #7d5b46;
        margin-left: 10px;
      }

      .cardhub-actions {
        display: flex;
        gap: 10px;
      }

      .cardhub-close {
        border: none;
        background: rgba(43, 32, 24, 0.12);
        color: #3b2a20;
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
        background: rgba(43, 32, 24, 0.2);
      }

      .cardhub-close:active {
        transform: scale(0.96);
      }

      .cardhub-toolbar {
        display: flex;
        gap: 8px;
        padding: 12px 20px;
        flex-wrap: wrap;
      }

      .cardhub-search {
        flex: 1;
        min-width: 180px;
        border-radius: 999px;
        border: 1px solid rgba(86, 59, 44, 0.2);
        padding: 6px 12px;
        background: #fffaf4;
      }

      .cardhub-button {
        border: none;
        padding: 6px 14px;
        border-radius: 999px;
        background: #d46b3d;
        color: #fff;
        cursor: pointer;
        font-size: 12px;
        transition: background-color 160ms ease, transform 120ms ease, box-shadow 160ms ease;
      }

      .cardhub-button:hover {
        background: #c55f36;
        box-shadow: 0 6px 14px rgba(43, 32, 24, 0.18);
      }

      .cardhub-button:active {
        transform: translateY(1px);
      }

      .cardhub-button.is-ghost {
        background: transparent;
        color: #6a3f2a;
        border: 1px solid rgba(106, 63, 42, 0.4);
      }

      .cardhub-button.is-ghost:hover {
        background: rgba(106, 63, 42, 0.08);
        border-color: rgba(106, 63, 42, 0.6);
        box-shadow: none;
      }

      .cardhub-import-input {
        display: none;
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
        border-right: 1px solid rgba(86, 59, 44, 0.15);
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .cardhub-chip-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .cardhub-divider {
        height: 1px;
        width: 100%;
        background: rgba(86, 59, 44, 0.15);
        margin: 8px 0;
      }

      .cardhub-section-title {
        font-size: 12px;
        color: #7d5b46;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .cardhub-chip {
        text-align: left;
        border: none;
        background: rgba(255, 255, 255, 0.6);
        border-radius: 12px;
        padding: 8px 10px;
        cursor: pointer;
        font-size: 12px;
        transition: background-color 160ms ease, color 160ms ease, transform 120ms ease;
      }

      .cardhub-chip.is-active {
        background: #2b2018;
        color: #fff5ea;
      }

      .cardhub-chip:not(.is-active):hover {
        background: rgba(255, 255, 255, 0.9);
        transform: translateY(-1px);
      }

      .cardhub-placeholder {
        font-size: 12px;
        color: #9a7a63;
      }

      .cardhub-tag-filter {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .cardhub-tag-filter__chip {
        border: 1px solid rgba(106, 63, 42, 0.25);
        background: rgba(255, 255, 255, 0.7);
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 12px;
        color: #6a3f2a;
        cursor: pointer;
        transition: background-color 160ms ease, color 160ms ease, border-color 160ms ease, transform 120ms ease;
      }

      .cardhub-tag-filter__chip.is-active {
        background: #2b2018;
        color: #fff5ea;
        border-color: transparent;
      }

      .cardhub-tag-filter__chip:not(.is-active):hover {
        border-color: rgba(106, 63, 42, 0.45);
        background: rgba(255, 255, 255, 0.9);
        transform: translateY(-1px);
      }

      .cardhub-chip--clear {
        margin-top: 8px;
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
        color: #7d5b46;
      }

      .cardhub-pagination__actions {
        display: flex;
        gap: 8px;
        align-items: center;
        margin-right: auto;
      }

      .cardhub-pagination__button {
        border: 1px solid rgba(106, 63, 42, 0.35);
        background: rgba(255, 255, 255, 0.85);
        color: #6a3f2a;
        border-radius: 999px;
        padding: 4px 10px;
        font-size: 11px;
        cursor: pointer;
        transition: background-color 160ms ease, border-color 160ms ease, transform 120ms ease;
      }

      .cardhub-pagination__button:disabled {
        opacity: 0.4;
        cursor: default;
      }

      .cardhub-pagination__button:not(:disabled):hover {
        background: rgba(255, 255, 255, 1);
        border-color: rgba(106, 63, 42, 0.6);
        transform: translateY(-1px);
      }

      .cardhub-pagination__button:not(:disabled):active {
        transform: translateY(0);
      }

      .cardhub-loading,
      .cardhub-empty {
        padding: 40px 0;
        text-align: center;
        color: #7d5b46;
      }

      .cardhub-grid {
        display: grid;
        gap: 14px;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        justify-items: center;
      }

      .cardhub-card {
        background: rgba(255, 255, 255, 0.78);
        border-radius: 18px;
        padding: 14px;
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 12px;
        align-items: center;
        border: 1px solid rgba(86, 59, 44, 0.15);
        cursor: pointer;
        transition: transform 140ms ease, box-shadow 180ms ease, border-color 180ms ease;
        width: 100%;
        max-width: 260px;
      }

      .cardhub-card:hover {
        transform: translateY(-2px);
        border-color: rgba(86, 59, 44, 0.25);
        box-shadow: 0 12px 26px rgba(43, 32, 24, 0.16);
      }

      .cardhub-card:active {
        transform: translateY(0);
      }

      .cardhub-card__avatar {
        width: 42px;
        height: 42px;
        border-radius: 12px;
        background: linear-gradient(135deg, #f4d7c4, #d36a3b);
        background-size: cover;
        background-position: center;
        color: #4a2a1f;
        display: grid;
        place-items: center;
        font-weight: 700;
      }

      .cardhub-card__avatar.has-avatar span {
        display: none;
      }

      .cardhub-card__name {
        font-size: 14px;
        font-weight: 600;
      }

      .cardhub-card__meta {
        display: flex;
        gap: 8px;
        font-size: 11px;
        color: #7d5b46;
      }

      .cardhub-card__tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 8px;
        align-items: center;
      }

      .cardhub-tag {
        border: 1px solid rgba(106, 63, 42, 0.3);
        background: #fff6ea;
        border-radius: 999px;
        padding: 4px 8px;
        font-size: 11px;
        color: #6a3f2a;
        cursor: pointer;
        transition: background-color 160ms ease, border-color 160ms ease, transform 120ms ease;
      }

      .cardhub-tag:hover {
        background: #fffaf4;
        border-color: rgba(106, 63, 42, 0.5);
        transform: translateY(-1px);
      }

      .cardhub-tag__remove {
        margin-left: 4px;
        font-weight: 700;
      }

      .cardhub-tag.is-add {
        background: transparent;
        border-style: dashed;
      }

      .cardhub-tag-input {
        border: 1px dashed rgba(106, 63, 42, 0.5);
        background: #fffaf4;
        border-radius: 999px;
        padding: 4px 10px;
        font-size: 11px;
        min-width: 80px;
        color: #6a3f2a;
        outline: none;
        height: 24px;
        line-height: 16px;
      }

      .cardhub-tag-input:focus {
        border-color: rgba(106, 63, 42, 0.85);
      }

      .cardhub-card__action {
        grid-column: span 2;
        margin-top: 10px;
        border: none;
        background: #2b2018;
        color: #fff5ea;
        padding: 6px 12px;
        border-radius: 12px;
        font-size: 12px;
        cursor: pointer;
        transition: transform 120ms ease, box-shadow 160ms ease, background-color 160ms ease;
      }

      .cardhub-card__actions {
        grid-column: span 2;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-top: 10px;
      }

      .cardhub-card__action.is-secondary {
        background: #d9c6b6;
        color: #3b2a20;
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
        background: #fff6ea;
        border-radius: 26px;
        box-shadow: 0 26px 70px rgba(0, 0, 0, 0.25);
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
        background: rgba(43, 32, 24, 0.15);
        color: #3b2a20;
        font-size: 18px;
        cursor: pointer;
        transition: background-color 160ms ease, transform 120ms ease;
      }

      .cardhub-preview__close:hover {
        background: rgba(43, 32, 24, 0.25);
      }

      .cardhub-preview__close:active {
        transform: scale(0.96);
      }

      .cardhub-preview__avatar {
        width: 100%;
        height: 260px;
        border-radius: 18px;
        background: #ead7c4;
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
        color: #7d5b46;
      }

      .cardhub-preview__tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .cardhub-preview__tag {
        padding: 6px 10px;
        border-radius: 999px;
        border: 1px solid rgba(106, 63, 42, 0.3);
        background: #fffaf4;
        font-size: 12px;
        color: #6a3f2a;
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
        background: #fff6ea;
        border-radius: 26px;
        box-shadow: 0 26px 70px rgba(0, 0, 0, 0.25);
        padding: 22px;
        position: relative;
        display: grid;
        gap: 16px;
        overflow: auto;
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
        background: #ead7c4;
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
        background: rgba(255, 255, 255, 0.7);
        border: 1px solid rgba(106, 63, 42, 0.2);
        border-radius: 14px;
        padding: 10px 12px;
        display: grid;
        gap: 4px;
      }

      .cardhub-manage__overview-label {
        font-size: 10px;
        color: #7d5b46;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .cardhub-manage__overview-value {
        font-size: 13px;
        font-weight: 600;
        color: #3b2a20;
      }

      .cardhub-manage__overview-hint {
        font-size: 11px;
        color: #7d5b46;
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
        background: #fffaf4;
        border: 1px solid rgba(106, 63, 42, 0.2);
        border-radius: 16px;
        padding: 12px 14px;
        display: grid;
        gap: 6px;
      }

      .cardhub-manage__detail-label {
        font-size: 11px;
        color: #7d5b46;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .cardhub-manage__detail-content {
        font-size: 12px;
        line-height: 1.5;
        color: #3b2a20;
        white-space: pre-wrap;
      }

      .cardhub-manage__label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        font-size: 12px;
        color: #7d5b46;
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
        background: #2b2018;
        color: #fff5ea;
      }

      .cardhub-manage__btn.is-secondary {
        background: #d9c6b6;
        color: #3b2a20;
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
        background: #241a14;
      }

      .cardhub-manage__btn.is-secondary:hover {
        background: #d1bca8;
      }

      .cardhub-manage__btn:active {
        transform: translateY(0);
      }

      .cardhub-manage__content {
        background: #fffaf4;
        border: 1px solid rgba(106, 63, 42, 0.2);
        border-radius: 16px;
        padding: 12px 14px;
        font-size: 12px;
        line-height: 1.5;
        color: #3b2a20;
        white-space: pre-wrap;
      }

      .cardhub-manage__opening {
        padding: 6px 0;
        border-bottom: 1px dashed rgba(106, 63, 42, 0.2);
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
        color: #3b2a20;
        align-items: start;
        padding: 6px 8px;
        border-radius: 10px;
        cursor: pointer;
      }

      .cardhub-manage__chat-row:hover {
        background: rgba(106, 63, 42, 0.08);
      }

      .cardhub-manage__chat-main {
        display: grid;
        gap: 4px;
      }

      .cardhub-manage__chat-name {
        flex: 0 0 auto;
        font-weight: 600;
        color: #6a3f2a;
        word-break: break-word;
      }

      .cardhub-manage__chat-label {
        font-size: 11px;
        color: #9a7a63;
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
        border: 1px solid rgba(106, 63, 42, 0.2);
        background: rgba(255, 255, 255, 0.75);
        font-size: 10px;
        color: #6a3f2a;
      }

      .cardhub-manage__chat-text {
        color: #3b2a20;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .cardhub-manage__empty {
        font-size: 12px;
        color: #9a7a63;
      }

      .cardhub-manage__actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .cardhub-confirm {
        position: absolute;
        inset: 0;
        background: rgba(24, 16, 10, 0.55);
        backdrop-filter: blur(6px);
        display: grid;
        place-items: center;
        z-index: 100002;
      }

      .cardhub-confirm__panel {
        width: min(460px, 92vw);
        background: #fff6ea;
        border-radius: 22px;
        box-shadow: 0 26px 70px rgba(0, 0, 0, 0.25);
        padding: 18px 20px;
        display: grid;
        gap: 12px;
      }

      .cardhub-confirm__title {
        font-size: 16px;
        font-weight: 600;
        color: #2b2018;
      }

      .cardhub-confirm__message {
        font-size: 13px;
        line-height: 1.5;
        color: #4a2a1f;
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
        padding: 8px 14px;
        font-size: 12px;
        cursor: pointer;
        transition: transform 120ms ease, box-shadow 160ms ease, background-color 160ms ease, border-color 160ms ease;
      }

      .cardhub-confirm__button.is-confirm {
        background: #d46b3d;
        color: #fff;
      }

      .cardhub-confirm__button.is-cancel {
        background: transparent;
        color: #6a3f2a;
        border: 1px solid rgba(106, 63, 42, 0.4);
      }

      .cardhub-confirm__button.is-danger {
        background: #b6452a;
        color: #fff;
      }

      .cardhub-confirm__button:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 14px rgba(43, 32, 24, 0.18);
      }

      .cardhub-confirm__button:active {
        transform: translateY(0);
      }

      .cardhub-button:focus-visible,
      .cardhub-chip:focus-visible,
      .cardhub-tag-filter__chip:focus-visible,
      .cardhub-tag:focus-visible,
      .cardhub-card__action:focus-visible,
      .cardhub-pagination__button:focus-visible,
      .cardhub-manage__btn:focus-visible,
      .cardhub-close:focus-visible,
      .cardhub-preview__close:focus-visible,
      .cardhub-confirm__button:focus-visible {
        outline: 2px solid rgba(212, 107, 61, 0.6);
        outline-offset: 2px;
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
          padding: 14px 16px;
          border-bottom: 1px solid rgba(86, 59, 44, 0.12);
        }

        .cardhub-title__main {
          font-size: 20px;
        }

        .cardhub-title__sub {
          font-size: 11px;
        }

        .cardhub-close {
          width: 28px;
          height: 28px;
          font-size: 16px;
          line-height: 28px;
        }

        .cardhub-toolbar {
          flex-shrink: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 10px 14px;
        }

        .cardhub-search {
          width: 100%;
          font-size: 13px;
          padding: 8px 12px;
        }

        .cardhub-button {
          flex: 1;
          min-width: 0;
          font-size: 11px;
          padding: 6px 10px;
        }

        .cardhub-body {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          overflow: auto;
        }

        .cardhub-sidebar {
          flex-shrink: 0;
          border-right: none;
          border-bottom: 1px solid rgba(86, 59, 44, 0.12);
          padding: 10px 14px;
          max-height: none;
          overflow: visible;
        }

        .cardhub-section-title {
          font-size: 10px;
          margin-bottom: 6px;
        }

        .cardhub-divider {
          margin: 6px 0;
        }

        .cardhub-chip-row,
        .cardhub-tag-filter {
          display: flex;
          flex-wrap: wrap;
          overflow: visible;
          gap: 6px;
          padding-bottom: 4px;
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
          padding: 5px 10px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .cardhub-tag-filter__chip {
          font-size: 10px;
          padding: 4px 8px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .cardhub-content {
          flex: 1;
          min-height: 0;
          overflow: visible;
          padding: 12px;
        }

        .cardhub-pagination {
          align-items: flex-start;
        }

        .cardhub-pagination__actions {
          width: 100%;
        }

        .cardhub-pagination__button {
          flex: 1;
          text-align: center;
        }

        .cardhub-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
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
        }

        .cardhub-manage__actions {
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
      }
    `)
    .appendTo('head');

  $mount = createScriptIdDiv().addClass('cardhub-mount').appendTo('body');
  app = createApp(App);
  app.mount($mount[0]);

  watch(() => cardHubState.open, () => {}, { immediate: true });
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
