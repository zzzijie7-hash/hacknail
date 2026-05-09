import { useState } from 'react'
import './index.css'
import Feed from './pages/Feed'
import PostDetail from './pages/PostDetail'
import SmartWear from './pages/SmartWear'
import UploadPage from './pages/Upload'
import BuySimilar from './pages/BuySimilar'
import Mall from './pages/Mall'
import ProductDetail from './pages/ProductDetail'
import Shops from './pages/Shops'
import Chat from './pages/Chat'
import AIChat from './pages/AIChat'
import { apiUrl } from './lib/api'

export default function App() {
  const [page, setPage] = useState('feed')
  const [postData, setPostData] = useState(null)
  const [shopData, setShopData] = useState(null)

  // 共享状态：智能穿戴核心
  const [nailStyle, setNailStyle] = useState(null)
  const [handFile, setHandFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const [feedKey, setFeedKey] = useState(0)
  const [provider, setProvider] = useState('grok')
  const [selectedProduct, setSelectedProduct] = useState(null)

  let currentPage = null

  const resetSmartWearState = () => {
    setNailStyle(null)
    setHandFile(null)
    setResult(null)
    setLoading(false)
    setProgress(0)
  }

  // provider 切换时同步到后端
  const changeProvider = (p) => {
    setProvider(p)
    localStorage.setItem('cybernail_provider', p)
    fetch(apiUrl('/set-provider'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: p }),
    })
  }

  // AI 对话页
  if (page === 'aichat') {
    currentPage = <AIChat
      onBack={() => setPage('feed')}
      onTryOn={() => {
        resetSmartWearState()
        setPage('smartwear')
      }}
    />
  }

  // 小红书首页 → 帖子详情
  if (!currentPage && page === 'post' && postData) {
    currentPage = <PostDetail
      post={postData}
      onBack={() => setPage('feed')}
      onTryOn={(post) => {
        resetSmartWearState()
        setPostData(post)
        setPage('smartwear')
      }}
    />
  }

  // 智能穿戴核心页
  if (!currentPage && page === 'smartwear') {
    currentPage = <SmartWear
      onBack={() => setPage('feed')}
      onBuySimilar={() => setPage('buy-similar')}
      onFindShops={() => setPage('shops')}
      onUpload={() => setPage('upload')}
      initialNails={(postData?.images || []).map(u => u.replace('http://', 'https://'))}
      nailStyle={nailStyle}
      onNailStyleChange={setNailStyle}
      handFile={handFile}
      onHandFileChange={setHandFile}
      result={result}
      onResultChange={setResult}
      loading={loading}
      onLoadingChange={setLoading}
      progress={progress}
      onProgressChange={setProgress}
      provider={provider}
      onProviderChange={changeProvider}
    />
  }

  // 买同款
  if (!currentPage && page === 'buy-similar') {
    currentPage = <BuySimilar
      onBack={() => setPage('smartwear')}
      onMall={(product) => { if (product) setSelectedProduct(product); setPage('mall') }}
      nailStyle={nailStyle}
      result={result}
    />
  }

  // 商城搜索
  if (!currentPage && page === 'mall') {
    currentPage = <Mall
      onBack={() => setPage('buy-similar')}
      onProduct={(p) => { setSelectedProduct(p); setPage('product') }}
      onTryOn={() => setPage('smartwear')}
      nailStyle={nailStyle}
    />
  }

  // 商品详情
  if (!currentPage && page === 'product') {
    currentPage = <ProductDetail
      onBack={() => setPage('mall')}
      product={selectedProduct}
      nailStyle={nailStyle}
    />
  }

  // 附近商家列表
  if (!currentPage && page === 'shops') {
    currentPage = <Shops
      onBack={() => setPage('smartwear')}
      onChat={(shop) => { setShopData(shop); setPage('chat') }}
      nailData={{ result, nail: nailStyle }}
    />
  }

  // 私信商家
  if (!currentPage && page === 'chat' && shopData) {
    currentPage = <Chat
      shop={shopData}
      nailData={{ result, nail: nailStyle }}
      onBack={() => setPage('shops')}
      onSmartWear={() => setPage('smartwear')}
    />
  }

  // 素材上传页
  if (!currentPage && page === 'upload') {
    currentPage = <UploadPage onBack={() => { setPage('feed'); setFeedKey(k => k + 1) }} />
  }

  // 默认：小红书首页
  if (!currentPage) {
    currentPage = <Feed
      key={feedKey}
      onPost={(post) => { setPostData(post); setPage('post') }}
      onAIChat={() => setPage('aichat')}
    />
  }

  return (
    <div style={{
      width: 375,
      minWidth: 375,
      maxWidth: 375,
      height: 812,
      background: '#000',
      overflow: 'hidden',
      position: 'relative',
      borderRadius: 36,
      border: '1px solid rgba(255,255,255,0.95)',
      boxShadow: '0 18px 48px rgba(0,0,0,0.28)',
    }}>
      {currentPage}
    </div>
  )
}
