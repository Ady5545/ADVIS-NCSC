export const getDistance = (p1: any, p2: any) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + (p1.z && p2.z ? Math.pow(p1.z - p2.z, 2) : 0));
};

export const isFingerExtended = (lm: any[], baseIdx: number) => {
  const tip = lm[baseIdx + 3];
  const pip = lm[baseIdx + 1];
  const mcp = lm[baseIdx];
  const wrist = lm[0];
  // When extended, tip is further from wrist than PIP is.
  return getDistance(tip, wrist) > getDistance(pip, wrist) * 1.05;
};

export const isThumbExtended = (lm: any[]) => {
  const tip = lm[4];
  const ip = lm[3];
  const pinkyBase = lm[17];
  return getDistance(tip, pinkyBase) > getDistance(ip, pinkyBase) * 1.05;
}

export const getHandRotation = (lm: any[]) => {
  const wrist = lm[0];
  const middleMCP = lm[9];
  const dx = middleMCP.x - wrist.x;
  const dy = middleMCP.y - wrist.y;
  return Math.atan2(dy, dx);
};
