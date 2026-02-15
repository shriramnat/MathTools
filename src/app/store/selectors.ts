import type { AppState, PracticeConfig, ActiveSession, ProgressStats } from './types';

export const selectConfig = (state: AppState): PracticeConfig => state.config;
export const selectSession = (state: AppState): ActiveSession | null => state.session;
export const selectProgress = (state: AppState): ProgressStats => state.progress;
export const selectToolSettings = (state: AppState) => state.toolSettings;
export const selectIsSessionActive = (state: AppState): boolean => state.session !== null;
export const selectOperations = (state: AppState) => state.config.operations;
export const selectMaxDigits = (state: AppState) => state.config.maxDigits;
export const selectDifficulty = (state: AppState) => state.config.difficulty;
export const selectMode = (state: AppState) => state.config.mode;
export const selectGuidedMode = (state: AppState) => state.config.guidedMode;
export const selectThemeId = (state: AppState) => state.config.themeId;