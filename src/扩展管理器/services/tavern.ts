import { TavernContext } from '../types';

type SillyTavernLike = {
  getContext: () => TavernContext;
};

export function getSillyTavern(): SillyTavernLike {
  return ((window.parent as { SillyTavern?: SillyTavernLike })?.SillyTavern ??
    (window as { SillyTavern?: SillyTavernLike }).SillyTavern)!;
}

export function getContext(): TavernContext {
  return getSillyTavern().getContext();
}

export function getExtensionSettings(ctx: TavernContext): Record<string, unknown> {
  return (ctx.extensionSettings as Record<string, unknown>) ?? {};
}

export function saveSettings(ctx: TavernContext): void {
  ctx.saveSettingsDebounced?.();
}
