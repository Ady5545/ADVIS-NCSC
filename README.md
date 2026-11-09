# ADVIS — Ady's Virtual Intelligence System

> **A Spatial AI Operating System.** Not a chatbot, not a Three.js demo — one intelligent holographic computer that combines AI, Computer Vision, Gesture Interaction, Voice Interaction, Engineering Visualization, and Spatial Computing into a single unified organism.

[![CI](https://github.com/Ady5545/ADVIS-NCSC/actions/workflows/static.yml/badge.svg)](https://github.com/Ady5545/ADVIS-NCSC/actions)
[![Live](https://img.shields.io/badge/live-ADVIS--NCSC-cyan)](https://ady5545.github.io/ADVIS-NCSC/)

---

## What It Is

ADVIS renders a holographic workspace in the browser. The user interacts through hand gestures (MediaPipe), voice (Web Speech API), and touch. The AI (Google Gemini) understands spatial context — what object is loaded, what the user is looking at — and responds naturally without requiring explicit commands.

Key capabilities:

| Capability | Detail |
|---|---|
| **Spatial Object Engine** | Procedural 3D engineering models rendered via React Three Fiber / Three.js |
| **Gesture Control** | Hand landmark tracking (MediaPipe Hands), pinch-to-select, carry-to-rotate, two-hand scale |
| **Voice Interaction** | Web Speech API for command input; Gemini processes natural language in context |
| **AI Core** | Google Gemini (server-side) — model: `gemini-3.8-flash` by default |
| **Learning Engine** | Structured lesson runner, lesson catalog, progress persistence |
| **CAD Lab** | OCCT WebAssembly kernel for parametric CAD inside the browser |
| **Workshop** | Local innovation workspace with save / restore sessions |
| **Scientific Simulation** | Four-stroke engine simulation, kinematics, explosion math |
| **Theatre Presentation** | Theatre.js timeline-driven animated presentations |
| **Chemistry Engine** | Molecular builder, valence validator, Lewis structure visuals |

---

## Quick Start

### Requirements

- Node.js (no specific floor in `engines`, but Node 18+ recommended — see `vite.config.ts` target `esnext`)
- A `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com)

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env — add your GEMINI_API_KEY

# 3. Run the dev server (Vite front-end + Express back-end)
npm run dev
# → http://localhost:3000
```

### Production Build

```bash
npm run build
npm run start          # starts dist/server.cjs
```

### Run All Validation Checks

```bash
npm run lint           # Runs all 12 validators/unit tests
npm run test:e2e       # Playwright end-to-end tests
```

---

## Project Layout

```
ADVIS/
├── src/
│   ├── App.tsx                     # Root component, state orchestrator
│   ├── HologramCore.tsx            # Nebula/orb holographic ADVIS visual
│   ├── SpatialObjectEngine.tsx     # 3D spatial workspace renderer
│   ├── GestureContext.tsx          # Gesture state provider
│   ├── useGestureEngine.ts         # Spatial camera + gesture logic
│   ├── useHandTracking.ts          # MediaPipe Hands adapter
│   ├── ChatPanel.tsx               # Conversation history UI
│   ├── InputArea.tsx               # Voice / text input
│   ├── Sidebar.tsx                 # Navigation menu
│   ├── UnifiedWorkspaceCenter.tsx  # Command palette + workspace manager
│   ├── MobileNav.tsx               # Spatial command pod (mobile)
│   │
│   ├── AutonomousModelEngine/      # Procedural 3D geometry generators
│   ├── cad/                        # OCCT WASM CAD Lab
│   ├── components/v12/             # V12 engine controller
│   ├── components/v8/              # V8 engine controller
│   ├── domains/                    # STEM domain analytical models
│   ├── generators/                 # High-fidelity precision geometry
│   ├── LearnEngine/                # Chemistry / molecular learning
│   ├── learning/                   # Lesson schema, catalog, runner, progress
│   ├── models/assemblies/          # Component hierarchy + explosion math
│   ├── scientific/                 # SimulationEngine, kinematic bus, audio engines
│   ├── theatre/                    # Theatre.js presentation layer
│   ├── types/                      # Shared TypeScript types
│   ├── workshop/                   # Innovation workshop UI + store
│   └── workspace/                  # Workspace session persistence
│
├── api/
│   ├── advis.js                    # Vercel serverless AI endpoint
│   └── history.js                  # Vercel serverless history endpoint
├── server.js                       # Express dev server (bundled to dist/server.cjs)
├── ButlerEngine.js                 # Gemini multi-turn conversation engine
├── public/models/                  # Static 3D model assets
├── scripts/                        # Validation + unit test scripts (Node)
├── e2e/                            # Playwright E2E tests
├── docs/                           # Design specs, implementation status, plans
└── AGENTS.md                       # AI agent design philosophy & rules
```

---

## Environment Variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `GEMINI_API_KEY` | **Yes** | — | Server-side Gemini API access |
| `GEMINI_MODEL` | No | `gemini-3.8-flash` | Main AI model override |
| `GEMINI_MULTIMODAL_MODEL` | No | `gemini-3.8-flash` | Multimodal model override |
| `ADVIS_ALLOWED_ORIGINS` | No | `https://ady5545.github.io` | CORS allowed origins (comma-separated) |

---

## API Endpoints

All routes are served by `server.js` (dev) or `api/*.js` (Vercel production).

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/memory` | List spatial memories (filter by `?projectId=`) |
| `POST` | `/api/memory` | Create memory entry |
| `PUT` | `/api/memory/:id` | Update memory entry |
| `DELETE` | `/api/memory/:id` | Delete memory entry |
| `GET` | `/api/memory/search` | Search memories |
| `GET` | `/api/projects` | List ADVIS projects |
| `POST` | `/api/projects` | Create project |
| `PUT` | `/api/projects/:id` | Update project |
| `DELETE` | `/api/projects/:id` | Delete project |
| `GET` | `/api/history` | Chat history |
| `POST` | `/api/generate-structure` | Generate 3D structure description |
| `POST` | `/api/advis` | Main Gemini AI chat turn |

---

## Deployment

### GitHub Pages (CI/CD)

Pushes to `main` trigger the `static.yml` workflow:
1. Validates TypeScript, model catalog, lessons, simulation, and builds
2. Deploys to `gh-pages` branch → `https://ady5545.github.io/ADVIS-NCSC/`

Vite `base` is auto-detected: `/ADVIS-NCSC/` for GitHub Pages, `/` for Vercel.

### Vercel

`vercel.json` routes all paths through the Express server for SSR. Add `GEMINI_API_KEY` as an environment variable in the Vercel dashboard.

---

## Validation & Testing

```bash
npm run validate:catalog      # Model catalog schema
npm run validate:science      # Scientific trust assertions
npm run validate:capabilities # Model capability matrix
npm run validate:lessons      # Lesson catalog schema
npm run test:simulation       # Simulation engine contract
npm run test:explosion        # Explosion math determinism
npm run test:study-project    # CAD study project import/export
npm run test:tutor-context    # Tutor context sanitization
npm run test:lesson-progress  # Lesson progress persistence
npm run test:workshop         # Innovation workshop store
npm run test:domains          # STEM domain analytical models
npm run test:kinematics       # Kinematics reference model
npm run test:e2e              # Playwright browser tests
```

---

## Design Philosophy

See [`AGENTS.md`](./AGENTS.md) for the full design contract. Key principles:

- **One Organism**: Every element (AI, hologram, gestures, 3D, widgets) must feel unified — never disconnected modules.
- **Intent Over Gesture**: Prioritize what the user is trying to achieve, not which raw gesture was detected.
- **Invisible Controls**: The interface should adapt to the user; the user should never fight it.
- **Spatial Mode**: When a 3D object loads, the hologram transfers its energy into the object — the object becomes the workspace.
- **Persistence**: Hand tracking loss never resets the workspace.
- **Performance is a feature**: LOD, lazy loading, efficient shaders. Never sacrifice responsiveness for eye candy.

---

## Author

**Stark Industries** — Affan (Ady5545)
