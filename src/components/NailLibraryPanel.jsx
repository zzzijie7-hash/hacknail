import { useState, useRef } from 'react'
import { loadLibrary, saveLibrary } from '../utils/nailLibrary'
import BottomPanel from './BottomPanel'

const P = 16  // padding
const G = 12  // gap everywhere

export default function NailLibraryPanel({ selected, onSelect, open, onClose, category = 'nail' }) {
  const [nails, setNails] = useState(() => {
    const all = loadLibrary()
    // 旧数据迁移：无 category 默认 nail
    let changed = false
    const migrated = all.map(n => { if (!n.category) { changed = true; return { ...n, category: 'nail' } } return n })
    if (changed) saveLibrary(migrated)
    return migrated.filter(n => n.category === category)
  })
  const [urlInput, setUrlInput] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState(null)
  const uploadRef = useRef()

  const update = (u) => setNails(p => {
    const next = typeof u === 'function' ? u(p) : u
    const withCat = next.map(item => item.category ? item : { ...item, category })
    const others = loadLibrary().filter(x => x.category !== category)
    saveLibrary([...others, ...withCat])
    return withCat
  })

  const groups = nails.reduce((a, n) => {
    const k = n.groupId || 'upload'
    if (!a[k]) a[k] = { id: k, label: n.groupLabel || '本地上传', items: [] }
    a[k].items.push(n)
    return a
  }, {})
  // 每个组作为一个款式卡片，封面用首图
  const groupList = Object.values(groups)

  // 交替分配两列
  const [c0, c1] = [[], []]
  groupList.forEach((g, i) => (i % 2 === 0 ? c0 : c1).push(g))

  const add = (f) => {
    if (!f?.type.startsWith('image/')) return
    const r = new FileReader()
    r.onload = e => update(p => [...p, { id: Date.now(), src: e.target.result }])
    r.readAsDataURL(f)
  }

  const parse = async () => {
    if (!urlInput.trim()) return
    setParsing(true); setParseError(null)
    try {
      const r = await fetch('/api/parse-nail-url', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: urlInput.trim() }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.detail || '解析失败')
      if (d.images?.length) {
        const gid = 'link_' + Date.now()
        const nn = d.images.map((s, i) => ({ id: Date.now() + i, src: s, groupId: gid, groupLabel: '小红书导入' }))
        update(p => [...p, ...nn])
        setUrlInput('')
        if (nn.length) onSelect(nn[0])
      } else setParseError('未找到图片')
    } catch (e) { setParseError(e.message) }
    finally { setParsing(false) }
  }

  const colW = `calc((100% - ${G}px) / 2)`

  return (
    <BottomPanel open={open} onClose={onClose} title="美甲库">
      <div style={{ padding: `0 ${P}px`, fontFamily: 'PingFang SC, sans-serif' }}>

        {/* 搜索 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: G }}>
          <input value={urlInput} onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && parse()}
            placeholder="粘贴小红书链接或搜索款式"
            style={{ flex:1, background:'#f5f5f5', borderRadius:10, padding:'8px 12px', fontSize:12, color:'rgba(0,0,0,0.8)', border:'none', outline:'none' }} />
          <button onClick={parse} disabled={parsing || !urlInput.trim()}
            style={{ padding:'8px 14px', borderRadius:10, background:'#FF2442', color:'#fff', fontSize:12, border:'none', cursor:'pointer', opacity: parsing||!urlInput.trim() ? 0.4 : 1, whiteSpace:'nowrap' }}>
            {parsing ? '解析中…' : '解析'}
          </button>
        </div>
        {parseError && <p style={{ color:'#FF6B6B', fontSize:11, margin:'0 0 6px' }}>{parseError}</p>}

        {/* 上传 */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:G }}>
          <span style={{ fontSize:12, color:'rgba(0,0,0,0.35)' }}>{nails.length} 款</span>
          <button onClick={() => uploadRef.current.click()}
            style={{ width:28, height:28, borderRadius:14, background:'#f5f5f5', border:'none', cursor:'pointer', padding:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
        <input ref={uploadRef} type="file" accept="image/*" hidden onChange={e => e.target.files[0] && add(e.target.files[0])} />

        {/* === 两列网格 === */}
        {groupList.length > 0 ? (
          <div style={{ display:'flex', gap:G }}>
            {[c0, c1].map((col, ci) => (
              <div key={ci} style={{ width:colW, display:'flex', flexDirection:'column', gap:G }}>
                {col.map(g => {
                  const cover = g.items[0]
                  const isSel = selected?.groupId === g.id
                  return (
                    <div key={g.id} onClick={() => { onSelect(cover); onClose() }}
                      style={{ position:'relative', cursor:'pointer' }}>
                      <div style={{
                        borderRadius:20, overflow:'hidden',
                        border: isSel ? '2px solid #83F2DF' : '2px solid transparent',
                        boxShadow: isSel ? '0 1px 31px rgba(131,242,223,0.3)' : 'none',
                      }}>
                        <img src={cover.src} alt="" style={{ width:'100%', display:'block', borderRadius:17 }} />
                      </div>
                      {/* 款式名 + 张数 */}
                      <div style={{
                        position:'absolute', bottom:0, left:0, right:0,
                        padding:'6px 10px',
                        background:'linear-gradient(transparent, rgba(0,0,0,0.45))',
                        borderBottomLeftRadius:18, borderBottomRightRadius:18,
                        display:'flex', justifyContent:'space-between', alignItems:'flex-end',
                      }}>
                        <span style={{ color:'#fff', fontSize:11, fontWeight:500, lineHeight:'16px' }}>{g.label}</span>
                        {g.items.length > 1 && <span style={{ color:'rgba(255,255,255,0.7)', fontSize:10, whiteSpace:'nowrap' }}>{g.items.length}张</span>}
                      </div>
                      {isSel && <div style={{ position:'absolute', top:8, left:8, padding:'2px 8px', borderRadius:10, background:'#83F2DF', color:'rgba(0,0,0,0.7)', fontSize:10, fontWeight:500, lineHeight:'18px' }}>当前款式</div>}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'40px 0', gap:10 }}>
            <div style={{ width:40, height:40, borderRadius:20, background:'#f5f5f5', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </div>
            <p style={{ fontSize:13, color:'rgba(0,0,0,0.2)', margin:0 }}>上传图片或粘贴链接添加款式</p>
          </div>
        )}
      </div>
    </BottomPanel>
  )
}
