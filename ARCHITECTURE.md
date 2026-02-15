# Architecture

This document describes the technical architecture of MathCanvas, covering design principles, data models, state management, and key subsystems.

## Table of Contents

- [Design Principles](#design-principles)
- [Architectural Edicts](#architectural-edicts)
- [Data Models](#data-models)
- [State Management](#state-management)
- [Problem Generation Engine](#problem-generation-engine)
- [Canvas Rendering System](#canvas-rendering-system)
- [Drawing Engine](#drawing-engine)
- [Theming System](#theming-system)
- [Persistence Layer](#persistence-layer)

---

## Design Principles

The architecture prioritizes (in order):

1. **Maintainability and architectural purity** — clear module boundaries, separation of concerns
2. **Correctness and predictable behavior** — deterministic generation, validated configs, enforced constraints
3. **Performance and responsiveness on tablets** — virtualized rendering, incremental drawing
4. **Visual appeal** — clean, calm design appropriate for children

Non-priorities: complex animations, audio, competitive gamification.

---

## Architectural Edicts

These are non-negotiable constraints governing the implementation.

### Separation of Concerns

| Layer | Responsibility | Dependencies |
|---|---|---|
| `domain/` | Pure business logic — generation, scoring, persistence interfaces | None (no UI imports) |
| `ui/` | React components, canvas rendering, pointer handling | May import from `domain/` and `app/` |
| `app/` | Application shell, global state reducer, type definitions | None |
| `theme/` | Theme tokens and React context provider | None |

- Problem generation logic is **pure and deterministic** given a seed and config.
- Rendering logic for templates is **isolated** from drawing/ink logic.
- The ink data model and stroke serialization do **not** depend on UI components.
- Persistence is isolated behind a **storage interface**.

### State Management Rules

- **Global state is small and stable.** A single top-level `useReducer` manages configuration and session state.
- **Per-problem state is isolated per card.** Stroke data lives in component-local refs, not in global state.
- **Persist only summaries.** Raw ink data is not persisted in v1.

### Determinism and Reproducibility

- Every generated problem includes a stable `id` (`p-{seed}-{index}`) and is reproducible from a seed.
- The seed and index within a session are stored so the same problem set can be regenerated.
- The RNG uses the **Mulberry32** algorithm, which is fast and deterministic.

### Performance Rules

- Virtualization for the problem list — only visible cards are mounted.
- Canvas drawing is **incremental** — only the latest segment is drawn on pointer move, not the entire stroke history.
- On resize, the template layer redraws and ink re-renders from stored strokes.
- Target: **60 fps drawing on iPad**.

### Safety

- No ads, no external network calls, offline-first.
- No accounts required.
- Large touch targets throughout the UI.

---

## Data Models

All types are defined in `src/app/store/types.ts` and validated at runtime with Zod schemas.

### PracticeConfig

Controls how problems are generated and how the app behaves.

```typescript
PracticeConfig {
  operations: { addition: boolean; subtraction: boolean; multiplication: boolean }
  maxDigits: 1 | 2 | 3 | 4 | 5 | 6
  difficulty: 'Easy' | 'Medium' | 'Hard'
  mode: 'FreePractice' | 'Session'
  sessionSize: 10 | 15 | 20
  guidedMode: boolean
  checkMode: 'Manual' | 'Off'
  themeId: string
}
```

### Problem

Immutable once generated. Fully deterministic from `seed` + `index` + config.

```typescript
Problem {
  id: string          // Format: "p-{seed}-{index}"
  seed: number
  index: number
  op: 'addition' | 'subtraction' | 'multiplication'
  a: number           // First operand
  b: number           // Second operand
  aDigits: number     // Digit count of first operand
  bDigits: number     // Digit count of second operand
  createdAt: number   // Timestamp
}
```

### Ink Model

Per-problem card, not stored in global state, not persisted in v1.

```typescript
StrokePoint { x: number; y: number; t: number; pressure?: number }

Stroke {
  id: string
  color: string
  size: number
  mode: 'pen' | 'eraser'
  points: StrokePoint[]
}

InkState {
  strokes: Stroke[]
}
```

### ActiveSession

Tracks an in-progress or completed session.

```typescript
ActiveSession {
  id: string
  seed: number
  startedAt: number
  completedAt?: number
  status: 'active' | 'completed'
  problems: Problem[]
  checkResults: Record<string, CheckResult>  // problemId → result
}
```

### SessionSummary

Produced when a session ends. Designed for persistence.

```typescript
SessionSummary {
  id: string
  startedAt: number
  endedAt: number
  configSnapshot: PracticeConfig
  problems: Array<{
    problemId: string
    op: Operation
    digitsMax: number
    result: 'Correct' | 'Incorrect' | 'Skipped'
  }>
  totals: {
    attempted: number
    correct: number
    incorrect: number
    durationSeconds: number
  }
}
```

### ProgressStats

Aggregated statistics across sessions.

```typescript
ProgressStats {
  daily: Array<{ date: string; attempted: number; correct: number }>
  byOperation: Array<{ op: Operation; attempted: number; correct: number }>
  maxDigitsAchieved: number
  streaks: { correctInARow: number; incorrectInARow: number }
  unlocked: { colors: string[]; stickers: string[] }
}
```

---

## State Management

### Global State (`AppState`)

```typescript
AppState {
  config: PracticeConfig      // Current practice settings
  session: ActiveSession | null // Active session (null in free practice)
  progress: ProgressStats     // Aggregated stats
  toolSettings: {
    color: string              // Current pen color
    size: number               // Current brush size
    mode: 'pen' | 'eraser'    // Current tool
  }
}
```

### Reducer Actions

The `appReducer` handles all global state transitions via a discriminated union of actions:

| Action | Purpose |
|---|---|
| `SET_CONFIG` | Update any config fields |
| `SET_OPERATIONS` | Toggle addition/subtraction/multiplication |
| `SET_MAX_DIGITS` | Change digit slider (1–6) |
| `SET_DIFFICULTY` | Switch Easy/Medium/Hard |
| `SET_MODE` | Switch FreePractice/Session |
| `SET_GUIDED_MODE` | Toggle guided overlays |
| `SET_CHECK_MODE` | Toggle Manual/Off checking |
| `SET_THEME` | Change visual theme |
| `SET_SESSION_SIZE` | Set session problem count |
| `START_SESSION` | Initialize a new session |
| `COMPLETE_SESSION` | Stop timer, mark session completed |
| `END_SESSION` | Clear session, return to free practice |
| `CHECK_PROBLEM` | Record a check result for a problem |
| `SET_TOOL_COLOR` | Change pen color |
| `SET_TOOL_SIZE` | Change brush size |
| `SET_TOOL_MODE` | Switch pen/eraser |

### Per-Card State

Stroke data is managed via React refs inside `ProblemCanvas`, avoiding global re-renders on every pointer event. This is critical for maintaining 60fps drawing performance.

---

## Problem Generation Engine

Located in `src/domain/generation/`. Pure functions with no side effects.

### Pipeline

```
seed + index → SeededRng → selectOperation() → chooseDigitCounts() → generateOperands() → Problem
```

### Seeded RNG (`rng.ts`)

Uses the **Mulberry32** algorithm. Each problem gets its own child RNG derived from `hash(seed * 100003 + index)`, ensuring independent reproducibility.

```typescript
SeededRng.forProblem(seed, index)  // Creates isolated RNG for one problem
rng.next()       // Float in [0, 1)
rng.nextInt(min, max)  // Integer in [min, max] inclusive
rng.pick(array)  // Random element from array
```

### Digit Ranges (`problemTypes.ts`)

| Digits | Range |
|---|---|
| 1 | 1–9 |
| 2 | 10–99 |
| 3 | 100–999 |
| 4 | 1000–9999 |
| 5 | 10000–99999 |
| 6 | 100000–999999 |

### Generation Rules (`rules.ts`)

**Operation selection:** Uniform random from enabled operations.

**Digit count selection by difficulty:**

| Difficulty | Addition/Subtraction | Multiplication |
|---|---|---|
| Easy | Both operands same digit count (avoids carry/borrow) | `aDigits` up to `maxDigits`, `bDigits` capped to 1 |
| Medium | Independent digit counts up to `maxDigits` | `bDigits` capped to min(2, `maxDigits`) |
| Hard | Independent digit counts up to `maxDigits` | `bDigits` up to `maxDigits` |

**Subtraction constraint:** If `b > a`, operands are swapped to guarantee `a ≥ b`. The result is never negative.

**Easy mode carry/borrow avoidance:** The generator attempts up to 20 re-rolls to find operand pairs without carry (addition) or borrow (subtraction). Falls back to any valid pair if no carry/borrow-free pair is found.

---

## Canvas Rendering System

Located in `src/ui/canvas/`. Each problem card uses a **two-layer canvas stack**:

### Layer 1: Template Canvas (`templateRenderer.ts`)

Non-interactive. Draws the math problem layout:

- Numbers are **right-aligned** in a monospace font (`Courier New`)
- Operator symbol (`+`, `−`, `×`) is positioned in a fixed left column
- A **separator line** is drawn beneath the numbers, extending ~4 character widths beyond the number block
- Digits are spaced with consistent character width using `ctx.measureText()`

**Layout computation (`computeLayout`):**
1. Determine the max digit count between operands
2. Calculate character dimensions using monospace font metrics
3. Compute total block width (operator + gap + digits)
4. Center the block horizontally in the canvas
5. Position elements vertically with appropriate spacing

**Guided mode overlays:**
When `guidedMode` is enabled, the template renderer additionally draws:
- Faint vertical digit-column lines under the number block
- A faint carry row above the first number
- A dotted answer baseline under the separator line

**Answer rendering:**
When "Reveal Answer" is triggered, the answer is drawn below the separator line in green, right-aligned with the operands.

### Layer 2: Ink Canvas (`inkRenderer.ts`)

Interactive. Accepts pointer input and renders user strokes.

- **Pen mode:** Draws smooth lines with configurable color and width, using `round` line caps and joins
- **Eraser mode:** Uses `destination-out` composite operation to erase ink
- **Incremental rendering:** Only draws the latest line segment on each pointer move
- **Full redraw:** On undo/clear, redraws all remaining strokes from the stored array

---

## Drawing Engine

### Pointer Controller (`pointerController.ts`)

Manages the full pointer event lifecycle on the ink canvas:

- Listens for `pointerdown`, `pointermove`, `pointerup`, `pointerleave`, `pointercancel`
- Sets `touch-action: none` on the canvas to prevent browser scroll/zoom interference
- Creates a new `Stroke` on pointer down
- Appends `StrokePoint` entries on pointer move with incremental rendering
- Finalizes the stroke on pointer up and calls `onStrokeComplete`
- **Palm rejection:** When `pointerType` is `pen`, touch pointer events are ignored while a pen stroke is active

### Stroke Model (`strokeModel.ts`)

- `createStroke(color, size, mode)` — factory for new strokes with unique IDs
- `addPoint(stroke, point)` — appends a point to a stroke (mutative for performance)
- `createEmptyInkState()` — returns an empty ink state

### Tool Settings

Tools are controlled from the top bar and passed down as props:

- **Pen:** Draws with the selected color and size
- **Eraser:** Erases ink at the selected size
- **Color palette:** 8 preset colors (black, blue, red, green, purple, orange, teal, pink)
- **Brush size:** Slider from 1–12px
- Selecting a color automatically switches to pen mode

---

## Theming System

Located in `src/theme/`. Uses React Context for theme distribution.

### Theme Structure

Each theme defines a set of color tokens:

```typescript
Theme {
  id: string
  name: string
  emoji: string         // Displayed in theme selector
  colors: {
    bgPrimary: string   // Page background
    bgCard: string      // Card background
    bgTopBar: string    // Top bar background
    textPrimary: string
    textSecondary: string
    accent: string      // Buttons, highlights
    accentHover: string
    cardBorder: string
    problemLine: string // Separator line in problems
    success: string
    error: string
  }
}
```

### Available Themes

| Theme | ID | Emoji | Description |
|---|---|---|---|
| Sky Blue | `default` | ☁️ | Light blue, clean and calm |
| Forest | `forest` | 🌲 | Green-toned, nature-inspired |
| Sunset | `sunset` | 🌅 | Warm orange/amber tones |
| Lavender | `lavender` | 💜 | Soft purple, gentle |

Themes change only colors — layout and structure remain identical.

### ThemeProvider

Wraps the app in a React Context. Components access the current theme via the `useTheme()` hook.

---

## Persistence Layer

Located in `src/domain/persistence/`. Defines a storage interface with adapter implementations.

### Storage Interface

```typescript
interface Storage {
  getProgress(): Promise<ProgressStats>
  saveProgress(stats: ProgressStats): Promise<void>
  appendSession(summary: SessionSummary): Promise<void>
  listSessions(limit: number): Promise<SessionSummary[]>
}
```

### LocalStorage Adapter

Current implementation uses `localStorage` with JSON serialization. Designed to be replaced with an IndexedDB adapter for larger datasets.

**Design decision:** Only session summaries and aggregated progress metrics are persisted — raw ink/stroke data is not stored in v1.