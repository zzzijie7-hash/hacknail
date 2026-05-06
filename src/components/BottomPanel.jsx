import { useEffect } from 'react'

export default function BottomPanel({ open, onClose, title, children }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(0,0,0,0.4)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.3s',
        }}
      />
      <div
        style={{
          position: 'fixed', bottom: 0, left: '50%', zIndex: 50,
          width: '100%', maxWidth: 393,
          background: '#fff',
          borderTopLeftRadius: 12, borderTopRightRadius: 12,
          display: 'flex', flexDirection: 'column',
          maxHeight: '80vh',
          transform: open
            ? 'translateX(-50%) translateY(0)'
            : 'translateX(-50%) translateY(100%)',
          transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', flexShrink: 0, minHeight: 44,
            padding: '10px 84px',
          }}
        >
          <span style={{
            fontSize: 16, fontWeight: 500, color: 'rgba(0,0,0,0.8)',
            lineHeight: '24px', textAlign: 'center',
            fontFamily: 'PingFang SC, sans-serif',
          }}>
            {title}
          </span>
          <button
            onClick={onClose}
            style={{
              position: 'absolute', right: 16, top: '50%',
              transform: 'translateY(-50%)', width: 20, height: 20,
              border: 'none', background: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="rgba(0,0,0,0.8)" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div
          style={{
            overflowY: 'auto', flex: 1,
            WebkitOverflowScrolling: 'touch',
            paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
          }}
        >
          {children}
        </div>
      </div>
    </>
  )
}
