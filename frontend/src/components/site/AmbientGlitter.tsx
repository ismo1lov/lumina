import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  r: number;
  speedX: number;
  speedY: number;
  phase: number;
  twinkle: number;
  color: string;
  alpha: number;
}

const COLORS = ["#d9b98c", "#c9a06c", "#b98a5e", "#a0784c", "#e0c9a8"];

export function AmbientGlitter() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let width = 0;
    let height = 0;
    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const particles: Particle[] = [];

    const spawn = () => {
      particles.length = 0;
      const count = Math.min(90, Math.floor((width * height) / 14000));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: 0.6 + Math.random() * 1.8,
          speedX: (Math.random() - 0.5) * 0.12,
          speedY: -(0.05 + Math.random() * 0.2),
          phase: Math.random() * Math.PI * 2,
          twinkle: 0.004 + Math.random() * 0.012,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          alpha: 0.15 + Math.random() * 0.5,
        });
      }
    };

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      spawn();
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.speedX;
        p.y += p.speedY;
        p.phase += p.twinkle;
        if (p.y < -8) {
          p.y = height + 8;
          p.x = Math.random() * width;
        }
        if (p.x < -8) p.x = width + 8;
        if (p.x > width + 8) p.x = -8;

        const twinkle = 0.45 + 0.55 * Math.sin(p.phase);
        ctx.globalAlpha = p.alpha * twinkle;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        ctx.globalAlpha = p.alpha * twinkle * 0.22;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };

    resize();
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
