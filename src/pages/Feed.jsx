import { useState, useRef, useCallback, useEffect } from 'react'

const unsplash = (id, w = 400, h = 400) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=80`

// ── 帖子模板库 ──────────────────────────────────────────────
const NAIL_POSTS = [
  { title: 'nail share 💅 海莉比伯同款蹭粉美甲', author: 'seazacc nail', likes: 43, img: 'uk4lSX58e7M' },
  { title: '蹭粉就是这样蹭的！闪到没朋友✨', author: '指尖DESIGN', likes: 59, img: 'tXwBDZS2JxQ' },
  { title: '温柔又高级！皮粉色法式➕蹭粉💅🏻', author: 'Ranx Nail', likes: 9, img: '51-4BSipn7E' },
  { title: '白月光美甲 春天必做款🤍', author: '晴子大姐姐', likes: 28, img: 'r-Ej0NQmFlQ' },
  { title: 'mmeng｜简约海莉美甲🤍', author: 'mmdaily', likes: 82, img: 'QORhW0IQHVQ' },
  { title: '25年度美甲合集₊˚⊹⋆ 每款都想做！', author: 'miyaaa', likes: 84, img: 't1uTqt6qhWI' },
  { title: '裸粉色系合集！黄皮也超显白🫶', author: 'Nail Diary', likes: 127, img: 'jRXxNpA6d_k' },
  { title: '极简法式美甲 越简单越高级', author: '小鹿美甲', likes: 66, img: 'gb6gtiTZKB8' },
  { title: '猫眼美甲也太好看了吧！动态感绝了', author: 'Glow Nails', likes: 203, img: 'xUaicCcs9Es' },
  { title: '今日份美甲分享 水蜜桃色🍑', author: '果冻美甲屋', likes: 91, img: 'OIEU0eopPT4' },
  { title: '冬天就是要做深色系美甲呀🍷', author: '暖光美甲', likes: 45, img: 'Y14F-1vzVds' },
  { title: '手绘小花美甲 细节控必看🌸', author: '画画的小鱼', likes: 156, img: '-4T7M75CLU4' },
  { title: '第一次做美甲就成功！教程来了', author: 'DIY美甲', likes: 34, img: 'fcOrPm2L044' },
  { title: '短甲女孩必看！这10款超显手长', author: '短甲联盟', likes: 277, img: 'hvqHtZqNMeI' },
  { title: '闪钻美甲✨ 夜店C位预定', author: 'BLING NAIL', likes: 18, img: 'OpjlRo-31SI' },
  { title: '日系美甲合集 清透感拉满🌿', author: '和风美甲', likes: 112, img: 'i_HQ8CFcyfE' },
  { title: '辣妹必做！黑色系美甲合集🖤', author: '暗黑美甲', likes: 89, img: 'lhZjI55SaMY' },
  { title: '渐变美甲yyds 配色超绝', author: '配色研究所', likes: 145, img: 'gJ3hKjX92K8' },
]

const PET_POSTS = [
  { title: '我家猫又双叒叕在卖萌了🥺', author: '猫猫头', likes: 312, img: 'nxbgDOQJ8qw' },
  { title: '小橘猫成长记录 一个月变化好大', author: '橘座日记', likes: 87, img: 'nKC772R_qog' },
  { title: '谁能拒绝一只呼噜噜的小猫咪', author: '吸猫日常', likes: 256, img: '5UvvHx8yhE0' },
  { title: '三花姐妹花🐱 猫咪届女团', author: '三花猫妈妈', likes: 198, img: 'rplhB9mYF48' },
  { title: '猫咪戴花环 治愈系满分🌸', author: '花与猫', likes: 445, img: 'hxEAE88Onv0' },
  { title: '在路边捡到一只小猫咪 救助记录', author: '流浪猫救助', likes: 534, img: 'GgysmOBlrDw' },
  { title: '白猫仙境 国风写真太绝了', author: '拍猫的阿伟', likes: 167, img: 'fVNyjet1CXY' },
]

const RENT_POSTS = [
  { title: '朝阳大悦城旁 精装一居室 随时看房', author: '北京租房君', likes: 23, img: '9spwungiWxc' },
  { title: '望京SOHO 日式ins风公寓 拎包入住', author: '好房推荐官', likes: 41, img: 'URsdSzdD1iA' },
  { title: '三里屯宝藏单间 采光超好！', author: '租房小助手', likes: 16, img: '3wylDrjxH-E' },
  { title: '中关村创业公寓 月租3200起', author: '码农租房', likes: 37, img: 'TieKJRey-nM' },
  { title: '西单大悦城旁 温馨小窝🛋️', author: '好运租房', likes: 29, img: 'QGxBeUDkeWk' },
]

// 按比例穿插：美甲70% 宠物20% 租房10%
function generatePosts(count) {
  const result = []
  const all = [
    ...NAIL_POSTS.map(p => ({ ...p, type: 'nail' })),
    ...PET_POSTS.map(p => ({ ...p, type: 'pet' })),
    ...RENT_POSTS.map(p => ({ ...p, type: 'rent' })),
  ]
  // 穿插策略：每7条中5美甲1宠物1租房
  const pattern = ['nail', 'nail', 'nail', 'pet', 'nail', 'rent', 'nail', 'nail', 'nail', 'pet', 'nail']
  const byType = { nail: [...NAIL_POSTS], pet: [...PET_POSTS], rent: [...RENT_POSTS] }
  const counters = { nail: 0, pet: 0, rent: 0 }

  for (let i = 0; i < count; i++) {
    const type = pattern[i % pattern.length]
    const pool = byType[type]
    const idx = counters[type] % pool.length
    counters[type]++
    const p = pool[idx]
    const images = [unsplash(p.img, 400, 400)]
    // 部分帖子多图
    const extraCount = Math.random() > 0.6 ? Math.floor(Math.random() * 3) + 1 : 0
    for (let j = 0; j < extraCount; j++) {
      images.push(unsplash(p.img, 400, 400))
    }
    result.push({
      id: Date.now() + i,
      title: p.title,
      author: p.author,
      likes: p.likes + Math.floor(Math.random() * 20),
      images,
      content: p.title,
      tags: type === 'nail' ? ['#美甲分享'] : type === 'pet' ? ['#猫咪日常'] : ['#租房'],
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

export default function Feed({ onPost }) {
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
    <div className="min-h-screen bg-[#FAFAFA] max-w-[375px] mx-auto relative overflow-x-hidden" style={{ fontFamily: "-apple-system, 'PingFang SC', sans-serif" }}>
      {/* 导航栏 */}
      <div className="bg-white flex items-center h-[44px] px-[16px] sticky top-0 z-20">
        <button className="shrink-0 mr-[12px]">
          <img src="/更多.png" alt="menu" className="w-[18px] h-[18px]" />
        </button>
        <div className="flex-1 flex items-center justify-center gap-[28px]">
          {[
            { key: 'follow', label: '关注' },
            { key: 'discover', label: '发现' },
            { key: 'nearby', label: '附近' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className="relative pb-[4px]">
              <span style={{ fontSize: 16, fontWeight: activeTab === tab.key ? 600 : 400 }}
                className={activeTab === tab.key ? 'text-[#222]' : 'text-[#999]'}>
                {tab.label}
              </span>
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[28px] h-[2px] rounded-full bg-[#FF2442]" />
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
                {post.images.length > 1 && (
                  <div className="absolute top-[6px] right-[6px] w-[20px] h-[20px] rounded-full bg-black/20 flex items-center justify-center">
                    <img src="/展开.png" alt="multi" className="w-[12px] h-[12px]" />
                  </div>
                )}
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
                        {post.type === 'nail' ? '💅' : post.type === 'pet' ? '🐱' : '🏠'}
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
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[375px] bg-white border-t border-[#eee] z-10">
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
  )
}
