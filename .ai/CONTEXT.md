# ADVIS — AI Agent Context

> Generated: 2026-11-09 | Repo: `github.com/Ady5545/ADVIS-NCSC` | HEAD: `87a7198`

---

## What This Project Is

**ADVIS** (Ady's Virtual Intelligence System) is a Spatial AI Operating System that runs in the browser. It is NOT a chatbot or a Three.js demo — it is one unified holographic computer where AI, 3D visualization, gesture interaction, voice input, and spatial computing form a single organism.

The authoritative design contract is in [`AGENTS.md`](../AGENTS.md). **Read it before making any changes.** Every feature decision must respect those principles.

---

## Tech Stack (Current)

| Layer | Technology |
|---|---|
| Frontend framework | React 19 + TypeScript 7 |
| 3D rendering | Three.js 0.185 / React Three Fiber 9 |
| Gesture tracking | MediaPipe Hands (browser) |
| AI relay | Google Gemini (`gemini-3.8-flash`) via Express / Vercel |
| Animation | Framer Motion 12 / Theatre.js |
| CAD kernel | OCCT WASM 4.3 |
| CSS | Tailwind CSS v4 |
| Build | Vite 6 |
| Server | Express 5 (dev) / Vercel serverless (prod) |
| Testing | Playwright (E2E) + 12 Node.js validation scripts |
| CI/CD | GitHub Actions → GitHub Pages |
| Deployment | `https://ady5545.github.io/ADVIS-NCSC/` |

---

## Key Files for Agent Orientation

| File | Why Important |
|---|---|
| `src/App.tsx` | Root — all UI state lives here |
| `src/SpatialObjectEngine.tsx` | 3D scene router — routes to model controllers |
| `src/GestureContext.tsx` + `useGestureEngine.ts` | Gesture pipeline |
| `src/workspace/WorkspaceSessionStore.ts` | Session snapshot schema (40+ fields) |
| `src/learning/LessonSchema.ts` | Authored lesson data contract |
| `src/scientific/SimulationEngine.ts` | Physics simulation (bounded, deterministic) |
| `src/models/ModelCapabilityMatrix.ts` | Capability flags per model |
| `src/SpatialLibrary.ts` | Model catalog |
| `server.js` | API routes + Gemini relay |
| `ButlerEngine.js` | Multi-turn AI conversation engine |
| `AGENTS.md` | **Design philosophy — mandatory reading** |

---

## Active API Routes

```
GET  /api/health
GET  /api/memory[?projectId=]
POST /api/memory
PUT  /api/memory/:id
DEL  /api/memory/:id
GET  /api/memory/search
GET  /api/projects
POST /api/projects
PUT  /api/projects/:id
DEL  /api/projects/:id
GET  /api/history
POST /api/generate-structure
POST /api/advis           ← main Gemini AI relay
```

---

## Environment Variables

```
GEMINI_API_KEY=            # required, server-side only
GEMINI_MODEL=gemini-3.8-flash
GEMINI_MULTIMODAL_MODEL=gemini-3.8-flash
ADVIS_ALLOWED_ORIGINS=https://ady5545.github.io
```

---

## Running the Project

```bash
npm install
cp .env.example .env     # fill in GEMINI_API_KEY
npm run dev              # → localhost:3000
npm run lint             # run all 12 validation contracts
npm run test:e2e         # Playwright E2E
```

---

## Persistence Map

| Data | Storage |
|---|---|
| Chat histories, memories, projects | `.data/*.json` (server filesystem — ephemeral on Vercel) |
| Workspace sessions | `localStorage` (client) |
| Lesson progress | `localStorage` (client) |
| Workshop state | `localStorage` (client) |

---

## Scientific Trust Rules (CI-enforced)

- No exact OEM specs in model metadata
- Simulation outputs labelled as "relative teaching indicators" or "illustrative" where applicable
- `npm run validate:science` must pass
- Anatomy waveforms are illustrative — not clinical simulations

---

## Implementation Status

See [`docs/IMPLEMENTATION_STATUS.md`](../docs/IMPLEMENTATION_STATUS.md) and [`docs/ADVIS-NCSC-IMPLEMENTATION-STATUS.md`](../docs/ADVIS-NCSC-IMPLEMENTATION-STATUS.md) for current completion state of each work package.

**Current frontier work** (post-PR-58):
- Spatial command HUD fully integrated
- Workspace session persistence shipped
- Scientific trust labels complete
- E2E browser verification for live deployment still outstanding (Vercel auth was blocked)
