/**
 * 甲型四选一：杏仁 / 方型 / 椭圆 / 方圆
 * 图片自带标题，选中/未选中各一张
 */
const SHAPES = [
  { key: 'squoval', img: '/icons/shape-squoval.png', imgSel: '/icons/shape-squoval-selected.png' },
  { key: 'almond', img: '/icons/shape-almond.png', imgSel: '/icons/shape-almond-selected.png' },
  { key: 'square', img: '/icons/shape-square.png', imgSel: '/icons/shape-square-selected.png' },
  { key: 'oval', img: '/icons/shape-oval.png', imgSel: '/icons/shape-oval-selected.png' },
]

export default function ShapeSelector({ selected, onSelect, disabled = false }) {
  return (
    <div style={{ display: 'flex', gap: 0, justifyContent: 'flex-start', alignItems: 'flex-end', width: '100%', height: '100%', opacity: disabled ? 0.9 : 1 }}>
      {SHAPES.map(s => {
        const active = selected === s.key
        return (
          <button
            key={s.key}
            onClick={() => { if (!disabled) onSelect(s.key) }}
            disabled={disabled}
            style={{ border: 'none', background: 'transparent', cursor: disabled ? 'default' : 'pointer', padding: 0, width: '25%', height: '100%', flexShrink: 0, pointerEvents: disabled ? 'none' : 'auto' }}
          >
            <img src={active ? s.imgSel : s.img} alt="" style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain', filter: disabled ? 'saturate(0.92)' : 'none' }} />
          </button>
        )
      })}
    </div>
  )
}
