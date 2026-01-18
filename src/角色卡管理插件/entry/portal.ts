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
      }

      .cardhub-root.open {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .cardhub-backdrop {
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at top, rgba(255, 248, 236, 0.9), rgba(36, 30, 24, 0.85));
        backdrop-filter: blur(6px);
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
      }

      .cardhub-close:hover {
        background: rgba(43, 32, 24, 0.2);
      }

      .cardhub-toolbar {
        display: flex;
        gap: 10px;
        padding: 16px 24px;
        flex-wrap: wrap;
      }

      .cardhub-search {
        flex: 1;
        min-width: 180px;
        border-radius: 999px;
        border: 1px solid rgba(86, 59, 44, 0.2);
        padding: 8px 14px;
        background: #fffaf4;
      }

      .cardhub-button {
        border: none;
        padding: 8px 16px;
        border-radius: 999px;
        background: #d46b3d;
        color: #fff;
        cursor: pointer;
        font-size: 12px;
      }

      .cardhub-button.is-ghost {
        background: transparent;
        color: #6a3f2a;
        border: 1px solid rgba(106, 63, 42, 0.4);
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
      }

      .cardhub-chip.is-active {
        background: #2b2018;
        color: #fff5ea;
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
      }

      .cardhub-tag-filter__chip.is-active {
        background: #2b2018;
        color: #fff5ea;
        border-color: transparent;
      }

      .cardhub-chip--clear {
        margin-top: 8px;
      }

      .cardhub-content {
        padding: 20px;
        overflow: auto;
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

      .cardhub-manage__section {
        display: grid;
        gap: 8px;
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

      .cardhub-manage__jump {
        border: 1px solid rgba(106, 63, 42, 0.35);
        background: transparent;
        color: #6a3f2a;
        border-radius: 999px;
        padding: 4px 10px;
        font-size: 11px;
        cursor: pointer;
        text-transform: none;
      }

      .cardhub-manage__jump:hover {
        background: rgba(106, 63, 42, 0.1);
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

      .cardhub-manage__chat-name {
        flex: 0 0 auto;
        font-weight: 600;
        color: #6a3f2a;
        word-break: break-word;
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
      @media (max-width: 720px) {

        .cardhub-body {
          grid-template-columns: 1fr;
        }

        .cardhub-sidebar {
          flex-direction: column;
          border-right: none;
          border-bottom: 1px solid rgba(86, 59, 44, 0.15);
          gap: 8px;
        }

        .cardhub-chip-row,
        .cardhub-tag-filter {
          flex-wrap: nowrap;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .cardhub-chip-row::-webkit-scrollbar,
        .cardhub-tag-filter::-webkit-scrollbar {
          height: 6px;
        }

        .cardhub-chip-row::-webkit-scrollbar-thumb,
        .cardhub-tag-filter::-webkit-scrollbar-thumb {
          background: rgba(106, 63, 42, 0.2);
          border-radius: 999px;
        }

        .cardhub-panel {
          width: min(98vw, 520px);
          max-height: 96vh;
        }

        .cardhub-header {
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 12px 14px;
        }

        .cardhub-toolbar {
          display: grid;
          grid-template-columns: 1fr auto auto auto;
          gap: 8px;
          padding: 10px 14px 12px;
        }

        .cardhub-search {
          width: 100%;
          grid-column: 1 / -1;
        }

        .cardhub-button {
          width: 100%;
        }

        .cardhub-button.is-ghost {
          grid-column: span 1;
        }

        .cardhub-tag-filter__chip,
        .cardhub-tag {
          font-size: 10px;
          padding: 4px 8px;
        }

        .cardhub-card {
          grid-template-columns: 1fr;
        }

        .cardhub-card__action {
          grid-column: auto;
        }
      .cardhub-manage__panel {
        width: min(96vw, 560px);
        max-height: 90vh;
      }

      .cardhub-manage__top {
        grid-template-columns: 1fr;
      }

      .cardhub-manage__actions {
        grid-template-columns: 1fr;
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


















