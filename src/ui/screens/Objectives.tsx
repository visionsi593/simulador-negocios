import { OBJECTIVES } from '../../sim/story';
import type { GameState } from '../../sim/types';

export function Objectives({ game }: { game: GameState }) {
  return (
    <div className="panel">
      <h2>Acto 1 · El puesto</h2>
      <p className="muted">Cumple los objetivos en orden. Al terminar, tendrás el capital para dar el siguiente paso: un restaurante.</p>
      <ol className="objectives">
        {OBJECTIVES.map((o, i) => {
          const state = i < game.objectiveIndex ? 'done' : i === game.objectiveIndex ? 'current' : 'locked';
          return (
            <li key={o.id} className={'objective ' + state}>
              <span className="obj-mark" aria-hidden>
                {state === 'done' ? '✓' : state === 'current' ? '▶' : '•'}
              </span>
              <div>
                <strong>{o.title}</strong>
                <p>{state === 'locked' ? 'Se desbloquea al cumplir el objetivo anterior.' : o.description}</p>
                {state === 'current' && <p className="progress-text">{o.progress(game)}</p>}
              </div>
            </li>
          );
        })}
      </ol>
      <div className="next-acts">
        <h3>Lo que viene</h3>
        <ul>
          <li><strong>Acto 2 · El restaurante:</strong> turnos, más personal, renta de un local y tu primer préstamo.</li>
          <li><strong>Acto 3 · La cocina de producción:</strong> vender por mayoreo a otros negocios, lotes y control sanitario.</li>
          <li><strong>Acto 4 · La planta de alimentos:</strong> líneas de producción, mantenimiento, calidad y distribución.</li>
        </ul>
      </div>
    </div>
  );
}
