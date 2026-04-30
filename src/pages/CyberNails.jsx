import { useState, useRef, useEffect } from 'react'

const STORAGE_KEY = 'cyber_nails_library'

function loadLibrary() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveLibrary(nails) {
  // 只保存没有 file 对象的（url 来源），file 对象无法序列化
  const serializable = nails.filter(n => !n.file).map(n => ({ id: n.id, src: n.src }))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable))
}

// ── 手部图上传区 ──────────────────────────────────────────────
function HandUpload({ file, onFile }) {
  const inputRef = useRef()
  const cameraRef = useRef()

  const handleDrop = (e) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f?.type.startsWith('image/')) onFile(f)
  }

  return (
    <div className="w-full">
      <p className="text-gray-400 text-xs mb-3 uppercase tracking-wider">手部照片</p>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="relative w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-gray-700 bg-gray-900 overflow-hidden"
      >
        {file ? (
          <>
            <img
              src={URL.createObjectURL(file)}
              alt="hand"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <button
              onClick={() => onFile(null)}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/60 text-white text-sm flex items-center justify-center hover:bg-black/80"
            >
              ✕
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <p className="text-gray-500 text-sm">上传手部照片</p>
            <div className="flex gap-3">
              <button
                onClick={() => cameraRef.current.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 text-gray-300 text-sm hover:bg-gray-700 transition-colors"
              >
                📷 拍照
              </button>
              <button
                onClick={() => inputRef.current.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 text-gray-300 text-sm hover:bg-gray-700 transition-colors"
              >
                🖼 相册
              </button>
            </div>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => e.target.files[0] && onFile(e.target.files[0])} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={(e) => e.target.files[0] && onFile(e.target.files[0])} />
      </div>
    </div>
  )
}

// ── 美甲库 ────────────────────────────────────────────────────
function NailLibrary({ selected, onSelect }) {
  const [nails, setNails] = useState(() => loadLibrary())
  const [urlInput, setUrlInput] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState(null)
  const [deleteMode, setDeleteMode] = useState(false)
  const uploadRef = useRef()

  const updateNails = (updater) => {
    setNails((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      saveLibrary(next)
      return next
    })
  }

  const addFile = (file) => {
    if (!file?.type.startsWith('image/')) return
    // 转成 base64 存储
    const reader = new FileReader()
    reader.onload = (e) => {
      const nail = { id: Date.now(), src: e.target.result }
      updateNails((prev) => [...prev, nail])
    }
    reader.readAsDataURL(file)
  }

  const deleteNail = (id) => {
    updateNails((prev) => prev.filter(n => n.id !== id))
    if (selected?.id === id) onSelect(null)
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
        const newNails = data.images.map((src, i) => ({ id: Date.now() + i, src }))
        updateNails((prev) => [...prev, ...newNails])
        setUrlInput('')
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
    <div className="w-full">
      <p className="text-gray-400 text-xs mb-3 uppercase tracking-wider">美甲库</p>

      {/* 链接解析 */}
      <div className="flex gap-2 mb-3">
        <input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && parseUrl()}
          placeholder="粘贴小红书链接…"
          className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500 transition-colors"
        />
        <button
          onClick={parseUrl}
          disabled={parsing || !urlInput.trim()}
          className="px-4 py-2.5 rounded-xl bg-gray-800 text-gray-300 text-sm hover:bg-gray-700 disabled:opacity-40 transition-colors whitespace-nowrap"
        >
          {parsing ? '解析中…' : '解析'}
        </button>
      </div>
      {parseError && (
        <p className="text-red-400 text-xs mb-3">{parseError}</p>
      )}

      {/* 网格标题栏 */}
      {nails.length > 0 && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600 text-xs">{nails.length} 张</span>
          <button
            onClick={() => setDeleteMode(d => !d)}
            className={`text-xs px-2 py-1 rounded-lg transition-colors ${deleteMode ? 'text-red-400 bg-red-900/20' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {deleteMode ? '完成' : '管理'}
          </button>
        </div>
      )}

      {/* 网格 */}
      <div className="grid grid-cols-3 gap-2">
        {/* 上传按钮 */}
        <div
          onClick={() => uploadRef.current.click()}
          className="aspect-square rounded-xl border-2 border-dashed border-gray-700 bg-gray-900 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-purple-500 hover:bg-gray-800 transition-colors"
        >
          <span className="text-2xl text-gray-600">+</span>
          <span className="text-gray-600 text-xs">上传</span>
        </div>
        <input ref={uploadRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => e.target.files[0] && addFile(e.target.files[0])} />

        {/* 美甲图网格 */}
        {nails.map((nail) => (
          <div
            key={nail.id}
            onClick={() => !deleteMode && onSelect(nail)}
            className={`
              relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all
              ${!deleteMode && selected?.id === nail.id
                ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-[#0a0a0a] scale-95'
                : !deleteMode ? 'hover:scale-95' : ''
              }
            `}
          >
            <img src={nail.src} alt="nail" className="w-full h-full object-cover" />
            {!deleteMode && selected?.id === nail.id && (
              <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                <span className="text-white text-lg">✓</span>
              </div>
            )}
            {deleteMode && (
              <button
                onClick={(e) => { e.stopPropagation(); deleteNail(nail.id) }}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {nails.length === 0 && (
        <p className="text-gray-700 text-xs text-center mt-4">
          上传美甲图或粘贴小红书链接
        </p>
      )}
    </div>
  )
}

// ── 主页面 ────────────────────────────────────────────────────
export default function CyberNails({ onBack }) {
  const [handFile, setHandFile] = useState(null)
  const [selectedNail, setSelectedNail] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const canGenerate = handFile && selectedNail && !loading

  const generate = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    const form = new FormData()
    form.append('hand', handFile)

    if (selectedNail.file) {
      form.append('nail', selectedNail.file)
    } else if (selectedNail.src.startsWith('data:')) {
      // base64 转 blob
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
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const download = () => {
    const a = document.createElement('a')
    a.href = result
    a.download = 'cyber_nails.png'
    a.click()
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center py-10 px-5">
      {/* Header */}
      <div className="w-full max-w-xl mb-6">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-white text-sm mb-5 flex items-center gap-1 transition-colors"
        >
          ← 返回
        </button>
        <h1 className="text-3xl font-bold text-white">💅 Cyber Nails</h1>
        <p className="text-gray-500 text-sm mt-1">上传手部图，从美甲库选款式，AI 帮你试戴</p>
      </div>

      <div className="w-full max-w-xl flex flex-col gap-6">
        {/* 手部上传 */}
        <HandUpload file={handFile} onFile={setHandFile} />

        {/* 美甲库 */}
        <NailLibrary selected={selectedNail} onSelect={setSelectedNail} />

        {/* 生成按钮 */}
        <button
          onClick={generate}
          disabled={!canGenerate}
          className={`
            w-full py-4 rounded-2xl font-semibold text-base transition-all duration-200
            ${canGenerate
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90 hover:scale-[1.02] shadow-lg shadow-purple-900/40'
              : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }
          `}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              AI 正在生成，约需 30-60 秒…
            </span>
          ) : '✦ 生成美甲效果'}
        </button>

        {/* 错误 */}
        {error && (
          <div className="p-4 rounded-xl bg-red-900/30 border border-red-800 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* 结果 */}
        {result && (
          <div>
            <p className="text-gray-400 text-xs mb-2 uppercase tracking-wider">生成结果</p>
            <div className="relative rounded-2xl overflow-hidden">
              <img src={result} alt="result" className="w-full rounded-2xl" />
              <button
                onClick={download}
                className="absolute bottom-4 right-4 px-4 py-2 bg-black/60 backdrop-blur text-white text-sm rounded-xl hover:bg-black/80 transition-colors"
              >
                ↓ 保存
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
