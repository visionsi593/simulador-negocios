# Documento de diseño

## Concepto

Un juego de gestión de negocios para PC. El jugador es el dueño: no construye cintas transportadoras, **toma decisiones de negocio**. El ritmo es día a día, como en Football Manager: revisas la bandeja, decides y le das a "Continuar". Cuando quieres, abres la vista del local o de la planta para verla funcionar.

Tiene dos objetivos al mismo tiempo:

1. **Divertir:** cada número real debe convertirse en una decisión con tensión (¿compro más y arriesgo merma, o menos y arriesgo ventas perdidas?).
2. **Enseñar:** al terminar, el jugador sabe leer un estado de resultados, costear una receta, calcular su punto de equilibrio y entender por qué un negocio con utilidades puede quedarse sin efectivo.

## Pilares

- **Realismo con números de verdad:** contabilidad real (estado de resultados, flujo de efectivo, inventario), precios de mercado que cambian, personas con atributos.
- **Aprender jugando:** un mentor explica cada concepto la primera vez que importa; glosario siempre a la mano.
- **Progresión:** del puesto a la planta. Cada acto agrega sistemas nuevos sobre los anteriores.
- **Simulación separada de la interfaz:** el motor se prueba y se equilibra solo.

## Campaña de alimentos

| Acto | Negocio | Sistemas nuevos |
|---|---|---|
| 1 ✅ | Puesto de comida | Costeo, compras, caducidad, precios, primer empleado, estado de resultados, flujo |
| 2 | Restaurante | Local con renta, turnos, roles (cocina/servicio), préstamo bancario e intereses, competencia con IA, reseñas |
| 3 | Cocina de producción | Venta por mayoreo a otros negocios, contratos, crédito a clientes (cuentas por cobrar), lotes, control sanitario |
| 4 | Planta de alimentos | Líneas de producción, OEE, mantenimiento preventivo/correctivo, calidad (HACCP), cadena de frío, distribución, negociación con cadenas de supermercados |

Después: otras industrias (por ejemplo panificación, bebidas, metalmecánica, plásticos) como campañas nuevas o modo libre.

## Siguientes pasos sugeridos

1. **Probar y ajustar el Acto 1** con jugadores reales (lo más importante: ¿es divertido?).
2. **Guardado en varias ranuras** y opción de elegir dificultad.
3. **Versión de escritorio** con Electron: ventana propia, guardado en archivo, ícono.
4. **Acto 2 · El restaurante.**
5. **Mejor arte** para la vista del local (sprites en lugar de figuras simples).
6. **Steam:** cuenta de Steamworks (cuota de Steam Direct), página de la tienda con capturas y tráiler para juntar listas de deseados, integración con logros y guardado en la nube (steamworks.js).

## Tecnología

- TypeScript + React + Vite.
- Vista animada en Canvas 2D (se puede migrar a PixiJS cuando el arte crezca).
- Pruebas con Vitest; bot de equilibrio en `tools/balance.ts`.
- Para PC: Electron (o Tauri) para empaquetar como `.exe`; steamworks.js para Steam.
