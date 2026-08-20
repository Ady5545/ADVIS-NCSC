const fs = require('fs');
let server = fs.readFileSync('server.js', 'utf8');

const regexOld = /if \\(message\\.toLowerCase\\(\\)\\.match\\(\\/\\(teach\\|show\\|explain\\|visualize\\|make\\|draw\\)\\.\\*\\(bf3\\|h2o\\|water\\|co2\\|nacl\\|ch4\\|methane\\|ammonia\\|nh3\\|lewis\\|hybridization\\|bonding\\|structure\\)\\/i\\) && !message\\.toLowerCase\\(\\)\\.match\\(\\/\\(what is\\|who discovered\\)\\/i\\)\\) {/g;

server = server.replace(regexOld, `if (message.toLowerCase().match(/(teach|show|explain|visualize|make|draw).*(bf3|h2o|water|co2|nacl|ch4|methane|ammonia|nh3|lewis|hybridization|bonding|structure|molecule|h2so4|[A-Z][a-z]?\\d*)/i) && !message.toLowerCase().match(/(what is|who discovered|tell me about)/i)) {`);

fs.writeFileSync('server.js', server, 'utf8');
console.log("Patched server.js regex");
