import { useState, useRef, useEffect, useMemo } from 'react'
import PageLayout from '../components/PageLayout'
import NavBar from '../components/NavBar'
import NailLibraryPanel from '../components/NailLibraryPanel'
import { loadLibrary, saveLibrary } from '../utils/nailLibrary'

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
  const [imgIdx, setImgIdx] = useState(0) // 当前款式组内图片索引
  const inputRef = useRef()
  const cameraRef = useRef()

  const mode = result ? 'result' : loading ? 'generating' : 'camera'

  // 获取当前款式组的所有图片
  const groupImages = useMemo(() => {
    if (!nailStyle?.groupId) return nailStyle ? [nailStyle] : []
    const all = loadLibrary().filter(n => !n.category || n.category === 'nail')
    return all.filter(n => n.groupId === nailStyle.groupId)
  }, [nailStyle])

  // 当前显示的图片
  const currentImage = groupImages[imgIdx] || nailStyle

  // 确保 imgIdx 不越界
  useEffect(() => { setImgIdx(0) }, [nailStyle?.groupId])

  // 轮播趣味文案
  useEffect(() => {
    if (mode !== 'generating') return
    const t = setInterval(() => setFunnyIdx(i => (i + 1) % FUNNY_TEXTS.length), 2500)
    return () => clearInterval(t)
  }, [mode])

  // 根据 initialNails 自动导入款式
  useEffect(() => {
    if (!initialNails?.length) return
    const existing = loadLibrary()
    const existingSrcs = new Set(existing.map(n => n.src))
    const gid = 'post_' + Date.now()
    const newNails = initialNails
      .filter(src => !existingSrcs.has(src))
      .map((src, i) => ({ id: Date.now() + i, src, groupId: gid, groupLabel: '帖子导入', category: 'nail' }))
    if (newNails.length) {
      saveLibrary([...existing, ...newNails])
      if (!nailStyle) {
        onNailStyleChange?.(newNails[0])
        setImgIdx(0)
      }
    } else if (!nailStyle) {
      const firstSrc = initialNails[0]
      const found = existing.find(n => n.src === firstSrc)
      if (found) { onNailStyleChange?.(found); setImgIdx(0) }
    }
  }, [])

  // groupImages 变化时，确保 currentImage 同步到 nailStyle
  useEffect(() => {
    if (currentImage && currentImage.id !== nailStyle?.id) {
      onNailStyleChange?.(currentImage)
    }
  }, [currentImage?.id])

  const handleFile = (file) => {
    if (!file?.type.startsWith('image/')) return
    onHandFileChange?.(file)
  }

  const prevImg = () => {
    if (groupImages.length > 1) setImgIdx(i => (i - 1 + groupImages.length) % groupImages.length)
  }
  const nextImg = () => {
    if (groupImages.length > 1) setImgIdx(i => (i + 1) % groupImages.length)
  }

  const generate = async (forcedProvider) => {
    if (!handFile || !currentImage) return
    const useProvider = forcedProvider || provider
    onLoadingChange?.(true)
    setError(null)
    onResultChange?.(null)
    onProgressChange?.(0)

    let p = 0
    const iv = setInterval(() => {
      p = Math.min(p + Math.random() * 15, 90)
      onProgressChange?.(p)
    }, 2000)

    const form = new FormData()
    form.append('hand', handFile)
    form.append('provider', useProvider)
    if (currentImage.src.startsWith('data:')) {
      const arr = currentImage.src.split(',')
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
      const bstr = atob(arr[1])
      const u8 = new Uint8Array(bstr.length)
      for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i)
      form.append('nail', new Blob([u8], { type: mime }), 'nail.jpg')
    } else {
      form.append('nail_url', currentImage.src)
    }

    try {
      const res = await fetch('/api/cyber-nails', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || '生成失败')
      onResultChange?.(data.image)
      onProgressChange?.(100)
    } catch (e) {
      setError(e.message)
    } finally {
      clearInterval(iv)
      setTimeout(() => onLoadingChange?.(false), 500)
    }
  }

  const mockGenerate = () => {
    if (!handFile) return
    onLoadingChange?.(true)
    onResultChange?.(null)
    onProgressChange?.(0)
    let p = 0
    const iv = setInterval(() => {
      p = Math.min(p + Math.random() * 25, 90)
      onProgressChange?.(p)
    }, 800)
    setTimeout(() => {
      clearInterval(iv)
      onProgressChange?.(100)
      const canvas = document.createElement('canvas')
      canvas.width = 400; canvas.height = 500
      const ctx = canvas.getContext('2d')
      const handImg = new Image()
      handImg.src = handPreviewRef.current
      handImg.onload = () => {
        ctx.drawImage(handImg, 0, 0, 400, 500)
        if (currentImage?.src) {
          const nailImg = new Image()
          nailImg.crossOrigin = 'anonymous'
          nailImg.src = currentImage.src
          nailImg.onload = () => {
            ctx.globalAlpha = 0.7
            ctx.drawImage(nailImg, 260, 30, 120, 120)
            onResultChange?.(canvas.toDataURL())
            onLoadingChange?.(false)
          }
          nailImg.onerror = () => {
            onResultChange?.(canvas.toDataURL())
            onLoadingChange?.(false)
          }
        } else {
          onResultChange?.(canvas.toDataURL())
          onLoadingChange?.(false)
        }
      }
    }, 2000)
  }

  const handPreviewUrl = handFile ? URL.createObjectURL(handFile) : null
  const handPreviewRef = useRef(handPreviewUrl)
  handPreviewRef.current = handPreviewUrl

  return (
    <PageLayout>
      <NavBar title="智能穿戴" onBack={onBack} />

      {/* ── 取景/拍照模式 ── */}
      {mode === 'camera' && (
        <div className="flex-1 flex flex-col px-[16px]">
          {/* 面板开关 */}
          {!showPanel && (
            <button
              onClick={() => setShowPanel(true)}
              className="fixed right-0 top-[120px] w-[28px] h-[48px] bg-white/90 rounded-l-[8px] shadow-md z-40 flex items-center justify-center active:scale-95 transition-transform border border-[#eee] border-r-0"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          )}
          {/* 当前款式 + 美甲库入口 */}
          <div className="flex items-center gap-[12px] py-[12px]">
            {currentImage ? (
              <div className="flex flex-col items-center gap-[4px] relative">
                <span className="text-[#FF2442] text-[10px] font-medium">当前款式</span>
                <div className="relative">
                  <div className="w-[95px] h-[95px] rounded-[15px] overflow-hidden border-[2px] border-[#FF2442]">
                    <img src={currentImage.src} alt="style" className="w-full h-full object-cover" />
                  </div>
                  {/* 左右切换箭头 */}
                  {groupImages.length > 1 && (
                    <>
                      <button onClick={prevImg}
                        className="absolute left-[-10px] top-1/2 -translate-y-1/2 w-[22px] h-[22px] rounded-full bg-white shadow-md border border-[#eee] flex items-center justify-center active:scale-90 transition-transform z-10">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="15 18 9 12 15 6"/>
                        </svg>
                      </button>
                      <button onClick={nextImg}
                        className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-[22px] h-[22px] rounded-full bg-white shadow-md border border-[#eee] flex items-center justify-center active:scale-90 transition-transform z-10">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </button>
                    </>
                  )}
                </div>
                {groupImages.length > 1 && (
                  <span className="text-[rgba(0,0,0,0.25)] text-[9px]">{imgIdx + 1}/{groupImages.length}</span>
                )}
              </div>
            ) : (
              <div className="w-[95px] h-[95px] rounded-[15px] bg-[#f5f5f5] flex items-center justify-center">
                <span className="text-[rgba(0,0,0,0.2)] text-[11px]">暂无款式</span>
              </div>
            )}

            {/* 美甲库入口卡片 */}
            <button
              onClick={() => setLibraryOpen(true)}
              className="flex-1 h-[95px] rounded-[15px] p-[12px] flex items-center gap-[10px] active:scale-[0.98] transition-transform"
              style={{ background: 'linear-gradient(135deg, rgb(131,242,223), rgb(217,247,242))' }}
            >
              <div className="flex-1 text-left">
                <p className="text-[rgba(0,0,0,0.7)] text-[15px] font-semibold">美甲库</p>
                <p className="text-[rgba(0,0,0,0.4)] text-[11px] mt-[4px]">近期浏览、收藏、热门的款式</p>
              </div>
              <div className="flex -space-x-[8px]">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-[32px] h-[32px] rounded-[8px] bg-white/60 border border-white" />
                ))}
              </div>
            </button>
          </div>

          {/* 取景框 */}
          <div className="flex-1 rounded-[15px] bg-[rgb(229,229,229)] overflow-hidden relative"
            style={{ minHeight: '400px' }}>
            {handFile ? (
              <>
                <img src={handPreviewUrl} alt="hand" className="absolute inset-0 w-full h-full object-cover" />
                <button
                  onClick={() => onHandFileChange?.(null)}
                  className="absolute top-[10px] left-[10px] w-[28px] h-[28px] rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-[12px]">
                <div className="relative w-[80px] h-[80px]">
                  <div className="absolute top-0 left-0 w-[18px] h-[18px] border-t-[2.5px] border-l-[2.5px] border-red-400 rounded-tl-[3px]" />
                  <div className="absolute top-0 right-0 w-[18px] h-[18px] border-t-[2.5px] border-r-[2.5px] border-red-400 rounded-tr-[3px]" />
                  <div className="absolute bottom-0 left-0 w-[18px] h-[18px] border-b-[2.5px] border-l-[2.5px] border-red-400 rounded-bl-[3px]" />
                  <div className="absolute bottom-0 right-0 w-[18px] h-[18px] border-b-[2.5px] border-r-[2.5px] border-red-400 rounded-br-[3px]" />
                </div>
                <p className="text-[rgba(0,0,0,0.18)] text-[13px]">取景框</p>
              </div>
            )}
          </div>

          {/* 相机按钮 */}
          <div className="flex justify-center py-[20px]">
            <button
              onClick={() => cameraRef.current.click()}
              className="w-[70px] h-[70px] rounded-full bg-white border-[3px] border-[#e0e0e0] flex items-center justify-center active:scale-90 transition-transform"
            >
              <div className="w-[56px] h-[56px] rounded-full bg-[#333]" />
            </button>
          </div>

          <div className="flex gap-[8px] justify-center pb-[8px]">
            <button onClick={() => cameraRef.current.click()}
              className="px-[16px] py-[8px] rounded-[20px] bg-[#FF2442] text-white text-[12px] active:scale-95 transition-transform">
              拍照
            </button>
            <button onClick={() => inputRef.current.click()}
              className="px-[16px] py-[8px] rounded-[20px] bg-white border border-[#ddd] text-[rgba(0,0,0,0.6)] text-[12px] active:scale-95 transition-transform">
              相册
            </button>
          </div>

          <input ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />

          {/* 底部生成按钮 */}
          <div className="pt-[8px] pb-[max(16px,env(safe-area-inset-bottom))]">
            <button onClick={generate} disabled={!handFile || !currentImage}
              className={`w-full py-[14px] rounded-[12px] font-semibold text-[15px] transition-all active:scale-[0.98]
                ${handFile && currentImage
                  ? 'bg-[#FF2442] text-white'
                  : 'bg-[#f5f5f5] text-[rgba(0,0,0,0.15)] cursor-not-allowed'}`}>
              智能试戴
            </button>
          </div>
        </div>
      )}

      {/* ── 生成中 ── */}
      {mode === 'generating' && (
        <div className="flex-1 flex flex-col px-[16px]">
          <div className="flex items-center gap-[12px] py-[12px]">
            {currentImage && (
              <div className="flex flex-col items-center gap-[4px]">
                <span className="text-[rgba(0,0,0,0.4)] text-[10px]">原帖</span>
                <div className="w-[95px] h-[95px] rounded-[15px] overflow-hidden">
                  <img src={currentImage.src} alt="style" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
            <div className="flex-1" />
          </div>

          {/* 手部预览 + 渐变loading */}
          <div className="flex-1 rounded-[15px] overflow-hidden relative bg-[#f5f5f5]"
            style={{ minHeight: '400px' }}>
            {handPreviewUrl && (
              <img src={handPreviewUrl} alt="hand" className="absolute inset-0 w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex flex-col items-center justify-center gap-[16px]">
              <div className="relative w-[56px] h-[56px]">
                <svg className="animate-spin" width="56" height="56" viewBox="0 0 56 56">
                  <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FF2442" />
                      <stop offset="50%" stopColor="#FF6B8A" />
                      <stop offset="100%" stopColor="#FFB3C6" />
                    </linearGradient>
                  </defs>
                  <circle cx="28" cy="28" r="22" fill="none" stroke="#f0f0f0" strokeWidth="3" />
                  <circle cx="28" cy="28" r="22" fill="none" stroke="url(#grad)" strokeWidth="3"
                    strokeLinecap="round" strokeDasharray="80 138" />
                </svg>
              </div>
              <p className="text-[rgba(0,0,0,0.55)] text-[14px] font-medium">{FUNNY_TEXTS[funnyIdx]}</p>
              <div className="w-[140px] h-[4px] rounded-full bg-[#eee] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress || 0}%`, background: 'linear-gradient(90deg, #FF2442, #FF6B8A)' }} />
              </div>
              <p className="text-[rgba(0,0,0,0.3)] text-[11px]">预计还需 {Math.max(1, Math.round((100 - (progress || 0)) / 15))} 秒</p>
            </div>
          </div>
          {error && (
            <div className="mt-[10px] px-[12px] py-[8px] rounded-[10px] bg-[#fff5f5] border border-[#FF2442]/10 text-[#FF2442] text-[12px]">
              {error}
            </div>
          )}
        </div>
      )}

      {/* ── 结果 ── */}
      {mode === 'result' && (
        <div className="flex-1 flex flex-col px-[16px]">
          <div className="flex items-center gap-[12px] py-[12px]">
            {currentImage && (
              <div className="flex flex-col items-center gap-[4px]">
                <span className="text-[rgba(0,0,0,0.4)] text-[12px] font-medium">原帖</span>
                <div className="w-[95px] h-[95px] rounded-[15px] overflow-hidden border border-[#eee]">
                  <img src={currentImage.src} alt="style" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
            <div className="flex-1" />
          </div>

          {/* AI 结果大图 */}
          <div className="flex-1 rounded-[15px] overflow-hidden relative bg-[#f5f5f5]"
            style={{ minHeight: '400px' }}>
            {result && <img src={result} alt="result" className="absolute inset-0 w-full h-full object-cover" />}
            <button
              onClick={() => { onResultChange?.(null); onHandFileChange?.(null) }}
              className="absolute top-[10px] left-[10px] w-[28px] h-[28px] rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* 两个药丸按钮 */}
          <div className="flex items-center justify-center gap-[10px] py-[16px]">
            <button
              onClick={() => onBuySimilar?.()}
              className="h-[36px] px-[20px] rounded-[9999px] bg-[#FF2442] text-white text-[13px] font-medium active:scale-95 transition-transform"
            >
              买同款穿戴甲
            </button>
            <button
              onClick={() => onFindShops?.()}
              className="h-[36px] px-[20px] rounded-[9999px] bg-white border border-[#FF2442]/30 text-[#FF2442] text-[13px] font-medium active:scale-95 transition-transform"
            >
              搜附近美甲店
            </button>
          </div>
        </div>
      )}

      {/* 美甲库面板 */}
      <NailLibraryPanel
        selected={nailStyle}
        onSelect={(nail) => { onNailStyleChange?.(nail); setImgIdx(0) }}
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
      />

      {/* 测试面板 */}
      {showPanel && (
        <div className="fixed top-[80px] right-0 w-[180px] bg-white/95 backdrop-blur-sm rounded-l-[12px] shadow-lg z-50"
          style={{ padding: '12px' }}>
          <div className="flex items-center justify-between mb-[10px]">
            <span className="text-[12px] font-bold text-[#333]">模型测试</span>
            <button onClick={() => setShowPanel(false)} className="text-[#999] text-[11px] active:scale-90">收起</button>
          </div>
          <div className="flex flex-col gap-[6px]">
            <button
              onClick={() => { onProviderChange?.('openai'); if (handFile && currentImage) generate('openai') }}
              disabled={!handFile || !currentImage}
              className={`w-full py-[8px] rounded-[8px] text-[11px] font-medium transition-all active:scale-95
                ${provider === 'openai'
                  ? 'bg-[rgba(52,199,89,0.15)] text-[#34c759] border border-[#34c759]/30'
                  : 'bg-[#f5f5f5] text-[rgba(0,0,0,0.4)] border border-[#eee]'}
                ${!handFile || !currentImage ? 'opacity-40' : ''}`}
            >
              GPT
            </button>
            <button
              onClick={() => { onProviderChange?.('grok'); if (handFile && currentImage) generate('grok') }}
              disabled={!handFile || !currentImage}
              className={`w-full py-[8px] rounded-[8px] text-[11px] font-medium transition-all active:scale-95
                ${provider === 'grok'
                  ? 'bg-[rgba(255,149,0,0.15)] text-[#ff9500] border border-[#ff9500]/30'
                  : 'bg-[#f5f5f5] text-[rgba(0,0,0,0.4)] border border-[#eee]'}
                ${!handFile || !currentImage ? 'opacity-40' : ''}`}
            >
              Grok
            </button>
            <button
              onClick={mockGenerate}
              disabled={!handFile}
              className="w-full py-[8px] rounded-[8px] text-[11px] font-medium bg-[#f5f5f5] text-[rgba(0,0,0,0.5)] border border-[#eee] active:scale-95 transition-all disabled:opacity-40"
            >
              跳过模型
            </button>
            <button
              onClick={onUpload}
              className="w-full py-[8px] rounded-[8px] text-[11px] font-medium bg-[#f5f5f5] text-[rgba(0,0,0,0.45)] border border-[#eee] active:scale-95 transition-all"
            >
              + 素材上传
            </button>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
