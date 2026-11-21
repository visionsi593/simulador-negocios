import { useState } from 'react';
import type { Act } from '../../App';
import { DISH_MAP, INGREDIENT_MAP } from '../../sim/data';
import { setPrice, toggleDish } from '../../sim/engine';
import { dishCost, marketPrice } from '../../sim/helpers';
import type { GameState } from '../../sim/types';
import { money, pct, qty } from '../format';
import { Term } from '../RichText';

function PriceInput({ value, onCommit }: { value: number; onCommit: (v: number) => void }) {
  const [draft, setDraft] = useState(String(value));
  const commit = () => {
    const n = Number(draft);
    if (n > 0 && n !== value) onCommit(n);
    else setDraft(String(value));
  };
  return (
    <div className="price-input">
      <button onClick={() => onCommit(value - 1)} aria-label="Bajar precio">−</button>
      <input
        type="number"
        min={1}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
      />
      <button onClick={() => onCommit(value + 1)} aria-label="Subir precio">+</button>
    </div>
  );
}

export function MenuScreen({ game, act }: { game: GameState; act: Act }) {
  const last = game.reports[game.reports.length - 1];
  return (
    <div className="panel">
      <h2>Menú y precios</h2>
      <p className="muted">
        El <Term id="costeo_receta">costo</Term> se calcula con los precios del mercado de hoy. Un <Term id="margen_bruto">margen bruto</Term> sano en comida está entre 55% y 70%.
      </p>
      <table className="table">
        <thead>
          <tr>
            <th>Activo</th>
            <th>Platillo</th>
            <th>Receta (por porción)</th>
            <th className="num">Costo</th>
            <th className="num">Competencia</th>
            <th>Tu precio</th>
            <th className="num">Ganancia por pieza</th>
            <th className="num">Margen</th>
            <th className="num">Vendidos ayer</th>
          </tr>
        </thead>
        <tbody>
          {game.menu.map((m) => {
            const dish = DISH_MAP[m.dishId];
            const cost = dishCost(game, m.dishId);
            const margin = (m.price - cost) / m.price;
            const ratio = m.price / dish.refPrice;
            return (
              <tr key={m.dishId} className={m.active ? '' : 'inactive'}>
                <td>
                  <input type="checkbox" checked={m.active} onChange={() => act((s) => toggleDish(s, m.dishId))} aria-label={`Activar ${dish.name}`} />
                </td>
                <td>
                  <strong>{dish.name}</strong>
                  <div className="muted small">{dish.description}</div>
                </td>
                <td className="small">
                  {Object.entries(dish.recipe).map(([ing, q]) => (
                    <div key={ing}>
                      {qty(q, INGREDIENT_MAP[ing].unit)} {INGREDIENT_MAP[ing].name.toLowerCase()}{' '}
                      <span className="muted">({money(q * marketPrice(game, ing), 2)})</span>
                    </div>
                  ))}
                </td>
                <td className="num">{money(cost, 2)}</td>
                <td className="num">{money(dish.refPrice)}</td>
                <td>
                  <PriceInput key={m.price} value={m.price} onCommit={(v) => act((s) => setPrice(s, m.dishId, v))} />
                  {ratio > 1.15 && <div className="small warn-text">Más caro que la competencia</div>}
                  {ratio < 0.85 && <div className="small warn-text">Más barato que la competencia</div>}
                </td>
                <td className="num">{money(m.price - cost, 2)}</td>
                <td className={'num ' + (margin < 0.4 ? 'neg' : margin >= 0.55 ? 'pos' : '')}>{pct(margin)}</td>
                <td className="num">{last?.itemsSold[m.dishId] ?? 0}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="callout">
        <strong>Tip de Don Ramiro:</strong> si subes el precio, ganas más por pieza, pero llegan menos clientes (<Term id="elasticidad">elasticidad</Term>) y tu{' '}
        <Term id="reputacion">reputación</Term> sufre si la gente siente que es caro. Si quitas platillos del menú, también llegan menos clientes: la gente quiere opciones.
      </div>
    </div>
  );
}
