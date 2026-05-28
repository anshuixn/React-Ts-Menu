/**
 * Safe wrappers for localStorage and sessionStorage to prevent runtime crashes
 * in restricted environments (e.g. Incognito/Private Browsing modes, disabled cookies).
 * Fallback to an in-memory storage implementation if native APIs are blocked.
 */

class MemoryStorage implements Storage {
  private data: Record<string, string> = {};

  get length(): number {
    return Object.keys(this.data).length;
  }

  clear(): void {
    this.data = {};
  }

  getItem(key: string): string | null {
    return this.data[key] !== undefined ? this.data[key] : null;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.data);
    return keys[index] !== undefined ? keys[index] : null;
  }

  removeItem(key: string): void {
    delete this.data[key];
  }

  setItem(key: string, value: string): void {
    this.data[key] = String(value);
  }
}

function getSafeStorage(type: 'localStorage' | 'sessionStorage'): Storage {
  try {
    const storage = window[type];
    const x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return storage;
  } catch {
    return new MemoryStorage();
  }
}

export const safeLocalStorage = getSafeStorage('localStorage');
export const safeSessionStorage = getSafeStorage('sessionStorage');
