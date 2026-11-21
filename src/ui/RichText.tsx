import { Fragment } from 'react';
import { GLOSSARY, SCREEN_NAME, TERM_SCREEN } from '../sim/glossary';
import { useNav } from './nav';

/**
 * Un término de negocio: al pasar el ratón muestra su definición y al hacer clic
 * lleva a la pantalla donde se trabaja ese tema (o al glosario si ya estás ahí).
 */
export function Term({ id, children }: { id: string; children?: React.ReactNode }) {
  const nav = useNav();
  const t = GLOSSARY[id];
  if (!t) return <>{children}</>;
  const target = TERM_SCREEN[id];
  const goesToScreen = target && target !== nav.screen;
  const follow = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (goesToScreen) nav.go(target);
    else nav.go('glosario', id);
  };
  return (
    <span
      className="term"
      role="link"
      tabIndex={0}
      onClick={follow}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && follow(e)}
    >
      {children ?? t.term}
      <span className="term-tip" role="tooltip">
        <strong>{t.term}</strong>
        <span>{t.definition}</span>
        {t.example && <em>Ejemplo: {t.example}</em>}
        <span className="term-go">Clic: {goesToScreen ? `ir a ${SCREEN_NAME[target]}` : 'ver en el glosario'} →</span>
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
