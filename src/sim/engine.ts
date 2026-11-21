// Motor del juego. Cada acción recibe un estado y devuelve uno nuevo (no modifica el original).

import {
  DISH_MAP,
  DISHES,
  FIRST_NAMES,
  FIXED_COST_PER_DAY,
  INGREDIENT_MAP,
  INGREDIENTS,
  LAST_NAMES,
  SEVERANCE_DAYS,
  STARTING_CASH,
  TRAITS,
  WEATHER,
  WEEKDAYS,
} from './data';
import {
  addMessage,
  capacity,
  clamp,
  dishAppeal,
  drinkProbability,
  expectedCustomers,
  GameError,
  marketPrice,
  marketWage,
  newId,
  priceIndex,
  reportsByWeek,
  round2,
  summarize,
  teamQuality,
} from './helpers';
import { addLot, canMake, consume, discardLots, maxPortions, stockMap } from './inventory';
import { Rng } from './rng';
import { announceObjective, checkObjectives, eventById, maybeStartEvent, teach } from './story';
import type { Candidate, DayReport, GameState, Weather } from './types';

const money = (n: number) => '$' + Math.round(n).toLocaleString('es-MX');

function mutate(prev: GameState, fn: (s: GameState) => void): GameState {
  const s = structuredClone(prev);
  fn(s);
  return s;
}

function rollWeather(rng: Rng): Weather {
  return rng.weighted<Weather>(['soleado', 'caluroso', 'nublado', 'lluvia'], [45, 20, 20, 15])!;
}

function makeCandidate(s: GameState, rng: Rng): Candidate {
  const speed = rng.int(5, 17);
  const quality = rng.int(5, 17);
  const wage = Math.round((marketWage(speed, quality) * rng.range(0.9, 1.15)) / 10) * 10;
  return {
    id: newId(s),
    name: `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`,
    speed,
    quality,
    wage,
    trait: rng.pick(TRAITS),
  };
}

function refreshCandidates(s: GameState, rng: Rng): void {
  s.candidates = [makeCandidate(s, rng), makeCandidate(s, rng), makeCandidate(s, rng)];
}

export function newGame(businessName = 'Antojitos El Buen Taco', seed = Date.now()): GameState {
  const s: GameState = {
    version: 1,
    rng: seed | 0,
    day: 1,
    businessName,
    cash: STARTING_CASH,
    reputation: 35,
    inventory: [],
    marketFactor: Object.fromEntries(INGREDIENTS.map((i) => [i.id, 1])),
    menu: DISHES.map((d) => ({ dishId: d.id, price: d.refPrice, active: true })),
    employees: [],
    candidates: [],
    messages: [],
    reports: [],
    today: { cashStart: STARTING_CASH, purchases: 0, other: 0, waste: 0, notes: [] },
    forecast: 'soleado',
    modifiers: [],
    specialOrders: [],
    lessonsSeen: [],
    objectiveIndex: 0,
    nextId: 1,
    negativeDays: 0,
    flags: {},
    status: 'jugando',
  };
  const rng = new Rng(s);
  refreshCandidates(s, rng);
  announceObjective(s);
  teach(s, 'costeo');
  teach(s, 'bienvenida');
  return s;
}

// ---------------------------------------------------------------------------
// Acciones del jugador
// ---------------------------------------------------------------------------

export function buy(prev: GameState, ingredientId: string, qty: number): GameState {
  return buyMany(prev, { [ingredientId]: qty });
}

/** Compra varios ingredientes de una vez al precio de mercado de hoy. */
export function buyMany(prev: GameState, cart: Record<string, number>): GameState {
  const items = Object.entries(cart).filter(([, q]) => q > 0);
  if (items.length === 0) throw new GameError('No hay nada que comprar.');
  let total = 0;
  for (const [id, qty] of items) {
    if (!INGREDIENT_MAP[id]) throw new GameError(`Ingrediente desconocido: ${id}`);
    total += qty * marketPrice(prev, id);
  }
  total = round2(total);
  if (total > prev.cash) throw new GameError(`No te alcanza: la compra cuesta ${money(total)} y tienes ${money(prev.cash)}.`);
  return mutate(prev, (s) => {
    for (const [id, qty] of items) addLot(s, id, qty, marketPrice(s, id));
    s.cash = round2(s.cash - total);
    s.today.purchases = round2(s.today.purchases + total);
  });
}

