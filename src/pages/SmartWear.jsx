import { useState, useRef, useEffect, useMemo } from 'react'
import NailLibraryPanel from '../components/NailLibraryPanel'
import NailPaintingAnim from '../components/NailPaintingAnim'
import ShapeSelector from '../components/ShapeSelector'
import { loadLibrary, saveLibrary } from '../utils/nailLibrary'

const SHAPE_BUBBLES = {
  almond: '杏仁甲，适合肉肉手，能视觉拉长手指～',
  square: '方型甲，适合骨节手，能中和棱角，让比例更协调～',
  oval: '椭圆甲，适合短宽手，弧度流畅，能拉长手指～',
  squoval: '方圆甲，适合养甲床，几乎不挑手型哦，我最推荐～',
}

const MOCK_NAIL_POINTS = [
  { x: 0.23, y: 0.7 },
  { x: 0.36, y: 0.56 },
  { x: 0.49, y: 0.49 },
  { x: 0.63, y: 0.55 },
  { x: 0.76, y: 0.68 },
]

const BUBBLE_TYPING_MS = 32
const DETECTING_DOTS = [
  { x: 0.18, y: 0.26, size: 8, delay: 0 },
  { x: 0.31, y: 0.18, size: 5, delay: 180 },
  { x: 0.47, y: 0.24, size: 10, delay: 420 },
  { x: 0.64, y: 0.2, size: 6, delay: 90 },
  { x: 0.76, y: 0.29, size: 12, delay: 260 },
  { x: 0.23, y: 0.44, size: 7, delay: 520 },
  { x: 0.42, y: 0.4, size: 9, delay: 160 },
  { x: 0.68, y: 0.43, size: 6, delay: 360 },
  { x: 0.16, y: 0.62, size: 11, delay: 240 },
  { x: 0.36, y: 0.58, size: 6, delay: 110 },
  { x: 0.57, y: 0.64, size: 8, delay: 480 },
  { x: 0.78, y: 0.6, size: 5, delay: 300 },
]

function buildHandStickerBounds(points) {
  if (!points?.length) {
    return { left: 22, top: 22, width: 56, height: 60 }
  }

  const xs = points.map(p => p.x * 100)
  const ys = points.map(p => p.y * 100)
  const minX = Math.max(4, Math.min(...xs) - 18)
  const maxX = Math.min(96, Math.max(...xs) + 12)
  const minY = Math.max(6, Math.min(...ys) - 16)
  const maxY = Math.min(98, Math.max(...ys) + 50)

  return {
    left: minX,
    top: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

function buildStickerGeometry(points, outline) {
  const source = outline?.length ? outline : points
  if (!source?.length) {
    return {
      bounds: { left: 22, top: 22, width: 56, height: 60 },
      clipPath: 'polygon(10% 90%, 18% 25%, 56% 8%, 88% 26%, 92% 82%, 44% 96%)',
      strokePoints: '10,90 18,25 56,8 88,26 92,82 44,96',
    }
  }

  const xs = source.map(p => p.x * 100)
  const ys = source.map(p => p.y * 100)
  const minX = Math.max(2, Math.min(...xs) - 4)
  const maxX = Math.min(98, Math.max(...xs) + 4)
  const minY = Math.max(2, Math.min(...ys) - 4)
  const maxY = Math.min(98, Math.max(...ys) + 6)
  const width = Math.max(16, maxX - minX)
  const height = Math.max(20, maxY - minY)

  const normalized = source.map(point => ({
    x: ((point.x * 100 - minX) / width) * 100,
    y: ((point.y * 100 - minY) / height) * 100,
  }))

  return {
    bounds: { left: minX, top: minY, width, height },
    clipPath: `polygon(${normalized.map(point => `${point.x}% ${point.y}%`).join(', ')})`,
    strokePoints: normalized.map(point => `${point.x},${point.y}`).join(' '),
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error || new Error('读取图片失败'))
    reader.readAsDataURL(file)
  })
}

