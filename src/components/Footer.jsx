// src/components/Footer.jsx
import { FaFacebookF, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { ChevronUpIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

const socialLinks = [
  {
    icon: FaFacebookF,
    href: 'https://www.facebook.com/people/Autoklic/100094759145145/',
    label: 'Facebook',
  },
  {
    icon: FaInstagram,
    href: 'https://www.instagram.com/autoklicmx/?igshid=OGQ5ZDc2ODk2ZA%3D%3D',
    label: 'Instagram',
  },
  {
    icon: FaWhatsapp,
    href: 'https://wa.me/522201895426',
    label: 'WhatsApp',
  },
];

const quickLinks = [
  { name: 'Inicio', href: '/#inicio' },
  { name: 'Vehículos', href: '/#autos' },
  { name: 'Proceso', href: '/#proceso' },
  { name: 'Contacto', href: '/#contacto' },
];

const pageLinks = [
  { name: 'Catálogo', to: '/catalogo' },
  { name: 'Vende tu Auto', to: '/vende-tu-auto' },
];

export default function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <img src={logo} alt="AutoKlic" className="h-10 w-auto" />
              <span className="font-heading text-xl font-bold text-white">AutoKlic</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Compra o vende tu vehículo con seguridad, rapidez y confianza en Puebla, México.
            </p>
            {/* Social */}
            <div className="flex gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-lg bg-white/5 hover:bg-red-600 flex items-center justify-center transition-colors duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">
              Navegación
            </h3>
            <ul className="space-y-3">
              {quickLinks.map(link => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
              {pageLinks.map(link => (
                <li key={link.name}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">
              Contacto
            </h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <a href="tel:+522201895426" className="hover:text-white transition-colors">
                  +52 220 189 5426
                </a>
              </li>
              <li>
                <a href="mailto:contacto@autoklic.mx" className="hover:text-white transition-colors">
                  contacto@autoklic.mx
                </a>
              </li>
              <li className="leading-relaxed">
                Blvd. Atlixco 2305, Belisario Domínguez, 72180 Puebla, Pue.
              </li>
            </ul>
          </div>

          {/* Map */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">
              Ubicación
            </h3>
            <div className="rounded-xl overflow-hidden border border-white/8">
              <iframe
                title="Ubicación AutoKlic"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3762.7230618961496!2d-98.2339076!3d19.0494706!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85cfc7287a674523%3A0x6df6af1a4eb8820a!2sBlvrd%20Atlixco%202305%2C%20Belisario%20Dom%C3%ADnguez%2C%2072180%20Heroica%20Puebla%20de%20Zaragoza%2C%20Pue.%2C%20M%C3%A9xico!5e0!3m2!1ses-419!2smx!4v1721953928313!5m2!1ses-419!2smx"
                width="100%"
                height="160"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
              />
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} AutoKlic. Todos los derechos reservados.</p>
          <button
            onClick={scrollToTop}
            aria-label="Volver arriba"
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors duration-200"
          >
            <span className="text-xs uppercase tracking-wider">Volver arriba</span>
            <ChevronUpIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
}
