import { useEffect, useState } from 'react'
import { config } from '../data/config'
import { plural } from '../utils/plural'

const HOUR_FORMS: [string, string, string] = ['година', 'години', 'годин']

// Якщо назва часового поясу невірна, повернемо undefined,
// і годинник візьме пояс пристрою замість того, щоб покласти весь сайт
const validZone = (tz: string) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return tz
  } catch {
    return undefined
  }
}

const myZone = validZone(config.me.timeZone)
const herZone = validZone(config.her.timeZone)

const formatTime = (date: Date, timeZone?: string) =>
  new Intl.DateTimeFormat('uk-UA', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(date)

// Зміщення часового поясу відносно UTC у хвилинах
const tzOffsetMinutes = (date: Date, timeZone?: string) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(date)

  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value)

  const asUTC = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  )
  const dateSec = Math.floor(date.getTime() / 1000) * 1000
  return Math.round((asUTC - dateSec) / 60000)
}

const formatDiff = (hours: number) => {
  if (hours === 0) return 'Ми в одному часовому поясі, а небо в нас одне'
  const amount = Number.isInteger(hours)
    ? `${hours} ${plural(hours, HOUR_FORMS)}`
    : `${hours.toFixed(1)} год`
  return `Між нами ${amount}, а небо в нас одне`
}

function Clocks() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const diffHours =
    Math.abs(tzOffsetMinutes(now, myZone) - tzOffsetMinutes(now, herZone)) / 60

  return (
    <>
      <div className="clocks">
        <div className="card">
          <div className="card__value card__value--time">
            {formatTime(now, myZone)}
          </div>
          <div className="card__label">{config.me.city}, у мене</div>
        </div>

        <div className="card">
          <div className="card__value card__value--time">
            {formatTime(now, herZone)}
          </div>
          <div className="card__label">{config.her.city}, у тебе</div>
        </div>
      </div>

      <p className="clocks-note">{formatDiff(diffHours)}</p>
    </>
  )
}

export default Clocks