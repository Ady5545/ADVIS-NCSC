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

    const drawHexagon = (x: number, y: number, r: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const hx = x + r * Math.cos(angle);
        const hy = y + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();
    };

    const draw = () => {
      time += 0.002;
      ctx.fillStyle = 'rgba(2, 6, 15, 1)'; // Deep dark laboratory base
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw advanced hex grid background
      ctx.strokeStyle = systemState === 'ERROR' ? 'rgba(255,0,0,0.03)' : `color-mix(in srgb, ${themeColor} 3%, transparent)`;
      ctx.lineWidth = 1;
      
      const hexRadius = 40;
      const hexHeight = hexRadius * Math.sqrt(3);
      const hexWidth = hexRadius * 2;
      
      const yOffset = (time * 50) % hexHeight;

      for (let y = -hexHeight + yOffset; y < canvas.height + hexHeight; y += hexHeight) {
        for (let x = 0; x < canvas.width + hexWidth; x += hexWidth * 1.5) {
          drawHexagon(x, y, hexRadius);
          drawHexagon(x + hexWidth * 0.75, y + hexHeight / 2, hexRadius);
        }
      }

      // Floating data streams (vertical lines)
      ctx.strokeStyle = systemState === 'ERROR' ? 'rgba(255,0,0,0.1)' : `color-mix(in srgb, ${themeColor} 10%, transparent)`;
      for (let i = 0; i < 5; i++) {
        const x = (Math.sin(time * 0.5 + i * 2) * 0.5 + 0.5) * canvas.width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Vignette
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.height * 0.1,
        canvas.width / 2, canvas.height / 2, canvas.height * 0.9
      );
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.9)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [systemState]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 pointer-events-none"
    />
  );
}
