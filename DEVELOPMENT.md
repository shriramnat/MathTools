# Development Guide

This document covers everything a developer needs to work on MathCanvas: setup, module deep-dives, testing, conventions, and the future roadmap.

## Table of Contents

- [Setup](#setup)
- [Scripts](#scripts)
- [Module Reference](#module-reference)
- [Problem Generation Deep Dive](#problem-generation-deep-dive)
- [Canvas System Deep Dive](#canvas-system-deep-dive)
- [State Management Deep Dive](#state-management-deep-dive)
- [Testing](#testing)
- [Conventions](#conventions)
- [Roadmap](#roadmap)
- [Original Spec Reference](#original-spec-reference)

---

## Setup

### Prerequisites

- Node.js 18+ 
- npm 9+

### Installation

```bash
git clone https://github.com/shriramnat/MathTools.git
cd MathCanvas
npm install
```

### Development Server

```bash
npm run dev
```

Opens at `http://localhost:5173` with hot module replacement (HMR).

### Production Build

```bash
npm run build
```

Outputs to `dist/`. TypeScript is checked first (`tsc -b`), then Vite bundles the app.

### Preview Production Build

```bash
npm run preview
```

---

## Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `vite` | Start dev server with HMR |
| `build` | `tsc -b && vite build` | Type-check and build for production |
| `lint` | `eslint .` | Run ESLint |
| `preview` | `vite preview` | Serve the production build locally |
| Test | `npx vitest run` | Run unit tests once |
| Test (watch) | `npx vitest` | Run tests in watch mode |

---

## Module Reference

### `src/app/` — Application Shell

#### `App.tsx`

Root component. Wires together:
- `useReducer` with `appReducer` for global state
- `ThemeProvider` for theming context
- `Shell` + `TopBar` + `ProblemGrid` layout
- Session lifecycle callbacks (start, finish, end)
- `ConfirmDialog` for session completion confirmation

#### `store/types.ts`

All data models, type definitions, Zod validation schemas, and default values. This is the single source of truth for the app's type system.

Key exports:
- `PracticeConfig`, `PracticeConfigSchema` — configuration with runtime validation
- `Problem` — immutable problem record
- `ActiveSession` — in-progress session state
- `SessionSummary` — completed session record for persistence
- `ProgressStats` — aggregated statistics
- `AppState`, `AppAction` — global state and action types
- `DEFAULT_CONFIG`, `DEFAULT_APP_STATE` — initial values

#### `store/appReducer.ts`

Pure reducer function handling all `AppAction` types. Key behaviors:
- `COMPLETE_SESSION` — stamps `completedAt` timestamp and sets status to `'completed'`
- `END_SESSION` — resets session to `null`
- `CHECK_PROBLEM` — records check result in `session.checkResults` map
- Prevents disabling all operations via guard logic in `SET_OPERATIONS`

#### `store/selectors.ts`

State selector functions for derived data.

---

### `src/domain/generation/` — Problem Generation

All functions are **pure** — no side effects, no UI dependencies.

#### `rng.ts` — Seeded Random Number Generator

Implements the **Mulberry32** PRNG algorithm.

```typescript
class SeededRng {
  constructor(seed: number)
  next(): number              // Float in [0, 1)
  nextInt(min, max): number   // Integer in [min, max] inclusive
  pick<T>(arr: T[]): T       // Random array element

  static forProblem(seed: number, index: number): SeededRng
}
```

`forProblem` creates a child RNG with seed `hash(seed * 100003 + index)`, ensuring each problem is independently reproducible regardless of generation order.

#### `problemTypes.ts` — Type Helpers

- `digitRange(digits)` — returns `{ min, max }` for a given digit count
- `operatorSymbol(op)` — returns display character (`+`, `−`, `×`)
- `computeAnswer(problem)` — calculates the correct numeric answer
- `getEnabledOperations(ops)` — filters to enabled operations array
- `getMultiplicationBDigitsCap(difficulty, maxDigits)` — returns b-operand digit cap for multiplication
- `hasCarry(a, b)` — checks if addition produces a carry
- `hasBorrow(a, b)` — checks if subtraction produces a borrow

#### `problemGenerator.ts` — Problem Factory

```typescript
generateProblem(seed, index, config): Problem    // Single problem
generateProblems(seed, startIndex, count, config): Problem[]  // Batch
createSeed(): number  // New random seed
```

#### `rules.ts` — Generation Rules

Core algorithm:

1. `selectOperation(rng, config)` — picks uniformly from enabled operations
2. `chooseDigitCounts(rng, op, config)` — selects `aDigits` and `bDigits` based on difficulty
3. `generateOperands(rng, op, config)` — generates valid number pair with constraint enforcement

Constraint enforcement:
- Subtraction: swaps operands if `b > a` to guarantee non-negative results
- Easy mode: re-rolls up to 20 times to avoid carry/borrow
- Multiplication: caps `bDigits` based on difficulty level

---

### `src/domain/scoring/` — Checking and Progression

#### `checking.ts`

Answer verification logic. Compares a submitted answer against the computed correct answer.

#### `progression.ts`

Automatic difficulty progression engine (optional feature):

- If `correctInARow ≥ 5` → increase `maxDigits` by 1 (up to 6)
- If `incorrectInARow ≥ 3` → decrease `maxDigits` by 1 (down to 1)
- If `maxDigits` is stable → shift difficulty between Easy → Medium → Hard

Auto-progression is optional and controlled by app configuration.

---

### `src/domain/persistence/` — Storage

#### `storage.ts`

Defines the abstract storage interface:

```typescript
interface Storage {
  getProgress(): Promise<ProgressStats>
  saveProgress(stats: ProgressStats): Promise<void>
  appendSession(summary: SessionSummary): Promise<void>
  listSessions(limit: number): Promise<SessionSummary[]>
}
```

#### `localStorageAdapter.ts`

Implements the storage interface using `localStorage` with JSON serialization.

---

### `src/ui/canvas/` — Drawing System

#### `ProblemCanvas.tsx`

React component managing the two-layer canvas stack:

- **Template canvas** — renders the math problem (non-interactive, `pointerEvents: none`)
- **Ink canvas** — handles pointer input and user drawing (`touchAction: none`)

Manages:
- Template redrawing on problem/config changes via `useEffect`
- Pointer controller lifecycle (created once per mount)
- Tool settings passed via refs to avoid controller recreation
- Undo (remove last stroke + full redraw) and clear (empty strokes + clear canvas)

Canvas dimensions: 400×300px internal resolution, scaled responsively via CSS.

#### `templateRenderer.ts`

Pure rendering functions for the problem template layer:

- `computeLayout(problem, width, height)` — calculates all positioning metrics
- `renderTemplate(ctx, problem, layout, guidedMode)` — draws the complete template
- `renderAnswer(ctx, problem, layout)` — draws the answer when revealed

Layout algorithm:
1. Uses monospace font (`Courier New`) for consistent digit widths
2. Measures character width with `ctx.measureText('0')`
3. Computes block dimensions: operator column + gap + digit columns
4. Centers the block horizontally in the canvas
5. Draws operator, operands (right-aligned), separator line, and optional guides

#### `inkRenderer.ts`

- `drawStrokeSegment(ctx, stroke, fromIndex)` — draws a single line segment (incremental)
- `redrawAllStrokes(ctx, strokes, width, height)` — clears and redraws all strokes

Pen strokes use `source-over` compositing; eraser strokes use `destination-out`.

#### `strokeModel.ts`

Data types and factory functions for the ink model. Strokes get unique IDs via timestamp + counter.

#### `pointerController.ts`

Encapsulates all pointer event handling:

- Binds `pointerdown`, `pointermove`, `pointerup`, `pointerleave`, `pointercancel`
- Coordinates with `strokeModel` and `inkRenderer` for incremental drawing
- Implements basic palm rejection (pen vs touch discrimination)
- `destroy()` method for cleanup on unmount

---

### `src/ui/layout/` — Page Structure

#### `Shell.tsx`

Minimal full-page flex container (`min-h-screen flex flex-col`).

#### `TopBar.tsx`

Sticky top bar with three rows:

1. **Title row** — app name + hamburger menu (mobile/tablet)
2. **Settings row** — collapsible panel with operations, digits, difficulty, mode, guides, themes
3. **Tools row** — always visible pen/eraser, color palette, brush size

Features:
- Responsive: settings collapse behind hamburger on small screens, always visible on `lg+`
- Prevents disabling all operations (minimum one required)
- Session controls appear when Session mode is selected
- Timer display during active sessions

---

### `src/ui/problems/` — Problem Display

#### `ProblemCard.tsx`

Individual problem card wrapper. Contains:
- `ProblemCanvas` (the two-layer drawing area)
- Check panel (Reveal Answer, Mark Correct, Mark Incorrect)
- Result badges

#### `ProblemGrid.tsx`

Responsive grid layout:
- 1 column on small screens
- 2 columns on medium screens
- 3 columns on large screens

In Free Practice mode, generates problems on the fly as needed. In Session mode, renders the fixed problem set.

---

### `src/ui/shared/` — Reusable Components

#### `ConfirmDialog.tsx`

Modal dialog with backdrop overlay. Used for session completion confirmation. Props: `open`, `title`, `message`, `confirmLabel`, `cancelLabel`, `onConfirm`, `onCancel`.

#### `Timer.tsx`

Displays elapsed time in `MM:SS` format. Updates every second via `setInterval`. Accepts `startedAt` timestamp and optional `stoppedAt` to freeze the display.

---

### `src/theme/` — Theming

#### `themes.ts`

Defines the `Theme` interface and the `THEMES` array with four preset themes (Sky Blue, Forest, Sunset, Lavender).

#### `themeProvider.tsx`

React Context provider. Looks up the active theme by `themeId` from app state. Components use the `useTheme()` hook to access the current theme's color tokens.

---

## Problem Generation Deep Dive

### Determinism Guarantee

Given the same `seed`, `index`, and `PracticeConfig`, the generator will always produce the identical `Problem`. This is achieved by:

1. Using a deterministic PRNG (Mulberry32)
2. Deriving a child seed per problem: `seed * 100003 + index`
3. Making all generation logic pure (no `Math.random()`, no side effects)

### Digit Range Table

| `digits` | Min | Max |
|---|---|---|
| 1 | 1 | 9 |
| 2 | 10 | 99 |
| 3 | 100 | 999 |
| 4 | 1,000 | 9,999 |
| 5 | 10,000 | 99,999 |
| 6 | 100,000 | 999,999 |

Formula: if `digits = 1`, range is `[1, 9]`. If `digits > 1`, range is `[10^(digits-1), 10^digits - 1]`.

### Difficulty Effects on Generation

| Difficulty | Addition/Subtraction | Multiplication |
|---|---|---|
| Easy | Same digit count for both operands; re-roll to avoid carry/borrow | `bDigits` capped to 1 |
| Medium | Independent digit counts; carry/borrow allowed | `bDigits` capped to min(2, maxDigits) |
| Hard | Independent digit counts; carry/borrow allowed | `bDigits` up to maxDigits |

### Subtraction Safety

For every subtraction problem, after generating `a` and `b` within their respective digit ranges, the generator checks if `b > a`. If so, operands are swapped. This guarantees the answer is always ≥ 0.

---

## Canvas System Deep Dive

### Two-Layer Architecture

```
┌──────────────────────────┐
│   Template Canvas        │  ← pointerEvents: none
│   (problem layout)       │     Redraws on config change
├──────────────────────────┤
│   Ink Canvas             │  ← touchAction: none
│   (user drawing)         │     Incremental rendering
└──────────────────────────┘
```

Both canvases are absolutely positioned within the same container, stacked via CSS.

### Rendering Flow

**Template rendering (on mount / config change):**
1. `computeLayout()` calculates all metrics
2. `renderTemplate()` draws operator, operands, separator line
3. If guided mode: draws column guides, carry row, answer baseline
4. If answer revealed: `renderAnswer()` draws the answer in green

**Ink rendering (on pointer events):**
1. `pointerdown` → create new `Stroke`, begin drawing
2. `pointermove` → append point, draw only the new segment (incremental)
3. `pointerup` → finalize stroke, call `onStrokeComplete`
4. Undo → remove last stroke from array, `redrawAllStrokes()`
5. Clear → empty stroke array, `ctx.clearRect()`

### Performance Characteristics

- Template canvas redraws only when the problem or guided mode changes (rare)
- Ink canvas never full-redraws during active drawing — only the newest segment
- Stroke data lives in refs, not React state, so no re-renders during drawing
- Tool settings are accessed via refs, avoiding controller recreation

---

## State Management Deep Dive

### Why `useReducer` Instead of a State Library

The global state is small (config + session + progress + tool settings) and the update patterns are predictable. A single `useReducer` at the root provides:
- Predictable state transitions
- Easy action logging/debugging
- No external dependencies
- Type-safe action dispatch

### State Isolation Strategy

```
Global State (useReducer)          Per-Card State (refs)
├── config                         ├── strokes: Stroke[]
├── session                        └── (managed in ProblemCanvas)
├── progress
└── toolSettings
```

This split prevents the most frequent updates (pointer events, stroke data) from triggering React re-renders.

---

## Testing

### Running Tests

```bash
# Run all tests once
npx vitest run

# Run in watch mode
npx vitest

# Run specific test file
npx vitest run src/tests/generator.test.ts
```

### Test Coverage

#### `generator.test.ts`

Tests for the problem generation engine:
- Subtraction results are never negative
- Digit bounds are respected (`aDigits` and `bDigits` ≤ `maxDigits`)
- Operation selection respects enabled operations
- Easy mode produces carry-free addition in ≥ 80% of cases
- Determinism: same seed + index + config = same problem
- Batch generation produces correct count

#### `progression.test.ts`

Tests for the auto-progression engine:
- `maxDigits` increases after 5 correct in a row
- `maxDigits` decreases after 3 incorrect in a row
- `maxDigits` is clamped to [1, 6]
- Difficulty shifts when `maxDigits` is at boundary

### Adding Tests

Place test files in `src/tests/`. Use Vitest syntax:

```typescript
import { describe, it, expect } from 'vitest';

describe('feature', () => {
  it('should behave correctly', () => {
    expect(result).toBe(expected);
  });
});
```

### Stress Testing

The spec calls for a dev-only test mode that generates 500 problems and asserts all constraints hold. This can be implemented as a Vitest test:

```typescript
it('generates 500 valid problems', () => {
  const seed = 42;
  const config = DEFAULT_CONFIG;
  for (let i = 0; i < 500; i++) {
    const p = generateProblem(seed, i, config);
    // Assert constraints...
  }
});
```

---

## Conventions

### Code Style

- **TypeScript strict mode** — all types explicit or inferred, no `any`
- **Pure functions** in `domain/` — no side effects, no UI imports
- **React.memo** for performance-critical components (e.g., `ProblemCanvas`)
- **Refs over state** for high-frequency updates (pointer events, strokes)
- **Monospace font** (`Courier New`) for all canvas text rendering

### File Organization

- Types and interfaces → `src/app/store/types.ts`
- Pure domain logic → `src/domain/`
- React components → `src/ui/`
- Theming → `src/theme/`
- Tests → `src/tests/`

### Import Rules

- `domain/` must NOT import from `ui/`
- `ui/` may import from `domain/` and `app/`
- `theme/` is self-contained
- Circular dependencies are forbidden

---

## Roadmap

The original specification defines three tiers of features. Current implementation status:

### ✅ Tier 1 — Learning Scaffolding (Implemented)

- [x] Guided mode with column guides, carry row, answer baseline
- [x] Manual parent checking (Reveal Answer, Mark Correct/Incorrect)
- [x] Auto-progression engine (optional)

### 🔲 Tier 2 — Session Mode and Parent Progress (Partially Implemented)

- [x] Session mode with timer and fixed problem sets
- [ ] Session summary screen (attempted, correct, incorrect, duration, by-operation breakdown, stars)
- [ ] Parent dashboard (daily activity, accuracy by operation, highest digits achieved)
- [ ] Printable worksheet (client-side PDF generation)
- [ ] IndexedDB storage adapter

### 🔲 Tier 3 — Light Motivation and Themes (Partially Implemented)

- [x] Theme system with four themes
- [ ] Stars earned per completed session
- [ ] Unlockable pen colors via stars
- [ ] Sticker rewards

### Future Considerations

From the original spec, these questions remain open:
- Should cards lock after a check is recorded in session mode?
- Should in-progress sessions survive a page refresh?
- Should printable worksheets include multiplication at high digit counts, or cap it?

---

## Original Spec Reference

The app was built from a detailed specification document (`Math Problem.docx`). Key spec sections and where they map in the codebase:

| Spec Section | Implementation |
|---|---|
| §2 Architectural edicts | Enforced across all modules |
| §4 Data models | `src/app/store/types.ts` |
| §5 Problem generation rules | `src/domain/generation/` |
| §6 Canvas and layout rendering | `src/ui/canvas/templateRenderer.ts` |
| §7 Drawing engine | `src/ui/canvas/pointerController.ts`, `inkRenderer.ts` |
| §8 Modes and flows | `App.tsx`, `TopBar.tsx`, `ProblemGrid.tsx` |
| §9 Tier 1 features | Guided mode, checking, progression |
| §10 Tier 2 features | Session mode (partial), dashboard (planned) |
| §11 Tier 3 features | Themes (done), rewards (planned) |
| §12 UI requirements | `TopBar.tsx`, `ProblemGrid.tsx` |
| §13 Persistence | `src/domain/persistence/` |
| §14 Testing | `src/tests/` |