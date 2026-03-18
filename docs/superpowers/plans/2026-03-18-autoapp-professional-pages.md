# AutoApp Professional Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the AutoKlic static site with Supabase-backed public pages (/catalogo, /vende-tu-auto) and a full admin dashboard (/admin) with CRUD inventory, leads pipeline, PDF/CSV reports, and user management.

**Architecture:** Supabase provides auth, database (cars, leads, profiles), and storage (car-images). A React AuthContext wraps the app and exposes user/profile/role to all components. Public pages use the anon key; admin pages are protected by ProtectedRoute which checks session and optionally role. No test framework is configured — each task ends with a manual verification step and a git commit.

**Tech Stack:** React 19, Vite 7, Tailwind CSS 3, React Router DOM 7, @supabase/supabase-js, jsPDF v2 + @jspdf/autotable v3, react-hook-form, date-fns, react-hot-toast

---

## File Map

**New files:**
- `src/lib/supabase.js` — Supabase client singleton
- `src/context/AuthContext.jsx` — Auth state, profile, role
- `src/components/admin/ProtectedRoute.jsx` — Auth + role guard
- `src/components/admin/RoleBadge.jsx` — Colored role pill
- `src/components/admin/CarModal.jsx` — Add/edit car modal with image upload
- `src/pages/Login.jsx` — /login page
- `src/pages/ResetPassword.jsx` — /reset-password page
- `src/pages/Catalogo.jsx` — /catalogo public inventory
- `src/pages/VendeTuAuto.jsx` — /vende-tu-auto lead form
- `src/pages/NotFound.jsx` — 404 catch-all
- `src/pages/admin/AdminLayout.jsx` — Sidebar + Outlet
- `src/pages/admin/Inventario.jsx` — Car CRUD table
- `src/pages/admin/Leads.jsx` — Leads pipeline table
- `src/pages/admin/Reportes.jsx` — Reports + PDF/CSV exports
- `src/pages/admin/Usuarios.jsx` — User management (admin only)
- `.env.local` — Supabase credentials

