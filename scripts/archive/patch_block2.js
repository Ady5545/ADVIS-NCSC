const fs = require('fs');
const file = 'src/generators/MechanicalGenerator.tsx';
let src = fs.readFileSync(file, 'utf8');

const targetStr = `  const bankShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-1.51, -0.26); // z start, x start (local to bank)
    shape.lineTo(1.51, -0.26);
    shape.lineTo(1.51, 0.26);
    shape.lineTo(-1.51, 0.26);
    shape.lineTo(-1.51, -0.26);
    
    // Add 6 cylinder holes
    CYLINDER_Z.forEach(z => {
       const hole = new THREE.Path();
       hole.absarc(z, 0, 0.21, 0, Math.PI * 2, true);
       shape.holes.push(hole);
    });
    return shape;
  }, []);`;

const replaceStr = `  const bankShape = useMemo(() => {
    const shape = new THREE.Shape();
    // Shape X = Local X (-0.26 to 0.26)
    // Shape Y = Local -Z (-(-1.51) to -(1.51)) -> 1.51 to -1.51
    shape.moveTo(-0.26, 1.51);
    shape.lineTo(0.26, 1.51);
    shape.lineTo(0.26, -1.51);
    shape.lineTo(-0.26, -1.51);
    shape.lineTo(-0.26, 1.51);
    
    // Add 6 cylinder holes
    CYLINDER_Z.forEach(z => {
       const hole = new THREE.Path();
       hole.absarc(0, -z, 0.21, 0, Math.PI * 2, true);
       shape.holes.push(hole);
    });
    return shape;
  }, []);`;

src = src.replace(targetStr, replaceStr);

src = src.replace(/<group rotation={\[Math\.PI \/ 2, 0, Math\.PI \/ 2\]}>/g, '<group rotation={[-Math.PI / 2, 0, 0]}>');

fs.writeFileSync(file, src);
console.log("Patched bank shape and rotation.");
