/** 阅读偏好设置。 */
import { ref } from 'vue'
import { defineStore } from 'pinia'

/** 正文字号档位，对应 ReaderView 上的 CSS 变量。 */
export type FontScale = 'sm' | 'md' | 'lg'

export const useSettingsStore = defineStore(
  'settings',
  () => {
    const fontScale = ref<FontScale>('md')

    /**
     * 是否加载参与者的远程头像。
     *
     * 默认关闭：actor.avatar 指向聊天平台的头像服务，加载它会把「谁在何时读了这份归档」
     * 暴露给第三方 CDN，且离线时必然失败。关闭时回退为显示名字首字。
     */
    const loadRemoteAvatars = ref(false)

    /** 是否显示暗骰内容。归档里暗骰已是明文，此开关只影响呈现。 */
    const revealHiddenRolls = ref(false)

    return { fontScale, loadRemoteAvatars, revealHiddenRolls }
  },
  {
    persist: {
      key: 'bookshelf-settings',
      pick: ['fontScale', 'loadRemoteAvatars', 'revealHiddenRolls'],
    },
  },
)
