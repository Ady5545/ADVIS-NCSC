# Hunter 1 Audit Report: Backend Services, API Routes, Butler Core & Security

**Scope:** `server.js`, `ButlerEngine.js`, `api/advis.js`, `api/history.js`, `docs/SECURITY.md`, `vercel.json`

---

#### BUG-ID: D1-01
- **Severity**: Critical
- **Location**: `ButlerEngine.js:857-860, 876`
- **Evidence & Root Cause**:
  ```javascript
  857: let aiModel = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  ...
  876: const fallbackModel = aiModel === "gemini-3.8-flash" ? "gemini-3.5-flash-lite" : "gemini-3.8-flash";
  ```
  `gemini-3.8-flash` and `gemini-3.5-flash-lite` are non-existent, hallucinated model names not offered by Google's Gemini API. When `GEMINI_MODEL` is omitted from `.env`, both primary and fallback calls fail with HTTP 404 Model Not Found.
- **Impact**: 100% failure rate for all conversational AI turns out of the box when `GEMINI_MODEL` is not explicitly set in the environment.
- **Minimal Fix**:
  ```javascript
  let aiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const fallbackModel = aiModel === "gemini-2.5-flash" ? "gemini-2.0-flash" : "gemini-2.5-flash";
  ```

---

#### BUG-ID: D1-02
- **Severity**: Critical
- **Location**: `ButlerEngine.js:754-770`, `api/advis.js:59-73`
- **Evidence & Root Cause**:
  `ButlerEngine.js:754-757` maps `chatHistories[deviceId]` directly into `contents` (`role: msg.role === 'assistant' ? 'model' : 'user'`), followed by pushing the latest user message (`role: 'user'`). In `src/App.tsx:932, 1208`, the UI initializes chat with an assistant welcome message. When `cleanRecentConversation` slices the history, `contents[0]` has `role: 'model'`. The Gemini API strictly rejects conversations starting with a `model` turn (`400 Invalid Argument: First content must be from user`). Furthermore, if history ends with `user`, pushing another `user` creates consecutive turns with the same role, also rejected by the API.
- **Impact**: Gemini API throws HTTP 400 Bad Request on the very first turn when the UI supplies the initial assistant message or whenever turns do not strictly alternate.
- **Minimal Fix**:
  In `cleanRecentConversation` / `ButlerEngine.js`, drop leading `model`/`assistant` turns and trim trailing `user` turns:
  ```javascript
  while (history.length > 0 && history[0].role !== 'user') history.shift();
  if (history.length > 0 && history[history.length - 1].role === 'user') history.pop();
  ```

---

#### BUG-ID: D1-03
- **Severity**: Critical
- **Location**: `server.js:151`, `server.js:114`
- **Evidence & Root Cause**:
  `server.js:151`: `let results = advisMemories.filter(m => m.content.toLowerCase().includes(q) || m.tags.some(t => t.toLowerCase().includes(q)));`
  `POST /api/memory` (line 114) does not validate `content` or `tags` (allowing `undefined`, `null`, numbers, or non-arrays). If any memory has `content: undefined`, `m.content.toLowerCase()` throws `TypeError: Cannot read properties of undefined (reading 'toLowerCase')`. If `tags` contains a non-string, `t.toLowerCase()` throws `TypeError`.
- **Impact**: Permanent crash / HTTP 500 Denial of Service on `/api/memory/search` until `.data/advis_memories.json` is manually purged.
- **Minimal Fix**:
  ```javascript
  const c = typeof m.content === 'string' ? m.content.toLowerCase() : '';
  const matchTags = Array.isArray(m.tags) && m.tags.some(t => typeof t === 'string' && t.toLowerCase().includes(q));
  let results = advisMemories.filter(m => c.includes(q) || matchTags);
  ```

---

