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

function hashString(value: string): string {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(item => stableStringify(item)).join(',')}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`).join(',')}}`;
}

function buildFingerprint(rawType: CardHubItem['rawType'], raw: string): string {
  let source = raw;
  if (rawType === 'json') {
    const trimmed = raw.trim();
    try {
      source = stableStringify(JSON.parse(trimmed));
    } catch {
      source = trimmed;
    }
  }
  return `${rawType}:${hashString(source)}`;
}

function ensureFingerprint(entry: CardHubItem): string | null {
  if (entry.fingerprint) {
    return entry.fingerprint;
  }
  if (!entry.rawType || !entry.raw) {
    return null;
  }
  const fingerprint = buildFingerprint(entry.rawType, entry.raw);
  entry.fingerprint = fingerprint;
  return fingerprint;
}

export function loadLibrary(): CardHubItem[] {
  return readLibrary().entries;
}

export async function addToLibrary(files: FileList | File[], existingEntries?: CardHubItem[]): Promise<CardHubItem[]> {
  const list = Array.from(files);
  if (!list.length) {
    return loadLibrary();
  }
  const current = Array.isArray(existingEntries) && existingEntries.length ? existingEntries : loadLibrary();
  const fingerprints = new Set<string>();
  current.forEach(entry => {
    const fingerprint = ensureFingerprint(entry);
    if (fingerprint) {
      fingerprints.add(fingerprint);
    }
  });
  const nextEntries: CardHubItem[] = [];

  for (const file of list) {
    const name = normalizeName(file.name);
    if (file.name.toLowerCase().endsWith('.png')) {
      const dataUrl = await readFileAsDataUrl(file);
      const fingerprint = buildFingerprint('png', dataUrl);
      if (fingerprints.has(fingerprint)) {
        continue;
      }
      fingerprints.add(fingerprint);
      nextEntries.push({
        id: uuidv4(),
        name,
        avatar: dataUrl,
        tags: [],
        origin: 'library',
        rawType: 'png',
        raw: dataUrl,
        fingerprint,
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
      const fingerprint = buildFingerprint('json', text);
      if (fingerprints.has(fingerprint)) {
        continue;
      }
      fingerprints.add(fingerprint);
      nextEntries.push({
        id: uuidv4(),
        name: parsedName,
        avatar: null,
        tags: [],
        origin: 'library',
        rawType: 'json',
        raw: text,
        fingerprint,
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
