const fs = require('fs');
const path = require('path');

// Simple file-based storage for serverless persistence
const STORAGE_FILE = '/tmp/file-storage.json';

// Load existing files from disk
function loadFiles() {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf8');
      const parsed = JSON.parse(data);
      console.log('💾 FileStorage: Loaded', Object.keys(parsed).length, 'files from disk');
      return new Map(Object.entries(parsed));
    }
  } catch (error) {
    console.error('⚠️ FileStorage: Error loading files:', error.message);
  }
  console.log('💾 FileStorage: Starting with empty storage');
  return new Map();
}

// Save files to disk
function saveFiles(filesMap) {
  try {
    const obj = Object.fromEntries(filesMap);
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(obj), 'utf8');
    console.log('💾 FileStorage: Saved', filesMap.size, 'files to disk');
  } catch (error) {
    console.error('⚠️ FileStorage: Error saving files:', error.message);
  }
}

// Initialize files storage
const files = loadFiles();

// Create a wrapper that auto-saves
const filesProxy = {
  get: (key) => files.get(key),
  set: (key, value) => {
    const result = files.set(key, value);
    saveFiles(files);
    return result;
  },
  has: (key) => files.has(key),
  delete: (key) => {
    const result = files.delete(key);
    saveFiles(files);
    return result;
  },
  keys: () => files.keys(),
  values: () => files.values(),
  entries: () => files.entries(),
  get size() { return files.size; },
  clear: () => {
    files.clear();
    saveFiles(files);
  }
};

// Simple ID generator for demo
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = {
  files: filesProxy,
  generateId,
  formatFileSize
};
