import { useEffect, useRef, useState } from 'react';
import type { DayReport } from '../sim/types';
import { money } from './format';

/** Línea de efectivo al cierre de cada día, con cruz y tooltip al pasar el ratón. */
export function CashChart({ reports, startCash }: { reports: DayReport[]; startCash: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const points = [{ day: 0, cash: startCash }, ...reports.map((r) => ({ day: r.day, cash: r.cashEnd }))];
  const height = 220;
  const pad = { l: 64, r: 16, t: 12, b: 28 };
  const values = points.map((p) => p.cash);
  const rawMin = Math.min(0, ...values);
  const rawMax = Math.max(...values);
  const step = niceStep((rawMax - rawMin) / 4 || 1000);
  const min = Math.floor(rawMin / step) * step;
  const max = Math.ceil(rawMax / step) * step || step;
  const maxDay = Math.max(points[points.length - 1].day, 7);
  const x = (d: number) => pad.l + (d / maxDay) * (width - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - min) / (max - min)) * (height - pad.t - pad.b);
  const ticks: number[] = [];
  for (let v = min; v <= max + 1e-9; v += step) ticks.push(v);
  const dayTicks: number[] = [];
  for (let d = 0; d <= maxDay; d += 7) dayTicks.push(d);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.day).toFixed(1)},${y(p.cash).toFixed(1)}`).join(' ');
  const hp = hover !== null ? points[hover] : null;

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = (e.target as SVGRectElement).getBoundingClientRect();
    const d = ((e.clientX - rect.left) / rect.width) * maxDay;
    let best = 0;
    for (let i = 0; i < points.length; i++) if (Math.abs(points[i].day - d) < Math.abs(points[best].day - d)) best = i;
    setHover(best);
  };

  return (
    <div className="chart" ref={wrapRef}>
      <svg width={width} height={height} role="img" aria-label="Efectivo en caja por día">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} className={t === 0 ? 'grid zero' : 'grid'} />
            <text x={pad.l - 8} y={y(t)} className="axis-label" textAnchor="end" dominantBaseline="middle">
              {money(t)}
            </text>
          </g>
        ))}
        {dayTicks.map((d) => (
          <text key={d} x={x(d)} y={height - 8} className="axis-label" textAnchor="middle">
            {d === 0 ? 'Inicio' : `Día ${d}`}
          </text>
        ))}
        <path d={path} className="series-line" />
        {hp && (
          <g>
            <line x1={x(hp.day)} x2={x(hp.day)} y1={pad.t} y2={height - pad.b} className="crosshair" />
            <circle cx={x(hp.day)} cy={y(hp.cash)} r={4.5} className="series-dot" />
          </g>
        )}
        <rect
          x={pad.l}
          y={pad.t}
          width={width - pad.l - pad.r}
          height={height - pad.t - pad.b}
          fill="transparent"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        />
      </svg>
      {hp && (
        <div className="chart-tip" style={{ left: Math.min(x(hp.day) + 12, width - 150), top: Math.max(0, y(hp.cash) - 44) }}>
          <span className="muted small">{hp.day === 0 ? 'Inicio' : `Día ${hp.day}`}</span>
          <strong>{money(hp.cash)}</strong>
        </div>
      )}
    </div>
  );
}

function niceStep(raw: number): number {
  const pow = 10 ** Math.floor(Math.log10(raw));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}
