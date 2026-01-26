import type { Settings } from './schema';
import { SCRIPT_OPTION } from './constants';
import { ensureMacroIds, ensureScopeDefaults } from './macros';
import { DEFAULT_MACROS, DEFAULT_THEME, SettingsSchema } from './schema';

export function loadSettings(getCurrentCharacterId: () => string): Settings {
  const raw = getVariables(SCRIPT_OPTION);
  let settings = SettingsSchema.parse(raw ?? {});

  if (!Array.isArray(raw?.macros)) {
    settings = { macros: ensureMacroIds(DEFAULT_MACROS), theme: DEFAULT_THEME };
    replaceVariables(settings, SCRIPT_OPTION);
  } else {
    settings.macros = ensureMacroIds(settings.macros);
  }

  settings.macros = ensureScopeDefaults(settings.macros, getCurrentCharacterId());

  if (!raw?.theme) {
    settings.theme = DEFAULT_THEME;
    replaceVariables(settings, SCRIPT_OPTION);
  }

  return settings;
}

export function saveSettings(settings: Settings) {
  replaceVariables(settings, SCRIPT_OPTION);
}
