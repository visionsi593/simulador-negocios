// Contenido de la campaña del Acto 1: lecciones del mentor, objetivos y eventos.

import { DISH_MAP, INGREDIENT_MAP, MENTOR, WEEKDAYS } from './data';
import { addMessage, GameError, marketPrice, round2, stockOf, summarize, reportsByWeek, weekday } from './helpers';
import { addLot, discardLots } from './inventory';
import type { Rng } from './rng';
import type { GameState, Message } from './types';

const money = (n: number) => '$' + Math.round(n).toLocaleString('es-MX');

// ---------------------------------------------------------------------------
// Lecciones del mentor
// ---------------------------------------------------------------------------

export const LESSONS: Record<string, { subject: string; body: string }> = {
  bienvenida: {
    subject: 'Bienvenido a tu propio negocio',
    body:
      'Muchacho, qué gusto que por fin te animaste. Soy Ramiro, llevo 30 años llevando las cuentas de negocios de la colonia y le prometí a tu familia echarte la mano.\n\n' +
      'Tienes un puesto de comida, unos ahorros y muchas ganas. Lo demás se aprende. Cada mañana haz tres cosas:\n\n' +
      '1. Revisa tu bandeja: aquí te aviso de todo.\n' +
      '2. Ve a Compras y consigue ingredientes. Hoy no tienes nada en el refri: sin ingredientes no hay ventas.\n' +
      '3. Revisa tus precios en Menú. Cuando estés listo, dale a "Continuar" para abrir el puesto.\n\n' +
      'Te recomiendo empezar con la "Compra sugerida": calcula lo que probablemente vas a vender hoy. Ese cálculo se llama [[pronostico|pronóstico de demanda]].',
  },
  costeo: {
    subject: '¿Cuánto te cuesta cada orden?',
    body:
      'Antes de ponerle precio a algo, tienes que saber cuánto te cuesta hacerlo. Eso es el [[costeo_receta|costeo de receta]].\n\n' +
      'En la pantalla Menú verás el costo de cada platillo con los precios de hoy y tu [[margen_bruto|margen bruto]]: cuánto te queda de cada peso. ' +
      'En comida, un margen bruto entre 55% y 70% es sano. Si baja de 40%, algo anda mal.\n\n' +
      'Ojo: los precios del mercado cambian. Lo que hoy te deja buen margen, mañana quizá no.',
  },
  merma: {
    subject: 'Tiraste dinero a la basura',
    body:
      'Ayer se te echaron a perder ingredientes. Eso se llama [[merma|merma]] y es de las fugas de dinero más comunes en un negocio de comida.\n\n' +
      'Cada ingrediente tiene su [[vida_util|vida útil]]: el bolillo dura un día, la tortilla dos. Compra lo perecedero casi diario y en la cantidad justa. ' +
      'El puesto siempre usa primero lo más viejo ([[peps|PEPS]]), pero si compras de más, igual se pierde.',
  },
  venta_perdida: {
    subject: 'Clientes que se fueron con las manos vacías',
    body:
      'Ayer llegaron clientes y se fueron porque se te acabó algún ingrediente. Esa es una [[venta_perdida|venta perdida]].\n\n' +
      'Lo peligroso es que no aparece en ningún reporte de ventas: simplemente no entró ese dinero. Y además el cliente se va molesto, y eso baja tu [[reputacion|reputación]].\n\n' +
      'El reto es el equilibrio: si compras poco pierdes ventas, si compras mucho tienes merma.',
  },
  capacidad: {
    subject: 'Ya no te das abasto',
    body:
      'Ayer se te formó tanta fila que varios clientes se fueron. Tu problema ya no es vender, es tu [[capacidad|capacidad]]: tú solo puedes preparar unas 40 órdenes al día.\n\n' +
      'Es momento de pensar en contratar a alguien. Revisa la pantalla Personal. Un ayudante cuesta, pero si te trae más ventas de lo que cuesta su sueldo, conviene. Eso es entender tu [[costo_laboral|costo laboral]].',
  },
  estado_resultados: {
    subject: 'Tu primer estado de resultados',
    body:
      'Cerramos tu primera semana. En Finanzas tienes tu estado de resultados. Se lee de arriba hacia abajo:\n\n' +
      '• [[ventas|Ventas]]: lo que cobraste.\n' +
      '• Menos [[costo_ventas|costo de ventas]]: los ingredientes de lo que vendiste.\n' +
      '• Igual a [[utilidad_bruta|utilidad bruta]].\n' +
      '• Menos mermas, sueldos y [[gastos_fijos|gastos fijos]].\n' +
      '• Igual a [[utilidad_neta|utilidad neta]]: lo que de verdad ganaste.\n\n' +
      'Revísalo cada semana. Es como el chequeo médico de tu negocio.',
  },
  flujo: {
    subject: 'Ganar dinero no es lo mismo que tener dinero',
    body:
      'Fíjate en algo: ayer tu caja cambió muy distinto a lo que ganaste. ¿Por qué? Porque compraste ingredientes que todavía no vendes. Ese dinero salió de tu caja y ahora está en tu [[inventario|inventario]].\n\n' +
      'Por eso existen dos reportes distintos: la utilidad (¿gané?) y el [[flujo_efectivo|flujo de efectivo]] (¿cuánto dinero tengo?). ' +
      'Muchos negocios que ganan dinero quiebran porque se quedan sin efectivo para pagar. Que no te pase.',
  },
  elasticidad: {
    subject: 'Sobre tus precios',
    body:
      'Vi que moviste bastante tus precios respecto a lo que cobra la competencia. Está bien experimentar, pero entiende la [[elasticidad|elasticidad precio]]: ' +
      'si subes mucho, llegan menos clientes y piden menos de ese platillo. Si bajas mucho, vendes más pero te queda menos por cada orden.\n\n' +
      'El precio correcto no es el más alto ni el más bajo: es el que te deja más utilidad total.',
  },
  costo_laboral: {
    subject: 'Tu primer empleado',
    body:
      'Felicidades, ya eres patrón. Ahora tienes una responsabilidad: su sueldo se paga todos los días, vendas o no. Se vuelve un [[gastos_fijos|gasto fijo]].\n\n' +
      'Cuida su ánimo: si le pagas menos de lo que se paga en la zona o lo traes reventado de trabajo, baja su ánimo, trabaja peor y al final renuncia. ' +
      'Eso se llama [[rotacion|rotación]] y sale caro. Y si lo despides, hay que pagarle su [[finiquito|finiquito]].',
  },
  punto_equilibrio: {
    subject: '¿Cuánto necesitas vender para no perder?',
    body:
      'Ya llevas dos semanas. Te enseño un número clave: el [[punto_equilibrio|punto de equilibrio]].\n\n' +
      'Suma tus gastos fijos del día (renta, servicios y sueldos). Luego divide entre lo que te queda en promedio por cada orden después de ingredientes. ' +
      'El resultado es cuántas órdenes necesitas vender al día solo para no perder. Todo lo que vendas arriba de eso es ganancia.\n\n' +
      'En Finanzas te lo calculo con tus números reales.',
  },
  reputacion: {
    subject: 'Lo que dice la gente',
    body:
      'Tu [[reputacion|reputación]] es lo que la colonia piensa de ti, y decide cuánta gente llega cada día. Sube cuando la comida es buena y el precio es justo. ' +
      'Baja cuando la gente se va sin comprar o siente que la estás robando.\n\n' +
      'La calidad depende de quién cocina: un buen cocinero contento vale oro.',
  },
  cumplimiento: {
    subject: 'Los permisos no son opcionales',
    body:
      'Pagar permisos duele, lo sé. Pero el [[cumplimiento|cumplimiento normativo]] es parte del costo de tener un negocio. ' +
      'Una multa o una clausura cuesta mucho más que el permiso. Y cuando crezcas a una fábrica, las inspecciones serán mucho más estrictas.',
  },
  mantenimiento: {
    subject: 'Cuida tu equipo',
    body:
      'Lo del refrigerador es una lección que vas a vivir mil veces cuando tengas una planta: el equipo falla. ' +
      'El [[mantenimiento|mantenimiento]] preventivo cuesta poco comparado con perder producto o parar la producción. Guarda siempre un colchón de efectivo para imprevistos.',
  },
};

