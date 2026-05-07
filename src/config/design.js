// 设计规范 — 从 Figma 提取，作为全局组件库依据
// 基准宽度 375px，针对移动端

export const Colors = {
  // 主题
  primary: '#FF2442',
  primaryLight: '#FFF0F0',

  // 背景
  pageBg: '#FAFAFA',
  cardBg: '#FFFFFF',
  inputBg: '#F5F5F5',

  // 文字
  textPrimary: 'rgba(0,0,0,0.8)',
  textSecondary: 'rgba(0,0,0,0.45)',
  textHint: '#999',

  // 语义
  link: '#576B95',
  tag: '#133667',
  sendBlue: '#2781FF',
  recommendGreen: '#42C9A0',
  online: '#30DA6A',

  // 分割 / overlay
  divider: '#F5F5F5',
  overlay: 'rgba(48,48,52,0.5)',
  overlayTag: 'rgba(48,48,52,0.7)',
}

// 各层级字体规范
export const Type = {
  pageTitle:     { size: 17.6, weight: 500, lh: 24 },
  postTitle:     { size: 17.2, weight: 600, lh: 24.8 },
  headline:      { size: 22.9, weight: 600, lh: 30.5 },  // 点点的 Hi
  tab:           { size: 16,   weight: 500, lh: 24 },
  tabInactive:   { size: 16,   weight: 400, lh: 24 },
  body:          { size: 15.3, weight: 400, lh: 24.8 },
  bodyBold:      { size: 15.3, weight: 500, lh: 24.8 },
  subBody:       { size: 14.3, weight: 400, lh: 22.9 },
  subBodyBold:   { size: 14.3, weight: 500, lh: 22.9 },
  cardTitle:     { size: 14,   weight: 500, lh: 20 },
  chip:          { size: 12.4, weight: 500, lh: 19.1 },
  chipInactive:  { size: 12.4, weight: 400, lh: 19.1 },
  small:         { size: 12,   weight: 400, lh: 17.2 },
  caption:       { size: 11.5, weight: 400, lh: 15.3 },
  nickname:      { size: 11,   weight: 400, lh: 15 },
  overlayTag:    { size: 10,   weight: 500, lh: 14 },
  disclaimer:    { size: 9.5,  weight: 400, lh: 13.4 },
}

// 间距体系 (px)
export const Spacing = {
  xs:   4,
  sm:   5,
  md:   8,
  lg:  10,
  xl:  12,
  xxl: 14,
  pageX: 16,
}

export const Radius = {
  sm:   4,
  md:   8,
  lg:  11,
  pill: 17,
  full: 9999,
}

export const Icon = {
  sm: 16,
  md: 22,
  lg: 28,
}
