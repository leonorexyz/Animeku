/**
 * Utility for Persistent Local File System Access using File System Access API & IndexedDB
 * Allows web users to grant directory access (e.g. D:/Anime/Series) ONCE and stream all episodes seamlessly.
 */

const DB_NAME = "animeku_fs_db";
const DB_VERSION = 1;
const STORE_NAME = "handles";
const KEY_MASTER_HANDLE = "master_folder_handle";
const KEY_FOLDER_NAME = "master_folder_name";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB is not available in this environment."));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save master directory handle to IndexedDB
 */
export async function saveMasterDirectoryHandle(
  handle: FileSystemDirectoryHandle
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(handle, KEY_MASTER_HANDLE);
    store.put(handle.name, KEY_FOLDER_NAME);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Retrieve master directory handle from IndexedDB
 */
export async function getMasterDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KEY_MASTER_HANDLE);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/**
 * Retrieve saved folder name
 */
export async function getSavedMasterFolderName(): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KEY_FOLDER_NAME);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/**
 * Clear stored directory handle from IndexedDB
 */
export async function clearMasterDirectoryHandle(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.delete(KEY_MASTER_HANDLE);
      store.delete(KEY_FOLDER_NAME);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {}
}

/**
 * Verify and request permission to access directory
 */
export async function verifyDirectoryPermission(
  handle: FileSystemDirectoryHandle,
  mode: "read" | "readwrite" = "read"
): Promise<boolean> {
  try {
    // @ts-ignore
    const query = await handle.queryPermission({ mode });
    if (query === "granted") return true;

    // @ts-ignore
    const request = await handle.requestPermission({ mode });
    return request === "granted";
  } catch (err) {
    console.warn("Failed to verify directory permission:", err);
    return false;
  }
}

/**
 * Normalize string for fuzzy matching (removes symbols, spaces, case)
 */
