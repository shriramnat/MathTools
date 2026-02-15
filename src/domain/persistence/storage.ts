import type { ProgressStats, SessionSummary } from '../../app/store/types';

/**
 * Storage interface - abstracts persistence mechanism.
 * Implementations: IndexedDB (primary), LocalStorage (fallback).
 */
export interface Storage {
  getProgress(): Promise<ProgressStats>;
  saveProgress(stats: ProgressStats): Promise<void>;
  appendSession(summary: SessionSummary): Promise<void>;
  listSessions(limit: number): Promise<SessionSummary[]>;

  // Active session management (for resume after refresh)
  saveActiveSession(state: ActiveSessionState): Promise<void>;
  getActiveSession(): Promise<ActiveSessionState | null>;
  clearActiveSession(): Promise<void>;
}

export interface ActiveSessionState {
  sessionId: string;
  seed: number;
  sessionSize: number;
  configSnapshot: import('../../app/store/types').PracticeConfig;
  checkResults: Record<string, import('../../app/store/types').CheckResult>;
  startedAt: number;
}