export function setPrice(prev: GameState, dishId: string, price: number): GameState {
  if (!(price > 0)) throw new GameError('El precio debe ser mayor a cero.');
  return mutate(prev, (s) => {
    const item = s.menu.find((m) => m.dishId === dishId);
    if (!item) throw new GameError('Ese platillo no está en el menú.');
    item.price = Math.round(price);
    if (Math.abs(item.price / DISH_MAP[dishId].refPrice - 1) >= 0.15) teach(s, 'elasticidad');
  });
}

export function toggleDish(prev: GameState, dishId: string): GameState {
  return mutate(prev, (s) => {
    const item = s.menu.find((m) => m.dishId === dishId);
    if (item) item.active = !item.active;
  });
}

export function hire(prev: GameState, candidateId: number): GameState {
  return mutate(prev, (s) => {
    const c = s.candidates.find((x) => x.id === candidateId);
    if (!c) throw new GameError('Ese candidato ya no está disponible.');
    if (s.employees.length >= 3) throw new GameError('En el puesto no caben más de 3 empleados.');
    s.candidates = s.candidates.filter((x) => x.id !== candidateId);
    s.employees.push({ id: c.id, name: c.name, speed: c.speed, quality: c.quality, wage: c.wage, morale: 65, hiredDay: s.day });
    teach(s, 'costo_laboral');
  });
}

export function fire(prev: GameState, employeeId: number): GameState {
  return mutate(prev, (s) => {
    const e = s.employees.find((x) => x.id === employeeId);
    if (!e) throw new GameError('Ese empleado no existe.');
    const severance = e.wage * SEVERANCE_DAYS;
    s.employees = s.employees.filter((x) => x.id !== employeeId);
    s.cash = round2(s.cash - severance);
    s.today.other += severance;
    s.today.notes.push(`Finiquito de ${e.name}: ${money(severance)}`);
    for (const other of s.employees) other.morale = Math.max(0, other.morale - 8);
  });
}

export function setWage(prev: GameState, employeeId: number, wage: number): GameState {
  return mutate(prev, (s) => {
    const e = s.employees.find((x) => x.id === employeeId);
    if (!e) throw new GameError('Ese empleado no existe.');
    const w = Math.round(wage / 10) * 10;
    if (w < e.wage) e.morale = Math.max(0, e.morale - 20);
    if (w > e.wage) e.morale = Math.min(100, e.morale + Math.min(20, ((w - e.wage) / e.wage) * 100));
    e.wage = w;
  });
}

export function markRead(prev: GameState, messageId: number): GameState {
  return mutate(prev, (s) => {
    const m = s.messages.find((x) => x.id === messageId);
    if (m) m.read = true;
  });
}

export function answer(prev: GameState, messageId: number, optionId: string): GameState {
  return mutate(prev, (s) => {
    const m = s.messages.find((x) => x.id === messageId);
    if (!m || !m.options || m.choice) throw new GameError('Ese mensaje ya no espera respuesta.');
    m.read = true;
    eventById(m.eventId ?? '')?.resolve?.(s, m, optionId);
    m.choice = optionId;
  });
}

export function pendingDecisions(s: GameState) {
  return s.messages.filter((m) => m.options && !m.choice);
}

