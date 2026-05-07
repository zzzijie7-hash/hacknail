import { useState } from 'react'
import { getAgent } from '../config/agents'

export default function PostDetail({ post, onBack, onTryOn }) {
  const [liked, setLiked] = useState(false)
  const [collected, setCollected] = useState(false)
  const [currentImg, setCurrentImg] = useState(0)

  if (!post) return null

  const images = post.images || []
  const agent = getAgent(post.type)

  return (
    <div style={{
      fontFamily: "'PingFang SC', -apple-system, sans-serif",
      maxWidth: 375, margin: '0 auto', background: '#fff', height: '100vh',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* ── SystemBar ── */}
      <div className="shrink-0">
        <img src="/icons/systembar.svg" alt="" style={{ width: '100%', height: 44 }} />
      </div>

      {/* ── 顶栏: back + avatar + 信息 + 关注 + 分享 ── */}
      <div className="flex items-center px-[14px] h-[61px] gap-[10px] shrink-0">
        <button onClick={onBack} className="w-[32px] h-[32px] flex items-center justify-center shrink-0">
          <img src="/icons/back.svg" width={22} height={22} alt="back" />
        </button>
        <div className="rounded-full bg-[#f5f5f5] flex items-center justify-center shrink-0"
          style={{ width: 34, height: 34 }}>
          <span style={{ fontSize: 15 }}>
            {post.type === 'nail' ? '💅' : post.type === 'pet' ? '🐱' : post.type === 'rental' ? '🏠' : '📷'}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate" style={{ fontSize: 15.3, fontWeight: 500, color: 'rgba(0,0,0,0.8)', lineHeight: '22px' }}>
            {post.author}
          </p>
          <p style={{ fontSize: 11.5, color: 'rgba(0,0,0,0.3)', lineHeight: '17px' }}>2天前</p>
        </div>
        <button className="shrink-0 text-[#FF2442] text-[13px] font-medium rounded-[13px] border border-[#FF2442] flex items-center justify-center"
          style={{ width: 52, height: 26 }}>关注</button>
        <button className="shrink-0 w-[32px] h-[32px] flex items-center justify-center">
          <img src="/icons/share.svg" width={24} height={24} alt="share" />
        </button>
      </div>

      {/* ── 图片区 3:4 ── */}
      <div className="relative shrink-0"
        style={{ width: 375, height: 477 }}
        onTouchStart={(e) => { post._touchStart = e.touches[0].clientX }}
        onTouchEnd={(e) => {
          if (images.length <= 1) return
          const d = e.changedTouches[0].clientX - post._touchStart
          if (d < -40) setCurrentImg(i => Math.min(i + 1, images.length - 1))
          if (d > 40) setCurrentImg(i => Math.max(i - 1, 0))
        }}>
        {images.length > 0 ? (
          <img src={images[currentImg]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { e.target.style.display = 'none' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#f0f0f0' }} />
        )}

        {/* 计数器 */}
        {images.length > 1 && (
          <div className="absolute px-[8px] py-[3px] rounded-[11px] text-white"
            style={{
              top: 10, right: 10, fontSize: 11.5, lineHeight: '17px',
              background: 'rgba(48,48,52,0.5)',
            }}>
            {currentImg + 1}/{images.length}
          </div>
        )}

        {/* Agent 按钮 (Figma: 87x36, cornerRadius=30, pad 14/8, bottom/right=10) */}
        {agent.label && (
          <button onClick={() => onTryOn(post)}
            className="absolute text-white flex items-center justify-center active:scale-95 transition-transform"
            style={{
              bottom: 10, right: 10, height: 36, padding: '8px 14px',
              background: 'rgba(48,48,52,0.85)', borderRadius: 30, gap: 6,
              fontSize: 13, fontWeight: 500, lineHeight: '20px',
            }}>
            试同款
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 7H13M13 7L7 1M13 7L7 13" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* 圆点指示器 (height=24, padding=10) */}
      {images.length > 1 && (
        <div className="flex justify-center items-center shrink-0" style={{ height: 24, padding: 10, gap: 5 }}>
          {images.map((_, i) => (
            <div key={i} className="rounded-full"
              style={{
                width: i === currentImg ? 6 : 5, height: i === currentImg ? 6 : 5,
                background: i === currentImg ? '#FF2442' : 'rgba(48,48,52,0.2)',
              }} />
          ))}
        </div>
      )}

      {/* ── 正文区 ── */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '14px 14px 0' }}>
        {/* 标题 */}
        <h2 className="font-semibold" style={{
          fontSize: 17.2, lineHeight: '24.8px', color: 'rgba(0,0,0,0.8)',
          marginBottom: 8,
        }}>
          {post.title}
        </h2>

        {/* 正文 */}
        <p style={{
          fontSize: 15.3, lineHeight: '24.8px', color: 'rgba(0,0,0,0.6)',
          marginBottom: 10,
        }}>
          {post.content}
        </p>

        {/* 标签 */}
        <div className="flex flex-wrap" style={{ gap: 4, marginBottom: 12 }}>
          {(post.tags || []).map((tag) => (
            <span key={tag} style={{ fontSize: 15.3, color: '#133667', lineHeight: '24.8px' }}>{tag}</span>
          ))}
        </div>

        {/* 编辑时间 + 位置 */}
        <div className="flex items-center gap-[6px] flex-wrap" style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 11.5, color: 'rgba(0,0,0,0.3)', lineHeight: '17px' }}>编辑于 2天前 23:59</span>
          <span style={{ fontSize: 11.5, color: 'rgba(0,0,0,0.3)', lineHeight: '17px' }}>上海市</span>
          <span style={{ fontSize: 11.5, color: 'rgba(0,0,0,0.3)', lineHeight: '17px' }}>·</span>
          <span style={{ fontSize: 11.5, color: '#576B95', lineHeight: '17px' }}>黄浦区新天地广场</span>
        </div>

        {/* 创作者声明 */}
        <div style={{
          background: 'rgba(48,48,52,0.05)', borderRadius: 8,
          padding: '8px 10px', marginBottom: 12,
        }}>
          <p style={{ fontSize: 11.5, lineHeight: '17px', color: 'rgba(0,0,0,0.45)' }}>
            创作者声明：内容仅供参考，请谨慎甄别信息
          </p>
        </div>

        {/* 评论概览 */}
        <p style={{
          fontSize: 13.4, fontWeight: 500, color: 'rgba(0,0,0,0.8)', lineHeight: '19px',
          paddingTop: 10, borderTop: '1px solid #F5F5F5',
        }}>
          共 {Math.floor(post.likes * 0.05) + Math.floor(Math.random() * 30)} 条评论
        </p>
      </div>

      {/* ── 底部固定栏 (Figma: engage bar 375x53, pad 14.3/9.5, gap 11.5) ── */}
      <div className="flex items-center shrink-0"
        style={{
          height: 53, padding: '9.5px 14.3px',
          paddingBottom: 'max(9.5px, env(safe-area-inset-bottom))',
          borderTop: '1px solid rgba(0,0,0,0.05)',
          gap: 11.5,
        }}>
        {/* 输入框 (156x34, bg rgba(48,48,52,0.05), pad 7.6, gap 3.8) */}
        <div className="flex items-center" style={{
          width: 156, height: 34, gap: 3.8, padding: '7.6px 11.5px',
          background: 'rgba(48,48,52,0.05)', borderRadius: 17,
        }}>
          <img src="/icons/edit.svg" width={20} height={20} alt="edit" />
          <span style={{ fontSize: 13.4, color: 'rgba(0,0,0,0.45)', lineHeight: '17px' }}>说点什么...</span>
        </div>

        {/* 互动图标 (HORIZONTAL 左右排列, gap 9.5, 内 gap 3.8) */}
        <div className="flex items-center" style={{ gap: 9.5 }}>
          <button onClick={() => setLiked(!liked)} className="flex items-center" style={{ gap: 3.8 }}>
            <img src="/icons/like.svg" width={28} height={28} alt="like"
              style={{ filter: liked ? 'invert(25%) sepia(96%) saturate(7468%) hue-rotate(341deg) brightness(97%) contrast(110%)' : 'none' }} />
            <span style={{ fontSize: 13.4, fontWeight: 500, color: 'rgba(0,0,0,0.8)', lineHeight: '18px' }}>
              {post.likes + (liked ? 1 : 0)}
            </span>
          </button>

          <div className="flex items-center" style={{ gap: 3.8 }}>
            <img src="/icons/collect.svg" width={28} height={28} alt="collect" />
            <span style={{ fontSize: 13.4, fontWeight: 500, color: 'rgba(0,0,0,0.8)', lineHeight: '18px' }}>46</span>
          </div>

          <div className="flex items-center" style={{ gap: 3.8 }}>
            <img src="/icons/chat.svg" width={28} height={28} alt="chat" />
            <span style={{ fontSize: 13.4, fontWeight: 500, color: 'rgba(0,0,0,0.8)', lineHeight: '18px' }}>19</span>
          </div>
        </div>
      </div>
    </div>
  )
}
