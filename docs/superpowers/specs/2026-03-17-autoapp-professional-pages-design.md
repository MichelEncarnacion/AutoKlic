# AutoApp — Professional Pages Design Spec

**Date:** 2026-03-17
**Project:** AutoKlic car dealership site (React 19 + Vite 7 + Tailwind CSS 3)
**Stack addition:** Supabase (Auth + Database + Storage)

---

## Overview

Extend the existing static React/Vite site with:

1. A public `/catalogo` inventory page
2. A public `/vende-tu-auto` lead capture page
3. A protected `/admin` single-page dashboard (login at `/login`)

---

## 1. Database Schema (Supabase)

### `cars`

| Column              | Type          | Nullable | Default           | Notes                                        |
| ------------------- | ------------- | -------- | ----------------- | -------------------------------------------- |
| id                  | uuid          | NO       | gen_random_uuid() | PK                                           |
| modelo              | text          | NO       |                   |                                              |
| marca               | text          | NO       |                   |                                              |
| año                 | integer       | NO       |                   |                                              |
| precio              | numeric(12,2) | NO       |                   |                                              |
| kilometraje         | integer       | NO       |                   |                                              |
| motor               | text          | YES      |                   | e.g. "1.6L Turbo"                            |
| transmision         | text          | NO       |                   | "Manual" or "Automática"                     |
| combustible         | text          | NO       |                   | "Gasolina", "Diésel", "Híbrido", "Eléctrico" |
| color               | text          | YES      |                   |                                              |
| puertas             | integer       | YES      |                   |                                              |
| traccion            | text          | YES      |                   | "4x2", "4x4"                                 |
| aire                | boolean       | YES      | false             | air conditioning                             |
| infoentretenimiento | text          | YES      |                   |                                              |
| descripcion         | text          | YES      |                   |                                              |
| imagenes            | text[]        | YES      | '{}'              | Supabase Storage public URLs                 |
| status              | text          | NO       | 'available'       | CHECK IN ('available','sold','reserved')     |
| visible             | boolean       | NO       | true              | controls public listing visibility           |
| created_at          | timestamptz   | NO       | now()             |                                              |

### `leads`

| Column      | Type        | Nullable | Default           | Notes                                                  |
| ----------- | ----------- | -------- | ----------------- | ------------------------------------------------------ |
| id          | uuid        | NO       | gen_random_uuid() | PK, used as folio                                      |
| nombre      | text        | NO       |                   | customer name                                          |
| email       | text        | NO       |                   |                                                        |
| telefono    | text        | NO       |                   |                                                        |
| marca       | text        | NO       |                   | car brand                                              |
| modelo      | text        | NO       |                   | car model                                              |
| año         | integer     | NO       |                   |                                                        |
| kilometraje | integer     | NO       |                   |                                                        |
| descripcion | text        | YES      |                   | additional details                                     |
| status      | text        | NO       | 'pending'         | CHECK IN ('pending','reviewing','offer_made','closed') |
| notas       | text        | YES      |                   | internal admin notes                                   |
| created_at  | timestamptz | NO       | now()             |                                                        |

### `profiles`

| Column | Type | Nullable | Default  | Notes                                                                |
| ------ | ---- | -------- | -------- | -------------------------------------------------------------------- |
| id     | uuid | NO       |          | PK, FK → auth.users(id) ON DELETE CASCADE                            |
| nombre | text | NO       |          | copied from auth.users raw_user_meta_data->>'nombre' or email prefix |
| email  | text | NO       |          | copied from auth.users.email                                         |
| role   | text | NO       | 'viewer' | CHECK IN ('admin','seller','viewer')                                 |

### Profile auto-creation trigger (SQL)

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    NEW.email,
    'viewer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### `get_my_role()` helper function (SQL)

```sql
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### Row Level Security (RLS)

All tables have RLS enabled. Policies use `get_my_role()`.

**`cars` policies:**

```sql
-- Public and all authenticated users can read visible cars
CREATE POLICY "public_read_visible_cars" ON cars
  FOR SELECT USING (visible = true);

-- Sellers and admins can read ALL cars (including hidden)
CREATE POLICY "staff_read_all_cars" ON cars
  FOR SELECT USING (get_my_role() IN ('seller', 'admin'));

