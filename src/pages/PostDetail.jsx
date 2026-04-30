import { useState } from 'react'

export default function PostDetail({ post, onBack, onTryOn }) {
  const [liked, setLiked] = useState(false)
  const [collected, setCollected] = useState(false)
  const [currentImg, setCurrentImg] = useState(0)

  if (!post) return null

  const images = post.images || []
  const commentCount = Math.floor(post.likes * 0.05) + Math.floor(Math.random() * 50)

  return (
    <div className="min-h-screen bg-white max-w-[375px] mx-auto" style={{ fontFamily: "-apple-system, 'PingFang SC', sans-serif" }}>
      {/* 状态栏 */}
      <div className="h-[44px] bg-white" />

      {/* 顶栏 h≈53 */}
      <div className="flex items-center px-[16px] h-[53px] gap-[12px]">
        <button onClick={onBack} className="shrink-0">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div className="w-[34px] h-[34px] rounded-full bg-[#f5f5f5] flex items-center justify-center text-[14px] shrink-0">{post.avatar}</div>
        <div className="min-w-0 flex-1">
          <p className="text-[#222] text-[15px] font-medium truncate leading-tight">{post.author}</p>
          <p className="text-[#999] text-[11px] leading-tight">3小时前</p>
        </div>
        <button className="shrink-0 w-[53px] h-[27px] rounded-[13px] bg-[#FF2442] text-white text-[13px] font-medium flex items-center justify-center">
          关注
        </button>
        <button className="shrink-0 ml-[4px]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#ccc">
            <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
          </svg>
        </button>
      </div>

      {/* 图片区 */}
      <div className="w-full relative" onTouchStart={(e) => { post._touchStart = e.touches[0].clientX }} onTouchEnd={(e) => {
        if (images.length <= 1) return
        const diff = e.changedTouches[0].clientX - post._touchStart
        if (diff < -40) setCurrentImg(i => Math.min(i + 1, images.length - 1))
        if (diff > 40) setCurrentImg(i => Math.max(i - 1, 0))
      }}>
        {images.length > 0 ? (
          <img src={images[currentImg]} alt="" className="w-full object-contain max-h-[477px]"
            onError={(e) => {
              e.target.style.display = 'none'
              const fb = e.target.nextElementSibling
              if (fb) fb.style.display = 'flex'
            }} />
        ) : null}
        <div className={`w-full aspect-[3/4] items-center justify-center text-[64px] bg-gradient-to-br from-pink-50 to-purple-50 ${images.length > 0 ? 'hidden' : 'flex'}`}>
          {post.avatar}
        </div>
        {/* 图片计数 */}
        {images.length > 1 && (
          <div className="absolute top-[10px] right-[10px] px-[8px] py-[3px] rounded-[11px] bg-[#303034]/50 text-white text-[11px]">
            {currentImg + 1}/{images.length}
          </div>
        )}
        {/* 图片指示点 */}
        {images.length > 1 && (
          <div className="absolute bottom-[12px] left-1/2 -translate-x-1/2 flex gap-[5px]">
            {images.map((_, i) => (
              <div key={i} className={`w-[6px] h-[6px] rounded-full transition-colors ${i === currentImg ? 'bg-[#FF2442]' : 'bg-[#303034]/20'}`} />
            ))}
          </div>
        )}
      </div>

      {/* 正文 */}
      <div className="px-[16px] pt-[14px] pb-[10px]">
        <h2 className="text-[#222] text-[17px] font-semibold leading-[24px] mb-[8px]">{post.title}</h2>
        <p className="text-[#333] text-[15px] leading-[23px] mb-[10px]">{post.content}</p>
        <div className="flex flex-wrap gap-[4px]">
          {post.tags.map((tag) => (
            <span key={tag} className="text-[#576b95] text-[14px]">{tag}</span>
          ))}
        </div>
      </div>

      {/* 分割 */}
      <div className="h-[8px] bg-[#f5f5f5]" />

      {/* 评论区 */}
      <div className="px-[16px] py-[12px]">
        <p className="text-[#999] text-[14px] mb-[14px]">共 {commentCount} 条评论</p>
        <div className="flex gap-[10px] mb-[14px]">
          <div className="w-[26px] h-[26px] rounded-full bg-[#42C9A0] flex items-center justify-center text-[8px] text-white shrink-0">🦋</div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] leading-[20px]"><span className="text-[#576b95] font-medium">蝴蝶结女孩</span> <span className="text-[#333]">好好看！求链接</span></p>
            <p className="text-[#bbb] text-[12px] mt-[2px]">2小时前</p>
          </div>
        </div>
        <div className="flex gap-[10px] mb-[14px]">
          <div className="w-[26px] h-[26px] rounded-full bg-[#FF9A9E] flex items-center justify-center text-[8px] text-white shrink-0">💫</div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] leading-[20px]"><span className="text-[#576b95] font-medium">甜心美甲</span> <span className="text-[#333]">这个颜色太显白了，黄皮也适合吗？</span></p>
            <p className="text-[#bbb] text-[12px] mt-[2px]">1小时前</p>
          </div>
        </div>
        <div className="flex gap-[10px]">
          <div className="w-[26px] h-[26px] rounded-full bg-[#A8E6CF] flex items-center justify-center text-[8px] text-white shrink-0">🍀</div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] leading-[20px]"><span className="text-[#576b95] font-medium">美甲小能手</span> <span className="text-[#333]">同款！我也刚做，真的绝</span></p>
            <p className="text-[#bbb] text-[12px] mt-[2px]">45分钟前</p>
          </div>
        </div>
      </div>

      {/* 互动栏 */}
      <div className="px-[16px] py-[12px] border-t border-[#f5f5f5] flex items-center gap-[24px]">
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
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[375px] bg-white border-t border-[#eee] px-[14px] py-[10px] flex items-center gap-[10px]"
        style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}>
        <div className="flex-1 bg-[#303034]/[0.05] rounded-[17px] px-[14px] h-[34px] flex items-center">
          <span className="text-[#999] text-[14px]">说点什么…</span>
        </div>
        <button onClick={() => onTryOn(post)}
          className="shrink-0 px-[16px] h-[34px] rounded-[17px] bg-[#FF2442] text-white text-[14px] font-medium whitespace-nowrap flex items-center">
          智能试戴
        </button>
      </div>
    </div>
  )
}
