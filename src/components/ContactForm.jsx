// src/components/ContactForm.jsx
export default function ContactForm() {
  return (
    <section
      id="contacto"
      className="py-20 bg-gray-50 border-t border-gray-200"
      data-aos="fade-up"
    >
      <div className="container mx-auto px-6 max-w-2xl">
        <h2 className="text-3xl font-bold text-center mb-4 text-gray-800">
          Contáctanos
        </h2>
        <p className="text-center text-gray-600 mb-10">
          ¿Tienes dudas o quieres más información? Déjanos tu mensaje y te responderemos pronto.
        </p>

        <form className="space-y-5 bg-white p-8 shadow-lg rounded-lg">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700" htmlFor="nombre">
              Nombre
            </label>
            <input
              id="nombre"
              type="text"
              placeholder="Tu nombre completo"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700" htmlFor="correo">
              Correo electrónico
            </label>
            <input
              id="correo"
              type="email"
              placeholder="ejemplo@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700" htmlFor="mensaje">
              Mensaje
            </label>
            <textarea
              id="mensaje"
              placeholder="Escribe tu mensaje aquí..."
              className="w-full px-4 py-3 border border-gray-300 rounded-md h-32 resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-md text-base font-semibold shadow-sm transition-transform transform hover:scale-105"
          >
            Enviar mensaje
          </button>
        </form>
      </div>
    </section>
  );
}
