import { Fragment } from 'react';
import { GLOSSARY } from '../sim/glossary';

/** Un término con su definición al pasar el ratón. */
export function Term({ id, children }: { id: string; children?: React.ReactNode }) {
  const t = GLOSSARY[id];
  if (!t) return <>{children}</>;
  return (
    <span className="term" tabIndex={0}>
      {children ?? t.term}
      <span className="term-tip" role="tooltip">
        <strong>{t.term}</strong>
        <span>{t.definition}</span>
        {t.example && <em>Ejemplo: {t.example}</em>}
      </span>
    </span>
  );
}

/** Convierte "[[termino|texto]]" en términos con definición, y respeta los saltos de línea. */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, i) => {
        const parts = line.split(/(\[\[[^\]]+\]\])/g);
        return (
          <p key={i} className={line.trim() === '' ? 'blank' : undefined}>
            {parts.map((part, j) => {
              const m = part.match(/^\[\[([^|\]]+)(?:\|([^\]]+))?\]\]$/);
              if (!m) return <Fragment key={j}>{part}</Fragment>;
              return (
                <Term key={j} id={m[1]}>
                  {m[2] ?? GLOSSARY[m[1]]?.term ?? m[1]}
                </Term>
              );
            })}
          </p>
        );
      })}
    </>
  );
}