**Modified files:**
- `src/main.jsx` — Wrap Router with AuthProvider + add Toaster
- `src/App.jsx` — Add new routes (/catalogo, /vende-tu-auto, /login, /reset-password, /admin/*, 404)
- `src/components/Navbar.jsx` — Add "Catálogo" and "Vende tu Auto" links

---

## Task 1: Install dependencies and create Supabase client

**Files:**
- Create: `.env.local`
- Create: `src/lib/supabase.js`
- Modify: `package.json` (via npm install)

- [ ] **Step 1: Install new packages**

```bash
cd /c/Users/miche/OneDrive/Escritorio/AutoApp
npm install @supabase/supabase-js jspdf @jspdf/autotable react-hook-form date-fns react-hot-toast
```

Expected: packages added to node_modules with no errors.

- [ ] **Step 2: Create `.env.local`**

```
VITE_SUPABASE_URL=https://wvkvvxvqaqwkhsqjjxqs.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2a3Z2eHZxYXF3a2hzcWpqeHFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NjQwNDUsImV4cCI6MjA4OTQ0MDA0NX0.qn5h5Xu-cTc0uP6pkBu9HZAkttdEt_-R12QxMuN9fYw
```

- [ ] **Step 3: Create `src/lib/supabase.js`**

```js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 4: Verify dev server starts**

```bash
npm run dev
```

Expected: dev server starts on localhost:5173 with no errors in terminal.

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase.js package.json package-lock.json
git commit -m "feat: add supabase client and new dependencies"
```

---

## Task 2: Set up Supabase database schema

This task is manual SQL execution in the Supabase dashboard SQL editor at https://supabase.com/dashboard.

- [ ] **Step 1: Create `cars` table**

Run in Supabase SQL editor:

```sql
CREATE TABLE public.cars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modelo text NOT NULL,
  marca text NOT NULL,
  año integer NOT NULL,
  precio numeric(12,2) NOT NULL,
  kilometraje integer NOT NULL,
  motor text,
  transmision text NOT NULL,
  combustible text NOT NULL,
  color text,
  puertas integer,
  traccion text,
  aire boolean DEFAULT false,
  infoentretenimiento text,
  descripcion text,
  imagenes text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','sold','reserved')),
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

- [ ] **Step 2: Create `leads` table**

```sql
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  email text NOT NULL,
  telefono text NOT NULL,
  marca text NOT NULL,
  modelo text NOT NULL,
  año integer NOT NULL,
  kilometraje integer NOT NULL,
  descripcion text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing','offer_made','closed')),
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

- [ ] **Step 3: Create `profiles` table**

```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin','seller','viewer'))
);
```

- [ ] **Step 4: Create `get_my_role()` helper and profile trigger**

```sql
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

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

- [ ] **Step 5: Enable RLS and create policies for `cars`**

```sql
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_visible_cars" ON cars
  FOR SELECT USING (visible = true);

CREATE POLICY "staff_read_all_cars" ON cars
  FOR SELECT USING (get_my_role() IN ('seller', 'admin'));

CREATE POLICY "staff_insert_cars" ON cars
  FOR INSERT WITH CHECK (get_my_role() IN ('seller', 'admin'));

CREATE POLICY "staff_update_cars" ON cars
  FOR UPDATE USING (get_my_role() IN ('seller', 'admin'));

CREATE POLICY "admin_delete_cars" ON cars
  FOR DELETE USING (get_my_role() = 'admin');
```

- [ ] **Step 6: Enable RLS and create policies for `leads`**

```sql
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_leads" ON leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "staff_read_leads" ON leads
  FOR SELECT USING (get_my_role() IN ('viewer', 'seller', 'admin'));

CREATE POLICY "staff_update_leads" ON leads
  FOR UPDATE USING (get_my_role() IN ('seller', 'admin'));

CREATE POLICY "admin_delete_leads" ON leads
  FOR DELETE USING (get_my_role() = 'admin');
```

- [ ] **Step 7: Enable RLS and create policies for `profiles`**

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "self_read_profile" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "admin_read_profiles" ON profiles
  FOR SELECT USING (get_my_role() = 'admin');

CREATE POLICY "admin_update_profiles" ON profiles
  FOR UPDATE USING (get_my_role() = 'admin');

CREATE POLICY "admin_delete_profiles" ON profiles
  FOR DELETE USING (get_my_role() = 'admin');
```

- [ ] **Step 8: Create `car-images` storage bucket**

In Supabase dashboard → Storage → New bucket:
- Name: `car-images`
- Public bucket: YES (check the toggle)

Then run in SQL editor to allow public reads and authenticated sellers/admins to upload/delete:

```sql
-- Allow anyone (including anon) to read images from the public bucket
CREATE POLICY "public_read_car_images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'car-images');

-- Allow authenticated sellers and admins to upload images
CREATE POLICY "staff_upload_car_images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'car-images' AND
    get_my_role() IN ('seller', 'admin')
  );

-- Allow authenticated sellers and admins to delete images
CREATE POLICY "staff_delete_car_images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'car-images' AND
    get_my_role() IN ('seller', 'admin')
  );
```

- [ ] **Step 9: Create first admin user**

In Supabase dashboard → Authentication → Users → Add user:
- Email: your email
- Password: your password

Then in SQL editor, set that user as admin:

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

---

## Task 3: AuthContext and app wrappers

**Files:**
- Create: `src/context/AuthContext.jsx`
- Modify: `src/main.jsx`

- [ ] **Step 1: Create `src/context/AuthContext.jsx`**

```jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  async function loadProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id).finally(() => setLoading(false))
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) navigate('/admin/inventario')
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
```

- [ ] **Step 2: Modify `src/main.jsx`** — wrap App with AuthProvider and add Toaster

Read the current file first, then replace its content with:

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@material-tailwind/react'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
          <Toaster position="top-right" />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
)
```

**Note:** BrowserRouter moves from App.jsx to main.jsx here. Remove it from App.jsx in the next task.

- [ ] **Step 3: Verify app still loads**

```bash
npm run dev
```

Expected: site loads on localhost:5173, no console errors.

- [ ] **Step 4: Commit**

```bash
git add src/context/AuthContext.jsx src/main.jsx
git commit -m "feat: add AuthContext and move BrowserRouter to main.jsx"
```

---

## Task 4: ProtectedRoute, RoleBadge, Login, ResetPassword pages

**Files:**
- Create: `src/components/admin/ProtectedRoute.jsx`
- Create: `src/components/admin/RoleBadge.jsx`
- Create: `src/pages/Login.jsx`
- Create: `src/pages/ResetPassword.jsx`

- [ ] **Step 1: Create `src/components/admin/ProtectedRoute.jsx`**

```jsx
import { Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, profile, loading } = useAuth()

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>

  if (!user) return <Navigate to="/login" replace />

  if (requiredRole && profile?.role !== requiredRole) {
    toast.error('No tienes permiso para acceder a esta sección')
    return <Navigate to="/admin/inventario" replace />
  }

  return children
}
```

- [ ] **Step 2: Create `src/components/admin/RoleBadge.jsx`**

```jsx
const colors = {
  admin: 'bg-red-100 text-red-700',
  seller: 'bg-blue-100 text-blue-700',
  viewer: 'bg-gray-100 text-gray-600',
}

const labels = {
  admin: 'Admin',
  seller: 'Vendedor',
  viewer: 'Visor',
}

export default function RoleBadge({ role }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[role] ?? colors.viewer}`}>
      {labels[role] ?? role}
    </span>
  )
}
```

- [ ] **Step 3: Create `src/pages/Login.jsx`**

```jsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()
  const [authError, setAuthError] = useState('')

  async function onSubmit({ email, password }) {
    setAuthError('')
    const { error } = await signIn(email, password)
    if (error) setAuthError('Correo o contraseña incorrectos')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">AutoKlic Admin</h1>
        <p className="text-gray-500 mb-6">Inicia sesión para continuar</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
            <input
              type="email"
              {...register('email', { required: 'Campo requerido' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              {...register('password', { required: 'Campo requerido' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          {authError && <p className="text-red-500 text-sm">{authError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-60"
          >
            {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `src/pages/ResetPassword.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function onSubmit({ password }) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      toast.error('Error al actualizar la contraseña')
    } else {
      toast.success('Contraseña actualizada')
      navigate('/admin')
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Verificando enlace de recuperación...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Nueva contraseña</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
            <input
              type="password"
              {...register('password', { required: true, minLength: { value: 6, message: 'Mínimo 6 caracteres' } })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
            <input
              type="password"
              {...register('confirm', { validate: v => v === watch('password') || 'Las contraseñas no coinciden' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm.message}</p>}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-60"
          >
            {isSubmitting ? 'Guardando...' : 'Actualizar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/ src/pages/Login.jsx src/pages/ResetPassword.jsx
git commit -m "feat: add ProtectedRoute, RoleBadge, Login and ResetPassword pages"
```

---

## Task 5: Update App.jsx routes and Navbar

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/components/Navbar.jsx`
- Create: `src/pages/NotFound.jsx`

- [ ] **Step 1: Create `src/pages/NotFound.jsx`**

```jsx
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-5xl font-bold text-gray-900">404</h1>
      <p className="text-gray-500">Página no encontrada</p>
      <Link to="/" className="text-blue-600 hover:underline">Volver al inicio</Link>
    </div>
  )
}
```

- [ ] **Step 2: Replace `src/App.jsx`** with updated routes

```jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Hero from './components/Hero'
import FeaturedCars from './components/FeaturedCars'
import Process from './components/Process'
import ContactForm from './components/ContactForm'

import AutoDetalle from './pages/AutoDetalle'
import Catalogo from './pages/Catalogo'
import VendeTuAuto from './pages/VendeTuAuto'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import NotFound from './pages/NotFound'

import AdminLayout from './pages/admin/AdminLayout'
import Inventario from './pages/admin/Inventario'
import Leads from './pages/admin/Leads'
import Reportes from './pages/admin/Reportes'
import Usuarios from './pages/admin/Usuarios'

import ProtectedRoute from './components/admin/ProtectedRoute'

// Pages that show Navbar + Footer
function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="pt-24">{children}</main>
      <Footer />
    </>
  )
}

export default function App() {
  useEffect(() => {
    AOS.init({ duration: 800, once: true })
  }, [])

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={
        <PublicLayout>
          <Hero /><FeaturedCars /><Process /><ContactForm />
        </PublicLayout>
      } />
      <Route path="/autos/:modelo" element={<PublicLayout><AutoDetalle /></PublicLayout>} />
      <Route path="/catalogo" element={<PublicLayout><Catalogo /></PublicLayout>} />
      <Route path="/vende-tu-auto" element={<PublicLayout><VendeTuAuto /></PublicLayout>} />

      {/* Auth routes (no Navbar/Footer) */}
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute><AdminLayout /></ProtectedRoute>
      }>
        <Route index element={<Navigate to="inventario" replace />} />
        <Route path="inventario" element={<Inventario />} />
        <Route path="leads" element={<Leads />} />
        <Route path="reportes" element={<Reportes />} />
        <Route path="usuarios" element={
          <ProtectedRoute requiredRole="admin"><Usuarios /></ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
```

- [ ] **Step 3: Add "Catálogo" and "Vende tu Auto" links to `src/components/Navbar.jsx`**

Read the current Navbar.jsx. Find the array of navigation links (likely `navLinks` or similar) and add:
```js
{ name: 'Catálogo', href: '/catalogo' },
{ name: 'Vende tu Auto', href: '/vende-tu-auto' },
```
Add them after existing links. Use `<Link>` from react-router-dom (replace `<a href>` if needed).

- [ ] **Step 4: Verify routing works**

```bash
npm run dev
```

Visit: `/`, `/catalogo` (will be blank — component not built yet, just no crash), `/login` (shows login form), `/admin` (redirects to /login since not authenticated).

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx src/components/Navbar.jsx src/pages/NotFound.jsx
git commit -m "feat: update routes and navbar with new pages"
```

---

## Task 6: Catálogo page

**Files:**
- Create: `src/pages/Catalogo.jsx`

- [ ] **Step 1: Create `src/pages/Catalogo.jsx`**

```jsx
import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function toSlug(str) {
  return str.toLowerCase().replace(/\s+/g, '-')
}

function formatPrice(price) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(price)
}

const STATUS_LABELS = { available: 'Disponible', reserved: 'Reservado', sold: 'Vendido' }
const STATUS_COLORS = {
  available: 'bg-green-100 text-green-700',
  reserved: 'bg-yellow-100 text-yellow-700',
  sold: 'bg-gray-100 text-gray-500',
}

export default function Catalogo() {
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ marca: '', transmision: '', minPrecio: '', maxPrecio: '', minAño: '', maxAño: '' })

  useEffect(() => {
    supabase.from('cars').select('*').eq('visible', true).then(({ data }) => {
      setCars(data ?? [])
      setLoading(false)
    })
  }, [])

  const marcas = useMemo(() => [...new Set(cars.map(c => c.marca))].sort(), [cars])
  const transmisiones = useMemo(() => [...new Set(cars.map(c => c.transmision))].sort(), [cars])

  const filtered = useMemo(() => cars.filter(c => {
    if (filters.marca && c.marca !== filters.marca) return false
    if (filters.transmision && c.transmision !== filters.transmision) return false
    if (filters.minPrecio && c.precio < Number(filters.minPrecio)) return false
    if (filters.maxPrecio && c.precio > Number(filters.maxPrecio)) return false
    if (filters.minAño && c.año < Number(filters.minAño)) return false
    if (filters.maxAño && c.año > Number(filters.maxAño)) return false
    return true
  }), [cars, filters])

  function setFilter(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-2xl h-80 animate-pulse" />
        ))}
      </div>
    </div>
  )

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Catálogo de Autos</h1>
      <p className="text-gray-500 mb-8">{filtered.length} vehículo{filtered.length !== 1 ? 's' : ''} disponible{filtered.length !== 1 ? 's' : ''}</p>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <select value={filters.marca} onChange={e => setFilter('marca', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todas las marcas</option>
          {marcas.map(m => <option key={m}>{m}</option>)}
        </select>
        <select value={filters.transmision} onChange={e => setFilter('transmision', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Transmisión</option>
          {transmisiones.map(t => <option key={t}>{t}</option>)}
        </select>
        <input type="number" placeholder="Precio mínimo" value={filters.minPrecio}
          onChange={e => setFilter('minPrecio', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input type="number" placeholder="Precio máximo" value={filters.maxPrecio}
          onChange={e => setFilter('maxPrecio', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input type="number" placeholder="Año desde" value={filters.minAño}
          onChange={e => setFilter('minAño', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input type="number" placeholder="Año hasta" value={filters.maxAño}
          onChange={e => setFilter('maxAño', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {Object.values(filters).some(Boolean) && (
          <button onClick={() => setFilters({ marca: '', transmision: '', minPrecio: '', maxPrecio: '', minAño: '', maxAño: '' })}
            className="text-sm text-blue-600 hover:underline px-2">
            Limpiar filtros
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 text-center py-16">No se encontraron autos con los filtros seleccionados.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(car => (
            <div key={car.id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition">
              <div className="h-48 bg-gray-100 overflow-hidden">
                {car.imagenes?.[0]
                  ? <img src={car.imagenes[0]} alt={car.modelo} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Sin imagen</div>
                }
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm text-gray-500">{car.marca}</p>
                    <h3 className="font-semibold text-gray-900">{car.modelo}</h3>
                    <p className="text-sm text-gray-500">{car.año} · {car.kilometraje?.toLocaleString()} km</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${STATUS_COLORS[car.status]}`}>
                    {STATUS_LABELS[car.status]}
                  </span>
                </div>
                <p className="mt-3 text-xl font-bold text-blue-600">{formatPrice(car.precio)}</p>
                <Link to={`/autos/${toSlug(car.modelo)}`}
                  className="mt-3 block text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded-lg transition">
                  Ver detalles
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
```

- [ ] **Step 2: Verify**

Visit `/catalogo` — should show skeleton while loading, then show cars from Supabase (or empty state if no cars added yet). Filters should narrow results client-side.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Catalogo.jsx
git commit -m "feat: add /catalogo public inventory page"
```