export function teach(s: GameState, lessonId: string): void {
  if (s.lessonsSeen.includes(lessonId)) return;
  const lesson = LESSONS[lessonId];
  if (!lesson) return;
  s.lessonsSeen.push(lessonId);
  addMessage(s, { kind: 'mentor', from: MENTOR, subject: lesson.subject, body: lesson.body });
}

// ---------------------------------------------------------------------------
// Objetivos de la historia (se cumplen en orden)
// ---------------------------------------------------------------------------

export interface Objective {
  id: string;
  title: string;
  description: string;
  check: (s: GameState) => boolean;
  progress: (s: GameState) => string;
}

const bestWeekProfit = (s: GameState) => {
  const weeks = reportsByWeek(s.reports).filter((w) => w.length === 7);
  return weeks.length ? Math.max(...weeks.map((w) => summarize(w).netProfit)) : 0;
};

export const ACT1_GOAL_CASH = 60000;

export const OBJECTIVES: Objective[] = [
  {
    id: 'abrir',
    title: 'Abre tu puesto',
    description: 'Atiende al menos 25 clientes en un solo día.',
    check: (s) => s.reports.some((r) => r.served >= 25),
    progress: (s) => `Mejor día: ${Math.max(0, ...s.reports.map((r) => r.served))} / 25 clientes`,
  },
  {
    id: 'semana',
    title: 'Sobrevive tu primera semana',
    description: 'Termina la primera semana con dinero en caja.',
    check: (s) => s.reports.length >= 7 && s.cash > 0,
    progress: (s) => `Día ${Math.min(s.reports.length, 7)} / 7`,
  },
  {
    id: 'ayudante',
    title: 'Tu primer empleado',
    description: 'Contrata a alguien que te ayude en el puesto.',
    check: (s) => s.employees.length >= 1,
    progress: (s) => `${s.employees.length} / 1 empleado`,
  },
  {
    id: 'rentable',
    title: 'Una semana rentable',
    description: 'Logra una semana completa con utilidad neta de al menos $6,000.',
    check: (s) => bestWeekProfit(s) >= 6000,
    progress: (s) => `Mejor semana: ${money(bestWeekProfit(s))} / $6,000`,
  },
  {
    id: 'reputacion',
    title: 'Nombre en la colonia',
    description: 'Alcanza una reputación de 65 o más.',
    check: (s) => s.reputation >= 65,
    progress: (s) => `Reputación: ${Math.round(s.reputation)} / 65`,
  },
  {
    id: 'salto',
    title: 'El siguiente paso',
    description: `Junta ${money(ACT1_GOAL_CASH)} en caja para poder abrir un restaurante.`,
    check: (s) => s.cash >= ACT1_GOAL_CASH,
    progress: (s) => `Caja: ${money(s.cash)} / ${money(ACT1_GOAL_CASH)}`,
  },
];

