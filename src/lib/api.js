/**
 * AutoKlic PHP API client (replaces @supabase/supabase-js).
 * Base URL defaults to same-origin /api (cPanel). Override with VITE_API_BASE.
 */

const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '')
const TOKEN_KEY = 'ak_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function request(path, { method = 'GET', body, formData, auth = true, headers: extra = {} } = {}) {
  const headers = { ...extra }
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }
  let payload = body
  if (formData) {
    payload = formData
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }
  try {
    const res = await fetch(`${API_BASE}${path}`, { method, headers, body: payload })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { data: null, error: { message: json.error || res.statusText || 'Error' }, status: res.status, raw: json }
    }
    return { data: json, error: null, status: res.status, raw: json }
  } catch (e) {
    return { data: null, error: { message: e.message || 'Network error' } }
  }
}

function unwrapList(result) {
  if (result.error) return { data: null, error: result.error, count: 0 }
  const data = result.data?.data ?? result.data ?? []
  const count = result.data?.count ?? (Array.isArray(data) ? data.length : 0)
  return { data, error: null, count }
}

function unwrapOne(result) {
  if (result.error) return { data: null, error: result.error }
  return { data: result.data?.data ?? result.data ?? null, error: null }
}

export const api = {
  auth: {
    async login(email, password) {
      const res = await request('/auth/login', { method: 'POST', body: { email, password }, auth: false })
      if (res.error) return { error: res.error }
      setToken(res.data.access_token)
      return { data: res.data, error: null }
    },
    async logout() {
      await request('/auth/logout', { method: 'POST' })
      setToken(null)
      return { error: null }
    },
    async me() {
      if (!getToken()) return { data: null, error: { message: 'No session' } }
      const res = await request('/auth/me')
      if (res.error) return { data: null, error: res.error }
      return { data: res.data, error: null }
    },
    async session() {
      if (!getToken()) return { data: { session: null }, error: null }
      const res = await request('/auth/me')
      if (res.error) {
        setToken(null)
        return { data: { session: null }, error: null }
      }
      return {
        data: {
          session: {
            access_token: getToken(),
            user: res.data.user,
          },
          profile: res.data.profile,
        },
        error: null,
      }
    },
    async updatePassword(password) {
      return request('/auth/password', { method: 'POST', body: { password } })
    },
    async requestReset(email, redirectTo) {
      return request('/auth/request-reset', {
        method: 'POST',
        body: { email, redirectTo },
        auth: false,
      })
    },
    async resetPassword(token, password) {
      return request('/auth/reset-password', {
        method: 'POST',
        body: { token, password },
        auth: false,
      })
    },
  },

  cars: {
    async list(params = {}) {
      const q = new URLSearchParams()
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') q.set(k, String(v))
      })
      const qs = q.toString()
      return unwrapList(await request(`/cars${qs ? `?${qs}` : ''}`, { auth: !params.public }))
    },
    async get(id) {
      return unwrapOne(await request(`/cars/${id}`))
    },
    async create(payload) {
      return unwrapOne(await request('/cars', { method: 'POST', body: payload }))
    },
    async update(id, payload) {
      return unwrapOne(await request(`/cars/${id}`, { method: 'PUT', body: payload }))
    },
    async remove(id) {
      return request(`/cars/${id}`, { method: 'DELETE' })
    },
  },

  leads: {
    async list() {
      return unwrapList(await request('/leads'))
    },
    async create(payload) {
      return unwrapOne(await request('/leads', { method: 'POST', body: payload, auth: false }))
    },
    async update(id, payload) {
      return unwrapOne(await request(`/leads/${id}`, { method: 'PUT', body: payload }))
    },
    async remove(id) {
      return request(`/leads/${id}`, { method: 'DELETE' })
    },
    async staleCount(days) {
      const res = await request(`/leads/stale-count?days=${encodeURIComponent(days)}`)
      if (res.error) return { count: 0, error: res.error }
      return { count: res.data?.count ?? 0, error: null }
    },
  },

  leadEvents: {
    async list(leadId) {
      return unwrapList(await request(`/lead-events?lead_id=${encodeURIComponent(leadId)}`))
    },
    async create(payload) {
      return request('/lead-events', { method: 'POST', body: payload })
    },
  },

  profiles: {
    async list(params = {}) {
      const q = new URLSearchParams()
      if (params.roles) q.set('roles', Array.isArray(params.roles) ? params.roles.join(',') : params.roles)
      if (params.order) q.set('order', params.order)
      const qs = q.toString()
      return unwrapList(await request(`/profiles${qs ? `?${qs}` : ''}`))
    },
    async update(id, payload) {
      return unwrapOne(await request(`/profiles/${id}`, { method: 'PUT', body: payload }))
    },
  },

  settings: {
    async get(key = 'follow_up_days') {
      return unwrapOne(await request(`/settings?key=${encodeURIComponent(key)}`))
    },
    async upsert(payload) {
      return request('/settings', { method: 'PUT', body: payload })
    },
  },

  compras: {
    async list() {
      return unwrapList(await request('/compras'))
    },
    async create(payload) {
      return unwrapOne(await request('/compras', { method: 'POST', body: payload }))
    },
    async update(id, payload) {
      return unwrapOne(await request(`/compras/${id}`, { method: 'PUT', body: payload }))
    },
    async remove(id) {
      return request(`/compras/${id}`, { method: 'DELETE' })
    },
  },

  gastos: {
    async listByCompra(compraId) {
      return unwrapList(await request(`/gastos-compra?compra_id=${encodeURIComponent(compraId)}`))
    },
    async listByCompras(ids) {
      if (!ids?.length) return { data: [], error: null }
      return unwrapList(await request(`/gastos-compra?compra_ids=${encodeURIComponent(ids.join(','))}`))
    },
    async create(payload) {
      return unwrapOne(await request('/gastos-compra', { method: 'POST', body: payload }))
    },
  },

  upload: {
    async carImage(file, carId) {
      const fd = new FormData()
      fd.append('file', file)
      if (carId) fd.append('car_id', carId)
      const res = await request('/upload/car-image', { method: 'POST', formData: fd })
      if (res.error) return { error: res.error }
      return { data: res.data, error: null }
    },
    async compraDoc(file, compraId, pathSegment) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('compra_id', compraId)
      fd.append('path_segment', pathSegment)
      const res = await request('/upload/compra-doc', { method: 'POST', formData: fd })
      if (res.error) return { error: res.error }
      return { data: res.data, error: null }
    },
    async remove(path) {
      return request('/upload/delete', { method: 'POST', body: { path } })
    },
  },

  users: {
    async create(payload) {
      const token = getToken()
      if (!token) return { error: { message: 'Sesión expirada' } }
      const res = await request('/create-user', { method: 'POST', body: payload })
      if (res.error) return { error: res.error, data: null }
      return { data: res.data, error: null }
    },
    async toggle(userId, active) {
      const res = await request('/toggle-user', { method: 'POST', body: { userId, active } })
      if (res.error) return { error: res.error, data: null }
      return { data: res.data, error: null }
    },
    async remove(userId) {
      const res = await request('/delete-user', { method: 'POST', body: { userId } })
      if (res.error) return { error: res.error, data: null }
      return { data: res.data, error: null }
    },
  },
}

export default api
