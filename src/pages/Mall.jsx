import { useState } from 'react'
import PageLayout from '../components/PageLayout'
import products, { productTabs } from '../data/products'

export default function Mall({ onBack, onProduct, onTryOn, nailStyle }) {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const filtered = products.filter(p => {
    if (search && !p.title.includes(search)) return false
    if (activeTab === 'all') return true
    if (activeTab === 'hot' && p.sales && parseInt(p.sales) > 15000) return true
    if (activeTab === 'new' && p.tags?.includes('新品')) return true
    if (activeTab === 'limited' && p.tags?.includes('限时购')) return true
    if (activeTab === 'premium' && p.tags?.includes('高定')) return true
    return false
  })

  return (
    <PageLayout bg="rgb(250,250,250)" innerBg="rgb(250,250,250)">
      {/* 搜索栏 */}
      <div className="px-[16px] pt-[12px] pb-[8px] flex items-center gap-[10px]">
        <button onClick={onBack} className="shrink-0 active:scale-90 transition-transform">
          <img src="/icons/back.svg" width={24} height={24} alt="back" />
        </button>
        <div className="flex-1 relative">
          <svg className="absolute left-[12px] top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索穿戴甲"
            className="w-full bg-white rounded-[20px] pl-[36px] pr-[16px] py-[8px] text-[13px] text-[rgba(0,0,0,0.8)] placeholder-[rgba(0,0,0,0.2)] outline-none border border-[#eee]"
          />
        </div>
        {/* 我的试戴入口 */}
        {nailStyle && (
          <button
            onClick={onTryOn}
            className="shrink-0 w-[32px] h-[32px] rounded-full bg-white border border-[#eee] flex items-center justify-center active:scale-90 transition-transform overflow-hidden"
          >
            <img src={nailStyle.src} alt="tryon" className="w-full h-full object-cover" />
          </button>
        )}
      </div>

      {/* Tab 标签 */}
      <div className="px-[16px] pb-[8px] flex gap-[8px] overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {productTabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`shrink-0 px-[14px] py-[6px] rounded-[20px] text-[12px] transition-all
              ${activeTab === t.id
                ? 'bg-[#FF2442] text-white font-medium'
                : 'bg-white text-[rgba(0,0,0,0.5)] border border-[#eee]'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 双列瀑布流 */}
      <div className="flex-1 px-[10px] pb-[80px]">
        <div className="columns-2 gap-[8px]">
          {filtered.map(p => (
            <button
              key={p.id}
              onClick={() => onProduct?.(p)}
              className="mb-[8px] break-inside-avoid bg-white rounded-[4px] overflow-hidden text-left w-full active:scale-[0.98] transition-transform"
            >
              <div style={{ aspectRatio: '1/1' }}>
                <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-[8px]">
                <p className="text-[rgba(0,0,0,0.8)] text-[12px] leading-[16px] line-clamp-2">{p.title}</p>
                <div className="flex items-center gap-[6px] mt-[4px]">
                  {p.tags?.map((tag, i) => (
                    <span key={i} className="text-[#FF2442] text-[10px] px-[4px] py-[1px] rounded-[2px] bg-[#FF2442]/5 border border-[#FF2442]/10">{tag}</span>
                  ))}
                </div>
                <div className="flex items-baseline gap-[4px] mt-[4px]">
                  <span className="text-[#FF2442] text-[16px] font-bold">¥{p.price}</span>
                  <span className="text-[rgba(0,0,0,0.2)] text-[11px] line-through">¥{p.originalPrice}</span>
                  <span className="text-[rgba(0,0,0,0.3)] text-[10px] ml-auto">{p.sales}+已售</span>
                </div>
                <p className="text-[rgba(0,0,0,0.3)] text-[10px] mt-[2px]">{p.shopName}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 悬浮按钮 */}
      <div className="fixed bottom-[30px] right-[calc(50%-196px+16px)] z-30 flex flex-col gap-[8px]">
        <button className="w-[44px] h-[44px] rounded-full bg-white shadow-lg border border-[#eee] flex items-center justify-center active:scale-90 transition-transform">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>
    </PageLayout>
  )
}
