import { useState, useRef, useCallback, useEffect } from 'react'
import { Colors, Type } from '../config/design'

const TAG_MAP = { nail: '#美甲分享', pet: '#毛孩子日常', rental: '#租房日记', portrait: '#写真约拍' }

// 美甲标题池
const NAIL_TITLES = [
  '🐾 | Mark 一组好看的淡人清透感美甲！！🤍',
  '💅🏻 分享一组醋酸美甲+白月光美甲～',
  '✨ | 氛围感拉满！春日猫眼美甲合集 🌸',
  '🫧 极简温柔ins风美甲，日常百搭不挑皮',
  '💫 | 黄皮亲妈！显白到尖叫的冰透美甲',
  '🎀 法式少女心美甲分享，约会必备款 💗',
  '🌿 | 适合上班族的低调优雅裸色美甲',
  '🦋 蝴蝶结+珍珠！甜到冒泡的日系美甲',
  '🍊 | 夏天的第一副荧光色系美甲，活力满格',
  '❄️ 高级感拉满的镜面银美甲，酷女孩必备',
]

// 美甲正文池
const NAIL_CONTENTS = [
  `💅🏻分享一组醋酸美甲+白月光美甲～
🫧适合淡人的清透感美甲，日常百搭。

-原博主已经图片上标注（注明），文案自己原创。
-审核请勿误判[抱拳R]

🌟创作说明：
本帖为二次创作整合。
素材源于小红书博主，版权归原作者
图片文案为原创，只单纯分享，无广！！

#浪漫生活的记录者 #美甲 #美甲推荐 #氛围感美甲 #ins美甲 #温柔美甲 #白月光美甲 #猫眼美甲 #百搭美甲 #简约美甲`,
  `✨挖到宝了！这款冰透猫眼美甲也太仙了吧～

🫧清透感满分，光线下一闪一闪的超级好看。
黄皮上手完全不显黑，反而衬得很干净。

-图源小红书博主，已标注出处。
-文案原创，纯分享无广[飞吻R]

🌸适合：日常通勤/约会/拍照
💅🏻甲型：方圆甲/梯形甲都好看

#美甲分享 #冰透美甲 #猫眼美甲 #显白美甲 #温柔美甲`,
  `🌸春日限定！粉嫩桃花美甲分享～

粉透底+金箔+小珍珠点缀
温柔又有灵气，上手超级少女心💗

特别适合春天出门踏青拍照
搭配浅色裙子绝美！！

-素材源自小红书博主分享
-文案原创整理，无广纯分享✨

#氛围感美甲 #春日美甲 #少女心美甲 #桃花美甲`,
  `🍃极简风美甲合集｜上班族必备低调款

裸色打底+极细银边
简约不简单，越看越高级的那种！

甲面干净利落，开会见客户完全得体
长度适中，打字也不会不方便～

✨原创文案整理，图片版权归原作者
🤍理性种草，按需参考～

#极简美甲 #上班族美甲 #裸色美甲 #高级感美甲`,
  `💫黄皮进来抄作业！这组显白美甲绝了

酒红渐变+碎金箔点缀
上手的一瞬间白了一个度！！！
室内低调室外惊艳，越看越爱🌹

适合秋冬和正式场合
搭配西装或者小黑裙都绝了

-素材源自小红书，版权归原作者
-文案原创整理，纯分享无广～

#显白美甲 #酒红美甲 #秋冬美甲 #气质美甲`,
]

// 宠物/租房/写真标题池
const PET_TITLES = [
  '🐱 | 给毛孩子换了新装扮，也太可爱了吧！',
  '🐶 周末带狗子去宠物友好咖啡店探店 ☕',
  '🐾 | 猫主子的新衣服，穿上就不肯脱了',
  '🦴 小型犬穿搭指南！可爱又实用～',
]
const RENTAL_TITLES = [
  '🏠 | 这间一室户的户型也太方正了吧',
  '🔑 实地看了这套房，户型比预期好太多',
  '🏡 | 帮大家还原了这套房子的户型结构',
  '📐 从照片分析户型布局，果然南北通透',
]
const PORTRAIT_TITLES = [
  '📷 | 这组写真风格太适合春天拍了',
  '✨ 发现一个超会拍的写真工作室',
  '🎞️ | 胶片写真真的是永远的神',
  '📸 韩式清新vs日系胶片，你pick哪个',
]

