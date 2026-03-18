// src/components/Footer.jsx
import { FaFacebookF, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { ChevronUpIcon } from '@heroicons/react/24/outline';
import logo from '../assets/logo.png';

export default function Footer() {
    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    return (
        <footer className="bg-black text-white pt-14 pb-8" data-aos="fade-up">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">

                {/* Logo + Marca */}
                <div>
                    <div className="flex items-center space-x-3 mb-4">
                        <img src={logo} alt="AutoKlic" className="h-10 md:h-12 w-auto" />
                        <span className="text-xl font-semibold">AutoKlic</span>
                    </div>
                    <p className="text-gray-400 text-sm">
                        Compra o vende tu vehículo con seguridad, rapidez y confianza.
                    </p>
                </div>

                {/* Mapa */}
                <div>
                    <h3 className="text-lg font-semibold mb-2">Nuestra ubicación</h3>
                    <div className="rounded-md overflow-hidden shadow-md border border-gray-700">
                        <iframe
                            title="Ubicación AutoKlic"
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3762.7230618961496!2d-98.2339076!3d19.0494706!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85cfc7287a674523%3A0x6df6af1a4eb8820a!2sBlvrd%20Atlixco%202305%2C%20Belisario%20Dom%C3%ADnguez%2C%2072180%20Heroica%20Puebla%20de%20Zaragoza%2C%20Pue.%2C%20M%C3%A9xico!5e0!3m2!1ses-419!2smx!4v1721953928313!5m2!1ses-419!2smx"
                            width="100%"
                            height="200"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                        ></iframe>
                    </div>
                </div>

                {/* Navegación + Redes */}
                <div className="flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Enlaces rápidos</h3>
                        <ul className="text-sm text-gray-400 space-y-1">
                            <li><a href="#inicio" className="hover:text-white transition">Inicio</a></li>
                            <li><a href="#autos" className="hover:text-white transition">Vehículos</a></li>
                            <li><a href="#proceso" className="hover:text-white transition">Proceso</a></li>
                            <li><a href="#contacto" className="hover:text-white transition">Contacto</a></li>
                        </ul>
                    </div>

                    {/* Redes */}
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-2">Síguenos</h3>
                        <div className="flex space-x-4">
                            <a href="https://www.facebook.com/people/Autoklic/100094759145145/" target="_blank" rel="noopener noreferrer" className="hover:text-red-500">
                                <FaFacebookF className="w-5 h-5" />
                            </a>
                            <a href="https://www.instagram.com/autoklicmx/?igshid=OGQ5ZDc2ODk2ZA%3D%3D" target="_blank" rel="noopener noreferrer" className="hover:text-red-500">
                                <FaInstagram className="w-5 h-5" />
                            </a>
                            <a href="https://wa.me/522201895426" target="_blank" rel="noopener noreferrer" className="hover:text-red-500">
                                <FaWhatsapp className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Línea inferior + Botón subir */}
            <div className="mt-10 border-t border-gray-700 pt-4 flex items-center justify-between px-6 text-sm text-gray-400">
                <p>&copy; {new Date().getFullYear()} AutoKlic. Todos los derechos reservados.</p>
                <button
                    onClick={scrollToTop}
                    aria-label="Volver arriba"
                    className="text-white hover:text-red-500 transition"
                >
                    <ChevronUpIcon className="w-5 h-5" />
                </button>
            </div>
        </footer>
    );
}
