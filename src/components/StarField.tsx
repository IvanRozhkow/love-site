import { useEffect, useRef } from 'react'
import { CONSTELLATION_POINTS } from '../data/constellation'

type Star = {
  x: number // частка ширини екрана
  y: number // частка висоти екрана
  size: number
  phase: number
  speed: number
  color: string
  shape: 'dot' | 'sparkle' | 'star5'
  glow: boolean
  alphaMin: number
  depth: number // наскільки сильно зірка зсувається при нахилі (0..1)
}

type Shooter = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  len: number
  color: string
}

// Зірка, яку запалили дотиком
type TapStar = {
  x: number
  y: number
  size: number
  born: number
  phase: number
  speed: number
  color: string
  shape: 'sparkle' | 'star5' | 'heart'
}

// Спалах у місці дотику
type Burst = {
  x: number
  y: number
  born: number
  color: string
}

const DUST_COUNT = 130
const SMALL_COUNT = 70
const BIG_COUNT = 10
const MAX_TAP_STARS = 30
const BURST_TIME = 0.8

// Нахил планшета
const TILT_RANGE = 20 // на скільки градусів треба нахилити для повного зсуву
const MAX_SHIFT = 30 // максимальний зсув найближчих зірок у пікселях
const TILT_DIRECTION = -1 // -1: небо їде проти нахилу, 1: слідом за нахилом

const NATURAL = ['#ffffff', '#ffffff', '#fff4d6', '#cfe0ff', '#ffe6cc']
const SHOOTER_COLORS = ['#ffffff', '#dbe8ff', '#fff1d6']
const HEART_COLORS = ['#ff6f8b', '#ff9bad', '#ffd0d8', '#f04d72']

const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]

// Плавне «вистрибування» з невеликим перельотом
const easeOutBack = (x: number) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
}

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v))

// Зірки трохи виходять за краї екрана, щоб при зсуві не було порожніх смуг
const spread = () => -0.04 + Math.random() * 1.08

