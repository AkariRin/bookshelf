/**
 * 阅读页与 AppBar 之间共享的界面状态。
 *
 * AppBar 挂在 App.vue 上（v-app-bar 需与 v-main 同级才能正确让位），而标题与信息抽屉的
 * 开关归属阅读页。模块级状态比让 App.vue 透传 props 给 router-view 更直接。
 */
import { ref } from 'vue'

const title = ref('Bookshelf')
const infoOpen = ref(false)
/** 是否显示「日志信息」按钮——仅在正文就绪时有意义 */
const infoAvailable = ref(false)

export function useReaderChrome() {
  function setTitle(value: string) {
    title.value = value
  }

  function setInfoAvailable(value: boolean) {
    infoAvailable.value = value
    if (!value) infoOpen.value = false
  }

  function reset() {
    title.value = 'Bookshelf'
    infoOpen.value = false
    infoAvailable.value = false
  }

  return { title, infoOpen, infoAvailable, setTitle, setInfoAvailable, reset }
}
