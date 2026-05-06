const products = [
  { id: 1, title: '法式裸色穿戴甲 温柔气质显白', price: 39.9, originalPrice: 89, image: 'https://picsum.photos/seed/nail1/400/400', tags: ['限时购'], shopName: '指尖魔法小店', sales: '2.3万', specs: '24片/盒', shipping: '48h发货' },
  { id: 2, title: '猫眼渐变甲片 夏日冰透感', price: 45, originalPrice: 99, image: 'https://picsum.photos/seed/nail2/400/400', tags: ['热卖'], shopName: 'Nail Art Studio', sales: '1.8万', specs: '24片/盒', shipping: '24h发货' },
  { id: 3, title: '玫瑰金闪粉美甲 宴会必备', price: 52, originalPrice: 118, image: 'https://picsum.photos/seed/nail3/400/400', tags: ['新品'], shopName: '璀璨美甲坊', sales: '8900', specs: '20片/盒', shipping: '48h发货' },
  { id: 4, title: '日系简约线条甲 职场百搭', price: 35, originalPrice: 78, image: 'https://picsum.photos/seed/nail4/400/400', tags: ['限时购'], shopName: '日系美甲馆', sales: '3.1万', specs: '24片/盒', shipping: '当日发' },
  { id: 5, title: '3D立体花朵美甲 仙女风', price: 68, originalPrice: 158, image: 'https://picsum.photos/seed/nail5/400/400', tags: ['高定'], shopName: '花漾指尖', sales: '5600', specs: '20片/盒', shipping: '72h定制' },
  { id: 6, title: '雾霾蓝磨砂甲 高级感拉满', price: 42, originalPrice: 95, image: 'https://picsum.photos/seed/nail6/400/400', tags: ['热卖'], shopName: 'ColorNail', sales: '1.5万', specs: '24片/盒', shipping: '24h发货' },
  { id: 7, title: '珍珠白贝母甲片 轻奢气质', price: 55, originalPrice: 128, image: 'https://picsum.photos/seed/nail7/400/400', tags: ['新品'], shopName: '珍珠美甲', sales: '7200', specs: '20片/盒', shipping: '48h发货' },
  { id: 8, title: '格子纹学院风美甲 复古甜酷', price: 38, originalPrice: 82, image: 'https://picsum.photos/seed/nail8/400/400', tags: ['学生党'], shopName: '甜酷女孩', sales: '2.6万', specs: '24片/盒', shipping: '24h发货' },
  { id: 9, title: '极光镭射甲 蹦迪闪光灯杀手', price: 48, originalPrice: 108, image: 'https://picsum.photos/seed/nail9/400/400', tags: ['爆款'], shopName: '极光美甲店', sales: '4.2万', specs: '24片/盒', shipping: '当日发' },
  { id: 10, title: '奶咖色渐变甲 秋冬温暖感', price: 36, originalPrice: 76, image: 'https://picsum.photos/seed/nail10/400/400', tags: ['限时购'], shopName: '暖调美甲', sales: '1.2万', specs: '24片/盒', shipping: '48h发货' },
  { id: 11, title: '黑色蕾丝镂空甲 暗黑公主风', price: 58, originalPrice: 138, image: 'https://picsum.photos/seed/nail11/400/400', tags: ['暗黑风'], shopName: '暗黑美学', sales: '9800', specs: '20片/盒', shipping: '24h发货' },
  { id: 12, title: '果冻透明甲 夏日多巴胺', price: 33, originalPrice: 72, image: 'https://picsum.photos/seed/nail12/400/400', tags: ['多巴胺'], shopName: '果冻美甲屋', sales: '5.3万', specs: '24片/盒', shipping: '当日发' },
  { id: 13, title: '金箔大理石纹甲 贵气名媛', price: 62, originalPrice: 148, image: 'https://picsum.photos/seed/nail13/400/400', tags: ['名媛风'], shopName: '名媛指尖', sales: '6400', specs: '20片/盒', shipping: '48h发货' },
  { id: 14, title: '荧光色撞色甲 街头潮人必备', price: 40, originalPrice: 86, image: 'https://picsum.photos/seed/nail14/400/400', tags: ['潮人'], shopName: '潮甲社', sales: '1.7万', specs: '24片/盒', shipping: '24h发货' },
  { id: 15, title: '蝴蝶结立体甲 甜美约会款', price: 49, originalPrice: 112, image: 'https://picsum.photos/seed/nail15/400/400', tags: ['约会款'], shopName: '甜蜜指尖', sales: '2.9万', specs: '24片/盒', shipping: '当日发' },
  { id: 16, title: '墨绿色丝绒甲 复古港风', price: 44, originalPrice: 98, image: 'https://picsum.photos/seed/nail16/400/400', tags: ['港风'], shopName: '复古美甲馆', sales: '1.1万', specs: '24片/盒', shipping: '48h发货' },
  { id: 17, title: '渐变星空甲 梦幻紫蓝色', price: 54, originalPrice: 122, image: 'https://picsum.photos/seed/nail17/400/400', tags: ['梦幻'], shopName: '星空美甲', sales: '3.4万', specs: '20片/盒', shipping: '24h发货' },
  { id: 18, title: '纯色哑光甲 极简冷淡风', price: 29, originalPrice: 65, image: 'https://picsum.photos/seed/nail18/400/400', tags: ['极简'], shopName: '简约指艺', sales: '6.1万', specs: '24片/盒', shipping: '当日发' },
  { id: 19, title: '碎花田园风甲 春日限定', price: 46, originalPrice: 105, image: 'https://picsum.photos/seed/nail19/400/400', tags: ['春季'], shopName: '田园美甲小铺', sales: '1.9万', specs: '24片/盒', shipping: '48h发货' },
  { id: 20, title: '水钻方头甲 气场全开女王范', price: 72, originalPrice: 168, image: 'https://picsum.photos/seed/nail20/400/400', tags: ['女王范'], shopName: '钻石指尖', sales: '7800', specs: '20片/盒', shipping: '72h定制' },
]

export const productTabs = [
  { id: 'all', label: '全部' },
  { id: 'hot', label: '热卖' },
  { id: 'new', label: '新品' },
  { id: 'limited', label: '限时购' },
  { id: 'premium', label: '高定' },
]

export default products
