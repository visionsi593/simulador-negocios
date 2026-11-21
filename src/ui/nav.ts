import { createContext, useContext } from 'react';
import type { GameScreen } from '../sim/types';

export interface Nav {
  screen: GameScreen;
  /** Cambia de pantalla; en el glosario, `term` resalta ese concepto. */
  go: (screen: GameScreen, term?: string) => void;
  focusTerm: string | null;
}

export const NavContext = createContext<Nav>({ screen: 'bandeja', go: () => {}, focusTerm: null });
export const useNav = () => useContext(NavContext);
