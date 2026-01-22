import { motion } from 'framer-motion'

interface AnimatedLineProps {
  direction?: 'horizontal' | 'vertical'
  className?: string
  delay?: number
  duration?: number
}

export default function AnimatedLine({
  direction = 'horizontal',
  className = '',
  delay = 0,
  duration = 1.5,
}: AnimatedLineProps) {
  const isHorizontal = direction === 'horizontal'

  return (
    <motion.div
      initial={{
        scaleX: isHorizontal ? 0 : 1,
        scaleY: isHorizontal ? 1 : 0,
      }}
      animate={{
        scaleX: 1,
        scaleY: 1,
      }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={`bg-primary-900 origin-left ${
        isHorizontal ? 'h-px' : 'w-px'
      } ${className}`}
      style={{
        originX: 0,
        originY: 0,
      }}
    />
  )
}