export function announceObjective(s: GameState): void {
  const obj = OBJECTIVES[s.objectiveIndex];
  if (!obj) return;
  addMessage(s, {
    kind: 'objetivo',
    from: 'Objetivos',
    subject: `Nuevo objetivo: ${obj.title}`,
    body: obj.description,
  });
}

/** Revisa objetivos en orden; varios pueden cumplirse el mismo día. */
export function checkObjectives(s: GameState): void {
  while (s.objectiveIndex < OBJECTIVES.length && OBJECTIVES[s.objectiveIndex].check(s)) {
    const done = OBJECTIVES[s.objectiveIndex];
    s.objectiveIndex++;
    addMessage(s, {
      kind: 'objetivo',
      from: 'Objetivos',
      subject: `Objetivo cumplido: ${done.title}`,
      body: '¡Bien hecho! ' + done.description,
    });
    if (s.objectiveIndex >= OBJECTIVES.length) {
      // El acto queda marcado como completado, pero se puede seguir jugando.
      s.flags.actoCompletado = 1;
      addMessage(s, {
        kind: 'mentor',
        from: MENTOR,
        subject: 'Fin del Acto 1: ya estás listo para más',
        body:
          'Lo lograste. Empezaste con un puesto y unos ahorros y ahora tienes un negocio que funciona y el capital para crecer.\n\n' +
          'El siguiente paso es un restaurante: más personal, turnos, un local con renta de verdad y quizá tu primer préstamo del banco. ' +
          'Eso viene en el Acto 2. Por ahora, puedes seguir jugando tu puesto todo lo que quieras.',
      });
    } else {
      announceObjective(s);
    }
  }
}

