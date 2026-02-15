import type { AppState, AppAction } from './types';
import { DEFAULT_APP_STATE } from './types';

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_APP_MODE':
      return { ...state, mode: action.payload };

    case 'SET_CONFIG':
      return {
        ...state,
        config: { ...state.config, ...action.payload },
      };

    case 'SET_OPERATIONS':
      return {
        ...state,
        config: {
          ...state.config,
          operations: { ...state.config.operations, ...action.payload },
        },
      };

    case 'SET_MAX_DIGITS':
      return {
        ...state,
        config: { ...state.config, maxDigits: action.payload },
      };

    case 'SET_DIFFICULTY':
      return {
        ...state,
        config: { ...state.config, difficulty: action.payload },
      };

    case 'SET_MODE':
      return {
        ...state,
        config: { ...state.config, mode: action.payload },
      };

    case 'SET_GUIDED_MODE':
      return {
        ...state,
        config: { ...state.config, guidedMode: action.payload },
      };

    case 'SET_CHECK_MODE':
      return {
        ...state,
        config: { ...state.config, checkMode: action.payload },
      };

    case 'SET_THEME':
      return {
        ...state,
        config: { ...state.config, themeId: action.payload },
      };

    case 'SET_SESSION_SIZE':
      return {
        ...state,
        config: { ...state.config, sessionSize: action.payload },
      };

    case 'START_SESSION':
      return {
        ...state,
        session: action.payload,
      };

    case 'COMPLETE_SESSION':
      if (!state.session) return state;
      return {
        ...state,
        session: {
          ...state.session,
          status: 'completed',
          completedAt: Date.now(),
        },
      };

    case 'END_SESSION':
      return {
        ...state,
        session: null,
        config: { ...state.config, mode: 'FreePractice' },
      };

    case 'START_WORD_PROBLEM_SESSION':
      return { ...state, wordProblemSession: action.payload };

    case 'NAVIGATE_WORD_PROBLEM': {
      if (!state.wordProblemSession) return state;
      return {
        ...state,
        wordProblemSession: {
          ...state.wordProblemSession,
          currentIndex: action.payload.index,
        },
      };
    }

    case 'SET_WORD_PROBLEM_ANSWER': {
      if (!state.wordProblemSession) return state;
      return {
        ...state,
        wordProblemSession: {
          ...state.wordProblemSession,
          answers: {
            ...state.wordProblemSession.answers,
            [action.payload.problemId]: action.payload.answer,
          },
        },
      };
    }

    case 'CHECK_WORD_PROBLEM': {
      if (!state.wordProblemSession) return state;
      return {
        ...state,
        wordProblemSession: {
          ...state.wordProblemSession,
          checkResults: {
            ...state.wordProblemSession.checkResults,
            [action.payload.problemId]: action.payload.result,
          },
        },
      };
    }

    case 'COMPLETE_WORD_PROBLEM_SESSION': {
      if (!state.wordProblemSession) return state;
      return {
        ...state,
        wordProblemSession: {
          ...state.wordProblemSession,
          status: 'completed',
          completedAt: Date.now(),
        },
      };
    }

    case 'END_WORD_PROBLEM_SESSION':
      return { ...state, wordProblemSession: null };

    case 'CHECK_PROBLEM':
      if (!state.session) return state;
      return {
        ...state,
        session: {
          ...state.session,
          checkResults: {
            ...state.session.checkResults,
            [action.payload.problemId]: action.payload.result,
          },
        },
      };

    case 'SET_TOOL_COLOR':
      return {
        ...state,
        toolSettings: { ...state.toolSettings, color: action.payload, mode: 'pen' },
      };

    case 'SET_TOOL_SIZE':
      return {
        ...state,
        toolSettings: { ...state.toolSettings, size: action.payload },
      };

    case 'SET_TOOL_MODE':
      return {
        ...state,
        toolSettings: { ...state.toolSettings, mode: action.payload },
      };

    case 'SET_PROGRESS':
      return {
        ...state,
        progress: action.payload,
      };

    case 'UPDATE_STREAKS':
      return {
        ...state,
        progress: {
          ...state.progress,
          streaks: action.payload,
        },
      };

    default:
      return state;
  }
}

export { DEFAULT_APP_STATE };