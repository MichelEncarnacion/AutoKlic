// api/delete-user.js
// Vercel serverless function — runs server-side only.
// Uses the Supabase service role key to permanently delete users via the Admin API.
// The service role key is NEVER exposed to the browser.

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
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!UUID_RE.test(userId)) return res.status(400).json({ error: 'userId inválido' })

  // Prevent admin from deleting themselves
  if (userId === caller.id) {
    return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' })
  }

  // Verify target user exists in profiles
  const { data: targetProfile, error: targetError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single()
  if (targetError?.code === 'PGRST116') {
    return res.status(404).json({ error: 'Usuario no encontrado' })
  }
  if (targetError) {
    return res.status(500).json({ error: 'Error al verificar usuario' })
  }
  if (!targetProfile) {
    return res.status(404).json({ error: 'Usuario no encontrado' })
  }

  // 1. Nullify leads assigned to this user
  const { error: leadsError } = await supabaseAdmin
    .from('leads')
    .update({ assigned_to: null })
    .eq('assigned_to', userId)
  if (leadsError) return res.status(500).json({ error: 'Error al desvincular leads del usuario' })

  // 2. Delete from Supabase Auth first (cascades to profiles if ON DELETE CASCADE FK exists)
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (deleteError) return res.status(500).json({ error: deleteError.message })

  // 3. Delete profile row manually as safety net (no-op if cascade already removed it)
  await supabaseAdmin.from('profiles').delete().eq('id', userId)

  return res.status(200).json({ ok: true })
}
