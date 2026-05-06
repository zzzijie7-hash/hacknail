import { useState, useRef, useMemo } from 'react'
import { loadLibrary, saveLibrary } from '../utils/nailLibrary'
import BottomPanel from './BottomPanel'

const PAD = 16   // 容器左右边距
const GAP_X = 13 // 列间距
const GAP_Y = 12 // 图片垂直间距

export default function NailLibraryPanel({ selected, onSelect, open, onClose }) {
  const [nails, setNails] = useState(() => loadLibrary())
  const [urlInput, setUrlInput] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState(null)
  const uploadRef = useRef()

  const updateNails = (updater) => {
    setNails((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      saveLibrary(next)
      return next
    })
  }

  const groups = nails.reduce((acc, nail) => {
    const key = nail.groupId || 'upload'
    if (!acc[key]) acc[key] = { id: key, label: nail.groupLabel || '本地上传', items: [] }
    acc[key].items.push(nail)
    return acc
  }, {})

  const groupList = Object.values(groups)
  const allNails = groupList.flatMap(g => g.items)

  // 两列：交替分配保均衡
  const columns = useMemo(() => {
    const col0 = [], col1 = []
    allNails.forEach((n, i) => i % 2 === 0 ? col0.push(n) : col1.push(n))
    return [col0, col1]
  }, [allNails])

  const addFile = (file) => {
    if (!file?.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      updateNails((prev) => [...prev, { id: Date.now(), src: e.target.result }])
    }
    reader.readAsDataURL(file)
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

  return (
    <BottomPanel open={open} onClose={onClose} title="美甲库">
      <div className="px-[16px]">
        {/* 搜索输入 */}
        <div className="flex gap-[8px] mb-[12px]">
          <div className="flex-1 relative">
            <input
              value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && parseUrl()}
              placeholder="粘贴小红书链接或搜索款式"
              className="w-full bg-[#f5f5f5] rounded-[10px] px-[12px] py-[8px] text-[12px] text-[rgba(0,0,0,0.8)] placeholder-[rgba(0,0,0,0.25)] outline-none focus:ring-1 focus:ring-[#83F2DF]/50"
            />
            {urlInput && !parsing && (
              <button onClick={() => setUrlInput('')} className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[rgba(0,0,0,0.2)] text-[10px]">✕</button>
            )}
          </div>
          <button onClick={parseUrl} disabled={parsing || !urlInput.trim()}
            className="px-[14px] py-[8px] rounded-[10px] bg-[#FF2442] text-white text-[12px] disabled:opacity-40 active:scale-95 transition-transform whitespace-nowrap">
            {parsing ? '解析中...' : '解析'}
          </button>
        </div>
        {parseError && <p className="text-[#FF6B6B] text-[11px] mb-[6px]">{parseError}</p>}

        {/* 上传按钮行 */}
        <div className="flex items-center justify-between mb-[12px]">
          <span className="text-[rgba(0,0,0,0.35)] text-[12px]">{nails.length} 款</span>
          <button onClick={() => uploadRef.current.click()}
            className="w-[28px] h-[28px] rounded-full bg-[#f5f5f5] flex items-center justify-center active:scale-90 transition-transform">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
        <input ref={uploadRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => e.target.files[0] && addFile(e.target.files[0])} />

        {/* 两列 masonry 网格 */}
        {allNails.length > 0 ? (
          <div className="flex gap-[13px]">
            {columns.map((col, ci) => (
              <div key={ci} className="flex-1 flex flex-col gap-[12px]" style={{ width: `calc((100% - 13px) / 2)` }}>
                {col.map((nail) => {
                  const isSelected = selected?.id === nail.id
                  return (
                    <div key={nail.id} onClick={() => onSelect(nail)}
                      className="relative cursor-pointer active:scale-[0.98] transition-transform">
                      <div className={`rounded-[20px] overflow-hidden ${isSelected ? 'ring-[2px] ring-[#83F2DF]' : ''}`}
                        style={{ boxShadow: isSelected ? '0 1px 31px rgba(131,242,223,0.3)' : undefined }}>
                        <img src={nail.src} alt="nail" className="w-full block" style={{ borderRadius: '18px' }} />
                      </div>
                      {isSelected && (
                        <div className="absolute top-[8px] left-[8px] px-[8px] py-[2px] rounded-[10px] bg-[#83F2DF] text-[rgba(0,0,0,0.7)] text-[10px] font-medium">
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
          <div className="flex flex-col items-center py-[40px] gap-[10px]">
            <div className="w-[40px] h-[40px] rounded-full bg-[#f5f5f5] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <p className="text-[rgba(0,0,0,0.2)] text-[13px]">上传图片或粘贴链接添加款式</p>
          </div>
        )}
      </div>
    </BottomPanel>
  )
}
