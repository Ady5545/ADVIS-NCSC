# Hunter 2 Audit Report: Persistence, Local Storage, JSON Serialization & Data Integrity

**Scope**:
- Backend persistence in `server.js` (`.data/histories.json`, `.data/advis_memories.json`, `.data/advis_projects.json`)
- Client storage in `src/learning/LessonProgress.ts`, `src/workspace/WorkspaceSessionStore.ts`, `src/workshop/WorkshopStore.ts`, `src/cad/StudyProject.ts`
- Model catalog & metadata integrity: `scripts/validate-model-catalog.mjs`, `src/SpatialLibrary.ts`, `src/models/ModelCapabilityMatrix.ts`

---

#### BUG-ID: D2-01
- **Severity**: Critical
- **Location**: `server.js:42-67`
- **Evidence & Root Cause**:
  Lines 42-55 wrap loading of `HISTORY_FILE`, `MEMORIES_FILE`, `ADVIS_MEMORIES_FILE`, and `ADVIS_PROJECTS_FILE` in a single `try/catch`. If `histories.json` contains corrupted/truncated JSON (common during sudden process termination because `fs.writeFileSync` truncates destination files directly), the parser throws `SyntaxError`. The catch block aborts the remaining loads, leaving `advisMemories = []` and `advisProjects = []`. As soon as any subsequent request invokes `saveData()` (lines 59-68), `fs.writeFileSync` immediately overwrites `advis_memories.json` and `advis_projects.json` with empty arrays `[]`, permanently destroying all stored user projects and memories on disk.
- **Impact**: Permanent, catastrophic data loss of all user memories and projects upon any syntax error in chat history or server restart crash.
- **Minimal Fix**: Wrap each file load in its own independent `try/catch` and use atomic write-rename (`fs.writeFileSync(tmpPath, ...); fs.renameSync(tmpPath, targetPath);`).

---

#### BUG-ID: D2-02
- **Severity**: Critical
- **Location**: `server.js:148-154`
- **Evidence & Root Cause**:
  In GET `/api/memory/search`:
  `let results = advisMemories.filter(m => m.content.toLowerCase().includes(q) || m.tags.some(t => t.toLowerCase().includes(q)));`
  POST `/api/memory` (lines 114-128) accepts raw payloads without asserting that `content` is a string or `tags` is an array. If `content` is null/undefined, `m.content.toLowerCase()` throws an unhandled `TypeError: Cannot read properties of undefined (reading 'toLowerCase')`. If `tags` is not an array, `m.tags.some` throws `TypeError: m.tags.some is not a function`.
- **Impact**: Server HTTP 500 error / unhandled crash whenever searching memories with missing content or non-array tags.
- **Minimal Fix**:
  ```javascript
  let results = advisMemories.filter(m => String(m.content || '').toLowerCase().includes(q) || (Array.isArray(m.tags) && m.tags.some(t => String(t || '').toLowerCase().includes(q))));
  ```

---

#### BUG-ID: D2-03
- **Severity**: Critical
- **Location**: `server.js:160-175, 356-358`
- **Evidence & Root Cause**:
  POST `/api/projects` (lines 161-172) does not validate that `name` is a non-empty string (`const { name, ... } = req.body; newProject = { name, ... }`). If a project is created without a name, `newProject.name` is stored as `undefined`. Later, during Butler conversational intent routing (line 357):
  `const proj = advisProjects.find(p => p.name.toLowerCase().includes(targetName));`
  `p.name.toLowerCase()` throws an unhandled `TypeError: Cannot read properties of undefined (reading 'toLowerCase')`, crashing the Butler turn.
- **Impact**: Crashes conversational AI turns whenever project name matching runs.
- **Minimal Fix**:
  In POST `/api/projects`, reject empty names (`if (!name || typeof name !== 'string') return res.status(400).json({ error: "Valid project name required" });`), and guard line 357 with `(p.name || '').toLowerCase()`.

---

#### BUG-ID: D2-04
- **Severity**: Critical
- **Location**: `src/workshop/WorkshopStore.ts:167-191`
- **Evidence & Root Cause**:
  `readStore(catalog)` (line 174) filters projects using `validateWorkshopProject(item, catalog)`. If a user previously saved projects for other models, or if a model was modified in a catalog update, any project failing validation against the current `catalog` slice is filtered out. In `saveWorkshopProject` (lines 184-186):
  `const projects = readStore(catalog).filter((candidate) => candidate.id !== project.id);`
  `window.localStorage.setItem(WORKSHOP_STORAGE_KEY, JSON.stringify(projects.slice(0, MAX_WORKSHOP_PROJECTS)));`
  All projects filtered out by `readStore` are omitted when saving back to localStorage, permanently and silently deleting them from the user's browser.
