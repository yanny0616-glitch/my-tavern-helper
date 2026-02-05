import { reactive } from 'vue';
import type { ExtensionEntry } from '../types';

export const extensionManagerState = reactive({
  open: false,
  loading: false,
  filter: '',
  entries: [] as ExtensionEntry[],
  updateSelection: {} as Record<string, boolean>,
  updating: false,
});

export const extensionManagerActions: {
  refresh?: () => Promise<void> | void;
  close?: () => void;
} = {};

export function setOpen(value: boolean) {
  extensionManagerState.open = value;
}

export function setLoading(value: boolean) {
  extensionManagerState.loading = value;
}

export function setFilter(value: string) {
  extensionManagerState.filter = value;
}

export function setEntries(entries: ExtensionEntry[]) {
  extensionManagerState.entries = entries;
  syncUpdateSelection(entries);
}

export function setUpdateSelected(name: string, value: boolean) {
  if (value) {
    extensionManagerState.updateSelection[name] = true;
  } else {
    delete extensionManagerState.updateSelection[name];
  }
}

export function clearUpdateSelection() {
  Object.keys(extensionManagerState.updateSelection).forEach(key => {
    delete extensionManagerState.updateSelection[key];
  });
}

export function setUpdating(value: boolean) {
  extensionManagerState.updating = value;
}

function syncUpdateSelection(entries: ExtensionEntry[]) {
  const allowed = new Set(
    entries.filter(entry => entry.update?.status === 'update-available').map(entry => entry.name),
  );
  Object.keys(extensionManagerState.updateSelection).forEach(name => {
    if (!allowed.has(name)) {
      delete extensionManagerState.updateSelection[name];
    }
  });
}
