/**
 * 配色主题注册表。
 *
 * 配色取自 Minecraft 经典书架（为附魔台提供加成的那个），
 * 以橡木、羊皮纸和书脊色调构建暖色、学术感的阅读界面。
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

    /* ────── 浅色：羊皮纸底 + 橡木暖棕 + 书脊彩色点缀 ────── */
    light: {
      /* 品牌色 */
      primary: '#8B6914',          // 橡木暖棕 — 主按钮 / AppBar / 焦点态
      secondary: '#6B4226',        // 深木色 — 次要元素
      accent: '#B8383A',           // 书脊红 — CTA 高亮
      error: '#C0392B',            // 错误红
      info: '#4A6B8A',             // 书脊蓝
      success: '#4A7C3F',          // 书脊绿
      warning: '#C8963A',          // 金色铭文 — 告警

      /* 表面 */
      background: '#FAF3E8',       // 羊皮纸底
      surface: '#FFFBF5',          // 卡片/对话泡

      /* On colors */
      'on-primary': '#FFFFFF',
      'on-secondary': '#FFFFFF',
      'on-accent': '#FFFFFF',
      'on-error': '#FFFFFF',
      'on-info': '#FFFFFF',
      'on-success': '#FFFFFF',
      'on-warning': '#2B1B0A',
      'on-background': '#2C1810',
      'on-surface': '#2C1810',

      /* 渐变 */
      'gradient-bookshelf': 'linear-gradient(135deg, #C8963A 0%, #8B6914 100%)',
    },

    /* ────── 深色：暗木质感 + 暖金主色 + 柔和书脊色调 ────── */
    dark: {
      /* 品牌色 */
      primary: '#D4A854',          // 暖金 — 附魔光晕感
      secondary: '#8B6B4A',        // 陈年橡木
      accent: '#D4656B',           // 柔和书脊红
      error: '#E05555',            // 深色模式下更柔和的错误红
      info: '#6B9EBF',             // 柔和书脊蓝
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
      'gradient-enchant': 'linear-gradient(180deg, #1A1410 0%, #2E1F30 100%)',
    },
  },
]

export function getThemeById(id: string): ThemeDefinition {
  return themes.find((t) => t.id === id) ?? themes[0]!
}
