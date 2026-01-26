import type { StorageSettings } from './storageSettings';

const GLOBAL_STATE_KEY = 'cardhub_state';

type CardHubGlobalState = {
  library?: {
    entries?: unknown;
  };
  theme?: Record<string, string>;
  favorites?: unknown;
  lastChatCache?: unknown;
  importCache?: unknown;
  notes?: unknown;
  storageSettings?: StorageSettings;
  uiSettings?: {
    pageSize?: number;
    showNoteSummary?: boolean;
    exportFormat?: 'png' | 'json';
    tagRows?: number;
    avatarSize?: 'sm' | 'md' | 'lg';
    syncTavernTags?: boolean;
  };
};

const LEGACY_KEYS = {
  library: 'cardhub_library',
  theme: 'cardhub_theme',
  favorites: 'cardhub_favorites',
  lastChatCache: 'cardhub_last_chat_cache',
  importCache: 'cardhub_import_cache',
  notes: 'cardhub_notes',
  storageSettings: 'cardhub_storage_settings',
} as const;

function normalizeState(raw: unknown): CardHubGlobalState {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  return raw as CardHubGlobalState;
}

function readVariables(): Record<string, unknown> {
  return (TavernHelper.getVariables({ type: 'global' }) as Record<string, unknown>) ?? {};
}

function writeVariables(vars: Record<string, unknown>) {
  TavernHelper.replaceVariables(vars, { type: 'global' });
}

export function loadGlobalState(): CardHubGlobalState {
  const vars = readVariables();
  const state = normalizeState(vars[GLOBAL_STATE_KEY]);
  let migrated = false;
  const nextState: CardHubGlobalState = { ...state };

  if (!nextState.library && vars[LEGACY_KEYS.library] && typeof vars[LEGACY_KEYS.library] === 'object') {
    nextState.library = vars[LEGACY_KEYS.library] as CardHubGlobalState['library'];
    migrated = true;
  }
  if (!nextState.theme && vars[LEGACY_KEYS.theme]) {
    nextState.theme = vars[LEGACY_KEYS.theme] as CardHubGlobalState['theme'];
    migrated = true;
  }
  if (!nextState.favorites && vars[LEGACY_KEYS.favorites]) {
    nextState.favorites = vars[LEGACY_KEYS.favorites];
    migrated = true;
  }
  if (!nextState.lastChatCache && vars[LEGACY_KEYS.lastChatCache]) {
    nextState.lastChatCache = vars[LEGACY_KEYS.lastChatCache];
    migrated = true;
  }
  if (!nextState.importCache && vars[LEGACY_KEYS.importCache]) {
    nextState.importCache = vars[LEGACY_KEYS.importCache];
    migrated = true;
  }
  if (!nextState.notes && vars[LEGACY_KEYS.notes]) {
    nextState.notes = vars[LEGACY_KEYS.notes];
    migrated = true;
  }
  if (!nextState.storageSettings && vars[LEGACY_KEYS.storageSettings]) {
    nextState.storageSettings = vars[LEGACY_KEYS.storageSettings] as StorageSettings;
    migrated = true;
  }

  if (migrated) {
    const nextVars: Record<string, unknown> = { ...vars, [GLOBAL_STATE_KEY]: nextState };
    (Object.values(LEGACY_KEYS) as string[]).forEach(key => {
      delete nextVars[key];
    });
    writeVariables(nextVars);
  }

  return nextState;
}

export function saveGlobalState(state: CardHubGlobalState): void {
  const vars = readVariables();
  const nextVars: Record<string, unknown> = { ...vars, [GLOBAL_STATE_KEY]: state };
  (Object.values(LEGACY_KEYS) as string[]).forEach(key => {
    delete nextVars[key];
  });
  writeVariables(nextVars);
}

export function updateGlobalState(patch: Partial<CardHubGlobalState>): CardHubGlobalState {
  const state = loadGlobalState();
  const next = { ...state, ...patch };
  saveGlobalState(next);
  return next;
}
