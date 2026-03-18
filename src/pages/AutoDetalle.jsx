import { useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';

const autos = [
    {
        modelo: 'SUSUKI S-CROSS GXL 2019',
        precio: '$279,800',
        imagenes: ['/autos/susuki.jpeg', '/autos/susuki2.jpeg', '/autos/susuki3.jpeg'],
        descripcion: 'SUV versátil con gran rendimiento y seguridad.',
        ficha: {
            año: '2019', motor: '1.6L', transmision: 'Automática', combustible: 'Gasolina',
            color: 'Blanco metálico', puertas: 5, traccion: 'FWD', kilometraje: '72,500 km',
            aire: 'Sí', infoentretenimiento: 'Pantalla táctil + Bluetooth'
        }
    },
    {
        modelo: 'TOYOYA AVANZA LE 2019',
        precio: '$247,800',
        imagenes: ['/autos/toyota.jpeg', '/autos/toyota2.jpeg', '/autos/toyota3.jpeg'],
        descripcion: 'Vehículo familiar con amplio espacio y economía.',
        ficha: {
            año: '2019', motor: '1.5L', transmision: 'Manual', combustible: 'Gasolina',
            color: 'Blanco', puertas: 5, traccion: 'RWD', kilometraje: '89,200 km',
            aire: 'Sí', infoentretenimiento: 'Radio + entrada auxiliar'
        }
    },
    {
        modelo: 'AUDI A1 EGO 2023',
        precio: '$507,800',
        imagenes: ['/autos/audi.jpeg', '/autos/audi2.jpeg', '/autos/audi3.jpeg'],
        descripcion: 'Compacto de lujo con tecnología avanzada y diseño moderno.',
        ficha: {
            año: '2023', motor: '1.0L Turbo', transmision: 'Automática', combustible: 'Gasolina',
            color: 'Negro', puertas: 3, traccion: 'FWD', kilometraje: '15,300 km',
            aire: 'Climatronic', infoentretenimiento: 'Audi Virtual Cockpit + Apple CarPlay'
        }
    }
];

export default function AutoDetalle() {
    const { modelo } = useParams();
    const auto = autos.find(
        a => a.modelo.toLowerCase().replace(/\s+/g, '-') === modelo
    );

    if (!auto) return <div className="p-8 text-center">Auto no encontrado</div>;

    return (
        <div className="w-screen min-h-screen bg-white px-6 py-10 overflow-x-hidden">
            <div className="flex flex-col lg:flex-row gap-10 w-full max-w-[1920px] mx-auto">

                {/* CARRUSEL DE IMÁGENES */}
                <div className="w-full lg:w-3/5">
                    <Carousel
                        showArrows={true}
                        showThumbs={true}
                        infiniteLoop={true}
                        autoPlay={true}
                        interval={5000}
                        showStatus={false}
                        swipeable={true}
                        emulateTouch={true}
                        className="rounded shadow-md"
                    >
                        {auto.imagenes.map((img, i) => (
                            <div key={i}>
                                <img src={img} alt={`${auto.modelo} ${i + 1}`} className="object-cover" />
                            </div>
                        ))}
                    </Carousel>
                </div>

                {/* INFORMACIÓN DEL AUTO */}
                <div className="flex-1 lg:w-2/5">
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">{auto.modelo}</h1>
                    <p className="text-green-600 text-xl font-semibold mb-2">{auto.precio}</p>
                    <p className="text-gray-700 mb-5">{auto.descripcion}</p>

                    <hr className="mb-5 border-gray-300" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-800 mb-10">
                        <p><strong>Año:</strong> {auto.ficha.año}</p>
                        <p><strong>Motor:</strong> {auto.ficha.motor}</p>
                        <p><strong>Transmisión:</strong> {auto.ficha.transmision}</p>
                        <p><strong>Combustible:</strong> {auto.ficha.combustible}</p>
                        <p><strong>Color:</strong> {auto.ficha.color}</p>
                        <p><strong>Puertas:</strong> {auto.ficha.puertas}</p>
                        <p><strong>Tracción:</strong> {auto.ficha.traccion}</p>
                        <p><strong>Kilometraje:</strong> {auto.ficha.kilometraje}</p>
                        <p><strong>Aire:</strong> {auto.ficha.aire}</p>
                        <p><strong>Infoentretenimiento:</strong> {auto.ficha.infoentretenimiento}</p>
                    </div>

                    {/* BOTONES */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Botón de volver */}
                        <Link
                            to="/#autos"
                            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-gray-700 to-gray-900 text-white px-6 py-2 rounded-full text-sm md:text-base font-medium shadow-md hover:shadow-lg hover:from-gray-800 hover:to-black transition-all duration-300 transform hover:scale-105"
                        >
                            <ArrowLeftIcon className="h-5 w-5" />
                            Volver a autos
                        </Link>

                        {/* Botón de interés */}
                        <a
                            href="/#contacto"
                            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-700 text-white px-6 py-2 rounded-full text-sm md:text-base font-semibold shadow-md hover:shadow-lg hover:from-red-600 hover:to-red-800 transition-all duration-300 transform hover:scale-105"
                        >
                            ❤️ Me interesa
                        </a>
                    </div>

                </div>
            </div>
        </div>
    );
}
