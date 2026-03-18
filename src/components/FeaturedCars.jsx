import { Link } from 'react-router-dom';

const autos = [
  {
    modelo: 'SUSUKI S-CROSS GXL 2019',
    precio: '$279,800',
    imagen: '/autos/susuki.jpeg'
  },
  {
    modelo: 'TOYOYA AVANZA LE 2019',
    precio: '$247,800',
    imagen: '/autos/toyota.jpeg'
  },
  {
    modelo: 'AUDI A1 EGO 2023',
    precio: '$507,800',
    imagen: '/autos/audi.jpeg'
  }
];

export default function FeaturedCars() {
  return (
    <section
      id="autos"
      className="relative py-24 bg-[url('/autos/fondo_autos.jpg')] bg-cover bg-center bg-fixed"
    >
      {/* Optional overlay */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm"></div>

      <div className="relative z-10 max-w-screen-xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Autos destacados
          </h2>
          <div className="mx-auto w-24 h-1 bg-red-500 rounded-full"></div>
        </div>

        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3">
          {autos.map((auto, index) => {
            const urlModelo = auto.modelo.toLowerCase().replace(/\s+/g, '-');

            return (
              <Link
                to={`/autos/${urlModelo}`}
                key={index}
                className="bg-white rounded-xl shadow-lg ring-1 ring-gray-200 hover:ring-red-300 transition duration-300 transform hover:-translate-y-1 overflow-hidden"
              >
                <img
                  src={auto.imagen}
                  alt={auto.modelo}
                  className="h-56 w-full object-cover"
                />
                <div className="p-6 text-center">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2 tracking-wide">
                    {auto.modelo}
                  </h3>
                  <p className="inline-block bg-red-100 text-red-600 px-4 py-1 rounded-full font-bold text-sm shadow-sm">
                    {auto.precio}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Botón Ver más */}
        <div className="mt-16 text-center">
          <a
            href="#"
            className="inline-block bg-black text-white px-8 py-3 rounded-full text-base md:text-lg font-medium hover:bg-gray-900 shadow-md hover:scale-105 transform transition-all duration-300"
          >
            Ver más autos
          </a>
        </div>
      </div>
    </section>
  );
}
