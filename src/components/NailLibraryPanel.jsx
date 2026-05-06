import { useState, useRef } from 'react'
import { loadLibrary, saveLibrary } from '../utils/nailLibrary'
import BottomPanel from './BottomPanel'

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

  const addFile = (file) => {
    if (!file?.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      updateNails((prev) => [...prev, { id: Date.now(), src: e.target.result }])
    }
    reader.readAsDataURL(file)
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

  const handleSelect = (nail) => {
    onSelect(nail)
  }

  return (
    <BottomPanel
      open={open}
      onClose={onClose}
      title="智能穿戴美甲"
      subtitle="海边拍照·绝佳机位"
    >
      <div className="px-[12px]">
        {/* 搜索/链接输入 */}
        <div className="flex gap-[8px] mb-[12px]">
          <div className="flex-1 relative">
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && parseUrl()}
              placeholder="粘贴小红书链接或搜索款式"
              className="w-full bg-white/10 rounded-[10px] px-[12px] py-[8px] text-[12px] text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-white/20 transition"
            />
            {urlInput && !parsing && (
              <button onClick={() => setUrlInput('')} className="absolute right-[10px] top-1/2 -translate-y-1/2 text-white/30 text-[10px]">✕</button>
            )}
          </div>
          <button
            onClick={parseUrl}
            disabled={parsing || !urlInput.trim()}
            className="px-[14px] py-[8px] rounded-[10px] bg-[#FF2442] text-white text-[12px] disabled:opacity-40 active:scale-95 transition-transform whitespace-nowrap"
          >
            {parsing ? '解析中...' : '解析'}
          </button>
        </div>
        {parseError && <p className="text-[#FF6B6B] text-[11px] mb-[6px]">{parseError}</p>}

        {/* 上传按钮 */}
        <div className="flex items-center justify-between mb-[10px]">
          <span className="text-white/50 text-[12px]">{nails.length} 款</span>
          <button
            onClick={() => uploadRef.current.click()}
            className="w-[28px] h-[28px] rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
        <input ref={uploadRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => e.target.files[0] && addFile(e.target.files[0])} />

        {/* 瀑布流美甲图网格 */}
        {groupList.length > 0 ? (
          <div className="columns-2 gap-[8px]">
            {groupList.map((group) =>
              group.items.map((nail) => {
                const isSelected = selected?.id === nail.id
                return (
                  <div
                    key={nail.id}
                    onClick={() => handleSelect(nail)}
                    className="mb-[8px] break-inside-avoid relative cursor-pointer group"
                  >
                    <div className={`rounded-[16px] overflow-hidden transition-all
                      ${isSelected ? 'ring-[2.5px] ring-[#FF2442] ring-offset-[2px] ring-offset-black' : 'hover:opacity-90'}`}>
                      <img src={nail.src} alt="nail" className="w-full object-cover" style={{ aspectRatio: '3/4' }} />
                    </div>
                    {/* 选中标签 */}
                    {isSelected && (
                      <div className="absolute top-[8px] left-[8px] px-[8px] py-[2px] rounded-[10px] bg-[#FF2442] text-white text-[10px] font-medium">
                        当前款式
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center py-[40px] gap-[10px]">
            <div className="w-[40px] h-[40px] rounded-full bg-white/10 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white/20" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <p className="text-white/30 text-[13px]">上传图片或粘贴链接添加款式</p>
          </div>
        )}
      </div>
    </BottomPanel>
  )
}
