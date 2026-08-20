const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const injection = `
  useEffect(() => {
    const handleSwipe = (e: Event) => {
      const swipeEvent = e as CustomEvent;
      if (swipeEvent.detail && swipeEvent.detail.direction) {
         console.log('ADVIS SWIPE:', swipeEvent.detail.direction);
         // For now just log the swipe, but it could be used for pagination or switching workspaces.
      }
    };
    window.addEventListener('advis-swipe', handleSwipe);
    return () => window.removeEventListener('advis-swipe', handleSwipe);
  }, []);
`;

content = content.replace(
  "  useEffect(() => {\n    let reqFrame: number;",
  injection + "\n  useEffect(() => {\n    let reqFrame: number;"
);

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log("Patched app swipe handler");
