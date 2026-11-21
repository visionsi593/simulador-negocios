// Juega partidas automáticas con una estrategia sencilla para revisar el equilibrio económico.
// Uso: npm run balance -- [semilla] [días]
import { advanceDay, answer, buyMany, hire, newGame, pendingDecisions, suggestPurchase } from '../src/sim/engine';
import { reportsByWeek, summarize } from '../src/sim/helpers';
import { OBJECTIVES } from '../src/sim/story';
import type { GameState } from '../src/sim/types';

const seed = Number(process.argv[2] ?? 42);
const days = Number(process.argv[3] ?? 84);

let s: GameState = newGame('Bot', seed);
let maxStaff = 0;
for (let d = 0; d < days && s.status === 'jugando'; d++) {
  for (const m of pendingDecisions(s)) {
    const pref = ['pagar', 'reparar', 'aceptar'];
    const opt = m.options!.find((o) => pref.includes(o.id)) ?? m.options![m.options!.length - 1];
    try { s = answer(s, m.id, opt.id); } catch { s = answer(s, m.id, m.options![m.options!.length - 1].id); }
  }
  const last = s.reports[s.reports.length - 1];
  if (last && last.lostCapacity > 5 && s.employees.length < 2 && s.candidates.length) {
    const best = [...s.candidates].sort((a, b) => b.speed + b.quality - a.speed - a.quality)[0];
    s = hire(s, best.id);
  }
  maxStaff = Math.max(maxStaff, s.employees.length);
  const cart = suggestPurchase(s, 1);
  if (Object.keys(cart).length) { try { s = buyMany(s, cart); } catch { /* sin dinero */ } }
  s = advanceDay(s);
}

console.log(`Semilla ${seed}, ${s.reports.length} días, estado: ${s.status}, empleados máx: ${maxStaff}`);
for (const [i, w] of reportsByWeek(s.reports).entries()) {
  const x = summarize(w);
  console.log(
    `Sem ${String(i + 1).padStart(2)}  clientes ${String(x.customers).padStart(4)}  atendidos ${String(x.served).padStart(4)}  perdidos ${String(x.lost).padStart(3)}  ` +
      `ventas ${x.revenue.toFixed(0).padStart(6)}  margen ${(x.grossMargin * 100).toFixed(0)}%  merma ${x.waste.toFixed(0).padStart(5)}  ` +
      `utilidad ${x.netProfit.toFixed(0).padStart(6)}  caja ${x.cashEnd.toFixed(0).padStart(7)}  rep ${w[w.length - 1].reputationEnd.toFixed(0)}`,
  );
}
console.log(`Objetivos cumplidos: ${s.objectiveIndex}/${OBJECTIVES.length}  ${s.flags.actoCompletado ? '(ACTO 1 COMPLETADO)' : ''}`);
