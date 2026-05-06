import { useEffect } from 'react'

export default function BottomPanel({ open, onClose, title, subtitle, children }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* 遮罩 */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300"
        style={{
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
        }}
        onClick={onClose}
      />

      {/* 面板 */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[393px] z-50 rounded-t-[20px] overflow-hidden"
        style={{
          background: '#000',
          transform: open
            ? 'translateX(-50%) translateY(0)'
            : 'translateX(-50%) translateY(100%)',
          transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* 头部 */}
        <div className="px-[16px] pt-[20px] pb-[8px] relative">
          <div>
            <p className="text-white text-[18px] font-semibold">{title}</p>
            {subtitle && <p className="text-white/60 text-[12px] mt-[2px]">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="absolute top-[16px] right-[16px] w-[40px] h-[40px] rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* 内容 */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px)', paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}>
          {children}
        </div>
      </div>
    </>
  )
}
