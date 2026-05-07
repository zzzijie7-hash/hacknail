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

        {/* 圆点 */}
        {images.length > 1 && (
          <div className="absolute bottom-[12px] left-1/2 -translate-x-1/2 flex gap-[5px]">
            {images.map((_, i) => (
              <div key={i} className="rounded-full"
                style={{
                  width: i === currentImg ? 6 : 5, height: i === currentImg ? 6 : 5,
                  background: i === currentImg ? '#FF2442' : 'rgba(48,48,52,0.2)',
                }} />
            ))}
          </div>
        )}

        {/* Agent 按钮 */}
        {agent.label && (
          <button onClick={() => onTryOn(post)}
            className="absolute text-white text-[13px] font-medium rounded-[15px] bg-[#FF2442] flex items-center justify-center active:scale-95 transition-transform"
            style={{ bottom: 12, right: 12, height: 30, padding: '0 14px' }}>
            {agent.icon} <span className="ml-[4px]">{agent.label}</span>
          </button>
        )}
      </div>

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

        {/* 相关入口卡片 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {[
            { icon: '💬', label: '咨询', sub: '和@Purple聊聊' },
            { icon: '👥', label: '群聊', sub: '上海微醺搭子' },
            { icon: '📺', label: '直播', sub: '明天21:30开播' },
          ].map(c => (
            <div key={c.label} style={{
              flex: '1 1 calc(33% - 6px)', minWidth: 100,
              background: 'rgba(48,48,52,0.05)', borderRadius: 8,
              padding: '8px 10px',
            }}>
              <p style={{ fontSize: 13.4, fontWeight: 500, color: 'rgba(0,0,0,0.8)', lineHeight: '19px' }}>
                {c.icon} {c.label}
              </p>
              <p style={{ fontSize: 13.4, color: 'rgba(0,0,0,0.45)', lineHeight: '19px' }}>{c.sub}</p>
            </div>
          ))}
        </div>

        {/* 评论概览 — 简化为仅显示数量 */}
        <p style={{
          fontSize: 13.4, fontWeight: 500, color: 'rgba(0,0,0,0.8)', lineHeight: '19px',
          paddingTop: 10, borderTop: '1px solid #F5F5F5',
        }}>
          共 {Math.floor(post.likes * 0.05) + Math.floor(Math.random() * 30)} 条评论
        </p>
      </div>

      {/* ── 底部固定栏 ── */}
      <div className="flex items-center shrink-0 border-t border-[rgba(0,0,0,0.08)]"
        style={{ height: 53, padding: '0 14px', paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
        {/* 输入框 */}
        <div className="flex-1 flex items-center px-[14px]"
          style={{ height: 34, borderRadius: 17, background: 'rgba(48,48,52,0.05)' }}>
          <img src="/icons/edit.svg" width={16} height={16} alt="edit" />
          <span style={{ fontSize: 13.4, color: 'rgba(0,0,0,0.45)', marginLeft: 6 }}>说点什么...</span>
        </div>

        {/* 互动图标 */}
        <div className="flex items-center" style={{ gap: 20, marginLeft: 16 }}>
          <button onClick={() => setLiked(!liked)} className="flex flex-col items-center gap-[2px]">
            <img src="/icons/like.svg" width={28} height={28} alt="like"
              style={{ filter: liked ? 'invert(25%) sepia(96%) saturate(7468%) hue-rotate(341deg) brightness(97%) contrast(110%)' : 'none' }} />
            <span style={{ fontSize: 13.4, color: 'rgba(0,0,0,0.8)' }}>{post.likes + (liked ? 1 : 0)}</span>
          </button>
          <div className="flex flex-col items-center gap-[2px]">
            <img src="/icons/chat.svg" width={28} height={28} alt="chat" />
            <span style={{ fontSize: 13.4, color: 'rgba(0,0,0,0.45)' }}>46</span>
          </div>
          <button onClick={() => setCollected(!collected)} className="flex flex-col items-center gap-[2px]">
            <img src="/icons/collect.svg" width={28} height={28} alt="collect"
              style={{ filter: collected ? 'invert(70%) sepia(89%) saturate(456%) hue-rotate(358deg) brightness(103%) contrast(103%)' : 'none' }} />
            <span style={{ fontSize: 13.4, color: 'rgba(0,0,0,0.45)' }}>128</span>
          </button>
        </div>
      </div>
    </div>
  )
}
