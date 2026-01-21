import { reactive } from 'vue';
import type { CardHubItem, EntrySource } from '../types';

type CardHubState = {
  open: boolean;
  loading: boolean;
  search: string;
  lastOpenSource: EntrySource;
  characters: CardHubItem[];
  library: CardHubItem[];
};

export const cardHubState = reactive<CardHubState>({
  open: false,
  loading: false,
  search: '',
  lastOpenSource: 'manual',
  characters: [],
  library: [],
});

export function setOpen(open: boolean, source?: EntrySource) {
  cardHubState.open = open;
  if (source) {
    cardHubState.lastOpenSource = source;
  }
}

export function setLoading(loading: boolean) {
  cardHubState.loading = loading;
}

export function setSearch(search: string) {
  cardHubState.search = search;
}

export function setCharacters(characters: CardHubItem[]) {
  cardHubState.characters = characters;
}

export function setLibrary(library: CardHubItem[]) {
  cardHubState.library = library.map(entry => ({
    ...entry,
    origin: entry.origin ?? 'library',
    tags: Array.isArray(entry.tags) ? entry.tags : [],
  }));
}
