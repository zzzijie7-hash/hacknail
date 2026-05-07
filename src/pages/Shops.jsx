import { useState, useEffect } from 'react'
import { Colors, Type, Spacing, Radius } from '../config/design'

const AMAP_KEY = '32c8cd01f088610e8ab03274c0678c56'

const MOCK_SHOPS = [
  { id: 1, name: '梅匠美甲小店(SOHO复兴广场D座)', district: '黄浦区', category: '日式美甲', avgPrice: '¥132/人', notesCount: '1465篇笔记', distance: 350, rating: 9.2, avatar: '💅', features: ['免费停车', '宠物友好'], review: '今天去这里过生日，居然有蛋糕寿司' },
  { id: 2, name: 'Meraki198麻吉', district: '徐汇区', category: '创意菜', avgPrice: '¥196/人', notesCount: '2212篇笔记', distance: 580, rating: 9.1, avatar: '🍽️', features: ['免费停车', '年轻人爱去'], review: '这家店过生日或者朋友小聚下非常适合' },
  { id: 3, name: '一尺花园(安和花园店)', district: '长宁区', category: '咖啡店', avgPrice: '¥272/人', notesCount: '1135篇笔记', distance: 1200, rating: 9.0, avatar: '☕', features: [], review: '每家都是不同主题的花园，氛围感绝佳' },
  { id: 4, name: 'ME&JOE(鲁班店)', district: '黄浦区', category: '小吃快餐', avgPrice: '¥80/人', notesCount: '135篇笔记', distance: 2100, rating: 8.8, avatar: '🍔', features: [], review: '地方很大干净，宠物友好' },
  { id: 5, name: 'Nail Art Studio 韩式美甲', district: '静安区', category: '韩式美甲', avgPrice: '¥168/人', notesCount: '890篇笔记', distance: 3500, rating: 9.3, avatar: '✨', features: ['ins风', '可约拍'], review: '小姐姐很温柔，做的超细致' },
  { id: 6, name: '蜜糖美甲·Sugar Nail', district: '浦东新区', category: '甜美风', avgPrice: '¥108/人', notesCount: '672篇笔记', distance: 4200, rating: 9.0, avatar: '🍬', features: ['学生折扣'], review: '超可爱！下次还来' },
]

const FILTER_TAGS = [
  { label: '全城', hasArrow: true },
  { label: '分类', hasArrow: true },
  { label: '生日餐' },
  { label: '烛光' },
  { label: '菜单' },
  { label: '约会' },
  { label: '氛围感' },
  { label: '性价比' },
]

const LOCATION_TAGS = [
  { label: '全部', x: 16 },
  { label: '日系', x: 82 },
  { label: '韩式', x: 148 },
  { label: '法式', x: 214 },
  { label: '手绘', x: 266 },
  { label: '极简', x: 318 },
]

