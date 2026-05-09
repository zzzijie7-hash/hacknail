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
  const [showPanel, setShowPanel] = useState(false)
  const [error, setError] = useState(null)
  const [imgIdx, setImgIdx] = useState(0)
  const [mode, setMode] = useState('capture')
  const [selectedShape, setSelectedShape] = useState('squoval')
  const [nailPoints, setNailPoints] = useState(MOCK_NAIL_POINTS)
  const [analyzeState, setAnalyzeState] = useState('idle')
  const inputRef = useRef()
  const cameraRef = useRef()

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

  const handleFile = (f) => { if (f?.type.startsWith('image/')) { onHandFileChange?.(f); setMode('confirm') } }

  const [hpUrl, setHpUrl] = useState(null)
  useEffect(() => {
    if (!handFile) { setHpUrl(null); return }
    const url = URL.createObjectURL(handFile)
    setHpUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [handFile])

  useEffect(() => {
    if (!handFile) {
      setNailPoints(MOCK_NAIL_POINTS)
      setAnalyzeState('idle')
      return
    }

    let cancelled = false

    const analyzeHand = async () => {
      setAnalyzeState('loading')
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

        if (cancelled) return
        setNailPoints(detected.length ? detected : MOCK_NAIL_POINTS)
        setAnalyzeState(detected.length ? 'detected' : 'fallback')
      } catch (e) {
        if (cancelled) return
        console.warn('[analyze-hand fallback]', e)
        setNailPoints(MOCK_NAIL_POINTS)
        setAnalyzeState('fallback')
      }
    }

    analyzeHand()

    return () => {
      cancelled = true
    }
  }, [handFile])

  const frameImg = mode === 'generating' ? '/icons/frame-generating.png'
    : mode === 'result' ? '/icons/frame-after.png'
    : '/icons/frame-before.png'

  const startGenerate = async (forcedProvider) => {
    if (!handFile || !curNail) return
    onLoadingChange?.(true); setError(null); onResultChange?.(null); onProgressChange?.(0); setMode('generating')
    let prog = 0
    const iv = setInterval(() => { prog = Math.min(prog + Math.random() * 8, 90); onProgressChange?.(prog) }, 800)
    const form = new FormData()
    form.append('hand', handFile); form.append('provider', forcedProvider || provider); form.append('nail_shape', selectedShape)
    if (curNail.src.startsWith('data:')) {
      const arr = curNail.src.split(','), mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
      form.append('nail', new Blob([Uint8Array.from(atob(arr[1]), c => c.charCodeAt(0))], { type: mime }), 'nail.jpg')
    } else form.append('nail_url', curNail.src)
    try {
      const r = await fetch('/api/cyber-nails', { method: 'POST', body: form })
      const d = await r.json(); if (!r.ok) throw new Error(d.detail || '生成失败')
      onResultChange?.(d.image); onProgressChange?.(100)
    } catch (e) { setError(e.message) }
    finally { clearInterval(iv); setTimeout(() => onLoadingChange?.(false), 500) }
  }

  const mockGenerate = () => {
    if (!handFile || !curNail) return
    onLoadingChange?.(true); setError(null); onResultChange?.(null); onProgressChange?.(0); setMode('generating')
    let pg = 0
    const iv = setInterval(() => { pg = Math.min(pg + Math.random() * 20, 90); onProgressChange?.(pg) }, 600)
    const hp = hpUrl
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

  // ═══════════════ 3. Bubble+BottomFrame div 375×116 ═══════════════
  const HeroSection = ({ showShapes = true, disableShapes = false }) => {
    const shapeOverlay = <ShapeSelector selected={selectedShape} onSelect={setSelectedShape} disabled={disableShapes} />
    return (
      <div style={{ width: 375, height: 116, flexShrink: 0, position: 'relative' }}>
        {/* Bubble — 距右上角4px */}
        <div style={{ position: 'absolute', right: 4, top: 4, zIndex: 3 }}>
          <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 36, padding: '10px 16px', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'inline-block' }}>
            <span style={{ fontSize: 10, fontWeight: 500, color: 'white', lineHeight: '14px' }}>
              {mode === 'result' ? '点击仍可切换查看不同甲型效果哦～' : SHAPE_BUBBLES[selectedShape] || SHAPE_BUBBLES.squoval}
            </span>
          </div>
        </div>
        {/* BottomFrame — 底对齐div，距左25px */}
        <img src={frameImg} alt="" style={{ position: 'absolute', left: 25, bottom: 0, width: 298, height: 102 }} />
        {/* 甲型卡片 — 从bottomframe拿出，距div底部2px，左侧67px */}
        {showShapes && (
          <div style={{ position: 'absolute', left: 67, bottom: 0, width: 298 - (67 - 25), display: 'flex', justifyContent: 'flex-end', paddingRight: 19, opacity: disableShapes ? 0.92 : 1 }}>
            {shapeOverlay}
          </div>
        )}
      </div>
    )
  }

  // ═══════════════ 4. Viewfinder 327×428 ═══════════════
  const Viewfinder = ({ children, style }) => (
    <div style={{ width: 327, height: 428, borderRadius: 24, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', flexShrink: 0, position: 'relative', margin: '20px 24px', ...style }}>
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
    <div style={{ width: 327, height: 80, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 24px' }}>
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

  const ProgressBar = (<>
    <div style={{ width: 327, height: 80, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 24px' }}>
      <div style={{ width: '100%', height: 11, borderRadius: 30, background: '#F1EAFF', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 30, width: `${progress || 0}%`, background: '#A062C9', transition: 'width 0.3s' }} />
      </div>
      <div style={{ paddingTop: 8, textAlign: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.5)', lineHeight: '14px' }}>
          薯薯正在卖力做美甲，大概还需要{Math.max(1, Math.round((100 - (progress || 0)) / 10))}s...
        </span>
      </div>
      <div style={{ paddingTop: 4, textAlign: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.42)', lineHeight: '14px' }}>
          {analyzeState === 'loading'
            ? '正在识别手部检测点...'
            : analyzeState === 'detected'
              ? `已接入 ${nailPoints.length} 个真实检测点`
              : `正在使用 ${nailPoints.length} 个模拟检测点`}
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

  const TestPanel = showPanel ? (
    <div style={{ position: 'fixed', top: 80, right: 0, width: 180, background: 'rgba(30,30,30,0.95)', backdropFilter: 'blur(12px)', borderTopLeftRadius: 12, borderBottomLeftRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.3)', padding: 12, zIndex: 50 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#ccc' }}>模型测试</span>
        <button onClick={() => setShowPanel(false)} style={{ fontSize: 11, color: '#999', background: 'none', border: 'none' }}>收起</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button onClick={() => { onProviderChange?.('openai'); startGenerate('openai') }} disabled={!handFile || !curNail}
          className={provider === 'openai' ? 'bg-[rgba(52,199,89,0.15)] text-[#34c759] border border-[#34c759]/30' : 'bg-[#333] text-[#999] border border-[#444]'}
          style={{ width: '100%', padding: '8px', borderRadius: 8, fontSize: 11, fontWeight: 500, opacity: (!handFile || !curNail) ? 0.4 : 1 }}>GPT</button>
        <button onClick={() => { onProviderChange?.('grok'); startGenerate('grok') }} disabled={!handFile || !curNail}
          className={provider === 'grok' ? 'bg-[rgba(255,149,0,0.15)] text-[#ff9500] border border-[#ff9500]/30' : 'bg-[#333] text-[#999] border border-[#444]'}
          style={{ width: '100%', padding: '8px', borderRadius: 8, fontSize: 11, fontWeight: 500, opacity: (!handFile || !curNail) ? 0.4 : 1 }}>Grok</button>
        <button onClick={mockGenerate} disabled={!handFile}
          style={{ width: '100%', padding: '8px', borderRadius: 8, fontSize: 11, fontWeight: 500, background: '#333', color: '#999', border: '1px solid #444', opacity: !handFile ? 0.4 : 1 }}>跳过模型</button>
        <button onClick={onUpload}
          style={{ width: '100%', padding: '8px', borderRadius: 8, fontSize: 11, fontWeight: 500, background: '#333', color: '#999', border: '1px solid #444' }}>+ 素材上传</button>
      </div>
    </div>
  ) : null

  // ═══════════════ 组装 ═══════════════
  const pageContent = () => {
    switch (mode) {
      case 'capture':
        return (<><HeroSection /><Viewfinder>{hpUrl ? <img src={hpUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : EmptyViewfinder}</Viewfinder><BottomBar centerAction={() => { cameraRef.current.click(); if (hpUrl) setMode('confirm') }} />{FileInputs}</>)
      case 'confirm':
        return (<><HeroSection /><Viewfinder>{hpUrl && <img src={hpUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}<button onClick={() => { onHandFileChange?.(null); setMode('capture') }} style={{ position: 'absolute', top: 10, left: 10, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', zIndex: 25 }}><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2L12 12M12 2L2 12" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg></button></Viewfinder><BottomBar centerAction={startGenerate} centerIcon="/icons/btn-confirm.png" />{FileInputs}</>)
      case 'generating':
        return (<><HeroSection showShapes disableShapes /><Viewfinder style={{ background: 'rgba(255,255,255,0.03)' }}>{hpUrl && <img src={hpUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />}<NailPaintingAnim points={nailPoints} active={mode === 'generating'} workerSrc="/icons/worker-potato.png" /></Viewfinder>{ProgressBar}{error && <div style={{ margin: '8px 24px 0', padding: '8px 12px', borderRadius: 10, background: 'rgba(255,36,66,0.15)', border: '1px solid rgba(255,36,66,0.2)', color: '#FF6B8A', fontSize: 12 }}>{error}</div>}</>)
      case 'result':
        return (<><HeroSection /><Viewfinder style={{ background: 'transparent' }}>{result && <img src={result} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}<button onClick={reset} style={{ position: 'absolute', top: 16, left: 16, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', zIndex: 25 }}><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2L12 12M12 2L2 12" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg></button>{ResultActions}</Viewfinder></>)
      default: return null
    }
  }

  return (
    <div style={{ fontFamily: "'PingFang SC', -apple-system, sans-serif", maxWidth: 375, margin: '0 auto', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#000', overflow: 'hidden' }}>
      {SystemBar}
      {TopBar}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>{pageContent()}</div>
      <NailLibraryPanel selected={nailStyle} onSelect={n => { onNailStyleChange?.(n); setImgIdx(0) }} open={libraryOpen} onClose={() => setLibraryOpen(false)} />
      {!showPanel && (
        <button onClick={() => setShowPanel(true)} style={{ position: 'fixed', right: 0, top: 120, width: 28, height: 48, background: 'rgba(30,30,30,0.9)', borderTopLeftRadius: 8, borderBottomLeftRadius: 8, border: '1px solid #444', borderRight: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      )}
      {TestPanel}
    </div>
  )
}
