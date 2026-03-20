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
import Dashboard from './pages/admin/Dashboard'
import Inventario from './pages/admin/Inventario'
import Leads from './pages/admin/Leads'
import Reportes from './pages/admin/Reportes'
import Usuarios from './pages/admin/Usuarios'
import Ayuda from './pages/admin/Ayuda'
import Perfil from './pages/admin/Perfil'

import ProtectedRoute from './components/admin/ProtectedRoute'
import WhatsAppButton from './components/WhatsAppButton'

function HomeLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="pt-16">{children}</main>
      <Footer />
      <WhatsAppButton />
    </>
  )
}

function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="pt-16">{children}</main>
      <Footer />
      <WhatsAppButton />
    </>
  )
}

export default function App() {
  useEffect(() => {
    AOS.init({ duration: 800, once: true })
  }, [])

  return (
    <Routes>
      <Route path="/" element={
        <HomeLayout>
          <Hero /><FeaturedCars /><Process /><ContactForm />
        </HomeLayout>
      } />
      <Route path="/autos/:modelo" element={<PublicLayout><AutoDetalle /></PublicLayout>} />
      <Route path="/catalogo" element={<PublicLayout><Catalogo /></PublicLayout>} />
      <Route path="/vende-tu-auto" element={<PublicLayout><VendeTuAuto /></PublicLayout>} />

      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/admin" element={
        <ProtectedRoute><AdminLayout /></ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="inventario" element={<Inventario />} />
        <Route path="leads" element={<Leads />} />
        <Route path="reportes" element={<Reportes />} />
        <Route path="usuarios" element={
          <ProtectedRoute requiredRole="admin"><Usuarios /></ProtectedRoute>
        } />
        <Route path="ayuda" element={<Ayuda />} />
        <Route path="perfil" element={<Perfil />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
