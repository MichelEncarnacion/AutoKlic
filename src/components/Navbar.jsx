// src/components/Navbar.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bars3Icon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  const resolveHref = (href) => isHome ? href : `/${href}`;

  const navLinks = [
    { name: 'Inicio', href: '#inicio' },
    { name: 'Vehículos', href: '#autos' },
    { name: 'Proceso', href: '#proceso' },
    { name: 'Contacto', href: '#contacto' },
    { name: 'Catálogo', to: '/catalogo' },
    { name: 'Vende tu Auto', to: '/vende-tu-auto' },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-gray-950 border-b border-white/10 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

        {/* Logo */}
        <a
          href={isHome ? '#inicio' : '/'}
          className="flex items-center gap-2.5 shrink-0"
        >
          <img src={logo} alt="AutoKlic" className="h-8 w-auto sm:h-9" />
          <span className="font-heading text-xl font-bold tracking-tight text-white">
            AutoKlic
          </span>
        </a>

        {/* Desktop Nav — center */}
        <nav className="hidden lg:flex items-center gap-7">
          {navLinks.map(link =>
            link.to ? (
              <Link
                key={link.name}
                to={link.to}
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors duration-150"
              >
                {link.name}
              </Link>
            ) : (
              <a
                key={link.name}
                href={resolveHref(link.href)}
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors duration-150"
              >
                {link.name}
              </a>
            )
          )}
        </nav>

        {/* Desktop right: Login / Admin */}
        <div className="hidden lg:flex items-center shrink-0">
          {user ? (
            <Link
              to="/admin/inventario"
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              <UserCircleIcon className="h-4 w-4" />
              Panel Admin
            </Link>
          ) : (
            <Link
              to="/login"
              className="border border-white/20 hover:border-white/50 hover:bg-white/5 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            >
              Iniciar sesión
            </Link>
          )}
        </div>

        {/* Mobile right */}
        <div className="flex lg:hidden items-center gap-2">
          {user ? (
            <Link to="/admin/inventario" className="text-sm font-medium text-white border border-white/20 px-3 py-1.5 rounded-lg">
              Panel
            </Link>
          ) : (
            <Link to="/login" className="text-sm font-medium text-white border border-white/20 px-3 py-1.5 rounded-lg">
              Login
            </Link>
          )}
          <button
            onClick={() => setOpen(!open)}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            aria-label="Toggle menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            {open ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        id="mobile-menu"
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="border-t border-white/8 px-4 pb-4 pt-2 flex flex-col gap-1">
          {navLinks.map(link =>
            link.to ? (
              <Link
                key={link.name}
                to={link.to}
                onClick={() => setOpen(false)}
                className="text-gray-300 hover:text-white hover:bg-white/5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                {link.name}
              </Link>
            ) : (
              <a
                key={link.name}
                href={resolveHref(link.href)}
                onClick={() => setOpen(false)}
                className="text-gray-300 hover:text-white hover:bg-white/5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                {link.name}
              </a>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
