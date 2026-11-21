import { useEffect, useRef } from 'react';
import type { DayReport, Weather } from '../sim/types';

type AgentKind = 'served' | 'lostStock' | 'lostCapacity';
interface Agent {
  x: number;
  y: number;
  kind: AgentKind;
  state: 'in' | 'wait' | 'out';
  t: number;
  speed: number;
  shirt: string;
  dir: 1 | -1;
}

const SHIRTS = ['#e76f51', '#2a9d8f', '#e9c46a', '#8ab17d', '#6d597a', '#457b9d', '#f4a261', '#b56576'];
const LOOP_SECONDS = 40;

/**
 * Vista animada del puesto. Repite el día anterior: cada figura es un cliente;
 * los que se van sin comprar regresan por donde vinieron con un signo de alerta.
 */
export function StallView({ report, staff, name, weather }: { report?: DayReport; staff: number; name: string; weather: Weather }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    let spawned = 0;
    const agents: Agent[] = [];

    // Secuencia fija de clientes del día (mezcla determinista).
    const kinds: AgentKind[] = [];
    if (report) {
      for (let i = 0; i < report.served; i++) kinds.push('served');
      for (let i = 0; i < report.lostStock; i++) kinds.push('lostStock');
      for (let i = 0; i < report.lostCapacity; i++) kinds.push('lostCapacity');
      let seed = report.day * 9301 + 49297;
      for (let i = kinds.length - 1; i > 0; i--) {
        seed = (seed * 9301 + 49297) % 233280;
        const j = Math.floor((seed / 233280) * (i + 1));
        [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
      }
      // Los que se van por falta de capacidad llegan al final del día, cuando ya hay fila.
      kinds.sort((a, b) => (a === 'lostCapacity' ? 1 : 0) - (b === 'lostCapacity' ? 1 : 0));
    }
    const drops = Array.from({ length: 80 }, (_, i) => ({ x: (i * 97) % 1000, y: (i * 53) % 300, s: 200 + ((i * 37) % 120) }));

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const person = (x: number, y: number, shirt: string, scale = 1, apron = false) => {
      ctx.fillStyle = shirt;
      ctx.beginPath();
      ctx.roundRect(x - 7 * scale, y - 26 * scale, 14 * scale, 20 * scale, 4 * scale);
      ctx.fill();
      if (apron) {
        ctx.fillStyle = '#f1f1f1';
        ctx.fillRect(x - 5 * scale, y - 20 * scale, 10 * scale, 14 * scale);
      }
      ctx.fillStyle = '#c68642';
      ctx.beginPath();
      ctx.arc(x, y - 32 * scale, 6 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3d3d3d';
      ctx.fillRect(x - 6 * scale, y - 6 * scale, 4 * scale, 8 * scale);
      ctx.fillRect(x + 2 * scale, y - 6 * scale, 4 * scale, 8 * scale);
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      elapsed += dt;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const ground = h * 0.72;
      const stallX = w * 0.58;
      const counterFront = stallX - 70;

      // Cielo y clima.
      const sky = ctx.createLinearGradient(0, 0, 0, ground);
      const skies: Record<Weather, [string, string]> = {
        soleado: ['#7ec8f2', '#d6f0ff'],
        caluroso: ['#f7b267', '#ffe6a7'],
        nublado: ['#9aa7b4', '#d5dbe1'],
        lluvia: ['#5f6f7f', '#9aa7b4'],
      };
      sky.addColorStop(0, skies[weather][0]);
      sky.addColorStop(1, skies[weather][1]);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, ground);
      if (weather === 'soleado' || weather === 'caluroso') {
        ctx.fillStyle = weather === 'caluroso' ? '#ff9f1c' : '#ffd166';
        ctx.beginPath();
        ctx.arc(w * 0.12, h * 0.16, 22, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        for (const [cx, cy] of [[0.15, 0.15], [0.4, 0.1], [0.8, 0.18]]) {
          ctx.beginPath();
          ctx.ellipse(w * cx, h * cy, 40, 14, 0, 0, Math.PI * 2);
          ctx.ellipse(w * cx + 25, h * cy - 8, 28, 12, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Edificios del fondo.
      const buildings = ['#c9ada7', '#9a8c98', '#b8b8aa', '#a3b18a', '#d4a373'];
      for (let i = 0; i < 8; i++) {
        const bw = w / 8;
        const bh = h * (0.28 + ((i * 37) % 17) / 60);
        ctx.fillStyle = buildings[i % buildings.length];
        ctx.fillRect(i * bw, ground - bh, bw - 4, bh);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) ctx.fillRect(i * bw + 10 + c * (bw / 2 - 6), ground - bh + 12 + r * 26, 12, 14);
      }

      // Banqueta y calle.
      ctx.fillStyle = '#cfcfcf';
      ctx.fillRect(0, ground, w, h * 0.12);
      ctx.fillStyle = '#4a4e54';
      ctx.fillRect(0, ground + h * 0.12, w, h);
      ctx.fillStyle = '#e9e9e9';
      for (let x = 0; x < w; x += 60) ctx.fillRect(x, ground + h * 0.2, 30, 4);

      // Personal detrás del mostrador.
      const team = 1 + staff;
      for (let i = 0; i < team; i++) {
        const px = stallX - 30 + i * 32;
        const bob = Math.sin(elapsed * 6 + i) * 1.5;
        person(px, ground - 30 + bob, i === 0 ? '#264653' : '#e76f51', 1, true);
      }

      // Puesto: mostrador, toldo y letrero.
      ctx.fillStyle = '#8d5524';
      ctx.fillRect(stallX - 80, ground - 48, 160, 48);
      ctx.fillStyle = '#a0522d';
      ctx.fillRect(stallX - 84, ground - 52, 168, 8);
      ctx.fillStyle = '#6b3e1f';
      ctx.fillRect(stallX - 80, ground - 130, 6, 82);
      ctx.fillRect(stallX + 74, ground - 130, 6, 82);
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i % 2 ? '#f1faee' : '#d62828';
        ctx.beginPath();
        ctx.moveTo(stallX - 90 + i * 22.5, ground - 150);
        ctx.lineTo(stallX - 90 + (i + 1) * 22.5, ground - 150);
        ctx.lineTo(stallX - 90 + (i + 1) * 22.5, ground - 128);
        ctx.arc(stallX - 90 + i * 22.5 + 11.25, ground - 128, 11.25, 0, Math.PI);
        ctx.fill();
      }
      ctx.fillStyle = '#fefae0';
      ctx.fillRect(stallX - 95, ground - 176, 190, 24);
      ctx.fillStyle = '#3d2c1e';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(name.length > 26 ? name.slice(0, 25) + '…' : name, stallX, ground - 164, 182);
      // Vapor del comal.
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const sx = stallX + 30 + i * 10;
        ctx.beginPath();
        for (let k = 0; k < 12; k++) {
          const yy = ground - 56 - k * 3;
          const xx = sx + Math.sin(elapsed * 3 + k * 0.6 + i) * 3;
          if (k === 0) ctx.moveTo(xx, yy);
          else ctx.lineTo(xx, yy);
        }
        ctx.stroke();
      }

      // Clientes.
      const interval = kinds.length ? LOOP_SECONDS / kinds.length : Infinity;
      while (spawned < kinds.length && elapsed > spawned * interval) {
        const kind = kinds[spawned];
        agents.push({ x: -20, y: ground + 10 + ((spawned * 7) % 14), kind, state: 'in', t: 0, speed: 60 + ((spawned * 13) % 30), shirt: SHIRTS[spawned % SHIRTS.length], dir: 1 });
        spawned++;
      }
      const queue = agents.filter((a) => a.state !== 'out');
      for (const a of agents) {
        if (a.state === 'in') {
          const slot = counterFront - queue.indexOf(a) * 18;
          a.x += a.speed * dt;
          if (a.x >= slot) {
            a.x = slot;
            if (queue.indexOf(a) === 0) {
              a.state = 'wait';
              a.t = 0;
            }
          }
        } else if (a.state === 'wait') {
          a.t += dt;
          if (a.t > (a.kind === 'served' ? 1.1 : 0.7)) {
            a.state = 'out';
            a.dir = a.kind === 'served' ? 1 : -1;
          }
        } else {
          a.x += a.speed * 1.2 * a.dir * dt;
        }
      }
      for (let i = agents.length - 1; i >= 0; i--) if (agents[i].x > w + 30 || (agents[i].state === 'out' && agents[i].x < -30)) agents.splice(i, 1);
      for (const a of [...agents].sort((p, q) => p.y - q.y)) {
        person(a.x, a.y, a.shirt, 0.9);
        if (a.state === 'out' && a.kind === 'served') {
          ctx.fillStyle = '#f4f1de';
          ctx.fillRect(a.x + 6, a.y - 18, 8, 9);
        }
        if (a.kind !== 'served' && (a.state === 'wait' || a.state === 'out')) {
          ctx.fillStyle = '#d62828';
          ctx.beginPath();
          ctx.arc(a.x, a.y - 50, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 11px system-ui, sans-serif';
          ctx.fillText(a.kind === 'lostStock' ? '?' : '!', a.x, a.y - 50);
        }
      }

      // Lluvia.
      if (weather === 'lluvia') {
        ctx.strokeStyle = 'rgba(220,230,255,0.6)';
        ctx.lineWidth = 1;
        for (const d of drops) {
          const yy = (d.y + elapsed * d.s) % h;
          const xx = (d.x / 1000) * w;
          ctx.beginPath();
          ctx.moveTo(xx, yy);
          ctx.lineTo(xx - 2, yy + 8);
          ctx.stroke();
        }
      }

      if (!report) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, h - 34, w, 34);
        ctx.fillStyle = '#fff';
        ctx.font = '14px system-ui, sans-serif';
        ctx.fillText('Tu puesto aún no abre. Compra ingredientes y dale a "Continuar".', w / 2, h - 17);
      }

      if (elapsed > LOOP_SECONDS + 12) {
        elapsed = 0;
        spawned = 0;
        agents.length = 0;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [report, staff, name, weather]);

  return <canvas ref={canvasRef} className="stall-canvas" aria-label="Vista animada del puesto" />;
}
