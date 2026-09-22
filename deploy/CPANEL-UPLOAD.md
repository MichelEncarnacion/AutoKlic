# Deploy AutoKlic en Namecheap cPanel (subdominio)

**URL de producción:** https://autoclik.michel-encarnacion.dev  
**Dominio padre (DNS/cPanel):** michel-encarnacion.dev  
**Hostname:** `autoclik.michel-encarnacion.dev` (tal como lo escribió Michel: AUTOCLIK)  
**Stack:** Apache + PHP + MySQL (sin Supabase / sin Vercel).

## Credenciales admin (arranque limpio)

Tras importar `sql/schema.sql` + `sql/seed-admin.sql`:

| Campo | Valor |
|-------|--------|
| Email | `admin@autoclik.michel-encarnacion.dev` |
| Password temporal | `AdminTemp2026!` |
| Login | https://autoclik.michel-encarnacion.dev/login |

**Obligatorio:** al primer acceso, ir a **Perfil** y cambiar la contraseña.

Catálogo, leads y compras empiezan vacíos (sin import de Supabase).

---

## Qué crear en cPanel (Michel)

1. **Subdominio** `autoclik` bajo `michel-encarnacion.dev`  
   - Anotar el **document root** que cPanel asigne (ejemplos comunes):
     - `/home/USUARIO/autoclik.michel-encarnacion.dev`
     - `/home/USUARIO/public_html/autoclik`
   - **No** asumir que es el `public_html` del dominio apex.
2. **MySQL® Databases**
   - Crear DB + usuario + contraseña (Michel las define; no inventar)
   - ALL PRIVILEGES al usuario sobre esa DB
3. **SSL** AutoSSL para el subdominio
4. Opcional: correo para resets (`mail()` PHP)

---

## Layout en el servidor (document root del subdominio)

Llamamos `DOCROOT` al document root del subdominio (ver arriba).

```
/home/USUARIO_CPANEL/
  autoklic-config.php     ← FUERA del DOCROOT (copiar desde config/config.example.php)
  DOCROOT/                ← raíz web de autoclik.michel-encarnacion.dev
    index.html            ← build Vite (dist/)
    assets/
    .htaccess             ← SPA; excluye /api y /uploads
    api/                  ← PHP del repo
    uploads/
      car-images/
      compra-docs/
```

`RewriteBase /` en `.htaccess` es correcto si el subdominio apunta a la raíz del DOCROOT (caso normal).

---

## Checklist de subida

### A. Build

```bash
cp .env.example .env   # VITE_SITE_URL ya es el subdominio
npm ci
npm run build
# o: bash deploy/build-package.sh
```

### B. phpMyAdmin

1. Importar `sql/schema.sql`
2. Importar `sql/seed-admin.sql`

### C. Config PHP

1. Subir `config/config.example.php` como `/home/USUARIO/autoklic-config.php`
2. Rellenar `db.*`, `jwt_secret`, y:
   - `site_url` → `https://autoclik.michel-encarnacion.dev`
   - `uploads_path` → ruta absoluta a `DOCROOT/uploads`
   - `uploads_url` → `https://autoclik.michel-encarnacion.dev/uploads`
3. Nunca dejar secretos dentro del DOCROOT

### D. Archivos en DOCROOT

| Origen | Destino |
|--------|---------|
| Contenido de `dist/` | `DOCROOT/` |
| Carpeta `api/` del repo | `DOCROOT/api/` |
| Dirs `uploads/car-images`, `uploads/compra-docs` | `DOCROOT/uploads/...` |

Permisos de escritura en `uploads/` (755/775 según el host).

### E. Prueba

1. https://autoclik.michel-encarnacion.dev/
2. https://autoclik.michel-encarnacion.dev/api/health
3. Login admin → cambiar password
4. Inventario + foto; valuación `/api/car-price`

---

## Paquete mínimo

| Origen | Destino |
|--------|---------|
| `dist/*` | DOCROOT del subdominio |
| `api/` | `DOCROOT/api/` |
| `uploads/` dirs | `DOCROOT/uploads/` |
| config editado | `/home/USER/autoklic-config.php` |
| `sql/*.sql` | phpMyAdmin |

Script: `bash deploy/build-package.sh` → `deploy/package/` (zippear y subir).
