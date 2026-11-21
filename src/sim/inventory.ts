import { DISH_MAP, INGREDIENT_MAP } from './data';
import { newId, round2 } from './helpers';
import type { GameState } from './types';

const EPS = 1e-6;

export function addLot(s: GameState, ingredientId: string, qty: number, unitCost: number): void {
  const def = INGREDIENT_MAP[ingredientId];
  s.inventory.push({
    id: newId(s),
    ingredientId,
    qty,
    unitCost,
    boughtDay: s.day,
    expiresDay: s.day + def.shelfLife - 1,
  });
}

/** Existencias actuales por ingrediente. */
export function stockMap(s: GameState): Record<string, number> {
  const map: Record<string, number> = {};
  for (const lot of s.inventory) map[lot.ingredientId] = (map[lot.ingredientId] ?? 0) + lot.qty;
  return map;
}

export function canMake(stock: Record<string, number>, dishId: string, portions = 1): boolean {
  for (const [ing, qty] of Object.entries(DISH_MAP[dishId].recipe)) {
    if ((stock[ing] ?? 0) + EPS < qty * portions) return false;
  }
  return true;
}

/** Cuántas porciones completas se pueden preparar con lo que hay. */
export function maxPortions(stock: Record<string, number>, dishId: string): number {
  let max = Infinity;
  for (const [ing, qty] of Object.entries(DISH_MAP[dishId].recipe)) {
    max = Math.min(max, Math.floor(((stock[ing] ?? 0) + EPS) / qty));
  }
  return max === Infinity ? 0 : max;
}

/**
 * Descuenta los ingredientes de N porciones, usando primero los lotes que caducan antes (PEPS).
 * Devuelve el costo de lo consumido. Supone que ya se revisó con canMake.
 */
export function consume(s: GameState, stock: Record<string, number>, dishId: string, portions = 1): number {
  let cost = 0;
  for (const [ing, perPortion] of Object.entries(DISH_MAP[dishId].recipe)) {
    let needed = perPortion * portions;
    const lots = s.inventory.filter((l) => l.ingredientId === ing).sort((a, b) => a.expiresDay - b.expiresDay || a.id - b.id);
    for (const lot of lots) {
      if (needed <= EPS) break;
      const take = Math.min(lot.qty, needed);
      lot.qty -= take;
      needed -= take;
      cost += take * lot.unitCost;
    }
    stock[ing] = (stock[ing] ?? 0) - perPortion * portions;
  }
  s.inventory = s.inventory.filter((l) => l.qty > EPS);
  return cost;
}

/** Quita los lotes que cumplan la condición y devuelve su costo (merma). */
export function discardLots(s: GameState, predicate: (lot: GameState['inventory'][number]) => boolean): number {
  let cost = 0;
  s.inventory = s.inventory.filter((lot) => {
    if (predicate(lot)) {
      cost += lot.qty * lot.unitCost;
      return false;
    }
    return true;
  });
  return round2(cost);
}
