import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'dark' | 'light'
  showTagline?: boolean
}

export default function Logo({ size = 'md', variant = 'dark', showTagline = false }: LogoProps) {
  const sizes = {
    sm: { text: 'text-lg', tagline: 'text-xs' },
    md: { text: 'text-xl', tagline: 'text-sm' },
    lg: { text: 'text-3xl', tagline: 'text-base' },
  }

  const colors = {
    dark: { primary: 'text-primary-900', secondary: 'text-primary-600' },
    light: { primary: 'text-white', secondary: 'text-primary-300' },
  }

  return (
    <Link to="/" className="inline-block">
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col"
      >
        <div className={`font-display font-semibold ${sizes[size].text} ${colors[variant].primary} leading-tight`}>
          <span>De Punta</span>
          <span className="block">a Chicote</span>
        </div>
        {showTagline && (
          <span className={`${sizes[size].tagline} ${colors[variant].secondary} mt-1`}>
            Marketing para hospedajes
          </span>
        )}
      </motion.div>
    </Link>
  )
}
