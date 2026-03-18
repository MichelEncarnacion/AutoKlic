import {
    PhoneIcon,
    EyeIcon,
    CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

const pasos = [
    {
        titulo: '1. Contáctanos',
        descripcion: 'Déjanos tus datos y te contactaremos en minutos.',
        icono: PhoneIcon
    },
    {
        titulo: '2. Revisión',
        descripcion: 'Inspeccionamos el vehículo o buscamos el que te interesa.',
        icono: EyeIcon
    },
    {
        titulo: '3. Compra/Venta',
        descripcion: 'Finalizamos el trato de forma segura y rápida.',
        icono: CurrencyDollarIcon
    }
];

export default function Process() {
    useEffect(() => {
        AOS.init({ duration: 800, once: true });
    }, []);

    return (
        <section id="proceso" className="py-24 bg-gray-50">
            <div className="container mx-auto px-6">
                <h2 className="text-4xl font-bold text-center mb-16 text-gray-900" data-aos="fade-up">
                    ¿Cómo funciona?
                </h2>

                <div className="relative flex flex-col md:flex-row md:items-start items-center md:justify-between gap-14 md:gap-10 max-w-6xl mx-auto">

                    {/* Línea vertical en móvil, horizontal en desktop */}
                    <div className="absolute md:top-8 md:left-0 md:w-full md:h-0.5 top-0 left-1/2 w-0.5 h-full bg-gray-300 z-0 transform md:translate-y-0 -translate-x-1/2"></div>

                    {pasos.map((paso, i) => {
                        const Icon = paso.icono;
                        return (
                            <div
                                key={i}
                                className="relative z-10 flex flex-col items-center text-center w-full max-w-xs"
                                data-aos="fade-up"
                                data-aos-delay={i * 150}
                            >
                                <div className="bg-white border-4 border-red-500 rounded-full p-4 mb-4 shadow-md">
                                    <Icon className="h-8 w-8 text-red-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800">{paso.titulo}</h3>
                                <p className="text-sm text-gray-600 mt-2">{paso.descripcion}</p>
                            </div>
                        );
                    })}
                </div>

                {/* CTA Final */}
                <div className="mt-20 text-center" data-aos="zoom-in-up">
                    <a
                        href="#contacto"
                        className="inline-block bg-red-600 text-white px-10 py-3 rounded-full text-lg font-semibold shadow-lg hover:bg-red-700 transition hover:scale-105"
                    >
                        Comienza ahora
                    </a>
                </div>
            </div>
        </section>
    );
}
