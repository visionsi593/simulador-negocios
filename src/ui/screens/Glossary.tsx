import { useState } from 'react';
import { GLOSSARY } from '../../sim/glossary';

export function GlossaryScreen() {
  const [q, setQ] = useState('');
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
          <div key={id} className="gloss-item">
            <dt>{t.term}</dt>
            <dd>
              {t.definition}
              {t.example && <em> Ejemplo: {t.example}</em>}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