---

## Task 7: Vende tu Auto page

**Files:**
- Create: `src/pages/VendeTuAuto.jsx`

- [ ] **Step 1: Create `src/pages/VendeTuAuto.jsx`**

```jsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '../lib/supabase'

export default function VendeTuAuto() {
  const [folio, setFolio] = useState(null)
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm()

  async function onSubmit(data) {
    const { data: lead, error } = await supabase
      .from('leads')
      .insert([{
        marca: data.marca,
        modelo: data.modelo,
        año: Number(data.año),
        kilometraje: Number(data.kilometraje),
        descripcion: data.descripcion || null,
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono,
      }])
      .select('id')
      .single()

    if (error) {
      alert('Ocurrió un error. Intenta de nuevo.')
      return
    }
    setFolio(lead.id.substring(0, 8).toUpperCase())
    reset()
  }

  if (folio) {
    return (
      <section className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Solicitud enviada!</h2>
          <p className="text-gray-600 mb-4">Nos pondremos en contacto contigo pronto.</p>
          <p className="text-sm text-gray-500">Número de folio:</p>
          <p className="text-3xl font-mono font-bold text-green-700 tracking-widest mt-1">{folio}</p>
        </div>
      </section>
    )
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
  const errorClass = "text-red-500 text-xs mt-1"

  return (
    <section className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Vende tu Auto</h1>
      <p className="text-gray-500 mb-8">Completa el formulario y te contactamos con una oferta.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Section 1 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Tu auto</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca *</label>
              <input {...register('marca', { required: 'Requerido' })} className={inputClass} />
              {errors.marca && <p className={errorClass}>{errors.marca.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo *</label>
              <input {...register('modelo', { required: 'Requerido' })} className={inputClass} />
              {errors.modelo && <p className={errorClass}>{errors.modelo.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Año *</label>
              <input type="number" {...register('año', { required: 'Requerido', min: { value: 1990, message: 'Mínimo 1990' }, max: { value: new Date().getFullYear(), message: 'No puede ser futuro' } })} className={inputClass} />
              {errors.año && <p className={errorClass}>{errors.año.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kilometraje *</label>
              <input type="number" {...register('kilometraje', { required: 'Requerido', min: { value: 0, message: 'Mínimo 0' } })} className={inputClass} />
              {errors.kilometraje && <p className={errorClass}>{errors.kilometraje.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
              <textarea rows={3} {...register('descripcion')} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Section 2 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Tus datos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
              <input {...register('nombre', { required: 'Requerido' })} className={inputClass} />
              {errors.nombre && <p className={errorClass}>{errors.nombre.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico *</label>
              <input type="email" {...register('email', { required: 'Requerido', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Correo inválido' } })} className={inputClass} />
              {errors.email && <p className={errorClass}>{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
              <input {...register('telefono', { required: 'Requerido' })} className={inputClass} />
              {errors.telefono && <p className={errorClass}>{errors.telefono.message}</p>}
            </div>
          </div>
        </div>

        <button type="submit" disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60">
          {isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
        </button>
      </form>
    </section>
  )
}
```

