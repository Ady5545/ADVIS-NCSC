const fs = require('fs');
let code = fs.readFileSync('src/SpatialLibrary.ts', 'utf8');

code = code.replace(/hm_frame/g, 'heliomotion.frame');
code = code.replace(/hm_panel/g, 'heliomotion.panel');
code = code.replace(/hm_servo_pan/g, 'heliomotion.servo_pan');
code = code.replace(/hm_servo_tilt/g, 'heliomotion.servo_tilt');
code = code.replace(/hm_ldr_array/g, 'heliomotion.ldr_array');
code = code.replace(/hm_arduino/g, 'heliomotion.arduino');
code = code.replace(/hm_wiring/g, 'heliomotion.wiring');

fs.writeFileSync('src/SpatialLibrary.ts', code);
