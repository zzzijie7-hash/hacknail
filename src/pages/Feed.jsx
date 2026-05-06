import { useState, useRef, useCallback, useEffect } from 'react'

// ── 真实帖子数据 ──────────────────────────────────
const V = '?v=4'
const NAIL_POSTS = [
  { title: '极光镭射美甲 光线下绝了✨', author: '闪闪惹人爱', likes: 326,
    images: ['/posts/nail/post0_0.jpg'+V] },
  { title: '法式裸色猫眼 温柔到骨子里🤍', author: 'nana美甲日记', likes: 512,
    images: ['/posts/nail/post1_0.jpg'+V, '/posts/nail/post1_1.jpg'+V, '/posts/nail/post1_2.jpg'+V] },
  { title: '果冻透色甲 夏天就做这一款', author: 'CrystalNail', likes: 198,
    images: ['/posts/nail/post2_0.jpg'+V, '/posts/nail/post2_1.jpg'+V, '/posts/nail/post2_2.jpg'+V] },
  { title: '玫瑰金渐变 把手变得好白🌹', author: '美甲师CC', likes: 437,
    images: ['/posts/nail/post3_0.jpg'+V, '/posts/nail/post3_1.jpg'+V] },
  { title: '立体水钻方头 气场全开女王范', author: '女王指艺', likes: 689,
    images: ['/posts/nail/post4_0.jpg'+V, '/posts/nail/post4_1.jpg'+V, '/posts/nail/post4_2.jpg'+V] },
  { title: '莫兰迪雾霾蓝 低调高级感', author: 'ColorLab', likes: 273,
    images: ['/posts/nail/post5_0.jpg'+V, '/posts/nail/post5_1.jpg'+V] },
  { title: '蝴蝶结立体甲 约会必备款🎀', author: '甜心美甲屋', likes: 841,
    images: ['/posts/nail/post6_0.jpg'+V] },
  { title: '黑色蕾丝镂空 暗黑公主降临🖤', author: 'DarkNails', likes: 556,
    images: ['/posts/nail/post7_0.jpg'+V, '/posts/nail/post7_1.jpg'+V] },
  { title: '碎花田园风 春日限定', author: '花花指尖', likes: 365,
    images: ['/posts/nail/post8_0.jpg'+V, '/posts/nail/post8_1.jpg'+V] },
  { title: '金箔大理石纹 轻奢名媛风', author: '名媛指艺', likes: 492,
    images: ['/posts/nail/post9_0.jpg'+V, '/posts/nail/post9_1.jpg'+V] },
]

const PET_POSTS = [
  { title: '小三花上线 今天也要吸猫🐱', author: '猫奴小日记', likes: 458,
    images: ['/posts/pet/pet0_0.jpg'+V, '/posts/pet/pet0_1.jpg'+V, '/posts/pet/pet0_2.jpg'+V] },
  { title: '我家柯基今天又卖萌了🥺', author: '柯基王子', likes: 892,
    images: ['/posts/pet/pet1_0.jpg'+V, '/posts/pet/pet1_1.jpg'+V, '/posts/pet/pet1_2.jpg'+V, '/posts/pet/pet1_3.jpg'+V] },
  { title: '布偶猫日常美照大放送', author: '布偶星球', likes: 634,
    images: ['/posts/pet/pet2_0.jpg'+V, '/posts/pet/pet2_1.jpg'+V, '/posts/pet/pet2_2.jpg'+V] },
  { title: '柴犬的100种表情包合集', author: '柴柴君', likes: 521,
    images: ['/posts/pet/pet3_0.jpg'+V, '/posts/pet/pet3_1.jpg'+V, '/posts/pet/pet3_2.jpg'+V] },
  { title: '金毛的大耳朵太治愈了🦮', author: '金毛日常', likes: 776,
    images: ['/posts/pet/pet4_0.jpg'+V, '/posts/pet/pet4_1.jpg'+V, '/posts/pet/pet4_2.jpg'+V] },
]

