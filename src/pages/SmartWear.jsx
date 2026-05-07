import { useState, useRef, useEffect, useMemo } from 'react'
import NailLibraryPanel from '../components/NailLibraryPanel'
import { loadLibrary, saveLibrary } from '../utils/nailLibrary'

/* ── 内联 Icon SVG ── */
const IconAlbum = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="16" height="16" rx="3" stroke="rgba(0,0,0,0.8)" strokeWidth="1.5"/><circle cx="6.5" cy="6.5" r="1.5" fill="rgba(0,0,0,0.8)"/><path d="M2 14L7 10L11 13L14 9L18 14" stroke="rgba(0,0,0,0.8)" strokeWidth="1.5" strokeLinejoin="round"/></svg>
)
const IconClose = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2L12 12M12 2L2 12" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
)
const IconCheck = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 13L10 18L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
)

const FUNNY_TEXTS = [
  '正在为你精心穿戴中...',
  '指尖魔法酝酿中...',
  '美甲精灵正在工作...',
  '别急，好看的需要点时间~',
  '手指也要穿新衣...',
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
  const [funnyIdx, setFunnyIdx] = useState(0)
  const [error, setError] = useState(null)
  const [imgIdx, setImgIdx] = useState(0)
  const [mode, setMode] = useState('capture') // capture | confirm | generating | result
  const inputRef = useRef()
  const cameraRef = useRef()

  useEffect(() => { if (result) setMode('result'); else if (loading) setMode('generating') }, [result, loading])

  const groupImages = useMemo(() => {
    if (!nailStyle?.groupId) return nailStyle ? [nailStyle] : []
    const all = loadLibrary().filter(n => !n.category || n.category === 'nail')
    return all.filter(n => n.groupId === nailStyle.groupId)
  }, [nailStyle])
  const curNail = groupImages[imgIdx] || nailStyle
  useEffect(() => { setImgIdx(0) }, [nailStyle?.groupId])

  // 趣味文案轮播
  useEffect(() => {
    if (mode !== 'generating') return
    const t = setInterval(() => setFunnyIdx(i => (i + 1) % FUNNY_TEXTS.length), 2500)
    return () => clearInterval(t)
  }, [mode])

  // 自动导入帖子款式
  useEffect(() => {
    if (!initialNails?.length) return
    const existing = loadLibrary(), existingSet = new Set(existing.map(n => n.src))
    const gid = 'post_' + Date.now()
    const toAdd = initialNails.filter(s => !existingSet.has(s)).map((s, i) =>
      ({ id: Date.now() + i, src: s, groupId: gid, groupLabel: '帖子导入', category: 'nail' }))
    if (toAdd.length) saveLibrary([...existing, ...toAdd])
    // 从帖子进入时，始终选中帖子的第一张图作为当前款式
    const firstSrc = initialNails[0]
    const entry = existing.find(n => n.src === firstSrc) || toAdd.find(n => n.src === firstSrc) || toAdd[0] || existing.find(n => n.src === firstSrc)
    if (entry && entry.id !== nailStyle?.id) { onNailStyleChange?.(entry); setImgIdx(0) }
  }, [])
  // 款式组内切换图片时同步到 parent
  useEffect(() => { if (curNail && curNail.id !== nailStyle?.id) onNailStyleChange?.(curNail) }, [curNail?.id])

  const handleFile = (f) => { if (f?.type.startsWith('image/')) { onHandFileChange?.(f); setMode('confirm') } }

  // 进入拍摄页时清空旧数据
  const goToCapture = () => { onHandFileChange?.(null); onResultChange?.(null); onProgressChange?.(0); setError(null); setMode('capture') }

  const prevImg = () => { if (groupImages.length > 1) setImgIdx(i => (i - 1 + groupImages.length) % groupImages.length) }
  const nextImg = () => { if (groupImages.length > 1) setImgIdx(i => (i + 1) % groupImages.length) }

  const startGenerate = async (forcedProvider) => {
    if (!handFile || !curNail) return
    const p = forcedProvider || provider
    onLoadingChange?.(true); setError(null); onResultChange?.(null); onProgressChange?.(0); setMode('generating')
    let prog = 0
    const iv = setInterval(() => { prog = Math.min(prog + Math.random() * 15, 90); onProgressChange?.(prog) }, 2000)
    const form = new FormData(); form.append('hand', handFile); form.append('provider', p)
    if (curNail.src.startsWith('data:')) {
      const arr = curNail.src.split(','), mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
      form.append('nail', new Blob([Uint8Array.from(atob(arr[1]), c => c.charCodeAt(0))], { type: mime }), 'nail.jpg')
    } else form.append('nail_url', curNail.src)
    try {
      const r = await fetch('/api/cyber-nails', { method: 'POST', body: form }), d = await r.json()
      if (!r.ok) throw new Error(d.detail || '生成失败')
      onResultChange?.(d.image); onProgressChange?.(100)
    } catch (e) { setError(e.message) }
    finally { clearInterval(iv); setTimeout(() => onLoadingChange?.(false), 500) }
  }

  const mockGenerate = () => {
    if (!handFile) return
    onLoadingChange?.(true); onResultChange?.(null); onProgressChange?.(0); setMode('generating')
    let pg = 0
    const iv = setInterval(() => { pg = Math.min(pg + Math.random() * 25, 90); onProgressChange?.(pg) }, 800)
    setTimeout(() => { clearInterval(iv); onProgressChange?.(100)
      const u = URL.createObjectURL(handFile), c = document.createElement('canvas'); c.width = 400; c.height = 500
      const ctx = c.getContext('2d'), img = new Image(); img.src = u; img.onload = () => {
        ctx.drawImage(img, 0, 0, 400, 500)
        if (curNail?.src) { const n = new Image(); n.crossOrigin = 'anonymous'; n.src = curNail.src
          n.onload = () => { ctx.globalAlpha = 0.7; ctx.drawImage(n, 260, 30, 120, 120); onResultChange?.(c.toDataURL()); onLoadingChange?.(false) }
          n.onerror = () => { onResultChange?.(c.toDataURL()); onLoadingChange?.(false) }
        } else { onResultChange?.(c.toDataURL()); onLoadingChange?.(false) }
      }
    }, 2000)
  }

  const reset = () => { onResultChange?.(null); onHandFileChange?.(null); onProgressChange?.(0); setError(null); setMode('capture') }
  const hpUrl = handFile ? URL.createObjectURL(handFile) : null

  const NAV_H = 52

  /* ━━━━━━━━━━━━ 款式选择区 ━━━━━━━━━━━━ */
  const StyleSelector = ({ highlight }) => (
    <div style={{ display: 'flex', alignItems: 'center', padding: '8px 24px', gap: 11, flexShrink: 0 }}>
      {/* 当前款式缩略图 (Figma: 100×100, r=16) */}
      <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
        {curNail ? (
          <div style={{ width: 100, height: 100, borderRadius: 16, overflow: 'hidden',
            border: highlight ? '1.91px solid #9F61C9' : '1px solid rgba(0,0,0,0.08)' }}>
            <img src={curNail.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} />
          </div>
        ) : (
          <div style={{ width: 100, height: 100, borderRadius: 16, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'rgba(0,0,0,0.2)' }}>暂无款式</div>
        )}
        {/* "当前款式" Tag (Figma: 48×16, r=4, bg rgba(0,0,0,0.45), top-left overlay) */}
        <div style={{ position: 'absolute', top: 8, left: 8, height: 16, padding: '1px 4px', borderRadius: 4,
          background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 10, lineHeight: '14px', color: 'white' }}>当前款式</span>
        </div>
        {/* 左右箭头 */}
        {groupImages.length > 1 && (<>
          <button onClick={prevImg} style={{ position: 'absolute', left: -10, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, borderRadius: '50%', background: 'white', border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="3"><polyline points="15 18 9 12 15 6"/></svg></button>
          <button onClick={nextImg} style={{ position: 'absolute', right: -10, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, borderRadius: '50%', background: 'white', border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="3"><polyline points="9 18 15 12 9 6"/></svg></button>
        </>)}
      </div>

      {/* 美甲库入口卡片 (Figma: 215×100, r=16, 0.5 opacity, drop-shadow) */}
      <button onClick={() => setLibraryOpen(true)} style={{
        flex: 1, height: 100, borderRadius: 16, border: '1px solid #EAEAEA',
        background: 'white', position: 'relative', overflow: 'hidden',
        opacity: 0.5, boxShadow: '0px 2px 7px rgba(0,0,0,0.25)',
      }}>
        <div style={{ position: 'absolute', left: 18, top: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#141414', lineHeight: '20px', opacity: 0.84 }}>美甲库</span>
        </div>
        <div style={{ position: 'absolute', left: 18, top: 46 }}>
          <span style={{ fontSize: 14, color: 'rgba(20,20,20,0.4)', lineHeight: '20px' }}>近期浏览、收藏、热门的款式</span>
        </div>
        {/* 右侧三张错落美甲图 (Figma: 32~36px, r≈8.6, stroke #83F2DF) */}
        <div style={{ position: 'absolute', right: 23, top: 14, width: 32, height: 32, borderRadius: 8.6,
          border: '0.95px solid #83F2DF', background: '#f0f0f0' }} />
        <div style={{ position: 'absolute', right: 41, top: 36, width: 36, height: 36, borderRadius: 8.6,
          border: '0.95px solid #83F2DF', background: '#e8e8e8' }} />
        <div style={{ position: 'absolute', right: 16, top: 52, width: 36, height: 36, borderRadius: 8.6,
          border: '0.95px solid #83F2DF', background: '#ddd' }} />
      </button>
    </div>
  )

  /* ━━━━━━━━━━━━ 取景框 (Figma: 327×463, r=16) ━━━━━━━━━━━━ */
  const Viewfinder = ({ children, style }) => (
    <div style={{ position: 'relative', margin: '0 24px', borderRadius: 16, background: '#FAFAFA',
      flex: 1, overflow: 'hidden', ...style }}>
      {children}
    </div>
  )

  /* ━━━━━━━━━━━━ 顶栏 ━━━━━━━━━━━━ */
  const TopBar = (
    <>
      <div className="shrink-0"><img src="/icons/systembar.svg" alt="" style={{ width: 375, height: 44 }} /></div>
      <div style={{ display: 'flex', alignItems: 'center', height: NAV_H, padding: '11px 16px', flexShrink: 0 }}>
        <button onClick={onBack} style={{ width: 24, height: 24, flexShrink: 0 }}>
          <img src="/icons/back.svg" width={24} height={24} alt="back" />
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{ fontSize: 16, fontWeight: 500, color: 'rgba(0,0,0,0.8)' }}>试同款</span>
        </div>
        <div style={{ width: 24, flexShrink: 0 }} />
      </div>
    </>
  )

  /* ═══════════════════════ 1-拍摄页 ═══════════════════════ */
  const CapturePage = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <StyleSelector highlight />
      <Viewfinder>
        {hpUrl ? <img src={hpUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ position: 'relative', width: 80, height: 80 }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: 18, height: 18, borderTop: '2.5px solid #FF2442', borderLeft: '2.5px solid #FF2442', borderTopLeftRadius: 3 }} />
              <div style={{ position: 'absolute', top: 0, right: 0, width: 18, height: 18, borderTop: '2.5px solid #FF2442', borderRight: '2.5px solid #FF2442', borderTopRightRadius: 3 }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: 18, height: 18, borderBottom: '2.5px solid #FF2442', borderLeft: '2.5px solid #FF2442', borderBottomLeftRadius: 3 }} />
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, borderBottom: '2.5px solid #FF2442', borderRight: '2.5px solid #FF2442', borderBottomRightRadius: 3 }} />
            </div>
            <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.18)' }}>取景框</span>
          </div>
        )}
      </Viewfinder>

      {/* Figma: 拍摄按钮区 — 80×80 快门 + 50×50 相册 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 24px 0', gap: 16, flexShrink: 0 }}>
        {/* 相册按钮 (Figma: 50×50, bg #FAFAFA) */}
        <button onClick={() => inputRef.current.click()} style={{ width: 50, height: 50, borderRadius: '50%', background: '#FAFAFA', border: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <IconAlbum />
        </button>
        {/* 快门按钮 (Figma: 80x80, 渐变外框 + #83F2DF 内圆) */}
        <button onClick={() => { cameraRef.current.click(); if (hpUrl) setMode('confirm') }} style={{ width: 80, height: 80, flexShrink: 0, border: 'none', background: 'none', padding: 0, position: 'relative' }}>
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <defs>
              <linearGradient id="shutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="15%" stopColor="#F0FC96"/>
                <stop offset="54%" stopColor="#83F2DF"/>
                <stop offset="100%" stopColor="#E5D7FF"/>
              </linearGradient>
            </defs>
            <circle cx="40" cy="40" r="37" fill="none" stroke="url(#shutGrad)" strokeWidth="4"/>
            <circle cx="40" cy="40" r="32" fill="#83F2DF"/>
          </svg>
        </button>
        <div style={{ width: 50, flexShrink: 0 }} />
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
    </div>
  )

  /* ═══════════════════════ 2-确定生成页 ═══════════════════════ */
  const ConfirmPage = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <StyleSelector highlight={false} />
      <Viewfinder>
        {hpUrl && <img src={hpUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        {/* 关闭/重拍 (Figma: top-left 24×24) */}
        <button onClick={() => { onHandFileChange?.(null); setMode('capture') }} style={{ position: 'absolute', top: 10, left: 10, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
          <IconClose />
        </button>
      </Viewfinder>

      {/* 底部按钮区 (Figma: 左=重选照片 50×50, 中=确认生成 80×80) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 24px 0', gap: 16, flexShrink: 0 }}>
        <button onClick={() => inputRef.current.click()} style={{ width: 50, height: 50, borderRadius: '50%', background: '#FAFAFA', border: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <IconAlbum />
        </button>
        {/* 确认生成按钮 (Figma: 80×80) — 默认走跳过模型 */}
        <button onClick={mockGenerate} style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: 'none' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#83F2DF', border: '4px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconCheck />
          </div>
        </button>
        <div style={{ width: 50, flexShrink: 0 }} />
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
    </div>
  )

  /* ═══════════════════════ 生成中 ═══════════════════════ */
  const GeneratingPage = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <StyleSelector highlight={false} />
      <Viewfinder style={{ background: '#f5f5f5' }}>
        {hpUrl && <img src={hpUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(2px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56 }}>
            <svg className="animate-spin" width="56" height="56" viewBox="0 0 56 56"><defs><linearGradient id="gg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FF2442"/><stop offset="50%" stopColor="#FF6B8A"/><stop offset="100%" stopColor="#FFB3C6"/></linearGradient></defs><circle cx="28" cy="28" r="22" fill="none" stroke="#f0f0f0" strokeWidth="3"/><circle cx="28" cy="28" r="22" fill="none" stroke="url(#gg)" strokeWidth="3" strokeLinecap="round" strokeDasharray="80 138"/></svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(0,0,0,0.55)' }}>{FUNNY_TEXTS[funnyIdx]}</span>
          <div style={{ width: 140, height: 4, borderRadius: 2, background: '#eee', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 2, width: `${progress || 0}%`, background: 'linear-gradient(90deg, #FF2442, #FF6B8A)', transition: 'width 0.5s' }} />
          </div>
          <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.3)' }}>预计还需 {Math.max(1, Math.round((100 - (progress || 0)) / 15))} 秒</span>
        </div>
      </Viewfinder>
      {error && (
        <div style={{ margin: '10px 24px 0', padding: '8px 12px', borderRadius: 10, background: '#fff5f5', border: '1px solid rgba(255,36,66,0.1)', color: '#FF2442', fontSize: 12 }}>{error}</div>
      )}
    </div>
  )

  /* ═══════════════════════ 结果页 ═══════════════════════ */
  const ResultPage = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <StyleSelector highlight={false} />
      <Viewfinder>
        {result && <img src={result} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
        {/* 底部黑色渐变 (53px 高，保证 icon 清晰可见) */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 53,
          background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.5))' }} />
        {/* 关闭按钮 */}
        <button onClick={reset} style={{ position: 'absolute', top: 10, left: 10, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
          <IconClose />
        </button>
        {/* 下载/分享 — bottom-right */}
        <div style={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/icons/result-download.svg" width={20} height={20} alt="download" />
          <img src="/icons/result-share.svg" width={20} height={20} alt="share" />
        </div>
      </Viewfinder>

      {/* 两个胶囊操作按钮 */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 24px 0', gap: 7, flexShrink: 0 }}>
        <button onClick={() => onBuySimilar?.()} style={{ height: 44, padding: '10px 20px', borderRadius: 9999, border: '0.5px solid rgba(0,0,0,0.2)', background: 'white', display: 'flex', alignItems: 'center', gap: 4 }}>
          <img src="/icons/buy-similar.svg" width={20} height={20} alt="" />
          <span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(0,0,0,0.8)', lineHeight: '20px', whiteSpace: 'nowrap' }}>买同款穿戴甲</span>
        </button>
        <button onClick={() => onFindShops?.()} style={{ height: 44, padding: '10px 20px', borderRadius: 9999, border: '0.5px solid rgba(0,0,0,0.2)', background: 'white', display: 'flex', alignItems: 'center', gap: 4 }}>
          <img src="/icons/search-nearby.svg" width={20} height={20} alt="" />
          <span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(0,0,0,0.8)', lineHeight: '20px', whiteSpace: 'nowrap' }}>搜附近美甲店</span>
        </button>
      </div>
    </div>
  )

  /* ═══════════════════════ 测试面板 ═══════════════════════ */
  const TestPanel = showPanel ? (
    <div style={{ position: 'fixed', top: 80, right: 0, width: 180, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderTopLeftRadius: 12, borderBottomLeftRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.08)', padding: 12, zIndex: 50 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#333' }}>模型测试</span>
        <button onClick={() => setShowPanel(false)} style={{ fontSize: 11, color: '#999', background: 'none', border: 'none' }}>收起</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button onClick={() => { onProviderChange?.('openai'); startGenerate('openai') }} disabled={!handFile || !curNail}
          className={provider === 'openai' ? 'bg-[rgba(52,199,89,0.15)] text-[#34c759] border border-[#34c759]/30' : 'bg-[#f5f5f5] text-[rgba(0,0,0,0.4)] border border-[#eee]'}
          style={{ width: '100%', padding: '8px', borderRadius: 8, fontSize: 11, fontWeight: 500, opacity: (!handFile || !curNail) ? 0.4 : 1 }}>GPT</button>
        <button onClick={() => { onProviderChange?.('grok'); startGenerate('grok') }} disabled={!handFile || !curNail}
          className={provider === 'grok' ? 'bg-[rgba(255,149,0,0.15)] text-[#ff9500] border border-[#ff9500]/30' : 'bg-[#f5f5f5] text-[rgba(0,0,0,0.4)] border border-[#eee]'}
          style={{ width: '100%', padding: '8px', borderRadius: 8, fontSize: 11, fontWeight: 500, opacity: (!handFile || !curNail) ? 0.4 : 1 }}>Grok</button>
        <button onClick={mockGenerate} disabled={!handFile}
          style={{ width: '100%', padding: '8px', borderRadius: 8, fontSize: 11, fontWeight: 500, background: '#f5f5f5', color: 'rgba(0,0,0,0.5)', border: '1px solid #eee', opacity: !handFile ? 0.4 : 1 }}>跳过模型</button>
        <button onClick={onUpload}
          style={{ width: '100%', padding: '8px', borderRadius: 8, fontSize: 11, fontWeight: 500, background: '#f5f5f5', color: 'rgba(0,0,0,0.45)', border: '1px solid #eee' }}>+ 素材上传</button>
      </div>
    </div>
  ) : null

  /* ═══════════════════════ 组装 ═══════════════════════ */
  return (
    <div style={{ fontFamily: "'PingFang SC', -apple-system, sans-serif", maxWidth: 375, margin: '0 auto',
      height: '100vh', display: 'flex', flexDirection: 'column', background: 'white', overflow: 'hidden' }}>
      {TopBar}
      {mode === 'capture' && CapturePage}
      {mode === 'confirm' && ConfirmPage}
      {mode === 'generating' && GeneratingPage}
      {mode === 'result' && ResultPage}
      {/* 测试面板浮动入口 */}
      {!showPanel && (
        <button onClick={() => setShowPanel(true)}
          style={{ position: 'fixed', right: 0, top: 120, width: 28, height: 48, background: 'rgba(255,255,255,0.9)', borderTopLeftRadius: 8, borderBottomLeftRadius: 8, border: '1px solid #eee', borderRight: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      )}
      {TestPanel}
      <NailLibraryPanel selected={nailStyle} onSelect={n => { onNailStyleChange?.(n); setImgIdx(0) }} open={libraryOpen} onClose={() => setLibraryOpen(false)} />
      {/* 全局底部留白 32px */}
      <div style={{ height: 32, background: 'white', flexShrink: 0 }} />
    </div>
  )
}
