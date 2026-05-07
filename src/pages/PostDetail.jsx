import { useState } from 'react'
import { getAgent } from '../config/agents'
import { Colors, Type, Radius } from '../config/design'

export default function PostDetail({ post, onBack, onTryOn }) {
  const [liked, setLiked] = useState(false)
  const [collected, setCollected] = useState(false)
  const [currentImg, setCurrentImg] = useState(0)

  if (!post) return null

  const images = post.images || []
  const commentCount = Math.floor(post.likes * 0.05) + Math.floor(Math.random() * 50)
  const agent = getAgent(post.type)

  return (
    <div className="min-h-screen flex flex-col items-center"
      style={{ fontFamily: "'PingFang SC', -apple-system, 'SF Pro', sans-serif", background: '#FAFAFA' }}>

      <div className="w-full bg-white relative" style={{ maxWidth: 375, paddingBottom: 53 }}>

        {/* ── 顶部导航栏 ── */}
        <div className="flex items-center px-[14px] h-[61px] gap-[10px] sticky top-0 bg-white z-20">
          <button onClick={onBack} className="shrink-0 w-[32px] h-[32px] flex items-center justify-center">
            <img src="/icons/back.svg" width={22} height={22} alt="back" />
          </button>

          <div className="rounded-full bg-[#f5f5f5] flex items-center justify-center shrink-0 overflow-hidden"
            style={{ width: 34, height: 34 }}>
            <span style={{ fontSize: 15 }}>
              {post.type === 'nail' ? '💅' : post.type === 'pet' ? '🐱' : post.type === 'rental' ? '🏠' : post.type === 'portrait' ? '📷' : '✨'}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[rgba(0,0,0,0.8)] text-[14px] font-medium truncate leading-tight">{post.author}</p>
            <p className="text-[rgba(0,0,0,0.3)] text-[11px] leading-tight">{post.time || '3小时前'}</p>
          </div>

          <button className="shrink-0 text-[#FF2442] text-[13px] font-medium flex items-center justify-center rounded-[13px] border border-[#FF2442]"
            style={{ width: 52, height: 26 }}>
            关注
          </button>

          <button className="shrink-0 w-[32px] h-[32px] flex items-center justify-center">
            <img src="/icons/share.svg" width={22} height={22} alt="share" />
          </button>
        </div>

        {/* ── 图片区 — 3:4 比例 ── */}
        <div className="w-full relative" style={{ height: 477 }}
          onTouchStart={(e) => { post._touchStart = e.touches[0].clientX }}
          onTouchEnd={(e) => {
            if (images.length <= 1) return
            const diff = e.changedTouches[0].clientX - post._touchStart
            if (diff < -40) setCurrentImg(i => Math.min(i + 1, images.length - 1))
            if (diff > 40) setCurrentImg(i => Math.max(i - 1, 0))
          }}>
          {images.length > 0 ? (
            <img src={images[currentImg]} alt="" className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none' }} />
          ) : (
            <div className="w-full h-full bg-[#f0f0f0]" />
          )}

          {/* 图片计数器 */}
          {images.length > 1 && (
            <div className="absolute px-[8px] py-[3px] rounded-[11px] text-white flex items-center"
              style={{
                top: 10, right: 10,
                background: 'rgba(48,48,52,0.5)',
                fontSize: Type.caption.size,
                fontWeight: Type.caption.weight,
                lineHeight: `${Type.caption.lh}px`,
              }}>
              {currentImg + 1}/{images.length}
            </div>
          )}

          {/* 页面圆点指示器 */}
          {images.length > 1 && (
            <div className="absolute bottom-[12px] left-1/2 -translate-x-1/2 flex items-center" style={{ gap: 5 }}>
              {images.map((_, i) => (
                <div key={i} className="rounded-full transition-colors"
                  style={{
                    width: i === currentImg ? 6 : 5,
                    height: i === currentImg ? 6 : 5,
                    background: i === currentImg ? Colors.primary : 'rgba(48,48,52,0.2)',
                  }} />
              ))}
            </div>
          )}

          {/* Agent 入口按钮 — 按帖子类别动态切换 */}
          {agent.label && (
            <button onClick={() => onTryOn(post)}
              className="absolute text-white text-[13px] font-medium flex items-center justify-center rounded-[15px] bg-[#FF2442] z-10 active:scale-95 transition-transform"
              style={{ bottom: 12, right: 12, height: 30, padding: '0 14px' }}>
              {agent.icon} <span className="ml-[4px]">{agent.label}</span>
            </button>
          )}
        </div>

        {/* ── 正文区 ── */}
        <div style={{ padding: '14px 14px 10px' }}>
          {/* 标题 */}
          <h2 style={{
            fontSize: Type.postTitle.size,
            fontWeight: Type.postTitle.weight,
            lineHeight: `${Type.postTitle.lh}px`,
            color: Colors.textPrimary,
            marginBottom: 8,
          }}>
            {post.title}
          </h2>

          {/* 正文 */}
          <p style={{
            fontSize: Type.body.size,
            fontWeight: Type.body.weight,
            lineHeight: `${Type.body.lh}px`,
            color: 'rgba(0,0,0,0.6)',
            marginBottom: 10,
          }}>
            {post.content}
          </p>

          {/* 标签 */}
          <div className="flex flex-wrap" style={{ gap: 4 }}>
            {(post.tags || []).map((tag) => (
              <span key={tag} style={{
                fontSize: Type.cardTitle.size,
                fontWeight: Type.cardTitle.weight,
                color: Colors.tag,
                lineHeight: `${Type.cardTitle.lh}px`,
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* ── 分割线 ── */}
        <div className="w-full h-[2px] bg-[#F5F5F5]" />

        {/* ── 评论区 ── */}
        <div style={{ padding: '12px 14px' }}>
          <p className="text-[rgba(0,0,0,0.3)] text-[14px] mb-[14px]">
            共 {commentCount} 条评论
          </p>

          {[
            { avatar: '🦋', color: '#42C9A0', name: '蝴蝶结女孩', text: '好好看！求链接', time: '2小时前', likes: 23 },
            { avatar: '💫', color: '#FF9A9E', name: '甜心美甲', text: '这个颜色太显白了，黄皮也适合吗？', time: '1小时前', likes: 15 },
            { avatar: '🍀', color: '#A8E6CF', name: '美甲小能手', text: '同款！我也刚做，真的绝', time: '45分钟前', likes: 8 },
          ].map((c, i) => (
            <div key={i} className="flex gap-[10px] mb-[14px]">
              <div className="rounded-full flex items-center justify-center shrink-0"
                style={{
                  width: 26, height: 26,
                  background: c.color,
                }}>
                <span className="text-white text-[9px]">{c.avatar}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] leading-[20px]">
                  <span className="text-[#576B95] font-medium">{c.name}</span>
                  <span className="text-[rgba(0,0,0,0.8)]"> {c.text}</span>
                </p>
                <div className="flex items-center gap-[12px] mt-[4px]">
                  <span className="text-[rgba(0,0,0,0.3)] text-[12px]">{c.time}</span>
                  <button className="flex items-center gap-[2px] text-[rgba(0,0,0,0.3)] text-[12px]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    {c.likes}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── 底部固定栏 ── */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full bg-white border-t border-[rgba(0,0,0,0.08)] flex items-center z-10"
          style={{
            maxWidth: 375,
            height: 53,
            padding: '0 14px',
            paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
          }}>
          {/* 输入框 */}
          <div className="flex-1 bg-[rgba(48,48,52,0.05)] flex items-center px-[14px]"
            style={{ height: 34, borderRadius: Radius.pill }}>
            <img src="/icons/edit.svg" width={16} height={16} alt="edit" />
            <span className="text-[rgba(0,0,0,0.45)] text-[14px] ml-[6px]">说点什么…</span>
          </div>

          {/* 互动图标 */}
          <div className="flex items-center ml-[16px]" style={{ gap: 20 }}>
            {/* 点赞 */}
            <button onClick={() => setLiked(!liked)} className="flex flex-col items-center gap-[2px]">
              <img src="/icons/like.svg" width={28} height={28} alt="like"
                style={{ filter: liked ? 'invert(25%) sepia(96%) saturate(7468%) hue-rotate(341deg) brightness(97%) contrast(110%)' : 'none' }} />
              <span className="text-[rgba(0,0,0,0.8)] text-[13px]" style={{ minWidth: 20, textAlign: 'center' }}>
                {post.likes + (liked ? 1 : 0)}
              </span>
            </button>

            {/* 评论 */}
            <div className="flex flex-col items-center gap-[2px]">
              <img src="/icons/chat.svg" width={28} height={28} alt="chat" />
              <span className="text-[rgba(0,0,0,0.45)] text-[13px]">{commentCount}</span>
            </div>

            {/* 收藏 */}
            <button onClick={() => setCollected(!collected)} className="flex flex-col items-center gap-[2px]">
              <img src="/icons/collect.svg" width={28} height={28} alt="collect"
                style={{ filter: collected ? 'invert(70%) sepia(89%) saturate(456%) hue-rotate(358deg) brightness(103%) contrast(103%)' : 'none' }} />              <span className="text-[rgba(0,0,0,0.45)] text-[13px]">128</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
