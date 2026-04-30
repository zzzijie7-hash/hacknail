import { useState, useEffect, useRef } from 'react'

const AUTO_REPLIES = [
  '你好！这个款式我们可以做，价格在 128-198 之间，看具体甲型～',
  '亲，这款我们有类似的设计，大概 158 包含手绘花哦',
  '可以的！这款下周五之前都能约，价格 168 😊',
  '你好呀～这个款式我们最近很火呢，168 可以做！要预约吗？',
  '这款好看！我们店 148 就能做，来之前提前说一声就行',
]

export default function Chat({ onBack, shop, nailData }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef()

  useEffect(() => {
    const initial = [
      { id: 1, from: 'shop', type: 'text', text: '你好，欢迎咨询！有什么可以帮你的吗？' },
      { id: 2, from: 'user', type: 'image', src: nailData?.result || nailData?.nail?.src },
      { id: 3, from: 'user', type: 'text', text: '你好，请问这个款式多少钱？' },
    ]
    setMessages(initial)

    setTyping(true)
    const timer = setTimeout(() => {
      setTyping(false)
      setMessages((prev) => [
        ...prev,
        { id: 4, from: 'shop', type: 'text', text: AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)] },
      ])
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const send = () => {
    if (!input.trim()) return
    setMessages((prev) => [...prev, { id: Date.now(), from: 'user', type: 'text', text: input.trim() }])
    setInput('')
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, from: 'shop', type: 'text', text: AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)] },
      ])
    }, 1500 + Math.random() * 2000)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col" style={{ fontFamily: "-apple-system, 'PingFang SC', sans-serif" }}>
      {/* 状态栏 */}
      <div className="h-[44px] bg-white" />

      {/* 顶栏 h≈53 */}
      <div className="px-[12px] flex items-center h-[53px] gap-[10px] border-b border-[#f5f5f5]">
        <button onClick={onBack}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        {/* 头像: 34.4x34.4 rx=17 */}
        <div className="w-[34px] h-[34px] rounded-full bg-[#f5f5f5] flex items-center justify-center text-[14px] shrink-0">{shop?.avatar || '💅'}</div>
        <div className="flex-1 min-w-0">
          <p className="text-[#222] text-[16px] font-medium truncate leading-tight">{shop?.name || '美甲店'}</p>
          <p className="text-[#30DA6A] text-[12px] leading-tight">在线</p>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#ccc">
          <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
        </svg>
      </div>

      {/* 消息区 */}
      <div className="flex-1 overflow-y-auto px-[16px] py-[12px] flex flex-col gap-[16px]">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-[10px] ${msg.from === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* 头像: 34.4x34.4 rx=17 */}
            <div className="w-[34px] h-[34px] rounded-full bg-[#f5f5f5] flex items-center justify-center text-[14px] shrink-0">
              {msg.from === 'user' ? '🧑' : (shop?.avatar || '💅')}
            </div>
            {/* 消息内容 */}
            <div className={`max-w-[65%] ${msg.from === 'user' ? 'items-end' : 'items-start'}`}>
              {msg.type === 'image' ? (
                <div className="rounded-[10px] overflow-hidden">
                  <img src={msg.src} alt="nail" className="w-[181px] h-auto rounded-[4px]" />
                </div>
              ) : (
                <div className={`px-[14px] py-[9px] rounded-[11px] text-[15px] leading-[23px]
                  ${msg.from === 'user'
                    ? 'bg-[#2781FF] text-white'
                    : 'bg-[#F5F5F5] text-[#333]'}`}>
                  {msg.text}
                </div>
              )}
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex gap-[10px]">
            <div className="w-[34px] h-[34px] rounded-full bg-[#f5f5f5] flex items-center justify-center text-[14px] shrink-0">{shop?.avatar || '💅'}</div>
            <div className="px-[14px] py-[9px] rounded-[11px] bg-[#F5F5F5] flex items-center gap-[4px]">
              <span className="w-[6px] h-[6px] rounded-full bg-[#999] animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-[6px] h-[6px] rounded-full bg-[#999] animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-[6px] h-[6px] rounded-full bg-[#999] animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 快捷操作栏: y≈693 h=30.5 rx=8 */}
      <div className="px-[12px] py-[6px] flex gap-[4px] overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {[
          { label: '相册', w: 52 },
          { label: '拍摄', w: 75 },
          { label: '位置', w: 75 },
          { label: '红包', w: 52 },
          { label: '转账', w: 63 },
          { label: '更多', w: 75 },
        ].map((item) => (
          <div key={item.label} className="h-[30px] rounded-[8px] bg-[#F5F5F5] flex items-center justify-center text-[#666] text-[12px] shrink-0"
            style={{ width: `${item.w}px`, minWidth: `${item.w}px` }}>
            {item.label}
          </div>
        ))}
      </div>

      {/* 输入框: y≈731 w=352 h=42 rx=11 #F5F5F5 */}
      <div className="px-[12px] py-[8px] flex items-center gap-[8px]"
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
        <div className="flex-1 bg-[#F5F5F5] rounded-[11px] px-[14px] h-[42px] flex items-center">
          <input value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="输入消息…"
            className="w-full bg-transparent text-[15px] text-[#333] placeholder-[#999] outline-none" />
        </div>
        <button onClick={send} disabled={!input.trim()}
          className="shrink-0 px-[14px] h-[42px] rounded-[11px] bg-[#2781FF] text-white text-[15px] font-medium disabled:opacity-30">发送</button>
      </div>
    </div>
  )
}
