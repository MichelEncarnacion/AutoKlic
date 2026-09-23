import { FaWhatsapp } from 'react-icons/fa'
import { whatsappUrl } from '../lib/contact'

export default function WhatsAppButton() {
  return (
    <a
      href={whatsappUrl('Hola, me interesa un auto de AutoKlic.')}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] hover:bg-[#1ebe5b] text-white rounded-full shadow-lg hover:shadow-green-400/40 hover:scale-110 transition-all duration-200"
    >
      <FaWhatsapp className="w-7 h-7" />
    </a>
  )
}
