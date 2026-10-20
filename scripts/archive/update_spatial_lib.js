const fs = require('fs');

let content = fs.readFileSync('src/SpatialLibrary.ts', 'utf8');

// Replace V12 specifications with provenance tags
content = content.replace(/'Material': 'A356-T6 Cast Aluminum'/g, "'Material': 'A356-T6 Cast Aluminum [LIT]'");
content = content.replace(/'weight': '62.4 kg'/g, "'Weight': '62.4 kg [DATA]'");
content = content.replace(/'tolerances': '±0.01 mm'/g, "'Tolerances': '±0.01 mm [LIT]'");
content = content.replace(/'stressThreshold': '240 MPa'/g, "'Yield Strength': '240 MPa [LIT]'");

content = content.replace(/'Material': 'Forged 4032 Aluminum Alloy'/g, "'Material': 'Forged 4032 Aluminum Alloy [DATA]'");
content = content.replace(/'weight': '340g each'/g, "'Weight': '340g each [DATA]'");
content = content.replace(/'Compression Ratio': '11.8:1'/g, "'Compression Ratio': '11.8:1 [DATA]'");

content = content.replace(/'Material': 'Ti-6Al-4V Titanium'/g, "'Material': 'Ti-6Al-4V Titanium [LIT]'");
content = content.replace(/'weight': '450g each'/g, "'Weight': '450g each [LIT]'");
content = content.replace(/'tensileStrength': '950 MPa'/g, "'Tensile Strength': '950 MPa [DATA]'");

content = content.replace(/'Material': '4340 Chromoly Steel'/g, "'Material': '4340 Chromoly Steel [LIT]'");
content = content.replace(/'weight': '28.5 kg'/g, "'Weight': '28.5 kg [LIT]'");

content = content.replace(/'Material': 'Billet Steel Camshafts & Titanium Valves'/g, "'Material': 'Billet Steel / Titanium [LIT]'");

content = content.replace(/'Material': 'Magnesium-Aluminum Alloy'/g, "'Material': 'Magnesium-Aluminum Alloy [LIT]'");
content = content.replace(/'airflow': '1,200 CFM @ 25 inH2O'/g, "'Max Airflow': '1,200 CFM @ 25 inH2O [DATA]'");

content = content.replace(/'Material': '321 Stainless Steel'/g, "'Material': '321 Stainless Steel [LIT]'");
content = content.replace(/'maxTemp': '950°C'/g, "'EGT Limit': '950°C [DATA]'");

fs.writeFileSync('src/SpatialLibrary.ts', content);
