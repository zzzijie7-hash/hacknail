import { useState, useRef, useCallback, useEffect } from 'react'
import { apiUrl } from '../lib/api'

const CATEGORIES = [
  { key: 'nail', label: '美甲', icon: '💅' },
  { key: 'pet', label: '宠物', icon: '🐾' },
  { key: 'rental', label: '租房', icon: '🏠' },
  { key: 'portrait', label: '写真', icon: '📷' },
]

export default function UploadPage({ onBack }) {
  const [category, setCat] = useState('nail')
  const [files, setFiles] = useState([])
  const [uploading, setUp] = useState(false)
  const [done, setDone] = useState(null)
  const inputRef = useRef()

  const previews = files.map(f => URL.createObjectURL(f))

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const fs = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    setFiles(prev => [...prev, ...fs])
  }, [])

  const remove = (i) => {
    setFiles(prev => prev.filter((_, j) => j !== i))
  }

  const upload = async () => {
    if (!files.length) return
    setUp(true)
    const fd = new FormData()
    fd.append('category', category)
    files.forEach(f => fd.append('files', f))
    try {
      const r = await fetch(apiUrl('/upload'), { method: 'POST', body: fd })
      const d = await r.json()
      setDone(d)
      setFiles([])
    } catch (e) {
      setDone({ error: e.message })
    }
    setUp(false)
  }

  useEffect(() => { return () => previews.forEach(u => URL.revokeObjectURL(u)) }, [files])

  return (
    <div style={{ minHeight:'100%', height:'100%', background:'#FAFAFA', fontFamily:'PingFang SC, sans-serif', display:'flex', flexDirection:'column', alignItems:'center' }}>
      <div style={{ width:'100%', maxWidth:600, padding:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
          <button onClick={() => { window.dispatchEvent(new Event('feed:refresh')); onBack() }} style={{ border:'none', background:'none', cursor:'pointer', fontSize:16 }}>← 返回</button>
          <span style={{ fontSize:18, fontWeight:600 }}>素材上传</span>
        </div>

        {/* 类别选择 */}
        <div style={{ display:'flex', gap:8, marginBottom:20 }}>
          {CATEGORIES.map(c => (
            <button key={c.key} onClick={() => setCat(c.key)}
              style={{
                padding:'10px 20px', borderRadius:12, border: category===c.key ? '2px solid #FF2442' : '2px solid #e0e0e0',
                background: category===c.key ? '#FFF0F0' : '#fff', cursor:'pointer',
                fontSize:15, fontWeight: category===c.key ? 600 : 400,
                display:'flex', alignItems:'center', gap:6, transition:'all 0.15s',
              }}>
              <span>{c.icon}</span> {c.label}
            </button>
          ))}
        </div>

        {/* 拖拽区 */}
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current.click()}
          style={{
            border:'2px dashed #ccc', borderRadius:16, padding:60, textAlign:'center',
            background:'#fff', cursor:'pointer', marginBottom:16,
            transition:'border-color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor='#FF2442'}
          onMouseLeave={e => e.currentTarget.style.borderColor='#ccc'}
        >
          <div style={{ fontSize:40, marginBottom:12 }}>📁</div>
          <p style={{ color:'rgba(0,0,0,0.45)', fontSize:14, margin:0 }}>拖拽图片到此处，或点击选择</p>
          <p style={{ color:'rgba(0,0,0,0.2)', fontSize:12, margin:'4px 0 0' }}>支持 JPG/PNG/WebP/GIF</p>
        </div>
        <input ref={inputRef} type="file" accept="image/*" multiple hidden
          onChange={e => { const fs = Array.from(e.target.files).filter(f => f.type.startsWith('image/')); setFiles(prev => [...prev, ...fs]) }} />

        {/* 预览 */}
        {files.length > 0 && (
          <>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16 }}>
              {previews.map((url, i) => (
                <div key={i} style={{ position:'relative', width:100, height:100, borderRadius:10, overflow:'hidden' }}>
                  <img src={url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  <button onClick={() => remove(i)}
                    style={{ position:'absolute', top:4, right:4, width:22, height:22, borderRadius:11, background:'rgba(0,0,0,0.5)', color:'#fff', border:'none', cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button onClick={upload} disabled={uploading}
              style={{
                width:'100%', padding:'14px', borderRadius:12, background: uploading ? '#f5f5f5' : '#FF2442',
                color: uploading ? 'rgba(0,0,0,0.3)' : '#fff', border:'none', fontSize:16, fontWeight:600, cursor:'pointer',
              }}>
              {uploading ? '上传中…' : `上传 ${files.length} 张图片到「${CATEGORIES.find(c=>c.key===category)?.label}」`}
            </button>
          </>
        )}

        {done && !done.error && (
          <div style={{ marginTop:12, padding:12, borderRadius:10, background:'#f0fff4', border:'1px solid #c6f6d5', color:'#276749', fontSize:14 }}>
            上传成功！已添加 {done.saved} 张图片到「{CATEGORIES.find(c=>c.key===done.category)?.label}」分组 #{done.group_id}
          </div>
        )}
        {done?.error && (
          <div style={{ marginTop:12, padding:12, borderRadius:10, background:'#fff5f5', border:'1px solid #fed7d7', color:'#c53030', fontSize:14 }}>
            上传失败：{done.error}
          </div>
        )}
      </div>
    </div>
  )
}
