# User Soft Delete & Hard Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow admins to deactivate users (soft delete, reversible, blocks login) and permanently delete them (hard delete) from the Usuarios admin panel.

**Architecture:** Add `active` boolean to `profiles` table; use Supabase Auth ban API server-side to truly block login; two new Vercel serverless endpoints mirror the existing `create-user.js` pattern. UI gets toggle + delete actions per row plus an active/inactive filter.

**Tech Stack:** React 19, Supabase (Auth admin API + profiles table), Vercel serverless functions (Node.js), Tailwind CSS, react-hot-toast, Heroicons.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `api/toggle-user.js` | **Create** | Ban/unban user in Supabase Auth + set `active` in profiles |
| `api/delete-user.js` | **Create** | Hard-delete user from Supabase Auth (cascades to profiles) + nullify leads |
| `src/context/AuthContext.jsx` | **Modify** | Sign out automatically if loaded profile has `active === false` |
| `src/pages/admin/Usuarios.jsx` | **Modify** | Show active/inactive state, toggle + delete actions, filter tabs |

> **Supabase DB migration (manual step):** Run this SQL in the Supabase dashboard SQL editor before starting:
> ```sql
> ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
> ```

---

## Task 1: DB migration

**Files:** None (Supabase dashboard)

- [ ] **Step 1: Run migration SQL**

  Open Supabase dashboard → SQL Editor → run:
  ```sql
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
  ```

- [ ] **Step 2: Verify**

  In Supabase Table Editor, confirm `profiles` table now has `active` column with all existing rows set to `true`.

---

## Task 2: Create `api/toggle-user.js`

**Files:**
- Create: `api/toggle-user.js`

This endpoint accepts `{ userId, active: boolean }` in the request body. It bans or unbans the user in Supabase Auth using `auth.admin.updateUserById`, then updates `profiles.active`. Requires caller to be admin (same pattern as `create-user.js`).

- [ ] **Step 1: Create the file**

```js
// api/toggle-user.js
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' })
  }

  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Verify caller is admin
  const token = authHeader.slice(7)
  const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !caller) return res.status(401).json({ error: 'Token inválido' })

  const { data: callerProfile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', caller.id)
    .single()
  if (callerProfile?.role !== 'admin') {
    return res.status(403).json({ error: 'Se requiere rol de administrador' })
  }

  const { userId, active } = req.body
  if (!userId || typeof active !== 'boolean') {
    return res.status(400).json({ error: 'userId y active son requeridos' })
  }

  // Prevent admin from deactivating themselves
  if (userId === caller.id) {
    return res.status(400).json({ error: 'No puedes desactivarte a ti mismo' })
  }

  // Ban or unban in Supabase Auth
  // ban_duration: '87600h' = 10 years (effectively permanent); 'none' = unban
  const banDuration = active ? 'none' : '87600h'
  const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    ban_duration: banDuration,
  })
  if (banError) return res.status(500).json({ error: banError.message })

  // Sync active flag in profiles
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ active })
    .eq('id', userId)
  if (profileError) return res.status(500).json({ error: profileError.message })

  return res.status(200).json({ ok: true, active })
}
```

- [ ] **Step 2: Verify file saved correctly** — no syntax errors, matches pattern of `api/create-user.js`.

---

## Task 3: Create `api/delete-user.js`

**Files:**
- Create: `api/delete-user.js`

Uses POST (not DELETE) so Vercel's body parser reliably parses the JSON body.
Operation order: nullify leads → delete from Auth (cascades profile if FK exists) → delete profile row manually as safety net.

- [ ] **Step 1: Create the file**

```js
// api/delete-user.js
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // Use POST so Vercel body parser reliably reads the JSON body
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' })
  }

  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Verify caller is admin
  const token = authHeader.slice(7)
  const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !caller) return res.status(401).json({ error: 'Token inválido' })

  const { data: callerProfile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', caller.id)
    .single()
  if (callerProfile?.role !== 'admin') {
    return res.status(403).json({ error: 'Se requiere rol de administrador' })
  }

  const { userId } = req.body
  if (!userId) return res.status(400).json({ error: 'userId es requerido' })

  // Prevent admin from deleting themselves
  if (userId === caller.id) {
    return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' })
  }

  // 1. Nullify leads assigned to this user
  await supabaseAdmin
    .from('leads')
    .update({ assigned_to: null })
    .eq('assigned_to', userId)

  // 2. Delete from Supabase Auth first (cascades to profiles if ON DELETE CASCADE FK exists)
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (deleteError) return res.status(500).json({ error: deleteError.message })

  // 3. Delete profile row manually as safety net (no-op if cascade already removed it)
  await supabaseAdmin.from('profiles').delete().eq('id', userId)

  return res.status(200).json({ ok: true })
}
```

