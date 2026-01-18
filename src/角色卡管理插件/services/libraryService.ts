import { uuidv4 } from '../../../util/common';
import type { CardHubItem } from '../types';

const LIBRARY_KEY = 'cardhub_library';

type StoredLibrary = {
  entries: CardHubItem[];
};

function getStorage() {
  return {
    type: 'script',
    script_id: getScriptId(),
  } as const;
}

function readLibrary(): StoredLibrary {
  const vars = TavernHelper.getVariables(getStorage()) as Record<string, unknown>;
  const raw = vars?.[LIBRARY_KEY];
  if (!raw || typeof raw !== 'object') {
    return { entries: [] };
  }
  const entries = Array.isArray((raw as StoredLibrary).entries) ? (raw as StoredLibrary).entries : [];
  return { entries };
}

function writeLibrary(entries: CardHubItem[]) {
  const vars = TavernHelper.getVariables(getStorage()) as Record<string, unknown>;
  TavernHelper.replaceVariables(getStorage(), {
    ...vars,
    [LIBRARY_KEY]: { entries },
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function normalizeName(fileName: string): string {
  return fileName.replace(/\.(png|json)$/i, '');
}

export function loadLibrary(): CardHubItem[] {
  return readLibrary().entries;
}

export async function addToLibrary(files: FileList | File[]): Promise<CardHubItem[]> {
  const list = Array.from(files);
  if (!list.length) {
    return loadLibrary();
  }
  const current = loadLibrary();
  const nextEntries: CardHubItem[] = [];

  for (const file of list) {
    const name = normalizeName(file.name);
    if (file.name.toLowerCase().endsWith('.png')) {
      const dataUrl = await readFileAsDataUrl(file);
      nextEntries.push({
        id: uuidv4(),
        name,
        avatar: dataUrl,
        tags: [],
        origin: 'library',
        rawType: 'png',
        raw: dataUrl,
      });
    } else if (file.name.toLowerCase().endsWith('.json')) {
      const text = await readFileAsText(file);
      let parsedName = name;
      try {
        const json = JSON.parse(text) as { name?: string; data?: { name?: string } };
        parsedName = json.name ?? json.data?.name ?? parsedName;
      } catch {
        // ignore invalid json name parsing
      }
      nextEntries.push({
        id: uuidv4(),
        name: parsedName,
        avatar: null,
        tags: [],
        origin: 'library',
        rawType: 'json',
        raw: text,
      });
    }
  }

  const merged = [...current, ...nextEntries];
  writeLibrary(merged);
  return merged;
}

export function updateLibraryTags(entryId: string, tags: string[]): CardHubItem[] {
  const current = loadLibrary();
  const updated = current.map(entry => {
    if (entry.id !== entryId) {
      return entry;
    }
    return { ...entry, tags };
  });
  writeLibrary(updated);
  return updated;
}

export function removeFromLibrary(entryId: string): CardHubItem[] {
  const current = loadLibrary();
  const updated = current.filter(entry => entry.id !== entryId);
  writeLibrary(updated);
  return updated;
}



