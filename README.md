# AutoKlic

Sitio de marketing para agencia de autos seminuevos en Puebla, México. Incluye catálogo público, valuación de vehículos y panel de administración completo.

## Stack

- **Frontend:** React 19, Vite 7, Tailwind CSS 3, React Router DOM 7
- **Backend:** Supabase (Auth + PostgreSQL + Storage)
- **Deploy:** Vercel (serverless functions en `/api`)
- **Librerías:** Material Tailwind, Heroicons, React Icons, React Responsive Carousel, AOS, react-hot-toast, react-hook-form, date-fns

## Páginas públicas

| Ruta | Descripción |
|------|-------------|
| `/` | Home — Hero, autos destacados, proceso de compra, formulario de contacto |
| `/catalogo` | Catálogo completo de vehículos |
| `/autos/:modelo` | Detalle del vehículo con galería y ficha técnica |
| `/valua-tu-auto` | Valuación gratuita con precios reales de Mercado Libre |
| `/vende-tu-auto` | Formulario para vender un auto |

## Panel de administración (`/admin`)

Acceso protegido por rol. Roles: `admin`, `seller`, `viewer`.

| Sección | Descripción |
|---------|-------------|
| Dashboard | KPIs: inventario, leads activos, leads esta semana, tasa de cierre |
| Inventario | CRUD de vehículos con imágenes, estado y visibilidad en catálogo |
| Leads | Pipeline de solicitudes de compra/venta con asignación y notas |
| Reportes | Métricas por rango de fechas, exportación PDF/CSV |
| Usuarios | Crear, desactivar/reactivar y eliminar cuentas del panel |
| Perfil | Cambio de nombre y contraseña del usuario actual |

## Comandos

```bash
npm run dev       # Servidor de desarrollo (Vite HMR)
npm run build     # Build de producción
npm run preview   # Preview del build en local
npm run lint      # ESLint
```

## Variables de entorno

Crea un archivo `.env` en la raíz con:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # solo Vercel, nunca en cliente
```

## Serverless functions (`/api`)

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/create-user` | POST | Crea usuario en Supabase Auth (requiere admin) |
| `/api/toggle-user` | POST | Desactiva o reactiva un usuario (requiere admin) |
| `/api/delete-user` | POST | Elimina permanentemente un usuario (requiere admin) |
| `/api/car-price` | GET | Consulta precios de Mercado Libre para valuación |

## Base de datos (Supabase)

Tablas principales: `profiles`, `cars`, `leads`.

La tabla `profiles` extiende `auth.users` con: `nombre`, `email`, `role`, `active`.
