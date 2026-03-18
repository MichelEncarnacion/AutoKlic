// src/pages/Login.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/logo.png'

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
    <div className="min-h-screen flex">

      {/* Left: Car image panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="/autos/hero.webp"
          alt="AutoKlic"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950/80 via-gray-950/50 to-gray-950/80" />

        {/* Content over image */}
        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src={logo} alt="AutoKlic" className="h-10 w-auto" />
            <span className="font-heading text-2xl font-bold text-white">AutoKlic</span>
          </div>

          {/* Quote */}
          <div>
            <p className="font-heading text-4xl font-bold text-white leading-tight mb-4">
              Tu auto a un solo <span className="text-amber-400">KLIC</span>
            </p>
            <p className="text-white/60 text-sm leading-relaxed max-w-sm">
              Panel de administración. Gestiona tu inventario, leads y reportes desde un solo lugar.
            </p>
          </div>
        </div>
      </div>

      {/* Right: Form panel */}
      <div className="flex-1 flex flex-col bg-white">

        {/* Back to home */}
        <div className="px-6 sm:px-10 pt-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors group"
          >
            <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Volver al inicio
          </Link>
        </div>

        {/* Form centered */}
        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 py-12">
          <div className="w-full max-w-sm">

            {/* Mobile logo */}
            <div className="flex items-center gap-2.5 mb-8 lg:hidden">
              <img src={logo} alt="AutoKlic" className="h-9 w-auto" />
              <span className="font-heading text-xl font-bold text-gray-900">AutoKlic</span>
            </div>

            <h1 className="font-heading text-3xl font-bold text-gray-900 mb-1">
              Iniciar sesión
            </h1>
            <p className="text-gray-500 text-sm mb-8">
              Accede al panel de administración
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  placeholder="admin@autoklic.mx"
                  {...register('email', { required: 'Campo requerido' })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('password', { required: 'Campo requerido' })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all"
                />
                {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
              </div>

              {authError && (
                <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                  <p className="text-red-600 text-sm">{authError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm tracking-wide transition-all duration-200 hover:shadow-lg hover:shadow-red-600/20 mt-2"
              >
                {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
