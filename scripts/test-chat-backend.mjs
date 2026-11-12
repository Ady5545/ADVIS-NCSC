import assert from "node:assert/strict";
import advisHandler from "../api/advis.js";
import healthHandler from "../api/health.js";

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
    },
    json(body) {
      this.body = body;
      return this;
    },
    end() {
      return this;
    }
  };
}

async function post(message) {
  const req = {
    method: "POST",
    headers: {},
    socket: { remoteAddress: "127.0.0.1" },
    body: { message, mode: "normal", deviceId: "chat-backend-test" }
  };
  const res = createResponse();
  await advisHandler(req, res);
  return res;
}

async function health() {
  const req = { method: "GET", headers: {} };
  const res = createResponse();
  await healthHandler(req, res);
  return res;
}

const previousKey = process.env.GEMINI_API_KEY;
delete process.env.GEMINI_API_KEY;

try {
  const greeting = await post("Hello!");
  assert.equal(greeting.statusCode, 200);
  assert.equal(greeting.body.status, "online");
  assert.equal(greeting.body.responseSource, "hardcoded");
  assert.equal(greeting.body.aiProviderStatus, "not_configured");
  assert.match(greeting.body.reply, /Hello/i);

  const identity = await post("Who are you?");
  assert.equal(identity.statusCode, 200);
  assert.match(identity.body.reply, /A\.D\.V\.I\.S\./);

  const status = await post("Are you online?");
  assert.equal(status.statusCode, 200);
  assert.match(status.body.reply, /GEMINI_API_KEY/);
  assert.equal(status.body.reasoningAvailable, false);

  const localModelCommand = await post("Display water");
  assert.equal(localModelCommand.statusCode, 200);
  assert.equal(localModelCommand.body.status, "online");
  assert.equal(localModelCommand.body.spatialAction.type, "DISPLAY_SCIENTIFIC");

  const advancedQuestion = await post("Explain why water is bent.");
  assert.equal(advancedQuestion.statusCode, 200);
  assert.equal(advancedQuestion.body.status, "offline");
  assert.equal(advancedQuestion.body.aiProviderStatus, "not_configured");
  assert.match(advancedQuestion.body.reply, /advanced Gemini reasoning/i);

  const healthCheck = await health();
  assert.equal(healthCheck.statusCode, 200);
  assert.equal(healthCheck.body.service, "advis-api");
  assert.equal(healthCheck.body.status, "online");
  assert.equal(healthCheck.body.gemini, "not_configured");

  console.log("ADVIS chat backend tests passed (local responses, spatial routing, health, and explicit Gemini readiness).");
} finally {
  if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = previousKey;
}
