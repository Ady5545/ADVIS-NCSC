const fs = require('fs');
let code = fs.readFileSync('src/SpatialLibrary.ts', 'utf8');

code = code.replace(/components: \[\s*\{ id: 'hm_frame'[\s\S]*?\]/g, `components: [
      { id: 'heliomotion.frame', name: 'Structural Frame & Mast', description: 'Machined anodized aluminum mounting frame.', position: [0, 0, 0], size: [0.8, 1.2, 0.8], explodedOffset: [0, -0.5, 0], shape: 'cylinder', color: '#475569' },
      { id: 'heliomotion.panel', name: 'Photovoltaic Array', description: 'High-efficiency dual-axis solar module.', position: [0, 0.8, 0], size: [1.6, 0.08, 1.6], explodedOffset: [0, 0.6, 0], shape: 'box', color: '#0284c7' },
      { id: 'heliomotion.servo_pan', name: 'Pan Azimuth Actuator', description: 'Base 360-degree continuous rotation servo.', position: [0, -0.2, 0], size: [0.3, 0.25, 0.2], explodedOffset: [-0.4, -0.2, 0], shape: 'box', color: '#2563eb' },
      { id: 'heliomotion.servo_tilt', name: 'Tilt Elevation Actuator', description: 'Upper altitude articulation micro servo.', position: [0, 0.5, 0], size: [0.25, 0.2, 0.2], explodedOffset: [0.4, 0.5, 0], shape: 'box', color: '#2563eb' },
      { id: 'heliomotion.ldr_array', name: 'Quadrant LDR Pyranometer', description: 'Cross-baffled light sensor array.', position: [0, 0.88, 0], size: [0.3, 0.15, 0.3], explodedOffset: [0, 1.0, 0], shape: 'cylinder', color: '#f59e0b' },
      { id: 'heliomotion.arduino', name: 'Embedded Controller Board', description: 'Arduino microcontroller running sun-tracking PID logic.', position: [0.35, 0.1, 0], size: [0.5, 0.1, 0.7], explodedOffset: [0.6, 0.1, 0], shape: 'box', color: '#044530' },
      { id: 'heliomotion.wiring', name: 'Silicone Wiring Harness', description: 'Flexible low-resistance cabling loom.', position: [0, 0.3, 0], size: [0.1, 0.6, 0.1], explodedOffset: [0, 0.3, 0.4], shape: 'cylinder', color: '#ef4444' }
    ]`);

fs.writeFileSync('src/SpatialLibrary.ts', code);
