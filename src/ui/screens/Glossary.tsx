import { useEffect, useState } from 'react';
import { GLOSSARY, SCREEN_NAME, TERM_SCREEN } from '../../sim/glossary';
import { useNav } from '../nav';

export function GlossaryScreen() {
  const nav = useNav();
  const [q, setQ] = useState('');
  useEffect(() => {
    if (nav.focusTerm) document.getElementById('term-' + nav.focusTerm)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [nav.focusTerm]);
  const terms = Object.entries(GLOSSARY)
    .filter(([, t]) => (t.term + ' ' + t.definition).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a[1].term.localeCompare(b[1].term, 'es'));
  return (
    <div className="panel">
      <h2>Glosario de negocios</h2>
      <p className="muted">Cada término subrayado en el juego tiene su definición aquí. También puedes pasar el ratón encima.</p>
      <input className="search" placeholder="Buscar un término…" value={q} onChange={(e) => setQ(e.target.value)} />
      <dl className="glossary">
        {terms.map(([id, t]) => (
          <div key={id} id={'term-' + id} className={'gloss-item' + (nav.focusTerm === id ? ' focused' : '')}>
            <dt>{t.term}</dt>
            <dd>
              {t.definition}
              {t.example && <em> Ejemplo: {t.example}</em>}
              {TERM_SCREEN[id] && (
                <button className="link small gloss-go" onClick={() => nav.go(TERM_SCREEN[id])}>
                  Ir a {SCREEN_NAME[TERM_SCREEN[id]]} →
                </button>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