#### BUG-ID: D1-04
- **Severity**: Critical
- **Location**: `server.js:357`, `server.js:161`
- **Evidence & Root Cause**:
  `server.js:357`: `const proj = advisProjects.find(p => p.name.toLowerCase().includes(targetName));`
  `POST /api/projects` (line 161) does not require or validate `name`. If a project exists with `name: undefined` or `null`, asking the assistant "switch to the X project" triggers `p.name.toLowerCase()`, throwing an unhandled `TypeError: Cannot read properties of undefined (reading 'toLowerCase')`.
- **Impact**: Server-side crash / HTTP 500 error during project switching in chat.
- **Minimal Fix**:
  ```javascript
  const proj = advisProjects.find(p => typeof p.name === 'string' && p.name.toLowerCase().includes(targetName));
  ```

---

#### BUG-ID: D1-05
- **Severity**: Critical
- **Location**: `server.js:851-853`, `ButlerEngine.js:752-754`, `server.js:192-195`
- **Evidence & Root Cause**:
  `server.js:851`: `if (!chatHistories[deviceId]) { chatHistories[deviceId] = []; }`
  `chatHistories` is a plain `{}` object. If `deviceId` equals an `Object.prototype` property (e.g. `"toString"`, `"valueOf"`, `"__proto__"`), `chatHistories[deviceId]` evaluates to the inherited function (truthy). It is never initialized to `[]`, and `chatHistories[deviceId].push(...)` or `.map(...)` throws `TypeError: chatHistories[deviceId].push is not a function`.
- **Impact**: Server crash / 500 error for any request supplying `deviceId: "toString"` or prototype properties; prototype pollution risk.
- **Minimal Fix**:
  ```javascript
  const safeDeviceId = typeof deviceId === 'string' && !['__proto__', 'constructor', 'prototype'].includes(deviceId) ? deviceId.slice(0, 100) : 'default';
  ```

---

#### BUG-ID: D1-06
- **Severity**: Medium
- **Location**: `server.js:1-926`, `docs/SECURITY.md:37-43`
- **Evidence & Root Cause**:
  `docs/SECURITY.md:37` claims: *"The server enforces origin restriction via ADVIS_ALLOWED_ORIGINS"*. In reality, `server.js` contains ZERO CORS middleware or headers. Only `api/advis.js` and `api/history.js` implement `applyCors()`.
- **Impact**: Cross-origin requests from the GitHub Pages deployment or Vite dev server to `server.js` fail due to missing `Access-Control-Allow-Origin` and preflight rejection; security doc assertion is untrue.
- **Minimal Fix**:
  Add CORS middleware at top of `server.js`:
  ```javascript
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowed = new Set(["https://ady5545.github.io", "http://localhost:3000", "http://localhost:5173", ...(process.env.ADVIS_ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean)]);
    if (origin && allowed.has(origin)) { res.setHeader("Access-Control-Allow-Origin", origin); res.setHeader("Vary", "Origin"); }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(204).end();
    next();
  });
  ```

---

#### BUG-ID: D1-07
- **Severity**: Medium
- **Location**: `server.js:855-865`, `api/advis.js:143-201, 480`
- **Evidence & Root Cause**:
  `api/advis.js` sanitizes incoming context using `cleanContext(rawContext)`. In contrast, `server.js:855-865` passes raw `clientButlerContext` directly to `processButlerTurn`.
- **Impact**: Unsanitized user content in `butlerContext` is interpolated verbatim into Gemini's system instruction, opening a direct prompt injection vector on `server.js`.
- **Minimal Fix**:
  ```javascript
  const { cleanContext } = require("./api/advis");
  const butlerContext = cleanContext(clientButlerContext || { activeProjectId, activeWorkspace: currentSpatialObject ? 'SPATIAL' : 'HUD', activeSpatialObject: currentSpatialObject, selectedComponentId, hoveredComponentId });
  ```

---

#### BUG-ID: D1-08
- **Severity**: Medium
- **Location**: `server.js:849`, `api/advis.js:458-464`
- **Evidence & Root Cause**:
  `server.js:849`: `if (!message) return res.status(400).json({ error: "Protocol violation: Message payload is empty." });`
  When a user attaches an image without a message, `api/advis.js:462` synthesizes an observation prompt. `server.js` unconditionally rejects the request with HTTP 400.
