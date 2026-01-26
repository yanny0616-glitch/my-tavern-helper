import { createMacroButtonManager } from '../integration/buttons';
import { getCurrentCharacterId } from '../integration/character';
import { applyMacro } from '../integration/input';
import { normalizeMacros } from '../core/macros';
import { loadSettings, saveSettings } from '../core/settings';
import { ThemeSchema } from '../core/schema';
import { createMacroManager } from '../ui/manager';
import type { Macro } from '../ui/context';

export function initMacroManager() {
  let settings = loadSettings(getCurrentCharacterId);
  const normalized = normalizeMacros(settings.macros);
  if (normalized.warnings.length) {
    normalized.warnings.forEach(warning => toastr.warning(warning));
  }
  settings = {
    macros: normalized.macros,
    theme: ThemeSchema.parse(settings.theme),
  };
  saveSettings(settings);
  let manager: ReturnType<typeof createMacroManager>;

  const applyMacroWithUsage = async (macro: Macro) => {
    await applyMacro(macro);
    const target = settings.macros.find(item => item.id === macro.id);
    if (!target) {
      return;
    }
    target.lastUsedAt = Date.now();
    saveSettings(settings);
    manager?.syncFromSettings();
  };

  const buttonManager = createMacroButtonManager({ getCurrentCharacterId, applyMacro: applyMacroWithUsage });
  buttonManager.render(settings);
  buttonManager.bind(settings);

  manager = createMacroManager(
    () => settings,
    nextSettings => {
      settings = nextSettings;
      saveSettings(settings);
      buttonManager.render(settings);
      buttonManager.bind(settings);
    },
  );

  buttonManager.ensureManageButton(manager);

  const refreshOnChat = eventOn(tavern_events.CHAT_CHANGED, () => {
    buttonManager.render(settings);
    buttonManager.bind(settings);
  });

  $(window).on('pagehide', () => {
    refreshOnChat.stop();
    buttonManager.dispose();
    manager.destroy();
  });
}
