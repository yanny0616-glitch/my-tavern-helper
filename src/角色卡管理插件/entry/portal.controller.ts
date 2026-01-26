import { fetchCharacterSummaries } from '../services/characterSource';
import { loadLibrary } from '../services/libraryService';
import { cardHubState, setCharacters, setLibrary, setLoading, setOpen } from '../state/store';
import type { EntrySource } from '../types';
import { createPortalMount, destroyPortalMount, type PortalMount } from './portal.mount';

type CardHubController = {
  open: (source?: EntrySource) => void;
  close: () => void;
  toggle: (source?: EntrySource) => void;
  refresh: () => Promise<void>;
  destroy: () => void;
};

let portal: PortalMount | null = null;

function ensureMounted() {
  if (!portal) {
    portal = createPortalMount();
  }
}

async function refreshCharacters() {
  setLoading(true);
  try {
    const characters = await fetchCharacterSummaries();
    setCharacters(characters);
    const library = await loadLibrary();
    setLibrary(library);
  } finally {
    setLoading(false);
  }
}

export function createCardHubController(): CardHubController {
  return {
    open: (source = 'manual') => {
      ensureMounted();
      setOpen(true, source);
    },
    close: () => {
      setOpen(false);
    },
    toggle: (source = 'manual') => {
      ensureMounted();
      setOpen(!cardHubState.open, source);
    },
    refresh: async () => {
      ensureMounted();
      await refreshCharacters();
    },
    destroy: () => {
      if (portal) {
        destroyPortalMount(portal);
      }
      portal = null;
    },
  };
}
