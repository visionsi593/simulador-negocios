// Tipos del motor de simulación.
// Todo el estado del juego es JSON plano: se puede guardar, cargar y probar sin interfaz.

export type Unit = 'pz' | 'kg';

export interface IngredientDef {
  id: string;
  name: string;
  unit: Unit;
  /** Precio base de mercado por unidad. */
  basePrice: number;
  /** Días que dura en buen estado, contando el día de compra. */
  shelfLife: number;
  /** Qué tanto varía el precio día con día (0 = nada). */
  volatility: number;
  /** Cantidad mínima en la que se compra. */
  step: number;
}

export type DishCategory = 'plato' | 'bebida';

export interface DishDef {
  id: string;
  name: string;
  category: DishCategory;
  description: string;
  /** Ingredientes por porción: id de ingrediente -> cantidad. */
  recipe: Record<string, number>;
  /** Precio típico en la zona (lo que cobra la competencia). */
  refPrice: number;
  /** Qué tanto lo piden los clientes (peso relativo). */
  popularity: number;
  /** Cuánta capacidad de trabajo consume preparar una porción. */
  prepUnits: number;
}

export interface MenuItem {
  dishId: string;
  price: number;
  active: boolean;
}

/** Un lote de inventario: se consume en orden de caducidad (primero en caducar, primero en salir). */
export interface Lot {
  id: number;
  ingredientId: string;
  qty: number;
  unitCost: number;
  boughtDay: number;
  /** Último día en que se puede usar. */
  expiresDay: number;
}

export interface Person {
  id: number;
  name: string;
  /** 1 a 20: qué tan rápido trabaja. */
  speed: number;
  /** 1 a 20: qué tan bien le queda la comida. */
  quality: number;
  /** Sueldo por día. */
  wage: number;
}

export interface Employee extends Person {
  /** 0 a 100. */
  morale: number;
  hiredDay: number;
}

export interface Candidate extends Person {
  trait: string;
}

export interface MessageOption {
  id: string;
  label: string;
  hint?: string;
}

export type MessageKind = 'mentor' | 'evento' | 'sistema' | 'personal' | 'objetivo';

export interface Message {
  id: number;
  day: number;
  kind: MessageKind;
  from: string;
  subject: string;
  /** Texto del mensaje. Admite [[termino|texto]] para enlazar al glosario. */
  body: string;
  read: boolean;
  options?: MessageOption[];
  choice?: string;
  eventId?: string;
  data?: Record<string, number | string>;
}

export type Weather = 'soleado' | 'caluroso' | 'nublado' | 'lluvia';

export interface DayReport {
  day: number;
  weather: Weather;
  /** Clientes que llegaron. */
  customers: number;
  /** Clientes atendidos. */
  served: number;
  /** Se fueron porque faltaba algún ingrediente. */
  lostStock: number;
  /** Se fueron porque no se daba abasto (fila muy larga). */
  lostCapacity: number;
  itemsSold: Record<string, number>;
  revenue: number;
  /** Costo de los ingredientes que se vendieron. */
  cogs: number;
  /** Costo de lo que caducó y se tiró. */
  waste: number;
  wages: number;
  fixed: number;
  other: number;
  /** Dinero gastado en compras de ingredientes (salida de caja, no es gasto todavía). */
  purchases: number;
  cashStart: number;
  cashEnd: number;
  reputationEnd: number;
  /** 0 a 100. */
  satisfaction: number;
  notes: string[];
}

export interface Modifier {
  id: string;
  label: string;
  fromDay: number;
  toDay: number;
  /** Multiplica la cantidad de clientes. */
  demand?: number;
  ingredient?: string;
  /** Multiplica el precio de un ingrediente. */
  priceFactor?: number;
}

export interface SpecialOrder {
  id: number;
  dishId: string;
  qty: number;
  unitPrice: number;
  day: number;
  client: string;
}

export type GameStatus = 'jugando' | 'quiebra';

export interface GameState {
  version: 1;
  /** Estado del generador aleatorio (hace la partida reproducible). */
  rng: number;
  /** Día que se está por jugar. */
  day: number;
  businessName: string;
  cash: number;
  /** 0 a 100. */
  reputation: number;
  inventory: Lot[];
  marketFactor: Record<string, number>;
  menu: MenuItem[];
  employees: Employee[];
  candidates: Candidate[];
  messages: Message[];
  reports: DayReport[];
  /** Movimientos del día en curso, antes de cerrar caja. */
  today: { cashStart: number; purchases: number; other: number; waste: number; notes: string[] };
  forecast: Weather;
  modifiers: Modifier[];
  specialOrders: SpecialOrder[];
  lessonsSeen: string[];
  objectiveIndex: number;
  nextId: number;
  negativeDays: number;
  flags: Record<string, number>;
  status: GameStatus;
}