function cleanName(str: string): string {
  return str
    .toLowerCase()
    .replace(/[!?:;,._\-\s()\[\]{}'"]/g, "")
    .trim();
}

/**
 * Extract episode number from filename
 */
function extractEpisodeNumber(filename: string): number | null {
  const base = filename.replace(/\.[^/.]+$/, "");
  const exactMatch = base.match(/^0*(\d{1,4})$/);
  if (exactMatch) return parseInt(exactMatch[1], 10);

  const epMatch = base.match(/(?:ep|episode|e)\s*0*(\d{1,4})/i);
  if (epMatch) return parseInt(epMatch[1], 10);

  const dashMatch = base.match(/(?:-\s*|_\s*)0*(\d{1,4})(?:\s*\(|\s*\[|\s*$|\s*v\d)/i);
  if (dashMatch) return parseInt(dashMatch[1], 10);

  const generalMatch = base.match(/\b0*(\d{1,4})\b/);
  if (generalMatch) return parseInt(generalMatch[1], 10);

  return null;
}

const SUPPORTED_VIDEO_EXTS = [".mp4", ".mkv", ".webm", ".avi", ".mov", ".ts", ".flv"];

/**
 * Smartly resolve episode File from directory handle
 */
export async function resolveEpisodeFile(
  masterHandle: FileSystemDirectoryHandle,
  animeTitle: string,
  episodeNumber: number,
  sourceUrl?: string
): Promise<File | null> {
  try {
    const hasPermission = await verifyDirectoryPermission(masterHandle, "read");
    if (!hasPermission) return null;

    let candidateFolderNames: string[] = [];
    if (sourceUrl) {
      const decoded = decodeURIComponent(sourceUrl.replace("/api/stream?file=", ""));
      const parts = decoded.split(/[\\/]/).filter(Boolean);
      if (parts.length >= 2) {
        candidateFolderNames.push(parts[parts.length - 2]);
      }
    }
    candidateFolderNames.push(animeTitle);
    candidateFolderNames.push(cleanName(animeTitle));

    const masterNameClean = cleanName(masterHandle.name);
    const isMasterDirectFolder = candidateFolderNames.some(
      (c) => cleanName(c) === masterNameClean || masterNameClean.includes(cleanName(c))
    );

    let targetDirHandle: FileSystemDirectoryHandle = masterHandle;

    if (!isMasterDirectFolder) {
      // @ts-ignore
      for await (const entry of masterHandle.values()) {
        if (entry.kind === "directory") {
          const entryClean = cleanName(entry.name);
          const isMatch = candidateFolderNames.some(
            (c) =>
              entryClean === cleanName(c) ||
              entryClean.includes(cleanName(c)) ||
              cleanName(c).includes(entryClean)
          );
          if (isMatch) {
            targetDirHandle = entry as FileSystemDirectoryHandle;
            break;
          }
        }
      }
    }

    let matchedFile: File | null = null;
    let fallbackFirstFile: File | null = null;

    // @ts-ignore
    for await (const entry of targetDirHandle.values()) {
      if (entry.kind === "file") {
        const ext = entry.name.slice(entry.name.lastIndexOf(".")).toLowerCase();
        if (SUPPORTED_VIDEO_EXTS.includes(ext)) {
          const epNum = extractEpisodeNumber(entry.name);
          if (epNum === episodeNumber) {
            matchedFile = await (entry as FileSystemFileHandle).getFile();
            break;
          }
          if (!fallbackFirstFile) {
            fallbackFirstFile = await (entry as FileSystemFileHandle).getFile();
          }
        }
      }
    }

    if (matchedFile) return matchedFile;

    // Check 1-level subdirectories within targetDirHandle (e.g. "Season 1", "Specials", "BD")
    // @ts-ignore
    for await (const subEntry of targetDirHandle.values()) {
      if (subEntry.kind === "directory") {
        const subDir = subEntry as FileSystemDirectoryHandle;
        // @ts-ignore
        for await (const fileEntry of subDir.values()) {
          if (fileEntry.kind === "file") {
            const ext = fileEntry.name.slice(fileEntry.name.lastIndexOf(".")).toLowerCase();
            if (SUPPORTED_VIDEO_EXTS.includes(ext)) {
              const epNum = extractEpisodeNumber(fileEntry.name);
              if (epNum === episodeNumber) {
                return await (fileEntry as FileSystemFileHandle).getFile();
              }
              if (!fallbackFirstFile) {
                fallbackFirstFile = await (fileEntry as FileSystemFileHandle).getFile();
              }
            }
          }
        }
      }
    }

    if (targetDirHandle === masterHandle) {
      // @ts-ignore
      for await (const subEntry of masterHandle.values()) {
        if (subEntry.kind === "directory") {
          const subDir = subEntry as FileSystemDirectoryHandle;
          const subClean = cleanName(subDir.name);
          const isSubMatch = candidateFolderNames.some(
            (c) =>
              subClean === cleanName(c) ||
              subClean.includes(cleanName(c)) ||
              cleanName(c).includes(subClean)
          );
          if (isSubMatch) {
            // @ts-ignore
            for await (const fileEntry of subDir.values()) {
              if (fileEntry.kind === "file") {
                const ext = fileEntry.name.slice(fileEntry.name.lastIndexOf(".")).toLowerCase();
                if (SUPPORTED_VIDEO_EXTS.includes(ext)) {
                  const epNum = extractEpisodeNumber(fileEntry.name);
                  if (epNum === episodeNumber) {
                    return await (fileEntry as FileSystemFileHandle).getFile();
                  }
                  if (!fallbackFirstFile) {
                    fallbackFirstFile = await (fileEntry as FileSystemFileHandle).getFile();
                  }
                }
              }
            }
          }
        }
      }
    }

    // If episode 1 and fallback exists
    if (episodeNumber === 1 && fallbackFirstFile) {
      return fallbackFirstFile;
    }

    return null;
  } catch (err) {
    console.error("resolveEpisodeFile error:", err);
    return null;
  }
}
