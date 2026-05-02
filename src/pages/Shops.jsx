import { useState, useEffect } from 'react'

const AMAP_KEY = '32c8cd01f088610e8ab03274c0678c56'

const MOCK_SHOPS = [
  { id: 1, name: '樱花美甲工作室', address: '朝阳区建国路88号SOHO现代城B1', distance: 350, rating: 4.8, avatar: '🌸', tag: '日系美甲' },
  { id: 2, name: 'Nail Art Studio', address: '朝阳区三里屯太古里南区3层', distance: 580, rating: 4.9, avatar: '✨', tag: '韩式美甲' },
  { id: 3, name: '指尖艺术美甲', address: '朝阳区望京SOHO T1 1层', distance: 1200, rating: 4.7, avatar: '💎', tag: '法式美甲' },
  { id: 4, name: '小鹿美甲', address: '朝阳区大悦城5层', distance: 2100, rating: 4.6, avatar: '🦌', tag: '手绘美甲' },
  { id: 5, name: 'Miss Nail 美甲沙龙', address: '海淀区中关村创业大厦2层', distance: 3500, rating: 4.5, avatar: '💅', tag: '极简风' },
  { id: 6, name: '蜜糖美甲', address: '西城区西单大悦城3层', distance: 4200, rating: 4.8, avatar: '🍬', tag: '甜美风' },
]

const TAG_FILTERS = [
  { label: '全部', x: 16, w: 58 },
  { label: '日系', x: 82, w: 58 },
  { label: '韩式', x: 148, w: 58 },
  { label: '法式', x: 214, w: 44 },
  { label: '手绘', x: 266, w: 44 },
  { label: '极简', x: 318, w: 44 },
]

function formatDistance(m) {
  if (m < 1000) return `${m}m`
  return `${(m / 1000).toFixed(1)}km`
}

export default function Shops({ onBack, onChat, nailData }) {
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('全部')

  useEffect(() => {
    if (!navigator.geolocation) {
      setShops(MOCK_SHOPS)
      setLoading(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const res = await fetch(
            `https://restapi.amap.com/v3/place/around?key=${AMAP_KEY}&location=${longitude},${latitude}&keywords=美甲&radius=5000&offset=10&output=json`
          )
          const data = await res.json()
          if (data.pois?.length) {
            const mapped = data.pois.map((poi, i) => ({
              id: i, name: poi.name, address: poi.address || poi.pname + poi.cityname,
              distance: parseInt(poi.distance) || 999, rating: parseFloat(poi.biz_ext?.rating) || 4.5,
              avatar: '💅', tag: '美甲店', tel: poi.tel,
            })).sort((a, b) => a.distance - b.distance)
            setShops(mapped)
          } else {
            setShops(MOCK_SHOPS)
          }
        } catch {
          setShops(MOCK_SHOPS)
        }
        setLoading(false)
      },
      () => { setShops(MOCK_SHOPS); setLoading(false) },
      { timeout: 5000 }
    )
  }, [])

  const filteredShops = activeFilter === '全部' ? shops : shops.filter(s => s.tag.includes(activeFilter))

  return (
    <div className="min-h-screen bg-[#FAFAFA] relative overflow-x-hidden flex flex-col items-center" style={{ fontFamily: "-apple-system, 'PingFang SC', sans-serif" }}>
      <div className="w-full max-w-[375px] min-h-screen bg-white relative">

      {/* 顶栏 */}
      <div className="px-[16px] flex items-center h-[44px] gap-[10px] sticky top-0 bg-white z-20">
        <button onClick={onBack}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div className="flex-1 bg-[#303034]/[0.05] rounded-[16px] px-[12px] h-[32px] flex items-center gap-[6px]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
          </svg>
          <span className="text-[#999] text-[13px]">附近美甲店</span>
        </div>
      </div>

      {/* 筛选标签 */}
      <div className="px-[16px] py-[8px] flex gap-[8px] overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {TAG_FILTERS.map((tag) => (
          <button key={tag.label} onClick={() => setActiveFilter(tag.label)}
            className={`h-[28px] rounded-[6px] text-[13px] whitespace-nowrap flex items-center justify-center
              ${activeFilter === tag.label
                ? 'bg-[#FF2442] text-white'
                : 'bg-[#303034]/[0.05] text-[#666]'}`}
            style={{ width: `${tag.w}px`, minWidth: `${tag.w}px` }}>
            {tag.label}
          </button>
        ))}
      </div>

      {/* 商户列表 */}
      <div className="flex flex-col">
        {loading ? (
          <div className="flex justify-center py-20">
            <svg className="animate-spin h-6 w-6 text-[#FF2442]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : filteredShops.map((shop) => (
          <div key={shop.id} className="px-[16px] py-[16px] flex gap-[12px] border-b border-[#f5f5f5]">
            <div className="w-[88px] h-[88px] rounded-[4px] bg-[#f5f5f5] flex items-center justify-center text-[36px] shrink-0">
              {shop.avatar}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between py-[2px]">
              <div className="flex items-center gap-[6px]">
                <span className="text-[#222] text-[16px] font-medium truncate">{shop.name}</span>
                <span className="px-[4px] py-[1px] rounded-[2px] bg-[#FFF0F0] text-[#FF2442] text-[11px] shrink-0">{shop.tag}</span>
              </div>
              <div className="flex items-center gap-[6px]">
                <span className="text-[#FFC107] text-[12px]">★</span>
                <span className="text-[#999] text-[12px]">{shop.rating}</span>
                <span className="text-[#ddd] text-[12px]">·</span>
                <span className="text-[#7C5CFC] text-[12px]">{formatDistance(shop.distance)}</span>
              </div>
              <p className="text-[#999] text-[12px] truncate">{shop.address}</p>
              <div className="flex justify-end">
                <button onClick={() => onChat(shop)}
                  className="px-[12px] h-[20px] rounded-[10px] bg-[#FF2442] text-white text-[12px] font-medium flex items-center">
                  私信
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      </div>
    </div>
  )
}