- **Impact**: Irreversible, silent deletion of user workshop projects across models or after minor schema/component catalog edits.
- **Minimal Fix**: Read raw projects from localStorage without dropping unvalidated items during save; only filter when querying projects for the active model/UI.

---

#### BUG-ID: D2-05
- **Severity**: Medium
- **Location**: `server.js:133-140, 177-184`
- **Evidence & Root Cause**:
  In `PUT /api/memory/:id` and `PUT /api/projects/:id`:
  `const updated = { ...advisMemories[memIdx], ...req.body, updatedAt: Date.now() };`
  `const updated = { ...advisProjects[pIdx], ...req.body, updatedAt: Date.now() };`
  The routes perform blind shallow merges with `req.body`. A client can overwrite immutable fields (`id: "corrupted"`), clobber `createdAt`, or inject invalid data types (`tags: null`, `associatedMemories: "invalid"`), breaking future queries and referential integrity.
- **Impact**: State pollution, foreign key breakage, and unvalidated property injection.
- **Minimal Fix**: Whitelist mutable properties and enforce `id: req.params.id` and immutable `createdAt`.

---

#### BUG-ID: D2-06
- **Severity**: Medium
- **Location**: `server.js:116, 163`
- **Evidence & Root Cause**:
  IDs are generated with `Date.now() + "_" + Math.floor(Math.random()*1000)`. Line 102 already defines `const uuidv4 = () => crypto.randomUUID();`, but it is bypassed. With only 1,000 random buckets, automated or batch requests within the same millisecond have a >50% probability of ID collision after ~37 entries.
- **Impact**: ID collisions causing existing memories or projects to be silently overwritten or duplicated.
- **Minimal Fix**:
  ```javascript
  id: "mem_" + uuidv4(),
  id: "proj_" + uuidv4(),
  ```

---

#### BUG-ID: D2-07
- **Severity**: Medium
- **Location**: `src/workshop/WorkshopStore.ts:102-120`
- **Evidence & Root Cause**:
  In `applyWorkshopTransform`, line 102 executes `let commands = project.commands.slice(0, project.cursor);`. This creates a shallow copy of the array where individual command objects (`before`, `after`) remain shared references. Furthermore, `annotations` is copied via object spread (`...project`). Direct mutations to annotations or command properties in active states alias into past undo/redo history.
- **Impact**: Corrupted undo/redo command stack and unintended history mutation across revisions.
- **Minimal Fix**: Deep clone command objects during slice and clone annotations.

---

#### BUG-ID: D2-08
- **Severity**: Low
- **Location**: `src/learning/LessonProgress.ts:27-46`
- **Evidence & Root Cause**:
  In `loadLessonProgress` (line 30), `!item.answersByQuestionId` only checks truthiness; non-object types (e.g. corrupted string or array) pass validation and cause runtime index errors in `LessonRunner.tsx:67`. In `saveLessonProgress` (line 41), `[...new Set(progress.completedStepIds)]` throws `TypeError: progress.completedStepIds is not iterable` if `completedStepIds` is `null`.
- **Impact**: Runtime exception when loading/saving lesson progress under corrupted localStorage.
- **Minimal Fix**:
  Validate `typeof item.answersByQuestionId === 'object' && !Array.isArray(item.answersByQuestionId)` and guard `completedStepIds: [...new Set(Array.isArray(progress.completedStepIds) ? progress.completedStepIds : [])]`.

---

#### BUG-ID: D2-09
- **Severity**: Low
- **Location**: `src/SpatialLibrary.ts:985` vs `src/SpatialLibrary.ts:1006-1040`
- **Evidence & Root Cause**:
  `SPATIAL_LIBRARY['v12_engine']` defines `explodedParts: ['v12.piston_left_bank', 'v12.piston_right_bank', 'v12.crankshaft', 'v12.cylinder_head', 'v12.intake_plenum', 'v12.exhaust_manifold']`.
  However, `v12_engine.components` contains `id: 'v12.valvetrain'`, not `v12.cylinder_head`.
- **Impact**: Audit script warning (`WARN: [V12 Combustion Engine] explodedParts references missing component id v12.cylinder_head`) and metadata inconsistency.
- **Minimal Fix**: Change `'v12.cylinder_head'` to `'v12.valvetrain'` in `src/SpatialLibrary.ts:985`.

---

#### BUG-ID: D2-10
- **Severity**: Low
- **Location**: `src/SpatialLibrary.ts:150, 951, 1087` & `scripts/validate-model-catalog.mjs:109`
- **Evidence & Root Cause**:
  Only 3 models out of 53 in `SPATIAL_LIBRARY` declare `modelKind`. The remaining 50 omit it, producing 50 warnings in `scripts/validate-model-catalog.mjs`.
- **Impact**: Schema drift and 50 persistent catalog validation warnings.
- **Minimal Fix**: Populate `modelKind` across all 50 catalog entries in `src/SpatialLibrary.ts`.
