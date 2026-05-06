import { useEffect } from 'react'

const STYLE = {
  overlay: (open) => ({
    position: 'fixed',
    inset: 0,
    zIndex: 40,
    background: 'rgba(0,0,0,0.4)',
    opacity: open ? 1 : 0,
    pointerEvents: open ? 'auto' : 'none',
    transition: 'opacity 0.3s',
  }),
  sheet: (open) => ({
    position: 'fixed',
    bottom: 0,
    left: '50%',
    zIndex: 50,
    width: '100%',
    maxWidth: 393,
    background: '#ffffff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '80vh',
    transform: open
      ? 'translateX(-50%) translateY(0)'
      : 'translateX(-50%) translateY(100%)',
    transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
    overflow: 'hidden',
  }),
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexShrink: 0,
    minHeight: 44,
    padding: '10px 84px',
  },
  title: {
    fontSize: 16,
    fontWeight: 500,
    color: 'rgba(0,0,0,0.8)',
    lineHeight: '24px',
    textAlign: 'center',
    fontFamily: 'PingFang SC, -apple-system, sans-serif',
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 20,
    height: 20,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    overflowY: 'auto',
    flex: 1,
    WebkitOverflowScrolling: 'touch',
    paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
  },
}

export default function BottomPanel({ open, onClose, title, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <div style={STYLE.overlay(open)} onClick={onClose} />
      <div style={STYLE.sheet(open)}>
        <div style={STYLE.header}>
          <span style={STYLE.title}>{title}</span>
          <button style={STYLE.closeBtn} onClick={onClose}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="rgba(0,0,0,0.8)" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div style={STYLE.body}>{children}</div>
      </div>
    </>
  )
}
