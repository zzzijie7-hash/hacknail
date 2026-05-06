import { useState } from 'react'
import PageLayout from '../components/PageLayout'
import NavBar from '../components/NavBar'
import BottomPanel from '../components/BottomPanel'
import products from '../data/products'

export default function BuySimilar({ onBack, onMall, nailStyle, result }) {
  const [activeTab, setActiveTab] = useState('history')
  const [shopOpen, setShopOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  const tabs = [
    { id: 'original', label: '原帖' },
    { id: 'history', label: '近期浏览、收藏' },
  ]

  // 模拟推荐同款
  const similarProducts = products.slice(0, 8)

  return (
    <PageLayout>
      <NavBar title="智能穿戴" onBack={onBack} />

      {/* Tabs */}
      <div className="flex gap-[20px] px-[16px] pt-[12px] pb-[8px]">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`text-[14px] font-medium pb-[6px] transition-colors
              ${activeTab === t.id
                ? 'text-[rgba(0,0,0,0.8)] border-b-[2px] border-[#FF2442]'
                : 'text-[rgba(0,0,0,0.35)]'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 款式缩略图 */}
      {activeTab === 'original' && nailStyle && (
        <div className="px-[16px]">
          <div className="flex gap-[10px]">
            <div className="w-[95px] h-[95px] rounded-[12px] overflow-hidden">
              <img src={nailStyle.src} alt="style" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      )}
      {activeTab === 'history' && (
        <div className="px-[16px]">
          <div className="flex gap-[10px] flex-wrap">
            {[nailStyle, ...Array(3)].filter(Boolean).slice(0, 4).map((item, i) => (
              <div key={i} className="w-[95px] h-[95px] rounded-[12px] overflow-hidden bg-[#f5f5f5]">
                {item?.src && <img src={item.src} alt="style" className="w-full h-full object-cover" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 手部效果预览 */}
      <div className="flex-1 px-[16px] py-[16px] flex items-center justify-center">
        <div className="w-full rounded-[15px] overflow-hidden bg-[#f5f5f5]" style={{ aspectRatio: '334/399' }}>
          {result ? (
            <img src={result} alt="result" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[rgba(0,0,0,0.2)] text-[13px]">
              暂无效果图
            </div>
          )}
        </div>
      </div>

      {/* 买同款入口 */}
      <div className="px-[16px] pb-[max(20px,env(safe-area-inset-bottom))]">
        <button
          onClick={() => setShopOpen(true)}
          className="w-full py-[14px] rounded-[12px] bg-[#FF2442] text-white font-semibold text-[15px] active:scale-[0.98] transition-transform"
        >
          买同款穿戴甲
        </button>
      </div>

      {/* 同款面板 */}
      <BottomPanel
        open={shopOpen}
        onClose={() => setShopOpen(false)}
        title="同款穿戴甲片"
        subtitle="来自小红书商城"
      >
        <div className="px-[12px]">
          <div className="grid grid-cols-2 gap-[8px]">
            {similarProducts.map(p => (
              <button
                key={p.id}
                onClick={() => { setShopOpen(false); onMall?.(p) }}
                className="bg-white/10 rounded-[12px] overflow-hidden text-left active:scale-[0.98] transition-transform"
              >
                <div style={{ aspectRatio: '1/1' }}>
                  <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-[8px]">
                  <p className="text-white text-[12px] leading-[16px] line-clamp-2">{p.title}</p>
                  <div className="flex items-baseline gap-[4px] mt-[4px]">
                    <span className="text-[#FF2442] text-[16px] font-bold">¥{p.price}</span>
                    <span className="text-white/40 text-[11px] line-through">¥{p.originalPrice}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </BottomPanel>
    </PageLayout>
  )
}