- [ ] **Step 2: Verify file saved correctly.**

---

## Task 4: Update `AuthContext.jsx` — auto sign-out if inactive

**Files:**
- Modify: `src/context/AuthContext.jsx`

After loading the profile, check if `active === false`. If so, sign out immediately.
Important: ensure `loading` is set to `false` in all code paths (including the early-return branch) to avoid the app freezing.

- [ ] **Step 1: Modify `loadProfile` to check active flag**

  Replace the `loadProfile` function with:

  ```js
  async function loadProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data?.active === false) {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      setLoading(false)
      navigate('/login')
      return
    }
    setProfile(data)
  }
  ```

  Note: `setLoading(false)` is called explicitly in the inactive branch so the app never freezes. The existing `.finally(() => setLoading(false))` in the `getSession` branch still handles the happy path.

- [ ] **Step 2: Verify manually** — in Supabase dashboard set `active = false` on a test user row, then try to access `/admin`. Should redirect to `/login`.

---

## Task 5: Update `Usuarios.jsx` — UI for toggle and hard delete

**Files:**
- Modify: `src/pages/admin/Usuarios.jsx`

Changes:
1. Filter tabs: **Activos | Inactivos | Todos**
2. Inactive rows: grayed out + "Inactivo" badge
3. **Desactivar / Activar** button per row
4. **Eliminar** (trash) button per row with confirmation modal
5. Self-protection: hide toggle + delete for the currently logged-in user

- [ ] **Step 1: Update imports at the top**

  Replace the existing import line for heroicons with:
  ```js
  import { XMarkIcon, UserPlusIcon, TrashIcon, NoSymbolIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
  ```

  Add after the heroicons import:
  ```js
  import { useAuth } from '../../context/AuthContext'
  ```

- [ ] **Step 2: Add state and derived values inside the component**

  After the existing state declarations (`users`, `loading`, `showModal`, `form`, `saving`), add:
  ```js
  const { user: currentUser } = useAuth()
  const [activeFilter, setActiveFilter]   = useState('active') // 'all' | 'active' | 'inactive'
  const [confirmDelete, setConfirmDelete] = useState(null)     // user object | null
  const [toggling, setToggling]           = useState(null)     // userId being toggled | null
  const [deleting, setDeleting]           = useState(false)

  const filtered = users.filter(u => {
    if (activeFilter === 'active')   return u.active !== false  // treat undefined as active
    if (activeFilter === 'inactive') return u.active === false
    return true
  })
  ```

- [ ] **Step 3: Add `getToken` helper inside the component**

  Add after the `filtered` declaration:
  ```js
  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      toast.error('Sesión expirada, vuelve a iniciar sesión')
      return null
    }
    return session.access_token
  }
  ```

- [ ] **Step 4: Add `toggleActive` function**

  ```js
  async function toggleActive(u) {
    const token = await getToken()
    if (!token) return
    setToggling(u.id)
    // treat undefined as active (rows created before migration)
    const newActive = u.active === false
    const res = await fetch('/api/toggle-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ userId: u.id, active: newActive }),
    })
    const result = await res.json()
    if (!res.ok) {
      toast.error(result.error ?? 'Error al actualizar usuario')
    } else {
      toast.success(newActive ? 'Usuario reactivado' : 'Usuario desactivado')
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, active: result.active } : x))
    }
    setToggling(null)
  }
  ```

- [ ] **Step 5: Add `confirmAndDelete` function**

  ```js
  async function confirmAndDelete() {
    if (!confirmDelete) return
    const token = await getToken()
    if (!token) { setConfirmDelete(null); return }
    setDeleting(true)
    const res = await fetch('/api/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ userId: confirmDelete.id }),
    })
    const result = await res.json()
    if (!res.ok) {
      toast.error(result.error ?? 'Error al eliminar usuario')
    } else {
      toast.success('Usuario eliminado permanentemente')
      setUsers(prev => prev.filter(x => x.id !== confirmDelete.id))
    }
    setDeleting(false)
    setConfirmDelete(null)
  }
  ```

- [ ] **Step 6: Add filter tabs**

  Inside the `else` branch of the `loading` ternary (right above `<div className="bg-white rounded-xl border...`), add:
  ```jsx
  {/* Filter tabs — placed inside the else/loaded branch */}
  <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
    {[
      { key: 'active',   label: 'Activos' },
      { key: 'inactive', label: 'Inactivos' },
      { key: 'all',      label: 'Todos' },
    ].map(tab => (
      <button
        key={tab.key}
        onClick={() => setActiveFilter(tab.key)}
        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
          activeFilter === tab.key
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
  ```

