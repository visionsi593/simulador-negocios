import { describe, expect, it } from 'vitest';
import { advanceDay, answer, buy, buyMany, fire, hire, newGame, pendingDecisions, setPrice, suggestPurchase } from './engine';
import { dishCost, marketPrice, stockOf } from './helpers';
import type { GameState } from './types';

const SEED = 12345;

function playDays(s: GameState, days: number, buyEachDay = true): GameState {
  for (let i = 0; i < days; i++) {
    for (const m of pendingDecisions(s)) s = answer(s, m.id, m.options![m.options!.length - 1].id);
    if (buyEachDay) {
      const cart = suggestPurchase(s, 1);
      if (Object.keys(cart).length) s = buyMany(s, cart);
    }
    s = advanceDay(s);
  }
  return s;
}

describe('motor de simulación', () => {
  it('empieza con dinero, sin inventario y con mensajes del mentor', () => {
    const s = newGame('Prueba', SEED);
    expect(s.cash).toBe(15000);
    expect(s.inventory).toHaveLength(0);
    expect(s.messages.some((m) => m.kind === 'mentor')).toBe(true);
    expect(s.candidates).toHaveLength(3);
  });

  it('es reproducible: misma semilla y mismas decisiones dan el mismo resultado', () => {
    const a = playDays(newGame('A', SEED), 20);
    const b = playDays(newGame('A', SEED), 20);
    expect(a.cash).toBe(b.cash);
    expect(a.reports).toEqual(b.reports);
  });

  it('comprar descuenta efectivo y agrega inventario', () => {
    const s = newGame('Prueba', SEED);
    const price = marketPrice(s, 'carne');
    const after = buy(s, 'carne', 5);
    expect(after.cash).toBeCloseTo(15000 - 5 * price, 2);
    expect(stockOf(after, 'carne')).toBe(5);
    expect(s.inventory).toHaveLength(0); // el estado original no cambia
  });

  it('no deja comprar más de lo que alcanza', () => {
    const s = newGame('Prueba', SEED);
    expect(() => buy(s, 'carne', 1000)).toThrow(/No te alcanza/);
  });

  it('sin ingredientes no hay ventas y todos los clientes se pierden', () => {
    const s = advanceDay(newGame('Prueba', SEED));
    const r = s.reports[0];
    expect(r.served).toBe(0);
    expect(r.revenue).toBe(0);
    expect(r.lostStock).toBe(r.customers);
    expect(s.lessonsSeen).toContain('venta_perdida');
  });

  it('cuadra la caja: inicio + ventas − compras − sueldos − fijos − otros = final', () => {
    let s = newGame('Prueba', SEED);
    s = hire(s, s.candidates[0].id);
    s = playDays(s, 30);
    for (const r of s.reports) {
      expect(r.cashEnd).toBeCloseTo(r.cashStart + r.revenue - r.purchases - r.wages - r.fixed - r.other, 1);
    }
  });

  it('el costo de ventas corresponde al costo de lo vendido', () => {
    let s = newGame('Prueba', SEED);
    s = buyMany(s, { tortilla: 300, carne: 10, verdura: 5, queso: 5, bolillo: 30, fruta: 5, azucar: 2 });
    const costs = Object.fromEntries(s.menu.map((m) => [m.dishId, dishCost(s, m.dishId)]));
    s = advanceDay(s);
    const r = s.reports[0];
    const expected = Object.entries(r.itemsSold).reduce((a, [id, n]) => a + costs[id] * n, 0);
    expect(r.cogs).toBeCloseTo(expected, 0);
    expect(r.served).toBeGreaterThan(0);
  });

  it('lo que caduca se registra como merma', () => {
    let s = newGame('Prueba', SEED);
    s = buy(s, 'bolillo', 500); // el bolillo dura un día: casi todo se tira
    s = advanceDay(s);
    expect(s.reports[0].waste).toBeGreaterThan(0);
    expect(stockOf(s, 'bolillo')).toBe(0);
    expect(s.lessonsSeen).toContain('merma');
  });

  it('usa primero el lote que caduca antes (PEPS)', () => {
    let s = newGame('Prueba', SEED);
    s = buy(s, 'azucar', 2);
    s = advanceDay(s);
    s = buy(s, 'azucar', 2);
    s = buyMany(s, { fruta: 10, tortilla: 100, carne: 3, verdura: 2 });
    s = advanceDay(s);
    const lots = s.inventory.filter((l) => l.ingredientId === 'azucar');
    // Si se vendió agua, el lote viejo se consumió antes que el nuevo.
    if (lots.length === 2) expect(lots[0].qty).toBeLessThan(lots[1].qty + 1e-9);
    else expect(lots.every((l) => l.boughtDay === 2)).toBe(true);
  });

  it('subir mucho los precios reduce los clientes', () => {
    const base = playDays(newGame('Prueba', SEED), 1);
    let caro = newGame('Prueba', SEED);
    for (const m of caro.menu) caro = setPrice(caro, m.dishId, m.price * 1.6);
    caro = playDays(caro, 1);
    expect(caro.reports[0].customers).toBeLessThan(base.reports[0].customers);
  });

  it('despedir cuesta un finiquito', () => {
    let s = newGame('Prueba', SEED);
    const c = s.candidates[0];
    s = hire(s, c.id);
    const cash = s.cash;
    s = fire(s, c.id);
    expect(s.cash).toBe(cash - c.wage * 3);
    expect(s.employees).toHaveLength(0);
  });

  it('una partida larga avanza objetivos sin errores', () => {
    const s = playDays(newGame('Prueba', SEED), 60);
    expect(s.reports).toHaveLength(60);
    expect(s.objectiveIndex).toBeGreaterThanOrEqual(2);
    expect(Number.isFinite(s.cash)).toBe(true);
  });

  it('se puede guardar y cargar como JSON', () => {
    const s = playDays(newGame('Prueba', SEED), 10);
    const loaded = JSON.parse(JSON.stringify(s)) as GameState;
    expect(advanceDay(loaded)).toEqual(advanceDay(s));
  });
});
