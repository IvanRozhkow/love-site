import { useState } from 'react'
import StarField from './components/StarField'
import MusicButton from './components/MusicButton'
import SecretQuiz from './components/SecretQuiz'
import MiniGame from './components/MiniGame'
import HintSection from './sections/HintSection'
import Counters from './sections/Counters'
import Clocks from './sections/Clocks'
import RouteMap from './sections/RouteMap'
import Letters from './sections/Letters'
import { hints } from './data/hints'

function App() {
  const [isSecretOpen, setIsSecretOpen] = useState(false)
  const [isGameOpen, setIsGameOpen] = useState(false)
  const [secretPosition] = useState(() => ({
    left: 10 + Math.random() * 80,
    top: 16 + Math.random() * 68,
  }))
  const [theme, setTheme] = useState<'sky' | 'heart'>(() => {
    return localStorage.getItem('sky-theme') === 'heart' ? 'heart' : 'sky'
  })

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === 'sky' ? 'heart' : 'sky'
      localStorage.setItem('sky-theme', next)
      return next
    })
  }

  return (
    <div className={`app app--${theme}`}>
      <StarField theme={theme} />
      <div className="heartfield" aria-hidden="true">
        <span>♥</span>
        <span>♥</span>
        <span>♥</span>
        <span>♥</span>
        <span>♥</span>
        <span>♥</span>
        <span>♥</span>
        <span>♥</span>
        <span>♥</span>
        <span>♥</span>
        <span>♥</span>
        <span>♥</span>
        <span>♥</span>
        <span>♥</span>
        
      </div>
      <header className="theme-header">
        <MusicButton />
        <button
          type="button"
          className="theme-toggle"
          aria-label={`Увімкнути ${theme === 'sky' ? 'тему сердець' : 'зоряну тему'}`}
          aria-pressed={theme === 'heart'}
          onClick={toggleTheme}
        >
          <span className="theme-toggle__icon" aria-hidden="true">✦</span>
          <span className="theme-toggle__track" aria-hidden="true">
            <span className="theme-toggle__thumb" />
          </span>
          <span className="theme-toggle__icon" aria-hidden="true">♥</span>
        </button>
      </header>
      <button
        type="button"
        className={`secret-heart secret-heart--${theme}`}
        data-no-star
        style={{ left: `${secretPosition.left}%`, top: `${secretPosition.top}%` }}
        aria-label="Відкрити приховане послання"
        title="Тут щось заховано"
        onClick={() => setIsSecretOpen(true)}
      >
        <span aria-hidden="true">{theme === 'sky' ? '✦' : '♥'}</span>
      </button>
      {isSecretOpen && (
        <div
          className="secret-overlay"
          role="presentation"
          onClick={() => setIsSecretOpen(false)}
        >
          <section
            className="secret-card__shell"
          >
            <SecretQuiz
              onClose={() => setIsSecretOpen(false)}
              onStartGame={() => {
                setIsSecretOpen(false)
                setIsGameOpen(true)
              }}
            />
          </section>
        </div>
      )}
      {isGameOpen && (
        <div
          className="secret-overlay"
          role="presentation"
          onClick={() => setIsGameOpen(false)}
        >
          <MiniGame theme={theme} onClose={() => setIsGameOpen(false)} />
        </div>
      )}
      <main>
        <HintSection hint={hints.sky} showScrollArrow />
        <HintSection hint={hints.wish} showScrollArrow />
        <HintSection hint={hints.tilt} showScrollArrow />
        <HintSection hint={hints.counters} showScrollArrow>
          <Counters />
        </HintSection>
        <HintSection hint={hints.clocks} showScrollArrow>
          <Clocks />
        </HintSection>
        <HintSection hint={hints.map} showScrollArrow>
          <RouteMap />
        </HintSection>
        <HintSection hint={hints.letters}>
          <Letters />
        </HintSection>
      </main>
    </div>
  )
}

export default App