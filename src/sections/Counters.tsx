import { useEffect, useRef, useState } from 'react'
import { animate, useInView } from 'framer-motion'
import { config } from '../data/config'
import { plural } from '../utils/plural'

const DAY = 24 * 60 * 60 * 1000
const DAYS_FORMS: [string, string, string] = ['день', 'дні', 'днів']

// 'РРРР-ММ-ДД' -> дата о 00:00 за місцевим часом
const parseDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const daysBetween = (from: Date, to: Date) =>
  Math.round((to.getTime() - from.getTime()) / DAY)

// Число, яке плавно «набігає» від 0, коли картка з'являється на екрані
function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const [n, setN] = useState(0)

  useEffect(() => {
    if (!inView) return
    const controls = animate(0, value, {
      duration: 2,
      ease: 'easeOut',
      onUpdate: (v) => setN(Math.round(v)),
    })
    return () => controls.stop()
  }, [inView, value])

  return <span ref={ref}>{n}</span>
}

function Counters() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const together = Math.max(
    0,
    daysBetween(parseDate(config.togetherSince), today),
  )
  const untilMeeting = daysBetween(today, parseDate(config.nextMeeting))

  return (
    <div className="counters">
      <div className="card">
        <div className="card__value">
          <AnimatedNumber value={together} />
        </div>
        <div className="card__label">
          {plural(together, DAYS_FORMS)} ми разом
        </div>
      </div>

      <div className="card">
        {untilMeeting > 0 ? (
          <>
            <div className="card__value">
              <AnimatedNumber value={untilMeeting} />
            </div>
            <div className="card__label">
              {plural(untilMeeting, DAYS_FORMS)} до зустрічі
            </div>
          </>
        ) : (
          <>
            <div className="card__value">
              {untilMeeting === 0 ? 'Сьогодні!' : 'Скоро'}
            </div>
            <div className="card__label">
              {untilMeeting === 0
                ? 'ми нарешті зустрінемося'
                : 'ми знову побачимось'}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Counters