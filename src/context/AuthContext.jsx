import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, setToken } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  async function bootstrap() {
    const { data } = await api.auth.session()
    if (data?.session?.user) {
      if (data.profile?.active === false) {
        setToken(null)
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }
      setUser(data.session.user)
      setProfile(data.profile)
    } else {
      setUser(null)
      setProfile(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    bootstrap()
  }, [])

  async function signIn(email, password) {
    const { data, error } = await api.auth.login(email, password)
    if (error) return { error }
    if (data?.profile?.active === false) {
      setToken(null)
      return { error: { message: 'Usuario desactivado' } }
    }
    setUser(data.user)
    setProfile(data.profile)
    navigate('/admin/dashboard')
    return { error: null }
  }

  async function signOut() {
    await api.auth.logout()
    setUser(null)
    setProfile(null)
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, setProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
