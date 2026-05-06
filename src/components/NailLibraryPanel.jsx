import { useState, useRef } from 'react'
import { loadLibrary, saveLibrary } from '../utils/nailLibrary'
import BottomPanel from './BottomPanel'

const GAP = 12

export default function NailLibraryPanel({ selected, onSelect, open, onClose }) {
  const [nails, setNails] = useState(() => loadLibrary())
  const [urlInput, setUrlInput] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState(null)
  const uploadRef = useRef()

  const updateNails = (updater) => {
    setNails((prev) => { const n = typeof updater === 'function' ? updater(prev) : updater; saveLibrary(n); return n })
  }

  const groups = nails.reduce((acc, nail) => {
    const key = nail.groupId || 'upload'
    if (!acc[key]) acc[key] = { id: key, label: nail.groupLabel || '本地上传', items: [] }
    acc[key].items.push(nail)
    return acc
  }, {})
  const allNails = Object.values(groups).flatMap(g => g.items)

  const col0 = [], col1 = []
  allNails.forEach((n, i) => (i % 2 === 0 ? col0 : col1).push(n))

  const addFile = (file) => {
    if (!file?.type.startsWith('image/')) return
    const r = new FileReader()
    r.onload = (e) => updateNails(p => [...p, { id: Date.now(), src: e.target.result }])
    r.readAsDataURL(file)
  }

  const parseUrl = async () => {
    if (!urlInput.trim()) return
    setParsing(true); setParseError(null)
    try {
      const res = await fetch('/api/parse-nail-url', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: urlInput.trim() }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || '解析失败')
      if (data.images?.length) {
        const gid = 'link_' + Date.now()
        const nn = data.images.map((s, i) => ({ id: Date.now() + i, src: s, groupId: gid, groupLabel: '小红书导入' }))
        updateNails(p => [...p, ...nn])
        setUrlInput('')
        if (nn.length) onSelect(nn[0])
      } else setParseError('未找到图片，请手动上传')
    } catch (e) { setParseError(e.message) }
    finally { setParsing(false) }
  }

  return (
    <BottomPanel open={open} onClose={onClose} title="美甲库">
      <div className="px-4" style={{ fontFamily: "PingFang SC, sans-serif" }}>
        {/* 搜索 */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <input value={urlInput} onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && parseUrl()}
              placeholder="粘贴小红书链接或搜索款式"
              className="w-full bg-[#f5f5f5] rounded-[10px] px-3 py-2 text-xs text-[rgba(0,0,0,0.8)] placeholder:text-[rgba(0,0,0,0.25)] outline-none border-none"
            />
          </div>
          <button onClick={parseUrl} disabled={parsing || !urlInput.trim()}
            className="px-[14px] py-2 rounded-[10px] bg-[#FF2442] text-white text-xs disabled:opacity-40 active:scale-95 transition-transform whitespace-nowrap">
            {parsing ? '解析中...' : '解析'}
          </button>
        </div>
        {parseError && <p className="text-[#FF6B6B] text-[11px] mb-[6px]">{parseError}</p>}

        {/* 上传 + 计数 */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-[rgba(0,0,0,0.35)]">{nails.length} 款</span>
          <button onClick={() => uploadRef.current.click()}
            className="w-7 h-7 rounded-full bg-[#f5f5f5] flex items-center justify-center active:scale-90 transition-transform">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
        <input ref={uploadRef} type="file" accept="image/*" hidden
          onChange={e => e.target.files[0] && addFile(e.target.files[0])} />

        {/* 两列网格 — flex 替代 columns-2 */}
        {allNails.length > 0 ? (
          <div className="flex" style={{ gap: GAP }}>
            {[col0, col1].map((col, ci) => (
              <div key={ci} className="flex-1 flex flex-col" style={{ gap: GAP }}>
                {col.map(nail => {
                  const isSel = selected?.id === nail.id
                  return (
                    <div key={nail.id} onClick={() => onSelect(nail)}
                      className="relative cursor-pointer active:scale-[0.98] transition-transform">
                      <div className={`rounded-[20px] overflow-hidden ${isSel ? 'shadow-[0_1px_31px_rgba(131,242,223,0.3)]' : ''}`}>
                        <img src={nail.src} alt="nail"
                          className={`w-full block ${isSel ? 'ring-[2px] ring-[#83F2DF]' : ''}`}
                          style={{ borderRadius: 18 }} />
                      </div>
                      {isSel && (
                        <div className="absolute top-2 left-2 px-2 py-[2px] rounded-[10px] bg-[#83F2DF] text-[rgba(0,0,0,0.7)] text-[10px] font-medium">
                          当前款式
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-10 gap-[10px]">
            <div className="w-10 h-10 rounded-full bg-[#f5f5f5] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <p className="text-[13px] text-[rgba(0,0,0,0.2)]">上传图片或粘贴链接添加款式</p>
          </div>
        )}
      </div>
    </BottomPanel>
  )
}
