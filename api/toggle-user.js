// api/toggle-user.js
// Vercel serverless function — runs server-side only.
// Uses the Supabase service role key to toggle user active/inactive via the Admin API.
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

  // Verify target user exists in profiles
  const { data: targetProfile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single()
  if (!targetProfile) {
    return res.status(404).json({ error: 'Usuario no encontrado' })
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
  const { data: updatedProfile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ active })
    .eq('id', userId)
    .select('id')
    .single()
  if (profileError || !updatedProfile) {
    return res.status(500).json({ error: 'Error al sincronizar perfil' })
  }

  return res.status(200).json({ ok: true, active })
}
