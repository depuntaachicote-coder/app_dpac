import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import {
  Camera,
  Video,
  Share2,
  Award,
  ArrowRight,
  Star,
  MapPin,
  Play,
  Instagram,
  Youtube,
  Mail,
  Check,
  Loader2,
} from 'lucide-react'
import AnimatedLine from '../components/ui/AnimatedLine'
import PropertyCard from '../components/property/PropertyCard'
import { useProperties } from '../hooks/useProperties'
import { supabase } from '../lib/supabase'

const services = [
  {
    icon: Camera,
    title: 'Fotografía Profesional',
    description: 'Capturamos la esencia de tu hospedaje con imágenes que enamoran a primera vista.',
  },
  {
    icon: Video,
    title: 'Producción de Vídeo',
    description: 'Vídeos cinematográficos que cuentan la historia única de tu alojamiento.',
  },
  {
    icon: Share2,
    title: 'Estrategia RRSS',
    description: 'Presencia activa en Instagram, TikTok y YouTube para máximo alcance.',
  },
  {
    icon: Award,
    title: 'Ranking Exclusivo',
    description: 'Posicionamiento en nuestro ranking de los mejores hospedajes de Galicia.',
  },
]

const stats = [
  { value: '150+', label: 'Hospedajes' },
  { value: '500K+', label: 'Alcance mensual' },
  { value: '98%', label: 'Satisfacción' },
]

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
  </svg>
)

