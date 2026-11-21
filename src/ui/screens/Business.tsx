import { DISH_MAP, WEATHER } from '../../sim/data';
import { weatherLabel } from '../../sim/engine';
import { activeModifiers, capacity, expectedCustomers } from '../../sim/helpers';
import type { GameState } from '../../sim/types';
import { money } from '../format';
import { StallView } from '../StallView';
import { Term } from '../RichText';

export function Business({ game }: { game: GameState }) {
  const last = game.reports[game.reports.length - 1];
  const expected = Math.round(expectedCustomers(game, game.day, game.forecast));
  const cap = capacity(game);
  const mods = activeModifiers(game, game.day).concat(game.modifiers.filter((m) => m.fromDay > game.day));
  const orders = game.specialOrders;

  return (
    <div className="business">
      <div className="panel">
        <h2>{game.businessName}</h2>
        <p className="muted small">
          {last ? `Así se vio ayer (${weatherLabel(last.weather).toLowerCase()}). Los clientes con "?" no encontraron lo que querían; los de "!" se cansaron de la fila.` : 'Tu puesto, listo para abrir.'}
        </p>
        <StallView report={last} staff={game.employees.length} name={game.businessName} weather={last?.weather ?? game.forecast} />
      </div>
      <div className="grid2">
        <div className="panel">
          <h3>Pronóstico para hoy</h3>
          <ul className="plain">
            <li>
              Clima: <strong>{weatherLabel(game.forecast)}</strong>
              {WEATHER[game.forecast].drinks > 1.2 && ' · Se van a vender más aguas frescas'}
              {game.forecast === 'lluvia' && ' · Va a llegar menos gente'}
            </li>
            <li>
              <Term id="demanda">Demanda</Term> estimada: <strong>~{expected} clientes</strong>
            </li>
            <li>
              Tu <Term id="capacidad">capacidad</Term>: <strong>~{cap} órdenes</strong>
              {expected * 1.1 > cap && <span className="warn-text"> · Es probable que no te des abasto</span>}
            </li>
            {mods.map((m) => (
              <li key={m.id + m.fromDay}>
                {m.label} {m.fromDay > game.day ? `(día ${m.fromDay})` : '(hoy)'}
              </li>
            ))}
            {orders.map((o) => (
              <li key={o.id}>
                Pedido especial para el día {o.day}: {o.qty} × {DISH_MAP[o.dishId].name.toLowerCase()} ({money(o.qty * o.unitPrice)})
              </li>
            ))}
          </ul>
        </div>
        <div className="panel">
          <h3>Ayer</h3>
          {last ? (
            <ul className="plain">
              <li>
                Clientes: <strong>{last.served}</strong> atendidos de {last.customers}
              </li>
              <li>
                Ventas: <strong>{money(last.revenue)}</strong>
              </li>
              <li>Satisfacción: {last.satisfaction}/100</li>
              {last.lostStock > 0 && <li className="warn-text">{last.lostStock} se fueron porque faltaron ingredientes</li>}
              {last.lostCapacity > 0 && <li className="warn-text">{last.lostCapacity} se fueron por la fila</li>}
            </ul>
          ) : (
            <p className="muted">Aún no hay datos.</p>
          )}
        </div>
      </div>
    </div>
  );
}
