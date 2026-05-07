import { useState, useRef, useEffect } from 'react'
import { Colors, Type, Spacing, Radius, Icon } from '../config/design'
import { AGENTS } from '../config/agents'

// 所有 Agent 作为卡片
const agentList = Object.entries(AGENTS)

// 图区展示卡片内容
const CARD_DATA = [
  { id: 'nail', title: '下一副美甲做什么款式？', subtitle: '美甲穿戴' },
  { id: 'pet', title: '最近有什么值得看的展览', subtitle: '宠物装扮' },
  { id: 'rental', title: '秋冬温泉度假\n3日游规划', subtitle: '看看户型' },
  { id: 'portrait', title: '帮我挑个写真风格', subtitle: '试下写真' },
]

const AI_REPLIES = {
  'nail': '好的！美甲试戴走起 💅\n\n我可以帮你：\n• 挑选适合你的款式\n• AI 试戴看效果\n• 推荐附近美甲店',
  'rental': '户型还原来啦 🏠\n\n看到租房帖子就来试：\n• 从图片分析户型\n• 生成简洁户型图\n• 看清房间布局',
  'portrait': '写真风格推荐来啦 📷\n\n我可以帮你：\n• 识别写真风格\n• 推荐相似风格\n• 找到约拍资源',
  'pet': '宠物穿搭安排 🐾\n\n上传毛孩子的照片：\n• AI 试穿不同装扮\n• 推荐好看的宠物服饰',
}

