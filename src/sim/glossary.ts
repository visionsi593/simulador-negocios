// Glosario de conceptos de negocio. Se muestra al pasar el ratón sobre un término.
import type { GameScreen } from './types';

export interface GlossaryTerm {
  term: string;
  definition: string;
  example?: string;
}

export const GLOSSARY: Record<string, GlossaryTerm> = {
  ventas: {
    term: 'Ventas (ingresos)',
    definition: 'Todo el dinero que cobras a tus clientes por lo que vendes.',
    example: '40 órdenes de tacos a $45 = $1,800 de ventas.',
  },
  costo_ventas: {
    term: 'Costo de ventas',
    definition:
      'Lo que te costaron los ingredientes de lo que SÍ vendiste. Lo que compraste y sigue en el refri todavía no es costo: es inventario.',
    example: 'Si una orden de tacos lleva $25 de ingredientes y vendes 40, tu costo de ventas es $1,000.',
  },
  costeo_receta: {
    term: 'Costeo de receta',
    definition:
      'Calcular cuánto cuesta producir una porción sumando cada ingrediente por su precio. Es la base para decidir el precio de venta.',
    example: '3 tortillas ($1.80) + 120 g de carne ($18) + 50 g de verdura ($1.60) = $21.40 por orden.',
  },
  utilidad_bruta: {
    term: 'Utilidad bruta',
    definition: 'Ventas menos costo de ventas. Es lo que te queda para pagar todo lo demás (sueldos, renta, etc.).',
  },
  margen_bruto: {
    term: 'Margen bruto',
    definition: 'La utilidad bruta como porcentaje de las ventas. Dice cuántos centavos te quedan de cada peso vendido.',
    example: 'Vendes en $45 algo que cuesta $21: margen = (45 − 21) / 45 = 53%.',
  },
  utilidad_neta: {
    term: 'Utilidad neta',
    definition:
      'Lo que realmente ganó el negocio: ventas menos TODOS los gastos (ingredientes, mermas, sueldos, renta, multas…).',
  },
  gastos_fijos: {
    term: 'Gastos fijos',
    definition: 'Gastos que pagas vendas o no vendas: renta, luz, gas, permisos.',
  },
  gastos_variables: {
    term: 'Gastos variables',
    definition: 'Gastos que suben o bajan según cuánto vendes, como los ingredientes.',
  },
  merma: {
    term: 'Merma',
    definition: 'Producto que se pierde: caduca, se echa a perder o se desperdicia. Es dinero que tiras a la basura.',
    example: 'Compraste 100 bolillos, vendiste 70 y 30 se pusieron duros: esos 30 son merma.',
  },
  inventario: {
    term: 'Inventario',
    definition:
      'Los productos que tienes guardados para vender o usar. Es dinero "congelado": ya salió de tu caja pero aún no se convierte en venta.',
  },
  peps: {
    term: 'PEPS (primero en entrar, primero en salir)',
    definition:
      'Usar primero lo más viejo para que no caduque. En el juego tu puesto siempre usa primero el lote que caduca antes.',
  },
  vida_util: {
    term: 'Vida útil',
    definition: 'Cuántos días dura un producto en buen estado desde que lo compras.',
  },
  venta_perdida: {
    term: 'Venta perdida',
    definition:
      'Un cliente que quería comprar y se fue sin hacerlo, por falta de producto o porque no lo atendiste a tiempo. No aparece en tus reportes de ventas, pero sí cuesta.',
  },
  capacidad: {
    term: 'Capacidad',
    definition:
      'Cuánto puedes producir o atender en un día con tu gente y tu equipo. Si la demanda es mayor que tu capacidad, pierdes ventas.',
  },
  demanda: {
    term: 'Demanda',
    definition: 'Cuántos clientes quieren comprarte. Depende del día, el clima, tus precios y tu reputación.',
  },
  pronostico: {
    term: 'Pronóstico de demanda',
    definition: 'Estimar cuánto vas a vender para comprar lo justo: ni tanto que se eche a perder, ni tan poco que se acabe.',
  },
  flujo_efectivo: {
    term: 'Flujo de efectivo',
    definition:
      'El dinero que realmente entra y sale de tu caja. No es lo mismo que la utilidad: puedes ganar dinero y aun así quedarte sin efectivo.',
  },
  elasticidad: {
    term: 'Elasticidad precio',
    definition:
      'Qué tanto cambian tus ventas cuando cambias el precio. Si subes mucho el precio, llegan menos clientes y piden menos.',
  },
  punto_equilibrio: {
    term: 'Punto de equilibrio',
    definition: 'Lo mínimo que tienes que vender para no perder ni ganar: cubre exactamente tus gastos.',
    example: 'Gastos fijos de $250 al día y te quedan $24 por orden: necesitas 250 / 24 ≈ 11 órdenes para cubrirlos.',
  },
  costo_laboral: {
    term: 'Costo laboral',
    definition:
      'Lo que te cuesta tu personal: sueldo y prestaciones. Un empleado conviene si las ventas extra que trae dejan más que lo que cuesta.',
  },
  finiquito: {
    term: 'Finiquito / indemnización',
    definition: 'Lo que pagas al despedir a alguien. En el juego es el sueldo de 3 días; en la vida real depende de la ley de tu país.',
  },
  reputacion: {
    term: 'Reputación',
    definition:
      'Lo que la gente piensa de tu negocio. Sube con buena comida a buen precio y baja cuando los clientes se van sin comprar.',
  },
  rotacion: {
    term: 'Rotación de personal',
    definition: 'Qué tan seguido se te va la gente. Cada vez que alguien renuncia pierdes experiencia y tienes que volver a contratar.',
  },
  cumplimiento: {
    term: 'Cumplimiento normativo',
    definition: 'Tener en regla tus permisos y cumplir las normas sanitarias. Cuesta dinero, pero no cumplir puede costar mucho más.',
  },
  mantenimiento: {
    term: 'Mantenimiento',
    definition:
      'Cuidar tu equipo para que no falle. El preventivo se hace antes de que algo se rompa; el correctivo, después (y suele salir más caro).',
  },
  ticket_promedio: {
    term: 'Ticket promedio',
    definition: 'Cuánto gasta en promedio cada cliente: ventas entre número de clientes atendidos.',
  },
};

/** Pantalla del juego donde se trabaja cada concepto. Los que no tienen pantalla abren el glosario. */
export const TERM_SCREEN: Record<string, GameScreen> = {
  ventas: 'finanzas',
  costo_ventas: 'finanzas',
  costeo_receta: 'menu',
  utilidad_bruta: 'finanzas',
  margen_bruto: 'menu',
  utilidad_neta: 'finanzas',
  gastos_fijos: 'finanzas',
  gastos_variables: 'menu',
  merma: 'compras',
  inventario: 'compras',
  peps: 'compras',
  vida_util: 'compras',
  venta_perdida: 'negocio',
  capacidad: 'personal',
  demanda: 'negocio',
  pronostico: 'compras',
  flujo_efectivo: 'finanzas',
  elasticidad: 'menu',
  punto_equilibrio: 'finanzas',
  costo_laboral: 'personal',
  finiquito: 'personal',
  reputacion: 'negocio',
  rotacion: 'personal',
  ticket_promedio: 'finanzas',
};

export const SCREEN_NAME: Record<GameScreen, string> = {
  bandeja: 'Bandeja',
  negocio: 'Mi negocio',
  menu: 'Menú y precios',
  compras: 'Compras e inventario',
  personal: 'Personal',
  finanzas: 'Finanzas',
  objetivos: 'Objetivos',
  glosario: 'Glosario',
};