/** Cuánto comprar para cubrir la demanda estimada de los próximos días. */
export function suggestPurchase(s: GameState, days = 1): Record<string, number> {
  const needs: Record<string, number> = {};
  const cap = capacity(s);
  const active = s.menu.filter((m) => m.active);
  const platos = active.filter((m) => DISH_MAP[m.dishId].category === 'plato');
  const drinks = active.filter((m) => DISH_MAP[m.dishId].category === 'bebida');
  const totalAppeal = platos.reduce((a, m) => a + dishAppeal(m.dishId, m.price), 0);
  for (let d = 0; d < days; d++) {
    const day = s.day + d;
    const weather = d === 0 ? s.forecast : 'soleado';
    // Se atienden como máximo los clientes que da tu capacidad.
    const customers = Math.min(expectedCustomers(s, day, weather) * 1.1, cap / 1.1);
    for (const m of platos) {
      const portions = (customers * dishAppeal(m.dishId, m.price)) / totalAppeal;
      for (const [ing, q] of Object.entries(DISH_MAP[m.dishId].recipe)) needs[ing] = (needs[ing] ?? 0) + q * portions;
    }
    for (const m of drinks) {
      const portions = customers * drinkProbability(m.price, DISH_MAP[m.dishId].refPrice, weather);
      for (const [ing, q] of Object.entries(DISH_MAP[m.dishId].recipe)) needs[ing] = (needs[ing] ?? 0) + q * portions;
    }
    for (const o of s.specialOrders.filter((o) => o.day === day)) {
      for (const [ing, q] of Object.entries(DISH_MAP[o.dishId].recipe)) needs[ing] = (needs[ing] ?? 0) + q * o.qty;
    }
  }
  const result: Record<string, number> = {};
  const lastDay = s.day + days - 1;
  for (const [ing, need] of Object.entries(needs)) {
    const def = INGREDIENT_MAP[ing];
    // Solo cuenta lo que no va a caducar antes de usarse.
    const usable = s.inventory.filter((l) => l.ingredientId === ing && l.expiresDay >= Math.min(lastDay, s.day)).reduce((a, l) => a + l.qty, 0);
    // No conviene comprar algo que caduca antes de que termine el periodo.
    const coverDays = Math.min(days, def.shelfLife);
    const target = (need * coverDays) / days;
    const missing = target - usable;
    if (missing > 0) result[ing] = Math.ceil(missing / def.step) * def.step;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Simulación de un día
// ---------------------------------------------------------------------------

export function advanceDay(prev: GameState): GameState {
  if (prev.status !== 'jugando') return prev;
  const s = structuredClone(prev);
  const rng = new Rng(s);
  const day = s.day;
  const weather = s.forecast;

  // Decisiones que el jugador no respondió: se toma la opción por defecto.
  for (const m of pendingDecisions(s)) {
    const ev = eventById(m.eventId ?? '');
    const fallback = ev?.defaultOption ?? m.options![m.options!.length - 1].id;
    try {
      ev?.resolve?.(s, m, fallback);
    } catch {
      /* sin dinero para la opción: se ignora */
    }
    m.choice = fallback;
    m.read = true;
  }

  const report: DayReport = {
    day,
    weather,
    customers: 0,
    served: 0,
    lostStock: 0,
    lostCapacity: 0,
    itemsSold: {},
    revenue: 0,
    cogs: 0,
    waste: 0,
    wages: 0,
    fixed: FIXED_COST_PER_DAY,
    other: 0,
    purchases: 0,
    cashStart: s.today.cashStart,
    cashEnd: 0,
    reputationEnd: 0,
    satisfaction: 0,
    notes: [...s.today.notes],
  };

  const stock = stockMap(s);
  let capacityLeft = capacity(s);
  const qualityScore = teamQuality(s) / 20;

  // 1. Pedidos especiales del día: se preparan primero.
  for (const order of s.specialOrders.filter((o) => o.day === day)) {
    const workNeeded = order.qty * DISH_MAP[order.dishId].prepUnits * 0.6;
    const possible = Math.min(maxPortions(stock, order.dishId), Math.floor(capacityLeft / (DISH_MAP[order.dishId].prepUnits * 0.6)));
    if (possible >= order.qty) {
      report.cogs += consume(s, stock, order.dishId, order.qty);
      capacityLeft -= workNeeded;
      report.revenue += order.qty * order.unitPrice;
      report.itemsSold[order.dishId] = (report.itemsSold[order.dishId] ?? 0) + order.qty;
      report.notes.push(`Entregaste el pedido de ${order.client}: ${order.qty} piezas por ${money(order.qty * order.unitPrice)}.`);
      s.reputation = Math.min(100, s.reputation + 3);
    } else {
      s.reputation = Math.max(0, s.reputation - 10);
      report.notes.push(`No pudiste cumplir el pedido de ${order.client} (faltaron ingredientes o manos). Tu reputación bajó.`);
      addMessage(s, {
        kind: 'evento',
        from: order.client,
        subject: 'Nos quedó mal con el pedido',
        body: 'Contábamos con usted para la comida del personal y no nos cumplió. No volveremos a pedirle.',
      });
    }
  }
  s.specialOrders = s.specialOrders.filter((o) => o.day > day);

  // 2. Llegan los clientes.
  const active = s.menu.filter((m) => m.active);
  const platos = active.filter((m) => DISH_MAP[m.dishId].category === 'plato');
  const drink = active.find((m) => DISH_MAP[m.dishId].category === 'bebida');
  const customers = Math.max(0, Math.round(expectedCustomers(s, day, weather) * rng.range(0.85, 1.15)));
  report.customers = customers;
  let satisfactionSum = 0;
  const appeals = platos.map((m) => dishAppeal(m.dishId, m.price));

  for (let i = 0; i < customers; i++) {
    let choice = rng.weighted(platos, appeals)!;
    if (capacityLeft < DISH_MAP[choice.dishId].prepUnits) {
      report.lostCapacity++;
      satisfactionSum += 0.1;
      continue;
    }
    if (!canMake(stock, choice.dishId)) {
      // A veces el cliente acepta otra cosa del menú.
      const alternatives = platos.filter((m) => canMake(stock, m.dishId));
      if (alternatives.length && rng.chance(0.5)) {
        choice = rng.weighted(alternatives, alternatives.map((m) => dishAppeal(m.dishId, m.price)))!;
      } else {
        report.lostStock++;
        satisfactionSum += 0.15;
        continue;
      }
    }
    const dish = DISH_MAP[choice.dishId];
    report.cogs += consume(s, stock, dish.id);
    report.revenue += choice.price;
    capacityLeft -= dish.prepUnits;
    report.itemsSold[dish.id] = (report.itemsSold[dish.id] ?? 0) + 1;
    report.served++;
    let ratio = choice.price / dish.refPrice;
    if (drink && rng.chance(drinkProbability(drink.price, DISH_MAP[drink.dishId].refPrice, weather))) {
      const dd = DISH_MAP[drink.dishId];
      if (capacityLeft >= dd.prepUnits && canMake(stock, dd.id)) {
        report.cogs += consume(s, stock, dd.id);
        report.revenue += drink.price;
        capacityLeft -= dd.prepUnits;
        report.itemsSold[dd.id] = (report.itemsSold[dd.id] ?? 0) + 1;
        ratio = (ratio * 2 + drink.price / dd.refPrice) / 3;
      }
    }
    // Satisfacción: 60% calidad de la comida, 40% qué tan justo se siente el precio.
    const value = clamp(1.7 - ratio, 0, 1);
    satisfactionSum += 0.6 * qualityScore + 0.4 * value;
  }

  // 3. Caducidad: lo que ya no sirve se tira.
  const expiredNames = new Set(s.inventory.filter((l) => l.expiresDay <= day).map((l) => INGREDIENT_MAP[l.ingredientId].name.toLowerCase()));
  const waste = discardLots(s, (l) => l.expiresDay <= day);
  if (waste > 0) report.notes.push(`Se echó a perder: ${[...expiredNames].join(', ')} (${money(waste)}).`);
  report.waste = round2(waste + s.today.waste);

  // 4. Sueldos y gastos.
  report.wages = s.employees.reduce((a, e) => a + e.wage, 0);
  report.other = round2(s.today.other);
  report.purchases = round2(s.today.purchases);

  // Multa si se arriesgó sin permiso.
  if (s.flags.sinPermiso && rng.chance(0.08)) {
    s.flags.sinPermiso = 0;
    report.other += 4000;
    s.reputation = Math.max(0, s.reputation - 5);
    report.notes.push('Llegó un inspector y no tenías permiso vigente: multa de $4,000.');
    addMessage(s, {
      kind: 'evento',
      from: 'Ayuntamiento',
      subject: 'Multa por operar sin permiso',
      body: 'Durante la inspección de hoy se detectó que su permiso sanitario no está vigente. Se le aplica una multa de $4,000. Considere regularizarse.',
    });
    teach(s, 'cumplimiento');
  }

  report.revenue = round2(report.revenue);
  report.cogs = round2(report.cogs);
  s.cash = round2(s.cash + report.revenue - report.wages - report.fixed - (report.other - s.today.other));
  report.cashEnd = s.cash;

  // 5. Reputación.
  const satisfaction = customers > 0 ? (satisfactionSum / customers) * 100 : s.reputation;
  report.satisfaction = Math.round(satisfaction);
  s.reputation = clamp(s.reputation + 0.12 * (satisfaction - s.reputation), 0, 100);
  if (s.modifiers.some((m) => m.id === 'critico' && m.fromDay === day)) {
    const lost = report.lostStock + report.lostCapacity;
    if (teamQuality(s) >= 12 && lost <= 3 && report.served > 0) {
      s.reputation = Math.min(100, s.reputation + 10);
      report.notes.push('"El Antojólogo" quedó encantado y te recomendó en sus redes. ¡Tu reputación subió mucho!');
    } else {
      s.reputation = Math.max(0, s.reputation - 8);
      report.notes.push('"El Antojólogo" no quedó contento y lo dijo en sus redes. Tu reputación bajó.');
    }
  }
  report.reputationEnd = round2(s.reputation);

  // 6. Ánimo del personal.
  const overworked = report.lostCapacity > 8;
  for (const e of [...s.employees]) {
    const wageRatio = e.wage / marketWage(e.speed, e.quality);
    const target = clamp(60 + 60 * (wageRatio - 1) + (overworked ? -15 : 5), 0, 100);
    e.morale = clamp(e.morale + 0.25 * (target - e.morale), 0, 100);
    if (e.morale < 25 && rng.chance(0.2)) {
      s.employees = s.employees.filter((x) => x.id !== e.id);
      report.notes.push(`${e.name} renunció.`);
      addMessage(s, {
        kind: 'personal',
        from: e.name,
        subject: 'Renuncio',
        body: 'Jefe, ya no aguanto. Me ofrecieron algo mejor y me voy. Gracias por la oportunidad.',
      });
      teach(s, 'reputacion');
    }
  }

  s.reports.push(report);

  // 7. Lecciones según lo que pasó.
  if (report.waste > 0) teach(s, 'merma');
  if (report.lostStock > 0) teach(s, 'venta_perdida');
  if (report.lostCapacity > 5) teach(s, 'capacidad');
  const profit = report.revenue - report.cogs - report.waste - report.wages - report.fixed - report.other;
  if (Math.abs(report.cashEnd - report.cashStart - profit) > 800) teach(s, 'flujo');
  if (day >= 10) teach(s, 'reputacion');

  // 8. Cierre de semana.
  if (day % 7 === 0) {
    const weeks = reportsByWeek(s.reports);
    const w = summarize(weeks[weeks.length - 1]);
    addMessage(s, {
      kind: 'sistema',
      from: 'Reporte semanal',
      subject: `Semana ${weeks.length}: utilidad neta ${money(w.netProfit)}`,
      body:
        `Atendiste ${w.served} clientes y se te fueron ${w.lost}.\n\n` +
        `[[ventas|Ventas]]: ${money(w.revenue)}\n` +
        `[[costo_ventas|Costo de ventas]]: ${money(w.cogs)}\n` +
        `[[utilidad_bruta|Utilidad bruta]]: ${money(w.grossProfit)} (${Math.round(w.grossMargin * 100)}% de [[margen_bruto|margen]])\n` +
        `[[merma|Mermas]]: ${money(w.waste)}\n` +
        `Sueldos: ${money(w.wages)}\n` +
        `Renta y servicios: ${money(w.fixed)}\n` +
        `Otros: ${money(w.other)}\n` +
        `[[utilidad_neta|Utilidad neta]]: ${money(w.netProfit)}\n\n` +
        `Caja al inicio: ${money(w.cashStart)} → al final: ${money(w.cashEnd)}`,
    });
    if (weeks.length === 1) teach(s, 'estado_resultados');
    if (weeks.length === 2) teach(s, 'punto_equilibrio');
  }

  // 9. Quiebra.
  if (s.cash < 0) {
    s.negativeDays++;
    if (s.negativeDays >= 3) {
      s.status = 'quiebra';
      addMessage(s, {
        kind: 'mentor',
        from: 'Don Ramiro (tu contador)',
        subject: 'Tuvimos que cerrar',
        body:
          'Tres días seguidos sin dinero para pagar. Ya no hay forma de sostener el puesto. ' +
          'No te desanimes: casi todos los empresarios que conozco fracasaron al menos una vez. Revisa tus números y vuelve a intentarlo.',
      });
    } else {
      addMessage(s, {
        kind: 'mentor',
        from: 'Don Ramiro (tu contador)',
        subject: '¡Tu caja está en números rojos!',
        body: `No tienes efectivo para cubrir tus gastos. Si sigues así ${3 - s.negativeDays} día(s) más, vas a tener que cerrar. Recorta gastos o vende más ya.`,
      });
    }
  } else {
    s.negativeDays = 0;
  }

  checkObjectives(s);

  // 10. Preparar el día siguiente.
  s.day = day + 1;
  for (const id of Object.keys(s.marketFactor)) {
    const f = s.marketFactor[id];
    s.marketFactor[id] = clamp(f + INGREDIENT_MAP[id].volatility * rng.normal() - 0.15 * (f - 1), 0.75, 1.4);
  }
  s.modifiers = s.modifiers.filter((m) => m.toDay >= s.day);
  s.forecast = rollWeather(rng);
  if (day % 7 === 0) refreshCandidates(s, rng);
  s.today = { cashStart: s.cash, purchases: 0, other: 0, waste: 0, notes: [] };
  if (s.status === 'jugando') maybeStartEvent(s, rng);
  return s;
}

/** Texto corto con la fecha del juego. */
export function dateLabel(day: number): string {
  return `${WEEKDAYS[(day - 1) % 7]} · Día ${day} · Semana ${Math.floor((day - 1) / 7) + 1}`;
}

export const weatherLabel = (w: Weather) => WEATHER[w].label;
export { priceIndex };
