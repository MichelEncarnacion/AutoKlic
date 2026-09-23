# Deploy AutoKlic en Namecheap cPanel (subdominio)

**URL de producción:** https://autoclik.michel-encarnacion.dev  
**Dominio padre (DNS/cPanel):** michel-encarnacion.dev  
**Hostname:** `autoclik.michel-encarnacion.dev` (tal como lo escribió Michel: AUTOCLIK)  
**Stack:** Apache + PHP + MySQL (sin Supabase / sin Vercel).

## Credenciales admin (arranque limpio)

Tras importar `sql/schema.sql` + `sql/seed-admin.sql` (con un hash que **tú** generaste):

1. Genera password fuerte y su hash:
   ```bash
   php -r "echo password_hash('TU_PASSWORD_FUERTE', PASSWORD_DEFAULT), PHP_EOL;"
   ```
2. Pon el hash en `sql/seed-admin.sql` (`CHANGE_ME_BCRYPT_HASH`) — **nunca** commits de la contraseña en texto claro.
3. Guarda email + password solo fuera de git (gestor de contraseñas / notas internas).
4. Login: https://autoclik.michel-encarnacion.dev/login → **Perfil** → rotar password.

Catálogo, leads y compras empiezan vacíos (sin import de Supabase).

**Inventario demo (opcional):** importar `sql/seed-cars-mock.sql` en phpMyAdmin
para 8 seminuevos con fotos en `/autos/*`. El frontend también usa esos mocks
si la API pública responde vacío (útil hasta que cargues unidades reales).

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
3. (Opcional) Importar `sql/seed-cars-mock.sql` — inventario demo

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
