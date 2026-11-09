# ADVIS — Security

> Last updated: 2026-11-09 | Reflects `main` at `87a7198`

---

## Trust Boundary Summary

ADVIS has a thin server layer. The critical security boundary is the **Gemini API key** — it must never reach the browser.

```
Browser (untrusted)
    │  HTTP POST /api/advis { message, context }
    ▼
Express server.js / Vercel api/advis.js (trusted)
    │  Uses process.env.GEMINI_API_KEY (never sent to client)
    ▼
Google Gemini API
```

---

## Environment Variables & Secrets

| Variable | Location | Exposure |
|---|---|---|
| `GEMINI_API_KEY` | `.env` / Vercel env | **Server-only**. Never in client bundle. |
| `GEMINI_MODEL` | `.env` / Vercel env | Server-only. |
| `ADVIS_ALLOWED_ORIGINS` | `.env` / Vercel env | Used to set CORS policy. |

**Never commit `.env` to version control.** The `.env.example` file contains only placeholder values and is safe to commit.

---

## CORS Policy

The server enforces origin restriction via `ADVIS_ALLOWED_ORIGINS` (comma-separated list). Default:

```
ADVIS_ALLOWED_ORIGINS=https://ady5545.github.io
```

Add additional origins for local development or additional deployments.

---

## API Input Validation

- `/api/advis` and `/api/generate-structure` accept JSON bodies up to **50 MB** (Express `json({ limit: '50mb' })`). Consider reducing this limit if large payloads are not needed.
- Memory and project endpoints do basic presence checks but do not validate schema types on write — stored data is re-read back without sanitization. Future: add Zod or JSON schema validation on CRUD endpoints.

---

## Data Persistence

The server writes four flat JSON files to `.data/` (workspace root):

| File | Contents |
|---|---|
| `histories.json` | Per-session chat turn histories |
| `memories.json` | Global memories |
| `advis_memories.json` | ADVIS-specific spatial memories |
| `advis_projects.json` | ADVIS project metadata |

**These files are not encrypted at rest.** On Vercel, the filesystem is ephemeral — data is lost on redeployment unless an external store is added.

**Client-side**: Workspace sessions, lesson progress, and workshop state are written to `localStorage` with no encryption. This is appropriate for non-sensitive learning/navigation state.

---

## MediaPipe / Camera

- MediaPipe Hands runs entirely in the browser using the device camera.
- **Camera frames are never sent to the server** — landmark coordinate arrays are processed locally.
- The camera stream is obtained via `getUserMedia` with standard browser permission prompts.

---

## Content Security

- ADVIS does not execute user-supplied code or render user-supplied HTML.
- The AI response from Gemini is rendered as text; no `dangerouslySetInnerHTML` is used for Gemini output (verify before adding any such pattern).
- 3D model files are loaded from `public/models/` (static, server-controlled) — no arbitrary user-supplied URL loading.

---

## Scientific Trust & Accuracy

ADVIS enforces a scientific honesty policy validated by CI scripts (`validate:science`):

- No exact OEM hardware specifications are claimed in model metadata.
- Simulation outputs that are analytical/illustrative are labelled as such (`relative teaching indicator`, `illustrative`).
- Anatomy waveforms are labelled as not clinical-grade.
- The CI lint contract (`npm run lint`) must pass before any code merges.

---

## Dependency Security

Dependencies are pinned to `^` semver ranges. For a production hardened deployment:

1. Run `npm audit` and resolve high/critical findings.
2. Pin exact versions (`npm shrinkwrap` or lock file) for production images.
3. The OCCT WASM package (`occt-wasm`) ships a pre-built binary — verify provenance from the npm registry.

---

## Threat Model (Brief)

| Threat | Mitigation |
|---|---|
| API key leakage | Key stays in `process.env` server-side only; Vite strips `VITE_`-prefixed vars only |
| Prompt injection via user message | Gemini system prompt includes spatial context; user input is passed verbatim — no sanitization currently. Future: add input length cap and reject known injection patterns |
| Excessive API usage | No rate limiting currently on `/api/advis`. Future: add per-IP rate limiting middleware |
| XSS via Gemini response | AI response rendered as React text nodes — not HTML-injected |
| Camera feed exfiltration | MediaPipe runs locally; frames never leave the browser |
| Stored data tampering | `.data/` JSON files have no integrity check — an attacker with server access could modify them. Mitigation: deploy on Vercel where `.data/` is ephemeral |

---

## Known Gaps (To-Do)

- [ ] Rate limiting on `/api/advis` endpoint
- [ ] Input length caps on memory/project CRUD body fields
- [ ] Schema validation (Zod) on server CRUD endpoints
- [ ] `npm audit` clean run documented in CI
- [ ] Privacy retention/deletion policy for localStorage data
