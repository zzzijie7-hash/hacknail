import { useState, useRef, useEffect } from 'react'
import { AGENTS } from '../config/agents'

// 三张功能卡片 — 从 AGENTS 配置取前三个
const agentList = Object.entries(AGENTS)
const FEATURE_CARDS = agentList.slice(0, 3).map(([id, a]) => ({
  id, emoji: a.icon, title: a.label, desc: a.subLabel,
  gradient: a.gradient, rotation: a.rotation, offsetY: a.offsetY,
}))

const QUICK_ACTIONS = [
  ...agentList.map(([id, a]) => ({ icon: a.icon, label: a.label, action: id })),
  { icon: '✨', label: '随便聊聊', action: 'chat' },
]

const AI_REPLIES = {
  'nail': '好的！美甲试戴走起 💅\n\n我可以帮你：\n• 挑选适合你的款式\n• AI 试戴看效果\n• 推荐附近美甲店\n\n点击下方「试戴」直接开始吧～',
  'rental': '户型还原来啦 🏠\n\n看到租房帖子就来试：\n• 从图片分析户型\n• 生成简洁户型图\n• 看清房间布局\n\n给我一个租房帖子的链接试试～',
  'portrait': '写真风格推荐来啦 📷\n\n我可以帮你：\n• 识别写真风格\n• 推荐相似风格\n• 找到约拍资源',
  'pet': '宠物穿搭安排 🐾\n\n上传毛孩子的照片：\n• AI 试穿不同装扮\n• 推荐好看的宠物服饰\n• 生成可爱效果图',
  'chat': '嗨～想聊什么都可以！\n\n我是点点，你的生活小助手 ✨\n美甲、租房、写真、宠物穿搭，都能找我～',
}

