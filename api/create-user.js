// api/create-user.js
// Vercel serverless function — runs server-side only.
// Uses the Supabase service role key to create users via the Admin API.
// The service role key is NEVER exposed to the browser.

import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' })
  }

  // Admin Supabase client — only exists server-side
  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Verify the calling user exists and is an admin
  const token = authHeader.slice(7)
  const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !caller) {
    return res.status(401).json({ error: 'Token inválido' })
  }

  const { data: callerProfile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', caller.id)
    .single()

  if (callerProfile?.role !== 'admin') {
    return res.status(403).json({ error: 'Se requiere rol de administrador' })
  }

  // Validate input
  const { email, password, nombre, role = 'viewer' } = req.body
  if (!email || !password || !nombre) {
    return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
  }
  if (!['admin', 'seller', 'viewer'].includes(role)) {
    return res.status(400).json({ error: 'Rol inválido' })
  }

  // Create the auth user (email_confirm: true skips verification email)
  const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre },
  })

  if (createError) {
    return res.status(400).json({ error: createError.message })
  }

  // Upsert the profile with the desired role
  const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
    id: data.user.id,
    email,
    nombre,
    role,
  })

  if (profileError) {
    return res.status(500).json({ error: 'Usuario creado pero error al asignar rol' })
  }

  return res.status(200).json({ id: data.user.id, email, nombre, role })
}
