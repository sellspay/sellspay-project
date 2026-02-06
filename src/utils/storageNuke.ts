/**
 * Scorched Earth Protocol - Storage Nuke Utility
 * 
 * This function ruthlessly destroys all Sandpack and Vibecoder persistent storage
 * to prevent "zombie projects" from appearing after switching or deleting projects.
 */

// Storage keys that might be project-specific
const VIBECODER_PREFIXES = [
  'vibecoder-files-',
  'vibecoder-chat-',
  'vibecoder-state-',
  'sandpack-',
];

/**
 * Nuclear option: Find and destroy ALL Sandpack/CSB IndexedDB caches
 * This is where the "zombie" projects live.
 */
export async function nukeSandpackCache(): Promise<void> {
  if (typeof window === 'undefined' || !window.indexedDB) return;

  console.log("☢️ INITIATING SCORCHED EARTH PROTOCOL: Clearing caches...");

  try {
    // 1. Clear standard storage
    clearVibecoderLocalStorage();
    sessionStorage.clear();

    // 2. Find all IndexedDB databases
    if (typeof window.indexedDB.databases === 'function') {
      const dbs = await window.indexedDB.databases();
      
      // 3. Filter for Sandpack/CodeSandbox DBs
      const sandpackDBs = dbs.filter(db => 
        db.name?.includes('sandpack') || 
        db.name?.includes('CSB') || 
        db.name?.includes('codesandbox') ||
        db.name?.includes('browser-fs') ||
        db.name?.includes('keyval-store') // Sometimes used for metadata
      );

      // 4. Delete them all
      const deletePromises = sandpackDBs.map(db => {
        if (db.name) {
          console.log(`🔥 Nuking DB: ${db.name}`);
          return new Promise<boolean>((resolve, reject) => {
            const req = window.indexedDB.deleteDatabase(db.name!);
            req.onsuccess = () => resolve(true);
            req.onerror = () => reject(req.error);
            req.onblocked = () => {
              console.warn(`DB delete blocked: ${db.name}`);
              resolve(false);
            };
          });
        }
        return Promise.resolve(true);
      });
      
      await Promise.all(deletePromises);
    } else {
      // Fallback for browsers that don't support indexedDB.databases()
      await nukeFallbackDatabases();
    }

    console.log("✅ Cache nuked successfully.");
  } catch (e) {
    // Non-fatal, but good to know
    console.warn("Failed to fully clear IndexedDB (browser might be blocking):", e);
    // Try fallback anyway
    await nukeFallbackDatabases();
  }
}

/**
 * Fallback: Try to delete known Sandpack database names directly
 */
async function nukeFallbackDatabases(): Promise<void> {
  const knownDBNames = [
    'sandpack-bundler-cache',
    'sandpack-npm-cache',
    'codesandbox-bundler',
    'browser-fs-access',
    'CSB_V8_CACHE',
    'keyval-store',
  ];

  for (const name of knownDBNames) {
    try {
      await new Promise<void>((resolve) => {
        const req = window.indexedDB.deleteDatabase(name);
        req.onsuccess = () => {
          console.log(`🔥 Nuked fallback DB: ${name}`);
          resolve();
        };
        req.onerror = () => resolve();
        req.onblocked = () => resolve();
      });
    } catch {
      // Ignore errors for non-existent DBs
    }
  }
}

/**
 * Clear all vibecoder-related localStorage keys
 */
function clearVibecoderLocalStorage(): void {
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && VIBECODER_PREFIXES.some(prefix => key.startsWith(prefix))) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
      console.log(`🔥 Cleared localStorage: ${key}`);
    } catch {
      // Ignore errors
    }
  });
}

/**
 * Clear caches for a specific project ID
 */
export function clearProjectLocalStorage(projectId: string): void {
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes(projectId)) {
      keysToRemove.push(key);
    }
  }

  // Also check for prefixed keys
  VIBECODER_PREFIXES.forEach(prefix => {
    keysToRemove.push(`${prefix}${projectId}`);
  });

  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore errors for non-existent keys
    }
  });

  // Also clear sessionStorage for this project
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.includes(projectId)) {
      try {
        sessionStorage.removeItem(key);
      } catch {
        // Ignore errors
      }
    }
  }

  console.log(`[StorageNuke] Cleared storage for project: ${projectId}`);
}
