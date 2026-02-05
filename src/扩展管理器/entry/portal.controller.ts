import { buildEntries } from '../services/entries';
import { getContext } from '../services/tavern';
import { extensionManagerActions, extensionManagerState, setEntries, setLoading, setOpen } from '../state/store';
import { createPortalMount, destroyPortalMount, type PortalMount } from './portal.mount';

export type ExtensionManagerController = {
  open: () => void;
  close: () => void;
  toggle: () => void;
  refresh: () => Promise<void>;
  destroy: () => void;
};

let portal: PortalMount | null = null;

function ensureMounted() {
  if (!portal) {
    portal = createPortalMount();
  }
}

async function refreshEntries() {
  setLoading(true);
  try {
    const ctx = getContext();
    const doc = window.parent?.document ?? document;
    const entries = await buildEntries(doc, ctx);
    setEntries(entries);
  } finally {
    setLoading(false);
  }
}

export function createExtensionManagerController(): ExtensionManagerController {
  const controller: ExtensionManagerController = {
    open: () => {
      ensureMounted();
      setOpen(true);
      void refreshEntries();
    },
    close: () => {
      setOpen(false);
    },
    toggle: () => {
      ensureMounted();
      const next = !extensionManagerState.open;
      setOpen(next);
      if (next) {
        void refreshEntries();
      }
    },
    refresh: async () => {
      ensureMounted();
      await refreshEntries();
    },
    destroy: () => {
      if (portal) {
        destroyPortalMount(portal);
      }
      portal = null;
    },
  };

  extensionManagerActions.refresh = controller.refresh;
  extensionManagerActions.close = controller.close;

  return controller;
}
