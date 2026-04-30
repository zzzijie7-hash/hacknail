import { useState } from 'react'

const POSTS = [
  {
    id: 1, title: 'nail share 💅 海莉比伯同款蹭粉美甲', author: 'seazacc nail', avatar: '💅', likes: 43,
    images: [
      'https://sns-webpic-qc.xhscdn.com/202604292152/5731b8a56395910f47c0149c4e42f76a/1040g2sg31qr05b0i74l05nu8l3j0boa9h1pvpi0!h5_1080jpg',
    ],
  },
  {
    id: 2, title: '蹭粉就是这样蹭的！闪到没朋友✨', author: '指尖DESIGN NAIL Art', avatar: '✨', likes: 59,
    images: [
      'https://sns-webpic-qc.xhscdn.com/202604292152/c4401ccaa77efac262793fc86354c380/notes_pre_post/1040g3k031u7aa0o0iofg49uikll8rtiv73jmhe8!h5_1080jpg',
      'https://sns-webpic-qc.xhscdn.com/202604292152/3214bcc53a33da9342bb2d617221a89c/notes_pre_post/1040g3k031u7aa0o0iog049uikll8rtivvl2e5j0!h5_1080jpg',
    ],
  },
  {
    id: 3, title: '温柔又高级！皮粉色法式➕蹭粉海莉💅🏻', author: 'Ranx Nail 燃序', avatar: '🌸', likes: 9,
    images: [
      'https://sns-webpic-qc.xhscdn.com/202604292152/9773b011d5181d1492ef6f696ccfa707/notes_pre_post/1040g3k031s45nok8m8105p0ghmn3qa1q7jtlglg!h5_1080jpg',
    ],
  },
  {
    id: 4, title: '春天还是跟白月光美甲最配🤍', author: '晴子大姐姐', avatar: '🤍', likes: 28,
    images: [
      'https://sns-webpic-qc.xhscdn.com/202604292152/4ce9ba5f22d07c157bd1bd81bd9d315b/notes_pre_post/1040g3k031u8b6j9a1s305of1b9g40s1dofrjcg0!h5_1080jpg',
    ],
  },
  {
    id: 5, title: 'mmeng｜简约海莉美甲🤍', author: 'mmdaily', avatar: '🌙', likes: 82,
    images: [
      'https://sns-webpic-qc.xhscdn.com/202604292152/7254cd203a7b314eadc6fd22157d1103/notes_pre_post/1040g3k031trcpj2anei05p3mnrhkmuoo7nvh0go!h5_1080jpg',
    ],
  },
  {
    id: 6, title: '25年度美甲合集₊˚⊹⋆ 每款都想做！', author: 'miyaaa', avatar: '🎀', likes: 84,
    images: [
      'https://sns-webpic-qc.xhscdn.com/202604292152/f31210b7065ba1cce1899da18c3f9a50/notes_uhdr/1040g3qo31qko7tvcno705q16v7ainq829s9m3lg!h5_1080jpg',
    ],
  },
]

function formatLikes(n) {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return n
}

const SpacingLabel = ({ label, value }) => (
  <div className="absolute left-1/2 -translate-x-1/2 bg-red-500 text-white text-[9px] px-[3px] py-[1px] rounded-[2px] whitespace-nowrap z-10 pointer-events-none"
    style={{ marginTop: -8 }}>
    {label}: {value}px
  </div>
)

