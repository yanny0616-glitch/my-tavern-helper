import type { Settings } from '../core/schema';
import type { Macro } from '../ui/context';
import { MANAGE_BUTTON_NAME } from '../core/constants';

type MacroButtonManagerOptions = {
  getCurrentCharacterId: () => string;
  applyMacro: (macro: Macro) => Promise<void>;
};

type MacroButtonManager = {
  render: (settings: Settings) => void;
  bind: (settings: Settings) => void;
  ensureManageButton: (manager: { open: () => void }) => void;
  dispose: () => void;
};

function getVisibleMacros(settings: Settings, currentId: string): Macro[] {
  return settings.macros.filter(macro => {
    if (!macro.enabled) {
      return false;
    }
    if (macro.scope === 'global') {
      return true;
    }
    return macro.characterId && macro.characterId === currentId;
  });
}

export function createMacroButtonManager(options: MacroButtonManagerOptions): MacroButtonManager {
  const macroButtonStops: EventOnReturn[] = [];
  let manageButtonStop: EventOnReturn | null = null;

  function clearMacroButtonEvents() {
    while (macroButtonStops.length) {
      macroButtonStops.pop()!.stop();
    }
  }

  function render(settings: Settings) {
    const currentId = options.getCurrentCharacterId();
    const visibleMacros = getVisibleMacros(settings, currentId);
    const buttons: ScriptButton[] = [
      { name: MANAGE_BUTTON_NAME, visible: true },
      ...visibleMacros.map(macro => ({ name: macro.name, visible: true })),
    ];

    replaceScriptButtons(buttons);
  }

  function bind(settings: Settings) {
    clearMacroButtonEvents();
    const currentId = options.getCurrentCharacterId();
    getVisibleMacros(settings, currentId).forEach(macro => {
      macroButtonStops.push(
        eventOn(getButtonEvent(macro.name), () => {
          void options.applyMacro(macro);
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

  function dispose() {
    clearMacroButtonEvents();
    manageButtonStop?.stop();
    manageButtonStop = null;
  }

  return {
    render,
    bind,
    ensureManageButton,
    dispose,
  };
}
