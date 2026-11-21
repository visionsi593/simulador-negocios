import { STARTING_CASH, FIXED_COST_PER_DAY } from '../../sim/data';
import { reportsByWeek, summarize, type PeriodSummary } from '../../sim/helpers';
import type { GameState } from '../../sim/types';
import { CashChart } from '../CashChart';
import { money, pct } from '../format';
import { Term } from '../RichText';

type Row = { label: React.ReactNode; get: (p: PeriodSummary) => number; kind?: 'total' | 'sub' | 'pct'; sign?: -1 };

const PL_ROWS: Row[] = [
  { label: <Term id="ventas">Ventas</Term>, get: (p) => p.revenue },
  { label: <Term id="costo_ventas">Costo de ventas</Term>, get: (p) => p.cogs, sign: -1 },
  { label: <Term id="utilidad_bruta">Utilidad bruta</Term>, get: (p) => p.grossProfit, kind: 'sub' },
  { label: <Term id="margen_bruto">Margen bruto</Term>, get: (p) => p.grossMargin, kind: 'pct' },
  { label: <Term id="merma">Mermas</Term>, get: (p) => p.waste, sign: -1 },
  { label: 'Sueldos', get: (p) => p.wages, sign: -1 },
  { label: <Term id="gastos_fijos">Renta y servicios</Term>, get: (p) => p.fixed, sign: -1 },
  { label: 'Otros (permisos, multas, finiquitos…)', get: (p) => p.other, sign: -1 },
  { label: <Term id="utilidad_neta">Utilidad neta</Term>, get: (p) => p.netProfit, kind: 'total' },
];

export function Finance({ game }: { game: GameState }) {
  const weeks = reportsByWeek(game.reports);
  const shown = weeks.slice(-6);
  const firstWeek = weeks.length - shown.length + 1;
  const summaries = shown.map(summarize);
  const last7 = summarize(game.reports.slice(-7));
  const total = summarize(game.reports);

  const payroll = game.employees.reduce((a, e) => a + e.wage, 0);
  const dailyFixed = FIXED_COST_PER_DAY + payroll;
  const contribution = last7.served > 0 ? (last7.grossProfit - last7.waste) / last7.served : 0;
  const breakEven = contribution > 0 ? Math.ceil(dailyFixed / contribution) : null;
  const avgTicket = last7.served > 0 ? last7.revenue / last7.served : 0;
  const inventoryValue = game.inventory.reduce((a, l) => a + l.qty * l.unitCost, 0);

  if (game.reports.length === 0) {
    return (
      <div className="panel">
        <h2>Finanzas</h2>
        <p className="muted">Todavía no abres el puesto. Después de tu primer día aquí verás tu estado de resultados y tu flujo de efectivo.</p>
      </div>
    );
  }

  return (
    <div className="finance">
      <div className="panel">
        <h2>Indicadores (últimos 7 días)</h2>
        <div className="kpis">
          <div className="kpi">
            <span className="label">
              <Term id="ticket_promedio">Ticket promedio</Term>
            </span>
            <span className="value">{money(avgTicket, 2)}</span>
          </div>
          <div className="kpi">
            <span className="label">
              <Term id="margen_bruto">Margen bruto</Term>
            </span>
            <span className="value">{pct(last7.grossMargin)}</span>
          </div>
          <div className="kpi">
            <span className="label">
              <Term id="punto_equilibrio">Punto de equilibrio</Term>
            </span>
            <span className="value">{breakEven !== null ? <>{breakEven} <small>clientes/día</small></> : '—'}</span>
          </div>
          <div className="kpi">
            <span className="label">
              <Term id="venta_perdida">Clientes perdidos</Term>
            </span>
            <span className="value">
              {last7.lost} <small>de {last7.customers}</small>
            </span>
          </div>
        </div>
        {breakEven !== null && (
          <p className="muted small">
            Gastos fijos diarios: {money(FIXED_COST_PER_DAY)} de renta y servicios + {money(payroll)} de sueldos = {money(dailyFixed)}. A cada cliente le ganas en promedio{' '}
            {money(contribution, 2)} después de ingredientes y mermas. {money(dailyFixed)} ÷ {money(contribution, 2)} ≈ {breakEven} clientes al día para no perder.
          </p>
        )}
      </div>

      <div className="panel">
        <h2>Estado de resultados por semana</h2>
        <div className="table-scroll">
          <table className="table statement">
            <thead>
              <tr>
                <th />
                {summaries.map((p, i) => (
                  <th key={i} className="num">
                    Semana {firstWeek + i}
                    {p.days < 7 && <div className="muted small">{p.days} de 7 días</div>}
                  </th>
                ))}
                <th className="num">Total del juego</th>
              </tr>
            </thead>
            <tbody>
              {PL_ROWS.map((row, ri) => (
                <tr key={ri} className={row.kind ?? ''}>
                  <td>{row.label}</td>
                  {[...summaries, total].map((p, i) => {
                    const v = row.get(p);
                    if (row.kind === 'pct') return <td key={i} className="num muted">{pct(v)}</td>;
                    const shownV = row.sign ? -v : v;
                    return (
                      <td key={i} className={'num ' + (row.kind === 'total' ? (v < 0 ? 'neg' : 'pos') : '')}>
                        {money(shownV)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <h2>
          <Term id="flujo_efectivo">Flujo de efectivo</Term> por semana
        </h2>
        <p className="muted small">
          Fíjate en la diferencia con la utilidad: las compras salen de la caja el día que compras, pero son costo hasta que se venden. Hoy tienes {money(inventoryValue)} en{' '}
          <Term id="inventario">inventario</Term>.
        </p>
        <div className="table-scroll">
          <table className="table statement">
            <thead>
              <tr>
                <th />
                {summaries.map((_, i) => (
                  <th key={i} className="num">
                    Semana {firstWeek + i}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Caja al inicio</td>
                {summaries.map((p, i) => (
                  <td key={i} className="num">{money(p.cashStart)}</td>
                ))}
              </tr>
              <tr>
                <td>+ Cobros de ventas</td>
                {summaries.map((p, i) => (
                  <td key={i} className="num">{money(p.revenue)}</td>
                ))}
              </tr>
              <tr>
                <td>− Compras de ingredientes</td>
                {summaries.map((p, i) => (
                  <td key={i} className="num">{money(-p.purchases)}</td>
                ))}
              </tr>
              <tr>
                <td>− Sueldos</td>
                {summaries.map((p, i) => (
                  <td key={i} className="num">{money(-p.wages)}</td>
                ))}
              </tr>
              <tr>
                <td>− Renta y servicios</td>
                {summaries.map((p, i) => (
                  <td key={i} className="num">{money(-p.fixed)}</td>
                ))}
              </tr>
              <tr>
                <td>− Otros pagos</td>
                {summaries.map((p, i) => (
                  <td key={i} className="num">{money(-p.other)}</td>
                ))}
              </tr>
              <tr className="total">
                <td>Caja al final</td>
                {summaries.map((p, i) => (
                  <td key={i} className="num">{money(p.cashEnd)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <h2>Efectivo en caja</h2>
        <CashChart reports={game.reports} startCash={STARTING_CASH} />
      </div>
    </div>
  );
}
