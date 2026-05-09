import { useEffect, useMemo, useState } from 'react'

const DEFAULT_POINTS = [
  { x: 0.23, y: 0.7 },
  { x: 0.36, y: 0.56 },
  { x: 0.49, y: 0.49 },
  { x: 0.63, y: 0.55 },
  { x: 0.76, y: 0.68 },
]

const WORK_SWINGS = 4
const SWING_MS = 520
const MOVE_MS = 2400
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

export default function NailPaintingAnim({
  points = DEFAULT_POINTS,
  workerSrc = '/icons/worker-potato.png',
  active = true,
  showDebugPoints = true,
  onComplete,
}) {
  const normalizedPoints = useMemo(
    () => (points.length ? points : DEFAULT_POINTS).map(clampPoint),
    [points]
  )

  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState('idle')
  const [workerPos, setWorkerPos] = useState(normalizedPoints[0] || DEFAULT_POINTS[0])
  const [workerAngle, setWorkerAngle] = useState(-12)
  const [flipX, setFlipX] = useState(1)
  const [success, setSuccess] = useState(false)
  const [pathVisible, setPathVisible] = useState(false)
  const [segment, setSegment] = useState(null)

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

    const run = async () => {
      setSuccess(false)
      setPathVisible(false)
      setCurrentIndex(0)
      setWorkerPos(normalizedPoints[0])
      setWorkerAngle(-12)
      setFlipX(1)
      await wait(420)
      if (cancelled) return

      for (let i = 0; i < normalizedPoints.length; i += 1) {
        const point = normalizedPoints[i]
        setCurrentIndex(i)
        setWorkerPos(point)
        setPhase('work')
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
        setPathVisible(true)
        setSegment({ from: point, to: nextPoint })
        setFlipX(nextPoint.x >= point.x ? 1 : -1)
        setWorkerAngle(segmentAngle(point, nextPoint) * 0.28)
        await wait(40)
        if (cancelled) return
        setWorkerPos(nextPoint)
        await wait(MOVE_MS)
        setPathVisible(false)
      }

      for (let i = normalizedPoints.length - 1; i > 0; i -= 1) {
        if (cancelled) return
        const point = normalizedPoints[i]
        const prevPoint = normalizedPoints[i - 1]
        setPhase('return')
        setPathVisible(true)
        setSegment({ from: point, to: prevPoint })
        setFlipX(prevPoint.x >= point.x ? 1 : -1)
        setWorkerAngle(segmentAngle(point, prevPoint) * 0.28)
        await wait(40)
        if (cancelled) return
        setWorkerPos(prevPoint)
        setCurrentIndex(i - 1)
        await wait(MOVE_MS)
        setPathVisible(false)
        await wait(180)
      }

      if (cancelled) return
      setPhase('done')
      setSuccess(true)
      setFlipX(1)
      setWorkerAngle(0)
      setSegment(null)
      onComplete?.()
    }

    run()

    return () => {
      cancelled = true
    }
  }, [active, normalizedPoints, onComplete])

  const isMoving = phase === 'move' || phase === 'return'

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
          transition: isMoving
            ? `left ${MOVE_MS}ms cubic-bezier(0.33, 1, 0.68, 1), top ${MOVE_MS}ms cubic-bezier(0.33, 1, 0.68, 1), transform 260ms ease`
            : 'transform 180ms ease, left 120ms ease, top 120ms ease',
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

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 12,
          display: 'flex',
          justifyContent: 'center',
          zIndex: 17,
        }}
      >
        <div
          style={{
            padding: '6px 10px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.88)',
            color: '#6B4B83',
            fontSize: 11,
            lineHeight: '14px',
            fontWeight: 600,
            boxShadow: '0 8px 18px rgba(0,0,0,0.08)',
          }}
        >
          {phase === 'done'
            ? '施工完成，正在贴上成功贴纸'
            : phase === 'return'
              ? '绘制完毕，正在逐个封层加固'
              : phase === 'move'
              ? `前往第 ${Math.min(currentIndex + 2, normalizedPoints.length)} 个检测点`
              : '施工中，请耐心等待效果...'}
        </div>
      </div>

    </div>
  )
}
