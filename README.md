# 🧮 MathCanvas

A touch-first math practice app for children aged 5–10. Children solve arithmetic problems by writing directly on the screen, while parents control the practice configuration from a top bar.

![React](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue) ![Vite](https://img.shields.io/badge/Vite-5-purple) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-cyan)

## Features

- **Addition, subtraction, and multiplication** with configurable digit counts (1–6 digits per operand)
- **Touch-first canvas drawing** — children write answers directly on screen with pen or finger
- **Two-layer canvas system** — non-erasable problem template + erasable ink layer
- **Drawing tools** — color palette (8 colors), adjustable brush size, pen and eraser modes
- **Guided mode** — optional digit-column guides and carry rows for learning scaffolding
- **Free Practice mode** — infinite scrolling grid of problems
- **Session mode** — fixed problem sets with timer and parent checking
- **Manual answer checking** — parents can reveal answers and mark correct/incorrect
- **Four visual themes** — Sky Blue, Forest, Sunset, Lavender
- **Deterministic problem generation** — seeded RNG ensures reproducible problem sets
- **Offline-first** — no ads, no external calls, no accounts required

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npx vitest run

# Preview production build
npm run preview
```

The development server starts at `http://localhost:5173`.

## Tech Stack

| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| TypeScript 5.6 | Type safety |
| Vite 5 | Build tool with HMR |
| Tailwind CSS 4 | Utility-first styling |
| react-window | Virtualized list rendering |
| zod | Runtime configuration validation |
| Vitest | Unit testing |

## Project Structure

```
src/
├── app/                    # Application shell and global state
│   ├── App.tsx             # Root component
│   └── store/              # Global state management
│       ├── appReducer.ts   # Single top-level reducer
│       ├── selectors.ts    # State selectors
│       └── types.ts        # All data models and types
├── domain/                 # Pure business logic (no UI dependencies)
│   ├── generation/         # Problem generation engine
│   │   ├── rng.ts          # Seeded PRNG (Mulberry32)
│   │   ├── problemTypes.ts # Digit ranges, operator symbols, helpers
│   │   ├── problemGenerator.ts # Problem factory functions
│   │   └── rules.ts        # Operand generation rules by difficulty
│   ├── scoring/            # Answer checking and progression
│   │   ├── checking.ts     # Answer verification
│   │   └── progression.ts  # Auto-progression engine
│   └── persistence/        # Storage abstraction
│       ├── storage.ts       # Storage interface
│       └── localStorageAdapter.ts # LocalStorage implementation
├── ui/                     # UI components
│   ├── layout/             # Page structure
│   │   ├── Shell.tsx       # Full-page flex container
│   │   └── TopBar.tsx      # Sticky control bar
│   ├── problems/           # Problem display
│   │   ├── ProblemCard.tsx  # Individual problem card
│   │   └── ProblemGrid.tsx # Responsive grid layout
│   ├── canvas/             # Drawing system
│   │   ├── ProblemCanvas.tsx    # Two-layer canvas component
│   │   ├── templateRenderer.ts  # Problem template drawing
│   │   ├── inkRenderer.ts       # Stroke rendering
│   │   ├── strokeModel.ts       # Ink data model
│   │   └── pointerController.ts # Pointer event handling
│   └── shared/             # Reusable UI components
│       ├── ConfirmDialog.tsx # Modal confirmation dialog
│       └── Timer.tsx         # Session timer display
├── theme/                  # Theming system
│   ├── themes.ts           # Theme definitions
│   └── themeProvider.tsx   # React context provider
└── tests/                  # Unit tests
    ├── generator.test.ts   # Problem generation tests
    └── progression.test.ts # Progression engine tests
```

## Documentation

| Document | Description |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical architecture, design principles, data models |
| [USER_GUIDE.md](./USER_GUIDE.md) | How to use the app (for parents and children) |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Developer guide, module details, testing, roadmap |

## Design Principles

1. **Maintainability** — clean separation between domain logic, UI, and persistence
2. **Correctness** — deterministic problem generation, validated configurations, constraint enforcement
3. **Performance** — virtualized rendering, incremental canvas drawing, 60fps target on tablets
4. **Visual calm** — clean design, no gamification pressure, child-friendly themes

## License

Private project.