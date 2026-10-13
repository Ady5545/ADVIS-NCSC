"use strict";

// This endpoint is a compatibility fallback for the current frontend. In serverless
// deployments the browser persists its own chat transcript; ephemeral function memory
// must not be presented as durable cross-device history.

function applyCors(req, res) {
  const origin = req.headers.origin;
  const configuredOrigins = (process.env.ADVIS_ALLOWED_ORIGINS || "")
    .split(",")
    .map(function (value) { return value.trim(); })
    .filter(Boolean);
  const allowedOrigins = new Set([
    "https://ady5545.github.io",
    "http://localhost:3000",
    "http://localhost:5173",
    ...configuredOrigins
  ]);

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
}

module.exports = function historyHandler(req, res) {
  applyCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  }
  return res.status(200).json([]);
};