function fmtDistance(m) {
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
              id: i, name: poi.name,
              district: poi.adname || '',
              category: poi.type?.split(';').pop() || '美甲店',
              distance: parseInt(poi.distance) || 999,
              rating: parseFloat(poi.biz_ext?.rating) || 4.5,
              avatar: '💅',
              notesCount: '',
              avgPrice: '',
              features: [],
              review: poi.address || '',
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

  const filteredShops = activeFilter === '全部'
    ? shops
    : shops.filter(s => s.category?.includes(activeFilter))

  return (
    <div className="min-h-screen flex flex-col items-center"
      style={{ fontFamily: "'PingFang SC', -apple-system, 'SF Pro', sans-serif", background: '#fff' }}>

      <div className="w-full bg-white" style={{ maxWidth: 375 }}>

        {/* ── 顶栏: back + 搜索框 ── */}
        <div className="flex items-center h-[44px] px-[16px] gap-[10px] sticky top-0 bg-white z-20">
          <button onClick={onBack} className="shrink-0 flex items-center justify-center w-[22px] h-[22px]">
            <img src="/icons/back.svg" width={22} height={22} alt="back" />
          </button>
          <div className="flex-1 bg-[rgba(48,48,52,0.05)] rounded-[16px] h-[32px] flex items-center px-[12px]" style={{ gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
            </svg>
            <span className="text-[#999] text-[13px]">上海美甲</span>
          </div>
        </div>

        {/* ── 筛选 Tab: 全城/分类 + 标签 ── */}
        <div className="flex items-center h-[44px] px-[16px] bg-white border-b border-[#F5F5F5]" style={{ gap: 8 }}>
          <div className="flex gap-[8px] overflow-x-auto flex-1" style={{ scrollbarWidth: 'none' }}>
            {FILTER_TAGS.map((tag) => {
              const isDropdown = tag.hasArrow
              const isActiveDropdown = isDropdown
              return (
                <button key={tag.label}
                  className={`h-[28px] rounded-[6px] text-[12px] flex items-center justify-center shrink-0
                    ${isActiveDropdown
                      ? 'bg-[rgba(48,48,52,0.07)] text-[#333] font-medium'
                      : 'bg-[rgba(48,48,52,0.05)] text-[#666]'}`}
                  style={{
                    padding: isDropdown ? '0 8px 0 10px' : '0 10px',
                    gap: isDropdown ? 2 : 0,
                  }}>
                  <span>{tag.label}</span>
                  {isDropdown && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
          {/* 地图入口 */}
          <button className="shrink-0 flex items-center text-[#666] text-[12px] gap-[2px] ml-[8px]">
            <span>地图</span>
          </button>
        </div>

        {/* ── 二级分类标签 ── */}
        <div className="flex gap-[8px] px-[16px] py-[8px] overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {LOCATION_TAGS.map((tag) => (
            <button key={tag.label} onClick={() => setActiveFilter(tag.label)}
              className="h-[28px] rounded-[6px] text-[13px] flex items-center justify-center shrink-0"
              style={{
                width: tag.w || 58,
                background: activeFilter === tag.label ? '#FF2442' : 'rgba(48,48,52,0.05)',
                color: activeFilter === tag.label ? '#fff' : '#666',
              }}>
              {tag.label}
            </button>
          ))}
        </div>

        {/* ── 商户列表 ── */}
        <div className="flex flex-col" style={{ paddingBottom: 40 }}>
          {loading ? (
            <div className="flex justify-center py-20">
              <svg className="animate-spin h-6 w-6 text-[#FF2442]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          ) : filteredShops.map((shop) => (
            <div key={shop.id} className="flex px-[16px] py-[16px] gap-[10px] border-b border-[#F5F5F5] active:bg-[#FAFAFA]">
              {/* 缩略图 */}
              <div className="rounded-[4px] bg-[#f5f5f5] flex items-center justify-center text-[36px] shrink-0"
                style={{ width: 88, height: 88 }}>
                {shop.avatar}
              </div>

              {/* 信息区 */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                {/* 店名 */}
                <p className="text-[#222] text-[14px] font-medium truncate leading-[14px]"
                  style={{ fontSize: Type.cardTitle.size, fontWeight: Type.cardTitle.weight, lineHeight: `${Type.cardTitle.lh}px` }}>
                  {shop.name}
                </p>

                {/* 评分 + 区 + 品类 + 人均 */}
                <div className="flex items-center gap-[4px] flex-wrap">
                  {shop.rating && (
                    <>
                      <span className="flex items-center gap-[1px]">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="#FF2442">
                          <path d="M7 0l1.6 4.9h5.1l-4.1 3 1.6 4.9L7 9.8l-4.1 3 1.6-4.9-4.1-3h5.1z"/>
                        </svg>
                        <span className="text-[#FF2442] font-medium" style={{ fontSize: Type.small.size, fontWeight: Type.small.weight, fontFamily: "'RED Number', 'PingFang SC', sans-serif" }}>
                          {shop.rating}
                        </span>
                      </span>
                      <span className="text-[#ccc]">|</span>
                    </>
                  )}
                  <span className="text-[#999]" style={{ fontSize: Type.small.size, lineHeight: '18px' }}>{shop.district}</span>
                  {shop.category && (
                    <>
                      <span className="text-[#ccc]">|</span>
                      <span className="text-[#999]" style={{ fontSize: Type.small.size, lineHeight: '18px' }}>{shop.category}</span>
                    </>
                  )}
                  {shop.avgPrice && (
                    <>
                      <span className="text-[#ccc]">|</span>
                      <span className="text-[#999]" style={{ fontSize: Type.small.size, lineHeight: '18px' }}>{shop.avgPrice}</span>
                    </>
                  )}
                </div>

                {/* 笔记数 + 特色 + 距离 */}
                <div className="flex items-center gap-[4px] text-[#999]" style={{ fontSize: Type.small.size, lineHeight: '18px' }}>
                  {shop.notesCount && <span>{shop.notesCount}</span>}
                  {shop.features?.map(f => (
                    <span key={f} className="text-[#999]">| {f}</span>
                  ))}
                  {shop.distance && (
                    <>
                      <span className="text-[#ccc]">|</span>
                      <span>{fmtDistance(shop.distance)}</span>
                    </>
                  )}
                </div>

                {/* 用户评价条 */}
                {shop.review && (
                  <div className="flex items-center gap-[4px] rounded-[4px]"
                    style={{
                      background: 'rgba(48,48,52,0.05)',
                      height: 20, padding: '1px 6px',
                    }}>
                    <div className="w-[16px] h-[16px] rounded-full bg-[#ccc] shrink-0" />
                    <span className="text-[#666] truncate" style={{ fontSize: Type.small.size, lineHeight: '18px' }}>
                      "{shop.review}"
                    </span>
                  </div>
                )}
              </div>

              {/* 消息图标 */}
              <button onClick={() => onChat(shop)}
                className="shrink-0 self-center active:scale-90 transition-transform"
                style={{ width: 20, height: 20 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
