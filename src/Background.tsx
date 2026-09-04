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

      // 1. Neutral Scientific Visualization Base (Dark Blue-Gray / Slate)
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, w, h);

      // 2. Subtle Radial Gradient with Soft Lighting Center
      const bgGrad = ctx.createRadialGradient(
        w / 2, h * 0.45, h * 0.05,
        w / 2, h * 0.5, Math.max(w, h) * 0.85
      );
      if (systemState === 'ERROR') {
        bgGrad.addColorStop(0, 'rgba(30, 10, 15, 0.95)');
        bgGrad.addColorStop(0.5, 'rgba(18, 7, 10, 0.98)');
        bgGrad.addColorStop(1, '#050204');
      } else {
        bgGrad.addColorStop(0, 'rgba(15, 23, 42, 0.95)'); // Slate 900
        bgGrad.addColorStop(0.45, 'rgba(11, 17, 32, 0.98)');
        bgGrad.addColorStop(1, '#060911');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // 3. Faint Scientific Precision Coordinate Grid
      const gridSize = 48;
      ctx.lineWidth = 1;
      ctx.strokeStyle = systemState === 'ERROR' 
        ? 'rgba(239, 68, 68, 0.025)' 
        : 'rgba(56, 189, 248, 0.025)'; // Very faint cyan-slate grid

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
        : 'rgba(56, 189, 248, 0.05)';
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

      // 4. Subtle Ambient Floating Energy Particle Dust (minimal, non-distracting)
      ctx.fillStyle = systemState === 'ERROR' 
        ? 'rgba(239, 68, 68, 0.15)' 
        : `color-mix(in srgb, ${themeColor} 12%, transparent)`;
      for (let i = 0; i < 8; i++) {
        const px = (Math.sin(time * 0.4 + i * 1.5) * 0.45 + 0.5) * w;
        const py = (Math.cos(time * 0.3 + i * 2.1) * 0.45 + 0.5) * h;
        const pr = 1.0 + (Math.sin(time + i) * 0.4);
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5. Soft Outer Vignette for Depth
      const vignette = ctx.createRadialGradient(
        w / 2, h / 2, h * 0.35,
        w / 2, h / 2, Math.max(w, h) * 0.75
      );
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(1, 'rgba(2, 6, 15, 0.65)');
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
