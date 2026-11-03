/**
 * EKEA — stockage local-first
 *
 * - Métadonnées structurées : localStorage (rapide, synchrone au démarrage).
 * - Fichiers binaires (PDF/images) : IndexedDB, jamais transformés en base64
 *   dans l’état applicatif, pour rester performant sur les iPhone anciens.
 *
 * Aucune donnée n’est envoyée à un serveur par ce module.
 */

const NS = 'ekea.v1';

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${NS}.${key}`);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`${NS}.${key}`, JSON.stringify(value));
  } catch (error) {
    // Quota dépassé : on prévient l’utilisateur plutôt que d’échouer en silence.
    console.warn('[EKEA] Sauvegarde locale impossible', error);
    throw new Error('STORAGE_FULL');
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(`${NS}.${key}`);
  } catch {
    /* ignore */
  }
}

/* -------------------------------------------------------------------------- */
/*  IndexedDB — stockage des fichiers                                         */
/* -------------------------------------------------------------------------- */

const DB_NAME = 'ekea-files';
const DB_VERSION = 1;
const STORE = 'files';

export interface StoredFile {
  id: string;
  blob: Blob;
  name: string;
  type: string;
  size: number;
  createdAt: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('INDEXEDDB_UNAVAILABLE'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('INDEXEDDB_ERROR'));
  });
  return dbPromise;
}

export async function saveFile(file: Omit<StoredFile, 'createdAt'>): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({ ...file, createdAt: new Date().toISOString() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('WRITE_FAILED'));
  });
}

export async function getFile(id: string): Promise<StoredFile | null> {
  try {
    const db = await openDB();
    return await new Promise<StoredFile | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).get(id);
      request.onsuccess = () => resolve((request.result as StoredFile) ?? null);
      request.onerror = () => reject(request.error ?? new Error('READ_FAILED'));
    });
  } catch {
    return null;
  }
}

export async function deleteFile(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('DELETE_FAILED'));
    });
  } catch {
    /* un fichier déjà absent n’est pas une erreur */
  }
}

export async function clearFiles(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('CLEAR_FAILED'));
    });
  } catch {
    /* ignore */
  }
}

export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return null;
  const estimate = await navigator.storage.estimate();
  return { usage: estimate.usage ?? 0, quota: estimate.quota ?? 0 };
}

/** Crée et révoque proprement une URL d’objet pour la prévisualisation. */
export function objectURL(blob: Blob): string {
  return URL.createObjectURL(blob);
}

export function revokeURL(url: string | null | undefined): void {
  if (!url) return;
  try {
    URL.revokeObjectURL(url);
  } catch {
    /* ignore */
  }
}
