import type { CardHubItem } from '../types';

const DB_NAME = 'cardhub_storage';
const DB_VERSION = 2;
const STORE_NAME = 'library';
const LIBRARY_KEY = 'entries';

let dbPromise: Promise<IDBDatabase> | null = null;

export function isIndexedDbAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
  return dbPromise;
}

export async function readLibraryFromIndexedDb(): Promise<CardHubItem[]> {
  if (!isIndexedDbAvailable()) {
    return [];
  }
  const db = await openDb();
  return await new Promise<CardHubItem[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(LIBRARY_KEY);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const result = request.result;
      resolve(Array.isArray(result) ? (result as CardHubItem[]) : []);
    };
  });
}

export async function writeLibraryToIndexedDb(entries: CardHubItem[]): Promise<void> {
  if (!isIndexedDbAvailable()) {
    return;
  }
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(entries, LIBRARY_KEY);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
