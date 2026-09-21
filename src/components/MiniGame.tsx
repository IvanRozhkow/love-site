import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'

type Props = {
  theme: 'sky' | 'heart'
  onClose: () => void
}

type FallingItem = {
  id: number
  left: number
  delay: number
  duration: number
  rotation: number
}

const GAME_TIME = 20
const ITEM_COUNT = 18

function MiniGame({ theme, onClose }: Props) {
  const [timeLeft, setTimeLeft] = useState(GAME_TIME)
  const [score, setScore] = useState(0)
  const [items, setItems] = useState<FallingItem[]>(() =>
    Array.from({ length: ITEM_COUNT }, (_, id) => ({
      id,
      left: 5 + Math.random() * 90,
      delay: Math.random() * 8,
      duration: 4 + Math.random() * 4,
      rotation: -25 + Math.random() * 50,
    })),
  )

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft((value) => {
        if (value <= 1) {
          window.clearInterval(timer)
          return 0
        }
        return value - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])

  const collect = (id: number) => {
    setScore((value) => value + 1)
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              left: 5 + Math.random() * 90,
              delay: 0,
              duration: 4 + Math.random() * 4,
              rotation: -25 + Math.random() * 50,
            }
          : item,
      ),
    )
  }

  const finished = timeLeft === 0
  const symbol = theme === 'sky' ? '✦' : '♥'

  return (
    <section
      className={`secret-card mini-game mini-game--${theme}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mini-game-title"
      onClick={(event) => event.stopPropagation()}
    >
      {finished ? (
        <>
          <span className="secret-card__eyebrow">гра завершена</span>
          <h2 id="mini-game-title">Кошеня вже чекає на тебе</h2>
          <div className="kitten-frame">
            <img
              src={`${import.meta.env.BASE_URL}images/kitten.png`}
              alt="Намальоване кошеня"
              onError={(event) => {
                event.currentTarget.hidden = true
              }}
            />
          </div>
          <p>Ти зібрала {score} {theme === 'sky' ? 'зірочок' : 'сердечок'}.</p>
          <button type="button" className="map-button" onClick={onClose}>
            Повернутися до неба
          </button>
        </>
      ) : (
        <>
          <div className="mini-game__topline">
            <span>Збери {theme === 'sky' ? 'зірочки' : 'сердечка'}</span>
            <span>{timeLeft} с · {score}</span>
          </div>
          <h2 id="mini-game-title">Маленька гра</h2>
          <p className="mini-game__hint">Торкайся того, що падає</p>
          <div className="mini-game__field">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="mini-game__item"
                style={{
                  left: `${item.left}%`,
                  animationDelay: `${item.delay}s`,
                  animationDuration: `${item.duration}s`,
                  '--item-rotation': `${item.rotation}deg`,
                } as CSSProperties}
                aria-label={theme === 'sky' ? 'Зібрати зірочку' : 'Зібрати сердечко'}
                onClick={() => collect(item.id)}
              >
                {symbol}
              </button>
            ))}
          </div>
          <button type="button" className="map-button" onClick={onClose}>
            Вийти з гри
          </button>
        </>
      )}
    </section>
  )
}

export default MiniGame
