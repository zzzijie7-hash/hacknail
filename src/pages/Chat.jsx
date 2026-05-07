import { useState, useEffect, useRef } from 'react'
import { Colors, Type, Spacing, Radius } from '../config/design'

const AUTO_REPLIES = [
  '你好！这个款式我们可以做，价格在 128-198 之间，看具体甲型～',
  '亲，这款我们有类似的设计，大概 158 包含手绘花哦',
  '可以的！这款下周五之前都能约，价格 168 😊',
  '你好呀～这个款式我们最近很火呢，168 可以做！要预约吗？',
  '这款好看！我们店 148 就能做，来之前提前说一声就行',
]

const QUICK_ACTIONS = [
  { label: '相册' },
  { label: '拍摄' },
  { label: '预约到店', highlight: true },
  { label: '位置' },
  { label: '红包' },
  { label: '转账' },
  { label: '更多' },
]

export default function Chat({ onBack, shop, nailData, onSmartWear }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef()
  const chatBodyRef = useRef()

  useEffect(() => {
    const initial = [
      { id: 1, from: 'shop', type: 'text', text: '你好，欢迎咨询！有什么可以帮你的吗？', time: '13:56' },
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
    const now = new Date()
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    setMessages((prev) => [...prev, { id: Date.now(), from: 'user', type: 'text', text: input.trim(), time }])
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
    <div className="min-h-screen flex flex-col items-center"
      style={{ fontFamily: "'PingFang SC', -apple-system, sans-serif", background: '#FAFAFA' }}>

      <div className="w-full bg-white flex flex-col" style={{ maxWidth: 375, height: '100vh' }}>

        {/* ── 顶栏 ── */}
        <div className="flex items-center h-[44px] px-[12px] gap-[10px] border-b border-[#F5F5F5] shrink-0">
          <button onClick={onBack} className="shrink-0 flex items-center justify-center w-[22px] h-[22px]">
            <img src="/icons/back.svg" width={22} height={22} alt="back" />
          </button>

          <div className="w-[34px] h-[34px] rounded-full bg-[#f5f5f5] flex items-center justify-center text-[14px] shrink-0">
            {shop?.avatar || '💅'}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[#222] font-medium truncate leading-tight"
              style={{ fontSize: Type.bodyBold.size, fontWeight: Type.bodyBold.weight, lineHeight: '23px' }}>
              {shop?.name || '美甲店'}
            </p>
            <p className="text-[#30DA6A] leading-tight"
              style={{ fontSize: Type.caption.size, fontWeight: Type.caption.weight, lineHeight: `${Type.caption.lh}px` }}>
              在线
            </p>
          </div>

          <button className="shrink-0 flex items-center justify-center w-[22px] h-[22px]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#999">
              <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
            </svg>
          </button>
        </div>

        {/* ── 消息列表 ── */}
        <div ref={chatBodyRef} className="flex-1 overflow-y-auto px-[16px] py-[12px] flex flex-col gap-[16px]"
          style={{ background: '#FAFAFA' }}>
          {messages.map((msg) => {
            const isUser = msg.from === 'user'
            return (
              <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                {/* 消息行 */}
                <div className={`flex gap-[10px] ${isUser ? 'flex-row-reverse' : ''}`}>
                  {/* 头像 — 仅对方显示 */}
                  {!isUser && (
                    <div className="w-[34px] h-[34px] rounded-full bg-[#f5f5f5] flex items-center justify-center text-[14px] shrink-0">
                      {shop?.avatar || '💅'}
                    </div>
                  )}
                  {isUser && <div className="w-[34px] shrink-0" />}

                  {msg.type === 'image' ? (
                    <div className="rounded-[4px] overflow-hidden" style={{ width: 181 }}>
                      <img src={msg.src} alt="nail" className="w-full h-auto" />
                    </div>
                  ) : (
                    <div className="px-[14px] py-[9px] text-[15px] leading-[23px] max-w-[65%]"
                      style={{
                        borderRadius: 11,
                        fontSize: Type.body.size,
                        lineHeight: `${Type.body.lh}px`,
                        ...(isUser
                          ? { background: '#2781FF', color: '#fff' }
                          : { background: '#F5F5F5', color: '#333' }),
                      }}>
                      {msg.text}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* typing */}
          {typing && (
            <div className="flex items-start">
              <div className="w-[34px] h-[34px] rounded-full bg-[#f5f5f5] flex items-center justify-center text-[14px] shrink-0 mr-[10px]">
                {shop?.avatar || '💅'}
              </div>
              <div className="flex items-center gap-[4px] px-[14px] py-[9px] rounded-[11px] bg-[#F5F5F5]">
                <div className="w-[6px] h-[6px] rounded-full bg-[#999] animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-[6px] h-[6px] rounded-full bg-[#999] animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-[6px] h-[6px] rounded-full bg-[#999] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── 快捷操作栏 ── */}
        <div className="flex gap-[4px] px-[12px] py-[6px] overflow-x-auto shrink-0"
          style={{ scrollbarWidth: 'none' }}>
          {QUICK_ACTIONS.map((item) => (
            <button key={item.label} className={`h-[30px] rounded-[8px] flex items-center justify-center text-[12px] shrink-0 active:scale-95 transition-transform
              ${item.highlight ? 'bg-[#FF2442] text-white font-medium' : 'bg-[#F5F5F5] text-[#666]'}`}
              style={{ padding: '0 12px', fontSize: Type.small.size }}>
              {item.label}
            </button>
          ))}
        </div>

        {/* ── 输入区 ── */}
        <div className="flex items-center gap-[8px] px-[12px] py-[8px] shrink-0"
          style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
          <div className="flex-1 bg-[#F5F5F5] rounded-[11px] h-[42px] flex items-center px-[14px]">
            <input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="输入消息…"
              className="w-full bg-transparent text-[15px] text-[#333] placeholder-[#999] outline-none"
              style={{ fontSize: Type.body.size }} />
          </div>
          <button onClick={send} disabled={!input.trim()}
            className="shrink-0 h-[42px] px-[16px] rounded-[11px] bg-[#2781FF] text-white text-[15px] font-medium disabled:opacity-30 active:scale-95 transition-transform"
            style={{ fontSize: Type.body.size }}>
            发送
          </button>
        </div>
      </div>
    </div>
  )
}