async function loadPostPools() {
  try {
    const r = await fetch('/api/manifest?t=' + Date.now())
    return await r.json()
  } catch {
    return null
  }
}

async function loadFakeNailPosts() {
  try {
    const r = await fetch('/api/fake-nail-posts?t=' + Date.now())
    return await r.json()
  } catch {
    return []
  }
}

function mapPostsFromSource(items, type) {
  return (items || []).map((p, index) => {
    let title = p.title
    let content = p.title
    if (type === 'nail') {
      title = NAIL_TITLES[index % NAIL_TITLES.length]
      content = NAIL_CONTENTS[index % NAIL_CONTENTS.length]
    } else if (type === 'pet') {
      title = PET_TITLES[index % PET_TITLES.length]
    } else if (type === 'rental') {
      title = RENTAL_TITLES[index % RENTAL_TITLES.length]
    } else if (type === 'portrait') {
      title = PORTRAIT_TITLES[index % PORTRAIT_TITLES.length]
    }
    return {
      id: `${type}-${index}-${p.images?.[0] || p.title}`,
      title,
      author: p.author,
      likes: p.likes + Math.floor(Math.random() * 20),
      images: p.images || [],
      content,
      tags: [TAG_MAP[type] || `#${type}`],
      type,
    }
  })
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
    let title = p.title, content = p.title
    if (type === 'nail') {
      title = NAIL_TITLES[i % NAIL_TITLES.length]
      content = NAIL_CONTENTS[i % NAIL_CONTENTS.length]
    } else if (type === 'pet') {
      title = PET_TITLES[i % PET_TITLES.length]
    } else if (type === 'rental') {
      title = RENTAL_TITLES[i % RENTAL_TITLES.length]
    } else if (type === 'portrait') {
      title = PORTRAIT_TITLES[i % PORTRAIT_TITLES.length]
    }
    result.push({
      id: Date.now() + i,
      title,
      author: p.author,
      likes: p.likes + Math.floor(Math.random() * 20),
      images: p.images || [],
      content,
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
  { key: 'follow', label: '关注' },
  { key: 'discover', label: '发现' },
  { key: 'nearby', label: '附近' },
]

// 次级导航标签
const SUB_TABS = [
  { key: 'recommend', label: '推荐' },
  { key: 'nail', label: '美甲' },
  { key: 'live', label: '直播' },
  { key: 'drama', label: '短剧' },
  { key: 'wear', label: '穿搭' },
  { key: 'travel', label: '旅行' },
  { key: 'anime', label: '动漫' },
  { key: 'anime2', label: '动漫' },
]

export default function Feed({ onPost, onAIChat }) {
  const [activeTab, setActiveTab] = useState('discover')
  const [activeSubTab, setActiveSubTab] = useState('nail')
  const [poolMap, setPoolMap] = useState(null)
  const [fakeNailPosts, setFakeNailPosts] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const sentinelRef = useRef(null)
  const scrollRef = useRef(null)

  const displayedPosts = activeSubTab === 'nail'
    ? posts.filter(post => post.type === 'nail')
    : posts

  useEffect(() => {
    Promise.all([loadPostPools(), loadFakeNailPosts()]).then(([pm, nailPm]) => {
      if (pm) setPoolMap(pm)
      if (Array.isArray(nailPm)) setFakeNailPosts(nailPm)
    })
  }, [])

  useEffect(() => {
    if (activeSubTab === 'nail') {
      if (fakeNailPosts.length) {
        setPosts(mapPostsFromSource(fakeNailPosts, 'nail'))
      }
      return
    }
    if (poolMap) {
      setPosts(generatePosts(20, poolMap))
    }
  }, [activeSubTab, poolMap, fakeNailPosts])

  const loadMore = useCallback(() => {
    if (activeSubTab === 'nail') return
    const currentPool = activeSubTab === 'nail' ? { nail: fakeNailPosts } : poolMap
    if (loading || !currentPool || (activeSubTab === 'nail' && !fakeNailPosts.length)) return
    setLoading(true)
    setTimeout(() => {
      setPosts(prev => [...prev, ...generatePosts(10, currentPool)])
      setLoading(false)
    }, 300)
  }, [activeSubTab, fakeNailPosts, loading, poolMap])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const root = scrollRef.current
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore() },
      { root, rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  return (
    <div className="flex flex-col items-center"
      style={{ fontFamily: "'PingFang SC', -apple-system, 'SF Pro', sans-serif", background: Colors.pageBg, minHeight: '100%', height: '100%' }}>

      <div className="w-full bg-white flex flex-col items-center" style={{ maxWidth: 375, minHeight: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>

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

          {/* 中间: Tab (52x44, padding 12/8) */}
          <div className="flex-1 flex items-center justify-center" style={{ gap: 0 }}>
            {TABS.map(tab => {
              const isActive = activeTab === tab.key
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className="relative flex items-center"
                  style={{ height: 44, padding: '8px 12px' }}>
                  <span style={{
                    fontSize: Type.tab.size,
                    fontWeight: isActive ? Type.tab.weight : Type.tabInactive.weight,
                    color: isActive ? '#222' : Colors.textHint,
                    lineHeight: `${Type.tab.lh}px`,
                  }}>
                    {tab.label}
                  </span>
                  {isActive && (
                    <div className="absolute rounded-full bg-[#FF2442]"
                      style={{ width: 28, height: 2, bottom: 6, left: '50%', transform: 'translateX(-50%)' }} />
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

        {/* ── 次级导航栏 (Figma: 375x40, tabs 52x40, padding 12/8) ── */}
        <div className="w-full bg-white relative overflow-hidden shrink-0" style={{ maxWidth: 375, height: 40 }}>
          {/* 可滚动 tab 列表 */}
          <div className="flex items-center h-full overflow-x-auto" style={{ scrollbarWidth: 'none', paddingRight: 60 }}>
            {SUB_TABS.map(st => {
              const isActive = activeSubTab === st.key
              return (
                <button key={st.key} onClick={() => setActiveSubTab(st.key)}
                  className="shrink-0 flex items-center justify-center"
                  style={{ height: 40, padding: '8px 12px', minWidth: 52 }}>
                  <span style={{
                    fontSize: 14, fontWeight: isActive ? 500 : 400,
                    color: isActive ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.45)',
                    lineHeight: '20px',
                  }}>
                    {st.label}
                  </span>
                </button>
              )
            })}
          </div>

          {/* 右边：渐变遮罩 + 白色实心 + 展开箭头 */}
          <div className="absolute right-0 top-0 flex items-center pointer-events-none" style={{ height: 40 }}>
            <div style={{
              width: 34, height: 40,
              background: 'linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,1))',
            }} />
            <div style={{ width: 28, height: 40, background: '#fff' }} />
          </div>
          <button className="absolute right-0 top-0 flex items-center justify-center"
            style={{ width: 28, height: 40 }}>
            <img src="/icons/expand-tab.svg" alt="展开" style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* ── 可滚动主内容区 ── */}
        <div
          ref={scrollRef}
          className="w-full flex-1 overflow-y-auto"
          style={{ maxWidth: 375, background: Colors.pageBg, minHeight: 0 }}
        >
          <div className="w-full flex flex-col items-center" style={{ maxWidth: 375, background: Colors.pageBg }}>
            <div style={{ padding: `5px 5px 90px` }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {/* 左列 */}
                <div style={{ width: 180, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {displayedPosts.filter((_, i) => i % 2 === 0).map(post => (
                    <PostCard key={post.id} post={post} onPost={onPost} />
                  ))}
                </div>
                {/* 右列 */}
                <div style={{ width: 180, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {displayedPosts.filter((_, i) => i % 2 === 1).map(post => (
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
        </div>

        {/* ── 底部导航栏 ── */}
        <div className="absolute left-0 right-0 bg-white border-t border-[#eee] z-10 flex flex-col items-center"
          style={{ bottom: 32 }}>
          <div className="flex items-center justify-around w-full h-[50px] px-[10px]">
            <span style={{ fontSize: Type.tab.size, fontWeight: Type.tab.weight, color: '#222' }}>首页</span>
            <span style={{ fontSize: Type.tab.size, fontWeight: 400, color: Colors.textHint }}>购物</span>
            <div className="flex items-center justify-center">
              <img src="/发布.png" alt="publish" className="h-[30px] w-auto" />
            </div>
            <span style={{ fontSize: Type.tab.size, fontWeight: 400, color: Colors.textHint }}>消息</span>
            <span style={{ fontSize: Type.tab.size, fontWeight: 400, color: Colors.textHint }}>我</span>
          </div>
        </div>

        {/* 底部白条 32px */}
        <div className="absolute bottom-0 left-0 right-0 bg-white z-10" style={{ height: 32 }} />

      </div>
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