export default function AIChat({ onBack, onTryOn }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [started, setStarted] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, typing])

  const sendMessage = (text) => {
    const clean = text.trim()
    if (!clean) return
    if (!started) setStarted(true)

    setMessages(prev => [...prev, { role: 'user', text: clean }])
    setInput('')
    setTyping(true)

    // 检查是否是 Agent 操作
    const found = agentList.find(([id]) => id === clean)
    if (found) {
      const agent = found[1]
      if (agent.page) {
        setTimeout(() => {
          setTyping(false)
          setMessages(prev => [...prev, { role: 'ai', text: AI_REPLIES[found[0]] }])
        }, 800)
        return
      }
    }

    setTimeout(() => {
      setTyping(false)
      const reply = AI_REPLIES[clean] || `收到！关于「${clean}」，点点正在为你思考中～\n\n你可以点击上方卡片快速体验功能哦 ✨`
      setMessages(prev => [...prev, { role: 'ai', text: reply }])
    }, 1200)
  }

  const handleCardTap = (card) => {
    const [id] = agentList.find(([k]) => k === card.id) || []
    const agent = AGENTS[id]
    if (agent?.page) {
      onTryOn()
      return
    }
    sendMessage(card.id)
  }

  return (
    <div className="min-h-screen flex flex-col items-center"
      style={{ fontFamily: "'PingFang SC', -apple-system, 'SF Pro', sans-serif", background: '#fff' }}>

      <div className="w-full flex flex-col relative" style={{ maxWidth: 375, height: '100vh' }}>

        {/* ── SystemBar 系统状态栏 ── */}
        <div className="w-full flex items-center px-0 h-[44px] shrink-0" style={{ maxWidth: 375 }}>
          <img src="/icons/systembar.svg" alt="" className="w-full h-[44px]" />
        </div>

        {/* ── 标题栏 ── */}
        <div className="w-full flex items-center px-[15px] h-[53px] shrink-0" style={{ gap: 15 }}>
          <button onClick={onBack} className="shrink-0 active:scale-90 transition-transform"
            style={{ width: 23, height: 23, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/icons/back.svg" width={23} height={23} alt="back" />
          </button>
          <div className="flex items-center" style={{ gap: 6 }}>
            <div className="rounded-full overflow-hidden shrink-0" style={{ width: 24, height: 24, background: '#FF2442' }}>
              <img src="/icons/diandian-avatar.png" alt="点点" className="w-full h-full object-cover" />
            </div>
            <span style={{
              fontSize: Type.bodyBold.size, fontWeight: Type.bodyBold.weight, color: Colors.textPrimary,
              lineHeight: `${Type.bodyBold.lh}px`,
            }}>点点</span>
          </div>
          <div className="flex-1" />
          <button className="shrink-0 flex items-center justify-center" style={{ width: 23, height: 23 }}>
            <svg width="17" height="3" viewBox="0 0 17 3" fill="#000">
              <circle cx="1.5" cy="1.5" r="1.5"/><circle cx="8.5" cy="1.5" r="1.5"/><circle cx="15.5" cy="1.5" r="1.5"/>
            </svg>
          </button>
        </div>

        {/* ── 可滚动内容区 ── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto" style={{ paddingBottom: started ? 100 : 0 }}>
          <div className="px-[23px] pt-[0px] pb-[27px]">
            {/* — 欢迎区 — */}
            <div style={{ marginBottom: 27 }}>
              {/* 头像 + Hi */}
              <div className="flex items-center mb-[11px]" style={{ gap: 11, height: 57 }}>
                <div className="rounded-full overflow-hidden shrink-0" style={{ width: 46, height: 46, background: '#FF2442' }}>
                  <img src="/icons/diandian-avatar.png" alt="点点" className="w-full h-full object-cover" />
                </div>
                <span style={{
                  fontSize: Type.headline.size, fontWeight: Type.headline.weight, color: '#000',
                  lineHeight: `${Type.headline.lh}px`,
                }}>
                  Hi，我是点点
                </span>
              </div>

              {/* 介绍气泡 */}
              <div style={{
                background: '#F5F5F5',
                borderRadius: 16, borderTopLeftRadius: 4,
                padding: '11px 15px',
                display: 'inline-block',
                maxWidth: 286,
              }}>
                <span style={{
                  fontSize: Type.subBody.size, fontWeight: Type.subBody.weight, color: Colors.textPrimary,
                  lineHeight: `${Type.subBody.lh}px`,
                }}>
                  我是你的生活小帮手，买东西纠结、做旅游攻略，拿不定主意的都可以问我～
                </span>
              </div>
            </div>

            {/* — 功能卡片区 — */}
            <div className="flex gap-0 overflow-x-auto" style={{ marginBottom: started ? 27 : 0, scrollbarWidth: 'none' }}>
              {CARD_DATA.map((card, i) => {
                const agent = AGENTS[card.id]
                const isLast = i === CARD_DATA.length - 1
                return (
                  <button key={card.id} onClick={() => handleCardTap(card)}
                    className="shrink-0 rounded-[14px] active:scale-95 transition-transform overflow-hidden flex flex-col justify-between relative"
                    style={{
                      width: 124, height: 147,
                      background: `linear-gradient(135deg, ${['#FF6B9D', '#4ECDC4', '#A78BFA', '#F59E0B'][i]}, ${['#FF2442', '#2BAE66', '#7C3AED', '#EF4444'][i]})`,
                      marginRight: isLast ? 0 : 8,
                    }}>
                    {/* 缩略图装饰 */}
                    <div className="flex gap-[3px] p-[12px]">
                      {[...Array(3)].map((_, j) => (
                        <div key={j} className="rounded-[4px] bg-white/20" style={{ width: 29 + j * 2, height: 30 - j * 2 }} />
                      ))}
                    </div>
                    <div className="px-[12px] pb-[12px]">
                      <p className="text-white/80" style={{ fontSize: Type.chip.size, fontWeight: Type.chip.weight }}>
                        {card.subtitle}
                      </p>
                      <p className="text-white font-semibold leading-tight mt-[2px]" style={{ fontSize: Type.chip.size }}>
                        {card.title}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* — 对话消息列表 — */}
            {messages.map((m, i) => (
              <div key={i} className={`flex mb-[16px] ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'ai' && (
                  <div className="rounded-lg overflow-hidden shrink-0 mr-[10px] mt-[4px]" style={{ width: 28, height: 28, background: '#FF2442' }}>
                    <img src="/icons/diandian-avatar.png" alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="whitespace-pre-line"
                  style={{
                    maxWidth: '75%',
                    padding: '10px 14px',
                    fontSize: Type.subBody.size,
                    lineHeight: `${Type.subBody.lh}px`,
                    borderRadius: 16,
                    ...(m.role === 'user'
                      ? { background: '#FF2442', color: '#fff', borderTopRightRadius: 4 }
                      : { background: '#F5F5F5', color: 'rgba(0,0,0,0.7)', borderTopLeftRadius: 4 }),
                  }}>
                  {m.text}
                </div>
              </div>
            ))}

            {/* typing */}
            {typing && (
              <div className="flex justify-start mb-[16px]">
                <div className="rounded-lg overflow-hidden shrink-0 mr-[10px] mt-[4px]" style={{ width: 28, height: 28, background: '#FF2442' }}>
                  <img src="/icons/diandian-avatar.png" alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center gap-[4px]" style={{
                  background: '#F5F5F5', borderRadius: 16, borderTopLeftRadius: 4,
                  padding: '12px 16px',
                }}>
                  <div className="w-[6px] h-[6px] rounded-full bg-[rgba(0,0,0,0.2)] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-[6px] h-[6px] rounded-full bg-[rgba(0,0,0,0.2)] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-[6px] h-[6px] rounded-full bg-[rgba(0,0,0,0.2)] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── 底部固定输入区 ── */}
        <div className="shrink-0 bg-white" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
          {/* 输入行 */}
          <div className="flex items-center px-[11px] pb-[11px]" style={{ gap: 8 }}>
            <div className="flex-1 flex items-center bg-[#F5F5F5] border border-[#eee] rounded-[20px]"
              style={{ padding: '11px 13px', gap: 8 }}>
              {/* 语音图标 */}
              <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" strokeLinecap="round">
                <rect x="9" y="2" width="6" height="11" rx="3"/>
                <path d="M5 10a7 7 0 0 0 14 0"/>
                <line x1="12" y1="16" x2="12" y2="22"/>
              </svg>
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                placeholder="发消息或按住说话..."
                className="flex-1 bg-transparent outline-none placeholder-[rgba(0,0,0,0.25)]"
                style={{ fontSize: Type.body.size, color: Colors.textPrimary }} />
              <div className="w-[1px] h-[17px] bg-[#ddd]" />
              <div className="flex items-center" style={{ gap: 15 }}>
                <button onClick={() => onTryOn()} className="shrink-0">
                  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </button>
                <button className="shrink-0">
                  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="7" x2="12" y2="17"/>
                    <line x1="7" y1="12" x2="17" y2="12"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* 免责声明 */}
          <div className="flex justify-center pb-[4px]">
            <span style={{
              fontSize: Type.disclaimer.size, fontWeight: Type.disclaimer.weight,
              color: 'rgba(48,48,52,0.7)', lineHeight: `${Type.disclaimer.lh}px`,
            }}>
              内容由AI生成
            </span>
          </div>

          {/* Home Indicator */}
          <div className="flex justify-center pb-[8px]">
            <div className="w-[133px] h-[5px] rounded-[2.5px] bg-black" />
          </div>
        </div>
      </div>
    </div>
  )
}
