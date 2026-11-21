import { useEffect } from 'react';
import { DISH_MAP } from '../../sim/data';
import { dateLabel, weatherLabel } from '../../sim/engine';
import type { GameState } from '../../sim/types';
import { money } from '../format';
import { Term } from '../RichText';

export function DaySummary({ game, day, onClose, onGo }: { game: GameState; day: number; onClose: () => void; onGo: (screen: string) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const r = game.reports.find((x) => x.day === day);
  if (!r) return null;
  const profit = r.revenue - r.cogs - r.waste - r.wages - r.fixed - r.other;
  const lost = r.lostStock + r.lostCapacity;
  const prevRep = day > 1 ? game.reports.find((x) => x.day === day - 1)?.reputationEnd ?? 35 : 35;
  const repDelta = r.reputationEnd - prevRep;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Resumen del día">
        <h2>Cierre del día</h2>
        <p className="muted">
          {dateLabel(day)} · {weatherLabel(r.weather)}
        </p>
        <div className="kpis">
          <div className="kpi">
            <span className="label">Clientes atendidos</span>
            <span className="value">
              {r.served} <small>de {r.customers}</small>
            </span>
          </div>
          <div className="kpi">
            <span className="label">
              <Term id="ventas">Ventas</Term>
            </span>
            <span className="value">{money(r.revenue)}</span>
          </div>
          <div className="kpi">
            <span className="label">
              <Term id="utilidad_neta">Utilidad del día</Term>
            </span>
            <span className={'value ' + (profit < 0 ? 'neg' : 'pos')}>{money(profit)}</span>
          </div>
          <div className="kpi">
            <span className="label">Caja</span>
            <span className="value">{money(r.cashEnd)}</span>
          </div>
        </div>
        <ul className="summary-lines">
          {lost > 0 && (
            <li className="warn">
              Se fueron {lost} clientes sin comprar
              {r.lostStock > 0 && ` · ${r.lostStock} porque faltaron ingredientes`}
              {r.lostCapacity > 0 && ` · ${r.lostCapacity} porque no te dabas abasto`}.
            </li>
          )}
          {r.waste > 0 && (
            <li className="warn">
              <Term id="merma">Merma</Term>: {money(r.waste)} en ingredientes que se tiraron.
            </li>
          )}
          <li>
            Reputación: {Math.round(r.reputationEnd)} ({repDelta >= 0 ? '+' : ''}
            {repDelta.toFixed(1)}) · Satisfacción de clientes: {r.satisfaction}/100
          </li>
          <li>
            Vendiste:{' '}
            {Object.entries(r.itemsSold)
              .map(([id, n]) => `${DISH_MAP[id].name} × ${n}`)
              .join(' · ') || 'nada'}
          </li>
          {r.notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
        <div className="modal-actions">
          <button onClick={() => onGo('negocio')}>Ver el puesto</button>
          <button onClick={() => onGo('finanzas')}>Ver finanzas</button>
          <button className="primary" onClick={() => onGo('bandeja')}>
            Ir a la bandeja
          </button>
        </div>
      </div>
    </div>
  );
}
