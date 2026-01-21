import { computed, createApp, ref, watch } from 'vue';

import { createScriptIdDiv } from '../../../util/script';
import App from '../ui/App.vue';
import { MacroUiKey } from '../ui/context';
import type { Macro, MacroUiContext, Theme } from '../ui/context';

const ThemeSchema = z
  .object({
    bg: z.string().default('#f6f1ea'),
    surface: z.string().default('#ffffff'),
    surfaceAlt: z.string().default('#f1ebe4'),
    text: z.string().default('#1c1c1c'),
    textMuted: z.string().default('#6a5f54'),
    accent: z.string().default('#d9934f'),
    border: z.string().default('#e3d6c9'),
  })
  .prefault({});

const MacroSchema = z
  .object({
    id: z.string().default(''),
    name: z.string().default(''),
    content: z.string().default(''),
    send: z.boolean().default(false),
    append: z.boolean().default(false),
    newline: z.boolean().default(true),
    scope: z.enum(['global', 'character']).default('global'),
    characterId: z.string().default(''),
  })
  .prefault({});

const SettingsSchema = z
  .object({
    macros: z.array(MacroSchema).default([]),
    theme: ThemeSchema.default({}),
  })
  .prefault({ macros: [], theme: ThemeSchema.parse({}) });

type Settings = z.infer<typeof SettingsSchema>;

const SCRIPT_OPTION: VariableOption = { type: 'script', script_id: getScriptId() };
const MANAGE_BUTTON_NAME = '管理快捷语句';

const DEFAULT_MACROS: Macro[] = [
  {
    id: '',
    name: '问候',
    content: '你好！',
    send: false,
    append: false,
    newline: true,
    scope: 'global',
    characterId: '',
  },
  {
    id: '',
    name: '继续',
    content: '继续。',
    send: true,
    append: false,
    newline: true,
    scope: 'global',
    characterId: '',
  },
];

const DEFAULT_THEME: Theme = ThemeSchema.parse({});

function ensureMacroIds(macros: Macro[]): Macro[] {
  return macros.map(macro => ({
    ...macro,
    id: macro.id || SillyTavern.uuidv4(),
  }));
}

function getCurrentCharacterId(): string {
  const raw = (SillyTavern as any)?.characterId ?? (SillyTavern as any)?.getContext?.().characterId ?? '';
  if (raw === undefined || raw === null) {
    return '';
  }
  return String(raw);
}

function getCurrentCharacterLabel(): string {
  const id = getCurrentCharacterId();
  const idx = Number(id);
  const list = (SillyTavern as any)?.characters as { name?: string }[] | undefined;
  if (!Number.isNaN(idx) && list?.[idx]?.name) {
    return `当前角色：${list[idx].name}`;
  }
  return id ? `当前角色ID：${id}` : '未选择角色';
}

function ensureScopeDefaults(macros: Macro[]): Macro[] {
  const currentId = getCurrentCharacterId();
  return macros.map(macro => {
    if (macro.scope === 'character' && !macro.characterId) {
      return { ...macro, characterId: currentId };
    }
    return macro;
  });
}

function normalizeMacros(macros: Macro[]): { macros: Macro[]; warnings: string[] } {
  const warnings: string[] = [];
  const seen = new Set<string>();
  const normalized: Macro[] = [];

  for (const macro of macros) {
    const name = macro.name.trim();
    if (!name) {
      warnings.push('忽略空名称的快捷语句。');
      continue;
    }
    if (name === MANAGE_BUTTON_NAME) {
      warnings.push(`快捷语句名称 "${MANAGE_BUTTON_NAME}" 保留，已忽略。`);
      continue;
    }
    if (seen.has(name)) {
      warnings.push(`快捷语句名称 "${name}" 重复，已忽略后续条目。`);
      continue;
    }
    seen.add(name);
    normalized.push({ ...macro, name });
  }

  return { macros: ensureMacroIds(normalized), warnings };
}

