/**
 * AnythingLLM Storage Utility
 * 
 * This utility handles data storage paths and operations for AnythingLLM integration.
 * Uses browser storage APIs instead of Node.js filesystem.
 */

// Storage paths are now relative to the browser's storage
const STORAGE_PATHS = {
  root: 'anythingllm-desktop',
  lancedb: 'anythingllm-desktop/lancedb',
  documents: 'anythingllm-desktop/documents',
  vectorCache: 'anythingllm-desktop/vector-cache',
  models: 'anythingllm-desktop/models',
  plugins: 'anythingllm-desktop/plugins',
  database: 'anythingllm-desktop/anythingllm.db'
};

// Get the appropriate storage path
export const getStoragePath = (): string => {
  return STORAGE_PATHS.root;
};

// Get specific storage subdirectories
export const getStorageSubdir = (subdir: 'lancedb' | 'documents' | 'vectorCache' | 'models' | 'plugins'): string => {
  return STORAGE_PATHS[subdir];
};

// Get the database file path
export const getDatabasePath = (): string => {
  return STORAGE_PATHS.database;
};

// Ensure storage directories exist
export const ensureStorageDirectories = async (): Promise<void> => {
  try {
    // Create all storage paths in localStorage
    Object.values(STORAGE_PATHS).forEach(path => {
      localStorage.setItem(path, '{}');
    });
  } catch (error) {
    console.error('Error creating storage directories:', error);
    throw error;
  }
};

// Check if storage is properly set up
export const isStorageSetup = async (): Promise<boolean> => {
  try {
    // Check if all storage paths exist in localStorage
    return Object.values(STORAGE_PATHS).every(path => {
      return localStorage.getItem(path) !== null;
    });
  } catch (error) {
    return false;
  }
};

// Get storage statistics
export const getStorageStats = async (): Promise<{
  totalSize: number;
  directories: {
    lancedb: number;
    documents: number;
    vectorCache: number;
    models: number;
    plugins: number;
  };
}> => {
  const stats = {
    totalSize: 0,
    directories: {
      lancedb: 0,
      documents: 0,
      vectorCache: 0,
      models: 0,
      plugins: 0,
    },
  };

  try {
    // Calculate size of each directory in localStorage
    Object.entries(STORAGE_PATHS).forEach(([key, path]) => {
      if (key !== 'root' && key !== 'database') {
        const data = localStorage.getItem(path);
        if (data) {
          const size = new Blob([data]).size;
          stats.directories[key as keyof typeof stats.directories] = size;
          stats.totalSize += size;
        }
      }
    });
    
    return stats;
  } catch (error) {
    console.error('Error getting storage stats:', error);
    throw error;
  }
};

export default {
  getStoragePath,
  getStorageSubdir,
  getDatabasePath,
  ensureStorageDirectories,
  isStorageSetup,
  getStorageStats,
}; 