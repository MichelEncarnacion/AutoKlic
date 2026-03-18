// src/components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import logo from '../assets/logo.png';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Mostrar/ocultar navbar en scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setIsVisible(false); // hacia abajo
      } else {
        setIsVisible(true); // hacia arriba
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Cierra menú en resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const links = [
    { name: 'Inicio', href: '#inicio' },
    { name: 'Vehículos', href: '#autos' },
    { name: 'Proceso', href: '#proceso' },
    { name: 'Contacto', href: '#contacto' },
    { name: 'Catálogo', to: '/catalogo' },
    { name: 'Vende tu Auto', to: '/vende-tu-auto' },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 transform transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo + Nombre */}
        <a href="#inicio" className="flex items-center space-x-3">
          <img src={logo} alt="AutoKlic" className="h-10 w-auto md:h-14" />
          <span className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight">
            AutoKlic
          </span>
        </a>

        {/* Desktop Menu */}
        <nav className="hidden md:flex space-x-10 text-sm font-semibold tracking-wide">
          {links.map(link =>
            link.to ? (
              <Link
                key={link.name}
                to={link.to}
                className="text-gray-700 hover:text-blue-600 hover:underline underline-offset-8 decoration-2 transition duration-300 ease-in-out"
              >
                {link.name}
              </Link>
            ) : (
              <a
                key={link.name}
                href={link.href}
                className="text-gray-700 hover:text-blue-600 hover:underline underline-offset-8 decoration-2 transition duration-300 ease-in-out"
              >
                {link.name}
              </a>
            )
          )}
        </nav>

        {/* Mobile Toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-1 text-gray-800 hover:text-blue-600 transition-colors duration-200"
          aria-label="Toggle menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        id="mobile-menu"
        className={`md:hidden bg-white shadow-lg transition-all duration-300 ease-in-out overflow-hidden ${
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="flex flex-col p-4 space-y-4">
          {links.map(link =>
            link.to ? (
              <Link
                key={link.name}
                to={link.to}
                onClick={() => setOpen(false)}
                className="text-gray-700 text-base font-medium hover:text-blue-600 hover:underline underline-offset-4 decoration-2 transition duration-300"
              >
                {link.name}
              </Link>
            ) : (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-gray-700 text-base font-medium hover:text-blue-600 hover:underline underline-offset-4 decoration-2 transition duration-300"
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
