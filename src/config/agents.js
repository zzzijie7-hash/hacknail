// Agent 配置：按帖子类别映射对应的 AI Agent 入口
// 新增类别只需在 AGENTS 对象加一条，各页面自动适配

export const AGENTS = {
  nail: {
    label: '智能试戴',
    subLabel: '看中就试',
    icon: '💅',
    page: 'smartwear',
    gradient: 'from-[#FF6B9D] to-[#FF2442]',
    rotation: '-6deg',
    offsetY: '8px',
  },
  rental: {
    label: '看看户型',
    subLabel: '户型一目了然',
    icon: '🏠',
    page: null,         // 功能待实现
    gradient: 'from-[#4ECDC4] to-[#2BAE66]',
    rotation: '2deg',
    offsetY: '0px',
  },
  portrait: {
    label: '试下写真',
    subLabel: '换个风格看看',
    icon: '📷',
    page: null,         // 功能待实现
    gradient: 'from-[#A78BFA] to-[#7C3AED]',
    rotation: '7deg',
    offsetY: '14px',
  },
  pet: {
    label: '同款装扮',
    subLabel: '毛孩子也好看',
    icon: '🐾',
    page: null,         // 功能待实现
    gradient: 'from-[#F59E0B] to-[#EF4444]',
    rotation: '-2deg',
    offsetY: '6px',
  },
}

// 默认 agent（未知类型）
export const DEFAULT_AGENT = { label: '', subLabel: '', icon: '✨', page: null, gradient: 'from-[#aaa] to-[#666]' }

export function getAgent(category) {
  return AGENTS[category] || DEFAULT_AGENT
}
