import { useState, useRef, useCallback, useEffect } from 'react'
import { Colors, Type } from '../config/design'

const TAG_MAP = { nail: '#美甲分享', pet: '#毛孩子日常', rental: '#租房日记', portrait: '#写真约拍' }

async function loadPostPools() {
  try {
    const r = await fetch('/api/manifest?t=' + Date.now())
    return await r.json()
  } catch {
    return null
  }
}

function generatePosts(count, poolMap) {
  const categories = Object.keys(poolMap).filter(k => poolMap[k]?.length > 0)
  if (!categories.length) return []
  const result = []
  const counters = {}
  categories.forEach(k => { counters[k] = 0 })

  for (let i = 0; i < count; i++) {
    const type = categories[i % categories.length]
    const pool = poolMap[type]
    const idx = counters[type] % pool.length
    counters[type]++
    const p = pool[idx]
    result.push({
      id: Date.now() + i,
      title: p.title,
      author: p.author,
      likes: p.likes + Math.floor(Math.random() * 20),
      images: p.images || [],
      content: p.title,
      tags: [TAG_MAP[type] || `#${type}`],
      type,
    })
  }
  return result
}

function fmt(n) {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return n
}

// Tab 配置
const TABS = [
  { key: 'follow', label: '关注', hasExpand: true },
  { key: 'discover', label: '发现' },
  { key: 'nearby', label: '附近' },
]

// 次级导航标签
const SUB_TABS = [
  { key: 'recommend', label: '推荐' },
  { key: 'nail', label: '美甲' },
  { key: 'pet', label: '宠物' },
  { key: 'rental', label: '租房' },
  { key: 'portrait', label: '写真' },
  { key: 'live', label: '直播' },
]

