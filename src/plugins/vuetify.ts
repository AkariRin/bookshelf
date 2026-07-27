/** Vuetify 实例：mdi 图标集、中文 locale、以 aemeath 配色初始化的双主题。 */
import { createVuetify } from 'vuetify'
import { zhHans } from 'vuetify/locale'

import { getThemeById } from '@/themes'

/**
 * 以指定主题 id 的配色创建 Vuetify 实例。
 *
 * 初始配色在此写入而非留给 store 运行时注入，是为了避免首帧渲染出默认紫色再跳变成品牌色。
 */
export function createAppVuetify(themeId: string) {
  const def = getThemeById(themeId)

  return createVuetify({
    icons: {
      defaultSet: 'mdi',
    },
    theme: {
      defaultTheme: 'light',
      themes: {
        light: { colors: { ...def.light } },
        dark: { colors: { ...def.dark } },
      },
    },
    locale: {
      locale: 'zhHans',
      messages: { zhHans },
    },
  })
}
