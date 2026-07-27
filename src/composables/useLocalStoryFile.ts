/**
 * 本地选择的文件在首页 → 阅读页之间的移交。
 *
 * 用模块级 ref 而非 pinia：File 是不可序列化的宿主对象，放进会被持久化的 store 没有意义。
 * 刷新即丢失是既定行为（文件仅临时打开、不入库），阅读页对此显示「请重新选择」而非报错。
 */
import { ref } from 'vue'

const pendingFile = ref<File>()

export function useLocalStoryFile() {
  function setFile(file: File) {
    pendingFile.value = file
  }

  /** 取出并清空——同一文件不该在返回首页后被二次消费。 */
  function takeFile(): File | undefined {
    const file = pendingFile.value
    pendingFile.value = undefined
    return file
  }

  return { setFile, takeFile }
}
