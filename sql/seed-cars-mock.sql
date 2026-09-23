-- Seed: demo cars for empty AutoKlic inventory (mock / preview).
-- Run AFTER sql/schema.sql in phpMyAdmin.
-- Images are served from DOCROOT /autos/* (Vite public/autos → dist/autos).
-- IDs are fixed so re-import is idempotent (REPLACE).
-- When you add real inventory via admin, delete these rows or set visible = 0.

REPLACE INTO cars (
  id, marca, modelo, `año`, precio, kilometraje, motor, transmision, combustible,
  color, puertas, traccion, aire, infoentretenimiento, descripcion, imagenes, status, visible
) VALUES
(
  'm0000000-0000-4000-8000-000000000001',
  'Volkswagen', 'Jetta Comfortline', 2021, 289000.00, 42500, '1.4 TSI', 'Automática', 'Gasolina',
  'Blanco', 4, 'Delantera', 1,
  'Pantalla 8" Apple CarPlay / Android Auto',
  'Jetta seminuevo en excelente estado, único dueño, servicios en agencia. Ideal para ciudad y carretera.',
  '["/autos/jetta.webp"]',
  'available', 1
),
(
  'm0000000-0000-4000-8000-000000000002',
  'Mazda', 'CX-5 Signature', 2022, 425000.00, 31800, '2.5 Skyactiv', 'Automática', 'Gasolina',
  'Rojo Soul', 5, 'AWD', 1,
  'Mazda Connect con Bose',
  'SUV familiar con tracción AWD, interior piel y paquete Signature. Listo para entregar en Puebla.',
  '["/autos/mazda.webp"]',
  'available', 1
),
(
  'm0000000-0000-4000-8000-000000000003',
  'Toyota', 'Corolla LE', 2020, 268000.00, 58200, '1.8', 'CVT', 'Gasolina',
  'Plata', 4, 'Delantera', 1,
  'Pantalla táctil con cámara de reversa',
  'Corolla confiable, bajo consumo y mantenimiento económico. Historial de servicios disponible.',
  '["/autos/toyota.jpeg","/autos/toyota2.jpeg","/autos/toyota3.jpeg"]',
  'available', 1
),
(
  'm0000000-0000-4000-8000-000000000004',
  'Audi', 'A3 Sportback', 2019, 355000.00, 67400, '1.4 TFSI', 'Automática', 'Gasolina',
  'Negro Mythos', 5, 'Delantera', 1,
  'MMI Navigation Plus',
  'A3 hatchback con acabados premium. Verificado mecánicamente en AutoKlic Puebla.',
  '["/autos/audi.jpeg","/autos/audi2.jpeg","/autos/audi3.jpeg"]',
  'available', 1
),
(
  'm0000000-0000-4000-8000-000000000005',
  'Suzuki', 'Swift Boosterjet', 2021, 229000.00, 39100, '1.0 Turbo', 'Manual', 'Gasolina',
  'Azul', 5, 'Delantera', 1,
  'Pantalla táctil 7"',
  'Compacto ágil y económico. Perfecto para el tráfico de Puebla. Garantía de motor a consultar.',
  '["/autos/susuki.jpeg","/autos/susuki2.jpeg","/autos/susuki3.jpeg"]',
  'available', 1
),
(
  'm0000000-0000-4000-8000-000000000006',
  'Porsche', 'Macan S', 2018, 689000.00, 71200, '3.0 V6 Turbo', 'Automática', 'Gasolina',
  'Gris Agate', 5, 'AWD', 1,
  'PCM con navegación',
  'Macan S con desempeño y presencia. Seminuevo de alta gama, cita previa para prueba de manejo.',
  '["/autos/porsche.webp"]',
  'available', 1
),
(
  'm0000000-0000-4000-8000-000000000007',
  'Toyota', 'RAV4 XLE', 2021, 448000.00, 45600, '2.5', 'Automática', 'Gasolina',
  'Blanco Perlado', 5, 'AWD', 1,
  'Toyota Audio Multimedia',
  'RAV4 XLE AWD, espaciosa y segura. Una de las SUV más buscadas del mercado mexicano.',
  '["/autos/toyota2.jpeg","/autos/toyota.jpeg"]',
  'available', 1
),
(
  'm0000000-0000-4000-8000-000000000008',
  'Audi', 'Q5 Select', 2020, 529000.00, 53800, '2.0 TFSI', 'Automática', 'Gasolina',
  'Gris Daytona', 5, 'Quattro', 1,
  'Virtual Cockpit',
  'Q5 con Quattro y Virtual Cockpit. Inventario demo AutoKlic — reemplazar por unidades reales vía admin.',
  '["/autos/audi2.jpeg","/autos/audi3.jpeg","/autos/audi.jpeg"]',
  'reserved', 1
);
