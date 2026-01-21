import { uuidv4 } from '../../../util/common';
import type { CardHubItem } from '../types';

const LIBRARY_KEY = 'cardhub_library';

type StoredLibrary = {
  entries: CardHubItem[];
};

function getGlobalStorage() {
  return {
    type: 'global',
  } as const;
}

function getScriptStorage() {
  return {
    type: 'script',
    script_id: getScriptId(),
  } as const;
}

function readLibrary(): StoredLibrary {
  const globalVars = TavernHelper.getVariables(getGlobalStorage()) as Record<string, unknown>;
  const globalRaw = globalVars?.[LIBRARY_KEY];
  if (globalRaw && typeof globalRaw === 'object') {
    const entries = Array.isArray((globalRaw as StoredLibrary).entries) ? (globalRaw as StoredLibrary).entries : [];
    return { entries };
  }

  const scriptVars = TavernHelper.getVariables(getScriptStorage()) as Record<string, unknown>;
  const scriptRaw = scriptVars?.[LIBRARY_KEY];
  if (!scriptRaw || typeof scriptRaw !== 'object') {
    return { entries: [] };
  }
  const entries = Array.isArray((scriptRaw as StoredLibrary).entries) ? (scriptRaw as StoredLibrary).entries : [];
  if (entries.length) {
    writeLibrary(entries);
  }
  return { entries };
}

function writeLibrary(entries: CardHubItem[]) {
  const vars = TavernHelper.getVariables(getGlobalStorage()) as Record<string, unknown>;
  TavernHelper.replaceVariables(
    {
      ...vars,
      [LIBRARY_KEY]: { entries },
    },
    getGlobalStorage(),
  );
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

function parseJsonSafe(raw: string): any | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function decodeBase64Text(value: string): string | null {
  try {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

function isLikelyBase64(value: string): boolean {
  if (value.length < 16 || value.length % 4 !== 0) {
    return false;
  }
  return /^[A-Za-z0-9+/=]+$/.test(value);
}

function parseCardPayload(value: string): any | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const direct = parseJsonSafe(trimmed);
  if (direct) {
    return direct;
  }
  if (!isLikelyBase64(trimmed)) {
    return null;
  }
  const decoded = decodeBase64Text(trimmed);
  if (!decoded) {
    return null;
  }
  return parseJsonSafe(decoded);
}

function extractCardTagsFromData(data: any): string[] {
  const tags = data?.tags ?? data?.data?.tags;
  if (!Array.isArray(tags)) {
    return [];
  }
  return tags
    .filter(tag => typeof tag === 'string')
    .map(tag => tag.trim())
    .filter(Boolean);
}

function dataUrlToBytes(dataUrl: string): Uint8Array | null {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) {
    return null;
  }
  const base64 = dataUrl.slice(comma + 1);
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

function readUint32BE(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
}

function parseTextChunk(data: Uint8Array): { key: string; value: string } | null {
  const nullIndex = data.indexOf(0);
  if (nullIndex < 0) {
    return null;
  }
  const key = bytesToString(data.subarray(0, nullIndex)).trim();
  const value = bytesToString(data.subarray(nullIndex + 1)).trim();
  if (!key || !value) {
    return null;
  }
  return { key, value };
}

function parseIntlTextChunk(data: Uint8Array): { key: string; value: string } | null {
  const nullIndex = data.indexOf(0);
  if (nullIndex < 0 || nullIndex + 2 >= data.length) {
    return null;
  }
  const key = bytesToString(data.subarray(0, nullIndex)).trim();
  const compressed = data[nullIndex + 1] === 1;
  let cursor = nullIndex + 2;
  const langEnd = data.indexOf(0, cursor);
  if (langEnd < 0) {
    return null;
  }
  cursor = langEnd + 1;
  const translatedEnd = data.indexOf(0, cursor);
  if (translatedEnd < 0) {
    return null;
  }
  cursor = translatedEnd + 1;
  if (compressed) {
    return null;
  }
  const value = bytesToString(data.subarray(cursor)).trim();
  if (!key || !value) {
    return null;
  }
  return { key, value };
}

function extractPngTextChunks(bytes: Uint8Array): Array<{ key: string; value: string }> {
  if (bytes.length < 8) {
    return [];
  }
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < signature.length; i += 1) {
    if (bytes[i] !== signature[i]) {
      return [];
    }
  }
  const chunks: Array<{ key: string; value: string }> = [];
  let offset = 8;
  while (offset + 8 <= bytes.length) {
    const length = readUint32BE(bytes, offset);
    const type = bytesToString(bytes.subarray(offset + 4, offset + 8));
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > bytes.length) {
      break;
    }
    const data = bytes.subarray(dataStart, dataEnd);
    if (type === 'tEXt') {
      const entry = parseTextChunk(data);
      if (entry) {
        chunks.push(entry);
      }
    } else if (type === 'iTXt') {
      const entry = parseIntlTextChunk(data);
      if (entry) {
        chunks.push(entry);
      }
    }
    offset = dataEnd + 4;
  }
  return chunks;
}