function loadSettings(): Settings {
  const raw = getVariables(SCRIPT_OPTION);
  let settings = SettingsSchema.parse(raw ?? {});

  if (!Array.isArray(raw?.macros)) {
    settings = { macros: ensureMacroIds(DEFAULT_MACROS), theme: DEFAULT_THEME };
    replaceVariables(settings, SCRIPT_OPTION);
  } else {
    settings.macros = ensureMacroIds(settings.macros);
  }

  settings.macros = ensureScopeDefaults(settings.macros);

  if (!raw?.theme) {
    settings.theme = DEFAULT_THEME;
    replaceVariables(settings, SCRIPT_OPTION);
  }

  return settings;
}

function saveSettings(settings: Settings) {
  replaceVariables(settings, SCRIPT_OPTION);
}

function getUniqueName(baseName: string, macros: Macro[]): string {
  const existing = new Set(macros.map(macro => macro.name));
  if (!existing.has(baseName)) {
    return baseName;
  }
  let index = 2;
  while (existing.has(`${baseName} ${index}`)) {
    index += 1;
  }
  return `${baseName} ${index}`;
}

function findInput(): JQuery<HTMLTextAreaElement> | null {
  const selectors = [
    '#send_textarea',
    '#sendTextArea',
    '#send-textarea',
    'textarea#send_textarea',
    'textarea#sendTextArea',
    'textarea#send-textarea',
    'textarea[name="send_textarea"]',
  ];

  for (const selector of selectors) {
    const $input = $(selector).first() as JQuery<HTMLTextAreaElement>;
    if ($input.length) {
      return $input;
    }
  }

  return null;
}

function clickSendButton() {
  const $button = $('#send_but, #send_button, #send').first();
  if ($button.length) {
    $button.trigger('click');
    return;
  }
  toastr.warning('未找到发送按钮，请手动发送。');
}

async function sendMacroContent(content: string): Promise<boolean> {
  const trimmed = content.trimEnd();
  if (!trimmed.trim()) {
    toastr.warning('快捷语句为空，未发送。');
    return true;
  }

  try {
    await createChatMessages([{ role: 'user', message: trimmed }]);
    await triggerSlash('/trigger');
    return true;
  } catch (error) {
    console.error('快捷语句发送失败，尝试点击发送按钮。', error);
    return false;
  }
}

async function applyMacro(macro: Macro) {
  const $input = findInput();
  if (!$input) {
    toastr.error('未找到输入框，无法插入快捷语句。');
    return;
  }

  const current = String($input.val() ?? '');
  const prefix = macro.append && current ? (macro.newline ? '\n' : '') : '';
  const replacement = macro.append
    ? `${current}${prefix}${macro.content}`
    : `${macro.content}${macro.newline ? '\n' : ''}`;

  $input.val(replacement);
  $input.trigger('input');
  $input.trigger('change');
  $input.trigger('focus');

  if (macro.send) {
    const sent = await sendMacroContent(replacement);
    if (sent) {
      $input.val('');
      $input.trigger('input');
      $input.trigger('change');
      return;
    }
    SillyTavern.activateSendButtons?.();
    setTimeout(clickSendButton, 0);
  }
}

function renderButtons(settings: Settings) {
  const currentId = getCurrentCharacterId();
  const visibleMacros = settings.macros.filter(macro => {
    if (macro.scope === 'global') {
      return true;
    }
    return macro.characterId && macro.characterId === currentId;
  });
  const buttons: ScriptButton[] = [
    { name: MANAGE_BUTTON_NAME, visible: true },
    ...visibleMacros.map(macro => ({ name: macro.name, visible: true })),
  ];

  replaceScriptButtons(buttons);
}

const macroButtonStops: EventOnReturn[] = [];
let manageButtonStop: EventOnReturn | null = null;

function clearMacroButtonEvents() {
  while (macroButtonStops.length) {
    macroButtonStops.pop()!.stop();
  }
}

function bindMacroEvents(settings: Settings) {
  clearMacroButtonEvents();
  const currentId = getCurrentCharacterId();
  settings.macros
    .filter(macro => macro.scope === 'global' || (macro.scope === 'character' && macro.characterId === currentId))
    .forEach(macro => {
      macroButtonStops.push(
        eventOn(getButtonEvent(macro.name), () => {
          void applyMacro(macro);
        }),
      );
    });
}

