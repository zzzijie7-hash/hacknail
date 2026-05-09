import { memo, useEffect, useMemo, useRef, useState } from 'react'

const DEFAULT_POINTS = [
  { x: 0.23, y: 0.7 },
  { x: 0.36, y: 0.56 },
  { x: 0.49, y: 0.49 },
  { x: 0.63, y: 0.55 },
  { x: 0.76, y: 0.68 },
]

const WORK_SWINGS = 4
const SWING_MS = 200
const MOVE_MS = 2600
const WORKER_SIZE = 64

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

function clampPoint(point) {
  return {
    x: Math.max(0.08, Math.min(point.x, 0.92)),
    y: Math.max(0.08, Math.min(point.y, 0.92)),
  }
}

function segmentAngle(from, to) {
  return Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI
}

function NailPaintingAnim({
  points = DEFAULT_POINTS,
  workerSrc = '/icons/worker-potato.png',
  stage = 'painting',
  active = true,
  demoMode = false,
  showDebugPoints = true,
  onForwardComplete,
  onComplete,
  onPhaseChange,
}) {
  const normalizedPoints = useMemo(
    () => (points.length ? points : DEFAULT_POINTS).map(clampPoint),
    [points]
  )
  const onForwardCompleteRef = useRef(onForwardComplete)
  const onCompleteRef = useRef(onComplete)
  const onPhaseChangeRef = useRef(onPhaseChange)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState('idle')
  const [workerPos, setWorkerPos] = useState(normalizedPoints[0] || DEFAULT_POINTS[0])
  const [workerAngle, setWorkerAngle] = useState(-12)
  const [flipX, setFlipX] = useState(1)
  const [success, setSuccess] = useState(false)
  const [pathVisible, setPathVisible] = useState(false)
  const [segment, setSegment] = useState(null)
  const workDuration = WORK_SWINGS * SWING_MS
  const paintingDuration = normalizedPoints.length * workDuration + Math.max(0, normalizedPoints.length - 1) * MOVE_MS
  const sealingDuration = Math.max(0, normalizedPoints.length - 1) * MOVE_MS
  const demoMotion = useMemo(() => {
    if (!demoMode || !normalizedPoints.length) return null

    const buildFrames = (sequence, includeWorkPause) => {
      const total = includeWorkPause
        ? sequence.length * workDuration + Math.max(0, sequence.length - 1) * MOVE_MS
        : Math.max(0, sequence.length - 1) * MOVE_MS

      if (total <= 0) {
        const point = sequence[0] || DEFAULT_POINTS[0]
        return `0% { left:${point.x * 100}%; top:${point.y * 100}%; } 100% { left:${point.x * 100}%; top:${point.y * 100}%; }`
      }

      let elapsed = 0
      const frames = []

      sequence.forEach((point, index) => {
        const pointPct = (elapsed / total) * 100
        frames.push(`${pointPct}% { left:${point.x * 100}%; top:${point.y * 100}%; }`)

        if (includeWorkPause) {
          elapsed += workDuration
          const holdPct = (elapsed / total) * 100
          frames.push(`${holdPct}% { left:${point.x * 100}%; top:${point.y * 100}%; }`)
        }

        if (index < sequence.length - 1) {
          elapsed += MOVE_MS
          const nextPoint = sequence[index + 1]
          const movePct = (elapsed / total) * 100
          frames.push(`${movePct}% { left:${nextPoint.x * 100}%; top:${nextPoint.y * 100}%; }`)
        }
      })

      return frames.join('\n')
    }

    return {
      paintingFrames: buildFrames(normalizedPoints, true),
      sealingFrames: buildFrames([...normalizedPoints].reverse(), false),
    }
  }, [demoMode, normalizedPoints, workDuration])

  useEffect(() => {
    if (!demoMode || !active || !normalizedPoints.length) return

    let timeoutId = null

    if (stage === 'painting') {
      onPhaseChangeRef.current?.('work')
      timeoutId = window.setTimeout(() => {
        onForwardCompleteRef.current?.()
      }, paintingDuration)
    } else if (stage === 'sealing') {
      onPhaseChangeRef.current?.('return')
      timeoutId = window.setTimeout(() => {
        onPhaseChangeRef.current?.('done')
        onCompleteRef.current?.()
      }, sealingDuration)
    }

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }, [active, demoMode, normalizedPoints.length, paintingDuration, sealingDuration, stage])

  useEffect(() => {
    onForwardCompleteRef.current = onForwardComplete
  }, [onForwardComplete])

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    onPhaseChangeRef.current = onPhaseChange
  }, [onPhaseChange])

  useEffect(() => {
    setCurrentIndex(0)
    setPhase('idle')
    setWorkerPos(normalizedPoints[0] || DEFAULT_POINTS[0])
    setWorkerAngle(-12)
    setFlipX(1)
    setSuccess(false)
    setPathVisible(false)
    setSegment(null)
  }, [normalizedPoints])

  useEffect(() => {
    if (!active || !normalizedPoints.length) return

    let cancelled = false

    const animateMove = (from, to, duration) => new Promise((resolve) => {
      const start = performance.now()

      const tick = (now) => {
        if (cancelled) {
          resolve()
          return
        }

        const rawProgress = (now - start) / duration
        const t = Math.max(0, Math.min(rawProgress, 1))
        const eased = 1 - Math.pow(1 - t, 3)

        setWorkerPos({
          x: from.x + (to.x - from.x) * eased,
          y: from.y + (to.y - from.y) * eased,
        })

        if (t < 1) {
          requestAnimationFrame(tick)
          return
        }

        setWorkerPos(to)
        resolve()
      }

      requestAnimationFrame(tick)
    })

    const run = async () => {
      setSuccess(false)
      setPathVisible(false)
      setSegment(null)

      if (stage === 'painting') {
        setCurrentIndex(0)
        setWorkerPos(normalizedPoints[0])
        setWorkerAngle(-12)
        setFlipX(1)
        onPhaseChangeRef.current?.('work')

        for (let i = 0; i < normalizedPoints.length; i += 1) {
          const point = normalizedPoints[i]
          setCurrentIndex(i)
          setWorkerPos(point)
          setPhase('work')
          onPhaseChangeRef.current?.('work')
          setWorkerAngle(-16)
          setSegment(null)

          for (let swing = 0; swing < WORK_SWINGS; swing += 1) {
            if (cancelled) return
            const dir = swing % 2 === 0 ? 1 : -1
            setFlipX(dir)
            setWorkerAngle(dir > 0 ? 13 : -13)
            await wait(SWING_MS)
          }

          if (i === normalizedPoints.length - 1) {
            break
          }

          const nextPoint = normalizedPoints[i + 1]
          setPhase('move')
          onPhaseChangeRef.current?.('move')
          setPathVisible(true)
          setSegment({ from: point, to: nextPoint })
          setFlipX(nextPoint.x >= point.x ? 1 : -1)
          setWorkerAngle(segmentAngle(point, nextPoint) * 0.28)
          await animateMove(point, nextPoint, MOVE_MS)
          setPathVisible(false)
        }

        if (cancelled) return
        setPhase('idle')
        setPathVisible(false)
        setSegment(null)
        onForwardCompleteRef.current?.()
        return
      }

      if (stage !== 'sealing') return

      setCurrentIndex(normalizedPoints.length - 1)
      setWorkerPos(normalizedPoints[normalizedPoints.length - 1])
      setWorkerAngle(-12)
      setFlipX(1)

      for (let i = normalizedPoints.length - 1; i > 0; i -= 1) {
        if (cancelled) return
        const point = normalizedPoints[i]
        const prevPoint = normalizedPoints[i - 1]
        setPhase('return')
        onPhaseChangeRef.current?.('return')
        setPathVisible(true)
        setSegment({ from: point, to: prevPoint })
        setFlipX(prevPoint.x >= point.x ? 1 : -1)
        setWorkerAngle(segmentAngle(point, prevPoint) * 0.28)
        await animateMove(point, prevPoint, MOVE_MS)
        setCurrentIndex(i - 1)
        setPathVisible(false)
        await wait(180)
      }

      if (cancelled) return
      setPhase('done')
      onPhaseChangeRef.current?.('done')
      setSuccess(true)
      setFlipX(1)
      setWorkerAngle(0)
      setSegment(null)
      onCompleteRef.current?.()
    }

    run()

    return () => {
      cancelled = true
    }
  }, [active, normalizedPoints, stage])

  const isMoving = phase === 'move' || phase === 'return'

  if (demoMode && demoMotion) {
    const isSealing = stage === 'sealing'
    const animationName = isSealing ? 'demoPotatoSealingPath' : 'demoPotatoPaintingPath'
    const duration = isSealing ? sealingDuration : paintingDuration
    const startPoint = isSealing
      ? normalizedPoints[normalizedPoints.length - 1]
      : normalizedPoints[0]

    return (
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 14, overflow: 'hidden' }}>
        <style>{`
          @keyframes demoPotatoPaintingPath {
            ${demoMotion.paintingFrames}
          }
          @keyframes demoPotatoSealingPath {
            ${demoMotion.sealingFrames}
          }
          @keyframes demoPotatoWobble {
            0%, 100% { transform: rotate(-10deg) scaleX(1); }
            25% { transform: rotate(12deg) scaleX(-1); }
            50% { transform: rotate(-12deg) scaleX(1); }
            75% { transform: rotate(10deg) scaleX(-1); }
          }
        `}</style>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          {showDebugPoints && normalizedPoints.map((point, index) => (
            <g key={`${point.x}-${point.y}-${index}`}>
              <circle
                cx={point.x * 100}
                cy={point.y * 100}
                r={1.9}
                fill="rgba(255,255,255,0.88)"
                stroke="rgba(160,98,201,0.5)"
                strokeWidth={0.4}
              />
            </g>
          ))}
        </svg>
        <div
          style={{
            position: 'absolute',
            left: `${startPoint.x * 100}%`,
            top: `${startPoint.y * 100}%`,
            width: WORKER_SIZE,
            height: WORKER_SIZE,
            transform: 'translate(-50%, -50%)',
            animation: `${animationName} ${duration}ms linear forwards`,
            zIndex: 16,
            filter: 'drop-shadow(0 8px 18px rgba(0, 0, 0, 0.18))',
          }}
        >
          <img
            src={workerSrc}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              transformOrigin: 'center center',
              animation: `demoPotatoWobble ${Math.max(600, workDuration)}ms ease-in-out infinite`,
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 14, overflow: 'hidden' }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {showDebugPoints && normalizedPoints.map((point, index) => {
          const done = phase === 'return' || phase === 'done' || index < currentIndex
          const focused = index === currentIndex && phase !== 'done'
          return (
            <g key={`${point.x}-${point.y}-${index}`}>
              <circle
                cx={point.x * 100}
                cy={point.y * 100}
                r={focused ? 2.3 : 1.7}
                fill={done ? '#A062C9' : 'rgba(255,255,255,0.88)'}
                stroke={focused ? 'rgba(255,255,255,0.92)' : 'rgba(160,98,201,0.5)'}
                strokeWidth={focused ? 0.7 : 0.4}
              />
              <circle
                cx={point.x * 100}
                cy={point.y * 100}
                r={focused ? 4.6 : 0}
                fill="none"
                stroke="rgba(160,98,201,0.42)"
                strokeWidth="0.6"
              />
            </g>
          )
        })}

        {pathVisible && segment && (
          <line
            x1={segment.from.x * 100}
            y1={segment.from.y * 100}
            x2={segment.to.x * 100}
            y2={segment.to.y * 100}
            stroke="#A062C9"
            strokeWidth="0.6"
            strokeDasharray="1.5 1.5"
            strokeLinecap="round"
            opacity="0.95"
          />
        )}
      </svg>

      <div
        style={{
          position: 'absolute',
          left: `${workerPos.x * 100}%`,
          top: `${workerPos.y * 100}%`,
          width: WORKER_SIZE,
          height: WORKER_SIZE,
          transformOrigin: 'center center',
          transform: `translate(-50%, -50%) rotate(${workerAngle}deg) scaleX(${flipX})`,
          transition: 'transform 180ms ease',
          zIndex: 16,
          filter: success ? 'drop-shadow(0 0 16px rgba(160, 98, 201, 0.36))' : 'drop-shadow(0 8px 18px rgba(0, 0, 0, 0.18))',
        }}
      >
        <img
          src={workerSrc}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
            transformOrigin: 'center center',
          }}
        />
      </div>
    </div>
  )
}

export default memo(NailPaintingAnim)
