/**
 * 阅读页与 AppBar 之间共享的界面状态。
 *
 * AppBar 挂在 App.vue 上（v-app-bar 需与 v-main 同级才能正确让位），而标题归属阅读页。
 * 模块级状态比让 App.vue 透传 props 给 router-view 更直接。
 */
import { ref } from 'vue'

const title = ref('Bookshelf')

export function useReaderChrome() {
  function setTitle(value: string) {
    title.value = value
  }

  function reset() {
    title.value = 'Bookshelf'
  }

  return { title, setTitle, reset }
}
