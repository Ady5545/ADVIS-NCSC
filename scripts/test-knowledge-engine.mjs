import assert from "node:assert/strict";
import {
  getLocalKnowledgeReply,
  isKnowledgeQuestion,
  shouldSearchWeb,
  parseBingRss,
  formatWebSearchReply
} from "../KnowledgeEngine.js";

const water = getLocalKnowledgeReply("Explain why water is bent.");
assert.ok(water);
assert.equal(water.title, "Water (H2O)");
assert.match(water.reply, /104\.5°/);

const redox = getLocalKnowledgeReply("What is oxidation and reduction?");
assert.ok(redox);
assert.match(redox.reply, /loss of electrons/);

const motor = getLocalKnowledgeReply("Explain how an electric motor works.");
assert.ok(motor);
assert.equal(motor.category, "engineering");

assert.equal(getLocalKnowledgeReply("Display water"), null);
assert.equal(isKnowledgeQuestion("Explain Newton's second law"), true);
assert.equal(isKnowledgeQuestion("What do you think of my project?"), false);
assert.equal(shouldSearchWeb("Search online for the latest space news"), true);
assert.equal(shouldSearchWeb("Explain Newton's laws"), false);

const sampleRss = `<?xml version="1.0"?><rss><channel><item><title>Example result</title><link>https://example.org/story?a=1&amp;b=2</link><description><![CDATA[A useful search snippet.]]></description><source>Example News</source></item></channel></rss>`;
const parsed = parseBingRss(sampleRss);
assert.equal(parsed.length, 1);
assert.equal(parsed[0].title, "Example result");
assert.equal(parsed[0].url, "https://example.org/story?a=1&b=2");
assert.equal(parsed[0].snippet, "A useful search snippet.");

const formatted = formatWebSearchReply("example search", { provider: "Bing RSS", results: parsed });
assert.match(formatted, /Search provider: Bing RSS/);
assert.match(formatted, /https:\/\/example\.org\/story/);

console.log("ADVIS knowledge-engine tests passed (local STEM coverage, intent routing, and web-result parsing).");
