import { z } from 'zod/v4';

// ── Operation Types ──────────────────────────────────────────────────
export type Operation = 'addition' | 'subtraction' | 'multiplication';

export const OperationSchema = z.enum(['addition', 'subtraction', 'multiplication']);

// ── Difficulty ───────────────────────────────────────────────────────
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export const DifficultySchema = z.enum(['Easy', 'Medium', 'Hard']);

// ── Max Digits ───────────────────────────────────────────────────────
export type MaxDigits = 1 | 2 | 3 | 4 | 5 | 6;

export const MaxDigitsSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);

// ── Practice Mode ────────────────────────────────────────────────────
export type PracticeMode = 'FreePractice' | 'Session';

export const PracticeModeSchema = z.enum(['FreePractice', 'Session']);

// ── Check Mode ───────────────────────────────────────────────────────
export type CheckMode = 'Manual' | 'Off';

export const CheckModeSchema = z.enum(['Manual', 'Off']);

// ── Session Size ─────────────────────────────────────────────────────
export type SessionSize = 10 | 15 | 20;

export const SessionSizeSchema = z.union([
  z.literal(10),
  z.literal(15),
  z.literal(20),
]);

// ── Practice Configuration ───────────────────────────────────────────
export interface PracticeConfig {
  operations: {
    addition: boolean;
    subtraction: boolean;
    multiplication: boolean;
  };
  maxDigits: MaxDigits;
  difficulty: Difficulty;
  mode: PracticeMode;
  sessionSize: SessionSize;
  guidedMode: boolean;
  checkMode: CheckMode;
  themeId: string;
}

export const PracticeConfigSchema = z.object({
  operations: z.object({
    addition: z.boolean(),
    subtraction: z.boolean(),
    multiplication: z.boolean(),
  }),
  maxDigits: MaxDigitsSchema,
  difficulty: DifficultySchema,
  mode: PracticeModeSchema,
  sessionSize: SessionSizeSchema,
  guidedMode: z.boolean(),
  checkMode: CheckModeSchema,
  themeId: z.string(),
});

// ── Problem ──────────────────────────────────────────────────────────
export interface Problem {
  id: string;
  seed: number;
  index: number;
  op: Operation;
  a: number;
  b: number;
  aDigits: number;
  bDigits: number;
  createdAt: number;
}

// ── Check Result ─────────────────────────────────────────────────────
export type CheckResult = 'Correct' | 'Incorrect' | 'Skipped';

// ── Session Summary ──────────────────────────────────────────────────
export interface SessionSummary {
  id: string;
  startedAt: number;
  endedAt: number;
  configSnapshot: PracticeConfig;
  problems: Array<{
    problemId: string;
    op: Operation;
    digitsMax: number;
    result: CheckResult;
  }>;
  totals: {
    attempted: number;
    correct: number;
    incorrect: number;
    durationSeconds: number;
  };
}

// ── Progress Stats ───────────────────────────────────────────────────
export interface ProgressStats {
  daily: Array<{ date: string; attempted: number; correct: number }>;
  byOperation: Array<{ op: Operation; attempted: number; correct: number }>;
  maxDigitsAchieved: number;
  streaks: { correctInARow: number; incorrectInARow: number };
  unlocked: { colors: string[]; stickers: string[] };
}

// ── App State ────────────────────────────────────────────────────────
export interface ActiveSession {
  id: string;
  seed: number;
  startedAt: number;
  completedAt?: number;
  status: 'active' | 'completed';
  problems: Problem[];
  checkResults: Record<string, CheckResult>;
}

export interface AppState {
  config: PracticeConfig;
  session: ActiveSession | null;
  progress: ProgressStats;
  toolSettings: {
    color: string;
    size: number;
    mode: 'pen' | 'eraser';
  };
}

// ── App Actions ──────────────────────────────────────────────────────
export type AppAction =
  | { type: 'SET_CONFIG'; payload: Partial<PracticeConfig> }
  | { type: 'SET_OPERATIONS'; payload: Partial<PracticeConfig['operations']> }
  | { type: 'SET_MAX_DIGITS'; payload: MaxDigits }
  | { type: 'SET_DIFFICULTY'; payload: Difficulty }
  | { type: 'SET_MODE'; payload: PracticeMode }
  | { type: 'SET_GUIDED_MODE'; payload: boolean }
  | { type: 'SET_CHECK_MODE'; payload: CheckMode }
  | { type: 'SET_THEME'; payload: string }
  | { type: 'SET_SESSION_SIZE'; payload: SessionSize }
  | { type: 'START_SESSION'; payload: ActiveSession }
  | { type: 'COMPLETE_SESSION' }
  | { type: 'END_SESSION' }
  | { type: 'CHECK_PROBLEM'; payload: { problemId: string; result: CheckResult } }
  | { type: 'SET_TOOL_COLOR'; payload: string }
  | { type: 'SET_TOOL_SIZE'; payload: number }
  | { type: 'SET_TOOL_MODE'; payload: 'pen' | 'eraser' }
  | { type: 'SET_PROGRESS'; payload: ProgressStats }
  | { type: 'UPDATE_STREAKS'; payload: { correctInARow: number; incorrectInARow: number } };

// ── Default Values ───────────────────────────────────────────────────
export const DEFAULT_CONFIG: PracticeConfig = {
  operations: { addition: true, subtraction: false, multiplication: false },
  maxDigits: 1,
  difficulty: 'Easy',
  mode: 'FreePractice',
  sessionSize: 10,
  guidedMode: false,
  checkMode: 'Manual',
  themeId: 'default',
};

export const DEFAULT_PROGRESS: ProgressStats = {
  daily: [],
  byOperation: [],
  maxDigitsAchieved: 1,
  streaks: { correctInARow: 0, incorrectInARow: 0 },
  unlocked: { colors: ['#000000', '#1e40af', '#dc2626', '#16a34a'], stickers: [] },
};

export const DEFAULT_APP_STATE: AppState = {
  config: DEFAULT_CONFIG,
  session: null,
  progress: DEFAULT_PROGRESS,
  toolSettings: {
    color: '#000000',
    size: 3,
    mode: 'pen',
  },
};