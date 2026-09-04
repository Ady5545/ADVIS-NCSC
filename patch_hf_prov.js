const fs = require('fs');
let code = fs.readFileSync('src/AutonomousModelEngine/HighFidelityGenerators.ts', 'utf8');

code = code.replace(/'Material': 'Carbon Fiber T800'/g, "'Material': 'Carbon Fiber T800 [LIT]'");
code = code.replace(/'Geometry': 'Endurance Road'/g, "'Geometry': 'Endurance Road [USER]'");

code = code.replace(/'Material': 'Carbon Fiber'/g, "'Material': 'Carbon Fiber [LIT]'");
code = code.replace(/'Rake': '45mm'/g, "'Rake': '45mm [DATA]'");

code = code.replace(/'Spokes': '24H Bladed'/g, "'Spokes': '24H Bladed [LIT]'");
code = code.replace(/'Spokes': '28H Bladed'/g, "'Spokes': '28H Bladed [LIT]'");

code = code.replace(/'Gearing': '52\/36T x 11-28T'/g, "'Gearing': '52/36T x 11-28T [LIT]'");
code = code.replace(/'Groupset': 'Mechanical 11-speed'/g, "'Groupset': 'Mechanical 11-speed [DATA]'");

code = code.replace(/'Saddle': 'Ergo Cutout'/g, "'Saddle': 'Ergo Cutout [LIT]'");
code = code.replace(/'Seatpost': '27.2mm Carbon'/g, "'Seatpost': '27.2mm Carbon [LIT]'");

code = code.replace(/'Handlebar Width': '420mm'/g, "'Handlebar Width': '420mm [LIT]'");
code = code.replace(/'Stem Length': '100mm'/g, "'Stem Length': '100mm [LIT]'");

code = code.replace(/'Material': 'Full-Grain Calfskin'/g, "'Material': 'Full-Grain Calfskin [LIT]'");
code = code.replace(/'Style': 'Cap-toe Oxford'/g, "'Style': 'Cap-toe Oxford [LIT]'");

code = code.replace(/'Construction': 'Goodyear Welt'/g, "'Construction': 'Goodyear Welt [LIT]'");
code = code.replace(/'Material': 'Oak-Bark Leather'/g, "'Material': 'Oak-Bark Leather [LIT]'");

code = code.replace(/'Height': '25mm'/g, "'Height': '25mm [DATA]'");
code = code.replace(/'Toplift': 'Leather \/ Rubber combo'/g, "'Toplift': 'Leather / Rubber combo [LIT]'");

fs.writeFileSync('src/AutonomousModelEngine/HighFidelityGenerators.ts', code);