export default function Feed({ onPost }) {
  const [activeTab, setActiveTab] = useState('discover')
  const [showPanel, setShowPanel] = useState(true)

  // 可调间距参数
  const [s, setS] = useState({
    cardPaddingX: 8,      // 卡片内容左右padding
    imgToTitle: 8,         // 首图到标题的间距
    titleFontSize: 14,     // 标题字号
    titleLineHeight: 20,   // 标题行高
    titleToAuthor: 6,      // 标题到作者的间距
    cardPaddingBottom: 8,  // 卡片底部padding
    authorAvatarSize: 18,  // 头像尺寸
    authorGap: 4,          // 头像和昵称间距
    authorToLike: 10,      // 昵称和点赞的间距
    likeIconToCount: 2,    // 点赞图标和点赞量的间距
    likeIconSize: 16,      // 点赞图标尺寸
    columnGap: 5,          // 两列间距
    columnPaddingX: 5,     // 整体左右padding
    cardMarginBottom: 5,   // 卡片间上下间距
  })

  const update = (key, val) => setS(prev => ({ ...prev, [key]: Number(val) }))

  return (
    <div className="flex" style={{ fontFamily: "-apple-system, 'PingFang SC', sans-serif" }}>
      {/* 左侧调节面板 */}
      {showPanel && (
        <div className="w-[260px] h-screen overflow-y-auto bg-gray-900 text-white p-3 shrink-0 text-xs sticky top-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold">间距调节</span>
            <button onClick={() => setShowPanel(false)} className="text-gray-400 text-lg">✕</button>
          </div>
          {[
            ['cardPaddingX', '卡片左右padding'],
            ['imgToTitle', '首图→标题'],
            ['titleFontSize', '标题字号'],
            ['titleLineHeight', '标题行高'],
            ['titleToAuthor', '标题→作者'],
            ['cardPaddingBottom', '卡片底部padding'],
            ['authorAvatarSize', '头像尺寸'],
            ['authorGap', '头像↔昵称'],
            ['authorToLike', '昵称↔点赞'],
            ['likeIconToCount', '赞图标↔赞数'],
            ['likeIconSize', '赞图标尺寸'],
            ['columnGap', '两列间距'],
            ['columnPaddingX', '整体左右padding'],
            ['cardMarginBottom', '卡片上下间距'],
          ].map(([key, label]) => (
            <div key={key} className="mb-2">
              <div className="flex justify-between mb-0.5">
                <span className="text-gray-300">{label}</span>
                <span className="text-yellow-400 font-mono">{s[key]}px</span>
              </div>
              <input type="range" min={0} max={24} step={1} value={s[key]}
                onChange={e => update(key, e.target.value)}
                className="w-full h-1 accent-yellow-400" />
            </div>
          ))}
          <div className="mt-4 p-2 bg-gray-800 rounded text-[10px] font-mono text-green-400 break-all">
            {JSON.stringify(s)}
          </div>
        </div>
      )}
      {!showPanel && (
        <button onClick={() => setShowPanel(true)}
          className="fixed top-2 left-2 z-50 bg-red-500 text-white text-xs px-2 py-1 rounded">
          调间距
        </button>
      )}

      {/* 右侧预览区 */}
      <div className="flex-1 flex justify-center bg-gray-200">
        <div className="min-h-screen bg-[#FAFAFA] w-[375px] relative overflow-x-hidden">
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
          <div style={{ padding: `5px ${s.columnPaddingX}px 90px ${s.columnPaddingX}px` }}>
            <div className="columns-2" style={{ gap: `${s.columnGap}px` }}>
              {POSTS.map((post) => (
                <div key={post.id} onClick={() => onPost(post)}
                  className="bg-white rounded-[4px] overflow-hidden cursor-pointer break-inside-avoid"
                  style={{ marginBottom: `${s.cardMarginBottom}px` }}>
                  {/* 封面图 */}
                  <div className="w-full aspect-square bg-[#f0f0f0] relative overflow-hidden">
                    {post.images.length > 0 ? (
                      <img src={post.images[0]} alt="" className="w-full h-full object-cover" loading="lazy"
                        onError={(e) => { e.target.style.display = 'none' }} />
                    ) : null}
                    {post.images.length > 1 && (
                      <div className="absolute top-[6px] right-[6px] w-[20px] h-[20px] rounded-full bg-black/20 flex items-center justify-center">
                        <img src="/展开.png" alt="multi" className="w-[12px] h-[12px]" />
                      </div>
                    )}
                    {/* 标注：首图→标题 */}
                    <SpacingLabel label="img→title" value={s.imgToTitle} />
                  </div>
                  {/* 标题 + 作者 */}
                  <div style={{ padding: `${s.imgToTitle}px ${s.cardPaddingX}px ${s.cardPaddingBottom}px` }}>
                    <p className="font-medium"
                      style={{ fontSize: `${s.titleFontSize}px`, lineHeight: `${s.titleLineHeight}px`, marginBottom: `${s.titleToAuthor}px`, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: 'rgba(0,0,0,0.8)', fontFamily: "'PingFang SC', sans-serif" }}>
                      {post.title}
                    </p>
                    {/* 标注：标题→作者 */}
                    <SpacingLabel label="title→author" value={s.titleToAuthor} />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center min-w-0 flex-1" style={{ gap: `${s.authorGap}px` }}>
                        <div className="rounded-full bg-[#f5f5f5] flex items-center justify-center shrink-0 overflow-hidden"
                          style={{ width: `${s.authorAvatarSize}px`, height: `${s.authorAvatarSize}px` }}>
                          <span style={{ fontSize: Math.max(8, s.authorAvatarSize * 0.5) }}>{post.avatar}</span>
                        </div>
                        <span className="text-[#999] text-[11px] truncate">{post.author}</span>
                      </div>
                      <div className="flex items-center shrink-0" style={{ marginLeft: `${s.authorToLike}px`, gap: `${s.likeIconToCount}px` }}>
                        <svg style={{ width: `${s.likeIconSize}px`, height: `${s.likeIconSize}px` }} viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                        <span className="text-[#999] text-[13px]">{formatLikes(post.likes)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 底部导航 */}
          <div className="fixed bottom-0 w-[375px] bg-white border-t border-[#eee] z-10">
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
    </div>
  )
}
