import { loadGlobalState, updateGlobalState } from './globalState';

export type StorageMode = 'variables' | 'indexeddb';

export type StorageSettings = {
  mode: StorageMode;
};

const DEFAULT_SETTINGS: StorageSettings = {
  mode: 'variables',
};

function normalizeSettings(raw: unknown): StorageSettings {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_SETTINGS };
  }
  const data = raw as Record<string, unknown>;
  const modeValue = typeof data.mode === 'string' ? data.mode : DEFAULT_SETTINGS.mode;
  const mode: StorageMode =
    modeValue === 'indexeddb' || modeValue === 'variables' ? modeValue : DEFAULT_SETTINGS.mode;
  return {
    mode,
  };
}

export function loadStorageSettings(): StorageSettings {
  const state = loadGlobalState();
  return normalizeSettings(state?.storageSettings);
}

export function saveStorageSettings(settings: StorageSettings): void {
  updateGlobalState({ storageSettings: settings });
}
