import React, { useEffect, useRef } from 'react';
import { SystemState } from './App';

export function Background({ systemState, themeColor = '#22d3ee' }: { systemState: SystemState, themeColor?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      time += 0.0015;
      const w = canvas.width;
      const h = canvas.height;

      // 1. Deep SAP-blue canvas with a restrained cyan/teal atmosphere.
      ctx.fillStyle = '#041321';
      ctx.fillRect(0, 0, w, h);

      // 2. Subtle Radial Gradient with Soft Lighting Center
      const bgGrad = ctx.createRadialGradient(
        w / 2, h * 0.45, h * 0.05,
        w / 2, h * 0.5, Math.max(w, h) * 0.85
      );
      if (systemState === 'ERROR') {
        bgGrad.addColorStop(0, 'rgba(75, 18, 43, 0.94)');
        bgGrad.addColorStop(0.5, 'rgba(33, 14, 36, 0.96)');
        bgGrad.addColorStop(1, '#100f20');
      } else {
        bgGrad.addColorStop(0, 'rgba(0, 112, 242, 0.25)'); // SAP blue central glow
        bgGrad.addColorStop(0.38, 'rgba(5, 59, 104, 0.48)');
        bgGrad.addColorStop(0.7, 'rgba(3, 29, 51, 0.9)');
        bgGrad.addColorStop(1, '#041321');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // 3. Faint Scientific Precision Coordinate Grid
      const gridSize = 48;
      ctx.lineWidth = 1;
      ctx.strokeStyle = systemState === 'ERROR' 
        ? 'rgba(239, 68, 68, 0.025)' 
        : 'rgba(59, 162, 202, 0.12)'; // Very faint cyan-slate grid

      ctx.beginPath();
      for (let x = 0; x < w; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

      // Major Grid Intersections & Tick Crosshairs (every 4 cells)
      const majorGrid = gridSize * 4;
      ctx.strokeStyle = systemState === 'ERROR' 
        ? 'rgba(239, 68, 68, 0.06)' 
        : 'rgba(51, 190, 218, 0.2)';
      ctx.lineWidth = 1;

      for (let x = majorGrid; x < w; x += majorGrid) {
        for (let y = majorGrid; y < h; y += majorGrid) {
          const crossSize = 3;
          ctx.beginPath();
          ctx.moveTo(x - crossSize, y);
          ctx.lineTo(x + crossSize, y);
          ctx.moveTo(x, y - crossSize);
          ctx.lineTo(x, y + crossSize);
          ctx.stroke();
        }
      }

      // 4. Sparse cyan/teal energy points — luminous, not noisy.
      ctx.fillStyle = systemState === 'ERROR' 
        ? 'rgba(248, 91, 115, 0.26)' 
        : 'rgba(45, 224, 229, 0.62)';
      ctx.shadowBlur = systemState === 'ERROR' ? 0 : 10;
      ctx.shadowColor = 'rgba(28, 213, 230, 0.58)';
      for (let i = 0; i < 8; i++) {
        const px = (Math.sin(time * 0.4 + i * 1.5) * 0.45 + 0.5) * w;
        const py = (Math.cos(time * 0.3 + i * 2.1) * 0.45 + 0.5) * h;
        const pr = 1.0 + (Math.sin(time + i) * 0.4);
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // 5. Deep navy vignette preserves contrast around bright center details.
      const vignette = ctx.createRadialGradient(
        w / 2, h / 2, h * 0.35,
        w / 2, h / 2, Math.max(w, h) * 0.75
      );
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(1, 'rgba(0, 4, 13, 0.46)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [systemState, themeColor]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 pointer-events-none"
    />
  );
}
