import { useState, useRef, useEffect, useMemo } from 'react'
import NailLibraryPanel from '../components/NailLibraryPanel'
import LoadingAnim from '../components/LoadingAnim'
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
  const [mode, setMode] = useState('capture') // capture | confirm | generating | result
  const [sheet, setSheet] = useState(null) // null | 'buy' | 'shops'
  const [sheetFull, setSheetFull] = useState(false) // 半屏 / 全屏
  const [subPage, setSubPage] = useState(null) // null | 'product' | 'chat' — 商品详情/私信
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
          <div style={{ width: 100, height: 100, borderRadius: 16, overflow: 'hidden' }}>
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

      {/* 美甲库入口卡片 (Figma: 215×100, r=16, border #EAEAEA) */}
      <button onClick={() => setLibraryOpen(true)} style={{
        flex: 1, height: 100, borderRadius: 16, border: '1px solid #EAEAEA',
        background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 18px', boxShadow: '0px 2px 7px rgba(0,0,0,0.06)', overflow: 'hidden',
      }}>
        <div style={{ textAlign: 'left', flexShrink: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#141414', lineHeight: '20px', marginBottom: 6 }}>美甲库</div>
          <div style={{ fontSize: 14, color: 'rgba(20,20,20,0.4)', lineHeight: '19px', maxWidth: 130 }}>
            近期浏览、收藏、<br />热门的款式
          </div>
        </div>
        {/* 右侧三张错落美甲图 (Figma: 32~36px, r≈9, stroke #83F2DF, 图2/3有±8°旋转) */}
        <div style={{ position: 'relative', width: 70, height: 70, flexShrink: 0 }}>
          <div style={{ position: 'absolute', right: 30, top: 0, width: 32, height: 32, borderRadius: 8.6,
            border: '0.95px solid #83F2DF', overflow: 'hidden' }}>
            <img src="/icons/nail-lib-1.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ position: 'absolute', right: 20, top: 18, width: 36, height: 36, borderRadius: 8.6,
            border: '0.95px solid #83F2DF', overflow: 'hidden', transform: 'rotate(-8deg)' }}>
            <img src="/icons/nail-lib-2.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ position: 'absolute', right: 0, top: 36, width: 36, height: 36, borderRadius: 8.6,
            border: '0.95px solid #83F2DF', overflow: 'hidden', transform: 'rotate(8deg)' }}>
            <img src="/icons/nail-lib-3.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
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
    <div style={{ flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', height: NAV_H, padding: '11px 16px', background: 'white' }}>
        <button onClick={onBack} style={{ width: 24, height: 24, flexShrink: 0, background: 'none', border: 'none', padding: 0 }}>
          <svg width="23" height="23" viewBox="0 0 23 23" fill="none"><path d="M15 18L9 12L15 6" stroke="rgba(0,0,0,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{ fontSize: 16, fontWeight: 500, color: 'rgba(0,0,0,0.8)' }}>试同款</span>
        </div>
        <div style={{ width: 24, flexShrink: 0 }} />
      </div>
    </div>
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

      {/* Figma: 底部三按钮 — 左=50px相册, 中=80px快门, 右=50px占位 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px 0', flexShrink: 0 }}>
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

      {/* Figma: 底部三按钮 — 左=50px相册, 中=80px确认, 右=50px占位 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px 0', flexShrink: 0 }}>
        <button onClick={() => inputRef.current.click()} style={{ width: 50, height: 50, borderRadius: '50%', background: '#FAFAFA', border: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <IconAlbum />
        </button>
        {/* 确认生成按钮 — 和拍摄页快门样式一致，上方叠加勾图标 */}
        <button onClick={mockGenerate} style={{ width: 80, height: 80, flexShrink: 0, border: 'none', background: 'none', padding: 0, position: 'relative' }}>
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <defs>
              <linearGradient id="confirmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="15%" stopColor="#F0FC96"/>
                <stop offset="54%" stopColor="#83F2DF"/>
                <stop offset="100%" stopColor="#E5D7FF"/>
              </linearGradient>
            </defs>
            <circle cx="40" cy="40" r="37" fill="none" stroke="url(#confirmGrad)" strokeWidth="4"/>
            <circle cx="40" cy="40" r="32" fill="#83F2DF"/>
          </svg>
          {/* 勾图标叠加在按钮上方 */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
      <Viewfinder style={{ background: '#fcfcfc' }}>
        {hpUrl && <img src={hpUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.55)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <LoadingAnim category="nail" size={56} />
          <div style={{ width: 140, height: 3, borderRadius: 2, background: '#eee', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 2, width: `${progress || 0}%`,
              background: 'linear-gradient(90deg, #FF2442, #FF6B8A)', transition: 'width 0.4s' }} />
          </div>
          <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.3)' }}>
            预计还需 {Math.max(1, Math.round((100 - (progress || 0)) / 12))} 秒
          </span>
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
        {/* 关闭按钮 (Figma: 24×24 dark ellipse at top-left of image) */}
        <button onClick={reset} style={{ position: 'absolute', top: 16, left: 16, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
          <IconClose />
        </button>
        {/* Figma: 底部信息栏 327×49，覆盖图片底部，含下载/分享 */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 49,
          background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.5))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          {/* 下载 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 20, height: 20, background: '#999', borderRadius: 3 }} />
            <span style={{ fontSize: 14, color: 'white' }}>下载</span>
          </div>
          {/* 分享 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 20, height: 20, background: '#999', borderRadius: 3 }} />
            <span style={{ fontSize: 14, color: 'white' }}>分享</span>
          </div>
        </div>
      </Viewfinder>

      {/* Figma: 两个 160×44 胶囊按钮, fs=16 fw=500, gap=7, pad=24 */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 24px 0', gap: 7, flexShrink: 0 }}>
        <button onClick={() => { setSheet('buy'); setSheetFull(false) }} style={{ width: 160, height: 44, borderRadius: 9999, border: '0.5px solid rgba(0,0,0,0.15)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, flexShrink: 0 }}>
          <div style={{ width: 20, height: 20, background: '#ccc', borderRadius: 3 }} />
          <span style={{ fontSize: 16, fontWeight: 500, color: 'rgba(0,0,0,0.8)', whiteSpace: 'nowrap' }}>买同款穿戴甲</span>
        </button>
        <button onClick={() => { setSheet('shops'); setSheetFull(false) }} style={{ width: 160, height: 44, borderRadius: 9999, border: '0.5px solid rgba(0,0,0,0.15)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, flexShrink: 0 }}>
          <div style={{ width: 20, height: 20, background: '#ccc', borderRadius: 3 }} />
          <span style={{ fontSize: 16, fontWeight: 500, color: 'rgba(0,0,0,0.8)', whiteSpace: 'nowrap' }}>搜附近美甲店</span>
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

  /* ═══════════════════════ 商品详情页 ═══════════════════════ */
  const ProductPage = (
    <div style={{ position: 'absolute', inset: 0, background: 'white', zIndex: 80, display: 'flex', flexDirection: 'column' }}>
      {/* 头图区 375×375 */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: '#f8f8f8', flexShrink: 0 }}>
        <div style={{ width: '100%', height: '100%', background: '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#bbb', fontSize: 13 }}>商品头图</span>
        </div>
        {/* 顶栏 */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '12px', display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={() => setSubPage(null)} style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            {['search', 'share', 'collect', 'more'].map(n => (
              <div key={n} style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.55)' }} />
            ))}
          </div>
        </div>
        {/* 评价浮标 */}
        <div style={{ position: 'absolute', bottom: 20, right: 12, display: 'flex', gap: 8 }}>
          <div style={{ height: 24, borderRadius: 12, background: 'rgba(48,48,52,0.85)', padding: '3px 7px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 12, color: 'white' }}>55个用户觉得"超赞"</span>
          </div>
        </div>
        {/* 视频/图切换 Tab */}
        <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', background: 'rgba(117,117,127,0.3)', borderRadius: 57, padding: 2 }}>
          {['视频', '讲解', '图片', '尺码', '笔记', '款式'].map(t => (
            <div key={t} style={{ padding: '3px 8px', borderRadius: 41, fontSize: 10, fontWeight: 500, color: 'white' }}>{t}</div>
          ))}
        </div>
        {/* 居中播放按钮 */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 62, height: 62, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
        </div>
      </div>

      {/* 款式图点选 60px */}
      <div style={{ height: 60, background: '#f5f5f5', display: 'flex', alignItems: 'center', padding: '0 12px', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ width: 36, height: 36, borderRadius: 6, background: '#ddd' }} />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#333' }}>
          <span>共4款</span>
          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M5 3L9 7L5 11" stroke="#999" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>
      </div>

      {/* 商品信息区 (Figma: 230px) */}
      <div style={{ padding: '8px 12px', flexShrink: 0, borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
          <span style={{ fontSize: 20, fontWeight: 600, color: '#FF2442' }}>165.9</span>
          <span style={{ fontSize: 11, color: '#999', textDecoration: 'line-through' }}>767</span>
          <div style={{ fontSize: 11, color: '#FF2442', background: 'rgba(255,36,66,0.06)', padding: '2px 6px', borderRadius: 3 }}>到手价</div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#333', lineHeight: '18px', marginBottom: 8 }}>
          双十一必入！美拉德棕色灯芯绒神裤 太好穿了
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {['限时购', '7天无理由', '满200减20', '退货包运费', '60天最低价'].map(t => (
            <span key={t} style={{ fontSize: 10, color: '#666', background: '#f7f7f7', padding: '2px 5px', borderRadius: 2, border: '0.5px solid #eee' }}>{t}</span>
          ))}
        </div>
      </div>

      {/* 店铺信息 */}
      <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#ddd' }} />
        <span style={{ fontSize: 11, flex: 1, color: '#333' }}>观夏旗舰店</span>
        <div style={{ fontSize: 9, color: 'white', background: '#FF2442', padding: '2px 6px', borderRadius: 2 }}>直播</div>
        <button onClick={() => setSubPage('chat')} style={{ fontSize: 11, color: '#FF2442', background: 'none', border: '1px solid #FF2442', borderRadius: 12, padding: '4px 12px' }}>私信</button>
      </div>

      {/* 底部操作栏 */}
      <div style={{ flexShrink: 0, height: 56, display: 'flex', borderTop: '1px solid #eee', marginTop: 'auto' }}>
        <div style={{ width: 44, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <div style={{ width: 20, height: 20, background: '#bbb', borderRadius: 3 }} />
          <span style={{ fontSize: 10, color: '#666' }}>店铺</span>
        </div>
        <div style={{ width: 44, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <div style={{ width: 20, height: 20, background: '#bbb', borderRadius: 3 }} />
          <span style={{ fontSize: 10, color: '#666' }}>客服</span>
        </div>
        <div style={{ width: 44, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <div style={{ width: 20, height: 20, background: '#bbb', borderRadius: 3 }} />
          <span style={{ fontSize: 10, color: '#666' }}>购物车</span>
          <div style={{ position: 'absolute', top: 7, right: -2, width: 19, height: 12, borderRadius: 50, background: '#FF2442', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 9, color: 'white' }}>23</span>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', gap: 0 }}>
          <button style={{ flex: 1, background: 'white', border: 'none', borderTop: '1px solid #eee', fontSize: 14, fontWeight: 500, color: '#333' }}>加入购物车</button>
          <button style={{ flex: 1, background: '#FF2442', border: 'none', fontSize: 14, fontWeight: 500, color: 'white' }}>立即购买</button>
        </div>
      </div>
    </div>
  )

  /* ═══════════════════════ 私信聊天页 ═══════════════════════ */
  const ChatPage = (
    <div style={{ position: 'absolute', inset: 0, background: 'white', zIndex: 90, display: 'flex', flexDirection: 'column' }}>
      {/* 导航栏 */}
      <div style={{ height: 44, display: 'flex', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid #eee', flexShrink: 0 }}>
        <button onClick={() => setSubPage(null)} style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', marginRight: 10 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="rgba(0,0,0,0.6)" strokeWidth="2.5" strokeLinecap="round"/></svg>
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{ fontSize: 16, fontWeight: 500, color: '#333' }}>观夏旗舰店</span>
        </div>
        <div style={{ width: 24 }} />
      </div>

      {/* 聊天内容区 */}
      <div style={{ flex: 1, background: '#f5f5f5', overflow: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* 系统消息 */}
        <div style={{ textAlign: 'center', fontSize: 11, color: '#bbb' }}>今天 14:23</div>
        {/* 对方消息 */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#ddd', flexShrink: 0 }} />
          <div style={{ background: 'white', padding: '10px 14px', borderRadius: '4px 16px 16px 16px', maxWidth: 220, fontSize: 14, color: '#333', lineHeight: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
            这款穿戴甲有现货哦，拍下今天就能发~
          </div>
        </div>
        {/* 自己消息 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ background: '#333', padding: '10px 14px', borderRadius: '16px 4px 16px 16px', maxWidth: 220, fontSize: 14, color: 'white', lineHeight: '20px' }}>
            这款可以做S码吗？
          </div>
        </div>
        {/* 对方 */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#ddd', flexShrink: 0 }} />
          <div style={{ background: 'white', padding: '10px 14px', borderRadius: '4px 16px 16px 16px', maxWidth: 220, fontSize: 14, color: '#333', lineHeight: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
            可以的哈，S/M/L码都有，下单时备注一下就行~
          </div>
        </div>
      </div>

      {/* 快捷功能栏 */}
      <div style={{ flexShrink: 0, display: 'flex', gap: 10, padding: '8px 12px', borderTop: '1px solid #eee' }}>
        {['发图', '拍照', '款式选择', '我的订单'].map(fn => (
          <div key={fn} style={{ padding: '5px 10px', background: '#f0f0f0', borderRadius: 14, fontSize: 11, color: '#666' }}>{fn}</div>
        ))}
      </div>

      {/* 底部发送组件 */}
      <div style={{ flexShrink: 0, height: 48, display: 'flex', alignItems: 'center', padding: '6px 12px', gap: 8, borderTop: '1px solid #eee' }}>
        <div style={{ flex: 1, height: 36, background: '#f5f5f5', borderRadius: 18, display: 'flex', alignItems: 'center', padding: '0 14px' }}>
          <span style={{ fontSize: 13, color: '#bbb' }}>输入消息...</span>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="4,5 20,12 4,19"/></svg>
        </div>
      </div>
    </div>
  )

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

      {/* 子页面：商品详情 / 私信聊天 */}
      {subPage === 'product' && ProductPage}
      {subPage === 'chat' && ChatPage}

      {/* ═══════════════════════ Sheet 半屏面板 ═══════════════════════ */}
      {sheet && (
        <>
          {/* 半透明遮罩 */}
          <div onClick={() => setSheet(null)} style={{
            position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.4)',
            opacity: sheet ? 1 : 0, transition: 'opacity 0.3s',
          }} />
          {/* Sheet 容器 — 半屏/全屏过渡 */}
          <div style={{
            position: 'fixed', bottom: 0, left: '50%', zIndex: 70,
            width: '100%', maxWidth: 393, transform: 'translateX(-50%)',
            height: sheetFull ? '100vh' : '88vh',
            background: 'white', borderTopLeftRadius: 12, borderTopRightRadius: 12,
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            transition: 'height 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
          }}>
            {/* Header: 44px (Figma: NavigationBar 42px + Divider) */}
            <div style={{ flexShrink: 0, position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                height: 44, padding: '10px 12px' }}>
                {/* 拖拽条 + 标题 */}
                <button onClick={() => setSheetFull(v => !v)} style={{ width: 20, height: 20, background: '#ddd', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 5L6 2L9 5" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" strokeLinecap="round"/><path d="M3 7L6 10L9 7" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
                <span style={{ fontSize: 15, fontWeight: 500, color: 'black' }}>
                  {sheet === 'buy' ? '同款穿戴甲' : '附近美甲店'}
                </span>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 19, height: 19, background: '#ddd', borderRadius: 4 }} />
                  <button onClick={() => setSheet(null)} style={{ width: 19, height: 19, background: 'rgba(0,0,0,0.1)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2L10 10M10 2L2 10" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </button>
                </div>
              </div>
              <div style={{ height: 1, background: '#eee' }} />
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
              {/* 全屏时显示 Tab 选项卡 (Figma: 42px height) */}
              {sheetFull && (
                <div style={{ display: 'flex', borderBottom: '1px solid #eee', flexShrink: 0 }}>
                  {sheet === 'buy' ? (
                    <>
                      <button onClick={() => setSheet('buy')} style={{ flex: 1, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500, color: 'black', borderBottom: '2px solid black', background: 'none' }}>商品</button>
                      <button onClick={() => setSheet('shops')} style={{ flex: 1, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'rgba(0,0,0,0.4)', background: 'none', border: 'none' }}>地点</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setSheet('buy')} style={{ flex: 1, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'rgba(0,0,0,0.4)', background: 'none', border: 'none' }}>商品</button>
                      <button onClick={() => setSheet('shops')} style={{ flex: 1, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500, color: 'black', borderBottom: '2px solid black', background: 'none' }}>地点</button>
                    </>
                  )}
                </div>
              )}

              {/* 全屏时显示搜索栏 + 筛选标签 */}
              {sheetFull && (
                <div style={{ padding: '8px 12px', display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ flex: 1, height: 36, background: '#f5f5f5', borderRadius: 18, display: 'flex', alignItems: 'center', padding: '0 12px' }}>
                    <div style={{ width: 14, height: 14, background: '#bbb', borderRadius: 2 }} />
                    <div style={{ width: 40, height: 10, background: '#ddd', borderRadius: 2, marginLeft: 6 }} />
                  </div>
                  <div style={{ width: 36, height: 36, background: '#f5f5f5', borderRadius: '50%' }} />
                </div>
              )}

              {sheet === 'buy' ? (
                /* 商品双列 Feed */
                <div style={{ flex: 1, overflow: 'auto', padding: '8px', display: 'flex', gap: 5 }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {[0, 1, 2].map(i => (
                      <button key={`L${i}`} onClick={() => { setSheet(null); setSubPage('product') }}
                        style={{ background: '#f5f5f5', borderRadius: 4, overflow: 'hidden', border: 'none', textAlign: 'left', padding: 0 }}>
                        <div style={{ background: '#e0e0e0', width: '100%', aspectRatio: '1/1' }} />
                        <div style={{ padding: 10 }}>
                          <div style={{ height: 12, background: '#ccc', borderRadius: 2, width: '80%', marginBottom: 6 }} />
                          <div style={{ height: 12, background: '#ccc', borderRadius: 2, width: '60%', marginBottom: 8 }} />
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                            <span style={{ fontSize: 17, fontWeight: 500, color: '#333' }}>65</span>
                            <span style={{ fontSize: 11, color: '#999' }}>200+人已买</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {[0, 1, 2].map(i => (
                      <button key={`R${i}`} onClick={() => { setSheet(null); setSubPage('product') }}
                        style={{ background: '#f5f5f5', borderRadius: 4, overflow: 'hidden', border: 'none', textAlign: 'left', padding: 0 }}>
                        <div style={{ background: '#e0e0e0', width: '100%', aspectRatio: '1/1' }} />
                        <div style={{ padding: 10 }}>
                          <div style={{ height: 12, background: '#ccc', borderRadius: 2, width: '75%', marginBottom: 6 }} />
                          <div style={{ height: 12, background: '#ccc', borderRadius: 2, width: '55%', marginBottom: 8 }} />
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                            <span style={{ fontSize: 17, fontWeight: 500, color: '#333' }}>607</span>
                            <span style={{ fontSize: 11, color: '#999' }}>300+人已买</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* 地点列表 */
                <div style={{ flex: 1, overflow: 'auto' }}>
                  {/* 搜索栏 */}
                  <div style={{ margin: '8px 12px', height: 36, background: '#f5f5f5', borderRadius: 18, display: 'flex', alignItems: 'center', padding: '0 12px' }}>
                    <div style={{ width: 14, height: 14, background: '#bbb', borderRadius: 2 }} />
                    <div style={{ width: 60, height: 10, background: '#ddd', borderRadius: 2, marginLeft: 6 }} />
                  </div>
                  {/* 位置列表 */}
                  {['上海soho复兴广场', '虹桥天地', '静安嘉里中心', '国金中心商场', '新天地'].map((name, i) => (
                    <button key={i} onClick={() => { setSheet(null); setSubPage('chat') }}
                      style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, width: '100%', background: 'none', border: 'none', borderBottom: '1px solid #f0f0f0', textAlign: 'left' }}>
                      <div style={{ width: 18, height: 18, background: '#ddd', borderRadius: 4, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, color: '#333' }}>{name}</div>
                        <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                          {i === 0 ? '距你 320m · 3家美甲店' : `距你 ${(i + 1) * 0.8}km · ${5 - i}家美甲店`}
                        </div>
                      </div>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2L8 6L4 10" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom bar */}
            <div style={{ flexShrink: 0, height: 34, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 139, height: 5, borderRadius: 100, background: 'black' }} />
            </div>
          </div>
        </>
      )}

      <NailLibraryPanel selected={nailStyle} onSelect={n => { onNailStyleChange?.(n); setImgIdx(0) }} open={libraryOpen} onClose={() => setLibraryOpen(false)} />
      {/* 全局底部留白 32px */}
      <div style={{ height: 32, background: 'white', flexShrink: 0 }} />
    </div>
  )
}