function StarField({ theme = 'sky' }: { theme?: 'sky' | 'heart' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let dpr = 1
    let frameId = 0
    let lastTime = 0
    let spawnIn = 1
    const shooters: Shooter[] = []
    const tapStars: TapStar[] = []
    const bursts: Burst[] = []
    let constellationProgress = 0

    // ---- Нахил ----
    let hasTilt = false // чи приходять дані від датчика
    let tiltX = 0 // > 0: права сторона екрана опускається
    let tiltY = 0 // > 0: нижня сторона екрана опускається
    let baseX = 0 // «нейтральне» положення, що повільно наздоганяє реальне
    let baseY = 0
    let baseInit = false
    let offsetX = 0 // поточний згладжений зсув (-1..1)
    let offsetY = 0
    let lastAngle = screen.orientation?.angle ?? 0
    let orientationPermissionRequested = false

    const requestOrientationPermission = () => {
      if (orientationPermissionRequested) return
      orientationPermissionRequested = true

      const OrientationEvent = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
        requestPermission?: () => Promise<'granted' | 'denied'>
      }
      if (typeof OrientationEvent.requestPermission !== 'function') return

      void OrientationEvent.requestPermission().catch(() => {
        orientationPermissionRequested = false
      })
    }

    const onOrientation = (e: DeviceOrientationEvent) => {
      // на комп'ютері без датчиків приходять порожні значення
      if (e.beta === null || e.gamma === null) return
      const angle = screen.orientation?.angle ?? 0
      const b = e.beta
      const g = e.gamma
      // Перераховуємо осі датчика в осі екрана залежно від повороту планшета
      switch (angle) {
        case 90:
          tiltX = b
          tiltY = -g
          break
        case 180:
          tiltX = -g
          tiltY = -b
          break
        case 270:
          tiltX = -b
          tiltY = g
          break
        default:
          tiltX = g
          tiltY = b
      }
      hasTilt = true
    }

    const dust: Star[] = Array.from({ length: DUST_COUNT }, () => ({
      x: spread(),
      y: spread(),
      size: 0.7 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2,
      speed: 0.6 + Math.random(),
      color: pick(NATURAL),
      shape: 'dot',
      glow: false,
      alphaMin: 0.12,
      depth: 0.25,
    }))

    const small: Star[] = Array.from({ length: SMALL_COUNT }, () => ({
      x: spread(),
      y: spread(),
      size: 3.5 + Math.random() * 4.5,
      phase: Math.random() * Math.PI * 2,
      speed: 1 + Math.random() * 1.8,
      color: pick(NATURAL),
      shape: Math.random() < 0.5 ? 'sparkle' : 'star5',
      glow: false,
      alphaMin: 0.35,
      depth: 0.6,
    }))

    const big: Star[] = Array.from({ length: BIG_COUNT }, () => ({
      x: spread(),
      y: spread(),
      size: 10 + Math.random() * 7,
      phase: Math.random() * Math.PI * 2,
      speed: 0.8 + Math.random() * 1.2,
      color: pick(NATURAL),
      shape: 'sparkle',
      glow: true,
      alphaMin: 0.5,
      depth: 1,
    }))

    const stars: Star[] = [...dust, ...small, ...big]

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const drawSparkle = (x: number, y: number, s: number) => {
      const k = s * 0.18
      ctx.beginPath()
      ctx.moveTo(x, y - s)
      ctx.quadraticCurveTo(x + k, y - k, x + s, y)
      ctx.quadraticCurveTo(x + k, y + k, x, y + s)
      ctx.quadraticCurveTo(x - k, y + k, x - s, y)
      ctx.quadraticCurveTo(x - k, y - k, x, y - s)
      ctx.fill()
    }

    const drawStar5 = (x: number, y: number, outer: number) => {
      const inner = outer * 0.45
      ctx.beginPath()
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outer : inner
        const a = -Math.PI / 2 + (i * Math.PI) / 5
        const px = x + Math.cos(a) * r
        const py = y + Math.sin(a) * r
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.fill()
    }

    const drawHeart = (x: number, y: number, size: number) => {
      ctx.beginPath()
      ctx.moveTo(x, y + size * 0.85)
      ctx.bezierCurveTo(
        x - size * 1.35,
        y - size * 0.05,
        x - size * 0.8,
        y - size * 0.95,
        x,
        y - size * 0.35,
      )
      ctx.bezierCurveTo(
        x + size * 0.8,
        y - size * 0.95,
        x + size * 1.35,
        y - size * 0.05,
        x,
        y + size * 0.85,
      )
      ctx.fill()
    }

    const spawnShooter = () => {
      const fromLeft = Math.random() < 0.5
      const angle = ((25 + Math.random() * 30) * Math.PI) / 180
      const speed = 500 + Math.random() * 400
      const dir = fromLeft ? 1 : -1
      shooters.push({
        x: fromLeft
          ? Math.random() * width * 0.6
          : width - Math.random() * width * 0.6,
        y: Math.random() * height * 0.4,
        vx: Math.cos(angle) * speed * dir,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 1.1 + Math.random() * 0.8,
        len: 110 + Math.random() * 80,
        color: pick(SHOOTER_COLORS),
      })
    }

    // ---- Дотики ----
    let downX = 0
    let downY = 0
    let downTime = 0

    const addTapStar = (clientX: number, clientY: number) => {
      const now = performance.now() / 1000
      const isHeartTheme = theme === 'heart'
      const color = pick(isHeartTheme ? HEART_COLORS : NATURAL)
      tapStars.push({
        x: clientX / width,
        y: clientY / height,
        size: 9 + Math.random() * 5,
        born: now,
        phase: Math.random() * Math.PI * 2,
        speed: 1 + Math.random() * 1.5,
        color,
        shape: isHeartTheme
          ? 'heart'
          : Math.random() < 0.5
            ? 'sparkle'
            : 'star5',
      })
      if (tapStars.length > MAX_TAP_STARS) tapStars.shift()
      bursts.push({ x: clientX / width, y: clientY / height, born: now, color })
    }

    const onPointerDown = (e: PointerEvent) => {
      requestOrientationPermission()
      downX = e.clientX
      downY = e.clientY
      downTime = performance.now()
    }

    const onPointerUp = (e: PointerEvent) => {
      if (
        e.target instanceof Element &&
        e.target.closest('button, a, input, textarea, [data-no-star]')
      ) {
        return
      }
      const moved = Math.hypot(e.clientX - downX, e.clientY - downY)
      const held = performance.now() - downTime
      if (moved > 12 || held > 500) return
      const pointIndex = CONSTELLATION_POINTS.findIndex((point) => {
        const x = point.x * width
        const y = point.y * height
        return Math.hypot(e.clientX - x, e.clientY - y) < 38
      })
      if (pointIndex === constellationProgress) {
        constellationProgress += 1
        if (constellationProgress === CONSTELLATION_POINTS.length) {
          constellationProgress = CONSTELLATION_POINTS.length
        }
        return
      }
      addTapStar(e.clientX, e.clientY)
    }

    const draw = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05)
      lastTime = time
      const t = time / 1000

      // 0. Нахил: рахуємо згладжений зсув
      const angle = screen.orientation?.angle ?? 0
      if (angle !== lastAngle) {
        // планшет повернули: починаємо відлік нейтрального положення заново
        lastAngle = angle
        baseInit = false
      }
      if (hasTilt) {
        if (!baseInit) {
          baseX = tiltX
          baseY = tiltY
          baseInit = true
        }
        // Нейтральне положення повільно наздоганяє реальне (приблизно 4 секунди),
        // тому небо реагує на рух, а не на те, як саме вона тримає планшет
        const follow = 1 - Math.exp(-dt / 4)
        baseX += (tiltX - baseX) * follow
        baseY += (tiltY - baseY) * follow

        const targetX =
          clamp((tiltX - baseX) / TILT_RANGE, -1, 1) * TILT_DIRECTION
        const targetY =
          clamp((tiltY - baseY) / TILT_RANGE, -1, 1) * TILT_DIRECTION

        const ease = 1 - Math.exp(-dt * 8)
        offsetX += (targetX - offsetX) * ease
        offsetY += (targetY - offsetY) * ease
      }

      ctx.clearRect(0, 0, width, height)

      // 1. Зірки фону
      for (const s of stars) {
        const twinkle = 0.5 + 0.5 * Math.sin(t * s.speed + s.phase)
        const x = s.x * width + offsetX * MAX_SHIFT * s.depth
        const y = s.y * height + offsetY * MAX_SHIFT * s.depth
        ctx.fillStyle = s.color

        if (s.shape === 'dot') {
          ctx.globalAlpha = (s.alphaMin + (1 - s.alphaMin) * twinkle) * 0.7
          ctx.beginPath()
          ctx.arc(x, y, s.size, 0, Math.PI * 2)
          ctx.fill()
          continue
        }

        const size = s.size * (0.75 + 0.25 * twinkle)
        ctx.globalAlpha = s.alphaMin + (1 - s.alphaMin) * twinkle
        if (s.glow) {
          ctx.shadowColor = s.color
          ctx.shadowBlur = size * 1.5 * dpr
        }
        if (s.shape === 'sparkle') drawSparkle(x, y, size)
        else drawStar5(x, y, size)
        if (s.glow) ctx.shadowBlur = 0
      }

      // Таємне сузір'я: точки відкриваються по черзі дотиками.
      ctx.lineWidth = 1.5
      ctx.lineCap = 'round'
      for (let i = 0; i < constellationProgress - 1; i++) {
        const from = CONSTELLATION_POINTS[i]
        const to = CONSTELLATION_POINTS[i + 1]
        ctx.strokeStyle = theme === 'heart' ? '#ff9bad' : '#dbe8ff'
        ctx.globalAlpha = 0.65
        ctx.beginPath()
        ctx.moveTo(from.x * width, from.y * height)
        ctx.lineTo(to.x * width, to.y * height)
        ctx.stroke()
      }

      for (let i = 0; i < CONSTELLATION_POINTS.length; i++) {
        const point = CONSTELLATION_POINTS[i]
        const x = point.x * width
        const y = point.y * height
        const pulse = 0.8 + 0.2 * Math.sin(t * 1.4 + i)
        const active = i < constellationProgress
        ctx.fillStyle = theme === 'heart' ? '#ff9bad' : '#dbe8ff'
        ctx.strokeStyle = ctx.fillStyle
        ctx.globalAlpha = active ? 0.95 : 0.62
        ctx.shadowColor = ctx.fillStyle
        ctx.shadowBlur = active ? 20 * dpr : 11 * dpr
        const pointSize = (active ? 9 : 6) * pulse
        if (theme === 'heart') drawHeart(x, y, pointSize)
        else drawSparkle(x, y, pointSize)
        ctx.shadowBlur = 0
        ctx.globalAlpha = active ? 0.58 : 0.34
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(x, y, (active ? 19 : 14) * pulse, 0, Math.PI * 2)
        ctx.stroke()
      }

      // 2. Зірки, запалені дотиком (найближчий шар, зсуваються найсильніше)
      for (const s of tapStars) {
        const age = t - s.born
        const grow = Math.min(age / 0.6, 1)
        const scale = easeOutBack(grow)
        const twinkle = 0.5 + 0.5 * Math.sin(t * s.speed + s.phase)
        const size = s.size * scale * (0.85 + 0.15 * twinkle)
        const x = s.x * width + offsetX * MAX_SHIFT
        const y = s.y * height + offsetY * MAX_SHIFT

        ctx.fillStyle = s.color
        ctx.globalAlpha = 0.7 + 0.3 * twinkle
        ctx.shadowColor = s.color
        ctx.shadowBlur = size * 2 * dpr
        if (s.shape === 'sparkle') drawSparkle(x, y, size)
        else if (s.shape === 'heart') drawHeart(x, y, size)
        else drawStar5(x, y, size)
        ctx.shadowBlur = 0
      }

      // 3. Спалахи
      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i]
        const p = Math.max(0, (t - b.born) / BURST_TIME)
        if (p >= 1) {
          bursts.splice(i, 1)
          continue
        }
        const ease = 1 - Math.pow(1 - p, 3)
        const x = b.x * width
        const y = b.y * height

        ctx.strokeStyle = b.color
        ctx.fillStyle = b.color
        ctx.globalAlpha = (1 - p) * 0.8
        ctx.lineWidth = 2 * (1 - p) + 0.5
        ctx.beginPath()
        ctx.arc(x, y, ease * 55, 0, Math.PI * 2)
        ctx.stroke()

        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2
          const r = ease * 75
          ctx.beginPath()
          ctx.arc(
            x + Math.cos(a) * r,
            y + Math.sin(a) * r,
            2 * (1 - p) + 0.5,
            0,
            Math.PI * 2,
          )
          ctx.fill()
        }
      }

      // 4. Зірки, що падають
      spawnIn -= dt
      if (spawnIn <= 0) {
        spawnShooter()
        spawnIn = 2 + Math.random() * 4
      }

      for (let i = shooters.length - 1; i >= 0; i--) {
        const sh = shooters[i]
        sh.life += dt
        sh.x += sh.vx * dt
        sh.y += sh.vy * dt

        if (sh.life >= sh.maxLife) {
          shooters.splice(i, 1)
          continue
        }

        const p = sh.life / sh.maxLife
        const alpha = p < 0.15 ? p / 0.15 : p > 0.6 ? (1 - p) / 0.4 : 1

        const mag = Math.hypot(sh.vx, sh.vy)
        const ux = sh.vx / mag
        const uy = sh.vy / mag

        ctx.strokeStyle = sh.color
        ctx.lineCap = 'round'
        const segs = 20
        for (let k = 0; k < segs; k++) {
          const a = k / segs
          const b = (k + 1) / segs
          ctx.globalAlpha = alpha * (1 - a) * 0.9
          ctx.lineWidth = 2.4 * (1 - a) + 0.4
          ctx.beginPath()
          ctx.moveTo(sh.x - ux * sh.len * a, sh.y - uy * sh.len * a)
          ctx.lineTo(sh.x - ux * sh.len * b, sh.y - uy * sh.len * b)
          ctx.stroke()
        }

        ctx.fillStyle = '#ffffff'
        ctx.globalAlpha = alpha
        ctx.shadowColor = sh.color
        ctx.shadowBlur = 10 * dpr
        drawSparkle(sh.x, sh.y, 7)
        ctx.shadowBlur = 0
      }

      ctx.globalAlpha = 1
      frameId = requestAnimationFrame(draw)
    }

    resize()
    frameId = requestAnimationFrame(draw)
    window.addEventListener('resize', resize)
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('deviceorientation', onOrientation)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('deviceorientation', onOrientation)
    }
  }, [theme])

  return <canvas ref={canvasRef} className="starfield" />
}

export default StarField