- **Impact**: Inconsistency between environments; image-only queries work on Vercel but break on `server.js`.
- **Minimal Fix**:
  ```javascript
  if (!message && !image) return res.status(400).json({ error: "Please enter a question or attach an image." });
  if (!message && image) message = "Describe what can be directly observed in this image.";
  ```

---

#### BUG-ID: D1-09
- **Severity**: Medium
- **Location**: `api/advis.js:9-10, 36-51`
- **Evidence & Root Cause**:
  `const requestWindows = new Map();`
  Entries in `requestWindows` are never evicted or deleted. Expired windows are only overwritten if the exact same IP requests again.
- **Impact**: Unbounded Map growth causing memory leak / OOM under high-cardinality IP traffic.
- **Minimal Fix**:
  Prune expired entries and bound the Map size when size exceeds 1,000.

---

#### BUG-ID: D1-10
- **Severity**: Medium
- **Location**: `server.js:12, 918`
- **Evidence & Root Cause**:
  `const PORT = 3000;`
  `app.listen(PORT, "0.0.0.0", () => { ... });`
  `server.js` ignores `process.env.PORT`.
- **Impact**: Server fails to bind in container environments (Cloud Run, Railway, Render) that dynamically allocate PORT.
- **Minimal Fix**:
  `const PORT = parseInt(process.env.PORT, 10) || 3000;`

---

#### BUG-ID: D1-11
- **Severity**: Medium
- **Location**: `server.js:19`, `docs/SECURITY.md:49`
- **Evidence & Root Cause**:
  `server.js:19`: `app.use(express.json({ limit: '50mb' }));`
  Accepting unauthenticated 50MB JSON bodies without rate limiting enables CPU starvation during JSON parsing and heap memory exhaustion.
- **Impact**: Event loop starvation and DoS on the Node process.
- **Minimal Fix**:
  `app.use(express.json({ limit: '10mb' }));`

---

#### BUG-ID: D1-12
- **Severity**: Low
- **Location**: `server.js:828`
- **Evidence & Root Cause**:
  `const result = JSON.parse(response.text);` in `/api/generate-structure`.
  If Gemini wraps valid JSON inside markdown code fences (` ```json `), `JSON.parse` throws `SyntaxError`.
- **Impact**: Structure generation fails with HTTP 500 despite valid structural JSON.
- **Minimal Fix**:
  `const cleaned = response.text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();`

---

#### BUG-ID: D1-13
- **Severity**: Low
- **Location**: `server.js:892`, `api/advis.js:519`
- **Evidence & Root Cause**:
  When `processButlerTurn` errors, `server.js` returns HTTP 200 with `{ status: "error" }`, whereas `api/advis.js` returns HTTP 502 Bad Gateway.
- **Impact**: Semantic HTTP status code inconsistency across deployment targets.
- **Minimal Fix**:
  Return HTTP 502 Bad Gateway on error.

---

#### BUG-ID: D1-14
- **Severity**: Low
- **Location**: `vercel.json:1-7`
- **Evidence & Root Cause**:
  `vercel.json` defines only build/framework settings. `/api/generate-structure` and `/api/jarvis` are not mapped to functions or rewrites.
- **Impact**: Calls to `/api/generate-structure` or `/api/jarvis` return 404 on Vercel.
- **Minimal Fix**: Add rewrites in `vercel.json`.

---

### Clean File Verification: `api/history.js`
- **Location**: `api/history.js:1-37`
- **Inspection Assessment**:
  `api/history.js` strictly enforces HTTP method boundaries (`GET` and `OPTIONS`, returning 405 with `Allow` header otherwise in lines 32-35), applies origin-restricted CORS with `Vary: Origin` and `Cache-Control: no-store` (lines 7-27), performs no unvalidated property access or file system operations, and safely returns a deterministic JSON empty array (`[]`) matching its documented compatibility role for stateless serverless deployments. No critical or medium defects found.
