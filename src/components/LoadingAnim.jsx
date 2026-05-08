/**
 * 加载动画 — 旋转渐变光圈
 * 品类切换只影响底部 emoji + 文案
 */
const CAT = {
  nail:      { label: '美甲试戴中…',   emoji: '💅' },
  pet:       { label: '装扮生成中…',   emoji: '🐾' },
  rental:    { label: '户型分析中…',   emoji: '🏠' },
  portrait:  { label: '写真渲染中…',   emoji: '📷' },
  accessory: { label: '饰品试戴中…',   emoji: '💍' },
  tattoo:    { label: '纹身试戴中…',   emoji: '🌿' },
}

export default function LoadingAnim({ category = 'nail', size = 56, showLabel = true }) {
  const c = CAT[category] || CAT.nail
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10,userSelect:'none'}}>
      <svg style={{animation:'spin 1.2s linear infinite'}} width={size} height={size} viewBox="0 0 56 56">
        <defs>
          <linearGradient id="loadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF2442"/>
            <stop offset="50%" stopColor="#FF6B8A"/>
            <stop offset="100%" stopColor="#FFB3C6"/>
          </linearGradient>
        </defs>
        <circle cx="28" cy="28" r="22" fill="none" stroke="#f0f0f0" strokeWidth="2.5"/>
        <circle cx="28" cy="28" r="22" fill="none" stroke="url(#loadGrad)" strokeWidth="2.5"
          strokeLinecap="round" strokeDasharray="75 138"/>
      </svg>
      {showLabel && (
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <span style={{fontSize:15,lineHeight:'20px'}}>{c.emoji}</span>
          <span style={{fontSize:13,fontWeight:500,color:'rgba(0,0,0,0.42)',lineHeight:'18px'}}>
            {c.label}
          </span>
        </div>
      )}
      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
    </div>
  )
}