export default function Feed({ onPost, onAIChat, onUpload }) {
  const [activeTab, setActiveTab] = useState('discover')
  const [activeSubTab, setActiveSubTab] = useState('recommend')
  const [poolMap, setPoolMap] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const sentinelRef = useRef(null)

  useEffect(() => {
    loadPostPools().then(pm => {
      if (pm) {
        setPoolMap(pm)
        setPosts(generatePosts(20, pm))
      }
    })
  }, [])

  const loadMore = useCallback(() => {
    if (loading || !poolMap) return
    setLoading(true)
    setTimeout(() => {
      setPosts(prev => [...prev, ...generatePosts(10, poolMap)])
      setLoading(false)
    }, 300)
  }, [loading, poolMap])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore() },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  return (
    <div className="min-h-screen flex flex-col items-center"
      style={{ fontFamily: "'PingFang SC', -apple-system, 'SF Pro', sans-serif", background: Colors.pageBg }}>

      <div className="w-full bg-white flex flex-col items-center" style={{ maxWidth: 375 }}>

        {/* ── SystemBar 系统状态栏 ── */}
        <div className="w-full flex items-center justify-start px-[16px] h-[44px]" style={{ maxWidth: 375 }}>
          <img src="/icons/systembar.svg" alt="" className="w-full h-[44px]" />
        </div>

        {/* ── 导航栏: menu + Tab + search ── */}
        <div className="w-full flex items-center px-[16px] h-[44px]" style={{ maxWidth: 375 }}>
          {/* 左侧: 点点入口 */}
          <button onClick={onAIChat} className="shrink-0 mr-[12px] flex items-center justify-center">
            <img src="/icons/dots.svg" alt="dots" style={{ width: 48, height: 44, marginLeft: -8 }} />
          </button>

          {/* 中间: Tab */}
          <div className="flex-1 flex items-center justify-center gap-[28px]">
            {TABS.map(tab => {
              const isActive = activeTab === tab.key
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className="relative pb-[2px] flex flex-col items-center">
                  <div className="flex items-center">
                    <span style={{
                      fontSize: Type.tab.size,
                      fontWeight: isActive ? Type.tab.weight : Type.tabInactive.weight,
                      color: isActive ? '#222' : Colors.textHint,
                      lineHeight: `${Type.tab.lh}px`,
                    }}>
                      {tab.label}
                    </span>
                    {tab.hasExpand && (
                      <img src="/icons/expand-tab.svg" alt="" style={{ width: 16, height: 16, marginLeft: 2 }} />
                    )}
                  </div>
                  {isActive && (
                    <div className="absolute rounded-full bg-[#FF2442]"
                      style={{ width: 28, height: 2, bottom: -2, left: '50%', transform: 'translateX(-50%)' }} />
                  )}
                </button>
              )
            })}
          </div>

          {/* 右侧: 搜索 */}
          <button className="shrink-0 ml-[12px] flex items-center justify-center">
            <img src="/icons/search.svg" alt="search" style={{ width: 48, height: 44, marginRight: -8 }} />
          </button>
        </div>
      </div>

      {/* ── 次级导航栏 ── */}
      <div className="w-full bg-white flex items-center px-[16px] h-[36px] gap-[20px] overflow-x-auto"
        style={{ maxWidth: 375, scrollbarWidth: 'none' }}>
        {SUB_TABS.map(st => {
          const isActive = activeSubTab === st.key
          return (
            <button key={st.key} onClick={() => setActiveSubTab(st.key)}
              className="shrink-0 relative h-full flex items-center">
              <span style={{
                fontSize: 14, fontWeight: isActive ? 500 : 400,
                color: isActive ? '#222' : Colors.textHint,
                lineHeight: '20px',
              }}>
                {st.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[20px] h-[2px] rounded-full bg-[#FF2442]" />
              )}
            </button>
          )
        })}
      </div>

      {/* ── 瀑布流内容区 ── */}
      <div className="w-full flex flex-col items-center" style={{ maxWidth: 375, background: Colors.pageBg }}>
        <div style={{ padding: `5px 5px 90px` }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {/* 左列 */}
            <div style={{ width: 180, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {posts.filter((_, i) => i % 2 === 0).map(post => (
                <PostCard key={post.id} post={post} onPost={onPost} />
              ))}
            </div>
            {/* 右列 */}
            <div style={{ width: 180, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {posts.filter((_, i) => i % 2 === 1).map(post => (
                <PostCard key={post.id} post={post} onPost={onPost} />
              ))}
            </div>
          </div>

          {/* 哨兵 */}
          <div ref={sentinelRef} className="py-4 flex justify-center">
            {loading && (
              <svg className="animate-spin h-5 w-5 text-[#FF2442]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* ── 底部导航栏 ── */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full bg-white border-t border-[#eee] z-10 flex flex-col items-center"
        style={{ maxWidth: 375 }}>
        <div className="flex items-center justify-around w-full h-[50px] px-[10px]">
          <span style={{ fontSize: Type.tab.size, fontWeight: Type.tab.weight, color: '#222' }}>首页</span>
          <span style={{ fontSize: Type.tab.size, fontWeight: 400, color: Colors.textHint }}>购物</span>
          <div className="flex items-center justify-center">
            <img src="/发布.png" alt="publish" className="h-[30px] w-auto" />
          </div>
          <span style={{ fontSize: Type.tab.size, fontWeight: 400, color: Colors.textHint }}>消息</span>
          <span style={{ fontSize: Type.tab.size, fontWeight: 400, color: Colors.textHint }}>我</span>
        </div>
        <div className="pb-[8px] flex justify-center">
          <div className="w-[139px] h-[5px] rounded-[2.5px] bg-black" />
        </div>
      </div>

      {/* ── 浮动上传入口 ── */}
      <button onClick={onUpload}
        style={{
          position: 'fixed', top: '50%', zIndex: 40,
          width: 28, height: 48,
          left: 'calc(50% + 187.5px)',
          background: 'rgba(255,255,255,0.9)',
          borderTopLeftRadius: 8, borderBottomLeftRadius: 8,
          border: '1px solid #e0e0e0', borderRight: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          transform: 'translateY(-50%)',
          boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
        }}
        title="素材上传">
        <span style={{ fontSize: 18, color: 'rgba(0,0,0,0.4)', lineHeight: '18px' }}>+</span>
      </button>
    </div>
  )
}

// ─── 单个帖子卡片组件 ───
function PostCard({ post, onPost }) {
  const imgH = post.id % 3 === 0 ? 240 : 180

  return (
    <div onClick={() => onPost(post)}
      className="bg-white rounded-[4px] overflow-hidden cursor-pointer active:opacity-90"
      style={{ width: 180 }}>

      {/* 封面图 */}
      <div className="relative bg-[#f0f0f0] overflow-hidden" style={{ width: 180, height: imgH }}>
        <img src={post.images[0]} alt="" className="w-full h-full object-cover" loading="lazy" />
      </div>

      {/* 内容区 */}
      <div style={{ padding: '8px 8px 8px' }}>
        {/* 标题 */}
        <p style={{
          fontSize: Type.cardTitle.size,
          fontWeight: Type.cardTitle.weight,
          lineHeight: `${Type.cardTitle.lh}px`,
          color: Colors.textPrimary,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          marginBottom: 6,
        }}>
          {post.title}
        </p>

        {/* 作者行 */}
        <div className="flex items-center justify-between" style={{ height: 18 }}>
          <div className="flex items-center min-w-0 flex-1" style={{ gap: 4 }}>
            <div className="rounded-full bg-[#f5f5f5] flex items-center justify-center shrink-0 overflow-hidden"
              style={{ width: 18, height: 18 }}>
              <span style={{ fontSize: 9 }}>
                {post.type === 'nail' ? '💅' : post.type === 'pet' ? '🐱' : post.type === 'rental' ? '🏠' : post.type === 'portrait' ? '📷' : '✨'}
              </span>
            </div>
            <span style={{ fontSize: Type.nickname.size, fontWeight: Type.nickname.weight, color: Colors.textHint, lineHeight: `${Type.nickname.lh}px` }}
              className="truncate">
              {post.author}
            </span>
          </div>

          {/* 点赞 */}
          <div className="flex items-center shrink-0" style={{ gap: 2, marginLeft: 10 }}>
            <img src="/icons/like-heart.svg" alt="like" style={{ width: 16, height: 16 }} />
            <span style={{ fontSize: Type.small.size, fontWeight: Type.small.weight, color: Colors.textHint }}>
              {fmt(post.likes)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
