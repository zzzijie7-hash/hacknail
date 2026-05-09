import { useState, useEffect } from 'react'
import { getAgent } from '../config/agents'
import { loadLibrary, saveLibrary } from '../utils/nailLibrary'

export default function PostDetail({ post, onBack, onTryOn }) {
  const [liked, setLiked] = useState(false)
  const [collected, setCollected] = useState(false)
  const [currentImg, setCurrentImg] = useState(0)
  const [swipeStart, setSwipeStart] = useState(null)

  // 进帖子自动将图片导入对应类别美甲库
  useEffect(() => {
    if (!post) return
    const cat = post.type || 'nail'
    const imgs = post.images || []
    if (!imgs.length) return
    const all = loadLibrary()
    const existingSrcs = new Set(all.map(n => n.src))
    const gid = 'post_' + post.id
    // 帖子导入组已存在则跳过
    if (all.some(n => n.groupId === gid)) return
    const gLabel = post.author ? `${post.author}的帖子` : '帖子导入'
    const toAdd = []
    imgs.forEach((src, i) => {
      const url = src.replace('http://', 'https://')
      if (!existingSrcs.has(url)) {
        toAdd.push({ id: Date.now() + i, src: url, groupId: gid, groupLabel: gLabel, category: cat })
      }
    })
    if (toAdd.length) saveLibrary([...all, ...toAdd])
  }, [post?.id])

  if (!post) return null

  const images = post.images || []
  const agent = getAgent(post.type)

  const handleSwipeStart = (clientX) => {
    if (images.length <= 1) return
    setSwipeStart(clientX)
  }

  const handleSwipeEnd = (clientX) => {
    if (images.length <= 1 || swipeStart == null) return
    const d = clientX - swipeStart
    if (d < -40) setCurrentImg(i => Math.min(i + 1, images.length - 1))
    if (d > 40) setCurrentImg(i => Math.max(i - 1, 0))
    setSwipeStart(null)
  }

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

      {/* ── 可滚动内容 (图片 + 正文 + 评论) ── */}
      <div className="flex-1 overflow-y-auto">
        {/* 图片区 3:4 */}
        <div className="relative" style={{ width: 375, height: 477 }}
          onTouchStart={(e) => handleSwipeStart(e.touches[0].clientX)}
          onTouchEnd={(e) => handleSwipeEnd(e.changedTouches[0].clientX)}
          onMouseDown={(e) => handleSwipeStart(e.clientX)}
          onMouseUp={(e) => handleSwipeEnd(e.clientX)}>
          {images.length > 0 ? (
            <img src={images[currentImg]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              draggable={false}
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

          {/* 居中试同款 hashtag 引导 */}
          {agent.label && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                zIndex: 10,
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: 14,
                  height: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'tryOnPulse 1.6s ease-in-out infinite',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.4)',
                    boxShadow: '0 0 16px rgba(241,234,255,0.55)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#F1EAFF',
                    boxShadow: '0 0 10px rgba(241,234,255,0.95)',
                  }}
                />
              </div>
              <button
                onClick={() => onTryOn(post)}
                className="active:scale-95 transition-transform"
                style={{
                  pointerEvents: 'auto',
                  border: 'none',
                  borderRadius: 999,
                  background: 'rgba(241,234,255,0.56)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  boxShadow: '0 8px 24px rgba(121,42,255,0.08), inset 0 1px 0 rgba(255,255,255,0.4)',
                  color: '#792AFF',
                  padding: '8px 10px',
                  fontSize: 13,
                  fontWeight: 600,
                  lineHeight: '18px',
                  border: '1px solid rgba(255,255,255,0.32)',
                  opacity: 0,
                  transform: 'translateX(-10px) scale(0.96)',
                  animation: 'tryOnTagIn 420ms cubic-bezier(0.2, 0.8, 0.2, 1) 0.5s forwards',
                }}
              >
                试试看！
              </button>
            </div>
          )}
        </div>

        {/* 圆点指示器 (height=24, padding=10) */}
        {images.length > 1 && (
          <div className="flex justify-center items-center" style={{ height: 24, padding: 10, gap: 5 }}>
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
        <div style={{ padding: '14px 14px 0' }}>
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
        </div>

        {/* ── 评论区 (Figma: 153-4043) ── */}
        {/* 分割线 */}
        <div style={{ height: 1, background: '#F5F5F5', margin: '0 15px' }} />

        {/* 评论标题 (pad 15/16/15/0, gap=20) */}
        <div className="flex items-center" style={{ padding: '16px 15px 0', gap: 20 }}>
          <div style={{ position: 'relative' }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(0,0,0,0.8)', lineHeight: '20px' }}>
              共 {Math.floor(post.likes * 0.05) + Math.floor(Math.random() * 30)} 条评论
            </span>
            <div style={{ width: 76, height: 2, borderRadius: 1, background: '#FF2442', marginTop: 2 }} />
          </div>
        </div>

        {/* 评论输入框 (pad 15/16/15/4, gap=12) */}
        <div className="flex items-center" style={{ padding: '16px 15px 4px', gap: 12 }}>
          <div className="rounded-full bg-[#f5f5f5] shrink-0" style={{ width: 36, height: 36 }} />
          <div className="flex items-center" style={{
            flex: 1, height: 34, borderRadius: 18, padding: '7px 16px', gap: 41,
            background: 'rgba(48,48,52,0.05)',
          }}>
            <span style={{ fontSize: 14, color: 'rgba(0,0,0,0.3)', lineHeight: '20px' }}>喜欢就给个评论支持一下</span>
            <div className="flex items-center" style={{ gap: 8 }}>
              <span style={{ fontSize: 20, color: 'rgba(0,0,0,0.3)' }}>@</span>
              <span style={{ fontSize: 20, color: 'rgba(0,0,0,0.3)' }}>😊</span>
              <span style={{ fontSize: 20, color: 'rgba(0,0,0,0.3)' }}>🖼</span>
            </div>
          </div>
        </div>

        {/* 评论列表 */}
        {[
          { name: '倩碧', tag: '品牌', tagBg: 'rgba(48,48,52,0.08)', text: '倩碧痘敏肌专研重磅来袭！速成千净脸！立刻 get同款吧~', time: '10-29', ip: '上海', likes: 20 },
          { name: 'Purple阿紫', tag: '作者', tagBg: 'rgba(255,36,66,0.08)', tagColor: '#FF2442', text: '哇～很喜欢这次的分享，平时就很喜欢看下次带上我', time: '10-29', ip: '上海', likes: 20, pinned: true },
        ].map((c, i) => (
          <div key={i} className="flex" style={{ padding: '14px 15px', gap: 12 }}>
            <div className="rounded-full bg-[#f5f5f5] shrink-0" style={{ width: 36, height: 36 }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center flex-wrap" style={{ gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 14, color: 'rgba(0,0,0,0.8)', lineHeight: '20px' }}>{c.name}</span>
                {c.tag && (
                  <span style={{
                    fontSize: 10, fontWeight: 500, lineHeight: '14px', padding: '0 6px',
                    borderRadius: 9, background: c.tagBg || 'rgba(48,48,52,0.08)',
                    color: c.tagColor || 'rgba(0,0,0,0.8)',
                  }}>{c.tag}</span>
                )}
                {c.pinned && (
                  <span style={{
                    fontSize: 10, fontWeight: 500, lineHeight: '14px', padding: '0 6px',
                    borderRadius: 9, background: 'rgba(255,36,66,0.08)', color: '#FF2442',
                  }}>置顶评论</span>
                )}
              </div>
              <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.8)', lineHeight: '22px' }}>{c.text}</p>
              <div className="flex items-center" style={{ gap: 4, marginTop: 4 }}>
                <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.3)', lineHeight: '16px' }}>{c.time}</span>
                <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.3)', lineHeight: '18px' }}>{c.ip}</span>
                <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.3)', lineHeight: '18px', marginLeft: 2 }}>回复</span>
              </div>
            </div>
            <div className="flex flex-col items-center shrink-0" style={{ gap: 2 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.3)', lineHeight: '18px' }}>{c.likes}</span>
            </div>
          </div>
        ))}

        {/* 底部分割 + 到底了 */}
        <div className="flex flex-col items-center justify-center" style={{ height: 48 }}>
          <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.3)', lineHeight: '18px' }}>- 到底了 -</span>
        </div>
      </div>

      {/* ── 底部固定栏 (Figma: engage bar 375x53, pad 14.3/9.5, gap 11.5) ── */}
      <div className="flex items-center shrink-0"
        style={{
          height: 53, padding: '9.5px 14.3px',
          borderTop: '1px solid rgba(0,0,0,0.05)',
          gap: 11.5,
        }}>
        <div className="flex items-center" style={{
          width: 156, height: 34, gap: 3.8, padding: '7.6px 11.5px',
          background: 'rgba(48,48,52,0.05)', borderRadius: 17,
        }}>
          <img src="/icons/edit.svg" width={20} height={20} alt="edit" />
          <span style={{ fontSize: 13.4, color: 'rgba(0,0,0,0.45)', lineHeight: '17px' }}>说点什么...</span>
        </div>
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
      <style>{`
        @keyframes tryOnPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.88;
          }
          50% {
            transform: scale(1.16);
            opacity: 1;
          }
        }

        @keyframes tryOnTagIn {
          0% {
            opacity: 0;
            transform: translateX(-10px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
    </div>
  )
}
