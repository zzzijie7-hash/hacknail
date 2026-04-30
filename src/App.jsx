import { useState } from 'react'
import './index.css'
import Feed from './pages/Feed'
import PostDetail from './pages/PostDetail'
import Home from './pages/Home'
import Shops from './pages/Shops'
import Chat from './pages/Chat'

export default function App() {
  const [page, setPage] = useState('feed')
  const [postData, setPostData] = useState(null)
  const [shopData, setShopData] = useState(null)
  const [nailData, setNailData] = useState(null)

  // 小红书首页 → 帖子详情
  if (page === 'post' && postData) {
    return <PostDetail
      post={postData}
      onBack={() => setPage('feed')}
      onTryOn={(post) => {
        // 把帖子的图片自动加入美甲库
        setPostData(post)
        setPage('agent')
      }}
    />
  }

  // Agent 页
  if (page === 'agent') {
    return <Home
      onNavigate={(target, data) => {
        setNailData(data)
        setPage(target)
      }}
      initialNails={(postData?.images || []).map(u => u.replace('http://', 'https://'))}
    />
  }

  // 商户列表
  if (page === 'shops') {
    return <Shops
      onBack={() => setPage('agent')}
      onChat={(shop) => { setShopData(shop); setPage('chat') }}
      nailData={nailData}
    />
  }

  // 私信
  if (page === 'chat' && shopData) {
    return <Chat
      shop={shopData}
      nailData={nailData}
      onBack={() => setPage('shops')}
    />
  }

  // 默认：小红书首页
  return <Feed onPost={(post) => { setPostData(post); setPage('post') }} />
}
