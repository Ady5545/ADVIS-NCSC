# ADVIS Gemini Educational Chat — Deployment Setup

ADVIS now has a server-side Gemini endpoint in \`api/advis.js\`. The browser calls this endpoint for educational questions and sends a limited recent conversation plus active workspace/model information. The Gemini key stays on the server.

## 1. Deploy the backend

1. Import or open this repository in Vercel and deploy the feature branch, or merge it into \`main\` first.
2. In the Vercel project's **Settings → Environment Variables**, add \`GEMINI_API_KEY\` for the environments you intend to use.
3. Redeploy after saving the variable. Do not put this key in a \`VITE_...\` variable, source file, or public GitHub Actions variable.
4. Check the deployment function logs if the endpoint returns a service error.

The serverless API is \`/api/advis\`. \`/api/history\` remains available for compatibility; the current chat transcript is stored locally in the browser.

## 2. Choose how the website is hosted

### If visitors use the Vercel deployment

No API-base setting is required. The frontend calls \`/api/advis\` on the same origin, and the Vite config automatically uses root asset paths on Vercel.

### If visitors use GitHub Pages

GitHub Pages only hosts the static frontend; it cannot run the Node/Gemini backend itself. Point the static frontend at your Vercel deployment:

1. Open the GitHub repository **Settings → Secrets and variables → Actions → Variables**.
2. Create a repository variable named \`VITE_ADVIS_API_BASE_URL\`. Set its value to the origin of your real Vercel deployment, for example \`https://YOUR-PROJECT.vercel.app\`. Do not include \`/api\` or a trailing path.
3. Rerun the workflow or push a new commit to rebuild the frontend with that setting.

The backend allows the official \`https://ady5545.github.io\` origin by default. If your frontend has a custom domain, configure \`ADVIS_ALLOWED_ORIGINS\` in Vercel as a comma-separated list of trusted origins. CORS is not authentication; configure appropriate project and usage limits in your Google/Vercel accounts.

## 3. Optional server-side configuration

- \`GEMINI_MODEL\`: defaults to \`gemini-3.8-flash\`.
- \`GEMINI_MULTIMODAL_MODEL\`: defaults to \`gemini-3.8-flash\` for image and grounded-search turns too.
- \`ADVIS_ALLOWED_ORIGINS\`: extra trusted browser origins, comma-separated.

The API uses a low generation temperature, bounded message/history/image sizes, a best-effort per-instance request limit, and prompts the model to distinguish established science from unverified details about a particular CAD/3D asset. These reduce avoidable guessing but cannot guarantee that every generated answer is correct. Verify important claims against textbooks, datasheets, or authoritative references.

## 4. Conversation context and storage

The browser retains up to 40 recent text messages in local storage and sends up to 10 recent messages with each question. Images are not persisted in chat history. This works across refreshes on the same browser/device, but it is not a cross-device account or durable database. Cross-device synchronization would need a real database and user identity/authentication.

## 5. Smoke tests

After deploying and setting \`GEMINI_API_KEY\`, test these in the ADVIS chat:

1. \`Why is water bent rather than linear?\`
2. Follow up with \`What about its bond angle, and why?\` — the answer should understand that “its” refers to water.
3. Open an available model, then ask \`What does the crankshaft do in this model?\` — it should use the current model context and avoid making up material grades or exact dimensions.
4. Ask for a model-specific tolerance or manufacturer part number not present in the UI — it should say the detail is not verified rather than invent one.
5. Ask a time-sensitive question — check whether the result is grounded and current before relying on it.