-- Sellers and admins can insert cars
CREATE POLICY "staff_insert_cars" ON cars
  FOR INSERT WITH CHECK (get_my_role() IN ('seller', 'admin'));

-- Sellers and admins can update cars
CREATE POLICY "staff_update_cars" ON cars
  FOR UPDATE USING (get_my_role() IN ('seller', 'admin'));

-- Only admins can delete cars
CREATE POLICY "admin_delete_cars" ON cars
  FOR DELETE USING (get_my_role() = 'admin');
```

**`leads` policies:**

```sql
-- Anyone (anon) can insert a lead (public form)
CREATE POLICY "anon_insert_leads" ON leads
  FOR INSERT WITH CHECK (true);

-- All authenticated staff can read leads
CREATE POLICY "staff_read_leads" ON leads
  FOR SELECT USING (get_my_role() IN ('viewer', 'seller', 'admin'));

-- Sellers and admins can update leads (status, notas)
CREATE POLICY "staff_update_leads" ON leads
  FOR UPDATE USING (get_my_role() IN ('seller', 'admin'));

-- Only admins can delete leads
CREATE POLICY "admin_delete_leads" ON leads
  FOR DELETE USING (get_my_role() = 'admin');
```

**`profiles` policies:**

```sql
-- Any authenticated user can read their own profile
CREATE POLICY "self_read_profile" ON profiles
  FOR SELECT USING (id = auth.uid());

-- Admins can read all profiles
CREATE POLICY "admin_read_profiles" ON profiles
  FOR SELECT USING (get_my_role() = 'admin');

-- Admins can update roles
CREATE POLICY "admin_update_profiles" ON profiles
  FOR UPDATE USING (get_my_role() = 'admin');

-- Admins can delete profiles
CREATE POLICY "admin_delete_profiles" ON profiles
  FOR DELETE USING (get_my_role() = 'admin');
