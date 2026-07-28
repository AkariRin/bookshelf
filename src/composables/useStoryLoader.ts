/**
 * 归档加载的状态机。
 *
 * 状态而非布尔标志位：fetching / parsing / need-password / error 四者互斥，
 * 用独立的 loading + error + needPassword 布尔量表达会产生无意义的组合态。
 */
import { computed, ref, shallowRef } from 'vue'
import type { StoryDocument } from '@aemeath-projects/trpg/story'

import { StorySourceError, fetchFromS3, readLocalFile } from '@/services/storySource'
import { StoryUnpackError, unpackStoryBytes } from '@/services/storyClient'

export type LoaderState =
  /** 尚未开始，或本地入口等待用户选择文件 */
  | 'idle'
  | 'fetching'
  | 'parsing'
  /** 归档已加密，等待用户输入口令 */
  | 'need-password'
  | 'ready'
  | 'error'

export function useStoryLoader() {
  const state = ref<LoaderState>('idle')
  const errorMessage = ref('')
  /** 口令错误时置位，用于在输入框上显示校验态而非整页错误 */
  const passwordError = ref('')
  /** shallowRef：文档是大体积只读结构，深度响应式转换毫无收益且开销显著 */
  const doc = shallowRef<StoryDocument>()
  const isEncrypted = ref(false)
  /** .story 容器格式版本号 */
  const storyVersion = ref(0)
  /** payload 压缩算法 */
  const storyCompression = ref('')

  /** 暂存字节，供口令重试时复用，避免重新下载 */
  let cachedBytes: Uint8Array | undefined
  let controller: AbortController | undefined

  const isBusy = computed(() => state.value === 'fetching' || state.value === 'parsing')

  function reset() {
    controller?.abort()
    controller = undefined
    cachedBytes = undefined
    doc.value = undefined
    isEncrypted.value = false
    storyVersion.value = 0
    storyCompression.value = ''
    errorMessage.value = ''
    passwordError.value = ''
    state.value = 'idle'
  }

  function fail(message: string) {
    state.value = 'error'
    errorMessage.value = message
  }

  /** 把取字节阶段的失败翻译成用户可读文案。 */
  function describeSourceError(err: StorySourceError, name: string): string {
    switch (err.kind) {
      case 'no-endpoint':
        return '未配置远程存储端点，无法按名称打开日志。可改用本地文件打开。'
      case 'not-found':
        return `未找到日志「${name}」，请检查名称是否正确。`
      case 'forbidden':
        return '无权访问该日志，可能是该文件未设为公开。'
      case 'network':
        // fetch 不区分网络故障与 CORS 拦截，两种可能都要提示
        return '无法完成请求。请检查网络连接，或确认存储桶已允许本站跨域访问。'
      case 'read-failed':
        return '无法读取所选文件。'
      case 'http':
        return err.message
    }
  }

  /** 把解包阶段的失败翻译成用户可读文案。 */
  function describeUnpackError(err: StoryUnpackError): string {
    switch (err.code) {
      case 'format':
        return `这不是有效的 .story 文件：${err.message}`
      case 'unsupported-version':
        return err.message
      case 'decrypt':
      case 'weak-password':
      case 'need-password':
        return err.message
      case 'unknown':
        return `解析失败：${err.message}`
    }
  }

  /** 解包已取得的字节。password 为空表示首次尝试。 */
  async function parse(bytes: Uint8Array, password?: string) {
    state.value = 'parsing'
    passwordError.value = ''

    try {
      const result = await unpackStoryBytes(bytes, password)
      doc.value = result.doc
      isEncrypted.value = result.encrypted
      storyVersion.value = result.version
      storyCompression.value = result.compression
      state.value = 'ready'
    } catch (err) {
      if (!(err instanceof StoryUnpackError)) {
        fail(err instanceof Error ? err.message : String(err))
        return
      }

      // 加密归档：索取口令是流程分支而非错误
      if (err.code === 'need-password') {
        isEncrypted.value = true
        state.value = 'need-password'
        return
      }
      // 口令相关的失败停在口令界面，让用户能直接改，而不是退回整页错误
      if (err.code === 'decrypt' || err.code === 'weak-password') {
        state.value = 'need-password'
        passwordError.value = describeUnpackError(err)
        return
      }
      fail(describeUnpackError(err))
    }
  }

  /** 从 S3 按名称加载。 */
  async function loadFromS3(name: string) {
    reset()
    controller = new AbortController()
    state.value = 'fetching'

    let bytes: Uint8Array
    try {
      bytes = await fetchFromS3(name, controller.signal)
    } catch (err) {
      // 主动取消：调用方已在导航离开，不该覆写状态
      if (err instanceof DOMException && err.name === 'AbortError') return
      fail(
        err instanceof StorySourceError
          ? describeSourceError(err, name)
          : err instanceof Error
            ? err.message
            : String(err),
      )
      return
    }

    cachedBytes = bytes
    await parse(bytes)
  }

  /** 从本地文件加载。 */
  async function loadFromFile(file: File) {
    reset()
    state.value = 'fetching'

    let bytes: Uint8Array
    try {
      bytes = await readLocalFile(file)
    } catch (err) {
      fail(
        err instanceof StorySourceError
          ? describeSourceError(err, file.name)
          : err instanceof Error
            ? err.message
            : String(err),
      )
      return
    }

    cachedBytes = bytes
    await parse(bytes)
  }

  /** 用户提交口令后重试解包。 */
  async function submitPassword(password: string) {
    if (cachedBytes === undefined) {
      fail('归档数据已丢失，请重新打开文件。')
      return
    }
    await parse(cachedBytes, password)
  }

  return {
    state,
    errorMessage,
    passwordError,
    doc,
    isEncrypted,
    storyVersion,
    storyCompression,
    isBusy,
    loadFromS3,
    loadFromFile,
    submitPassword,
    reset,
  }
}
