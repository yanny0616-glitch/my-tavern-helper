import { computed, createApp, nextTick, ref, watch } from 'vue';

import { ensureScopeDefaults, getUniqueName, normalizeMacros } from '../core/macros';
import { DEFAULT_THEME, ThemeSchema } from '../core/schema';
import { getCurrentCharacterId, getCurrentCharacterLabel } from '../integration/character';
import App from './App.vue';
import { MacroUiKey } from './context';
import type { Macro, MacroUiContext, Theme } from './context';
import type { Settings } from '../core/schema';
import { buildStyleText } from './style';

export function createMacroManager(getSettings: () => Settings, onSave: (next: Settings) => void) {
  const visible = ref(false);
  const macros = ref<Macro[]>([]);
  const theme = ref<Theme>({ ...DEFAULT_THEME });
  const selectedId = ref<string | null>(null);
  const selectedMacro = computed(() => macros.value.find(macro => macro.id === selectedId.value) ?? null);

  let app: ReturnType<typeof createApp> | null = null;
  let mountEl: HTMLDivElement | null = null;
  let styleElement: HTMLStyleElement | null = null;
  const hostFrame = window.frameElement as HTMLIFrameElement | null;

  function setFrameLayout() {
    if (!hostFrame) {
      return;
    }
    hostFrame.style.position = 'fixed';
    hostFrame.style.inset = '0';
    hostFrame.style.width = '100vw';
    hostFrame.style.height = '100vh';
    hostFrame.style.border = 'none';
    hostFrame.style.background = 'transparent';
    hostFrame.style.zIndex = '9999';
  }

  function setFrameInteractivity(active: boolean) {
    if (!hostFrame) {
      return;
    }
    hostFrame.style.pointerEvents = active ? 'auto' : 'none';
    hostFrame.style.display = active ? 'block' : 'none';
  }

  setFrameLayout();
  setFrameInteractivity(false);

  function applyThemeColors(nextTheme: Theme) {
    const root = document.querySelector<HTMLElement>('.macro-root');
    if (!root) {
      return;
    }
    root.style.setProperty('--macro-bg', nextTheme.bg);
    root.style.setProperty('--macro-surface', nextTheme.surface);
    root.style.setProperty('--macro-surface-alt', nextTheme.surfaceAlt);
    root.style.setProperty('--macro-text', nextTheme.text);
    root.style.setProperty('--macro-text-muted', nextTheme.textMuted);
    root.style.setProperty('--macro-accent', nextTheme.accent);
    root.style.setProperty('--macro-border', nextTheme.border);
  }

  function syncFromSettings() {
    const settings = getSettings();
    macros.value = _.cloneDeep(settings.macros);
    theme.value = _.cloneDeep(settings.theme);
    if (macros.value.length && !selectedId.value) {
      selectedId.value = macros.value[0].id;
    }
    if (selectedId.value && !macros.value.some(macro => macro.id === selectedId.value)) {
      selectedId.value = macros.value[0]?.id ?? null;
    }
    applyThemeColors(theme.value);
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && visible.value) {
      close();
    }
  }

  function ensureMounted() {
    if (mountEl) {
      return;
    }
    if (!document.body || !document.head) {
      setTimeout(ensureMounted, 50);
      return;
    }

    setFrameLayout();
    styleElement = document.createElement('style');
    styleElement.setAttribute('data-macro-style', getScriptId());
    styleElement.textContent = buildStyleText();
    document.head.appendChild(styleElement);

    mountEl = document.createElement('div');
    mountEl.className = 'macro-mount';
    mountEl.setAttribute('script_id', getScriptId());
    document.body.appendChild(mountEl);

    app = createApp(App);
    const currentCharacterLabel = computed(() => getCurrentCharacterLabel());
    const uiContext: MacroUiContext = {
      visible,
      macros,
      theme,
      selectedId,
      selectedMacro,
      selectMacro: id => {
        selectedId.value = id;
      },
      currentCharacterLabel,
      bindCurrentCharacter: () => {
        const current = selectedMacro.value;
        if (!current) {
          return;
        }
        current.scope = 'character';
        current.characterId = getCurrentCharacterId();
      },
      close: () => {
        visible.value = false;
      },
      addMacro: () => {
        const name = getUniqueName('新快捷语句', macros.value);
        const macro: Macro = {
          id: SillyTavern.uuidv4(),
          name,
          content: '',
          send: false,
          append: false,
          newline: true,
          scope: 'global',
          characterId: '',
          pinned: false,
          lastUsedAt: 0,
          enabled: true,
        };
        macros.value.push(macro);
        selectedId.value = macro.id;
      },
      duplicateMacro: () => {
        const current = selectedMacro.value;
        if (!current) {
          return;
        }
        const name = getUniqueName(`${current.name} 副本`, macros.value);
        const macro: Macro = {
          ..._.cloneDeep(current),
          id: SillyTavern.uuidv4(),
          name,
        };
        macros.value.push(macro);
        selectedId.value = macro.id;
      },
      removeMacro: () => {
        const current = selectedMacro.value;
        if (!current) {
          return;
        }
        const next = macros.value.filter(macro => macro.id !== current.id);
        macros.value = next;
        selectedId.value = next[0]?.id ?? null;
      },
      moveMacro: delta => {
        const current = selectedMacro.value;
        if (!current) {
          return;
        }
        const index = macros.value.findIndex(macro => macro.id === current.id);
        const nextIndex = index + delta;
        if (nextIndex < 0 || nextIndex >= macros.value.length) {
          return;
        }
        const reordered = [...macros.value];
        const [item] = reordered.splice(index, 1);
        reordered.splice(nextIndex, 0, item);
        macros.value = reordered;
      },
      resetTheme: () => {
        theme.value = { ...DEFAULT_THEME };
      },
      save: () => {
        const normalized = normalizeMacros(ensureScopeDefaults(macros.value, getCurrentCharacterId()));
        normalized.warnings.forEach(warning => toastr.warning(warning));
        const nextSettings: Settings = {
          macros: normalized.macros,
          theme: ThemeSchema.parse(theme.value),
        };
        onSave(nextSettings);
        visible.value = false;
      },
    };
    app.provide(MacroUiKey, uiContext);
    app.mount(mountEl);
    applyThemeColors(ThemeSchema.parse(theme.value));
    setFrameInteractivity(visible.value);
  }

  watch(
    () => theme.value,
    nextTheme => applyThemeColors(ThemeSchema.parse(nextTheme)),
    { deep: true },
  );

  watch(
    () => visible.value,
    async nextVisible => {
      if (nextVisible) {
        await nextTick();
        setFrameInteractivity(true);
      } else {
        setFrameInteractivity(false);
      }
    },
  );

  function open() {
    ensureMounted();
    syncFromSettings();
    visible.value = true;
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>('[data-focus="name"]');
      input?.focus();
    }, 0);
  }

  function close() {
    visible.value = false;
    setFrameInteractivity(false);
  }

  window.parent.addEventListener('keydown', onKeydown);

  return {
    open,
    syncFromSettings,
    destroy: () => {
      window.parent.removeEventListener('keydown', onKeydown);
      app?.unmount();
      mountEl?.remove();
      styleElement?.remove();
      mountEl = null;
      styleElement = null;
      app = null;
      setFrameInteractivity(false);
    },
  };
}
