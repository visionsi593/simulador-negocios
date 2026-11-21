import type { Act } from '../../App';
import { OWNER_CAPACITY, OWNER_QUALITY, SEVERANCE_DAYS } from '../../sim/data';
import { fire, hire, setWage } from '../../sim/engine';
import { capacity, marketWage, teamQuality } from '../../sim/helpers';
import type { GameState, Person } from '../../sim/types';
import { money } from '../format';
import { Term } from '../RichText';

function Attr({ label, value }: { label: string; value: number }) {
  return (
    <div className="attr">
      <span className="attr-label">{label}</span>
      <span className="attr-bar">
        <span style={{ width: `${(value / 20) * 100}%` }} />
      </span>
      <span className="attr-value">{value}</span>
    </div>
  );
}

function wageNote(p: Person, candidate = false) {
  const ref = marketWage(p.speed, p.quality);
  const diff = p.wage / ref - 1;
  if (candidate) {
    if (diff > 0.05) return <span className="warn-text small">Pide {Math.round(diff * 100)}% más de lo que se paga en la zona</span>;
    if (diff < -0.05) return <span className="pos small">Pide {Math.round(-diff * 100)}% menos de lo que se paga en la zona</span>;
    return <span className="muted small">Pide el sueldo de mercado ({money(ref)})</span>;
  }
  // Para un empleado: pagar arriba del mercado lo motiva, pagar abajo lo desanima.
  if (diff > 0.05) return <span className="pos small">{Math.round(diff * 100)}% arriba del mercado: está motivado</span>;
  if (diff < -0.05) return <span className="neg small">{Math.round(-diff * 100)}% abajo del mercado: le baja el ánimo</span>;
  return <span className="muted small">Sueldo de mercado</span>;
}

export function Staff({ game, act }: { game: GameState; act: Act }) {
  const payroll = game.employees.reduce((a, e) => a + e.wage, 0);
  return (
    <div className="staff">
      <div className="panel">
        <h2>Tu equipo</h2>
        <div className="kpis">
          <div className="kpi">
            <span className="label">
              <Term id="capacidad">Capacidad</Term>
            </span>
            <span className="value">
              {capacity(game)} <small>órdenes/día</small>
            </span>
          </div>
          <div className="kpi">
            <span className="label">Calidad del equipo</span>
            <span className="value">
              {teamQuality(game).toFixed(1)} <small>/ 20</small>
            </span>
          </div>
          <div className="kpi">
            <span className="label">
              <Term id="costo_laboral">Nómina diaria</Term>
            </span>
            <span className="value">{money(payroll)}</span>
          </div>
        </div>
        <div className="cards">
          <div className="person owner">
            <h3>Tú (dueño)</h3>
            <p className="muted small">Preparas unas {OWNER_CAPACITY} órdenes al día. No cobras sueldo: lo tuyo es la utilidad.</p>
            <Attr label="Calidad" value={OWNER_QUALITY} />
          </div>
          {game.employees.map((e) => (
            <div key={e.id} className="person">
              <h3>{e.name}</h3>
              <p className="muted small">Contratado el día {e.hiredDay}</p>
              <Attr label="Rapidez" value={e.speed} />
              <Attr label="Calidad" value={e.quality} />
              <div className="attr">
                <span className="attr-label">Ánimo</span>
                <span className={'attr-bar morale ' + (e.morale < 35 ? 'low' : e.morale < 60 ? 'mid' : 'high')}>
                  <span style={{ width: `${e.morale}%` }} />
                </span>
                <span className="attr-value">{Math.round(e.morale)}</span>
              </div>
              <p>
                Sueldo: <strong>{money(e.wage)}/día</strong>
                <br />
                {wageNote(e)}
              </p>
              <div className="row">
                <button onClick={() => act((s) => setWage(s, e.id, e.wage * 1.1))}>Subir 10%</button>
                <button
                  className="danger"
                  onClick={() => {
                    if (confirm(`¿Despedir a ${e.name}? Tendrás que pagar ${money(e.wage * SEVERANCE_DAYS)} de finiquito.`)) act((s) => fire(s, e.id));
                  }}
                >
                  Despedir
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="panel">
        <h2>Candidatos</h2>
        <p className="muted">Cada semana llegan candidatos nuevos. Su sueldo se paga todos los días, vendas o no. Máximo 3 empleados en el puesto.</p>
        <div className="cards">
          {game.candidates.map((c) => (
            <div key={c.id} className="person candidate">
              <h3>{c.name}</h3>
              <p className="muted small">{c.trait}</p>
              <Attr label="Rapidez" value={c.speed} />
              <Attr label="Calidad" value={c.quality} />
              <p>
                Pide: <strong>{money(c.wage)}/día</strong>
                <br />
                {wageNote(c, true)}
              </p>
              <p className="small muted">Agregaría unas {Math.round(c.speed * 2.6 * 0.9)} órdenes/día de capacidad.</p>
              <button className="primary" disabled={game.employees.length >= 3} onClick={() => act((s) => hire(s, c.id))}>
                Contratar
              </button>
            </div>
          ))}
          {game.candidates.length === 0 && <p className="muted">No hay candidatos esta semana.</p>}
        </div>
      </div>
    </div>
  );
}
