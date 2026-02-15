import type { Storage, ActiveSessionState } from './storage';
import type { ProgressStats, SessionSummary } from '../../app/store/types';
import { DEFAULT_PROGRESS } from '../../app/store/types';

const KEYS = {
  progress: 'mathCanvas.progress',
  sessions: 'mathCanvas.sessions',
  activeSession: 'mathCanvas.activeSession',
  config: 'mathCanvas.config',
};

const MAX_STORED_SESSIONS = 100;

/**
 * LocalStorage-based persistence adapter.
 * Works as primary storage and as fallback if IndexedDB is unavailable.
 */
export class LocalStorageAdapter implements Storage {
  async getProgress(): Promise<ProgressStats> {
    try {
      const data = localStorage.getItem(KEYS.progress);
      if (data) return JSON.parse(data);
    } catch {
      // Corrupted data - return default
    }
    return { ...DEFAULT_PROGRESS };
  }

  async saveProgress(stats: ProgressStats): Promise<void> {
    try {
      localStorage.setItem(KEYS.progress, JSON.stringify(stats));
    } catch {
      console.warn('Failed to save progress to localStorage');
    }
  }

  async appendSession(summary: SessionSummary): Promise<void> {
    try {
      const sessions = await this.listSessions(MAX_STORED_SESSIONS);
      sessions.unshift(summary);
      // Keep only the most recent sessions
      if (sessions.length > MAX_STORED_SESSIONS) {
        sessions.length = MAX_STORED_SESSIONS;
      }
      localStorage.setItem(KEYS.sessions, JSON.stringify(sessions));
    } catch {
      console.warn('Failed to save session to localStorage');
    }
  }

  async listSessions(limit: number): Promise<SessionSummary[]> {
    try {
      const data = localStorage.getItem(KEYS.sessions);
      if (data) {
        const sessions: SessionSummary[] = JSON.parse(data);
        return sessions.slice(0, limit);
      }
    } catch {
      // Corrupted data
    }
    return [];
  }

  async saveActiveSession(state: ActiveSessionState): Promise<void> {
    try {
      localStorage.setItem(KEYS.activeSession, JSON.stringify(state));
    } catch {
      console.warn('Failed to save active session to localStorage');
    }
  }

  async getActiveSession(): Promise<ActiveSessionState | null> {
    try {
      const data = localStorage.getItem(KEYS.activeSession);
      if (data) return JSON.parse(data);
    } catch {
      // Corrupted data
    }
    return null;
  }

  async clearActiveSession(): Promise<void> {
    try {
      localStorage.removeItem(KEYS.activeSession);
    } catch {
      console.warn('Failed to clear active session from localStorage');
    }
  }
}

/**
 * Create the storage adapter.
 * In v1, uses LocalStorage. Can be upgraded to IndexedDB later.
 */
export function createStorage(): Storage {
  return new LocalStorageAdapter();
}