export default function Landing() {
  const heroRef = useRef<HTMLDivElement>(null)
  const servicesRef = useRef<HTMLDivElement>(null)
  const rankingRef = useRef<HTMLDivElement>(null)
  const newsletterRef = useRef<HTMLDivElement>(null)

  // Newsletter subscription state
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setSubscribeStatus('loading')
    setErrorMessage('')

    try {
      const { error } = await supabase.from('email_subscribers').insert({
        email: email.toLowerCase().trim(),
        name: name.trim() || null,
        source: 'landing_page',
        tags: ['newsletter', 'landing'],
      } as never)

      if (error) {
        if (error.code === '23505') {
          // Duplicate email
          setErrorMessage('Este email ya esta suscrito')
          setSubscribeStatus('error')
        } else {
          throw error
        }
      } else {
        setSubscribeStatus('success')
        setEmail('')
        setName('')
      }
    } catch (error) {
      console.error('Error subscribing:', error)
      setErrorMessage('Ha ocurrido un error. Intentalo de nuevo.')
      setSubscribeStatus('error')
    }
  }

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })

  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0])
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100])

  const servicesInView = useInView(servicesRef, { once: true, margin: '-100px' })
  const rankingInView = useInView(rankingRef, { once: true, margin: '-100px' })
  const newsletterInView = useInView(newsletterRef, { once: true, margin: '-100px' })

  const { properties: topProperties, loading: propertiesLoading } = useProperties({ limit: 3, featured: true })

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center">
        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.03 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 100px,
                #000 100px,
                #000 101px
              ),
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 100px,
                #000 100px,
                #000 101px
              )`,
            }}
          />
        </div>

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center"
        >
          {/* Animated Lines */}
          <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 pointer-events-none">
            <AnimatedLine direction="horizontal" className="absolute top-0 left-0 w-1/4" delay={0.5} />
            <AnimatedLine direction="horizontal" className="absolute top-0 right-0 w-1/4" delay={0.7} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-block px-4 py-2 mb-8 text-sm font-medium tracking-wider text-primary-600 border border-primary-300"
            >
              MARKETING PARA HOSPEDAJES EN GALICIA
            </motion.span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="font-display text-5xl sm:text-6xl lg:text-8xl font-bold text-primary-900 leading-tight"
          >
            <span className="block">De Punta</span>
            <span className="block mt-2">
              a{' '}
              <span className="relative">
                Chicote
                <motion.svg
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, delay: 1 }}
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 200 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <motion.path
                    d="M0 5 Q 50 0, 100 5 T 200 5"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                </motion.svg>
              </span>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-8 text-lg sm:text-xl text-primary-600 max-w-2xl mx-auto leading-relaxed"
          >
            Transformamos hospedajes en experiencias visuales inolvidables.
            <br className="hidden sm:block" />
            Fotografía, vídeo y presencia digital que genera reservas.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/ranking" className="btn-primary group flex items-center gap-2">
              Ver Ranking
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/registro" className="btn-secondary">
              Unirse ahora
            </Link>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="mt-20 flex justify-center items-center gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.2 + index * 0.1 }}
                className="text-center"
              >
                <p className="font-display text-3xl sm:text-4xl font-bold text-primary-900">
                  {stat.value}
                </p>
                <p className="text-sm text-primary-500 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-primary-400 rounded-full flex items-start justify-center p-1"
          >
            <motion.div
              animate={{ height: ['20%', '40%', '20%'] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 bg-primary-400 rounded-full"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Services Section */}
      <section ref={servicesRef} className="py-24 sm:py-32 bg-white relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-primary-200" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={servicesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="text-sm font-medium tracking-wider text-primary-500">
              NUESTROS SERVICIOS
            </span>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl font-bold text-primary-900">
              Todo lo que necesitas
            </h2>
            <p className="mt-4 text-primary-600 max-w-2xl mx-auto">
              Un paquete completo de servicios diseñado para maximizar la visibilidad
              y las reservas de tu hospedaje turístico.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 40 }}
                animate={servicesInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group p-8 border border-primary-200 hover:border-primary-900 transition-colors duration-300"
              >
                <div className="w-14 h-14 flex items-center justify-center border border-primary-200 group-hover:border-primary-900 group-hover:bg-primary-900 transition-all duration-300">
                  <service.icon
                    size={24}
                    className="text-primary-900 group-hover:text-white transition-colors"
                  />
                </div>
                <h3 className="mt-6 font-display text-xl font-semibold text-primary-900">
                  {service.title}
                </h3>
                <p className="mt-3 text-primary-600 leading-relaxed">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Ranking Preview */}
      <section ref={rankingRef} className="py-24 sm:py-32 bg-primary-50 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-primary-200" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={rankingInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-16"
          >
            <div>
              <span className="text-sm font-medium tracking-wider text-primary-500">
                TOP HOSPEDAJES
              </span>
              <h2 className="mt-4 font-display text-4xl sm:text-5xl font-bold text-primary-900">
                Ranking Galicia
              </h2>
              <p className="mt-4 text-primary-600 max-w-xl">
                Descubre los mejores hospedajes turísticos de Galicia, seleccionados
                y verificados por nuestro equipo.
              </p>
            </div>
            <Link
              to="/ranking"
              className="mt-6 lg:mt-0 inline-flex items-center gap-2 text-primary-900 font-medium hover:gap-4 transition-all"
            >
              Ver ranking completo
              <ArrowRight size={18} />
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {propertiesLoading ? (
              // Skeleton loading
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[4/3] bg-primary-200" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-primary-200 rounded w-1/4" />
                    <div className="h-6 bg-primary-200 rounded w-3/4" />
                    <div className="h-4 bg-primary-200 rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : topProperties.length > 0 ? (
              topProperties.map((property, index) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={rankingInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                >
                  <PropertyCard property={property} rank={index + 1} />
                </motion.div>
              ))
            ) : (
              // Placeholder cards when no data
              Array.from({ length: 3 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  animate={rankingInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                  className="group bg-white border border-primary-200 hover:border-primary-900 transition-colors"
                >
                  <div className="aspect-[4/3] bg-primary-100 relative overflow-hidden">
                    <div className="absolute top-4 left-4 w-10 h-10 bg-primary-900 text-white flex items-center justify-center font-display font-bold text-lg">
                      {i + 1}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Camera size={48} className="text-primary-300" />
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-sm text-primary-500 mb-2">
                      <MapPin size={14} />
                      <span>Galicia</span>
                    </div>
                    <h3 className="font-display text-xl font-semibold text-primary-900 group-hover:underline">
                      Próximamente
                    </h3>
                    <div className="mt-3 flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star
                          key={j}
                          size={16}
                          className={j < 4 ? 'fill-primary-900 text-primary-900' : 'text-primary-300'}
                        />
                      ))}
                      <span className="ml-2 text-sm text-primary-600">4.8</span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Social Media Section */}
      <section className="py-24 sm:py-32 bg-primary-900 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 border border-primary-700 -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 border border-primary-700 translate-x-1/2 translate-y-1/2" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-sm font-medium tracking-wider text-primary-400">
                SÍGUENOS
              </span>
              <h2 className="mt-4 font-display text-4xl sm:text-5xl font-bold">
                Contenido que inspira
              </h2>
              <p className="mt-6 text-primary-300 leading-relaxed">
                Descubre los mejores hospedajes de Galicia en nuestras redes sociales.
                Vídeos inmersivos, fotografías espectaculares y consejos para viajeros.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <motion.a
                  href="https://instagram.com/depuntaachicote"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-3 px-6 py-4 bg-white text-primary-900 font-medium"
                >
                  <Instagram size={20} />
                  Instagram
                </motion.a>
                <motion.a
                  href="https://tiktok.com/@depuntaachicote"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-3 px-6 py-4 border border-white text-white font-medium hover:bg-white hover:text-primary-900 transition-colors"
                >
                  <TikTokIcon className="w-5 h-5" />
                  TikTok
                </motion.a>
                <motion.a
                  href="https://youtube.com/@depuntaachicote"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-3 px-6 py-4 border border-white text-white font-medium hover:bg-white hover:text-primary-900 transition-colors"
                >
                  <Youtube size={20} />
                  YouTube
                </motion.a>
              </div>
            </div>

            {/* Video Preview Placeholder */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative aspect-video bg-primary-800 border border-primary-700 group cursor-pointer"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-20 h-20 bg-white rounded-full flex items-center justify-center"
                >
                  <Play size={32} className="text-primary-900 ml-1" />
                </motion.div>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-primary-300 text-sm">Último vídeo</p>
                <p className="text-white font-medium mt-1">Descubre los mejores hospedajes de las Rías Baixas</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-24 sm:py-32 bg-white relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-primary-200" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sm font-medium tracking-wider text-primary-500">
              NUESTRO EQUIPO
            </span>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl font-bold text-primary-900">
              Profesionales del sector
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center p-8 border border-primary-200 hover:border-primary-900 transition-colors"
            >
              <div className="w-24 h-24 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-6">
                <Video size={36} className="text-primary-900" />
              </div>
              <h3 className="font-display text-2xl font-semibold text-primary-900">
                VideoFoto360
              </h3>
              <p className="text-primary-600 mt-1">by Antonio Presas</p>
              <p className="mt-4 text-primary-600 leading-relaxed">
                Filmmaker y experto audiovisual especializado en el sector de marca e inmobiliario.
                Más de 10 años creando contenido visual de alta calidad.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="text-center p-8 border border-primary-200 hover:border-primary-900 transition-colors"
            >
              <div className="w-24 h-24 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-6">
                <Award size={36} className="text-primary-900" />
              </div>
              <h3 className="font-display text-2xl font-semibold text-primary-900">Pontevende</h3>
              <p className="text-primary-600 mt-1">by Noel Pérez</p>
              <p className="mt-4 text-primary-600 leading-relaxed">
                Copropietario de Pontevende, influencer y autoridad reconocida en el sector
                inmobiliario de la provincia de Pontevedra.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section ref={newsletterRef} className="py-24 sm:py-32 bg-primary-900 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-80 h-80 border border-primary-700 translate-x-1/2 -translate-y-1/2 opacity-50" />
        <div className="absolute bottom-0 left-0 w-64 h-64 border border-primary-700 -translate-x-1/2 translate-y-1/2 opacity-50" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={newsletterInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 border border-primary-600 mb-8">
              <Mail size={28} className="text-primary-300" />
            </div>

            <h2 className="font-display text-4xl sm:text-5xl font-bold">
              Mantente informado
            </h2>
            <p className="mt-6 text-lg text-primary-300 max-w-2xl mx-auto">
              Suscribete a nuestra newsletter para recibir las ultimas novedades,
              los mejores hospedajes y consejos exclusivos para tu alojamiento turistico.
            </p>

            {subscribeStatus === 'success' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-10 p-6 bg-green-500/20 border border-green-500/30 max-w-md mx-auto"
              >
                <div className="flex items-center justify-center gap-3">
                  <Check size={24} className="text-green-400" />
                  <span className="text-lg font-medium">¡Gracias por suscribirte!</span>
                </div>
                <p className="text-primary-300 mt-2 text-sm">
                  Pronto recibiras noticias nuestras.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubscribe} className="mt-10 max-w-xl mx-auto">
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                    className="flex-1 px-6 py-4 bg-primary-800 border border-primary-700 text-white placeholder-primary-400 focus:outline-none focus:border-white transition-colors"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Tu email"
                    required
                    className="flex-1 px-6 py-4 bg-primary-800 border border-primary-700 text-white placeholder-primary-400 focus:outline-none focus:border-white transition-colors"
                  />
                </div>

                {errorMessage && (
                  <p className="mt-3 text-red-400 text-sm">{errorMessage}</p>
                )}

                <motion.button
                  type="submit"
                  disabled={subscribeStatus === 'loading' || !email}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-4 w-full sm:w-auto px-10 py-4 bg-white text-primary-900 font-medium hover:bg-primary-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
                >
                  {subscribeStatus === 'loading' ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Suscribiendo...
                    </>
                  ) : (
                    <>
                      <Mail size={20} />
                      Suscribirme
                    </>
                  )}
                </motion.button>

                <p className="mt-6 text-sm text-primary-400">
                  Al suscribirte aceptas recibir comunicaciones de De Punta a Chicote.
                  Puedes darte de baja en cualquier momento.
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 sm:py-32 bg-primary-50 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-primary-200" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-900">
              ¿Listo para destacar?
            </h2>
            <p className="mt-6 text-lg text-primary-600 max-w-2xl mx-auto">
              Únete a los mejores hospedajes de Galicia y transforma tu presencia digital
              con nuestro paquete completo de marketing.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/registro" className="btn-primary text-lg">
                Solicitar información
              </Link>
              <Link to="/ranking" className="btn-secondary text-lg">
                Ver ranking
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
