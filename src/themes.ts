/**
 * 配色主题注册表。
 *
 * 配色取自 Minecraft 经典书架（为附魔台提供加成的那个）。
 * 锚点色 `#8F7748` 是 Wiki 记载的书架地图基色——纹理整体平均色，
 * 其余 token 围绕它构建：浅色模式下以此为 primary，深色模式下提亮一级。
 */
export interface ThemeColors {
  [key: string]: string
}

export interface ThemeDefinition {
  id: string
  name: string
  description: string
  light: ThemeColors
  dark: ThemeColors
}

export const themes: ThemeDefinition[] = [
  {
    id: 'bookshelf',
    name: '橡木书架',
    description: 'Minecraft 经典书架配色',

    /* ────── 浅色：羊皮纸底 + 书架原色 primary + 书脊彩色点缀 ────── */
    light: {
      /* 品牌色 */
      primary: '#8F7748',          // 书架地图基色（Wiki） — 主按钮 / AppBar / 焦点
      secondary: '#6B4E30',        // 深色橡木 — 次要元素
      accent: '#B84A3A',           // 书脊红 — CTA 高亮
      error: '#C0392B',            // 错误红
      info: '#5B7A8A',             // 书脊蓝
      success: '#5B7F4A',          // 书脊绿
      warning: '#B8953A',          // 金色铭文 — 告警

      /* 表面 */
      background: '#FAF4EA',       // 羊皮纸底（略暖于纯白）
      surface: '#FFFCF7',          // 卡片 / 对话泡

      /* On colors */
      'on-primary': '#FFFFFF',
      'on-secondary': '#FFFFFF',
      'on-accent': '#FFFFFF',
      'on-error': '#FFFFFF',
      'on-info': '#FFFFFF',
      'on-success': '#FFFFFF',
      'on-warning': '#2B1B0A',
      'on-background': '#2E1C0E',
      'on-surface': '#2E1C0E',

      /* 渐变 */
      'gradient-bookshelf': 'linear-gradient(135deg, #B8956A 0%, #8F7748 100%)',
    },

    /* ────── 深色：暗木底 + primary 提亮至 #B8956A + 柔和书脊色调 ────── */
    dark: {
      /* 品牌色 */
      primary: '#B8956A',          // 书架基色提亮 — 暗底上保持可读
      secondary: '#7A5E40',        // 中调橡木
      accent: '#D4656B',           // 柔和书脊红
      error: '#E05555',            // 柔和错误红
      info: '#7BA8C0',             // 柔和书脊蓝
      success: '#6BA86B',          // 柔和书脊绿
      warning: '#D4B45A',          // 柔金

      /* 表面 */
      background: '#1A1410',       // 暗木纹理底
      surface: '#241D15',          // 深木色卡片

      /* On colors */
      'on-primary': '#1A1410',
      'on-secondary': '#FFFFFF',
      'on-accent': '#1A1410',
      'on-error': '#FFFFFF',
      'on-info': '#FFFFFF',
      'on-success': '#FFFFFF',
      'on-warning': '#1A1410',
      'on-background': '#F0E8D8',
      'on-surface': '#F0E8D8',

      /* 渐变 */
      'gradient-enchant': 'linear-gradient(180deg, #1A1410 0%, #2E241A 100%)',
    },
  },
]

export function getThemeById(id: string): ThemeDefinition {
  return themes.find((t) => t.id === id) ?? themes[0]!
}
