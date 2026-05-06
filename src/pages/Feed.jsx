import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react'

// ── 动态数据（从 manifest.json 加载）─────────────────
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

function formatLikes(n) {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return n
}

// 固化间距参数
const S = {
  cardPaddingX: 8,
  imgToTitle: 8,
  titleFontSize: 14,
  titleLineHeight: 20,
  titleToAuthor: 6,
  cardPaddingBottom: 8,
  authorAvatarSize: 18,
  authorGap: 4,
  authorToLike: 10,
  likeIconToCount: 2,
  likeIconSize: 16,
  columnGap: 5,
  columnPaddingX: 5,
  cardMarginBottom: 5,
}

export default function Feed({ onPost, onAIChat, onUpload }) {
  const [activeTab, setActiveTab] = useState('discover')
  const [poolMap, setPoolMap] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const sentinelRef = useRef(null)

  // 启动时从 manifest 加载数据
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
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center" style={{ fontFamily: "-apple-system, 'PingFang SC', sans-serif", position:'relative' }}>
      <div className="w-full max-w-[375px] relative">
      {/* 导航栏 */}
      <div className="bg-white flex items-center h-[44px] px-[16px] sticky top-0 z-20">
        <button onClick={onAIChat} className="shrink-0 mr-[12px]">
          <img src="/icons/dots.svg" alt="menu" className="w-[22px] h-[22px]" />
        </button>
        <div className="flex-1 flex items-center justify-center gap-[28px]">
          {[
            { key: 'follow', label: '关注' },
            { key: 'discover', label: '发现' },
            { key: 'nearby', label: '附近' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className="relative pb-[2px]">
              <span style={{ fontSize: 16, fontWeight: activeTab === tab.key ? 600 : 400 }}
                className={activeTab === tab.key ? 'text-[#222]' : 'text-[#999]'}>
                {tab.label}
              </span>
              {activeTab === tab.key && (
                <div className="absolute left-1/2 -translate-x-1/2 w-[28px] h-[2px] rounded-full bg-[#FF2442]" style={{ top: 'calc(100% + 2px)' }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 瀑布流 */}
      <div style={{ padding: `${S.columnPaddingX}px ${S.columnPaddingX}px 90px` }}>
        <div className="columns-2" style={{ gap: `${S.columnGap}px` }}>
          {posts.map((post) => (
            <div key={post.id} onClick={() => onPost(post)}
              className="bg-white rounded-[4px] overflow-hidden cursor-pointer active:opacity-90 break-inside-avoid"
              style={{ marginBottom: `${S.cardMarginBottom}px` }}>
              {/* 封面图 */}
              <div className="w-full aspect-square bg-[#f0f0f0] relative overflow-hidden">
                <img src={post.images[0]} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
              {/* 标题 + 作者 */}
              <div style={{ padding: `${S.imgToTitle}px ${S.cardPaddingX}px ${S.cardPaddingBottom}px` }}>
                <p className="font-medium"
                  style={{
                    fontSize: `${S.titleFontSize}px`,
                    lineHeight: `${S.titleLineHeight}px`,
                    marginBottom: `${S.titleToAuthor}px`,
                    color: 'rgba(0,0,0,0.8)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                  {post.title}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center min-w-0 flex-1" style={{ gap: `${S.authorGap}px` }}>
                    <div className="rounded-full bg-[#f5f5f5] flex items-center justify-center shrink-0 overflow-hidden"
                      style={{ width: `${S.authorAvatarSize}px`, height: `${S.authorAvatarSize}px` }}>
                      <span style={{ fontSize: Math.max(8, S.authorAvatarSize * 0.5) }}>
                        {post.type === 'nail' ? '💅' : post.type === 'pet' ? '🐱' : post.type === 'rental' ? '🏠' : post.type === 'portrait' ? '📷' : '✨'}
                      </span>
                    </div>
                    <span className="text-[#999] text-[11px] truncate">{post.author}</span>
                  </div>
                  <div className="flex items-center shrink-0" style={{ marginLeft: `${S.authorToLike}px`, gap: `${S.likeIconToCount}px` }}>
                    <svg style={{ width: `${S.likeIconSize}px`, height: `${S.likeIconSize}px` }} viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    <span className="text-[#999] text-[13px]">{formatLikes(post.likes)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 加载更多哨兵 */}
        <div ref={sentinelRef} className="py-4 flex justify-center">
          {loading && (
            <svg className="animate-spin h-5 w-5 text-[#FF2442]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
        </div>
      </div>

      {/* 底部导航 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[375px] bg-white border-t border-[#eee] z-10" style={{ maxWidth: 375 }}>
        <div className="flex items-center justify-around px-[10px] h-[50px]">
          <button className="flex items-center justify-center"><span className="text-[#222] text-[16px] font-medium">首页</span></button>
          <button className="flex items-center justify-center"><span className="text-[#999] text-[16px]">购物</span></button>
          <div className="flex items-center justify-center"><img src="/发布.png" alt="publish" className="h-[30px] w-auto" /></div>
          <button className="flex items-center justify-center"><span className="text-[#999] text-[16px]">消息</span></button>
          <button className="flex items-center justify-center"><span className="text-[#999] text-[16px]">我</span></button>
        </div>
        <div className="flex justify-center pb-[8px]"><div className="w-[139px] h-[5px] rounded-[2.5px] bg-black" /></div>
      </div>
      {/* 浮动上传入口 — 在 375px 内容区右侧外面 */}
      <button onClick={onUpload}
        className="absolute right-[-40px] bottom-[120px] w-[32px] h-[32px] bg-white/90 rounded-r-[8px] shadow-md z-40 flex items-center justify-center border border-[#eee] border-l-0 active:scale-95 transition-transform"
        title="素材上传">
        <span style={{ fontSize:16, color:'rgba(0,0,0,0.4)' }}>+</span>
      </button>
      </div>
  )
}
