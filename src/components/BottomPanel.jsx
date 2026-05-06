import { useEffect } from 'react'

export default function BottomPanel({ open, onClose, title, subtitle, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
        onClick={onClose}
      />

      <div
        className="fixed bottom-0 left-1/2 w-full max-w-[393px] z-50 bg-white rounded-t-[12px] overflow-hidden flex flex-col"
        style={{
          transform: open ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(100%)',
          transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        <div className="flex items-center justify-center relative shrink-0 px-[84px] py-[10px] min-h-[44px]">
          {title && (
            <span className="text-[rgba(0,0,0,0.8)] text-[16px] font-medium leading-6 text-center"
              style={{ fontFamily: "PingFang SC, sans-serif" }}>
              {title}
            </span>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center active:scale-90 transition-transform"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.8)" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        <div className="overflow-y-auto flex-1" style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))', WebkitOverflowScrolling: 'touch' }}>
          {children}
        </div>
      </div>
    </>
  )
}
