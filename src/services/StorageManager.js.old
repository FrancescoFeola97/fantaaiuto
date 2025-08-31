export class StorageManager {
  constructor(storageKey = 'fantaaiuto_v2') {
    this.storageKey = storageKey;
    this.isAvailable = this.checkStorageAvailability();
  }

  async init() {
    if (!this.isAvailable) {
      console.warn('LocalStorage not available, data will not persist');
    }
    return true;
  }

  checkStorageAvailability() {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  async save(data) {
    if (!this.isAvailable) {
      throw new Error('Storage not available');
    }

    try {
      const serialized = JSON.stringify({
        version: '2.0.0',
        timestamp: Date.now(),
        data
      });

      localStorage.setItem(this.storageKey, serialized);
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded');
      }
      throw error;
    }
  }

  async load() {
    if (!this.isAvailable) {
      return null;
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      return parsed.data || null;
    } catch (error) {
      console.error('Error loading from storage:', error);
      return null;
    }
  }

  async clear() {
    if (!this.isAvailable) {
      return false;
    }

    localStorage.removeItem(this.storageKey);
    return true;
  }

  async getStorageInfo() {
    if (!this.isAvailable) {
      return { available: false };
    }

    const stored = localStorage.getItem(this.storageKey);
    const size = stored ? new Blob([stored]).size : 0;
    
    return {
      available: true,
      size,
      sizeFormatted: this.formatBytes(size),
      lastModified: stored ? JSON.parse(stored).timestamp : null
    };
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async exportToFile() {
    const data = await this.load();
    if (!data) {
      throw new Error('No data to export');
    }

    const exportData = {
      app: 'FantaAiuto',
      version: '2.0.0',
      exportDate: new Date().toISOString(),
      data
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    return blob;
  }

  async importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const content = JSON.parse(e.target.result);
          
          if (!content.data) {
            throw new Error('Invalid backup file format');
          }

          await this.save(content.data);
          resolve(content.data);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  async backup() {
    const data = await this.load();
    if (!data) return null;

    const backupKey = `${this.storageKey}_backup_${Date.now()}`;
    localStorage.setItem(backupKey, JSON.stringify({
      original: this.storageKey,
      timestamp: Date.now(),
      data
    }));

    return backupKey;
  }

  async restore(backupKey) {
    const backup = localStorage.getItem(backupKey);
    if (!backup) {
      throw new Error('Backup not found');
    }

    const parsed = JSON.parse(backup);
    await this.save(parsed.data);
    return parsed.data;
  }

  async listBackups() {
    const backups = [];
    const prefix = `${this.storageKey}_backup_`;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        try {
          const backup = JSON.parse(localStorage.getItem(key));
          backups.push({
            key,
            timestamp: backup.timestamp,
            date: new Date(backup.timestamp)
          });
        } catch (e) {
          console.warn('Invalid backup found:', key);
        }
      }
    }

    return backups.sort((a, b) => b.timestamp - a.timestamp);
  }

  async cleanupOldBackups(keepCount = 5) {
    const backups = await this.listBackups();
    const toDelete = backups.slice(keepCount);

    toDelete.forEach(backup => {
      localStorage.removeItem(backup.key);
    });

    return toDelete.length;
  }
}