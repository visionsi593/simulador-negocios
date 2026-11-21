import type { DishDef, IngredientDef, Weather } from './types';

// Precios aproximados en pesos mexicanos. Son valores de juego, ajustables.

export const INGREDIENTS: IngredientDef[] = [
  { id: 'tortilla', name: 'Tortilla', unit: 'pz', basePrice: 0.6, shelfLife: 2, volatility: 0.02, step: 50 },
  { id: 'carne', name: 'Carne para guisado', unit: 'kg', basePrice: 150, shelfLife: 3, volatility: 0.04, step: 1 },
  { id: 'queso', name: 'Queso Oaxaca', unit: 'kg', basePrice: 130, shelfLife: 7, volatility: 0.03, step: 1 },
  { id: 'bolillo', name: 'Bolillo', unit: 'pz', basePrice: 3, shelfLife: 1, volatility: 0.01, step: 10 },
  { id: 'verdura', name: 'Verdura (cebolla, jitomate, chile)', unit: 'kg', basePrice: 32, shelfLife: 4, volatility: 0.06, step: 1 },
  { id: 'fruta', name: 'Fruta de temporada', unit: 'kg', basePrice: 28, shelfLife: 4, volatility: 0.06, step: 1 },
  { id: 'azucar', name: 'Azúcar', unit: 'kg', basePrice: 28, shelfLife: 365, volatility: 0.01, step: 1 },
];

export const DISHES: DishDef[] = [
  {
    id: 'tacos',
    name: 'Orden de tacos de guisado',
    category: 'plato',
    description: '3 tacos de guisado con verdura.',
    recipe: { tortilla: 3, carne: 0.12, verdura: 0.05 },
    refPrice: 45,
    popularity: 1.3,
    prepUnits: 1,
  },
  {
    id: 'quesadilla',
    name: 'Quesadillas',
    category: 'plato',
    description: '2 quesadillas de queso Oaxaca.',
    recipe: { tortilla: 2, queso: 0.07, verdura: 0.02 },
    refPrice: 32,
    popularity: 1.0,
    prepUnits: 0.9,
  },
  {
    id: 'torta',
    name: 'Torta de guisado',
    category: 'plato',
    description: 'Bolillo con guisado, queso y verdura.',
    recipe: { bolillo: 1, carne: 0.1, queso: 0.03, verdura: 0.04 },
    refPrice: 52,
    popularity: 0.9,
    prepUnits: 1.1,
  },
  {
    id: 'agua',
    name: 'Agua fresca',
    category: 'bebida',
    description: 'Vaso de 500 ml.',
    recipe: { fruta: 0.15, azucar: 0.03 },
    refPrice: 20,
    popularity: 1,
    prepUnits: 0.3,
  },
];

export const INGREDIENT_MAP: Record<string, IngredientDef> = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));
export const DISH_MAP: Record<string, DishDef> = Object.fromEntries(DISHES.map((d) => [d.id, d]));

export const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
/** Clientes base por día de la semana (lunes a domingo). */
export const WEEKDAY_DEMAND = [50, 48, 52, 56, 70, 86, 76];

export const WEATHER: Record<Weather, { label: string; demand: number; drinks: number }> = {
  soleado: { label: 'Soleado', demand: 1, drinks: 1 },
  caluroso: { label: 'Caluroso', demand: 1.03, drinks: 1.7 },
  nublado: { label: 'Nublado', demand: 0.95, drinks: 0.8 },
  lluvia: { label: 'Lluvia', demand: 0.7, drinks: 0.5 },
};

/** Gasto fijo diario: renta del lugar, gas y luz. */
export const FIXED_COST_PER_DAY = 250;
export const STARTING_CASH = 15000;
/** Porciones (unidades de trabajo) que el dueño prepara solo en un día. */
export const OWNER_CAPACITY = 40;
export const OWNER_QUALITY = 12;
/** Días de sueldo que se pagan al despedir a alguien. */
export const SEVERANCE_DAYS = 3;
export const MENTOR = 'Don Ramiro (tu contador)';

export const FIRST_NAMES = [
  'Lupita', 'Juan', 'Rosa', 'Memo', 'Karla', 'Toño', 'Fer', 'Paty', 'Beto', 'Mariana',
  'Chuy', 'Elena', 'Raúl', 'Sofi', 'Pepe', 'Brenda', 'Iván', 'Carmen', 'Luis', 'Adriana',
];
export const LAST_NAMES = [
  'Hernández', 'García', 'López', 'Martínez', 'Ramírez', 'Flores', 'Sánchez', 'Torres', 'Cruz', 'Morales',
];
export const TRAITS = [
  'Trabajó en una fonda',
  'Muy puntual',
  'Estudiante, quiere ganar experiencia',
  'Le encanta cocinar',
  'Buen trato con la gente',
  'Busca trabajo estable',
  'Trabajó en una cadena de comida rápida',
];
