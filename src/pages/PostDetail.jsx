import { useState } from 'react'
import { getAgent } from '../config/agents'

// 间距调节参数
const defaults = {
  navH: 61, navPx: 14, navGap: 10,
  avatarSize: 34, followW: 52, followH: 26,
  imgH: 477, imgCounterTop: 10, imgCounterRight: 10,
  imgDotBottom: 12, imgDotGap: 5, imgDotSize: 6,
  tryOnBottom: 12, tryOnRight: 12, tryOnH: 30, tryOnPx: 14,
  contentPx: 14, contentPt: 14, contentPb: 10,
  titleFs: 17, titleLh: 24, titleMb: 8,
  textFs: 15, textLh: 23, textMb: 10,
  tagFs: 14, tagGap: 4,
  dividerH: 2,
  commentPx: 14, commentPy: 12, commentMb: 14,
  commentAvatarSize: 26, commentGap: 10,
  bottomH: 53, bottomPx: 14,
  inputH: 34, inputRadius: 17,
  iconGap: 20, iconSize: 28,
}

export default function PostDetail({ post, onBack, onTryOn }) {
  const [liked, setLiked] = useState(false)
  const [collected, setCollected] = useState(false)
  const [currentImg, setCurrentImg] = useState(0)
  const [showPanel, setShowPanel] = useState(true)
  const [s, setS] = useState(defaults)

  if (!post) return null
  const images = post.images || []
  const commentCount = Math.floor(post.likes * 0.05) + Math.floor(Math.random() * 50)

  const set = (k, v) => setS(prev => ({ ...prev, [k]: typeof v === 'function' ? v(prev[k]) : v }))

  const Slider = ({ label, k, min = 0, max = 80, step = 1 }) => (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-[80px] text-right text-[#666] shrink-0">{label}</span>
      <input type="range" min={min} max={max} step={step} value={s[k]}
        onChange={e => set(k, +e.target.value)}
        className="flex-1 h-[3px] appearance-none bg-[#ddd] rounded [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[14px] [&::-webkit-slider-thumb]:h-[14px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#FF2442] [&::-webkit-slider-thumb]:cursor-pointer" />
      <span className="w-[32px] text-[#333]">{s[k]}</span>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FAFAFA] relative overflow-x-hidden flex flex-col items-center" style={{ fontFamily: "-apple-system, 'PingFang SC', sans-serif" }}>
      <div className="w-full max-w-[375px] min-h-screen bg-white relative" style={{ paddingBottom: `${s.bottomH + 20}px` }}>

        {/* 导航栏 */}
        <div className="flex items-center sticky top-0 bg-white z-20"
          style={{ padding: `0 ${s.navPx}px`, height: `${s.navH}px`, gap: `${s.navGap}px` }}>
          <button onClick={onBack} className="shrink-0">
            <img src="/icons/back.svg" width={22} height={22} alt="back" />
          </button>
          <div className="rounded-full bg-[#f5f5f5] flex items-center justify-center shrink-0"
            style={{ width: `${s.avatarSize}px`, height: `${s.avatarSize}px` }}>
            <span style={{ fontSize: 14 }}>{post.avatar || '💅'}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[rgba(0,0,0,0.8)] text-[15px] font-medium truncate leading-tight">{post.author}</p>
            <p className="text-[rgba(0,0,0,0.3)] text-[11px] leading-tight">3小时前</p>
          </div>
          <button className="shrink-0 text-[#FF2442] text-[13px] font-medium flex items-center justify-center rounded-[13px] border border-[#FF2442]"
            style={{ width: `${s.followW}px`, height: `${s.followH}px` }}>
            关注
          </button>
          <button className="shrink-0 ml-[4px]">
            <img src="/icons/share.svg" width={22} height={22} alt="share" />
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
              style={{ height: `${s.imgH}px` }}
              onError={(e) => { e.target.style.display = 'none' }} />
          ) : null}
          {images.length > 1 && (
            <div className="absolute px-[8px] py-[3px] rounded-[11px] bg-[#303034]/50 text-white text-[11px]"
              style={{ top: `${s.imgCounterTop}px`, right: `${s.imgCounterRight}px` }}>
              {currentImg + 1}/{images.length}
            </div>
          )}
          {images.length > 1 && (
            <div className="absolute left-1/2 -translate-x-1/2 flex"
              style={{ gap: `${s.imgDotGap}px`, bottom: `${s.imgDotBottom}px` }}>
              {images.map((_, i) => (
                <div key={i} className={`rounded-full transition-colors ${i === currentImg ? 'bg-[#FF2442]' : 'bg-[#303034]/20'}`}
                  style={{ width: `${s.imgDotSize}px`, height: `${s.imgDotSize}px` }} />
              ))}
            </div>
          )}
          {/* Agent 入口按钮 — 按帖子类别动态切换 */}
          {(() => {
            const agent = getAgent(post.type)
            if (!agent.label) return null
            return (
              <button onClick={() => onTryOn(post)}
                className="absolute shrink-0 text-white text-[13px] font-medium flex items-center justify-center rounded-[15px] bg-[#FF2442] z-10"
                style={{ bottom: `${s.tryOnBottom}px`, right: `${s.tryOnRight}px`, height: `${s.tryOnH}px`, padding: `0 ${s.tryOnPx}px` }}>
                {agent.icon} {agent.label}
              </button>
            )
          })()}
        </div>

        {/* 正文 */}
        <div style={{ padding: `${s.contentPt}px ${s.contentPx}px ${s.contentPb}px` }}>
          <h2 className="text-[rgba(0,0,0,0.8)] font-semibold"
            style={{ fontSize: `${s.titleFs}px`, lineHeight: `${s.titleLh}px`, marginBottom: `${s.titleMb}px` }}>{post.title}</h2>
          <p className="text-[rgba(0,0,0,0.6)]"
            style={{ fontSize: `${s.textFs}px`, lineHeight: `${s.textLh}px`, marginBottom: `${s.textMb}px` }}>{post.content}</p>
          <div className="flex flex-wrap" style={{ gap: `${s.tagGap}px` }}>
            {(post.tags || []).map((tag) => (
              <span key={tag} className="text-[#133667]" style={{ fontSize: `${s.tagFs}px` }}>{tag}</span>
            ))}
          </div>
        </div>

        {/* 分割线 */}
        <div style={{ height: `${s.dividerH}px` }} className="bg-[#f5f5f5]" />

        {/* 评论区 */}
        <div style={{ padding: `${s.commentPy}px ${s.commentPx}px` }}>
          <p className="text-[rgba(0,0,0,0.3)] text-[14px]" style={{ marginBottom: `${s.commentMb}px` }}>共 {commentCount} 条评论</p>
          {[
            { avatar: '🦋', name: '蝴蝶结女孩', text: '好好看！求链接', time: '2小时前', color: '#42C9A0' },
            { avatar: '💫', name: '甜心美甲', text: '这个颜色太显白了，黄皮也适合吗？', time: '1小时前', color: '#FF9A9E' },
            { avatar: '🍀', name: '美甲小能手', text: '同款！我也刚做，真的绝', time: '45分钟前', color: '#A8E6CF' },
          ].map((c, i) => (
            <div key={i} className="flex" style={{ gap: `${s.commentGap}px`, marginBottom: `${s.commentMb}px` }}>
              <div className="rounded-full flex items-center justify-center shrink-0"
                style={{ background: c.color, width: `${s.commentAvatarSize}px`, height: `${s.commentAvatarSize}px` }}>
                <span className="text-white text-[8px]">{c.avatar}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] leading-[20px]"><span className="text-[#576b95] font-medium">{c.name}</span> <span className="text-[rgba(0,0,0,0.8)]">{c.text}</span></p>
                <p className="text-[rgba(0,0,0,0.3)] text-[12px] mt-[2px]">{c.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 底部栏 */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 max-w-[375px] w-full bg-white border-t border-[rgba(0,0,0,0.08)] flex items-center z-10"
          style={{ padding: `0 ${s.bottomPx}px`, height: `${s.bottomH}px`, paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}>
          <div className="flex-1 bg-[#303034]/[0.05] flex items-center px-[14px]"
            style={{ height: `${s.inputH}px`, borderRadius: `${s.inputRadius}px` }}>
            <img src="/icons/edit.svg" width={16} height={16} alt="edit" style={{ marginLeft: '8px', marginRight: '6px' }} />
            <span className="text-[rgba(0,0,0,0.45)] text-[14px]">说点什么…</span>
          </div>
          <div className="flex items-center" style={{ gap: `${s.iconGap}px`, marginLeft: '16px' }}>
            <button onClick={() => setLiked(!liked)} className="flex items-center gap-[2px]">
              <img src="/icons/like.svg" width={s.iconSize} height={s.iconSize} alt="like"
                style={{ filter: liked ? 'invert(25%) sepia(96%) saturate(7468%) hue-rotate(341deg) brightness(97%) contrast(110%)' : 'none' }} />
              <span className={`text-[13px] ${liked ? 'text-[#FF2442]' : 'text-[rgba(0,0,0,0.8)]'}`}>{post.likes + (liked ? 1 : 0)}</span>
            </button>
            <div className="flex items-center gap-[2px]">
              <img src="/icons/chat.svg" width={s.iconSize} height={s.iconSize} alt="chat" />
              <span className="text-[rgba(0,0,0,0.45)] text-[13px]">{commentCount}</span>
            </div>
            <button onClick={() => setCollected(!collected)} className="flex items-center gap-[2px]">
              <img src="/icons/collect.svg" width={s.iconSize} height={s.iconSize} alt="collect"
                style={{ filter: collected ? 'invert(70%) sepia(89%) saturate(456%) hue-rotate(358deg) brightness(103%) contrast(103%)' : 'none' }} />
              <span className={`text-[13px] ${collected ? 'text-[#ffc107]' : 'text-[rgba(0,0,0,0.8)]'}`}>{collected ? '已收藏' : post.collects || 128}</span>
            </button>
          </div>
        </div>

      </div>

      {/* 间距调节面板 */}
      {showPanel && (
        <div className="fixed top-[60px] right-0 w-[260px] bg-white/95 backdrop-blur-sm rounded-l-[12px] shadow-lg z-50 overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 120px)', padding: '12px' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-bold text-[#333]">间距调节</span>
            <button onClick={() => setShowPanel(false)} className="text-[#999] text-[12px]">收起</button>
          </div>

          <p className="text-[10px] text-[#FF2442] font-bold mt-2 mb-1">导航栏</p>
          <Slider label="高度" k="navH" max={80} />
          <Slider label="左右边距" k="navPx" max={30} />
          <Slider label="间距" k="navGap" max={20} />
          <Slider label="头像尺寸" k="avatarSize" max={50} />
          <Slider label="关注宽" k="followW" max={80} />
          <Slider label="关注高" k="followH" max={40} />

          <p className="text-[10px] text-[#FF2442] font-bold mt-2 mb-1">图片区</p>
          <Slider label="图片高度" k="imgH" max={600} />
          <Slider label="计数器上" k="imgCounterTop" max={30} />
          <Slider label="计数器右" k="imgCounterRight" max={30} />
          <Slider label="圆点底" k="imgDotBottom" max={30} />
          <Slider label="圆点间距" k="imgDotGap" max={15} />
          <Slider label="圆点大小" k="imgDotSize" max={12} />
          <Slider label="试戴底" k="tryOnBottom" max={40} />
          <Slider label="试戴右" k="tryOnRight" max={40} />
          <Slider label="试戴高" k="tryOnH" max={44} />
          <Slider label="试戴左右" k="tryOnPx" max={24} />

          <p className="text-[10px] text-[#FF2442] font-bold mt-2 mb-1">正文区</p>
          <Slider label="左右边距" k="contentPx" max={30} />
          <Slider label="上边距" k="contentPt" max={24} />
          <Slider label="下边距" k="contentPb" max={20} />
          <Slider label="标题字号" k="titleFs" max={24} />
          <Slider label="标题行高" k="titleLh" max={36} />
          <Slider label="标题下间距" k="titleMb" max={16} />
          <Slider label="正文字号" k="textFs" max={20} />
          <Slider label="正文行高" k="textLh" max={32} />
          <Slider label="正文下间距" k="textMb" max={20} />
          <Slider label="标签字号" k="tagFs" max={18} />
          <Slider label="标签间距" k="tagGap" max={12} />

          <p className="text-[10px] text-[#FF2442] font-bold mt-2 mb-1">分割线</p>
          <Slider label="高度" k="dividerH" max={20} />

          <p className="text-[10px] text-[#FF2442] font-bold mt-2 mb-1">评论区</p>
          <Slider label="左右边距" k="commentPx" max={30} />
          <Slider label="上下边距" k="commentPy" max={20} />
          <Slider label="评论间距" k="commentMb" max={24} />
          <Slider label="头像尺寸" k="commentAvatarSize" max={40} />
          <Slider label="头像文间距" k="commentGap" max={20} />

          <p className="text-[10px] text-[#FF2442] font-bold mt-2 mb-1">底部栏</p>
          <Slider label="高度" k="bottomH" max={70} />
          <Slider label="左右边距" k="bottomPx" max={30} />
          <Slider label="输入框高" k="inputH" max={44} />
          <Slider label="输入框圆角" k="inputRadius" max={22} />
          <Slider label="图标间距" k="iconGap" max={32} />
          <Slider label="图标大小" k="iconSize" max={36} />

          <button onClick={() => setS(defaults)}
            className="w-full mt-3 py-[6px] text-[12px] text-[#FF2442] border border-[#FF2442] rounded-[6px]">
            重置默认值
          </button>
        </div>
      )}
      {!showPanel && (
        <button onClick={() => setShowPanel(true)}
          className="fixed top-[60px] right-0 bg-[#FF2442] text-white text-[11px] px-[8px] py-[6px] rounded-l-[8px] z-50 shadow-md">
          调
        </button>
      )}
    </div>
  )
}