- [ ] **Step 2: Verify**

Visit `/vende-tu-auto` — form renders, required field validation works, submission inserts a row in `leads` table (check in Supabase dashboard), success card shows folio.

- [ ] **Step 3: Commit**

```bash
git add src/pages/VendeTuAuto.jsx
git commit -m "feat: add /vende-tu-auto lead capture form"
```

---

## Task 8: Admin layout and sidebar

**Files:**
- Create: `src/pages/admin/AdminLayout.jsx`

- [ ] **Step 1: Create `src/pages/admin/AdminLayout.jsx`**

```jsx
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  ArchiveBoxIcon,
  UserGroupIcon,
  DocumentChartBarIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'

const navItems = [
  { to: '/admin/inventario', label: 'Inventario', icon: ArchiveBoxIcon },
  { to: '/admin/leads', label: 'Leads', icon: UserGroupIcon },
  { to: '/admin/reportes', label: 'Reportes', icon: ChartBarIcon },
]

export default function AdminLayout() {
  const { profile, signOut } = useAuth()

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-100">
          <p className="font-bold text-gray-900 text-lg">AutoKlic</p>
          <p className="text-xs text-gray-400">Panel de administración</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                }`
              }>
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}

          {profile?.role === 'admin' && (
            <NavLink to="/admin/usuarios"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                }`
              }>
              <DocumentChartBarIcon className="w-5 h-5" />
              Usuarios
            </NavLink>
          )}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-medium text-gray-700 truncate">{profile?.nombre}</p>
            <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
          </div>
          <button onClick={signOut}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Create placeholder files for admin pages** (so App.jsx doesn't crash on import)

Create `src/pages/admin/Inventario.jsx`:
```jsx
export default function Inventario() { return <div className="p-8"><h1 className="text-2xl font-bold">Inventario</h1></div> }
```

Create `src/pages/admin/Leads.jsx`:
```jsx
export default function Leads() { return <div className="p-8"><h1 className="text-2xl font-bold">Leads</h1></div> }
```

Create `src/pages/admin/Reportes.jsx`:
```jsx
export default function Reportes() { return <div className="p-8"><h1 className="text-2xl font-bold">Reportes</h1></div> }
```

Create `src/pages/admin/Usuarios.jsx`:
```jsx
export default function Usuarios() { return <div className="p-8"><h1 className="text-2xl font-bold">Usuarios</h1></div> }
```

- [ ] **Step 3: Verify**

Log in at `/login`. Should redirect to `/admin/inventario` and show the sidebar layout with "Inventario" heading.

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/
git commit -m "feat: add admin layout with sidebar and placeholder sections"
```

---

## Task 9: CarModal component

**Files:**
- Create: `src/components/admin/CarModal.jsx`

- [ ] **Step 1: Create `src/components/admin/CarModal.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { XMarkIcon } from '@heroicons/react/24/outline'

const TRANSMISIONES = ['Manual', 'Automática']
const COMBUSTIBLES = ['Gasolina', 'Diésel', 'Híbrido', 'Eléctrico']
const STATUSES = [
  { value: 'available', label: 'Disponible' },
  { value: 'sold', label: 'Vendido' },
  { value: 'reserved', label: 'Reservado' },
]

export default function CarModal({ car, onClose, onSaved }) {
  const isEdit = Boolean(car)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: car ? {
      ...car,
      aire: car.aire ? 'true' : 'false',
    } : { status: 'available', visible: true }
  })

  const [images, setImages] = useState(car?.imagenes ?? [])
  const [draggingIdx, setDraggingIdx] = useState(null)
  const [uploading, setUploading] = useState(false)

  function pathFromUrl(url) {
    // Extract path after /car-images/ in the public URL
    const marker = '/car-images/'
    const idx = url.indexOf(marker)
    return idx >= 0 ? url.substring(idx + marker.length) : null
  }

  async function handleImageFiles(e) {
    const files = Array.from(e.target.files)
    if (images.length + files.length > 10) {
      toast.error('Máximo 10 imágenes por auto')
      return
    }
    setUploading(true)
    const carId = car?.id ?? crypto.randomUUID()
    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error(`${file.name}: formato no permitido`)
        continue
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}: máximo 5MB`)
        continue
      }
      const path = `${carId}/${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from('car-images').upload(path, file)
      if (error) {
        toast.error(`Error subiendo ${file.name}`)
        continue
      }
      const { data: { publicUrl } } = supabase.storage.from('car-images').getPublicUrl(path)
      setImages(prev => [...prev, publicUrl])
    }
    setUploading(false)
  }

  async function removeImage(url) {
    const path = pathFromUrl(url)
    if (path) await supabase.storage.from('car-images').remove([path])
    setImages(prev => prev.filter(u => u !== url))
  }

  function onDragStart(idx) { setDraggingIdx(idx) }
  function onDragOver(e, idx) {
    e.preventDefault()
    if (draggingIdx === null || draggingIdx === idx) return
    setImages(prev => {
      const next = [...prev]
      const [moved] = next.splice(draggingIdx, 1)
      next.splice(idx, 0, moved)
      setDraggingIdx(idx)
      return next
    })
  }
  function onDragEnd() { setDraggingIdx(null) }

  async function onSubmit(data) {
    const payload = {
      modelo: data.modelo,
      marca: data.marca,
      año: Number(data.año),
      precio: Number(data.precio),
      kilometraje: Number(data.kilometraje),
      motor: data.motor || null,
      transmision: data.transmision,
      combustible: data.combustible,
      color: data.color || null,
      puertas: data.puertas ? Number(data.puertas) : null,
      traccion: data.traccion || null,
      aire: data.aire === 'true',
      infoentretenimiento: data.infoentretenimiento || null,
      descripcion: data.descripcion || null,
      status: data.status,
      visible: data.visible === true || data.visible === 'true',
      imagenes: images,
    }

    const { error } = isEdit
      ? await supabase.from('cars').update(payload).eq('id', car.id)
      : await supabase.from('cars').insert([payload])

    if (error) {
      toast.error('Error al guardar el auto')
      return
    }
    toast.success(isEdit ? 'Auto actualizado' : 'Auto agregado')
    onSaved()
    onClose()
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  const labelClass = "block text-xs font-medium text-gray-600 mb-1"

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900">{isEdit ? 'Editar auto' : 'Agregar auto'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4 space-y-4">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Marca *</label><input {...register('marca', { required: true })} className={inputClass} /></div>
            <div><label className={labelClass}>Modelo *</label><input {...register('modelo', { required: true })} className={inputClass} /></div>
            <div><label className={labelClass}>Año *</label><input type="number" {...register('año', { required: true })} className={inputClass} /></div>
            <div><label className={labelClass}>Precio (MXN) *</label><input type="number" step="0.01" {...register('precio', { required: true })} className={inputClass} /></div>
            <div><label className={labelClass}>Kilometraje *</label><input type="number" {...register('kilometraje', { required: true })} className={inputClass} /></div>
            <div><label className={labelClass}>Motor</label><input {...register('motor')} className={inputClass} placeholder="e.g. 1.6L Turbo" /></div>
            <div>
              <label className={labelClass}>Transmisión *</label>
              <select {...register('transmision', { required: true })} className={inputClass}>
                {TRANSMISIONES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Combustible *</label>
              <select {...register('combustible', { required: true })} className={inputClass}>
                {COMBUSTIBLES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label className={labelClass}>Color</label><input {...register('color')} className={inputClass} /></div>
            <div><label className={labelClass}>Puertas</label><input type="number" {...register('puertas')} className={inputClass} /></div>
            <div><label className={labelClass}>Tracción</label><input {...register('traccion')} className={inputClass} placeholder="4x2 / 4x4" /></div>
            <div>
              <label className={labelClass}>Aire acondicionado</label>
              <select {...register('aire')} className={inputClass}>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>

          <div><label className={labelClass}>Info y entretenimiento</label><input {...register('infoentretenimiento')} className={inputClass} /></div>
          <div><label className={labelClass}>Descripción</label><textarea rows={3} {...register('descripcion')} className={inputClass} /></div>

          {/* Status and visibility */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Estado</label>
              <select {...register('status')} className={inputClass}>
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Visible en el sitio</label>
              <select {...register('visible')} className={inputClass}>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>

          {/* Images */}
          <div>
            <label className={labelClass}>Imágenes (máx. 10 · JPEG/PNG/WebP · 5MB c/u)</label>
            <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={handleImageFiles} className="text-sm text-gray-500" />
            {uploading && <p className="text-xs text-blue-500 mt-1">Subiendo imágenes...</p>}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {images.map((url, i) => (
                  <div key={url} draggable onDragStart={() => onDragStart(i)} onDragOver={e => onDragOver(e, i)} onDragEnd={onDragEnd}
                    className="relative cursor-grab group">
                    <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                    <button type="button" onClick={() => removeImage(url)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      ×
                    </button>
                    {i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-blue-600/70 text-white text-[9px] text-center rounded-b-lg">Principal</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting || uploading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold transition disabled:opacity-60">
              {isSubmitting ? 'Guardando...' : (isEdit ? 'Guardar cambios' : 'Agregar auto')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/CarModal.jsx
git commit -m "feat: add CarModal with image upload and drag reorder"
```

