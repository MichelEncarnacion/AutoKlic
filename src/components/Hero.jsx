export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative w-screen h-screen bg-[url('/autos/hero.webp')] bg-no-repeat bg-cover bg-center text-white"
    >
      <div className="absolute inset-0 flex flex-col justify-start items-center text-center pt-32 px-4 sm:px-6">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-white drop-shadow-lg mb-4">
          El Auto que buscas a un solo{' '}
          <span className="text-yellow-400">KLIC</span>
        </h1>
        <p className="text-lg md:text-2xl text-white/90 max-w-3xl mb-8 drop-shadow">
          Descubre nuestra selección de vehículos de alta gama. Una experiencia de conducción diseñada para quienes exigen más.
        </p>
        <a
          href="#contacto"
          className="bg-white text-gray-900 px-8 py-3 rounded-full text-base md:text-lg font-medium hover:bg-gray-100 shadow-md hover:scale-105 transform transition-all duration-300"
        >
          Solicita una asesoría personalizada
        </a>
      </div>
    </section>
  );
}