- [ ] **Step 7: Add "Estado" column header**

  In the `<thead>` row, add after the "Rol" `<th>`:
  ```jsx
  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
  ```
  The table now has 5 columns total: Nombre, Email, Rol, Estado, Acciones.

- [ ] **Step 8: Replace `users.map(...)` row with updated row**

  Replace the entire `users.map(user => (...))` block with:
  ```jsx
  {filtered.map(user => {
    const isInactive = user.active === false
    const isSelf     = user.id === currentUser?.id
    return (
      <tr key={user.id} className={`hover:bg-gray-50 transition ${isInactive ? 'opacity-50' : ''}`}>
        <td className="px-4 py-3 font-medium text-gray-900">{user.nombre ?? '—'}</td>
        <td className="px-4 py-3 text-gray-500">{user.email}</td>
        <td className="px-4 py-3">
          <select
            value={user.role}
            onChange={e => updateRole(user.id, e.target.value)}
            disabled={isInactive}
            className={`text-xs font-semibold px-2 py-1 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-red-500/30 cursor-pointer disabled:cursor-not-allowed ${ROLE_COLORS[user.role]}`}
          >
            {ROLES.map(r => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </td>
        <td className="px-4 py-3">
          {isInactive ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              <NoSymbolIcon className="w-3 h-3" /> Inactivo
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
              <CheckCircleIcon className="w-3 h-3" /> Activo
            </span>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2 flex-wrap">
            {!isSelf && (
              <button
                onClick={() => toggleActive(user)}
                disabled={toggling === user.id}
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors disabled:opacity-50"
              >
                {toggling === user.id ? '...' : isInactive ? 'Activar' : 'Desactivar'}
              </button>
            )}
            <button
              onClick={() => sendPasswordReset(user.email)}
              className="text-xs text-gray-500 hover:text-gray-800 hover:underline transition-colors"
            >
              Restablecer contraseña
            </button>
            {!isSelf && (
              <button
                onClick={() => setConfirmDelete(user)}
                className="p-1 text-gray-300 hover:text-red-500 transition"
                title="Eliminar permanentemente"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </td>
      </tr>
    )
  })}
  ```

- [ ] **Step 9: Update empty-state colspan to 5**

  ```jsx
  <td colSpan={5} className="text-center py-12 text-gray-400">
    No hay usuarios registrados
  </td>
  ```

- [ ] **Step 10: Update user count in header to reflect current filter**

  Replace:
  ```jsx
  <p className="text-sm text-gray-400 mt-0.5">{users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}</p>
  ```
  With:
  ```jsx
  <p className="text-sm text-gray-400 mt-0.5">{filtered.length} de {users.length} usuario{users.length !== 1 ? 's' : ''}</p>
  ```

- [ ] **Step 11: Add delete confirmation modal**

  Before the closing `</div>` of the component return, after the existing create-user modal:
  ```jsx
  {/* Delete confirmation modal */}
  {confirmDelete && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-2">¿Eliminar usuario?</h2>
        <p className="text-sm text-gray-500 mb-1">
          Esta acción es <strong>permanente e irreversible</strong>.
        </p>
        <p className="text-sm font-medium text-gray-800 mb-6">
          {confirmDelete.nombre ?? confirmDelete.email}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setConfirmDelete(null)}
            className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-xl text-sm font-semibold transition"
          >
            Cancelar
          </button>
          <button
            onClick={confirmAndDelete}
            disabled={deleting}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold transition"
          >
            {deleting ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  )}
  ```

- [ ] **Step 12: Run dev server and verify manually**

  ```bash
  npm run dev
  ```

  Manual test checklist:
  - [ ] Filter tabs switch between Activos / Inactivos / Todos correctly
  - [ ] User count updates to reflect current filter
  - [ ] "Desactivar" grays out the row + badge changes to "Inactivo"
  - [ ] "Activar" restores the row to normal
  - [ ] Trash icon opens confirmation modal with user's name
  - [ ] "Sí, eliminar" removes the user from the list
  - [ ] Own row has no Desactivar or trash button
  - [ ] Banned user cannot log in (test with the banned account)

- [ ] **Step 13: Commit**

  ```bash
  git add api/toggle-user.js api/delete-user.js src/context/AuthContext.jsx src/pages/admin/Usuarios.jsx
  git commit -m "feat(usuarios): add soft delete (deactivate/reactivate) and hard delete for users"
  ```
