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

  const resolveHref = (href) => (isHome ? href : `/${href}`);

  const primaryLinks = [
    { name: 'Inventario', to: '/catalogo' },
    { name: 'Vende', to: '/vende-tu-auto' },
    { name: 'Valúa', to: '/valua-tu-auto' },
    { name: 'Contacto', href: '#contacto' },
  ];

  const secondaryLinks = [
    { name: 'Inicio', href: '#inicio' },
    { name: 'Proceso', href: '#proceso' },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-gray-950/95 backdrop-blur border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <a
          href={isHome ? '#inicio' : '/'}
          className="flex items-center gap-2.5 shrink-0"
        >
          <img src={logo} alt="" className="h-8 w-auto sm:h-9" />
          <span className="font-heading text-xl font-bold tracking-tight text-white">
            Auto<span className="text-amber-400">Klic</span>
          </span>
        </a>

        <nav className="hidden lg:flex items-center gap-6">
          {primaryLinks.map((link) =>
            link.to ? (
              <Link
                key={link.name}
                to={link.to}
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-150"
              >
                {link.name}
              </Link>
            ) : (
              <a
                key={link.name}
                href={resolveHref(link.href)}
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-150"
              >
                {link.name}
              </a>
            ),
          )}
        </nav>

        <div className="hidden lg:flex items-center shrink-0">
          {user ? (
            <Link
              to="/admin/inventario"
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              <UserCircleIcon className="h-4 w-4" />
              Panel
            </Link>
          ) : (
            <Link
              to="/login"
              className="text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors"
            >
              Staff
            </Link>
          )}
        </div>

        <div className="flex lg:hidden items-center gap-2">
          <button
            onClick={() => setOpen(!open)}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            aria-label="Abrir menú"
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            {open ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          open ? 'max-h-[28rem] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="border-t border-white/8 px-4 pb-4 pt-2 flex flex-col gap-1">
          {[...primaryLinks, ...secondaryLinks].map((link) =>
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
            ),
          )}
          {user ? (
            <Link
              to="/admin/inventario"
              onClick={() => setOpen(false)}
              className="text-red-400 hover:bg-white/5 px-3 py-2.5 rounded-lg text-sm font-medium"
            >
              Panel admin
            </Link>
          ) : (
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:bg-white/5 px-3 py-2.5 rounded-lg text-sm font-medium"
            >
              Staff
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
