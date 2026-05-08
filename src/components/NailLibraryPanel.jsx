import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { loadLibrary, saveLibrary } from '../utils/nailLibrary'
import BottomPanel from './BottomPanel'

const P = 16
const G = 12

export default function NailLibraryPanel({ selected, onSelect, open, onClose, category = 'nail' }) {
  const [nails, setNails] = useState(() => {
    const all = loadLibrary()
    let changed = false
    const migrated = all.map(n => { if (!n.category) { changed = true; return { ...n, category: 'nail' } } return n })
    if (changed) saveLibrary(migrated)
    return migrated.filter(n => n.category === category)
  })
  const [deleteMode, setDeleteMode] = useState(false)
  const [activeGroup, setActiveGroup] = useState(null) // 当前选中组id
  const [groupImgIdx, setGroupImgIdx] = useState({}) // 每组当前展示的图片下标
  const longPressTimer = useRef(null)

  // 每次打开时重新加载
  useEffect(() => {
    if (open) {
      const all = loadLibrary().filter(n => n.category === category)
      setNails(all)
    }
  }, [open, category])

  const update = (u) => setNails(p => {
    const next = typeof u === 'function' ? u(p) : u
    const withCat = next.map(item => item.category ? item : { ...item, category })
    const others = loadLibrary().filter(x => x.category !== category)
    saveLibrary([...others, ...withCat])
    return withCat
  })

  const groups = useMemo(() => {
    const map = {}
    nails.forEach(n => {
      const k = n.groupId || ('single_' + n.id)
      if (!map[k]) map[k] = { id: k, label: n.groupLabel || '单张上传', items: [] }
      map[k].items.push(n)
    })
    return Object.values(map)
  }, [nails])

  const groupById = useMemo(() => {
    const m = {}
    groups.forEach(g => { m[g.id] = g })
    return m
  }, [groups])

  const [c0, c1] = useMemo(() => {
    const a = [[], []]
    groups.forEach((g, i) => a[i % 2].push(g))
    return a
  }, [groups])

  const add = (f) => {
    if (!f?.type.startsWith('image/')) return
    const r = new FileReader()
    r.onload = e => update(p => [...p, { id: Date.now(), src: e.target.result }])
    r.readAsDataURL(f)
  }

  const removeGroup = useCallback((gid) => {
    update(p => p.filter(n => (n.groupId || ('single_' + n.id)) !== gid))
    if (activeGroup === gid) setActiveGroup(null)
    if (selected?.groupId === gid) onSelect(null)
  }, [selected, onSelect, activeGroup])

  const clearAll = useCallback(() => {
    update([])
    onSelect(null)
    setActiveGroup(null)
    setDeleteMode(false)
  }, [onSelect])

  // 选中组封面图片索引
  const imgIdxFor = (gid) => groupImgIdx[gid] || 0

  const setImgIdxFor = (gid, idx) => {
    setGroupImgIdx(p => ({ ...p, [gid]: idx }))
  }

  const handleCardClick = (gid, cover) => {
    if (deleteMode) return
    setActiveGroup(gid)
    onSelect(cover)
    // 重置这个组的图索引到封面
    setImgIdxFor(gid, groupById[gid]?.items.indexOf(cover) >= 0 ? groupById[gid].items.indexOf(cover) : 0)
  }

  const prevImg = (gid, e) => {
    e.stopPropagation()
    const g = groupById[gid]
    if (!g || g.items.length <= 1) return
    setImgIdxFor(gid, (imgIdxFor(gid) - 1 + g.items.length) % g.items.length)
  }
  const nextImg = (gid, e) => {
    e.stopPropagation()
    const g = groupById[gid]
    if (!g || g.items.length <= 1) return
    setImgIdxFor(gid, (imgIdxFor(gid) + 1) % g.items.length)
  }

  // 长按进入删除模式
  const onTouchStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => setDeleteMode(true), 600)
  }, [])
  const onTouchEnd = useCallback(() => {
    clearTimeout(longPressTimer.current)
  }, [])
  useEffect(() => { if (!open) { setDeleteMode(false); setActiveGroup(null) } }, [open])

  const handleUploadClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true
    input.onchange = (e) => {
      Array.from(e.target.files).forEach(add)
      e.target.value = ''
    }
    input.click()
  }

  const colW = `calc((100% - ${G}px) / 2)`

  return (
    <BottomPanel open={open} onClose={onClose} title="美甲库" height={609}>
      <div style={{ padding: `0 ${P}px`, fontFamily: 'PingFang SC, sans-serif', display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* 本地上传卡片 */}
        <button onClick={handleUploadClick} style={{
          width: '100%', height: 56, borderRadius: 12, border: '1.5px dashed #ddd',
          background: '#fafafa', marginBottom: G, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.3)' }}>本地上传</span>
        </button>

        {/* 双列网格 */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', gap: G }}>
          {groups.length > 0 ? (
            <>
              {[c0, c1].map((col, ci) => (
                <div key={ci} style={{ width: colW, display: 'flex', flexDirection: 'column', gap: G }}>
                  {col.map(g => {
                    const isActive = activeGroup === g.id
                    const idx = imgIdxFor(g.id)
                    const imgSrc = g.items[idx]?.src || g.items[0]?.src
                    const total = g.items.length
                    return (
                      <div key={g.id}
                        onClick={() => handleCardClick(g.id, g.items[idx] || g.items[0])}
                        onTouchStart={onTouchStart}
                        onTouchEnd={onTouchEnd}
                        onMouseDown={onTouchStart}
                        onMouseUp={onTouchEnd}
                        onMouseLeave={onTouchEnd}
                        style={{ position: 'relative' }}>
                        {/* 删除按钮 */}
                        {deleteMode && (
                          <button data-delete-btn
                            onClick={(e) => { e.stopPropagation(); removeGroup(g.id) }}
                            style={{
                              position: 'absolute', top: 6, left: 6, zIndex: 10,
                              width: 24, height: 24, borderRadius: '50%',
                              background: 'rgba(255,36,66,0.9)', border: 'none',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', padding: 0,
                            }}>
                            <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                              <path d="M2 2L12 12M12 2L2 12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </button>
                        )}
                        <div style={{
                          borderRadius: 20, overflow: 'hidden',
                          border: isActive ? '2px solid #83F2DF' : '2px solid transparent',
                          boxShadow: isActive ? '0 1px 31px rgba(131,242,223,0.3)' : 'none',
                        }}>
                          <img src={imgSrc} alt="" style={{ width: '100%', display: 'block', borderRadius: 17 }} />
                        </div>
                        {/* 左右滑动箭头 (激活且多图时显示) */}
                        {isActive && !deleteMode && total > 1 && (
                          <>
                            <button onClick={(e) => prevImg(g.id, e)} style={{
                              position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)',
                              width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,0.5)',
                              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              zIndex: 5, cursor: 'pointer', padding: 0,
                            }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="15 18 9 12 15 6"/></svg>
                            </button>
                            <button onClick={(e) => nextImg(g.id, e)} style={{
                              position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                              width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,0.5)',
                              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              zIndex: 5, cursor: 'pointer', padding: 0,
                            }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="9 18 15 12 9 6"/></svg>
                            </button>
                            {/* 张数指示 */}
                            <div style={{
                              position: 'absolute', top: 6, right: 6, zIndex: 5,
                              padding: '2px 6px', borderRadius: 10, background: 'rgba(0,0,0,0.5)',
                              color: 'white', fontSize: 10, lineHeight: '14px',
                            }}>{idx + 1}/{total}</div>
                          </>
                        )}
                        {isActive && !deleteMode && (
                          <div style={{ position: 'absolute', top: 8, left: 8, padding: '2px 8px', borderRadius: 10, background: '#83F2DF', color: 'rgba(0,0,0,0.7)', fontSize: 10, fontWeight: 500, lineHeight: '18px' }}>当前款式</div>
                        )}
                        <div style={{
                          position: 'absolute', bottom: 0, left: 0, right: 0,
                          padding: '6px 10px',
                          background: 'linear-gradient(transparent, rgba(0,0,0,0.45))',
                          borderBottomLeftRadius: 18, borderBottomRightRadius: 18,
                          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                        }}>
                          <span style={{ color: '#fff', fontSize: 11, fontWeight: 500, lineHeight: '16px' }}>{g.label}</span>
                          {total > 1 && <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, whiteSpace: 'nowrap' }}>{total}张</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <div style={{ width: 48, height: 48, borderRadius: 24, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.2)', margin: 0 }}>点击上方按钮上传图片</p>
            </div>
          )}
        </div>

        {/* 删除模式底部栏 */}
        {deleteMode && (
          <div style={{
            flexShrink: 0, background: 'white', borderTop: '1px solid #eee',
            display: 'flex', gap: 12, padding: '10px 0',
          }}>
            <button onClick={clearAll} style={{
              flex: 1, height: 40, borderRadius: 20,
              background: 'white', border: '1px solid #FF2442',
              color: '#FF2442', fontSize: 14, fontWeight: 500, cursor: 'pointer',
            }}>一键清空</button>
            <button onClick={() => setDeleteMode(false)} style={{
              flex: 1, height: 40, borderRadius: 20,
              background: '#333', border: 'none',
              color: 'white', fontSize: 14, fontWeight: 500, cursor: 'pointer',
            }}>完成</button>
          </div>
        )}
      </div>
    </BottomPanel>
  )
}
