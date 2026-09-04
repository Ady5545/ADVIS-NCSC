const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const target1 = `if (lower === "isolate" || lower === "isolate it" || lower === "isolate this" || lower === "isolate component" || lower === "isolate part" || lower.startsWith("isolate ")) {
      let compId = undefined;`;
const rep1 = `if (lower === "isolate" || lower === "isolate it" || lower === "isolate this" || lower === "isolate component" || lower === "isolate part" || lower.startsWith("isolate ")) {
      let compId = undefined;
      if ((lower === "isolate it" || lower === "isolate this" || lower === "isolate") && butlerContext && butlerContext.selectedComponentId) {
        compId = butlerContext.selectedComponentId;
      }`;
code = code.replace(target1, rep1);

const target2 = `if (lower === "pause" || lower === "pause animation" || lower === "pause engine" || lower === "stop engine" || lower === "pause kinematics") {`;
const rep2 = `if (lower === "pause" || lower === "pause animation" || lower === "pause engine" || lower === "stop engine" || lower === "pause kinematics" || lower === "pause it") {`;
code = code.replace(target2, rep2);

const target3 = `if (lower === "play" || lower === "resume" || lower === "play animation" || lower === "start engine" || lower === "resume engine" || lower === "play kinematics") {`;
const rep3 = `if (lower === "play" || lower === "resume" || lower === "play animation" || lower === "start engine" || lower === "resume engine" || lower === "play kinematics" || lower === "play it") {`;
code = code.replace(target3, rep3);

fs.writeFileSync('server.js', code);