export default function AIChat({ onBack, onTryOn }) {
  const [messages, setMessages] = useState([
    { role: 'ai', text: '嗨！我是点点 ✨\n\n你的生活方式 AI 助手，美甲试戴、户型还原、宠物穿搭，找我就对了！' }
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, typing])

  const sendMessage = (text) => {
    if (!text.trim()) return
    setMessages(prev => [...prev, { role: 'user', text: text.trim() }])
    setInput('')
    setTyping(true)

    setTimeout(() => {
      setTyping(false)
      const reply = AI_REPLIES[text.trim()] || `收到！让我想想...\n\n关于「${text.trim()}」，点点正在为你思考中～\n你也可以点击上方卡片快速体验哦 ✨`
      setMessages(prev => [...prev, { role: 'ai', text: reply }])
    }, 1200)
  }

  const handleCardClick = (card) => {
    const agent = AGENTS[card.id]
    if (agent?.page) {
      onTryOn()
      return
    }
    sendMessage(card.id)
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] relative overflow-x-hidden flex flex-col items-center"
      style={{ fontFamily: "-apple-system, 'PingFang SC', sans-serif" }}>
      <div className="w-full max-w-[375px] min-h-screen bg-white flex flex-col">

        {/* 顶栏 */}
        <div className="flex items-center h-[52px] px-[16px] shrink-0">
          <button onClick={onBack} className="active:scale-90 transition-transform">
            <img src="/icons/back.svg" width={22} height={22} alt="back" />
          </button>
          <div className="flex-1 flex items-center justify-center gap-[8px]">
            <span className="text-[rgba(0,0,0,0.8)] text-[15px] font-semibold">点点</span>
          </div>
          <div className="w-[22px]" />
        </div>

        {/* 点点形象 + 功能卡片 */}
        <div className="px-[16px] pt-[8px] pb-[16px]">
          {/* 点点头像 + 问候 */}
          <div className="flex items-center gap-[12px] mb-[20px]">
            <img src="/icons/diandian-avatar.png" alt="点点" className="w-[52px] h-[52px] rounded-[14px] object-cover" />
            <div>
              <p className="text-[rgba(0,0,0,0.8)] text-[16px] font-semibold leading-tight">嗨，我是点点</p>
              <p className="text-[rgba(0,0,0,0.4)] text-[12px] mt-[2px]">你的生活方式 AI 助手</p>
            </div>
          </div>

          {/* 三张倾斜卡片 */}
          <div className="relative h-[150px] mb-[4px]">
            {FEATURE_CARDS.map((card) => (
              <div key={card.id} onClick={() => handleCardClick(card)}
                className="absolute w-[140px] h-[120px] rounded-[14px] cursor-pointer active:scale-95 transition-all overflow-hidden shadow-md"
                style={{
                  transform: `rotate(${card.rotation})`,
                  top: card.offsetY,
                  left: card.id === 'nail' ? '10px' : card.id === 'floorplan' ? '110px' : '210px',
                  zIndex: card.id === 'floorplan' ? 3 : card.id === 'nail' ? 2 : 1,
                }}>
                <div className={`w-full h-full bg-gradient-to-br ${card.gradient} p-[14px] flex flex-col justify-between`}>
                  <span className="text-[28px]">{card.emoji}</span>
                  <div>
                    <p className="text-white text-[14px] font-semibold leading-tight">{card.title}</p>
                    <p className="text-white/70 text-[10px] mt-[2px]">{card.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 对话区域 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-[16px] py-[12px] flex flex-col gap-[16px]"
          style={{ paddingBottom: '140px' }}>
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'ai' && (
                <img src="/icons/diandian-avatar.png" alt="点点"
                  className="w-[28px] h-[28px] rounded-[8px] object-cover shrink-0 mr-[10px] mt-[2px]" />
              )}
              <div className={`px-[14px] py-[10px] text-[14px] leading-[22px] max-w-[75%] whitespace-pre-line
                ${m.role === 'user'
                  ? 'bg-[#FF2442] text-white rounded-[16px] rounded-tr-[4px]'
                  : 'bg-[#f5f5f5] text-[rgba(0,0,0,0.7)] rounded-[16px] rounded-tl-[4px]'}`}>
                {m.text}
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex justify-start">
              <img src="/icons/diandian-avatar.png" alt="点点"
                className="w-[28px] h-[28px] rounded-[8px] object-cover shrink-0 mr-[10px] mt-[2px]" />
              <div className="bg-[#f5f5f5] rounded-[16px] rounded-tl-[4px] px-[16px] py-[12px] flex items-center gap-[4px]">
                <div className="w-[6px] h-[6px] rounded-full bg-[rgba(0,0,0,0.2)] animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-[6px] h-[6px] rounded-full bg-[rgba(0,0,0,0.2)] animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-[6px] h-[6px] rounded-full bg-[rgba(0,0,0,0.2)] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        {/* 底部固定区 */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 max-w-[375px] w-full bg-white border-t border-[#f0f0f0]">
          {/* 快捷入口 */}
          <div className="flex gap-[8px] px-[16px] pt-[10px] pb-[6px] overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {QUICK_ACTIONS.map((action) => (
              <button key={action.label}
                onClick={() => {
                  const agent = AGENTS[action.action]
                  if (agent?.page) { onTryOn(); return }
                  sendMessage(action.action)
                }}
                className="shrink-0 flex items-center gap-[4px] px-[12px] py-[6px] rounded-[16px] bg-[#f5f5f5] text-[rgba(0,0,0,0.6)] text-[12px] active:scale-95 transition-transform hover:bg-[#eee]">
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>

          {/* 输入框 + 美甲试戴入口 */}
          <div className="flex items-center gap-[8px] px-[16px] pb-[max(12px,env(safe-area-inset-bottom))]">
            <div className="flex-1">
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                placeholder="和点点聊聊..."
                className="w-full bg-[#f5f5f5] border border-[#eee] rounded-[20px] px-[16px] py-[10px] text-[14px] text-[rgba(0,0,0,0.8)] placeholder-[rgba(0,0,0,0.25)] outline-none focus:border-[#7C3AED]/40 transition" />
            </div>
            <button onClick={() => onTryOn()}
              className="shrink-0 flex items-center gap-[6px] px-[14px] py-[10px] rounded-[20px] bg-gradient-to-r from-[#FF6B9D] to-[#FF2442] text-white text-[13px] font-medium active:scale-95 transition-transform">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              试戴
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
