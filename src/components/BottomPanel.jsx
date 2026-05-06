import { useEffect } from 'react'

const S = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 40,
    background: 'rgba(0,0,0,0.4)',
    transition: 'opacity 0.3s',
  },
  sheet: {
    position: 'fixed', bottom: 0, left: '50%',
    width: '100%', maxWidth: 393, zIndex: 50,
    background: '#fff',
    borderTopLeftRadius: 12, borderTopRightRadius: 12,
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
    transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative',
    padding: '10px 84px',
    flexShrink: 0,
    minHeight: 44,
  },
  title: {
    fontSize: 16, fontWeight: 500, fontFamily: 'PingFang SC, sans-serif',
    color: 'rgba(0,0,0,0.8)', lineHeight: '24px',
    textAlign: 'center',
  },
  closeBtn: {
    position: 'absolute', right: 16, top: '50%',
    transform: 'translateY(-50%)',
    width: 20, height: 20, border: 'none', background: 'none',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  body: {
    overflowY: 'auto', flex: 1,
    paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
    WebkitOverflowScrolling: 'touch',
  },
}

export default function BottomPanel({ open, onClose, title, subtitle, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <div style={{
        ...S.overlay,
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
      }} onClick={onClose} />

      <div style={{
        ...S.sheet,
        transform: open
          ? 'translateX(-50%) translateY(0)'
          : 'translateX(-50%) translateY(100%)',
      }}>
        <div style={S.header}>
          {title && <span style={S.title}>{title}</span>}
          {onClose && (
            <button style={S.closeBtn} onClick={onClose}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="rgba(0,0,0,0.8)" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
        <div style={S.body}>{children}</div>
      </div>
    </>
  )
}