function ensureManageButton(manager: { open: () => void }) {
  if (manageButtonStop) {
    return;
  }
  manageButtonStop = eventOn(getButtonEvent(MANAGE_BUTTON_NAME), () => {
    manager.open();
  });
}

function buildStyleText() {
  return `
    .macro-root {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      display: none;
      align-items: center;
      justify-content: center;
      font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
      color: var(--macro-text, #f5f5f7);
      --macro-bg: #f6f1ea;
      --macro-surface: #ffffff;
      --macro-surface-alt: #f1ebe4;
      --macro-text: #1c1c1c;
      --macro-text-muted: #6a5f54;
      --macro-accent: #d9934f;
      --macro-border: #e3d6c9;
      z-index: 9999;
    }

    .macro-root.open {
      display: flex;
    }

    .macro-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(10, 12, 16, 0.55);
      backdrop-filter: blur(4px);
    }

    .macro-panel {
      position: relative;
      width: min(980px, 96vw);
      height: min(680px, 92vh);
      background: var(--macro-surface) !important;
      border: 1px solid var(--macro-border) !important;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
      z-index: 1;
      color: var(--macro-text) !important;
    }

    .macro-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--macro-border);
      background: linear-gradient(135deg, rgba(217, 147, 79, 0.14), rgba(255, 250, 243, 0.92));
    }

    .macro-header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .macro-title__main {
      font-size: 18px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .macro-title__sub {
      font-size: 12px;
      color: var(--macro-text-muted);
      margin-top: 4px;
    }

    .macro-close {
      border: 1px solid var(--macro-border);
      background: transparent;
      color: var(--macro-text);
      border-radius: 10px;
      padding: 6px 12px;
      cursor: pointer;
    }

    .macro-icon-btn {
      border: 1px solid var(--macro-border);
      background: color-mix(in srgb, var(--macro-surface) 82%, var(--macro-text) 18%);
      color: var(--macro-text);
      border-radius: 10px;
      padding: 6px 10px;
      cursor: pointer;
      font-size: 12px;
      line-height: 1;
    }

    .macro-body {
      flex: 1;
      display: grid;
      grid-template-columns: 260px 1fr;
      min-height: 0;
    }

    .macro-sidebar {
      border-right: 1px solid var(--macro-border) !important;
      background: var(--macro-surface-alt) !important;
      display: flex;
      flex-direction: column;
      min-height: 0;
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
      padding: 0 12px 12px;
    }

    .macro-item {
      border: 1px solid transparent;
      background: transparent;
      border-radius: 10px;
      padding: 10px 12px;
      margin-bottom: 8px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 4px;
      text-align: left;
      color: inherit;
    }

    .macro-item__row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .macro-item__actions {
      display: flex;
      gap: 6px;
    }

    .macro-item.active {
      border-color: rgba(76, 195, 255, 0.6);
      background: rgba(76, 195, 255, 0.12);
    }

    .macro-item__name {
      font-size: 14px;
      font-weight: 600;
    }

    .macro-item__meta {
      font-size: 12px;
      color: var(--macro-text-muted);
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
      border-radius: 10px;
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
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--macro-accent) 30%, transparent) !important;
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

    .macro-theme-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .macro-theme-modal {
      position: absolute;
      inset: 0;
      background: rgba(12, 14, 18, 0.65);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      z-index: 2;
    }

    .macro-theme-panel {
      width: min(720px, 92vw);
      background: var(--macro-surface);
      border: 1px solid var(--macro-border);
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-shadow: 0 18px 45px rgba(0, 0, 0, 0.25);
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
      background: var(--macro-surface-alt) !important;
      color: var(--macro-text) !important;
      border: 1px solid var(--macro-border) !important;
      border-radius: 10px;
      padding: 8px 12px;
      font-size: 13px;
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
    }

    .macro-theme-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      background: color-mix(in srgb, var(--macro-surface) 86%, var(--macro-text) 14%);
      border: 1px solid var(--macro-border);
      border-radius: 10px;
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
      background: color-mix(in srgb, var(--macro-surface) 82%, var(--macro-text) 18%);
      color: var(--macro-text);
      border-radius: 10px;
      padding: 8px 12px;
      font-size: 13px;
      cursor: pointer;
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
      background: rgba(10, 12, 16, 0.6);
    }

    @media (max-width: 900px) {
      .macro-body {
        grid-template-columns: 1fr;
      }

      .macro-sidebar {
        border-right: none;
        border-bottom: 1px solid var(--macro-border);
      }
    }
  `;
}

