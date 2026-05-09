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

function buildStickerPath(points) {
  if (!points.length) return 'M 25 72 Q 50 28 75 72 Q 50 88 25 72 Z'

  const xs = points.map(p => p.x * 100)
  const ys = points.map(p => p.y * 100)
  const minX = Math.max(8, Math.min(...xs) - 14)
  const maxX = Math.min(92, Math.max(...xs) + 14)
  const minY = Math.max(8, Math.min(...ys) - 22)
  const maxY = Math.min(92, Math.max(...ys) + 12)
  const midX = (minX + maxX) / 2
  const midY = (minY + maxY) / 2

  return [
    `M ${minX} ${maxY - 5}`,
    `Q ${minX - 4} ${midY + 10} ${minX + 5} ${minY + 8}`,
    `Q ${midX - 12} ${minY - 6} ${midX} ${minY}`,
    `Q ${midX + 14} ${minY - 8} ${maxX - 4} ${minY + 12}`,
    `Q ${maxX + 5} ${midY + 4} ${maxX - 2} ${maxY - 8}`,
    `Q ${midX + 10} ${maxY + 8} ${midX - 2} ${maxY - 2}`,
    `Q ${minX + 10} ${maxY + 8} ${minX} ${maxY - 5}`,
    'Z',
  ].join(' ')
}

function segmentAngle(from, to) {
  return Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI
}

function SuccessSticker({ points, visible }) {
  const stickerPath = useMemo(() => buildStickerPath(points), [points])

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: visible ? 1 : 0,
        transition: 'opacity 320ms ease',
        pointerEvents: 'none',
        zIndex: 18,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.26)',
          backdropFilter: 'blur(1.5px)',
        }}
      />
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <g style={{ transformOrigin: '50% 50%', animation: visible ? 'stickerPop 900ms ease forwards' : 'none' }}>
          <path d={stickerPath} fill="rgba(255,255,255,0.08)" stroke="#A062C9" strokeWidth="0.8" strokeLinejoin="round" />
          <path d={stickerPath} fill="none" stroke="#A062C9" strokeWidth="0.5" strokeDasharray="1.3 1.6" opacity="0.7" />
          <path d="M18 22 L21 16 L24 22 L30 25 L24 28 L21 34 L18 28 L12 25 Z" fill="rgba(255,255,255,0.9)" stroke="#A062C9" strokeWidth="0.6" />
          <path d="M76 17 L78 13 L80 17 L84 19 L80 21 L78 25 L76 21 L72 19 Z" fill="rgba(255,255,255,0.9)" stroke="#A062C9" strokeWidth="0.6" />
          <path d="M79 73 L82 67 L85 73 L91 76 L85 79 L82 85 L79 79 L73 76 Z" fill="rgba(255,255,255,0.9)" stroke="#A062C9" strokeWidth="0.6" />
          <path d="M11 58 L16 56" stroke="#A062C9" strokeWidth="0.7" strokeLinecap="round" />
          <path d="M14 64 L20 66" stroke="#A062C9" strokeWidth="0.7" strokeLinecap="round" />
          <path d="M85 58 L90 54" stroke="#A062C9" strokeWidth="0.7" strokeLinecap="round" />
          <path d="M84 64 L90 67" stroke="#A062C9" strokeWidth="0.7" strokeLinecap="round" />
          <text x="50" y="14" textAnchor="middle" fill="#F3DFFF" fontSize="5.8" fontWeight="700" letterSpacing="1.2">
            DONE
          </text>
        </g>
      </svg>
      <style>{`
        @keyframes stickerPop {
          0% { transform: scale(0.86) rotate(-8deg); }
          35% { transform: scale(1.5) rotate(2deg); }
          58% { transform: scale(0.96) rotate(-3deg); }
          74% { transform: scale(1.02) rotate(2deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
      `}</style>
    </div>
  )
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

  useEffect(() => {
    setCurrentIndex(0)
    setPhase('idle')
    setWorkerPos(normalizedPoints[0] || DEFAULT_POINTS[0])
    setWorkerAngle(-12)
    setFlipX(1)
    setSuccess(false)
    setPathVisible(false)
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
        setFlipX(nextPoint.x >= point.x ? 1 : -1)
        setWorkerAngle(segmentAngle(point, nextPoint) * 0.28)
        await wait(40)
        if (cancelled) return
        setWorkerPos(nextPoint)
        await wait(MOVE_MS)
        setPathVisible(false)
      }

      if (cancelled) return
      setPhase('done')
      setSuccess(true)
      setFlipX(1)
      setWorkerAngle(0)
      onComplete?.()
    }

    run()

    return () => {
      cancelled = true
    }
  }, [active, normalizedPoints, onComplete])

  const activePoint = normalizedPoints[currentIndex]
  const nextPoint = normalizedPoints[currentIndex + 1]
  const isMoving = phase === 'move'

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 14, overflow: 'hidden' }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {showDebugPoints && normalizedPoints.map((point, index) => {
          const done = index < currentIndex || phase === 'done'
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

        {pathVisible && activePoint && nextPoint && (
          <line
            x1={activePoint.x * 100}
            y1={activePoint.y * 100}
            x2={nextPoint.x * 100}
            y2={nextPoint.y * 100}
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
            : phase === 'move'
              ? `前往第 ${Math.min(currentIndex + 2, normalizedPoints.length)} 个检测点`
              : '施工中，请耐心等待效果...'}
        </div>
      </div>

      <SuccessSticker points={normalizedPoints} visible={success} />
    </div>
  )
}