---

## Task 10: Inventario admin section

**Files:**
- Modify: `src/pages/admin/Inventario.jsx` (replace placeholder)

- [ ] **Step 1: Replace `src/pages/admin/Inventario.jsx`**

```jsx
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import CarModal from '../../components/admin/CarModal'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

const STATUS_LABELS = { available: 'Disponible', sold: 'Vendido', reserved: 'Reservado' }
const STATUS_COLORS = {
  available: 'bg-green-100 text-green-700',
  sold: 'bg-gray-100 text-gray-500',
  reserved: 'bg-yellow-100 text-yellow-700',
}

function formatPrice(price) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(price)
}

export default function Inventario() {
  const { profile } = useAuth()
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'add' | car object
  const [deleteId, setDeleteId] = useState(null)

  const canEdit = profile?.role === 'admin' || profile?.role === 'seller'
  const canDelete = profile?.role === 'admin'

  async function loadCars() {
    const { data } = await supabase.from('cars').select('*').order('created_at', { ascending: false })
    setCars(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadCars() }, [])

  async function toggleVisible(car) {
    const prev = car.visible
    setCars(c => c.map(x => x.id === car.id ? { ...x, visible: !prev } : x))
    const { error } = await supabase.from('cars').update({ visible: !prev }).eq('id', car.id)
    if (error) {
      setCars(c => c.map(x => x.id === car.id ? { ...x, visible: prev } : x))
      toast.error('Error al actualizar visibilidad')
    } else {
      toast.success(prev ? 'Auto ocultado del sitio' : 'Auto visible en el sitio')
    }
  }

  async function confirmDelete() {
    const { error } = await supabase.from('cars').delete().eq('id', deleteId)
    if (error) toast.error('Error al eliminar')
    else { toast.success('Auto eliminado'); setCars(c => c.filter(x => x.id !== deleteId)) }
    setDeleteId(null)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Inventario</h1>
        {canEdit && (
          <button onClick={() => setModal('add')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
            <PlusIcon className="w-4 h-4" /> Agregar auto
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Auto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Año</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Precio</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Visible</th>
                {canEdit && <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cars.map(car => (
                <tr key={car.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 flex items-center gap-3">
                    {car.imagenes?.[0]
                      ? <img src={car.imagenes[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      : <div className="w-12 h-12 rounded-lg bg-gray-100" />
                    }
                    <div>
                      <p className="font-medium text-gray-900">{car.modelo}</p>
                      <p className="text-xs text-gray-400">{car.marca}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{car.año}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{formatPrice(car.precio)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[car.status]}`}>
                      {STATUS_LABELS[car.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {canEdit ? (
                      <button onClick={() => toggleVisible(car)}
                        className={`relative w-10 h-5 rounded-full transition ${car.visible ? 'bg-blue-600' : 'bg-gray-200'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${car.visible ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    ) : (
                      <span className={`text-xs ${car.visible ? 'text-green-600' : 'text-gray-400'}`}>{car.visible ? 'Sí' : 'No'}</span>
                    )}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setModal(car)} className="p-1.5 text-gray-400 hover:text-blue-600 transition">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        {canDelete && (
                          <button onClick={() => setDeleteId(car.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {cars.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No hay autos en el inventario</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CarModal */}
      {modal && (
        <CarModal
          car={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={loadCars}
        />
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-gray-900 mb-2">¿Eliminar auto?</h3>
            <p className="text-sm text-gray-500 mb-4">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-semibold transition">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify**

Log into `/admin/inventario` — table loads, "Agregar auto" opens modal, form submission creates a car in Supabase, visible toggle works, delete shows confirmation.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/Inventario.jsx
git commit -m "feat: implement Inventario admin section with full CRUD"
```

---

## Task 11: Leads admin section

**Files:**
- Modify: `src/pages/admin/Leads.jsx` (replace placeholder)

- [ ] **Step 1: Replace `src/pages/admin/Leads.jsx`**

```jsx
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { TrashIcon } from '@heroicons/react/24/outline'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Nuevo' },
  { value: 'reviewing', label: 'En revisión' },
  { value: 'offer_made', label: 'Oferta enviada' },
  { value: 'closed', label: 'Cerrado' },
]
const STATUS_COLORS = {
  pending: 'bg-blue-100 text-blue-700',
  reviewing: 'bg-yellow-100 text-yellow-700',
  offer_made: 'bg-purple-100 text-purple-700',
  closed: 'bg-gray-100 text-gray-500',
}

export default function Leads() {
  const { profile } = useAuth()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  const canEdit = profile?.role === 'admin' || profile?.role === 'seller'
  const canDelete = profile?.role === 'admin'

  async function loadLeads() {
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
    setLeads(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadLeads() }, [])

  async function updateStatus(id, status) {
    const { error } = await supabase.from('leads').update({ status }).eq('id', id)
    if (error) toast.error('Error al actualizar')
    else {
      toast.success('Estado actualizado')
      setLeads(l => l.map(x => x.id === id ? { ...x, status } : x))
    }
  }

  async function updateNotas(id, notas) {
    const { error } = await supabase.from('leads').update({ notas }).eq('id', id)
    if (error) toast.error('Error al guardar nota')
    else toast.success('Nota guardada')
  }

  async function deleteLead(id) {
    if (!confirm('¿Eliminar este lead?')) return
    const { error } = await supabase.from('leads').delete().eq('id', id)
    if (error) toast.error('Error al eliminar')
    else { toast.success('Lead eliminado'); setLeads(l => l.filter(x => x.id !== id)) }
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Leads</h1>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Folio</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Auto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Contacto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                {canDelete && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.map(lead => (
                <React.Fragment key={lead.id}>
                  <tr onClick={() => setExpanded(expanded === lead.id ? null : lead.id)}
                    className="hover:bg-gray-50 cursor-pointer transition">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{lead.id.substring(0, 8).toUpperCase()}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{lead.nombre}</td>
                    <td className="px-4 py-3 text-gray-600">{lead.marca} {lead.modelo} {lead.año}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{lead.email}<br />{lead.telefono}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      {canEdit ? (
                        <select value={lead.status} onChange={e => updateStatus(lead.id, e.target.value)}
                          className={`text-xs font-semibold px-2 py-1 rounded-full border-0 focus:ring-2 focus:ring-blue-500 ${STATUS_COLORS[lead.status]}`}>
                          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      ) : (
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[lead.status]}`}>
                          {STATUS_OPTIONS.find(s => s.value === lead.status)?.label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {format(new Date(lead.created_at), 'dd MMM yyyy', { locale: es })}
                    </td>
                    {canDelete && (
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <button onClick={() => deleteLead(lead.id)} className="p-1.5 text-gray-300 hover:text-red-500 transition">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                  {expanded === lead.id && (
                    <tr className="bg-blue-50">
                      <td colSpan={canDelete ? 7 : 6} className="px-6 py-4 space-y-3">
                        {lead.descripcion && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1">Descripción del cliente</p>
                            <p className="text-sm text-gray-700">{lead.descripcion}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">Notas internas</p>
                          {canEdit ? (
                            <textarea rows={2} defaultValue={lead.notas ?? ''}
                              onBlur={e => updateNotas(lead.id, e.target.value)}
                              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Agrega notas internas..." />
                          ) : (
                            <p className="text-sm text-gray-600">{lead.notas || '—'}</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {leads.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No hay leads todavía</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify**

Visit `/admin/leads` — table shows leads from Supabase, clicking a row expands it, status dropdown updates immediately with toast, notes save on blur.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/Leads.jsx
git commit -m "feat: implement Leads admin section with status pipeline"
```

---

## Task 12: Reportes admin section

**Files:**
- Modify: `src/pages/admin/Reportes.jsx` (replace placeholder)

- [ ] **Step 1: Replace `src/pages/admin/Reportes.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { supabase } from '../../lib/supabase'

function formatPrice(p) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(p)
}

function downloadCSV(filename, headers, rows) {
  const BOM = '\uFEFF'
  const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))]
  const blob = new Blob([BOM + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function addPDFHeader(doc, title) {
  doc.setFontSize(16)
  doc.setFont(undefined, 'bold')
  doc.text('AutoKlic', 14, 18)
  doc.setFontSize(11)
  doc.setFont(undefined, 'normal')
  doc.text(title, 14, 26)
  doc.setFontSize(9)
  doc.setTextColor(150)
  doc.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 32)
  doc.setTextColor(0)
  return 38
}

const STATUS_LABELS = { available: 'Disponible', sold: 'Vendido', reserved: 'Reservado', pending: 'Nuevo', reviewing: 'En revisión', offer_made: 'Oferta enviada', closed: 'Cerrado' }

export default function Reportes() {
  const [cars, setCars] = useState([])
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    Promise.all([
      supabase.from('cars').select('*').order('created_at', { ascending: false }),
      supabase.from('leads').select('*').order('created_at', { ascending: false }),
    ]).then(([{ data: c }, { data: l }]) => {
      setCars(c ?? [])
      setLeads(l ?? [])
      setLoading(false)
    })
  }, [])

  function filterByDate(items) {
    return items.filter(item => {
      const d = new Date(item.created_at)
      if (dateFrom && d < new Date(dateFrom)) return false
      if (dateTo && d > new Date(dateTo + 'T23:59:59')) return false
      return true
    })
  }

  const filteredCars = filterByDate(cars)
  const soldCars = cars.filter(c => c.status === 'sold')
  const filteredSold = filterByDate(soldCars)
  const filteredLeads = filterByDate(leads)
  const activeLeads = leads.filter(l => ['pending', 'reviewing'].includes(l.status))
  const revenue = soldCars.reduce((sum, c) => sum + Number(c.precio), 0)

  // PDF exports
  function exportInventarioPDF() {
    const doc = new jsPDF()
    const startY = addPDFHeader(doc, 'Inventario de Autos')
    autoTable(doc, {
      startY,
      head: [['Marca', 'Modelo', 'Año', 'Precio', 'Km', 'Estado', 'Visible']],
      body: filteredCars.map(c => [c.marca, c.modelo, c.año, formatPrice(c.precio), c.kilometraje?.toLocaleString(), STATUS_LABELS[c.status], c.visible ? 'Sí' : 'No']),
    })
    doc.save(`inventario-${format(new Date(), 'yyyyMMdd')}.pdf`)
  }

  function exportVentasPDF() {
    const doc = new jsPDF()
    const startY = addPDFHeader(doc, 'Reporte de Ventas')
    // Group by month
    const byMonth = {}
    filteredSold.forEach(c => {
      const key = format(parseISO(c.created_at), 'MMMM yyyy', { locale: es })
      if (!byMonth[key]) byMonth[key] = []
      byMonth[key].push(c)
    })
    const body = []
    for (const [month, items] of Object.entries(byMonth)) {
      body.push([{ content: month, colSpan: 5, styles: { fontStyle: 'bold', fillColor: [230, 240, 255] } }])
      items.forEach(c => body.push([c.marca, c.modelo, c.año, formatPrice(c.precio), format(parseISO(c.created_at), 'dd/MM/yyyy')]))
    }
    if (body.length === 0) body.push([{ content: 'Sin ventas en el período', colSpan: 5, styles: { halign: 'center' } }])
    autoTable(doc, { startY, head: [['Marca', 'Modelo', 'Año', 'Precio', 'Fecha']], body })
    doc.save(`ventas-${format(new Date(), 'yyyyMMdd')}.pdf`)
  }

  function exportLeadsPDF() {
    const doc = new jsPDF()
    const startY = addPDFHeader(doc, 'Pipeline de Leads')
    autoTable(doc, {
      startY,
      head: [['Folio', 'Nombre', 'Auto', 'Email', 'Teléfono', 'Estado', 'Fecha']],
      body: filteredLeads.map(l => [
        l.id.substring(0, 8).toUpperCase(),
        l.nombre, `${l.marca} ${l.modelo} ${l.año}`, l.email, l.telefono,
        STATUS_LABELS[l.status],
        format(parseISO(l.created_at), 'dd/MM/yyyy'),
      ]),
    })
    doc.save(`leads-${format(new Date(), 'yyyyMMdd')}.pdf`)
  }

  // CSV exports
  function exportInventarioCSV() {
    const headers = ['Marca', 'Modelo', 'Año', 'Precio', 'Kilometraje', 'Transmisión', 'Combustible', 'Color', 'Estado', 'Visible', 'Fecha']
    const rows = filteredCars.map(c => [c.marca, c.modelo, c.año, c.precio, c.kilometraje, c.transmision, c.combustible, c.color, STATUS_LABELS[c.status], c.visible ? 'Sí' : 'No', format(parseISO(c.created_at), 'dd/MM/yyyy')])
    downloadCSV(`inventario-${format(new Date(), 'yyyyMMdd')}.csv`, headers, rows)
  }

  function exportVentasCSV() {
    const headers = ['Marca', 'Modelo', 'Año', 'Precio', 'Kilometraje', 'Fecha']
    const rows = filteredSold.map(c => [c.marca, c.modelo, c.año, c.precio, c.kilometraje, format(parseISO(c.created_at), 'dd/MM/yyyy')])
    downloadCSV(`ventas-${format(new Date(), 'yyyyMMdd')}.csv`, headers, rows)
  }

  function exportLeadsCSV() {
    const headers = ['Folio', 'Nombre', 'Email', 'Teléfono', 'Marca', 'Modelo', 'Año', 'Km', 'Estado', 'Fecha']
    const rows = filteredLeads.map(l => [l.id.substring(0, 8).toUpperCase(), l.nombre, l.email, l.telefono, l.marca, l.modelo, l.año, l.kilometraje, STATUS_LABELS[l.status], format(parseISO(l.created_at), 'dd/MM/yyyy')])
    downloadCSV(`leads-${format(new Date(), 'yyyyMMdd')}.csv`, headers, rows)
  }

  const summaryCards = [
    { label: 'Autos en inventario', value: cars.length },
    { label: 'Autos vendidos', value: soldCars.length },
    { label: 'Leads activos', value: activeLeads.length },
    { label: 'Ingresos estimados', value: formatPrice(revenue) },
  ]

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Reportes</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summaryCards.map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">{card.label}</p>
            <p className="text-2xl font-bold text-gray-900">{loading ? '—' : card.value}</p>
          </div>
        ))}
      </div>

      {/* Date range */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <label className="text-sm text-gray-600 font-medium">Período:</label>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <span className="text-gray-400 text-sm">—</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(''); setDateTo('') }} className="text-sm text-blue-600 hover:underline">Limpiar</button>
        )}
      </div>

      {/* Export buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'Inventario', subtitle: `${filteredCars.length} autos`, onPDF: exportInventarioPDF, onCSV: exportInventarioCSV },
          { title: 'Ventas', subtitle: `${filteredSold.length} vendidos`, onPDF: exportVentasPDF, onCSV: exportVentasCSV },
          { title: 'Leads', subtitle: `${filteredLeads.length} registros`, onPDF: exportLeadsPDF, onCSV: exportLeadsCSV },
        ].map(({ title, subtitle, onPDF, onCSV }) => (
          <div key={title} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="font-semibold text-gray-900">{title}</p>
            <p className="text-xs text-gray-400 mb-4">{subtitle}</p>
            <div className="flex gap-2">
              <button onClick={onPDF} disabled={loading}
                className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold py-2 rounded-lg transition disabled:opacity-50">
                PDF
              </button>
              <button onClick={onCSV} disabled={loading}
                className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold py-2 rounded-lg transition disabled:opacity-50">
                CSV
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify**

Visit `/admin/reportes` — summary cards load, PDF downloads work (open generated PDF), CSV downloads open correctly in Excel.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/Reportes.jsx
git commit -m "feat: implement Reportes with PDF and CSV exports"
```

---

## Task 13: Usuarios admin section

**Files:**
- Modify: `src/pages/admin/Usuarios.jsx` (replace placeholder)

- [ ] **Step 1: Replace `src/pages/admin/Usuarios.jsx`**

```jsx
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import RoleBadge from '../../components/admin/RoleBadge'

const ROLES = ['admin', 'seller', 'viewer']
const ROLE_LABELS = { admin: 'Admin', seller: 'Vendedor', viewer: 'Visor' }

export default function Usuarios() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('profiles').select('*').order('email').then(({ data }) => {
      setUsers(data ?? [])
      setLoading(false)
    })
  }, [])

  async function updateRole(id, role) {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
    if (error) toast.error('Error al actualizar rol')
    else {
      toast.success('Rol actualizado')
      setUsers(u => u.map(x => x.id === id ? { ...x, role } : x))
    }
  }

  function showInviteInstructions() {
    toast('Para invitar un usuario: Supabase dashboard → Authentication → Users → Invite user', { duration: 6000 })
  }

  async function sendPasswordReset(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) toast.error('Error al enviar correo')
    else toast.success('Correo de restablecimiento enviado')
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Usuarios</h1>
        <button onClick={showInviteInstructions}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
          + Invitar usuario
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Rol</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-900">{user.nombre}</td>
                  <td className="px-4 py-3 text-gray-500">{user.email}</td>
                  <td className="px-4 py-3">
                    <select value={user.role} onChange={e => updateRole(user.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => sendPasswordReset(user.email)}
                        className="text-xs text-blue-600 hover:underline">
                        Restablecer contraseña
                      </button>
                      <button disabled title="Gestionar en Supabase Dashboard"
                        className="text-xs text-gray-300 cursor-not-allowed">
                        Desactivar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={4} className="text-center py-12 text-gray-400">No hay usuarios</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify**

Visit `/admin/usuarios` — lists profiles, role dropdown saves on change, "Invitar usuario" shows toast with instructions, "Restablecer contraseña" sends email.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/Usuarios.jsx
git commit -m "feat: implement Usuarios admin section"
```

---

## Task 14: Final verification and build

- [ ] **Step 1: Run full lint check**

```bash
npm run lint
```

Fix any reported errors before proceeding.

- [ ] **Step 2: Run production build**

```bash
npm run build
```

Expected: build completes with no errors. Warnings about chunk sizes are acceptable.

- [ ] **Step 3: Preview production build**

```bash
npm run preview
```

Manually verify all routes work: `/`, `/catalogo`, `/vende-tu-auto`, `/login`, `/admin/inventario`, `/admin/leads`, `/admin/reportes`, `/admin/usuarios`, `/nonexistent` (shows 404).

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete AutoKlic professional pages with Supabase backend"
```
