const fs = require('fs');

let file = fs.readFileSync('src/AutonomousModelEngine/GeometryGenerator.ts', 'utf-8');

const targetStr = `    const mergedBalls = ballGeoms.length > 0 ? (ballGeoms.length === 1 ? ballGeoms[0] : (THREE as any).BufferGeometryUtils ? (THREE as any).BufferGeometryUtils.mergeBufferGeometries(ballGeoms) : ballGeoms[0]) : new THREE.BufferGeometry();`;

file = file.replace(targetStr, '');

fs.writeFileSync('src/AutonomousModelEngine/GeometryGenerator.ts', file);
console.log('Fixed bearing mergedBalls line');
