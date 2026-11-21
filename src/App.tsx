import { useCallback, useEffect, useState } from 'react';
import { advanceDay, dateLabel, newGame, pendingDecisions, preDayWarnings, weatherLabel } from './sim/engine';
import { GameError } from './sim/helpers';
import type { DayWarning, GameScreen, GameState } from './sim/types';
import { NavContext } from './ui/nav';
import { money } from './ui/format';
import { deleteSave, loadGame, saveGame } from './ui/save';
import { Business } from './ui/screens/Business';
import { DaySummary } from './ui/screens/DaySummary';
import { Finance } from './ui/screens/Finance';
import { GlossaryScreen } from './ui/screens/Glossary';
import { Inbox } from './ui/screens/Inbox';
import { MenuScreen } from './ui/screens/Menu';
import { NewGame } from './ui/screens/NewGame';
import { Objectives } from './ui/screens/Objectives';
import { Purchasing } from './ui/screens/Purchasing';
import { Staff } from './ui/screens/Staff';

export type Act = (fn: (s: GameState) => GameState) => boolean;
/** Pide confirmación con un diálogo dentro del juego (los diálogos del navegador no siempre están disponibles). */
export type Confirm = (message: string, confirmLabel: string, onYes: () => void) => void;

const SCREENS: { id: GameScreen; label: string; icon: string }[] = [
  { id: 'bandeja', label: 'Bandeja', icon: '✉' },
  { id: 'negocio', label: 'Mi negocio', icon: '⌂' },
  { id: 'menu', label: 'Menú y precios', icon: '☰' },
  { id: 'compras', label: 'Compras e inventario', icon: '⛟' },
  { id: 'personal', label: 'Personal', icon: '☺' },
  { id: 'finanzas', label: 'Finanzas', icon: '$' },
  { id: 'objetivos', label: 'Objetivos', icon: '★' },
  { id: 'glosario', label: 'Glosario', icon: '?' },
];

