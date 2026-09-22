# CLAUDE.md

Guidance for working in this repository.

## Commands

```bash
npm run dev
npm run build
npm run preview
npm run lint
bash deploy/build-package.sh
```

## Architecture

**AutoKlic** is a React SPA + PHP/MySQL backend for Namecheap cPanel (Apache). Spanish/es-MX UI.

**Entry flow:**
```
index.html → src/main.jsx → src/App.jsx (BrowserRouter, AuthProvider)
 ├── / → Hero + FeaturedCars + Process + ContactForm
 ├── /catalogo, /autos/:modelo, /vende-tu-auto, /valua-tu-auto
 ├── /login, /reset-password
 └── /admin/* → panel (roles admin/seller/viewer)
```

**Data:** MySQL via PHP API (`api/`). Frontend uses `src/lib/api.js` (`fetch`). No Supabase.

**SQL:** `sql/schema.sql` + `sql/seed-admin.sql` (one bootstrap admin).

**Deploy:** `deploy/CPANEL-UPLOAD.md`. Domain: https://autoclik.michel-encarnacion.dev

**Stack:** React 19, Vite 7, React Router 7, Tailwind 3, Material Tailwind, PHP + MySQL.
