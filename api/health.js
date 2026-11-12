"use strict";

function applyCors(req, res) {
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
  const origin = req.headers && req.headers.origin;

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
}

module.exports = function advisHealthHandler(req, res) {
  applyCors(req, res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return res.status(405).json({ service: "advis-api", status: "error" });
  }

  const geminiConfigured = Boolean(
    process.env.GEMINI_API_KEY && String(process.env.GEMINI_API_KEY).trim()
  );

  return res.status(200).json({
    service: "advis-api",
    status: "online",
    gemini: geminiConfigured ? "configured" : "not_configured",
    localKnowledge: "enabled",
    webSearch: "keyless_bing_rss_with_wikipedia_fallback",
    model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
    multimodalModel: process.env.GEMINI_MULTIMODAL_MODEL || "gemini-3.8-flash"
  });
};
