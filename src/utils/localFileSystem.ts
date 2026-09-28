/**
 * Utility for Persistent Local File System Access using File System Access API & IndexedDB
 * Allows web users to grant directory access (e.g. D:/Anime/Series, D:/Anime/Movie, or D:/Anime)
 * ONCE and stream all episodes and movies seamlessly without re-prompting.
 */

const DB_NAME = "animeku_fs_db";
const DB_VERSION = 1;
const STORE_NAME = "handles";
const KEY_MASTER_HANDLE = "master_folder_handle";
const KEY_FOLDER_NAME = "master_folder_name";
const KEY_FOLDER_NAMES_LIST = "all_folder_names_list";

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
 * Save directory handle to IndexedDB with multi-folder handle support
 */
export async function saveMasterDirectoryHandle(
  handle: FileSystemDirectoryHandle
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    // Save legacy keys for backwards compatibility
    store.put(handle, KEY_MASTER_HANDLE);
    store.put(handle.name, KEY_FOLDER_NAME);

    // Save into named handle store
    const specificKey = `dir_handle_${handle.name.toLowerCase()}`;
    store.put(handle, specificKey);

    // Maintain list of all connected directory names
    const getReq = store.get(KEY_FOLDER_NAMES_LIST);
    getReq.onsuccess = () => {
      const list: string[] = Array.isArray(getReq.result) ? getReq.result : [];
      if (!list.some((n) => n.toLowerCase() === handle.name.toLowerCase())) {
        list.push(handle.name);
      }
      store.put(list, KEY_FOLDER_NAMES_LIST);
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Retrieve primary master directory handle from IndexedDB
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
 * Retrieve all connected directory handles from IndexedDB (e.g. Series, Movie, Anime)
 */
export async function getAllDirectoryHandles(): Promise<FileSystemDirectoryHandle[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const listReq = store.get(KEY_FOLDER_NAMES_LIST);

      listReq.onsuccess = () => {
        const names: string[] = Array.isArray(listReq.result) ? listReq.result : [];
        const handles: FileSystemDirectoryHandle[] = [];

        // Check primary master handle first
        const masterReq = store.get(KEY_MASTER_HANDLE);
        masterReq.onsuccess = () => {
          if (masterReq.result) {
            handles.push(masterReq.result);
          }

          if (names.length === 0) {
            return resolve(handles);
          }

          let pending = names.length;
          names.forEach((name) => {
            const hReq = store.get(`dir_handle_${name.toLowerCase()}`);
            hReq.onsuccess = () => {
              if (
                hReq.result &&
                !handles.some((h) => h.name.toLowerCase() === hReq.result.name.toLowerCase())
              ) {
                handles.push(hReq.result);
              }
              pending--;
              if (pending === 0) resolve(handles);
            };
            hReq.onerror = () => {
              pending--;
              if (pending === 0) resolve(handles);
            };
          });
        };
        masterReq.onerror = () => resolve(handles);
      };
      listReq.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Retrieve all saved folder names (e.g. ["Series", "Movie"] or ["Anime"])
 */
export async function getSavedMasterFolderName(): Promise<string | null> {
  const names = await getSavedMasterFolderNames();
  return names.length > 0 ? names.join(", ") : null;
}

export async function getSavedMasterFolderNames(): Promise<string[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const listReq = store.get(KEY_FOLDER_NAMES_LIST);
      listReq.onsuccess = () => {
        const list: string[] = Array.isArray(listReq.result) ? listReq.result : [];
        const masterReq = store.get(KEY_FOLDER_NAME);
        masterReq.onsuccess = () => {
          if (masterReq.result && !list.includes(masterReq.result)) {
            list.unshift(masterReq.result);
          }
          resolve(list);
        };
        masterReq.onerror = () => resolve(list);
      };
      listReq.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Clear stored directory handles from IndexedDB
 */
export async function clearMasterDirectoryHandle(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.clear();
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
 * Match candidate directory against a list of names
 */
async function findMatchingDirectoryHandle(
  parentDir: FileSystemDirectoryHandle,
  candidates: (string | undefined)[]
): Promise<FileSystemDirectoryHandle | null> {
  const validCandidates = candidates.filter((c): c is string => Boolean(c));
  if (validCandidates.length === 0) return null;

  const childDirs: FileSystemDirectoryHandle[] = [];
  try {
    // @ts-ignore
    for await (const entry of parentDir.values()) {
      if (entry.kind === "directory") {
        childDirs.push(entry as FileSystemDirectoryHandle);
      }
    }
  } catch {
    return null;
  }

  // Tier 1: Exact string match (case-insensitive)
  for (const dir of childDirs) {
    const dLower = dir.name.toLowerCase();
    if (validCandidates.some((c) => dLower === c.toLowerCase())) {
      return dir;
    }
  }

  // Tier 2: Cleaned alphanumeric match
  for (const dir of childDirs) {
    const dClean = cleanName(dir.name);
    if (validCandidates.some((c) => dClean === cleanName(c))) {
      return dir;
    }
  }

  // Tier 3: Fuzzy / partial match with STRICT sequel number guard
  for (const dir of childDirs) {
    const dClean = cleanName(dir.name);
    const dNum = extractSequelNumber(dir.name);

    const isMatch = validCandidates.some((cand) => {
      const cClean = cleanName(cand);
      const cNum = extractSequelNumber(cand);
      if (cNum !== dNum) return false;
      return dClean.includes(cClean) || cClean.includes(dClean);
    });

    if (isMatch) return dir;
  }

  return null;
}

/**
 * Search file inside a verified anime directory handle ONLY.
 * NEVER looks outside this anime directory.
 */
async function findFileInsideAnimeDirectory(
  animeDir: FileSystemDirectoryHandle,
  targetFilename: string,
  episodeNumber: number
): Promise<File | null> {
  // 1. Try exact targetFilename
  if (targetFilename) {
    try {
      const fh = await animeDir.getFileHandle(targetFilename);
      const f = await fh.getFile();
      if (f) return f;
    } catch {}
  }

  // 2. Scan files directly in animeDir
  const videoFiles: { handle: FileSystemFileHandle; name: string }[] = [];
  try {
    // @ts-ignore
    for await (const entry of animeDir.values()) {
      if (entry.kind === "file") {
        const ext = entry.name.slice(entry.name.lastIndexOf(".")).toLowerCase();
        if (SUPPORTED_VIDEO_EXTS.includes(ext)) {
          if (targetFilename && entry.name.toLowerCase() === targetFilename.toLowerCase()) {
            return await (entry as FileSystemFileHandle).getFile();
          }
          const epNum = extractEpisodeNumber(entry.name);
          if (epNum === episodeNumber) {
            return await (entry as FileSystemFileHandle).getFile();
          }
          videoFiles.push({ handle: entry as FileSystemFileHandle, name: entry.name });
        }
      }
    }
  } catch {}

  // 3. Scan 1-level subdirectories inside animeDir (e.g. "Season 1", "OVA", "BD")
  try {
    // @ts-ignore
    for await (const subEntry of animeDir.values()) {
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
              videoFiles.push({ handle: fileEntry as FileSystemFileHandle, name: fileEntry.name });
            }
          }
        }
      }
    }
  } catch {}

  // 4. Standalone movie / single episode fallback:
  // If episodeNumber === 1 and this is verified animeDir, return the first video file in this folder
  if (episodeNumber === 1 && videoFiles.length > 0) {
    return await videoFiles[0].handle.getFile();
  }

  return null;
}

/**
 * Search episode inside a single directory handle
 */
async function searchEpisodeInDirectory(
  dirHandle: FileSystemDirectoryHandle,
  animeTitle: string,
  episodeNumber: number,
  sourceUrl?: string
): Promise<File | null> {
  const hasPermission = await verifyDirectoryPermission(dirHandle, "read");
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

  const dirName = dirHandle.name;
  const dirClean = cleanName(dirName);
  const candidatesToMatch = [targetFolderName, animeTitle].filter(Boolean);

  // Strategy 1: dirHandle is itself the anime folder (e.g. user selected "LoveLive - School Idol Movie")
  const isDirectAnimeFolder = candidatesToMatch.some(
    (c) => cleanName(c) === dirClean || c.toLowerCase() === dirName.toLowerCase()
  );

  if (isDirectAnimeFolder) {
    return await findFileInsideAnimeDirectory(dirHandle, targetFilename, episodeNumber);
  }

  // Strategy 2: Direct path traversal if dirHandle is an ancestor in pathSegments
  // E.g. "Anime" -> "Movie" -> "LoveLive - School Idol Movie" OR "Movie" -> "LoveLive - School Idol Movie"
  if (pathSegments.length > 0) {
    const ancestorIdx = pathSegments.findIndex(
      (p) => cleanName(p) === dirClean || p.toLowerCase() === dirName.toLowerCase()
    );
    if (ancestorIdx !== -1 && ancestorIdx < pathSegments.length - 1) {
      const subSegments = pathSegments.slice(ancestorIdx + 1, pathSegments.length - 1);
      try {
        let curr = dirHandle;
        for (const seg of subSegments) {
          curr = await curr.getDirectoryHandle(seg);
        }
        const file = await findFileInsideAnimeDirectory(curr, targetFilename, episodeNumber);
        if (file) return file;
      } catch {
        // Direct traversal failed, fall through to candidate search
      }
    }
  }

  // Strategy 3: Check if dirHandle contains child folder for this anime directly
  const directChild = await findMatchingDirectoryHandle(dirHandle, candidatesToMatch);
  if (directChild) {
    const file = await findFileInsideAnimeDirectory(directChild, targetFilename, episodeNumber);
    if (file) return file;
  }

  // Strategy 4: If dirHandle is a root directory like "Anime", check inside "Movie" or "Series" subfolders
  for (const rootCat of ["Movie", "Series", "movie", "series"]) {
    try {
      const catDir = await dirHandle.getDirectoryHandle(rootCat);
      const matchedInCat = await findMatchingDirectoryHandle(catDir, candidatesToMatch);
      if (matchedInCat) {
        const file = await findFileInsideAnimeDirectory(matchedInCat, targetFilename, episodeNumber);
        if (file) return file;
      }
    } catch {}
  }

  // IMPORTANT: If no folder matched this anime, return null.
  // NEVER fall back to inspecting other anime folders!
  return null;
}

/**
 * Smartly resolve episode File from directory handle(s).
 * Supports single handle or an array of handles (Series, Movie, Anime).
 */
export async function resolveEpisodeFile(
  handlesInput: FileSystemDirectoryHandle | FileSystemDirectoryHandle[],
  animeTitle: string,
  episodeNumber: number,
  sourceUrl?: string
): Promise<File | null> {
  const handles = Array.isArray(handlesInput) ? handlesInput : [handlesInput];
  if (handles.length === 0) return null;

  for (const handle of handles) {
    try {
      const file = await searchEpisodeInDirectory(handle, animeTitle, episodeNumber, sourceUrl);
      if (file) return file;
    } catch (err) {
      console.warn(`Error resolving episode in folder "${handle.name}":`, err);
    }
  }

  return null;
}