const RENTAL_POSTS = [
  { title: '一室户｜独居女孩的治愈小窝🏠', author: '居家小达人', likes: 892,
    images: ['/posts/rental/rental0_0.jpg'+V, '/posts/rental/rental0_1.jpg'+V, '/posts/rental/rental0_2.jpg'+V, '/posts/rental/rental0_3.jpg'+V, '/posts/rental/rental0_4.jpg'+V] },
  { title: '整租两居室 朝南采光好 ☀️', author: '租房日记', likes: 645,
    images: ['/posts/rental/rental1_0.jpg'+V, '/posts/rental/rental1_1.jpg'+V, '/posts/rental/rental1_2.jpg'+V, '/posts/rental/rental1_3.jpg'+V, '/posts/rental/rental1_4.jpg'+V, '/posts/rental/rental1_5.jpg'+V] },
  { title: '奶油风公寓｜性价比之王', author: '租房小能手', likes: 523,
    images: ['/posts/rental/rental2_0.jpg'+V, '/posts/rental/rental2_1.jpg'+V, '/posts/rental/rental2_2.jpg'+V, '/posts/rental/rental2_3.jpg'+V, '/posts/rental/rental2_4.jpg'+V] },
  { title: 'Loft 绝美装修｜拎包入住', author: '看房日记', likes: 938,
    images: ['/posts/rental/rental3_0.jpg'+V, '/posts/rental/rental3_1.jpg'+V, '/posts/rental/rental3_2.jpg'+V, '/posts/rental/rental3_3.jpg'+V, '/posts/rental/rental3_4.jpg'+V, '/posts/rental/rental3_5.jpg'+V] },
]

const PORTRAIT_POSTS = [
  { title: '民国风写真｜穿越回老上海', author: '复古摄影馆', likes: 723,
    images: ['/posts/portrait/portrait0_0.jpg'+V, '/posts/portrait/portrait0_1.jpg'+V, '/posts/portrait/portrait0_2.jpg'+V, '/posts/portrait/portrait0_3.jpg'+V] },
  { title: '氛围感头像照 姐妹们给我冲📷', author: '拍照姿势大全', likes: 891,
    images: ['/posts/portrait/portrait1_0.jpg'+V, '/posts/portrait/portrait1_1.jpg'+V, '/posts/portrait/portrait1_2.jpg'+V] },
  { title: '草地野餐拍照指南🍃', author: '摄影爱好者', likes: 567,
    images: ['/posts/portrait/portrait2_0.jpg'+V, '/posts/portrait/portrait2_1.jpg'+V, '/posts/portrait/portrait2_2.jpg'+V] },
  { title: '银杏季人像写真全攻略', author: '约拍日记', likes: 445,
    images: ['/posts/portrait/portrait3_0.jpg'+V, '/posts/portrait/portrait3_1.jpg'+V, '/posts/portrait/portrait3_2.jpg'+V] },
  { title: '宿舍也能出片！低成本写真', author: '学生党拍照', likes: 678,
    images: ['/posts/portrait/portrait4_0.jpg'+V, '/posts/portrait/portrait4_1.jpg'+V] },
]

// ── 类别流水线 ──────────────────────────────────────
const PATTERN  = ['nail', 'pet', 'rental', 'portrait', 'nail', 'rental', 'pet', 'portrait', 'nail', 'pet', 'rental', 'portrait']
const TAG_MAP  = { nail: '#美甲分享', pet: '#毛孩子日常', rental: '#租房日记', portrait: '#写真约拍' }
const POOL_MAP = { nail: NAIL_POSTS, pet: PET_POSTS, rental: RENTAL_POSTS, portrait: PORTRAIT_POSTS }

function generatePosts(count) {
  const result = []
  const counters = {}
  Object.keys(POOL_MAP).forEach(k => { counters[k] = 0 })

  for (let i = 0; i < count; i++) {
    const type = PATTERN[i % PATTERN.length]
    const pool = POOL_MAP[type]
    const idx = counters[type] % pool.length
    counters[type]++
    const p = pool[idx]
    result.push({
      id: Date.now() + i,
      title: p.title,
      author: p.author,
      likes: p.likes + Math.floor(Math.random() * 20),
      images: p.images,
      content: p.title,
      tags: [TAG_MAP[type]],
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

export default function Feed({ onPost, onAIChat }) {
  const [activeTab, setActiveTab] = useState('discover')
  const [posts, setPosts] = useState(() => generatePosts(20))
  const [loading, setLoading] = useState(false)
  const sentinelRef = useRef(null)

  const loadMore = useCallback(() => {
    if (loading) return
    setLoading(true)
    // 模拟网络延迟
    setTimeout(() => {
      setPosts(prev => [...prev, ...generatePosts(10)])
      setLoading(false)
    }, 600)
  }, [loading])

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
    <div className="min-h-screen bg-[#FAFAFA] relative overflow-x-hidden flex flex-col items-center" style={{ fontFamily: "-apple-system, 'PingFang SC', sans-serif" }}>
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
        <button className="shrink-0 ml-[12px]">
          <img src="/搜索.png" alt="search" className="w-[22px] h-[22px]" />
        </button>
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
                        {post.type === 'nail' ? '💅' : post.type === 'pet' ? '🐱' : post.type === 'home' ? '🏠' : post.type === 'outfit' ? '👗' : post.type === 'movie' ? '🎬' : '☕'}
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
      </div>
    </div>
  )
}
