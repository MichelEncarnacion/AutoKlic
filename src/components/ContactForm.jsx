// src/components/ContactForm.jsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { PhoneIcon, MapPinIcon, EnvelopeIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { FaWhatsapp } from 'react-icons/fa';
import { supabase } from '../lib/supabase';

const contactInfo = [
  {
    icon: PhoneIcon,
    label: 'Teléfono',
    value: '+52 221 341 1834',
    href: 'tel:+522213411834',
  },
  {
    icon: EnvelopeIcon,
    label: 'Email',
    value: 'contacto@autoklic.mx',
    href: 'mailto:contacto@autoklic.mx',
  },
  {
    icon: MapPinIcon,
    label: 'Dirección',
    value: 'Blvd. Atlixco 2305, Puebla, Pue.',
    href: 'https://maps.google.com/?q=Blvd+Atlixco+2305+Puebla',
  },
];

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm();

  async function onSubmit(data) {
    setSubmitError('');
    const { error } = await supabase.from('leads').insert([{
      nombre:      data.nombre,
      email:       data.email,
      telefono:    data.telefono || null,
      descripcion: data.mensaje,
      // Car fields not applicable for general contact — left null
      marca:       null,
      modelo:      null,
      año:         null,
      kilometraje: null,
    }]);

    if (error) {
      setSubmitError('Ocurrió un error al enviar tu mensaje. Intenta de nuevo.');
      return;
    }

    reset();
    setSubmitted(true);
  }

  const inputClass =
    'w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all';

  return (
    <section id="contacto" className="py-20 sm:py-28 bg-gray-50" data-aos="fade-up">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="flex items-center justify-center gap-2 text-red-500 text-xs font-semibold tracking-widest uppercase mb-4">
            <span className="w-6 h-px bg-red-500" />
            Estamos para ti
            <span className="w-6 h-px bg-red-500" />
          </p>
          <h2 className="font-heading text-4xl sm:text-5xl font-bold text-gray-900">
            Contáctanos
          </h2>
          <p className="text-gray-500 mt-4 max-w-md mx-auto text-sm leading-relaxed">
            ¿Tienes dudas o quieres más información? Déjanos tu mensaje y te responderemos pronto.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 items-start">

          {/* Left: Contact info */}
          <div className="lg:col-span-2 space-y-4">
            {contactInfo.map(item => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.label === 'Dirección' ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-gray-100 hover:border-red-100 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0 group-hover:bg-red-600 transition-colors duration-200">
                    <Icon className="h-5 w-5 text-red-500 group-hover:text-white transition-colors duration-200" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-0.5">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-800">{item.value}</p>
                  </div>
                </a>
              );
            })}

            <a
              href="https://wa.me/522213411834"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full bg-[#25D366] hover:bg-[#1ebe5b] text-white py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-green-400/25"
            >
              <FaWhatsapp className="h-5 w-5" />
              Escribir por WhatsApp
            </a>
          </div>

          {/* Right: Form or confirmation */}
          <div className="lg:col-span-3">
            {submitted ? (
              // ── Success state ──────────────────────────────────
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-5">
                  <CheckCircleIcon className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="font-heading text-2xl font-bold text-gray-900 mb-2">
                  ¡Mensaje enviado!
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-sm mb-6">
                  Recibimos tu mensaje. Un asesor de AutoKlic se pondrá en contacto contigo a la brevedad.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              // ── Form ───────────────────────────────────────────
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-5"
              >
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2" htmlFor="nombre">
                      Nombre *
                    </label>
                    <input
                      id="nombre"
                      type="text"
                      placeholder="Tu nombre completo"
                      className={inputClass}
                      {...register('nombre', { required: 'El nombre es requerido' })}
                    />
                    {errors.nombre && (
                      <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2" htmlFor="telefono">
                      Teléfono
                    </label>
                    <input
                      id="telefono"
                      type="tel"
                      placeholder="+52 222 000 0000"
                      className={inputClass}
                      {...register('telefono')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2" htmlFor="correo">
                    Correo electrónico *
                  </label>
                  <input
                    id="correo"
                    type="email"
                    placeholder="ejemplo@email.com"
                    className={inputClass}
                    {...register('email', {
                      required: 'El correo es requerido',
                      pattern: { value: /^\S+@\S+\.\S+$/, message: 'Correo inválido' },
                    })}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2" htmlFor="mensaje">
                    Mensaje *
                  </label>
                  <textarea
                    id="mensaje"
                    placeholder="Escribe tu mensaje aquí..."
                    className={`${inputClass} h-32 resize-none`}
                    {...register('mensaje', { required: 'El mensaje es requerido' })}
                  />
                  {errors.mensaje && (
                    <p className="text-red-500 text-xs mt-1">{errors.mensaje.message}</p>
                  )}
                </div>

                {submitError && (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    <p className="text-red-600 text-sm">{submitError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white py-3.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 hover:shadow-lg hover:shadow-red-600/20"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar mensaje'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
