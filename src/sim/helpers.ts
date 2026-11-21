import { DISH_MAP, INGREDIENT_MAP, OWNER_CAPACITY, OWNER_QUALITY, WEATHER, WEEKDAY_DEMAND } from './data';
import type { DayReport, GameState, Message, Weather } from './types';

export const round2 = (n: number) => Math.round(n * 100) / 100;
export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export class GameError extends Error {}

export function newId(s: GameState): number {
  return s.nextId++;
}

export function weekday(day: number): number {
  return (day - 1) % 7;
}

export function weekOf(day: number): number {
  return Math.floor((day - 1) / 7) + 1;
}

export function addMessage(s: GameState, m: Omit<Message, 'id' | 'day' | 'read'>): Message {
  const msg: Message = { ...m, id: newId(s), day: s.day, read: false };
  s.messages.unshift(msg);
  return msg;
}

export function activeModifiers(s: GameState, day: number) {
  return s.modifiers.filter((m) => m.fromDay <= day && day <= m.toDay);
}

export function marketPrice(s: GameState, ingredientId: string, day = s.day): number {
  const def = INGREDIENT_MAP[ingredientId];
  let factor = s.marketFactor[ingredientId] ?? 1;
  for (const m of activeModifiers(s, day)) {
    if (m.ingredient === ingredientId && m.priceFactor) factor *= m.priceFactor;
  }
  return round2(def.basePrice * factor);
}

export function stockOf(s: GameState, ingredientId: string): number {
  let total = 0;
  for (const lot of s.inventory) if (lot.ingredientId === ingredientId) total += lot.qty;
  return Math.round(total * 1000) / 1000;
}

/** Costo de una porción con los precios de mercado de hoy. */
export function dishCost(s: GameState, dishId: string): number {
  const dish = DISH_MAP[dishId];
  let cost = 0;
  for (const [ing, qty] of Object.entries(dish.recipe)) cost += qty * marketPrice(s, ing);
  return round2(cost);
}

export function marketWage(speed: number, quality: number): number {
  return Math.round((150 + 8 * (speed + quality)) / 10) * 10;
}

function employeeCapacity(speed: number, morale: number): number {
  return speed * 2.6 * (0.7 + 0.3 * (morale / 100));
}

/** Unidades de trabajo disponibles en un día (dueño + empleados). */
export function capacity(s: GameState): number {
  let total = OWNER_CAPACITY;
  for (const e of s.employees) total += employeeCapacity(e.speed, e.morale);
  return Math.round(total);
}

/** Calidad promedio del equipo, de 1 a 20, ponderada por cuánto trabaja cada uno. */
export function teamQuality(s: GameState): number {
  let weight = OWNER_CAPACITY;
  let sum = OWNER_QUALITY * OWNER_CAPACITY;
  for (const e of s.employees) {
    const w = employeeCapacity(e.speed, e.morale);
    const q = e.quality * (0.85 + 0.15 * (e.morale / 100));
    weight += w;
    sum += q * w;
  }
  return round2(sum / weight);
}

/** Qué tan caros estamos frente a la competencia (1 = igual). */
export function priceIndex(s: GameState): number {
  const platos = s.menu.filter((m) => m.active && DISH_MAP[m.dishId].category === 'plato');
  if (platos.length === 0) return 1;
  const ratios = platos.map((m) => m.price / DISH_MAP[m.dishId].refPrice);
  return ratios.reduce((a, b) => a + b, 0) / ratios.length;
}

/** Clientes esperados para un día, sin la parte aleatoria. */
export function expectedCustomers(s: GameState, day: number, weather: Weather): number {
  const platos = s.menu.filter((m) => m.active && DISH_MAP[m.dishId].category === 'plato');
  if (platos.length === 0) return 0;
  const base = WEEKDAY_DEMAND[weekday(day)];
  const reputationFactor = 0.6 + 0.8 * (s.reputation / 100);
  const priceFactor = clamp(1 - 1.3 * (priceIndex(s) - 1), 0.3, 1.4);
  const variety = [0, 0.75, 0.9, 1][Math.min(platos.length, 3)];
  let modifier = 1;
  for (const m of activeModifiers(s, day)) if (m.demand) modifier *= m.demand;
  return base * WEATHER[weather].demand * reputationFactor * priceFactor * variety * modifier;
}

/** Peso con que un cliente elige un platillo según su precio. */
export function dishAppeal(dishId: string, price: number): number {
  const dish = DISH_MAP[dishId];
  return dish.popularity * Math.exp(-2.5 * (price / dish.refPrice - 1));
}

export function drinkProbability(price: number, refPrice: number, weather: Weather): number {
  return clamp(0.35 * WEATHER[weather].drinks * Math.exp(-2 * (price / refPrice - 1)), 0, 0.9);
}

export interface PeriodSummary {
  days: number;
  customers: number;
  served: number;
  lost: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMargin: number;
  waste: number;
  wages: number;
  fixed: number;
  other: number;
  netProfit: number;
  purchases: number;
  cashStart: number;
  cashEnd: number;
}

/** Suma un grupo de días en un estado de resultados y un flujo de efectivo. */
export function summarize(reports: DayReport[]): PeriodSummary {
  const sum = (f: (r: DayReport) => number) => round2(reports.reduce((a, r) => a + f(r), 0));
  const revenue = sum((r) => r.revenue);
  const cogs = sum((r) => r.cogs);
  const grossProfit = round2(revenue - cogs);
  const waste = sum((r) => r.waste);
  const wages = sum((r) => r.wages);
  const fixed = sum((r) => r.fixed);
  const other = sum((r) => r.other);
  return {
    days: reports.length,
    customers: sum((r) => r.customers),
    served: sum((r) => r.served),
    lost: sum((r) => r.lostStock + r.lostCapacity),
    revenue,
    cogs,
    grossProfit,
    grossMargin: revenue > 0 ? grossProfit / revenue : 0,
    waste,
    wages,
    fixed,
    other,
    netProfit: round2(grossProfit - waste - wages - fixed - other),
    purchases: sum((r) => r.purchases),
    cashStart: reports.length ? reports[0].cashStart : 0,
    cashEnd: reports.length ? reports[reports.length - 1].cashEnd : 0,
  };
}

/** Reportes agrupados por semana: [semana 1, semana 2, ...]. */
export function reportsByWeek(reports: DayReport[]): DayReport[][] {
  const weeks: DayReport[][] = [];
  for (const r of reports) {
    const w = weekOf(r.day) - 1;
    (weeks[w] ??= []).push(r);
  }
  return weeks;
}