function parsePngCardName(dataUrl: string): string | null {
  const bytes = dataUrlToBytes(dataUrl);
  if (!bytes) {
    return null;
  }
  const chunks = extractPngTextChunks(bytes);
  const allowedKeys = new Set(['chara', 'character', 'tavern', 'tavern_character', 'card']);
  for (const chunk of chunks) {
    if (chunk.key && !allowedKeys.has(chunk.key.toLowerCase())) {
      continue;
    }
    const parsed = parseCardPayload(chunk.value);
    const name = parsed?.name ?? parsed?.data?.name;
    if (typeof name === 'string' && name.trim()) {
      return name.trim();
    }
  }
  return null;
}

function parsePngCardTags(dataUrl: string): string[] {
  const bytes = dataUrlToBytes(dataUrl);
  if (!bytes) {
    return [];
  }
  const chunks = extractPngTextChunks(bytes);
  const allowedKeys = new Set(['chara', 'character', 'tavern', 'tavern_character', 'card']);
  for (const chunk of chunks) {
    if (chunk.key && !allowedKeys.has(chunk.key.toLowerCase())) {
      continue;
    }
    const parsed = parseCardPayload(chunk.value);
    if (parsed) {
      const tags = extractCardTagsFromData(parsed);
      if (tags.length) {
        return tags;
      }
    }
  }
  return [];
}

function parseJsonCardTags(raw: string): string[] {
  const parsed = parseJsonSafe(raw);
  return parsed ? extractCardTagsFromData(parsed) : [];
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
  const stored = readLibrary().entries;
  let changed = false;
  const now = Date.now();
  const entries = stored.map((entry, index) => {
    const normalized: CardHubItem = {
      ...entry,
      origin: entry.origin ?? 'library',
      tags: Array.isArray(entry.tags) ? entry.tags : [],
    };
    if (!normalized.tagsEdited && !normalized.tags.length && normalized.raw && normalized.rawType) {
      const rawTags =
        normalized.rawType === 'png' ? parsePngCardTags(normalized.raw) : parseJsonCardTags(normalized.raw);
      if (rawTags.length) {
        normalized.tags = rawTags;
        changed = true;
      }
    }
    if (typeof normalized.createdAt === 'number') {
      return normalized;
    }
    changed = true;
    return {
      ...normalized,
      createdAt: now - (stored.length - 1 - index) * 1000,
    };
  });
  if (changed) {
    writeLibrary(entries);
  }
  return entries;
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
      const parsedName = parsePngCardName(dataUrl) ?? name;
      const parsedTags = parsePngCardTags(dataUrl);
      const fingerprint = buildFingerprint('png', dataUrl);
      if (fingerprints.has(fingerprint)) {
        continue;
      }
      fingerprints.add(fingerprint);
      nextEntries.push({
        id: uuidv4(),
        name: parsedName,
        avatar: dataUrl,
        tags: parsedTags,
        origin: 'library',
        importFileName: file.name,
        rawType: 'png',
        raw: dataUrl,
        fingerprint,
        createdAt: Date.now(),
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
      const parsedTags = parseJsonCardTags(text);
      const fingerprint = buildFingerprint('json', text);
      if (fingerprints.has(fingerprint)) {
        continue;
      }
      fingerprints.add(fingerprint);
      nextEntries.push({
        id: uuidv4(),
        name: parsedName,
        avatar: null,
        tags: parsedTags,
        origin: 'library',
        importFileName: file.name,
        rawType: 'json',
        raw: text,
        fingerprint,
        createdAt: Date.now(),
      });
    }
  }

  const merged = [...current, ...nextEntries];
  writeLibrary(merged);
  return merged;
}

export function updateLibraryTags(entryId: string, tags: string[], existingEntries?: CardHubItem[]): CardHubItem[] {
  const current = Array.isArray(existingEntries) && existingEntries.length ? existingEntries : loadLibrary();
  const updated = current.map(entry => {
    if (entry.id !== entryId) {
      return entry;
    }
    return { ...entry, tags, tagsEdited: true };
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
