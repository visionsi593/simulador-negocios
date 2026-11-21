import { useState } from 'react';

export function NewGame({ onStart }: { onStart: (name: string) => void }) {
  const [name, setName] = useState('Antojitos El Buen Taco');
  return (
    <div className="newgame">
      <div className="newgame-card">
        <h1>Simulador de Negocios</h1>
        <p className="lead">Del puesto de la esquina a la planta de alimentos.</p>
        <p>
          Tienes <strong>$15,000</strong> de ahorros y un pequeño puesto de comida. Tu meta en este primer acto: aprender a manejar un
          negocio de verdad y juntar el capital para abrir un restaurante.
        </p>
        <ul className="newgame-list">
          <li>Compra ingredientes sin que se te echen a perder.</li>
          <li>Ponle precio a tus platillos sabiendo cuánto te cuestan.</li>
          <li>Contrata y cuida a tu equipo.</li>
          <li>Lee tu estado de resultados y tu flujo de efectivo.</li>
        </ul>
        <label className="field">
          <span>Nombre de tu negocio</span>
          <input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
        </label>
        <button className="primary big" disabled={!name.trim()} onClick={() => onStart(name.trim())}>
          Empezar
        </button>
      </div>
    </div>
  );
}
