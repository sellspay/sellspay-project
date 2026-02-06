/**
 * Project Cache Utilities
 * 
 * Handles clearing all cached data when a project is deleted.
 * This includes Sandpack's IndexedDB cache, localStorage keys, and any
 * other browser-persisted state that could cause "zombie projects".
 */

// Storage keys that might be project-specific
const STORAGE_PREFIXES = [
  'vibecoder-files-',
  'vibecoder-chat-',
  'vibecoder-state-',
  'sandpack-',
];

/**
 * Clear all cached data for a specific project ID
 */
export async function clearProjectCache(projectId: string): Promise<void> {
  console.log(`[ProjectCache] Clearing cache for project: ${projectId}`);

  // 1. Clear localStorage keys for this project
  clearLocalStorageForProject(projectId);

  // 2. Clear sessionStorage keys for this project
  clearSessionStorageForProject(projectId);

  // 3. Clear Sandpack's IndexedDB cache
  await clearSandpackCache();

  console.log(`[ProjectCache] Cache cleared for project: ${projectId}`);
}

/**
 * Clear all vibecoder-related caches (nuclear option)
 */
export async function clearAllVibecoderCache(): Promise<void> {
  console.log('[ProjectCache] Nuclear clear - wiping all vibecoder caches');

  // Clear all vibecoder localStorage keys
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && STORAGE_PREFIXES.some(prefix => key.startsWith(prefix))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));

  // Clear Sandpack cache
  await clearSandpackCache();

  console.log('[ProjectCache] All caches cleared');
}

/**
 * Clear localStorage entries for a specific project
 */
function clearLocalStorageForProject(projectId: string): void {
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes(projectId)) {
      keysToRemove.push(key);
    }
  }

  // Also check for prefixed keys
  STORAGE_PREFIXES.forEach(prefix => {
    keysToRemove.push(`${prefix}${projectId}`);
  });

  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // Ignore errors for non-existent keys
    }
  });
}

/**
 * Clear sessionStorage entries for a specific project
 */
function clearSessionStorageForProject(projectId: string): void {
  const keysToRemove: string[] = [];

  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.includes(projectId)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach(key => {
    try {
      sessionStorage.removeItem(key);
    } catch (e) {
      // Ignore errors
    }
  });
}

/**
 * Clear Sandpack's IndexedDB cache
 * Sandpack stores compiled bundles in IndexedDB for performance
 */
async function clearSandpackCache(): Promise<void> {
  try {
    // Try to delete the Sandpack IndexedDB database
    const databases = await indexedDB.databases?.() || [];
    
    for (const db of databases) {
      if (db.name && (
        db.name.includes('sandpack') || 
        db.name.includes('codesandbox') ||
        db.name.includes('browser-fs')
      )) {
        try {
          indexedDB.deleteDatabase(db.name);
          console.log(`[ProjectCache] Deleted IndexedDB: ${db.name}`);
        } catch (e) {
          console.warn(`[ProjectCache] Failed to delete IndexedDB ${db.name}:`, e);
        }
      }
    }

    // Also try common Sandpack database names directly
    const commonNames = [
      'sandpack-bundler-cache',
      'sandpack-npm-cache',
      'codesandbox-bundler',
      'browser-fs-access',
    ];

    for (const name of commonNames) {
      try {
        indexedDB.deleteDatabase(name);
      } catch (e) {
        // Ignore if doesn't exist
      }
    }
  } catch (e) {
    // indexedDB.databases() might not be available in all browsers
    console.warn('[ProjectCache] Could not enumerate IndexedDB databases:', e);
    
    // Fallback: try to clear known database names
    const fallbackNames = ['sandpack-bundler-cache', 'sandpack-npm-cache'];
    for (const name of fallbackNames) {
      try {
        indexedDB.deleteDatabase(name);
      } catch (err) {
        // Ignore
      }
    }
  }
}