function createMacroManager(getSettings: () => Settings, onSave: (next: Settings) => void) {
  const visible = ref(false);
  const macros = ref<Macro[]>([]);
  const theme = ref<Theme>({ ...DEFAULT_THEME });
  const selectedId = ref<string | null>(null);
  const selectedMacro = computed(() => macros.value.find(macro => macro.id === selectedId.value) ?? null);

  let app: ReturnType<typeof createApp> | null = null;
  let $mount: JQuery<HTMLDivElement> | null = null;
  let $style: JQuery<HTMLElement> | null = null;

  function applyThemeColors(nextTheme: Theme) {
    if (!$mount) {
      return;
    }
    const $root = $mount.find('.macro-root');
    $root.css({
      '--macro-bg': nextTheme.bg,
      '--macro-surface': nextTheme.surface,
      '--macro-surface-alt': nextTheme.surfaceAlt,
      '--macro-text': nextTheme.text,
      '--macro-text-muted': nextTheme.textMuted,
      '--macro-accent': nextTheme.accent,
      '--macro-border': nextTheme.border,
    });
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

  function ensureMounted() {
    if ($mount) {
      return;
    }
    $style = $('<style>').attr('data-macro-style', getScriptId()).text(buildStyleText()).appendTo('head');
    $mount = createScriptIdDiv().addClass('macro-mount').appendTo('body');
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
        const normalized = normalizeMacros(ensureScopeDefaults(macros.value));
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
    app.mount($mount[0]);
  }

  watch(
    () => theme.value,
    nextTheme => applyThemeColors(ThemeSchema.parse(nextTheme)),
    { deep: true },
  );

  function open() {
    ensureMounted();
    syncFromSettings();
    visible.value = true;
    setTimeout(() => {
      const input = window.parent.document.querySelector<HTMLInputElement>('[data-focus="name"]');
      input?.focus();
    }, 0);
  }

  function close() {
    visible.value = false;
  }

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && visible.value) {
      close();
    }
  };

  window.parent.addEventListener('keydown', onKeydown);

  return {
    open,
    syncFromSettings,
    destroy: () => {
      window.parent.removeEventListener('keydown', onKeydown);
      app?.unmount();
      $mount?.remove();
      $style?.remove();
      $mount = null;
      $style = null;
      app = null;
    },
  };
}

export function initMacroManager() {
  let settings = loadSettings();
  const normalized = normalizeMacros(settings.macros);
  if (normalized.warnings.length) {
    normalized.warnings.forEach(warning => toastr.warning(warning));
  }
  settings = {
    macros: normalized.macros,
    theme: ThemeSchema.parse(settings.theme),
  };
  saveSettings(settings);
  renderButtons(settings);
  bindMacroEvents(settings);

  const manager = createMacroManager(
    () => settings,
    nextSettings => {
      settings = nextSettings;
      saveSettings(settings);
      renderButtons(settings);
      bindMacroEvents(settings);
    },
  );

  ensureManageButton(manager);

  const refreshOnChat = eventOn(tavern_events.CHAT_CHANGED, () => {
    renderButtons(settings);
    bindMacroEvents(settings);
  });

  $(window).on('pagehide', () => {
    clearMacroButtonEvents();
    refreshOnChat.stop();
    manageButtonStop?.stop();
    manageButtonStop = null;
    manager.destroy();
  });
}
