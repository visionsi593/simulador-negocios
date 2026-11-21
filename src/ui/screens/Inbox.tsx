import { useEffect, useState } from 'react';
import type { Act } from '../../App';
import { answer, markRead } from '../../sim/engine';
import type { GameState, Message } from '../../sim/types';
import { RichText } from '../RichText';

const KIND_LABEL: Record<Message['kind'], string> = {
  mentor: 'Mentor',
  evento: 'Evento',
  sistema: 'Reporte',
  personal: 'Personal',
  objetivo: 'Objetivo',
};

export function Inbox({ game, act }: { game: GameState; act: Act }) {
  const messages = game.messages;
  // Al abrir la bandeja se elige un mensaje una sola vez (primero las decisiones, luego lo no leído).
  // Solo se marca como leído el mensaje que de verdad se muestra.
  const [selectedId, setSelectedId] = useState<number | null>(
    () => (messages.find((m) => m.options && !m.choice) ?? messages.find((m) => !m.read) ?? messages[0])?.id ?? null,
  );
  const selected = messages.find((m) => m.id === selectedId) ?? messages[0];

  useEffect(() => {
    if (selected && !selected.read && !selected.options) act((s) => markRead(s, selected.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  return (
    <div className="inbox">
      <div className="inbox-list panel">
        <h2>Bandeja de entrada</h2>
        {messages.length === 0 && <p className="muted">No hay mensajes.</p>}
        <ul>
          {messages.map((m) => (
            <li key={m.id}>
              <button
                className={'msg-row' + (m.id === selected?.id ? ' selected' : '') + (!m.read ? ' unread' : '')}
                onClick={() => setSelectedId(m.id)}
              >
                <span className={'kind kind-' + m.kind}>{KIND_LABEL[m.kind]}</span>
                <span className="msg-subject">{m.subject}</span>
                <span className="msg-meta">
                  {m.from} · Día {m.day}
                  {m.options && !m.choice && <strong className="needs"> · Requiere respuesta</strong>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="inbox-detail panel">
        {selected ? (
          <>
            <div className="msg-head">
              <span className={'kind kind-' + selected.kind}>{KIND_LABEL[selected.kind]}</span>
              <h2>{selected.subject}</h2>
              <p className="muted">
                De: {selected.from} · Día {selected.day}
              </p>
            </div>
            <div className="msg-body">
              <RichText text={selected.body} />
            </div>
            {selected.options && (
              <div className="msg-options">
                {selected.choice ? (
                  <p className="muted">Respondiste: {selected.options.find((o) => o.id === selected.choice)?.label}</p>
                ) : (
                  selected.options.map((o) => (
                    <div key={o.id} className="option">
                      <button className="primary" onClick={() => act((s) => answer(s, selected.id, o.id))}>
                        {o.label}
                      </button>
                      {o.hint && <span className="muted small">{o.hint}</span>}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        ) : (
          <p className="muted">Selecciona un mensaje.</p>
        )}
      </div>
    </div>
  );
}
