import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { Hint } from '../data/hints'

type Props = {
  hint: Hint
  showScrollArrow?: boolean
  children?: ReactNode // сама фішка, яка показується під підказкою
}

function HintSection({ hint, showScrollArrow, children }: Props) {
  return (
    <section className="hint-section">
      <motion.div
        className="hint"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      >
        <span className="hint__label">підказка</span>
        <h2 className="hint__title">{hint.title}</h2>
        <p className="hint__text">{hint.text}</p>
      </motion.div>

      {children && (
        <motion.div
          className="feature"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, delay: 0.25, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      )}

      {showScrollArrow && (
        <motion.div
          className="scroll-arrow"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span>гортай вниз</span>
          <span>↓</span>
        </motion.div>
      )}
    </section>
  )
}

export default HintSection