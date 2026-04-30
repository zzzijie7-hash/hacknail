import { useState, useRef, useEffect } from 'react'

const STORAGE_KEY = 'cyber_nails_library'
function loadLibrary() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] } }
function saveLibrary(nails) { localStorage.setItem(STORAGE_KEY, JSON.stringify(nails)) }

// ── 美甲库 ─────────────────────────────────────────────────
function NailLibrary({ selected, onSelect }) {
  const [nails, setNails] = useState(() => loadLibrary())
  const [urlInput, setUrlInput] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState(null)
  const [expandedGroup, setExpandedGroup] = useState(null)
  const uploadRef = useRef()

  const updateNails = (updater) => {
    setNails((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      saveLibrary(next)
      return next
    })
  }

  // 按来源分组：同一帖子解析出的多张图归为一组，本地上传的单独成组
  const groups = nails.reduce((acc, nail) => {
    const key = nail.groupId || 'upload'
    if (!acc[key]) acc[key] = { id: key, label: nail.groupLabel || '本地上传', items: [] }
    acc[key].items.push(nail)
    return acc
  }, {})

  const addFile = (file) => {
    if (!file?.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => updateNails((prev) => [...prev, { id: Date.now(), src: e.target.result }])
    reader.readAsDataURL(file)
  }

  const deleteNail = (id) => {
    updateNails((prev) => prev.filter(n => n.id !== id))
    if (selected?.id === id) onSelect(null)
  }

  const deleteGroup = (groupId) => {
    updateNails((prev) => prev.filter(n => (n.groupId || 'upload') !== groupId))
    if (selected?.groupId === groupId || (!selected?.groupId && groupId === 'upload')) onSelect(null)
  }

  const parseUrl = async () => {
    if (!urlInput.trim()) return
    setParsing(true)
    setParseError(null)
    try {
      const res = await fetch('/api/parse-nail-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || '解析失败')
      if (data.images?.length) {
        const gid = 'link_' + Date.now()
        const newNails = data.images.map((src, i) => ({ id: Date.now() + i, src, groupId: gid, groupLabel: '小红书导入' }))
        updateNails((prev) => [...prev, ...newNails])
        setUrlInput('')
        if (newNails.length) onSelect(newNails[0])
      } else {
        setParseError('未找到图片，请手动上传')
      }
    } catch (e) {
      setParseError(e.message)
    } finally {
      setParsing(false)
    }
  }

  const groupList = Object.values(groups)

  return (
    <div>
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-semibold text-base">美甲库</h2>
        <span className="text-gray-600 text-xs">{nails.length} 款 · {groupList.length} 组</span>
      </div>

      {/* 小红书链接解析 */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1 relative">
          <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && parseUrl()}
            placeholder="粘贴小红书链接，自动提取美甲图"
            className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-3 py-2.5 pr-8 text-xs text-white placeholder-gray-600 outline-none focus:border-purple-500/60 transition-colors" />
          {urlInput && !parsing && (
            <button onClick={() => setUrlInput('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 text-[10px]">✕</button>
          )}
        </div>
        <button onClick={parseUrl} disabled={parsing || !urlInput.trim()}
          className="px-3 py-2.5 rounded-xl bg-purple-600/20 text-purple-300 text-xs hover:bg-purple-600/30 disabled:opacity-40 transition-colors whitespace-nowrap active:scale-95">
          {parsing ? (
            <span className="flex items-center gap-1">
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              解析中
            </span>
          ) : '解析'}
        </button>
      </div>
      {parseError && <p className="text-red-400 text-xs mb-2">{parseError}</p>}

      {/* 横滑款式选择器 */}
      {groupList.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
          {/* 上传入口 */}
          <div onClick={() => uploadRef.current.click()}
            className="shrink-0 w-[64px] h-[64px] rounded-xl border border-dashed border-gray-700 bg-gray-900/30 flex flex-col items-center justify-center gap-0.5 cursor-pointer hover:border-purple-500/50 transition-colors active:scale-95">
            <span className="text-lg text-gray-600">+</span>
            <span className="text-gray-600 text-[9px]">上传</span>
          </div>
          <input ref={uploadRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => e.target.files[0] && addFile(e.target.files[0])} />

          {/* 分组横滑 */}
          {groupList.map((group) => {
            const isExpanded = expandedGroup === group.id
            const firstImg = group.items[0]
            const count = group.items.length
            const hasSelected = group.items.some(n => n.id === selected?.id)

            return (
              <div key={group.id} className="shrink-0 flex flex-col gap-1">
                {/* 组缩略图 */}
                <div className="relative" onClick={() => {
                  if (isExpanded) { setExpandedGroup(null); return }
                  if (count === 1) { onSelect(firstImg); return }
                  setExpandedGroup(isExpanded ? null : group.id)
                }}>
                  <div className={`w-[64px] h-[64px] rounded-xl overflow-hidden cursor-pointer transition-all
                    ${hasSelected ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-[#0a0a0a]' : 'hover:opacity-90'}`}>
                    <img src={firstImg.src} alt="nail" className="w-full h-full object-cover" />
                  </div>
                  {/* 多图数量角标 */}
                  {count > 1 && !isExpanded && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
                      <span className="text-[9px] text-gray-400">{count}</span>
                    </div>
                  )}
                  {/* 展开箭头 */}
                  {count > 1 && (
                    <div className="absolute top-0.5 right-0.5">
                      <span className="text-[8px] text-white/60">{isExpanded ? '▴' : '▾'}</span>
                    </div>
                  )}
                </div>
                {/* 组标签 */}
                <span className="text-[9px] text-gray-600 text-center truncate w-[64px]">{group.label}</span>

                {/* 展开子图 */}
                {isExpanded && (
                  <div className="flex gap-1 mt-1">
                    {group.items.map((nail) => (
                      <div key={nail.id} onClick={(e) => { e.stopPropagation(); onSelect(nail) }}
                        className={`shrink-0 w-[48px] h-[48px] rounded-lg overflow-hidden cursor-pointer transition-all
                          ${selected?.id === nail.id ? 'ring-2 ring-purple-400 ring-offset-1 ring-offset-[#0a0a0a]' : 'hover:opacity-80'}`}>
                        <img src={nail.src} alt="nail" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {/* 删除整组 */}
                    <button onClick={(e) => { e.stopPropagation(); deleteGroup(group.id) }}
                      className="shrink-0 w-[48px] h-[48px] rounded-lg border border-red-900/50 bg-red-900/10 flex items-center justify-center text-red-400 text-[10px] hover:bg-red-900/20 transition-colors">
                      删除
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-gray-700 text-xs text-center py-4">上传美甲图或粘贴小红书链接添加款式</p>
      )}
    </div>
  )
}

// ── 主页 ───────────────────────────────────────────────────
export default function Home({ onNavigate, initialNails }) {
  const [selectedNail, setSelectedNail] = useState(null)

  // 自动把帖子图片加入美甲库，并自动选中第一张
  useEffect(() => {
    if (initialNails?.length) {
      const existing = loadLibrary()
      const existingSrcs = new Set(existing.map(n => n.src))
      const gid = 'post_' + Date.now()
      const newNails = initialNails.filter(src => !existingSrcs.has(src)).map((src, i) => ({
        id: Date.now() + i, src, groupId: gid, groupLabel: '帖子导入'
      }))
      if (newNails.length) {
        const updated = [...newNails, ...existing]
        saveLibrary(updated)
        setSelectedNail(newNails[0])
      } else {
        const firstSrc = initialNails[0]
        const found = existing.find(n => n.src === firstSrc)
        if (found) setSelectedNail(found)
      }
    }
  }, [initialNails])
  const [handFile, setHandFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)
  const inputRef = useRef()
  const cameraRef = useRef()
  const progressRef = useRef(null)

  const canGenerate = handFile && selectedNail && !loading

  const generate = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    setProgress(0)

    // 模拟进度
    let p = 0
    const progressInterval = setInterval(() => {
      p = Math.min(p + Math.random() * 15, 90)
      setProgress(p)
    }, 2000)
    progressRef.current = progressInterval

    const form = new FormData()
    form.append('hand', handFile)
    if (selectedNail.src.startsWith('data:')) {
      const arr = selectedNail.src.split(',')
      const mime = arr[0].match(/:(.*?);/)[1]
      const bstr = atob(arr[1])
      const u8 = new Uint8Array(bstr.length)
      for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i)
      form.append('nail', new Blob([u8], { type: mime }), 'nail.jpg')
    } else {
      form.append('nail_url', selectedNail.src)
    }

    try {
      const res = await fetch('/api/cyber-nails', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || '生成失败')
      setResult(data.image)
      setProgress(100)
    } catch (e) {
      setError(e.message)
    } finally {
      clearInterval(progressRef.current)
      setTimeout(() => setLoading(false), 500)
    }
  }

  const handPreviewUrl = handFile ? URL.createObjectURL(handFile) : null

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col pb-6" style={{ fontFamily: "'PingFang SC', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* 顶栏 */}
      <div className="px-5 pt-8 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-white text-sm">✦</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">CyberNail</h1>
            <p className="text-gray-500 text-[10px] -mt-0.5">种草 → 试戴 → 询价</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-5 flex flex-col gap-6">
        {/* 美甲库 */}
        <NailLibrary selected={selectedNail} onSelect={setSelectedNail} />

        {/* 分割线 */}
        <div className="border-t border-gray-800/50" />

        {/* 手部上传 + 操作区 */}
        <div>
          <h2 className="text-white font-semibold text-base mb-3">试戴</h2>

          <div className="flex gap-3 mb-4">
            {/* 手部图 */}
            <div className="w-[55%]">
              <p className="text-gray-500 text-xs mb-2">你的手</p>
              <div className="relative w-full aspect-[4/3] rounded-xl border border-gray-800 bg-gray-900/30 overflow-hidden">
                {handFile ? (
                  <>
                    <img src={handPreviewUrl} alt="hand" className="absolute inset-0 w-full h-full object-cover" />
                    <button onClick={() => setHandFile(null)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs flex items-center justify-center hover:bg-black/80 active:scale-90 transition-transform">✕</button>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center gap-2">
                    <button onClick={() => cameraRef.current.click()}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg bg-purple-600/20 text-purple-300 text-xs hover:bg-purple-600/30 transition-colors active:scale-95">📷 拍照</button>
                    <button onClick={() => inputRef.current.click()}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-800 text-gray-300 text-xs hover:bg-gray-700 transition-colors active:scale-95">🖼 相册</button>
                  </div>
                )}
                <input ref={inputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files[0] && setHandFile(e.target.files[0])} />
                <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
                  onChange={(e) => e.target.files[0] && setHandFile(e.target.files[0])} />
              </div>
            </div>

            {/* 选中款式预览 */}
            <div className="w-[45%]">
              <p className="text-gray-500 text-xs mb-2">选中款式</p>
              <div className="w-full aspect-[4/3] rounded-xl bg-gray-900/30 border border-gray-800 overflow-hidden flex items-center justify-center">
                {selectedNail ? (
                  <img src={selectedNail.src} alt="selected" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-gray-700 text-lg">✦</span>
                    <span className="text-gray-700 text-[10px]">从美甲库选择</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 提示信息 */}
          {!handFile && !selectedNail && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900/30 border border-gray-800/50 mb-4">
              <span className="text-purple-400 text-xs">💡</span>
              <span className="text-gray-500 text-[11px]">上传手部照片 + 选择美甲款式，即可生成试戴效果</span>
            </div>
          )}
          {handFile && !selectedNail && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900/30 border border-gray-800/50 mb-4">
              <span className="text-purple-400 text-xs">←</span>
              <span className="text-gray-500 text-[11px]">请在美甲库中选择一个款式</span>
            </div>
          )}
          {!handFile && selectedNail && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900/30 border border-gray-800/50 mb-4">
              <span className="text-purple-400 text-xs">←</span>
              <span className="text-gray-500 text-[11px]">请上传你的手部照片</span>
            </div>
          )}

          {/* 生成按钮 */}
          <button onClick={generate} disabled={!canGenerate}
            className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98]
              ${canGenerate
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 shadow-lg shadow-purple-900/30'
                : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'}`}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                AI 生成中…
              </span>
            ) : '✦ 生成试戴效果'}
          </button>

          {/* 跳过生成，直接看结果 */}
          <button onClick={() => {
            const fakeResult = selectedNail?.src || ''
            setResult(fakeResult)
            if (fakeResult) onNavigate('shops', { result: fakeResult, nail: selectedNail })
          }} className="w-full py-2.5 rounded-xl text-gray-500 text-xs border border-gray-800 hover:border-gray-600 hover:text-gray-300 transition-colors">
            跳过生成 → 直接找美甲店
          </button>

          {/* 进度条 */}
          {loading && (
            <div className="mt-3 h-1.5 rounded-full bg-gray-800 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }} />
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-lg bg-red-900/20 border border-red-800/50 text-red-400 text-xs mt-3 flex items-start gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* 结果 */}
        {result && (
          <div>
            <h2 className="text-white font-semibold text-base mb-3">效果预览</h2>

            {/* 对比展示 */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="rounded-xl overflow-hidden border border-gray-800">
                <div className="bg-gray-800/50 px-2 py-1 text-[10px] text-gray-400 text-center">原始手部</div>
                {handFile && <img src={handPreviewUrl} alt="original" className="w-full aspect-square object-cover" />}
              </div>
              <div className="rounded-xl overflow-hidden border border-purple-500/30">
                <div className="bg-purple-900/30 px-2 py-1 text-[10px] text-purple-300 text-center">AI 试戴</div>
                <img src={result} alt="result" className="w-full aspect-square object-cover" />
              </div>
            </div>

            {/* 结果大图 */}
            <div className="relative rounded-2xl overflow-hidden mt-3">
              <img src={result} alt="result" className="w-full rounded-2xl" />
              <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                <button onClick={() => { const a = document.createElement('a'); a.href = result; a.download = 'cybernail.png'; a.click() }}
                  className="flex-1 px-3 py-2 bg-black/60 backdrop-blur text-white text-xs rounded-xl hover:bg-black/80 transition-colors text-center active:scale-95">↓ 保存图片</button>
                <button onClick={() => onNavigate('shops', { result, nail: selectedNail })}
                  className="flex-1 px-3 py-2 bg-purple-500/80 backdrop-blur text-white text-xs rounded-xl hover:bg-purple-500 transition-colors text-center active:scale-95">💅 找美甲店</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
