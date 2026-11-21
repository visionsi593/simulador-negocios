import type { GameState } from '../sim/types';

const KEY = 'simulador-negocios:partida';

// Por ahora la partida se guarda en el navegador. En la versión de Steam irá a un archivo
// (y a la nube de Steam), pero la interfaz no cambia.
export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as GameState;
    return s.version === 1 ? s : null;
  } catch {
    return null;
  }
}

export function saveGame(s: GameState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* sin almacenamiento disponible: se juega sin guardar */
  }
}

export function deleteSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nada */
  }
}
