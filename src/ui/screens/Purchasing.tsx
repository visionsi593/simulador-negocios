import { useState } from 'react';
import type { Act } from '../../App';
import { INGREDIENTS } from '../../sim/data';
import { buyMany, suggestPurchase } from '../../sim/engine';
import { marketPrice, round2, stockOf } from '../../sim/helpers';
import type { GameState } from '../../sim/types';
import { money, qty } from '../format';
import { Term } from '../RichText';

export function Purchasing({ game, act }: { game: GameState; act: Act }) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const total = round2(Object.entries(cart).reduce((a, [id, q]) => a + q * marketPrice(game, id), 0));
  const setQty = (id: string, q: number) => setCart((c) => ({ ...c, [id]: Math.max(0, round2(q)) }));

  const lotsValue = game.inventory.reduce((a, l) => a + l.qty * l.unitCost, 0);

  return (
    <div className="panel">
      <h2>Compras e inventario</h2>
      <p className="muted">
        Compras al precio de hoy. Todo lo perecedero tiene <Term id="vida_util">vida útil</Term>: lo que no uses a tiempo se convierte en{' '}
        <Term id="merma">merma</Term>. Tu <Term id="inventario">inventario</Term> vale hoy {money(lotsValue)}.
      </p>
      <div className="toolbar">
        <button onClick={() => setCart(suggestPurchase(game, 1))}>Compra sugerida para hoy</button>
        <button onClick={() => setCart(suggestPurchase(game, 2))}>Sugerida para 2 días</button>
        <button onClick={() => setCart({})}>Vaciar</button>
        <span className="spacer" />
        <span className="cart-total">
          Total: <strong>{money(total, 2)}</strong> · Caja: {money(game.cash)}
        </span>
        <button
          className="primary"
          disabled={total <= 0}
          onClick={() => {
            if (act((s) => buyMany(s, cart))) setCart({});
          }}
        >
          Comprar
        </button>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Ingrediente</th>
            <th className="num">Precio hoy</th>
            <th className="num">Vs. normal</th>
            <th className="num">En inventario</th>
            <th>Caducidad</th>
            <th className="num">Vida útil</th>
            <th>Comprar</th>
            <th className="num">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {INGREDIENTS.map((ing) => {
            const price = marketPrice(game, ing.id);
            const change = price / ing.basePrice - 1;
            const lots = game.inventory.filter((l) => l.ingredientId === ing.id).sort((a, b) => a.expiresDay - b.expiresDay);
            const q = cart[ing.id] ?? 0;
            return (
              <tr key={ing.id}>
                <td>
                  <strong>{ing.name}</strong>
                </td>
                <td className="num">
                  {money(price, 2)} / {ing.unit}
                </td>
                <td className={'num ' + (change > 0.05 ? 'neg' : change < -0.05 ? 'pos' : 'muted')}>
                  {change >= 0 ? '+' : ''}
                  {Math.round(change * 100)}%
                </td>
                <td className="num">{qty(stockOf(game, ing.id), ing.unit)}</td>
                <td className="small">
                  {lots.length === 0 && <span className="muted">—</span>}
                  {lots.map((l) => {
                    const left = l.expiresDay - game.day;
                    return (
                      <div key={l.id} className={left <= 0 ? 'warn-text' : ''}>
                        {qty(Math.round(l.qty * 100) / 100, ing.unit)}: {left <= 0 ? 'caduca hoy' : left === 1 ? 'caduca mañana' : `${left + 1} días`}
                      </div>
                    );
                  })}
                </td>
                <td className="num">{ing.shelfLife >= 365 ? 'Larga' : `${ing.shelfLife} día${ing.shelfLife > 1 ? 's' : ''}`}</td>
                <td>
                  <div className="qty-input">
                    <button onClick={() => setQty(ing.id, q - ing.step)} aria-label="Menos">−</button>
                    <input type="number" min={0} step={ing.step} value={q} onChange={(e) => setQty(ing.id, Number(e.target.value) || 0)} />
                    <button onClick={() => setQty(ing.id, q + ing.step)} aria-label="Más">+</button>
                    <span className="muted small">{ing.unit}</span>
                  </div>
                </td>
                <td className="num">{q > 0 ? money(q * price, 2) : ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="callout">
        La compra sugerida es un <Term id="pronostico">pronóstico</Term>: estima tus clientes según el día, el clima, tu reputación y tus precios, y no compra más de lo
        que tu equipo alcanza a preparar. No es perfecta: los días de feria o de pedidos especiales tendrás que ajustar tú.
      </div>
    </div>
  );
}
