import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { letters } from '../data/letters'
import type { Letter } from '../data/letters'

const parseDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Лист замкнений, якщо є дата відкриття і вона ще не настала
const isLocked = (letter: Letter) =>
  letter.unlockOn ? new Date() < parseDate(letter.unlockOn) : false

const formatDate = (iso: string) =>
  parseDate(iso).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

const accentStyle = (letter: Letter) =>
  ({ '--accent': letter.accent ?? 'var(--lilac)' }) as CSSProperties

function Envelope() {
  return (
    <svg
      className="letter-card__icon"
      viewBox="0 0 64 48"
      width="56"
      height="42"
      aria-hidden="true"
    >
      <rect
        x="2"
        y="2"
        width="60"
        height="44"
        rx="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <path
        d="M4 6 L32 28 L60 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Letters() {
  const [openId, setOpenId] = useState<string | null>(null)
  const [read, setRead] = useState<string[]>([])

  const current = letters.find((l) => l.id === openId) ?? null

  // Поки лист відкритий, сторінка позаду не гортається
  useEffect(() => {
    if (!openId) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [openId])

  const open = (letter: Letter) => {
    if (isLocked(letter)) return
    setOpenId(letter.id)
    setRead((r) => (r.includes(letter.id) ? r : [...r, letter.id]))
  }

  const close = () => setOpenId(null)

  return (
    <>
      <div className="letters">
        {letters.map((letter) => {
          const locked = isLocked(letter)
          const isRead = read.includes(letter.id)
          return (
            <motion.button
              key={letter.id}
              type="button"
              className={
                'letter-card' +
                (locked ? ' letter-card--locked' : '') +
                (isRead ? ' letter-card--read' : '')
              }
              style={accentStyle(letter)}
              whileTap={locked ? undefined : { scale: 0.96 }}
              disabled={locked}
              onClick={() => open(letter)}
            >
              <Envelope />
              <span className="letter-card__eyebrow">Відкрий, коли</span>
              <span className="letter-card__title">{letter.when}</span>
              {locked && letter.unlockOn && (
                <span className="letter-card__note">
                  🔒 відкриється {formatDate(letter.unlockOn)}
                </span>
              )}
              {isRead && <span className="letter-card__note">✓ прочитано</span>}
            </motion.button>
          )
        })}
      </div>

      {/* Лист виводимо окремо від сторінки (portal), щоб він накривав увесь екран */}
      {createPortal(
        <AnimatePresence>
          {current && (
            <motion.div
              key="overlay"
              className="letter-overlay"
              data-no-star
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={close}
            >
              <motion.article
                className="letter-paper"
                style={accentStyle(current)}
                initial={{ opacity: 0, y: 60, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 220, damping: 24 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="letter-paper__eyebrow">
                  Відкрий, коли {current.when}
                </div>

                {/* Абзаци з'являються по одному */}
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={{
                    show: {
                      transition: { staggerChildren: 0.45, delayChildren: 0.4 },
                    },
                  }}
                >
                  {current.text.split('\n\n').map((paragraph, i) => (
                    <motion.p
                      key={i}
                      variants={{
                        hidden: { opacity: 0, y: 12 },
                        show: { opacity: 1, y: 0 },
                      }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                    >
                      {paragraph}
                    </motion.p>
                  ))}
                </motion.div>

                <button type="button" className="map-button" onClick={close}>
                  Закрити
                </button>
              </motion.article>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}

export default Letters