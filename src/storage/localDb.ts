import { buildSamplePdfBlob, INITIAL_DATABASE } from '../data/seedData';
import { AtlasDatabaseState } from '../types/database';

const DB_NAME = 'AtlasBaseLocalDB';
const DB_VERSION = 1;
const STORE_STATE = 'state';
const STORE_FILES = 'files';
const STATE_KEY = 'main';
const FALLBACK_LS_KEY = 'atlasbase_state_v1';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_STATE)) {
        db.createObjectStore(STORE_STATE);
      }
      if (!db.objectStoreNames.contains(STORE_FILES)) {
        db.createObjectStore(STORE_FILES);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const EMPTY_DATABASE: AtlasDatabaseState = {
  experts: [],
  subcontractors: [],
  partners: [],
};

const MIGRATION_FLAG_KEY = 'atlasbase_empty_default_migrated_v1';

function isUntouchedSeed(state: AtlasDatabaseState): boolean {
  return (
    state.experts.length === INITIAL_DATABASE.experts.length &&
    state.subcontractors.length === INITIAL_DATABASE.subcontractors.length &&
    state.partners.length === INITIAL_DATABASE.partners.length &&
    state.experts.every((e, idx) => e.id === INITIAL_DATABASE.experts[idx]?.id && e.updatedAt === INITIAL_DATABASE.experts[idx]?.updatedAt)
  );
}

export async function loadDatabaseState(): Promise<AtlasDatabaseState> {
  try {
    const db = await openDatabase();
    const existing = await new Promise<AtlasDatabaseState | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_STATE, 'readonly');
      const req = tx.objectStore(STORE_STATE).get(STATE_KEY);
      req.onsuccess = () => resolve(req.result as AtlasDatabaseState | undefined);
      req.onerror = () => reject(req.error);
    });

    if (existing && Array.isArray(existing.experts)) {
      if (!localStorage.getItem(MIGRATION_FLAG_KEY)) {
        localStorage.setItem(MIGRATION_FLAG_KEY, '1');
        if (isUntouchedSeed(existing)) {
          await clearAllDatabase();
          return EMPTY_DATABASE;
        }
      }
      return existing;
    }

    localStorage.setItem(MIGRATION_FLAG_KEY, '1');
    await saveDatabaseState(EMPTY_DATABASE);
    return EMPTY_DATABASE;
  } catch {
    const raw = localStorage.getItem(FALLBACK_LS_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as AtlasDatabaseState;
        if (!localStorage.getItem(MIGRATION_FLAG_KEY)) {
          localStorage.setItem(MIGRATION_FLAG_KEY, '1');
          if (isUntouchedSeed(parsed)) {
            localStorage.setItem(FALLBACK_LS_KEY, JSON.stringify(EMPTY_DATABASE));
            return EMPTY_DATABASE;
          }
        }
        return parsed;
      } catch {
        // ignore
      }
    }
    localStorage.setItem(MIGRATION_FLAG_KEY, '1');
    localStorage.setItem(FALLBACK_LS_KEY, JSON.stringify(EMPTY_DATABASE));
    return EMPTY_DATABASE;
  }
}

export async function saveDatabaseState(state: AtlasDatabaseState): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_STATE, 'readwrite');
      tx.objectStore(STORE_STATE).put(state, STATE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    localStorage.setItem(FALLBACK_LS_KEY, JSON.stringify(state));
  }
}

export async function saveAttachmentBlob(attachmentId: string, blob: Blob): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_FILES, 'readwrite');
      tx.objectStore(STORE_FILES).put(blob, attachmentId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Fallback ignored if IndexedDB is disabled
  }
}

export async function getAttachmentBlob(attachmentId: string): Promise<Blob | null> {
  try {
    const db = await openDatabase();
    const result = await new Promise<Blob | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_FILES, 'readonly');
      const req = tx.objectStore(STORE_FILES).get(attachmentId);
      req.onsuccess = () => resolve(req.result as Blob | undefined);
      req.onerror = () => reject(req.error);
    });
    return result ?? null;
  } catch {
    return null;
  }
}

export async function deleteAttachmentBlob(attachmentId: string): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_FILES, 'readwrite');
      tx.objectStore(STORE_FILES).delete(attachmentId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore
  }
}

async function seedSampleAttachmentBlobs(state: AtlasDatabaseState): Promise<void> {
  for (const expert of state.experts) {
    const fullName = `${expert.firstName} ${expert.lastName}`;
    for (const att of expert.attachments) {
      const blob = buildSamplePdfBlob(fullName, att);
      await saveAttachmentBlob(att.id, blob);
    }
  }
}

export async function resetToSampleDatabase(): Promise<AtlasDatabaseState> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE_STATE, STORE_FILES], 'readwrite');
    tx.objectStore(STORE_STATE).clear();
    tx.objectStore(STORE_FILES).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  await saveDatabaseState(INITIAL_DATABASE);
  await seedSampleAttachmentBlobs(INITIAL_DATABASE);
  return INITIAL_DATABASE;
}

export async function clearAllDatabase(): Promise<AtlasDatabaseState> {
  const empty: AtlasDatabaseState = { experts: [], subcontractors: [], partners: [] };
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE_STATE, STORE_FILES], 'readwrite');
      tx.objectStore(STORE_STATE).put(empty, STATE_KEY);
      tx.objectStore(STORE_FILES).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    localStorage.setItem(FALLBACK_LS_KEY, JSON.stringify(empty));
  }
  return empty;
}
