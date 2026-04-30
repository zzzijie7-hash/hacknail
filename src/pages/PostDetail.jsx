import { useState } from 'react'

const SpacingLabel = ({ label, value }) => (
  <div className="absolute left-1/2 -translate-x-1/2 bg-red-500 text-white text-[9px] px-[3px] py-[1px] rounded-[2px] whitespace-nowrap z-10 pointer-events-none"
    style={{ marginTop: -8 }}>
    {label}: {value}px
  </div>
)

export default function PostDetail({ post, onBack, onTryOn }) {
  const [liked, setLiked] = useState(false)
  const [collected, setCollected] = useState(false)
  const [currentImg, setCurrentImg] = useState(0)
  const [showPanel, setShowPanel] = useState(true)

  // 可调间距
  const [s, setS] = useState({
    navHeight: 44,           // 顶栏高度
    avatarSize: 34,          // 头像尺寸
    avatarToInfo: 10,        // 头像到信息间距
    followBtnW: 53,          // 关注按钮宽
    followBtnH: 27,          // 关注按钮高
    imgMaxH: 477,            // 图片区最大高度
    imgCounterTop: 10,       // 图片计数距顶部
    imgCounterRight: 10,     // 图片计数距右边
    dotBottom: 12,           // 指示点距底部
    contentPaddingX: 16,     // 正文左右padding
    titleToContent: 8,       // 标题到正文间距
    contentToTags: 10,       // 正文到标签间距
    dividerH: 8,             // 分割线高度
    commentPaddingX: 16,     // 评论区左右padding
    commentPaddingY: 12,     // 评论区上下padding
    commentGap: 14,          // 评论间距
    commentAvatarSize: 26,   // 评论头像尺寸
    actionBarGap: 24,        // 互动栏间距
    bottomBarHeight: 53,     // 底部悬浮栏高度
    inputHeight: 34,         // 输入框高度
    inputToTryOn: 10,        // 输入框到试戴按钮间距
    tryOnBtnH: 34,           // 试戴按钮高度
  })

  const update = (key, val) => setS(prev => ({ ...prev, [key]: Number(val) }))

  if (!post) return null
  const images = post.images || []
  const commentCount = Math.floor(post.likes * 0.05) + Math.floor(Math.random() * 50)

  return (
    <div className="flex" style={{ fontFamily: "-apple-system, 'PingFang SC', sans-serif" }}>
      {/* 左侧调节面板 */}
      {showPanel && (
        <div className="w-[260px] h-screen overflow-y-auto bg-gray-900 text-white p-3 shrink-0 text-xs sticky top-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold">PostDetail 间距调节</span>
            <button onClick={() => setShowPanel(false)} className="text-gray-400 text-lg">✕</button>
          </div>
          {[
            ['navHeight', '顶栏高度'],
            ['avatarSize', '头像尺寸'],
            ['avatarToInfo', '头像↔信息'],
            ['followBtnW', '关注按钮宽'],
            ['followBtnH', '关注按钮高'],
            ['imgMaxH', '图片区最大高度'],
            ['imgCounterTop', '图计数→顶部'],
            ['imgCounterRight', '图计数→右边'],
            ['dotBottom', '指示点→底部'],
            ['contentPaddingX', '正文左右pad'],
            ['titleToContent', '标题→正文'],
            ['contentToTags', '正文→标签'],
            ['dividerH', '分割线高度'],
            ['commentPaddingX', '评论左右pad'],
            ['commentPaddingY', '评论上下pad'],
            ['commentGap', '评论间距'],
            ['commentAvatarSize', '评论头像尺寸'],
            ['actionBarGap', '互动栏间距'],
            ['bottomBarHeight', '底栏高度'],
            ['inputHeight', '输入框高度'],
            ['inputToTryOn', '输入框↔试戴'],
            ['tryOnBtnH', '试戴按钮高'],
          ].map(([key, label]) => (
            <div key={key} className="mb-2">
              <div className="flex justify-between mb-0.5">
                <span className="text-gray-300">{label}</span>
                <span className="text-yellow-400 font-mono">{s[key]}px</span>
              </div>
              <input type="range" min={0} max={60} step={1} value={s[key]}
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
        <div className="min-h-screen bg-white w-[375px] relative overflow-y-auto" style={{ paddingBottom: `${s.bottomBarHeight + 20}px` }}>
          {/* 顶栏 */}
          <div className="flex items-center px-[16px] sticky top-0 bg-white z-20" style={{ height: `${s.navHeight}px`, gap: `${s.avatarToInfo}px` }}>
            <button onClick={onBack} className="shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <div className="rounded-full bg-[#f5f5f5] flex items-center justify-center shrink-0"
              style={{ width: `${s.avatarSize}px`, height: `${s.avatarSize}px` }}>
              <span style={{ fontSize: s.avatarSize * 0.4 }}>{post.avatar || '💅'}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[#222] text-[15px] font-medium truncate leading-tight">{post.author}</p>
              <p className="text-[#999] text-[11px] leading-tight">3小时前</p>
            </div>
            <button className="shrink-0 text-white text-[13px] font-medium flex items-center justify-center"
              style={{ width: `${s.followBtnW}px`, height: `${s.followBtnH}px`, borderRadius: s.followBtnH / 2, background: '#FF2442' }}>
              关注
            </button>
            <button className="shrink-0 ml-[4px]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#ccc">
                <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
              </svg>
            </button>
          </div>

          {/* 图片区 */}
          <div className="w-full relative" onTouchStart={(e) => { post._touchStart = e.touches[0].clientX }}
            onTouchEnd={(e) => {
              if (images.length <= 1) return
              const diff = e.changedTouches[0].clientX - post._touchStart
              if (diff < -40) setCurrentImg(i => Math.min(i + 1, images.length - 1))
              if (diff > 40) setCurrentImg(i => Math.max(i - 1, 0))
            }}>
            {images.length > 0 ? (
              <img src={images[currentImg]} alt="" className="w-full object-contain"
                style={{ maxHeight: `${s.imgMaxH}px` }}
                onError={(e) => { e.target.style.display = 'none' }} />
            ) : null}
            {/* 图片计数 */}
            {images.length > 1 && (
              <div className="absolute px-[8px] py-[3px] rounded-[11px] bg-[#303034]/50 text-white text-[11px]"
                style={{ top: `${s.imgCounterTop}px`, right: `${s.imgCounterRight}px` }}>
                {currentImg + 1}/{images.length}
              </div>
            )}
            {/* 指示点 */}
            {images.length > 1 && (
              <div className="absolute left-1/2 -translate-x-1/2 flex gap-[5px]"
                style={{ bottom: `${s.dotBottom}px` }}>
                {images.map((_, i) => (
                  <div key={i} className={`w-[6px] h-[6px] rounded-full transition-colors ${i === currentImg ? 'bg-[#FF2442]' : 'bg-[#303034]/20'}`} />
                ))}
              </div>
            )}
          </div>

          {/* 正文 */}
          <div style={{ padding: `14px ${s.contentPaddingX}px ${s.contentToTags}px` }}>
            <h2 className="text-[#222] text-[17px] font-semibold leading-[24px]"
              style={{ marginBottom: `${s.titleToContent}px` }}>{post.title}</h2>
            <p className="text-[#333] text-[15px] leading-[23px]"
              style={{ marginBottom: `${s.contentToTags}px` }}>{post.content}</p>
            <div className="flex flex-wrap gap-[4px]">
              {(post.tags || []).map((tag) => (
                <span key={tag} className="text-[#576b95] text-[14px]">{tag}</span>
              ))}
            </div>
          </div>

          {/* 分割线 */}
          <div style={{ height: `${s.dividerH}px` }} className="bg-[#f5f5f5]" />

          {/* 评论区 */}
          <div style={{ padding: `${s.commentPaddingY}px ${s.commentPaddingX}px` }}>
            <p className="text-[#999] text-[14px] mb-[14px]">共 {commentCount} 条评论</p>
            {[
              { avatar: '🦋', name: '蝴蝶结女孩', text: '好好看！求链接', time: '2小时前', color: '#42C9A0' },
              { avatar: '💫', name: '甜心美甲', text: '这个颜色太显白了，黄皮也适合吗？', time: '1小时前', color: '#FF9A9E' },
              { avatar: '🍀', name: '美甲小能手', text: '同款！我也刚做，真的绝', time: '45分钟前', color: '#A8E6CF' },
            ].map((c, i) => (
              <div key={i} className="flex gap-[10px]" style={{ marginBottom: i < 2 ? `${s.commentGap}px` : 0 }}>
                <div className="rounded-full flex items-center justify-center shrink-0"
                  style={{ width: `${s.commentAvatarSize}px`, height: `${s.commentAvatarSize}px`, background: c.color }}>
                  <span className="text-white" style={{ fontSize: s.commentAvatarSize * 0.3 }}>{c.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] leading-[20px]"><span className="text-[#576b95] font-medium">{c.name}</span> <span className="text-[#333]">{c.text}</span></p>
                  <p className="text-[#bbb] text-[12px] mt-[2px]">{c.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 互动栏 */}
          <div className="border-t border-[#f5f5f5] flex items-center px-[16px] py-[12px]"
            style={{ gap: `${s.actionBarGap}px` }}>
            <button onClick={() => setLiked(!liked)} className="flex items-center gap-[4px]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill={liked ? '#FF2442' : 'none'} stroke={liked ? '#FF2442' : '#999'} strokeWidth="1.8">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <span className={`text-[13px] ${liked ? 'text-[#FF2442]' : 'text-[#999]'}`}>{post.likes + (liked ? 1 : 0)}</span>
            </button>
            <div className="flex items-center gap-[4px]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span className="text-[#999] text-[13px]">{commentCount}</span>
            </div>
            <button onClick={() => setCollected(!collected)} className="flex items-center gap-[4px]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill={collected ? '#ffc107' : 'none'} stroke={collected ? '#ffc107' : '#999'} strokeWidth="1.8">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
              <span className={`text-[13px] ${collected ? 'text-[#ffc107]' : 'text-[#999]'}`}>{collected ? '已收藏' : '收藏'}</span>
            </button>
            <div className="flex items-center gap-[4px] ml-auto">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
              <span className="text-[#999] text-[13px]">分享</span>
            </div>
          </div>

          {/* 底部悬浮栏 */}
          <div className="fixed bottom-0 w-[375px] bg-white border-t border-[#eee] px-[14px] flex items-center z-10"
            style={{ height: `${s.bottomBarHeight}px`, gap: `${s.inputToTryOn}px`, paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}>
            <div className="flex-1 bg-[#303034]/[0.05] flex items-center px-[14px]"
              style={{ height: `${s.inputHeight}px`, borderRadius: s.inputHeight / 2 }}>
              <span className="text-[#999] text-[14px]">说点什么…</span>
            </div>
            <button onClick={() => onTryOn(post)}
              className="shrink-0 text-white text-[14px] font-medium flex items-center justify-center"
              style={{ height: `${s.tryOnBtnH}px`, borderRadius: s.tryOnBtnH / 2, background: '#FF2442', padding: '0 16px' }}>
              智能试戴
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