// ---------------------------------------------------------------------------
// Eventos aleatorios
// ---------------------------------------------------------------------------

interface GameEvent {
  id: string;
  weight: number;
  eligible: (s: GameState) => boolean;
  start: (s: GameState, rng: Rng) => void;
  /** Opción que se toma si el jugador no responde. */
  defaultOption?: string;
  resolve?: (s: GameState, msg: Message, optionId: string) => void;
}

const tomorrowName = (s: GameState) => WEEKDAYS[weekday(s.day + 1)].toLowerCase();

const EVENTS: GameEvent[] = [
  {
    id: 'feria',
    weight: 3,
    eligible: () => true,
    start: (s) => {
      s.modifiers.push({ id: 'feria', label: 'Feria en la colonia', fromDay: s.day + 1, toDay: s.day + 1, demand: 1.5 });
      addMessage(s, {
        kind: 'evento',
        from: 'Doña Chela (local de al lado)',
        subject: `Mañana ${tomorrowName(s)} hay feria en la colonia`,
        body:
          'Oye, mañana ponen la feria aquí en la calle. Siempre viene muchísima gente, como la mitad más de lo normal. ' +
          'Yo que tú me surtía bien… pero tampoco te pases, que lo que sobra se echa a perder.',
      });
    },
  },
  {
    id: 'alza_carne',
    weight: 2,
    eligible: (s) => s.day >= 4,
    start: (s) => {
      s.modifiers.push({ id: 'alza_carne', label: 'Carne más cara', fromDay: s.day, toDay: s.day + 6, ingredient: 'carne', priceFactor: 1.35 });
      addMessage(s, {
        kind: 'evento',
        from: 'Carnicería El Novillo',
        subject: 'Aviso: sube el precio de la carne',
        body:
          'Estimado cliente: por escasez, esta semana la carne sube alrededor de 35%. Esperamos que regrese a la normalidad en unos días.\n\n' +
          'Revisa en Menú cómo cambia el [[costeo_receta|costo]] de tus tacos y tortas. ¿Subes el precio, aguantas el margen o empujas las quesadillas?',
      });
    },
  },
  {
    id: 'oferta',
    weight: 2,
    eligible: (s) => s.day >= 3,
    defaultOption: 'rechazar',
    start: (s, rng) => {
      const options = [
        { id: 'queso', qty: 8 },
        { id: 'carne', qty: 10 },
        { id: 'azucar', qty: 20 },
      ];
      const offer = rng.pick(options);
      const def = INGREDIENT_MAP[offer.id];
      const cost = round2(offer.qty * marketPrice(s, offer.id) * 0.75);
      addMessage(s, {
        kind: 'evento',
        eventId: 'oferta',
        from: 'Distribuidora La Central',
        subject: `Oferta: ${offer.qty} ${def.unit} de ${def.name.toLowerCase()} con 25% de descuento`,
        body:
          `Le ofrecemos ${offer.qty} ${def.unit} de ${def.name.toLowerCase()} por ${money(cost)} (25% menos que en el mercado). Solo por hoy.\n\n` +
          `Piénsalo: dura ${def.shelfLife} días. Un descuento no sirve de nada si se te echa a perder antes de usarlo ([[merma|merma]]).`,
        options: [
          { id: 'aceptar', label: `Comprar por ${money(cost)}` },
          { id: 'rechazar', label: 'No, gracias' },
        ],
        data: { ingredientId: offer.id, qty: offer.qty, cost },
      });
    },
    resolve: (s, msg, option) => {
      if (option !== 'aceptar') return;
      const cost = Number(msg.data!.cost);
      if (s.cash < cost) throw new GameError('No tienes suficiente efectivo para esta compra.');
      const qty = Number(msg.data!.qty);
      s.cash = round2(s.cash - cost);
      s.today.purchases += cost;
      addLot(s, String(msg.data!.ingredientId), qty, cost / qty);
    },
  },
  {
    id: 'permiso',
    weight: 3,
    eligible: (s) => s.day >= 5 && !s.flags.permiso,
    defaultOption: 'arriesgarse',
    start: (s) => {
      addMessage(s, {
        kind: 'evento',
        eventId: 'permiso',
        from: 'Ayuntamiento',
        subject: 'Renovación de permiso sanitario',
        body:
          'Su permiso de venta de alimentos está por vencer. La renovación cuesta $1,500. ' +
          'Operar sin permiso vigente puede generar multas si recibe una inspección.',
        options: [
          { id: 'pagar', label: 'Renovar el permiso ($1,500)' },
          { id: 'arriesgarse', label: 'Arriesgarse sin permiso', hint: 'Ahorras hoy, pero si llega un inspector la multa es de $4,000.' },
        ],
      });
    },
    resolve: (s, _msg, option) => {
      s.flags.permiso = 1;
      if (option === 'pagar') {
        if (s.cash < 1500) throw new GameError('No tienes suficiente efectivo para pagar el permiso.');
        s.cash -= 1500;
        s.today.other += 1500;
        s.today.notes.push('Pago de permiso sanitario: $1,500');
      } else {
        s.flags.sinPermiso = 1;
      }
      teach(s, 'cumplimiento');
    },
  },
  {
    id: 'pedido',
    weight: 3,
    eligible: (s) => s.day >= 4 && s.specialOrders.length === 0 && s.menu.some((m) => m.active && DISH_MAP[m.dishId].category === 'plato'),
    defaultOption: 'rechazar',
    start: (s, rng) => {
      const platos = s.menu.filter((m) => m.active && DISH_MAP[m.dishId].category === 'plato');
      const item = rng.pick(platos);
      const qty = rng.int(5, 9) * 5;
      const unitPrice = Math.round(item.price * 0.85);
      const day = s.day + 2;
      const dish = DISH_MAP[item.dishId];
      addMessage(s, {
        kind: 'evento',
        eventId: 'pedido',
        from: 'Taller Mecánico Hermanos Ruiz',
        subject: `Pedido especial: ${qty} × ${dish.name.toLowerCase()}`,
        body:
          `Buen día. Queremos ${qty} de su ${dish.name.toLowerCase()} para la comida del personal el ${WEEKDAYS[weekday(day)].toLowerCase()}. ` +
          `Ofrecemos ${money(unitPrice)} por pieza (total ${money(unitPrice * qty)}).\n\n` +
          'Si aceptas, ese día se prepara primero el pedido. Necesitas tener los ingredientes listos y te va a quitar tiempo para atender a tus clientes normales. ' +
          'Si no lo cumples, tu reputación sufre.',
        options: [
          { id: 'aceptar', label: 'Aceptar el pedido' },
          { id: 'rechazar', label: 'Rechazarlo' },
        ],
        data: { dishId: item.dishId, qty, unitPrice, day },
      });
    },
    resolve: (s, msg, option) => {
      if (option !== 'aceptar') return;
      s.specialOrders.push({
        id: msg.id,
        dishId: String(msg.data!.dishId),
        qty: Number(msg.data!.qty),
        unitPrice: Number(msg.data!.unitPrice),
        day: Number(msg.data!.day),
        client: msg.from,
      });
    },
  },
  {
    id: 'aumento',
    weight: 3,
    eligible: (s) => s.employees.some((e) => e.morale < 50 && s.day - (s.flags['aumento_' + e.id] ?? -99) > 10),
    defaultOption: 'rechazar',
    start: (s) => {
      const e = s.employees.find((x) => x.morale < 50 && s.day - (s.flags['aumento_' + x.id] ?? -99) > 10)!;
      s.flags['aumento_' + e.id] = s.day;
      const newWage = Math.round((e.wage * 1.15) / 10) * 10;
      addMessage(s, {
        kind: 'personal',
        eventId: 'aumento',
        from: e.name,
        subject: 'Quiero hablar de mi sueldo',
        body:
          `Jefe, la verdad le estoy echando muchas ganas y siento que no me alcanza. ¿Me podría subir a ${money(newWage)} al día? ` +
          'Si no, voy a tener que buscar otra cosa.',
        options: [
          { id: 'aceptar', label: `Subirle a ${money(newWage)}/día` },
          { id: 'rechazar', label: 'No es posible por ahora' },
        ],
        data: { employeeId: e.id, newWage },
      });
    },
    resolve: (s, msg, option) => {
      const e = s.employees.find((x) => x.id === Number(msg.data!.employeeId));
      if (!e) return;
      if (option === 'aceptar') {
        e.wage = Number(msg.data!.newWage);
        e.morale = Math.min(100, e.morale + 25);
      } else {
        e.morale = Math.max(0, e.morale - 12);
      }
    },
  },
  {
    id: 'critico',
    weight: 2,
    eligible: (s) => s.day >= 8,
    start: (s) => {
      s.modifiers.push({ id: 'critico', label: 'Visita de reseñista', fromDay: s.day + 1, toDay: s.day + 1 });
      addMessage(s, {
        kind: 'evento',
        from: 'Rumor en la colonia',
        subject: 'Mañana viene "El Antojólogo"',
        body:
          'Dicen que mañana pasa por aquí "El Antojólogo", el que sube reseñas de puestos a sus redes. ' +
          'Si la comida está buena y no le falta nada, te puede llevar mucha gente. Si no… mejor ni pensarlo.',
      });
    },
  },
  {
    id: 'refri',
    weight: 2,
    eligible: (s) => s.day >= 6 && !s.flags.refri && (stockOf(s, 'carne') > 0 || stockOf(s, 'queso') > 0),
    defaultOption: 'no',
    start: (s) => {
      s.flags.refri = 1;
      addMessage(s, {
        kind: 'evento',
        eventId: 'refri',
        from: 'Tu refrigerador',
        subject: '¡El refrigerador dejó de enfriar!',
        body:
          'Esta mañana el refri amaneció tibio. El técnico dice que lo arregla hoy mismo por $900. ' +
          'Si no lo arreglas, se pierde toda la carne y el queso que tienes guardados.',
        options: [
          { id: 'reparar', label: 'Repararlo ($900)' },
          { id: 'no', label: 'No reparar (se pierde carne y queso)' },
        ],
      });
    },
    resolve: (s, _msg, option) => {
      if (option === 'reparar') {
        if (s.cash < 900) throw new GameError('No tienes suficiente efectivo para la reparación.');
        s.cash -= 900;
        s.today.other += 900;
        s.today.notes.push('Reparación del refrigerador: $900');
      } else {
        const lost = discardLots(s, (l) => l.ingredientId === 'carne' || l.ingredientId === 'queso');
        s.today.waste += lost;
        s.today.notes.push(`Se echaron a perder carne y queso por la falla del refri: ${money(lost)}`);
      }
      teach(s, 'mantenimiento');
    },
  },
];

export function eventById(id: string): GameEvent | undefined {
  return EVENTS.find((e) => e.id === id);
}

/** Puede lanzar un evento al empezar un día nuevo. */
export function maybeStartEvent(s: GameState, rng: Rng): void {
  if (s.day < 3 || !rng.chance(0.35)) return;
  const eligible = EVENTS.filter((e) => e.eligible(s) && s.day - (s.flags['evento_' + e.id] ?? -99) >= 7);
  const ev = rng.weighted(eligible, eligible.map((e) => e.weight));
  if (!ev) return;
  s.flags['evento_' + ev.id] = s.day;
  ev.start(s, rng);
}
