# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start development server (Vite HMR)
npm run build     # Production build
npm run preview   # Preview production build locally
npm run lint      # Run ESLint
```

## Architecture

**AutoKlic** is a static, client-side-only car dealership marketing site (Spanish/es-MX). No backend — all car data is hard-coded in component files.

**Entry flow:**
```
index.html → src/main.jsx (wraps App with Material Tailwind ThemeProvider)
  → src/App.jsx (BrowserRouter, AOS init, layout: Navbar + routes + Footer)
    ├── / → Hero + FeaturedCars + Process + ContactForm
    └── /autos/:modelo → AutoDetalle (page)
```

**Car data** is stored as plain arrays of objects directly in two files:
- `src/components/FeaturedCars.jsx` — the 3 featured car cards on the home page
- `src/pages/AutoDetalle.jsx` — full specs + image arrays for each car detail page

Both files must stay in sync when adding/editing car listings. Each car object has `modelo`, `precio`, `imagenes[]`, `descripcion`, and a `ficha` object with spec fields (año, motor, transmision, combustible, color, puertas, traccion, kilometraje, aire, infoentretenimiento).

**Styling:** Tailwind CSS utilities throughout. `src/index.css` sets base element styles and Tailwind directives. `src/App.css` is minimal (legacy logo animation only).

**Animations:** AOS (Animate On Scroll) initialized in `App.jsx`; add `data-aos="..."` attributes to elements.

**Stack:** React 19, Vite 7, React Router DOM 7, Tailwind CSS 3, Material Tailwind (component library), Heroicons + React Icons, React Responsive Carousel, AOS.
