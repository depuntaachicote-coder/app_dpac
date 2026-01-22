import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Instagram, Youtube, Mail, MapPin } from 'lucide-react'
import Logo from '../ui/Logo'

const socialLinks = [
  { icon: Instagram, href: 'https://instagram.com/depuntaachicote', label: 'Instagram' },
  { icon: Youtube, href: 'https://youtube.com/@depuntaachicote', label: 'YouTube' },
]

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
  </svg>
)

export default function Footer() {
  return (
    <footer className="bg-primary-900 text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Logo variant="light" size="lg" showTagline />
            <p className="mt-6 text-primary-300 max-w-md leading-relaxed">
              Potenciamos la visibilidad de tu hospedaje turístico con fotografía profesional,
              vídeo y estrategia en redes sociales. De la mano de VideoFoto360 y Pontevende.
            </p>
            <div className="mt-6 flex items-center gap-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="w-10 h-10 flex items-center justify-center border border-primary-700 text-primary-300 hover:border-white hover:text-white transition-colors"
                >
                  <social.icon size={20} />
                </motion.a>
              ))}
              <motion.a
                href="https://tiktok.com/@depuntaachicote"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1, y: -2 }}
                className="w-10 h-10 flex items-center justify-center border border-primary-700 text-primary-300 hover:border-white hover:text-white transition-colors"
              >
                <TikTokIcon />
              </motion.a>
            </div>
          </div>

          {/* Links Column */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-6">Navegación</h4>
            <ul className="space-y-4">
              <li>
                <Link to="/" className="text-primary-300 hover:text-white transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/ranking" className="text-primary-300 hover:text-white transition-colors">
                  Ranking
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-primary-300 hover:text-white transition-colors">
                  Área Cliente
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-6">Contacto</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={20} className="text-primary-400 flex-shrink-0 mt-0.5" />
                <span className="text-primary-300">
                  Pontevedra, Galicia
                  <br />
                  España
                </span>
              </li>
              <li>
                <a
                  href="mailto:info@depuntaachicote.com"
                  className="flex items-center gap-3 text-primary-300 hover:text-white transition-colors"
                >
                  <Mail size={20} className="text-primary-400 flex-shrink-0" />
                  info@depuntaachicote.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Partners */}
        <div className="mt-16 pt-8 border-t border-primary-800">
          <p className="text-center text-primary-400 text-sm mb-4">Un proyecto de</p>
          <div className="flex flex-wrap justify-center items-center gap-8">
            <div className="text-center">
              <p className="font-display text-lg text-white">VideoFoto360</p>
              <p className="text-sm text-primary-400">by Antonio Presas</p>
            </div>
            <div className="w-px h-10 bg-primary-700 hidden sm:block" />
            <div className="text-center">
              <p className="font-display text-lg text-white">Pontevende</p>
              <p className="text-sm text-primary-400">by Noel Pérez</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-primary-400 text-sm">
            © {new Date().getFullYear()} De Punta a Chicote. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
