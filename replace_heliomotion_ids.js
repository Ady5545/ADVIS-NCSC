const fs = require('fs');
let code = fs.readFileSync('src/SpatialObjectEngine.tsx', 'utf8');

code = code.replace(/id === 'hm_frame'/g, "id === 'heliomotion.frame'");
code = code.replace(/id === 'hm_panel'/g, "id === 'heliomotion.panel'");
code = code.replace(/id === 'hm_servo_pan'/g, "id === 'heliomotion.servo_pan'");
code = code.replace(/id === 'hm_servo_tilt'/g, "id === 'heliomotion.servo_tilt'");
code = code.replace(/id === 'hm_ldr_array'/g, "id === 'heliomotion.ldr_array'");
code = code.replace(/id === 'hm_arduino'/g, "id === 'heliomotion.arduino'");
code = code.replace(/id === 'hm_wiring'/g, "id === 'heliomotion.wiring'");

fs.writeFileSync('src/SpatialObjectEngine.tsx', code);
