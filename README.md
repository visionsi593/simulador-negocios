# Simulador de Negocios

Un juego de gestión para PC, al estilo de un "Football Manager de los negocios": empiezas con un puesto de comida y vas creciendo hasta dirigir una planta de alimentos. Está enfocado en la parte administrativa (costos, inventario, personal, finanzas) y en **aprender** cómo funciona un negocio real.

## Estado actual: prototipo del Acto 1 · El puesto

- Calendario día a día con botón **Continuar** y bandeja de mensajes.
- Mentor (Don Ramiro, el contador) que explica cada concepto la primera vez que aparece.
- Glosario: los términos subrayados muestran su definición al pasar el ratón.
- Menú con **costeo de recetas**, precios y margen por platillo.
- Compras al precio del mercado del día, inventario por lotes con **caducidad** (merma) y consumo PEPS.
- Clientes que reaccionan al precio, clima, reputación, variedad y capacidad (ventas perdidas).
- Personal con rapidez, calidad, ánimo y sueldo; contratar, despedir (finiquito), aumentos.
- **Estado de resultados**, **flujo de efectivo**, punto de equilibrio y gráfica de caja.
- Eventos: feria, alza de la carne, ofertas de proveedores, permiso sanitario, pedidos especiales, reseñista, falla del refrigerador.
- Historia con 6 objetivos; al cumplirlos termina el Acto 1.
- Vista animada del puesto que repite el día anterior.

## Cómo correrlo

Requiere Node.js 20 o más reciente.

```bash
npm install
npm run dev        # abre el juego en el navegador (http://localhost:5173)
npm test           # pruebas del motor de simulación
npm run balance    # juega partidas automáticas para revisar el equilibrio económico
npm run build      # versión final en dist/
```

## Estructura

```
src/sim/      Motor de simulación (TypeScript puro, sin interfaz; se prueba solo)
  engine.ts     Acciones del jugador y simulación de cada día
  story.ts      Lecciones del mentor, objetivos y eventos del Acto 1
  data.ts       Ingredientes, platillos, precios y constantes de equilibrio
  glossary.ts   Glosario de conceptos de negocio
src/ui/       Interfaz en React (pantallas, vista animada, gráfica)
tools/        Herramientas de desarrollo (bot de equilibrio)
docs/         Documento de diseño y hoja de ruta
```

El motor no depende de la interfaz: todo el estado es JSON, la partida es reproducible con una semilla y cada regla de negocio se puede probar con `npm test`.

Ver [docs/diseno.md](docs/diseno.md) para la visión completa y los siguientes pasos (Steam incluido).
