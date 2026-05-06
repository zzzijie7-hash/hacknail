import { useState } from 'react'
import PageLayout from '../components/PageLayout'
import products from '../data/products'

export default function ProductDetail({ onBack, product, nailStyle }) {
  const [selectedSpec, setSelectedSpec] = useState(0)
  const specs = ['奶咖色', '裸粉色', '豆沙色', '蜜桃色']

  const p = product || products[0]
  const similar = products.filter(x => x.id !== p.id).slice(0, 6)

  return (
    <PageLayout bg="rgb(245,245,245)" innerBg="rgb(245,245,245)">
      {/* 主图 */}
      <div className="relative">
        <img src={p.image} alt={p.title} className="w-full" style={{ aspectRatio: '1/1', objectFit: 'cover' }} />

        {/* 悬浮导航 */}
        <button onClick={onBack}
          className="absolute top-[max(12px,env(safe-area-inset-top))] left-[12px] w-[32px] h-[32px] rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <button className="absolute top-[max(12px,env(safe-area-inset-top))] right-[12px] w-[32px] h-[32px] rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
          </svg>
        </button>
      </div>

      {/* 价格 & 标题 */}
      <div className="bg-white mx-[12px] mt-[-12px] relative z-10 rounded-t-[12px] px-[16px] pt-[16px]">
        <div className="flex items-baseline gap-[4px]">
          <span className="text-[#FF2442] text-[28px] font-bold">¥{p.price}</span>
          <span className="text-[rgba(0,0,0,0.2)] text-[13px] line-through">¥{p.originalPrice}</span>
          {p.tags?.map((t, i) => (
            <span key={i} className="text-[#FF2442] text-[10px] px-[6px] py-[1px] rounded-[3px] bg-[#FF2442]/5 border border-[#FF2442]/10 ml-[4px]">{t}</span>
          ))}
        </div>
        <h1 className="text-[rgba(0,0,0,0.85)] text-[15px] font-semibold leading-[20px] mt-[8px]">{p.title}</h1>
      </div>

      {/* 款式选择 */}
      <div className="bg-white mx-[12px] px-[16px] pt-[12px] pb-[12px]">
        <p className="text-[rgba(0,0,0,0.4)] text-[12px] mb-[8px]">款式</p>
        <div className="flex gap-[8px] flex-wrap">
          {specs.map((s, i) => (
            <button
              key={i}
              onClick={() => setSelectedSpec(i)}
              className={`w-[36px] h-[36px] rounded-[8px] border transition-all
                ${i === selectedSpec
                  ? 'border-[#FF2442] ring-[1px] ring-[#FF2442]/30'
                  : 'border-[#ddd]'}`}
            >
              <div className="w-full h-full rounded-[6px] bg-gradient-to-br from-pink-100 to-rose-200" />
            </button>
          ))}
        </div>
      </div>

      {/* 发货 & 规格 */}
      <div className="bg-white mx-[12px] mt-[4px] rounded-[8px] px-[16px] py-[12px] flex flex-col gap-[8px]">
        <div className="flex items-center text-[12px]">
          <span className="text-[rgba(0,0,0,0.4)] w-[56px] shrink-0">发货</span>
          <span className="text-[rgba(0,0,0,0.7)]">{p.shipping}</span>
        </div>
        <div className="flex items-center text-[12px]">
          <span className="text-[rgba(0,0,0,0.4)] w-[56px] shrink-0">规格</span>
          <span className="text-[rgba(0,0,0,0.7)]">{p.specs}</span>
        </div>
        <div className="flex items-center text-[12px]">
          <span className="text-[rgba(0,0,0,0.4)] w-[56px] shrink-0">保障</span>
          <span className="text-[#34c759]">7天无理由 · 运费险</span>
        </div>
      </div>

      {/* 店铺 */}
      <div className="bg-white mx-[12px] mt-[4px] rounded-[8px] px-[16px] py-[12px] flex items-center gap-[10px]">
        <div className="w-[40px] h-[40px] rounded-full bg-gradient-to-br from-red-300 to-red-500 flex items-center justify-center">
          <span className="text-white text-[16px] font-bold">指</span>
        </div>
        <div className="flex-1">
          <p className="text-[rgba(0,0,0,0.8)] text-[14px] font-medium">{p.shopName}</p>
          <p className="text-[rgba(0,0,0,0.3)] text-[11px]">销量 {p.sales}+ | 评分 4.8</p>
        </div>
        <button className="px-[12px] py-[6px] rounded-[16px] border border-[#FF2442] text-[#FF2442] text-[11px] active:scale-95 transition-transform">进店</button>
      </div>

      {/* 穿搭精选 / 种草笔记 */}
      <div className="bg-white mx-[12px] mt-[4px] rounded-[8px] px-[16px] py-[12px]">
        <p className="text-[rgba(0,0,0,0.8)] text-[14px] font-semibold mb-[8px]">穿搭精选</p>
        <div className="flex gap-[8px] overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="shrink-0 w-[120px]">
              <div className="w-[120px] h-[160px] rounded-[8px] bg-[#f5f5f5] overflow-hidden">
                <img src={`https://picsum.photos/seed/look${i}/240/320`} alt="look" className="w-full h-full object-cover" />
              </div>
              <p className="text-[rgba(0,0,0,0.6)] text-[11px] mt-[4px] line-clamp-2">超显白的穿戴甲搭配分享~</p>
              <div className="flex items-center gap-[4px] mt-[2px]">
                <div className="w-[16px] h-[16px] rounded-full bg-pink-200" />
                <span className="text-[rgba(0,0,0,0.3)] text-[10px]">小红薯种草机</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 评价 */}
      <div className="bg-white mx-[12px] mt-[4px] rounded-[8px] px-[16px] py-[12px]">
        <p className="text-[rgba(0,0,0,0.8)] text-[14px] font-semibold mb-[8px]">商品评价 (999+)</p>
        {[1, 2].map(i => (
          <div key={i} className="py-[8px] border-b border-[#f5f5f5] last:border-0">
            <div className="flex items-center gap-[6px]">
              <div className="w-[24px] h-[24px] rounded-full bg-pink-100" />
              <span className="text-[rgba(0,0,0,0.7)] text-[12px]">小***花</span>
              <div className="flex text-[#FF2442] text-[10px]">{'★'.repeat(5)}</div>
            </div>
            <p className="text-[rgba(0,0,0,0.6)] text-[12px] mt-[4px]">质量超级好！上手效果和图片一模一样，闺蜜都问我要链接~</p>
          </div>
        ))}
        <button className="w-full text-center text-[rgba(0,0,0,0.35)] text-[12px] py-[8px]">查看全部评价</button>
      </div>

      {/* 相似款式 */}
      <div className="mx-[12px] mt-[4px] rounded-[8px] px-[16px] py-[12px] mb-[80px]">
        <p className="text-[rgba(0,0,0,0.8)] text-[14px] font-semibold mb-[8px]">相似款式</p>
        <div className="grid grid-cols-3 gap-[8px]">
          {similar.map(s => (
            <button key={s.id} className="text-left active:scale-[0.98] transition-transform">
              <div className="rounded-[8px] overflow-hidden bg-[#f5f5f5]" style={{ aspectRatio: '1/1' }}>
                <img src={s.image} alt={s.title} className="w-full h-full object-cover" />
              </div>
              <p className="text-[rgba(0,0,0,0.6)] text-[10px] mt-[4px] line-clamp-2">{s.title}</p>
              <span className="text-[#FF2442] text-[13px] font-bold">¥{s.price}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 固定底栏 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[393px] bg-white border-t border-[#eee] flex items-center gap-[12px] px-[16px] py-[8px]" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
        <button className="flex flex-col items-center gap-[2px] active:scale-90 transition-transform">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" strokeLinecap="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </svg>
          <span className="text-[10px] text-[rgba(0,0,0,0.4)]">店铺</span>
        </button>
        <button className="flex flex-col items-center gap-[2px] active:scale-90 transition-transform">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" strokeLinecap="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span className="text-[10px] text-[rgba(0,0,0,0.4)]">客服</span>
        </button>
        <button className="flex flex-col items-center gap-[2px] active:scale-90 transition-transform">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          <span className="text-[10px] text-[rgba(0,0,0,0.4)]">购物车</span>
        </button>
        <button className="flex-1 py-[10px] rounded-[20px] bg-[#FF6B35] text-white text-[13px] font-medium active:scale-[0.98] transition-transform">加入购物车</button>
        <button className="flex-1 py-[10px] rounded-[20px] bg-[#FF2442] text-white text-[13px] font-medium active:scale-[0.98] transition-transform">立即购买</button>
      </div>
    </PageLayout>
  )
}
