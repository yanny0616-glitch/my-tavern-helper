import { FeatureSettings } from './types';

const SETTINGS_KEY = 'th_ios_guard_settings_v1';

const DEFAULT_SETTINGS: FeatureSettings = {
  enableCrashGuard: true,
  enableSelectionGuard: true,
  enableMemorySnapshot: true,
  enableHeavyMode: false,
  enableAutoLightModeOnBackground: true,
};

export function getDefaultSettings(): FeatureSettings {
  return { ...DEFAULT_SETTINGS };
}

export function loadSettings(): FeatureSettings {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) {
    return getDefaultSettings();
  }
  try {
    const parsed = JSON.parse(raw) as Partial<FeatureSettings>;
    return {
      enableCrashGuard:
        typeof parsed.enableCrashGuard === 'boolean' ? parsed.enableCrashGuard : DEFAULT_SETTINGS.enableCrashGuard,
      enableSelectionGuard:
        typeof parsed.enableSelectionGuard === 'boolean'
          ? parsed.enableSelectionGuard
          : DEFAULT_SETTINGS.enableSelectionGuard,
      enableMemorySnapshot:
        typeof parsed.enableMemorySnapshot === 'boolean'
          ? parsed.enableMemorySnapshot
          : DEFAULT_SETTINGS.enableMemorySnapshot,
      enableHeavyMode:
        typeof parsed.enableHeavyMode === 'boolean' ? parsed.enableHeavyMode : DEFAULT_SETTINGS.enableHeavyMode,
      enableAutoLightModeOnBackground:
        typeof parsed.enableAutoLightModeOnBackground === 'boolean'
          ? parsed.enableAutoLightModeOnBackground
          : DEFAULT_SETTINGS.enableAutoLightModeOnBackground,
    };
  } catch {
    return getDefaultSettings();
  }
}

export function saveSettings(settings: FeatureSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
