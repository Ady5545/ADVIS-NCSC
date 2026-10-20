sed -i '/if (lower.includes("explain this")/i \
    if (lower.includes("compare")) {\n      return { type: "COMPARE" };\n    }\n    if (lower.includes("diagnose") || lower.includes("check diagnostics") || lower.includes("diagnostic")) {\n      return { type: "DIAGNOSE" };\n    }\n' server.js
