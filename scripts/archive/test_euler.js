const THREE = require('three');
function getEuler(x, y, z) {
  const v = new THREE.Vector3(x, y, z).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v);
  const e = new THREE.Euler().setFromQuaternion(q);
  return [e.x, e.y, e.z];
}
const a = 1;
console.log('CH4:');
console.log(getEuler(a, a, a));
console.log(getEuler(-a, -a, a));
console.log(getEuler(-a, a, -a));
console.log(getEuler(a, -a, -a));

console.log('BF3:');
const bondLength = 1;
console.log(getEuler(0, bondLength, 0));
console.log(getEuler(bondLength * Math.cos(Math.PI/6), -bondLength * Math.sin(Math.PI/6), 0));
console.log(getEuler(-bondLength * Math.cos(Math.PI/6), -bondLength * Math.sin(Math.PI/6), 0));