```

---

## 2. Supabase Storage

**Bucket:** `car-images`

- **Access:** Public (anon-readable). Images are stored with public URLs saved in `cars.imagenes[]`.
- **Upload path:** `{car_id}/{filename}` (e.g. `abc-123/front.jpg`)
- **RLS on storage:** Only authenticated users with role `seller` or `admin` can upload/delete files. Public can read.
- **On car DELETE:** orphaned images in storage are NOT deleted automatically in this phase. Admin cleans up storage manually via Supabase dashboard if needed.
- **On image removal in CarModal:** removed URLs are deleted from storage via `supabase.storage.from('car-images').remove([path])` before saving the updated car record.

---

## 3. Environment Variables

```
VITE_SUPABASE_URL=https://wvkvvxvqaqwkhsqjjxqs.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2a3Z2eHZxYXF3a2hzcWpqeHFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NjQwNDUsImV4cCI6MjA4OTQ0MDA0NX0.qn5h5Xu-cTc0uP6pkBu9HZAkttdEt_-R12QxMuN9fYw
```

Add both to `.env.local` (already in `.gitignore`).

**Note on user invites:** `supabase.auth.admin.inviteUserByEmail()` requires the service role key and cannot be called from the frontend with the anon key. For this MVP, user invites are done via the Supabase dashboard. The "Invitar usuario" button in the Usuarios section opens a toast with instructions: "Ve al dashboard de Supabase → Authentication → Users → Invite user".

---

## 4. New Dependencies

```bash
npm install @supabase/supabase-js jspdf @jspdf/autotable react-hook-form date-fns react-hot-toast
```

**PDF library:** `jspdf` (v2) + `@jspdf/autotable` (v3). Tables are rendered via `doc.autoTable({ head, body, ... })`. AutoKlic logo added via `doc.addImage(logoDataUrl, 'PNG', x, y, w, h)` in the header.

---

## 5. Public Pages

### `/catalogo`

- Reads `cars` WHERE `visible = true` from Supabase (server-side query, anon key)
- **Filter bar** (client-side filtering on fetched results): marca (select), año (range: min/max from dataset), precio (range: min/max from dataset), transmision (select)
- **Pagination:** none for MVP — load all visible cars at once
- **Card UI:** first image in `imagenes[]` (fallback placeholder if empty), marca + modelo, año, precio formatted as `$XX,XXX MXN`, status badge (`available` = green "Disponible", `reserved` = yellow "Reservado"), "Ver detalles" button
- Card links to `/autos/:modelo` — `:modelo` is `cars.modelo` lowercased with spaces replaced by hyphens. The existing `AutoDetalle` page remains hard-coded for now; `/catalogo` links only to cars whose `modelo` slug matches a hard-coded entry in `AutoDetalle`.
- Navbar gets "Catálogo" link

### `/vende-tu-auto`

**Section 1 — Tu auto:**
| Field | Type | Validation |
|---|---|---|
| marca | text input | required |
| modelo | text input | required |
| año | number input | required, min 1990, max current year |
| kilometraje | number input | required, min 0 |
| descripcion | textarea | optional |

**Section 2 — Tus datos:**
| Field | Type | Validation |
|---|---|---|
| nombre | text input | required |
| email | email input | required, valid email format |
| telefono | text input | required |

- Validation via `react-hook-form`
- On submit: INSERT into `leads` as anon user
- On success: show confirmation card with folio = first 8 chars of returned `lead.id` uppercased (e.g. `FOLIO: A3F9C1B2`). Folio is display-only — no lookup feature.
- No photo upload in this phase
- Matches existing site visual style (Tailwind, gradient accents, AOS)
- Navbar gets "Vende tu Auto" link

---

## 6. Authentication (`/login`)

- Email + password via `supabase.auth.signInWithPassword({ email, password })`
- Session persisted in `localStorage` (Supabase JS v2 default)
- Token refresh handled automatically by Supabase client
- On success → redirect to `/admin/inventario`
- Unauthenticated access to `/admin/*` → redirect to `/login`
- Authenticated viewer hitting `/admin/usuarios` → redirect to `/admin/inventario` with toast error "No tienes permiso para acceder a esta sección"

### `AuthContext` shape

```js
{
  user,        // Supabase User object or null
  profile,     // { id, nombre, email, role } or null
  loading,     // boolean — true while session resolves on app load
  signIn(email, password),  // returns { error } from Supabase
  signOut(),                // clears session, redirects to /login
}
```

AuthContext wraps the entire Router in `main.jsx`.

---

## 7. Admin Panel (`/admin`)

### Layout

`AdminLayout.jsx` is a React Router `<Outlet>` wrapper with a fixed sidebar. Route `/admin` redirects to `/admin/inventario`.

**Routes:**

```
/admin                → <Navigate to="/admin/inventario" />
/admin/inventario     → Inventario.jsx
/admin/leads          → Leads.jsx
/admin/reportes       → Reportes.jsx
/admin/usuarios       → Usuarios.jsx  (ProtectedRoute requiredRole="admin")
```

All `/admin/*` routes are wrapped in `ProtectedRoute` (checks `user !== null`). `/admin/usuarios` additionally checks `profile.role === 'admin'`.

### Role permissions

| Section                              | Admin | Seller | Viewer |
| ------------------------------------ | ----- | ------ | ------ |
| Inventario — view                    | ✅    | ✅     | ✅     |
| Inventario — add/edit/visible toggle | ✅    | ✅     | ❌     |
| Inventario — delete                  | ✅    | ❌     | ❌     |
| Leads — view                         | ✅    | ✅     | ✅     |
| Leads — edit status/notas            | ✅    | ✅     | ❌     |
| Leads — delete                       | ✅    | ❌     | ❌     |
| Reportes                             | ✅    | ✅     | ✅     |
| Usuarios                             | ✅    | ❌     | ❌     |

### Inventario

- Table columns: imagen (thumbnail 48px), marca, modelo, año, precio, status badge, visible toggle, actions (edit / delete)
- `visible` toggle: optimistic UI update → revert on error with toast
- Edit and Add use the same `CarModal.jsx` (pre-populated fields for edit, empty for add)
- `CarModal` fields: all `cars` table columns. Image upload via file input → `supabase.storage.from('car-images').upload(path, file)` → append public URL to `imagenes[]`
- Image constraints: JPEG/PNG/WebP, max 5MB per file, max 10 images per car
- Image order is preserved by the order of URLs in `cars.imagenes[]`. Admin reorders via drag in `CarModal` (use HTML5 drag-and-drop on the image thumbnail list); order is saved when the form is submitted.
- If a single image upload fails during a multi-upload batch: show toast error for that file, continue uploading remaining files, save the car with whichever uploads succeeded.
- Removing an image in modal: calls `supabase.storage.from('car-images').remove([path])` immediately, removes URL from local state
- Delete car: confirmation dialog → DELETE query → orphaned storage files not auto-removed
- No bulk operations in this phase

### Leads

- Table columns: folio (first 8 chars of id uppercased), nombre, email, telefono, marca, modelo, año, status, created_at
- **Status change UI:** each row has an inline `<select>` dropdown showing current status. On change → UPDATE `leads.status` immediately → toast confirmation. No drag-and-drop, no modal.
- Status dropdown values: `pending` ("Nuevo"), `reviewing` ("En revisión"), `offer_made` ("Oferta enviada"), `closed` ("Cerrado")
- Expandable row (click row to toggle): shows full `descripcion` + `notas` textarea (saves on blur via UPDATE)

### Reportes

- **Summary cards:** total cars in inventory, cars sold (`status = 'sold'`), active leads (`status IN ('pending','reviewing')`), estimated revenue (SUM of `precio` WHERE `status = 'sold'`)
- **Date range picker:** filters `created_at` on `cars` for inventory/sales exports, and `created_at` on `leads` for the leads export. Summary cards always show totals (no date filter on cards).
- **PDF exports** (jsPDF v2 + @jspdf/autotable v3, AutoKlic logo in header via `doc.addImage`):
  - _Inventario:_ ALL cars (any status) filtered by `created_at` date range
  - _Ventas:_ ONLY cars WHERE `status = 'sold'` filtered by `created_at` date range, rows grouped by month (month header row inserted before each group)
  - _Leads:_ all leads filtered by `leads.created_at` date range
- **CSV exports** (native JS, UTF-8 BOM for Excel/Spanish):
  - Same three datasets, comma delimiter, all text fields quoted
- Each export type has its own PDF button and CSV button (6 buttons total)

### Usuarios (Admin only)

- Table: nombre, email, `RoleBadge` (admin=red, seller=blue, viewer=gray), actions
- **Invite:** button opens toast with message "Para invitar un usuario ve al dashboard de Supabase → Authentication → Users → Invite user"
- **Edit role:** inline `<select>` dropdown per row → UPDATE `profiles.role` on change with toast confirmation
- **Deactivate:** disabled button with tooltip "Gestionar en Supabase Dashboard"
- **Password reset:** button calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })` → toast "Correo de restablecimiento enviado"

**`/reset-password` route** (new page `ResetPassword.jsx`): On mount, Supabase delivers the recovery token as a URL hash (`#access_token=...&type=recovery`). The Supabase client detects this automatically via `onAuthStateChange` and fires event `PASSWORD_RECOVERY`. `ResetPassword.jsx` listens for this event, then shows a "Nueva contraseña" form (password + confirm password fields). On submit calls `supabase.auth.updateUser({ password: newPassword })` → redirects to `/admin` on success.

---

## 8. UX Details

- **`react-hot-toast`** for all async success/error notifications
- **Skeleton loaders** on initial data fetch for all tables
- **Error boundaries** around each admin section — show "Error al cargar" + retry button
- **404 route** (`NotFound.jsx`) added to `App.jsx` as catch-all

---

## 9. New File Structure

```
src/
├── lib/
│   └── supabase.js              # createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
├── context/
│   └── AuthContext.jsx          # Auth state + profile + role; wraps Router in main.jsx
├── pages/
│   ├── Catalogo.jsx             # Public inventory grid
│   ├── VendeTuAuto.jsx          # Public lead capture form
│   ├── Login.jsx                # /login auth page
│   ├── NotFound.jsx             # 404 catch-all
│   └── admin/
│       ├── AdminLayout.jsx      # Fixed sidebar + <Outlet>
│       ├── Inventario.jsx       # Car CRUD table
│       ├── Leads.jsx            # Lead pipeline table
│       ├── Reportes.jsx         # Reports + PDF/CSV exports
│       └── Usuarios.jsx         # User management (admin only)
└── components/
    └── admin/
        ├── CarModal.jsx         # Add/edit car form modal with image upload
        ├── ProtectedRoute.jsx   # Checks auth; accepts optional requiredRole prop
        └── RoleBadge.jsx        # Colored pill label for role display
```
