# AutoKlic

Sitio de marketing para agencia de autos seminuevos. Incluye catálogo público, valuación y panel de administración.

## Stack (producción cPanel)

- **Frontend:** React 19, Vite 7, Tailwind CSS 3, React Router DOM 7
- **Backend:** PHP API + MySQL (Namecheap cPanel / Apache)
- **Archivos:** `public_html/uploads/` (car-images, compra-docs)
- **Dominio:** https://autoclik.michel-encarnacion.dev

## Comandos

```bash
npm run dev       # Vite HMR (API PHP aparte en hosting o local)
npm run build     # Build → dist/
npm run preview   # Preview del build
npm run lint      # ESLint
bash deploy/build-package.sh   # Arma deploy/package/ para cPanel
```

## Deploy

Guía completa: [`deploy/CPANEL-UPLOAD.md`](deploy/CPANEL-UPLOAD.md)

Resumen: build Vite → subir `dist/` + `api/` + `uploads/` a `public_html` → config PHP **fuera** del webroot → importar `sql/schema.sql` + `sql/seed-admin.sql`.

### Admin inicial (seed)

- Email: `admin@autoclik.michel-encarnacion.dev`
- Password temporal: `AdminTemp2026!`
- Cambiar en **Perfil** al primer login.

## Variables

```env
# .env (build) — ver .env.example
VITE_SITE_URL=https://autoclik.michel-encarnacion.dev
VITE_API_BASE=/api
```

Secretos MySQL / JWT: `config/config.example.php` → copiar a `/home/USER/autoklic-config.php` en el servidor.

## API PHP (`/api`)

Auth, CRUD (cars, leads, lead_events, profiles, settings, compras, gastos), uploads, user admin, proxy Mercado Libre (`/api/car-price`).