export default function App() {
  const [game, setGame] = useState<GameState | null>(() => loadGame());
  const [screen, setScreenState] = useState<GameScreen>('bandeja');
  const [focusTerm, setFocusTerm] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<DayWarning[] | null>(null);
  const go = useCallback((target: GameScreen, term?: string) => {
    setScreenState(target);
    setFocusTerm(term ?? null);
    setSummaryDay(null);
    setWarnings(null);
    window.scrollTo({ top: 0 });
  }, []);
  const setScreen = (target: GameScreen) => go(target);
  const [toast, setToast] = useState<string | null>(null);
  const [summaryDay, setSummaryDay] = useState<number | null>(null);
  const [confirmState, setConfirmState] = useState<{ message: string; label: string; onYes: () => void } | null>(null);
  const askConfirm: Confirm = (message, label, onYes) => setConfirmState({ message, label, onYes });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const act: Act = useCallback(
    (fn) => {
      if (!game) return false;
      try {
        const next = fn(game);
        setGame(next);
        saveGame(next);
        return true;
      } catch (e) {
        if (e instanceof GameError) setToast(e.message);
        else throw e;
        return false;
      }
    },
    [game],
  );

  if (!game) {
    return (
      <NewGame
        onStart={(name) => {
          const s = newGame(name);
          saveGame(s);
          setGame(s);
          setScreen('bandeja');
        }}
      />
    );
  }

  const pending = pendingDecisions(game);
  const unread = game.messages.filter((m) => !m.read).length;
  const bankrupt = game.status === 'quiebra';

  const playDay = () => {
    setWarnings(null);
    const day = game.day;
    if (act(advanceDay)) setSummaryDay(day);
  };

  const continueDay = () => {
    if (pending.length) {
      setScreen('bandeja');
      setToast('Tienes decisiones pendientes en la bandeja.');
      return;
    }
    const found = preDayWarnings(game);
    if (found.length) setWarnings(found);
    else playDay();
  };

  const restart = () =>
    askConfirm('¿Empezar una partida nueva? Se perderá la actual.', 'Empezar de nuevo', () => {
      deleteSave();
      setGame(null);
      setSummaryDay(null);
    });

  return (
    <NavContext.Provider value={{ screen, go, focusTerm }}>
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-name">{game.businessName}</span>
          <span className="brand-sub">Acto 1 · El puesto</span>
        </div>
        <div className="top-stats">
          <div className="top-stat">
            <span className="label">Fecha</span>
            <span className="value">{dateLabel(game.day)}</span>
          </div>
          <div className="top-stat">
            <span className="label">Clima de hoy</span>
            <span className="value">{weatherLabel(game.forecast)}</span>
          </div>
          <div className="top-stat">
            <span className="label">Caja</span>
            <span className={'value ' + (game.cash < 0 ? 'neg' : '')}>{money(game.cash)}</span>
          </div>
          <div className="top-stat">
            <span className="label">Reputación</span>
            <span className="value">{Math.round(game.reputation)} / 100</span>
          </div>
        </div>
        <button className="continue" onClick={continueDay} disabled={bankrupt} title={pending.length ? 'Responde primero tus decisiones pendientes' : 'Abrir el puesto y jugar el día'}>
          {pending.length ? `Decisiones pendientes (${pending.length})` : 'Continuar ▶'}
        </button>
      </header>

      <nav className="sidebar">
        {SCREENS.map((sc) => (
          <button key={sc.id} className={'nav-item' + (screen === sc.id ? ' active' : '')} onClick={() => setScreen(sc.id)}>
            <span className="nav-icon" aria-hidden>
              {sc.icon}
            </span>
            <span>{sc.label}</span>
            {sc.id === 'bandeja' && unread > 0 && <span className="badge">{unread}</span>}
          </button>
        ))}
        <div className="sidebar-foot">
          <button className="link" onClick={restart}>
            Nueva partida
          </button>
        </div>
      </nav>

      <main className="content">
        {bankrupt && (
          <div className="banner danger">
            Tu negocio quebró. Revisa tus finanzas para entender qué pasó y <button className="link" onClick={restart}>empieza de nuevo</button>.
          </div>
        )}
        {game.flags.actoCompletado === 1 && <div className="banner success">¡Completaste el Acto 1! Puedes seguir jugando mientras preparamos el Acto 2.</div>}
        {screen === 'bandeja' && <Inbox game={game} act={act} />}
        {screen === 'negocio' && <Business game={game} />}
        {screen === 'menu' && <MenuScreen game={game} act={act} />}
        {screen === 'compras' && <Purchasing game={game} act={act} />}
        {screen === 'personal' && <Staff game={game} act={act} confirm={askConfirm} />}
        {screen === 'finanzas' && <Finance game={game} />}
        {screen === 'objetivos' && <Objectives game={game} />}
        {screen === 'glosario' && <GlossaryScreen />}
      </main>

      {summaryDay !== null && (
        <DaySummary
          game={game}
          day={summaryDay}
          onClose={() => setSummaryDay(null)}
          onGo={(target) => {
            setSummaryDay(null);
            setScreen(target as GameScreen);
          }}
        />
      )}
      {warnings && (
        <div className="modal-backdrop" onClick={() => setWarnings(null)}>
          <div className="modal" role="alertdialog" aria-label="Antes de abrir" onClick={(e) => e.stopPropagation()}>
            <h2>Antes de abrir el puesto…</h2>
            <p className="muted">Revisa esto. Puedes resolverlo o abrir de todos modos.</p>
            <ul className="warnings">
              {warnings.map((w, i) => (
                <li key={i} className={'warning ' + w.severity}>
                  <span className="warning-mark" aria-label={w.severity === 'alta' ? 'Importante' : 'Aviso'}>
                    {w.severity === 'alta' ? '!' : 'i'}
                  </span>
                  <span className="warning-text">{w.text}</span>
                  <button
                    onClick={() => {
                      setWarnings(null);
                      setScreen(w.screen);
                    }}
                  >
                    {w.action}
                  </button>
                </li>
              ))}
            </ul>
            <div className="modal-actions">
              <button onClick={() => setWarnings(null)}>Revisar</button>
              <button className="primary" onClick={playDay}>
                Abrir de todos modos ▶
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmState && (
        <div className="modal-backdrop" onClick={() => setConfirmState(null)}>
          <div className="modal confirm" role="alertdialog" aria-label="Confirmar" onClick={(e) => e.stopPropagation()}>
            <p>{confirmState.message}</p>
            <div className="modal-actions">
              <button onClick={() => setConfirmState(null)}>Cancelar</button>
              <button
                className="primary"
                autoFocus
                onClick={() => {
                  confirmState.onYes();
                  setConfirmState(null);
                }}
              >
                {confirmState.label}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
    </NavContext.Provider>
  );
}
