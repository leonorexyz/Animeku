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
 * Normalize string for strict matching (removes symbols, spaces, lowercase)
 */
function cleanName(str: string): string {
  return str
    .toLowerCase()
    .replace(/[!?:;,._\-\s()\[\]{}'"]/g, "")
    .trim();
}

/**
 * Extract trailing season / sequel / part number if present
 * E.g., "LoveLive! 2" -> 2, "Sword Art Online 2" -> 2, "LoveLive!" -> null
 */
function extractSequelNumber(str: string): number | null {
  const clean = str.trim();
  if (/(?:^|\s)ii$/i.test(clean)) return 2;
  if (/(?:^|\s)iii$/i.test(clean)) return 3;
  if (/(?:^|\s)iv$/i.test(clean)) return 4;
  if (/(?:^|\s)v$/i.test(clean)) return 5;

  const m = clean.match(/(?:season|s|part|babak)?\s*(\d{1,2})\s*$/i);
  if (m) return parseInt(m[1], 10);

  const standalone = clean.match(/\b(\d{1,2})\b/);
  if (standalone) return parseInt(standalone[1], 10);

  return null;
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

    let targetFilename = "";
    let targetFolderName = "";
    let pathSegments: string[] = [];

    if (sourceUrl) {
      let clean = sourceUrl;
      if (clean.startsWith("/api/stream?file=")) {
        clean = decodeURIComponent(clean.replace("/api/stream?file=", ""));
      }
      clean = clean.replace(/^file:\/\/\/?/i, "");
      pathSegments = clean.split(/[\\/]/).filter(Boolean);
      if (pathSegments.length > 0) {
        targetFilename = pathSegments[pathSegments.length - 1];
      }
      if (pathSegments.length >= 2) {
        targetFolderName = pathSegments[pathSegments.length - 2];
      }
    }

    const masterName = masterHandle.name;
    const masterClean = cleanName(masterName);

    // Fast Path 1: Check if masterHandle is itself the target anime folder
    const isMasterSelf =
      (targetFolderName && cleanName(targetFolderName) === masterClean) ||
      cleanName(animeTitle) === masterClean;

    if (isMasterSelf && targetFilename) {
      try {
        const fh = await masterHandle.getFileHandle(targetFilename);
        const f = await fh.getFile();
        if (f) return f;
      } catch {}
    }

    // Fast Path 2: Direct path traversal if masterHandle directory is an ancestor in sourceUrl path
    if (pathSegments.length > 0) {
      const masterIdx = pathSegments.findIndex(
        (p) => cleanName(p) === masterClean || p.toLowerCase() === masterName.toLowerCase()
      );
      if (masterIdx !== -1 && masterIdx < pathSegments.length - 1) {
        const subSegments = pathSegments.slice(masterIdx + 1, pathSegments.length - 1);
        try {
          let curr = masterHandle;
          for (const seg of subSegments) {
            curr = await curr.getDirectoryHandle(seg);
          }
          if (targetFilename) {
            try {
              const fh = await curr.getFileHandle(targetFilename);
              const f = await fh.getFile();
              if (f) return f;
            } catch {}
          }
          // @ts-ignore
          for await (const entry of curr.values()) {
            if (entry.kind === "file") {
              const ext = entry.name.slice(entry.name.lastIndexOf(".")).toLowerCase();
              if (SUPPORTED_VIDEO_EXTS.includes(ext)) {
                if (extractEpisodeNumber(entry.name) === episodeNumber) {
                  return await (entry as FileSystemFileHandle).getFile();
                }
              }
            }
          }
        } catch {
          // Direct traversal failed, fall through to robust multi-tier search
        }
      }
    }

    // Collect all child directory handles from masterHandle
    const subDirs: FileSystemDirectoryHandle[] = [];
    if (!isMasterSelf) {
      // @ts-ignore
      for await (const entry of masterHandle.values()) {
        if (entry.kind === "directory") {
          subDirs.push(entry as FileSystemDirectoryHandle);
        }
      }
    }

    let targetDirHandle: FileSystemDirectoryHandle = isMasterSelf ? masterHandle : masterHandle;

    if (!isMasterSelf && subDirs.length > 0) {
      const candidatesToMatch = [targetFolderName, animeTitle].filter(Boolean);

      // Tier 1: Strict Exact String Equality (case-insensitive)
      let matchedDir: FileSystemDirectoryHandle | null = null;
      for (const dir of subDirs) {
        const dName = dir.name.toLowerCase();
        if (candidatesToMatch.some((c) => dName === c.toLowerCase())) {
          matchedDir = dir;
          break;
        }
      }

      // Tier 2: Cleaned Normalized Exact Match (ignoring punctuation/symbols)
      if (!matchedDir) {
        for (const dir of subDirs) {
          const dClean = cleanName(dir.name);
          if (candidatesToMatch.some((c) => dClean === cleanName(c))) {
            matchedDir = dir;
            break;
          }
        }
      }

      // Tier 3: Fuzzy / Partial Match with STRICT Sequel / Season Number Guard
      if (!matchedDir) {
        for (const dir of subDirs) {
          const dClean = cleanName(dir.name);
          const dNum = extractSequelNumber(dir.name);

          const isFuzzyMatch = candidatesToMatch.some((cand) => {
            const cClean = cleanName(cand);
            const cNum = extractSequelNumber(cand);

            // Sequel numbers MUST match exactly (prevents LoveLive! 2 matching LoveLive!)
            if (cNum !== dNum) {
              return false;
            }

            return dClean.includes(cClean) || cClean.includes(dClean);
          });

          if (isFuzzyMatch) {
            matchedDir = dir;
            break;
          }
        }
      }

      if (matchedDir) {
        targetDirHandle = matchedDir;
      }
    }

    let matchedFile: File | null = null;
    let fallbackFirstFile: File | null = null;

    // Step A: Check exact targetFilename in resolved folder
    if (targetFilename) {
      try {
        const fh = await targetDirHandle.getFileHandle(targetFilename);
        const f = await fh.getFile();
        if (f) return f;
      } catch {}
    }

    // Step B: Search files in resolved folder
    // @ts-ignore
    for await (const entry of targetDirHandle.values()) {
      if (entry.kind === "file") {
        const ext = entry.name.slice(entry.name.lastIndexOf(".")).toLowerCase();
        if (SUPPORTED_VIDEO_EXTS.includes(ext)) {
          if (targetFilename && entry.name.toLowerCase() === targetFilename.toLowerCase()) {
            return await (entry as FileSystemFileHandle).getFile();
          }

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

    // Step C: Check 1-level subdirectories inside targetDirHandle (e.g. "Season 2", "BD", "Specials")
    // @ts-ignore
    for await (const subEntry of targetDirHandle.values()) {
      if (subEntry.kind === "directory") {
        const subDir = subEntry as FileSystemDirectoryHandle;
        if (targetFilename) {
          try {
            const fh = await subDir.getFileHandle(targetFilename);
            const f = await fh.getFile();
            if (f) return f;
          } catch {}
        }

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