export default function SmartWear({
  onBack, onBuySimilar, onFindShops, onUpload,
  initialNails, nailStyle, onNailStyleChange,
  handFile, onHandFileChange,
  result, onResultChange,
  loading, onLoadingChange,
  progress, onProgressChange,
  provider, onProviderChange,
}) {
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [error, setError] = useState(null)
  const [imgIdx, setImgIdx] = useState(0)
  const [mode, setMode] = useState('capture')
  const [selectedShape, setSelectedShape] = useState('squoval')
  const [nailPoints, setNailPoints] = useState(MOCK_NAIL_POINTS)
  const [analyzeState, setAnalyzeState] = useState('idle')
  const [cameraState, setCameraState] = useState('idle')
  const [bubbleText, setBubbleText] = useState('')
  const [showResultSticker, setShowResultSticker] = useState(false)
  const [detectProgress, setDetectProgress] = useState(0)
  const [handOutline, setHandOutline] = useState([])
  const [resultNotice, setResultNotice] = useState('')
  const inputRef = useRef()
  const cameraRef = useRef()
  const cameraPreviewRef = useRef(null)
  const cameraStreamRef = useRef(null)
  const analyzePromiseRef = useRef(null)
  const handPreviewUrlRef = useRef(null)

  useEffect(() => { if (result) setMode('result') }, [result])

  const groupImages = useMemo(() => {
    if (!nailStyle?.groupId) return nailStyle ? [nailStyle] : []
    const all = loadLibrary().filter(n => !n.category || n.category === 'nail')
    return all.filter(n => n.groupId === nailStyle.groupId)
  }, [nailStyle])
  const curNail = groupImages[imgIdx] || nailStyle
  useEffect(() => { setImgIdx(0) }, [nailStyle?.groupId])

  useEffect(() => {
    if (!initialNails?.length) return
    const existing = loadLibrary(), existingSet = new Set(existing.map(n => n.src))
    const gid = 'post_' + Date.now()
    const toAdd = initialNails.filter(s => !existingSet.has(s)).map((s, i) =>
      ({ id: Date.now() + i, src: s, groupId: gid, groupLabel: '帖子导入', category: 'nail' }))
    if (toAdd.length) saveLibrary([...existing, ...toAdd])
    const firstSrc = initialNails[0]
    const entry = existing.find(n => n.src === firstSrc) || toAdd.find(n => n.src === firstSrc) || toAdd[0] || existing.find(n => n.src === firstSrc)
    if (entry && entry.id !== nailStyle?.id) { onNailStyleChange?.(entry); setImgIdx(0) }
  }, [])
  useEffect(() => { if (curNail && curNail.id !== nailStyle?.id) onNailStyleChange?.(curNail) }, [curNail?.id])

  const setHandPreviewUrl = (file) => {
    if (!file) {
      setHpUrl(null)
      handPreviewUrlRef.current = null
      return null
    }
    return null
  }

  const handleFile = async (f) => {
    if (!f?.type.startsWith('image/')) return
    try {
      const preview = await readFileAsDataUrl(f)
      handPreviewUrlRef.current = preview
      setHpUrl(preview)
    } catch (e) {
      console.warn('[preview read failed]', e)
      handPreviewUrlRef.current = null
      setHpUrl(null)
    }
    onHandFileChange?.(f)
    setMode('confirm')
  }

  const [hpUrl, setHpUrl] = useState(null)
  useEffect(() => {
    if (!handFile) setHandPreviewUrl(null)
  }, [handFile])

  useEffect(() => {
    const stopStream = () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => track.stop())
        cameraStreamRef.current = null
      }
      if (cameraPreviewRef.current) cameraPreviewRef.current.srcObject = null
    }

    if (mode !== 'capture' || handFile) {
      stopStream()
      if (!handFile) setCameraState('idle')
      return
    }

    let cancelled = false

    const setupCamera = async () => {
      try {
        setCameraState('loading')
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1080 },
            height: { ideal: 1440 },
          },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach(track => track.stop())
          return
        }
        cameraStreamRef.current = stream
        if (cameraPreviewRef.current) {
          cameraPreviewRef.current.srcObject = stream
          await cameraPreviewRef.current.play().catch(() => {})
        }
        setCameraState('ready')
      } catch (e) {
        if (cancelled) return
        console.warn('[camera permission]', e)
        setCameraState('denied')
      }
    }

    setupCamera()

    return () => {
      cancelled = true
      stopStream()
    }
  }, [mode, handFile])

  useEffect(() => {
    if (!result) {
      setShowResultSticker(false)
      return
    }
    setShowResultSticker(true)
    const timer = window.setTimeout(() => setShowResultSticker(false), 1800)
    return () => window.clearTimeout(timer)
  }, [result, selectedShape])

  useEffect(() => {
    if (!handFile) {
      setNailPoints(MOCK_NAIL_POINTS)
      setHandOutline([])
      setAnalyzeState('idle')
      setDetectProgress(0)
      analyzePromiseRef.current = null
      return
    }

    let cancelled = false

    const analyzeHand = async () => {
      setAnalyzeState('loading')
      setDetectProgress(6)
      const form = new FormData()
      form.append('hand', handFile)

      try {
        const resp = await fetch('/api/analyze-hand', { method: 'POST', body: form })
        const data = await resp.json()
        if (!resp.ok) throw new Error(data.detail || '手部检测失败')

        const detected = Array.isArray(data.nails)
          ? data.nails
              .filter(p => typeof p?.x === 'number' && typeof p?.y === 'number')
              .map(p => ({ x: p.x, y: p.y }))
          : []
        const outline = Array.isArray(data.hand_outline)
          ? data.hand_outline
              .filter(p => typeof p?.x === 'number' && typeof p?.y === 'number')
              .map(p => ({ x: p.x, y: p.y }))
          : []

        if (cancelled) return
        setNailPoints(detected.length ? detected : MOCK_NAIL_POINTS)
        setHandOutline(outline)
        setAnalyzeState(detected.length ? 'detected' : 'fallback')
        setDetectProgress(100)
        return detected.length ? detected : MOCK_NAIL_POINTS
      } catch (e) {
        if (cancelled) return
        console.warn('[analyze-hand fallback]', e)
        setNailPoints(MOCK_NAIL_POINTS)
        setHandOutline([])
        setAnalyzeState('fallback')
        setDetectProgress(100)
        return MOCK_NAIL_POINTS
      }
    }

    analyzePromiseRef.current = analyzeHand()

    return () => {
      cancelled = true
    }
  }, [handFile])

  useEffect(() => {
    if (mode !== 'generating' || analyzeState !== 'loading') return
    const interval = window.setInterval(() => {
      setDetectProgress(prev => Math.min(prev + Math.random() * 8 + 3, 92))
    }, 220)
    return () => window.clearInterval(interval)
  }, [mode, analyzeState])

  const frameImg = mode === 'generating' ? '/icons/frame-generating.png'
    : mode === 'result' ? '/icons/frame-after.png'
    : '/icons/frame-before.png'
  const generationBaseImage = hpUrl || handPreviewUrlRef.current

  const bubbleTargetText = mode === 'result'
    ? '点击仍可切换查看不同甲型效果哦～'
    : SHAPE_BUBBLES[selectedShape] || SHAPE_BUBBLES.squoval

  useEffect(() => {
    setBubbleText('')
    let cancelled = false
    let index = 0

    const tick = () => {
      if (cancelled) return
      index += 1
      setBubbleText(bubbleTargetText.slice(0, index))
      if (index < bubbleTargetText.length) {
        window.setTimeout(tick, BUBBLE_TYPING_MS)
      }
    }

    const timer = window.setTimeout(tick, 60)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [bubbleTargetText])

  const startGenerate = async (forcedProvider = 'openai', forcedShape = selectedShape) => {
    if (!handFile || !curNail) return
    if (!handPreviewUrlRef.current && !hpUrl) {
      try {
        const preview = await readFileAsDataUrl(handFile)
        handPreviewUrlRef.current = preview
        setHpUrl(preview)
      } catch (e) {
        console.warn('[startGenerate preview rebuild failed]', e)
      }
    }
    onLoadingChange?.(true); setError(null); setResultNotice(''); onResultChange?.(null); onProgressChange?.(0); setMode('generating')
    let prog = 0
    const iv = setInterval(() => { prog = Math.min(prog + Math.random() * 8, 90); onProgressChange?.(prog) }, 800)
    const form = new FormData()
    form.append('hand', handFile); form.append('provider', forcedProvider || 'openai'); form.append('nail_shape', forcedShape)
    if (curNail.src.startsWith('data:')) {
      const arr = curNail.src.split(','), mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
      form.append('nail', new Blob([Uint8Array.from(atob(arr[1]), c => c.charCodeAt(0))], { type: mime }), 'nail.jpg')
    } else form.append('nail_url', curNail.src)
    try {
      const r = await fetch('/api/cyber-nails', { method: 'POST', body: form })
      const d = await r.json(); if (!r.ok) throw new Error(d.detail || '生成失败')
      onResultChange?.(d.image); onProgressChange?.(100)
    } catch (e) {
      const fallbackMessage = e.message?.includes('token')
        ? '后端模型token用尽，为您演示模拟效果'
        : '后端生成暂不可用，为您演示模拟效果'
      setError(fallbackMessage)
      await mockGenerate(fallbackMessage)
      return
    }
    finally { clearInterval(iv); setTimeout(() => onLoadingChange?.(false), 500) }
  }

  const mockGenerate = async (notice = '模拟生成效果') => {
    if (!handFile || !curNail) return
    if (!handPreviewUrlRef.current && !hpUrl) {
      try {
        const preview = await readFileAsDataUrl(handFile)
        handPreviewUrlRef.current = preview
        setHpUrl(preview)
      } catch (e) {
        console.warn('[mockGenerate preview rebuild failed]', e)
      }
    }
    onLoadingChange?.(true); setError(null); setResultNotice(notice); onResultChange?.(null); onProgressChange?.(0); setMode('generating')
    let pg = 0
    const iv = setInterval(() => { pg = Math.min(pg + Math.random() * 20, 90); onProgressChange?.(pg) }, 600)
    const hp = handPreviewUrlRef.current || hpUrl
    const nSrc = curNail.src
    const canvas = document.createElement('canvas')
    canvas.width = 400; canvas.height = 500
    const ctx = canvas.getContext('2d')
    const handImg = new Image()
    handImg.src = hp
    handImg.onload = () => {
      ctx.drawImage(handImg, 0, 0, 400, 500)
      const nailImg = new Image()
      nailImg.crossOrigin = 'anonymous'
      nailImg.src = nSrc
      nailImg.onload = () => {
        ctx.globalAlpha = 0.75
        ctx.drawImage(nailImg, 260, 30, 120, 120)
        clearInterval(iv)
        onProgressChange?.(100)
        onResultChange?.(canvas.toDataURL())
        onLoadingChange?.(false)
      }
      nailImg.onerror = () => {
        clearInterval(iv)
        onProgressChange?.(100)
        onResultChange?.(canvas.toDataURL())
        onLoadingChange?.(false)
      }
    }
    handImg.onerror = () => { clearInterval(iv); setError('图片加载失败'); onLoadingChange?.(false) }
  }

  const reset = () => { onResultChange?.(null); onHandFileChange?.(null); onProgressChange?.(0); setError(null); setMode('capture') }

  const handleShapeSelect = (shape) => {
    if (shape === selectedShape) return
    setSelectedShape(shape)
    if (mode === 'result' && handFile && curNail && !loading) {
      startGenerate(undefined, shape)
    }
  }

  const SimulateButton = mode === 'confirm' ? (
    <button
      onClick={() => mockGenerate('模拟生成效果')}
      style={{
        position: 'absolute',
        left: 16,
        top: 116,
        zIndex: 30,
        padding: '5px 10px',
        borderRadius: 999,
        border: '1px solid rgba(255,255,255,0.18)',
        background: 'rgba(255,255,255,0.08)',
        color: 'rgba(255,255,255,0.58)',
        fontSize: 11,
        lineHeight: '14px',
        fontWeight: 500,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      模拟生成
    </button>
  ) : null

  // ═══════════════ 1. SystemBar 黑色版 h=44 ═══════════════
  const SystemBar = (
    <div style={{ maxWidth: 375, height: 44, padding: '0 16px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
      <img src="/icons/systembar-black.svg" alt="" style={{ width: '100%', height: 44 }} />
    </div>
  )

  // ═══════════════ 2. TopBar 375×56 ═══════════════
  const TopBar = (
    <div style={{ width: 375, height: 56, display: 'flex', alignItems: 'center', padding: '0 16px', flexShrink: 0 }}>
      <button onClick={onBack} style={{ width: 24, height: 24, flexShrink: 0, background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center' }}>
        <img src="/icons/back-white.svg" alt="返回" style={{ width: 24, height: 24 }} />
      </button>
      <span style={{ fontSize: 16, fontWeight: 500, color: 'white', marginLeft: 4 }}>试试看！</span>
    </div>
  )

  // ═══════════════ 3. Bubble+BottomFrame div 375×136 ═══════════════
  const HeroSection = ({ showShapes = true, disableShapes = false }) => {
    const shapeOverlay = <ShapeSelector selected={selectedShape} onSelect={handleShapeSelect} disabled={disableShapes} />
    return (
      <div style={{ width: '100%', maxWidth: 375, aspectRatio: '375 / 136', flexShrink: 0, position: 'relative' }}>
        {/* Bubble — 距框顶部4px，距左74px */}
        <div style={{ position: 'absolute', left: '19.75%', top: '2.95%', zIndex: 3, transform: 'translate(4px, 10px)' }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.8)', lineHeight: '16px', display: 'inline-block', minHeight: 16 }}>
            {bubbleText}
          </span>
        </div>
        {/* BottomFrame — 375×136，底对齐 */}
        <img src={frameImg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
        {/* 甲型资源 — 叠在底部框上，距底2px，距左67px */}
        {showShapes && (
          <div style={{ position: 'absolute', left: '18.9%', bottom: '1.47%', width: '66.4%', height: '48.53%', display: 'flex', justifyContent: 'flex-start', opacity: disableShapes ? 0.5 : 1, transform: 'translate(-4px, -4px)' }}>
            {shapeOverlay}
          </div>
        )}
      </div>
    )
  }

  // ═══════════════ 4. Viewfinder 327×428 ═══════════════
  const Viewfinder = ({ children, style }) => (
    <div style={{ width: 327, maxWidth: 'calc(100% - 48px)', height: 428, borderRadius: 24, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', flexShrink: 0, position: 'relative', ...style }}>
      {children}
      {mode !== 'result' && curNail && (
        <div style={{ position: 'absolute', top: 8, right: 8, width: 80, height: 80, borderRadius: 21, overflow: 'hidden', zIndex: 20 }}>
          <img src={curNail.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
    </div>
  )

  // ═══════════════ 5. BottomBar 327×80 大盒子 ═══════════════
  const BottomBar = ({ centerAction, centerIcon }) => (
    <div style={{ width: 327, maxWidth: 'calc(100% - 48px)', height: 80, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 24px' }}>
      <button onClick={() => inputRef.current.click()} style={{ width: 42, height: 42, background: 'none', border: 'none', padding: 0, flexShrink: 0 }}>
        <img src="/icons/btn-gallery.png" alt="相册" style={{ width: 42, height: 42 }} />
      </button>
      <button onClick={centerAction} style={{ width: 80, height: 80, flexShrink: 0, border: 'none', background: 'none', padding: 0 }}>
        <img src={centerIcon || "/icons/btn-shutter.png"} alt="" style={{ width: 80, height: 80 }} />
      </button>
      <button onClick={() => setLibraryOpen(true)} style={{ width: 42, height: 42, background: 'none', border: 'none', padding: 0, flexShrink: 0 }}>
        <img src="/icons/btn-library.png" alt="美甲库" style={{ width: 42, height: 42 }} />
      </button>
    </div>
  )

  const BottomSpacer = <div style={{ width: '100%', height: 32, background: '#000', flexShrink: 0 }} />

  const FileInputs = (<>
    <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
    <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
  </>)

  const EmptyViewfinder = (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <div style={{ position: 'relative', width: 80, height: 80 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: 18, height: 18, borderTop: '2px solid rgba(255,255,255,0.3)', borderLeft: '2px solid rgba(255,255,255,0.3)', borderTopLeftRadius: 4 }} />
        <div style={{ position: 'absolute', top: 0, right: 0, width: 18, height: 18, borderTop: '2px solid rgba(255,255,255,0.3)', borderRight: '2px solid rgba(255,255,255,0.3)', borderTopRightRadius: 4 }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: 18, height: 18, borderBottom: '2px solid rgba(255,255,255,0.3)', borderLeft: '2px solid rgba(255,255,255,0.3)', borderBottomLeftRadius: 4 }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, borderBottom: '2px solid rgba(255,255,255,0.3)', borderRight: '2px solid rgba(255,255,255,0.3)', borderBottomRightRadius: 4 }} />
      </div>
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>取景框</span>
    </div>
  )

  const LiveCameraView = (
    <>
      <video
        ref={cameraPreviewRef}
        autoPlay
        muted
        playsInline
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', background: '#111' }}
      />
      {cameraState !== 'ready' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'rgba(0,0,0,0.28)' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.88)', fontWeight: 500 }}>
            {cameraState === 'loading' ? '正在请求相机权限...' : '请允许访问当前设备相机'}
          </div>
          {cameraState === 'denied' && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
              允许后可直接在取景框中预览
            </div>
          )}
        </div>
      )}
    </>
  )

  const ProgressBar = (<>
    <div style={{ width: 327, height: 80, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 24px' }}>
      <div style={{ width: '100%', height: 11, borderRadius: 30, background: '#F1EAFF', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 30, width: `${progress || 0}%`, background: '#A062C9', transition: 'width 0.3s' }} />
      </div>
      <div style={{ paddingTop: 14, textAlign: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.5)', lineHeight: '14px' }}>
          {analyzeState === 'loading'
            ? `正在为您检测指甲位置，进度${Math.round(detectProgress)}%`
            : `正在为您绘制美甲款式，进度${Math.round(progress || 0)}%`}
        </span>
      </div>
    </div>
  </>)

  const ResultActions = (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 49, background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.5))', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16, paddingRight: 16, zIndex: 25 }}>
      <button style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
        <img src="/icons/下载图标.svg" alt="" style={{ width: 20, height: 20 }} /><span style={{ fontSize: 14, color: 'white' }}>下载</span>
      </button>
      <button style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
        <img src="/icons/分享图标.svg" alt="" style={{ width: 20, height: 20 }} /><span style={{ fontSize: 14, color: 'white' }}>分享</span>
      </button>
    </div>
  )

  const shouldShowDetectOverlay = mode === 'generating' && analyzeState !== 'detected' && analyzeState !== 'fallback'

  const DetectingOverlay = shouldShowDetectOverlay ? (
    <div style={{ position: 'absolute', inset: 0, zIndex: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: 'rgba(0,0,0,0.26)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {DETECTING_DOTS.map((dot, index) => (
          <div
            key={`${dot.x}-${dot.y}-${index}`}
            style={{
              position: 'absolute',
              left: `${dot.x * 100}%`,
              top: `${dot.y * 100}%`,
              width: dot.size,
              height: dot.size,
              marginLeft: -(dot.size / 2),
              marginTop: -(dot.size / 2),
              borderRadius: '50%',
              background: 'rgba(241,234,255,0.28)',
              boxShadow: '0 0 14px rgba(160,98,201,0.18)',
              animation: `detectPulse 1.8s ease-in-out ${dot.delay}ms infinite`,
            }}
          />
        ))}
      </div>
      <div style={{ position: 'relative', width: 54, height: 54, zIndex: 1 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(241,234,255,0.16)' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid transparent', borderTopColor: '#A062C9', animation: 'detectSpin 1s linear infinite' }} />
      </div>
      <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.88)', lineHeight: '16px' }}>手部细节检测中</div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', lineHeight: '14px' }}>检测完成后会开始逐指施工</div>
      <style>{`
        @keyframes detectSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes detectPulse {
          0%, 100% { transform: scale(0.82); opacity: 0.16; }
          50% { transform: scale(1.35); opacity: 0.52; }
        }
      `}</style>
    </div>
  ) : null

  const ResultSticker = null

  // ═══════════════ 组装 ═══════════════
  const pageContent = () => {
    switch (mode) {
      case 'capture':
        return (
          <>
            <HeroSection />
            <div style={{ height: 18, flexShrink: 0 }} />
            <Viewfinder>{hpUrl ? <img src={hpUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (cameraState === 'idle' || cameraState === 'loading' || cameraState === 'ready' || cameraState === 'denied' ? LiveCameraView : EmptyViewfinder)}</Viewfinder>
            <div style={{ height: 18, flexShrink: 0 }} />
            <BottomBar centerAction={() => { cameraRef.current.click(); if (hpUrl) setMode('confirm') }} />
            {BottomSpacer}
            {FileInputs}
          </>
        )
      case 'confirm':
        return (
          <>
            <HeroSection />
            <div style={{ height: 18, flexShrink: 0 }} />
            <Viewfinder>{hpUrl && <img src={hpUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}{SimulateButton}<button onClick={() => { onHandFileChange?.(null); setMode('capture') }} style={{ position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', zIndex: 25 }}><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2L12 12M12 2L2 12" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg></button></Viewfinder>
            <div style={{ height: 18, flexShrink: 0 }} />
            <BottomBar centerAction={startGenerate} centerIcon="/icons/btn-confirm.png" />
            {BottomSpacer}
            {FileInputs}
          </>
        )
      case 'generating':
        return (
          <>
            <HeroSection showShapes disableShapes />
            <div style={{ height: 18, flexShrink: 0 }} />
            <Viewfinder style={{ background: 'rgba(255,255,255,0.03)' }}>
              {generationBaseImage ? (
                <img
                  src={generationBaseImage}
                  alt=""
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: shouldShowDetectOverlay ? 0.72 : 0.5 }}
                />
              ) : (
                <div style={{ position: 'absolute', inset: 0, background: '#161616' }} />
              )}
              {analyzeState === 'detected' || analyzeState === 'fallback'
                ? <NailPaintingAnim points={nailPoints} active={mode === 'generating'} workerSrc="/icons/worker-potato.png" showDebugPoints={analyzeState === 'detected'} />
                : null}
              {DetectingOverlay}
            </Viewfinder>
            <div style={{ height: 18, flexShrink: 0 }} />
            {ProgressBar}
            {BottomSpacer}
            {error && <div style={{ margin: '8px 24px 0', padding: '8px 12px', borderRadius: 10, background: 'rgba(255,36,66,0.15)', border: '1px solid rgba(255,36,66,0.2)', color: '#FF6B8A', fontSize: 12 }}>{error}</div>}
          </>
        )
      case 'result':
        return (
          <>
            <HeroSection />
            <div style={{ height: 18, flexShrink: 0 }} />
            <Viewfinder style={{ background: 'transparent' }}>{result && <img src={result} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}{ResultSticker}{resultNotice && <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', padding: '7px 12px', borderRadius: 999, background: 'rgba(0,0,0,0.42)', color: 'rgba(255,255,255,0.82)', fontSize: 11, lineHeight: '14px', zIndex: 26, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', whiteSpace: 'nowrap' }}>{resultNotice}</div>}<button onClick={reset} style={{ position: 'absolute', top: 16, left: 16, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', zIndex: 25 }}><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2L12 12M12 2L2 12" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg></button>{ResultActions}</Viewfinder>
            <div style={{ height: 18, flexShrink: 0 }} />
            <BottomBar centerAction={reset} />
            {BottomSpacer}
          </>
        )
      default: return null
    }
  }

  return (
    <div style={{ fontFamily: "'PingFang SC', -apple-system, sans-serif", maxWidth: 375, margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#000', overflow: 'hidden' }}>
      {SystemBar}
      {TopBar}
      <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>{pageContent()}</div>
      <NailLibraryPanel selected={nailStyle} onSelect={n => { onNailStyleChange?.(n); setImgIdx(0) }} open={libraryOpen} onClose={() => setLibraryOpen(false)} />
    </div>
  )
}
