/**
 * 归档解包 worker。
 *
 * 放进 worker 的理由：unpackStory 内部是 gunzipSync + msgpack 同步解码，主线程直接调用会在
 * 大归档上造成掉帧；加密路径还要跑 600k 次 PBKDF2 迭代。此外解析不可信字节流天然适合隔离。
 *
 * 错误跨 postMessage 会丢失类身份（instanceof 失效），因此在此把异常映射成判别式码，
 * 由主线程侧还原成用户可读文案。
 */
import {
  StoryDecryptError,
  StoryFormatError,
  isStoryEncrypted,
  isSupportedStoryVersion,
  readStoryHeader,
  unpackStory,
  unpackStoryEncrypted,
} from '@aemeath-projects/trpg/story'
import type { StoryDocument } from '@aemeath-projects/trpg/story'

/** 主线程 → worker。 */
export interface UnpackRequest {
  id: number
  bytes: Uint8Array
  /** 加密归档的口令。首次尝试不带口令，由 worker 回报 need-password 后再带上重试。 */
  password?: string
}

/** worker 判定的失败原因。 */
export type UnpackErrorCode =
  /** 容器头非法、字节截断、msgpack 解码失败或结构不合法 */
  | 'format'
  /** 归档已加密但未提供口令，需向用户索取。不是错误，是流程分支 */
  | 'need-password'
  /** 口令错误或密文被篡改 */
  | 'decrypt'
  /** 口令长度不足 */
  | 'weak-password'
  /** 归档版本本实现不支持 */
  | 'unsupported-version'
  | 'unknown'

/** worker → 主线程。 */
export type UnpackResponse =
  | {
      id: number
      ok: true
      doc: StoryDocument
      encrypted: boolean
      version: number
      compression: string
    }
  | { id: number; ok: false; code: UnpackErrorCode; message: string }

async function handle(req: UnpackRequest): Promise<UnpackResponse> {
  const { id, bytes, password } = req

  try {
    // 先读头做能力判断，而不是靠 catch 解包异常来做控制流——
    // 版本超前与文件损坏对用户是两件事，文案也不同
    const header = readStoryHeader(bytes)

    if (!isSupportedStoryVersion(header.version)) {
      return {
        id,
        ok: false,
        code: 'unsupported-version',
        message: `该日志的格式版本为 ${String(header.version)}，当前阅读器不支持`,
      }
    }

    if (isStoryEncrypted(bytes)) {
      if (password === undefined || password === '') {
        return { id, ok: false, code: 'need-password', message: '该日志已加密' }
      }
      const doc = await unpackStoryEncrypted(bytes, password)
      return {
        id,
        ok: true,
        doc,
        encrypted: true,
        version: header.version,
        compression: header.compression,
      }
    }

    return {
      id,
      ok: true,
      doc: unpackStory(bytes),
      encrypted: false,
      version: header.version,
      compression: header.compression,
    }
  } catch (err) {
    if (err instanceof StoryDecryptError) {
      return { id, ok: false, code: 'decrypt', message: err.message }
    }
    if (err instanceof StoryFormatError) {
      // 口令过短由 assertValidPassword 抛 StoryFormatError，但对用户而言这是输入问题
      // 而非文件问题，需要单独分出来
      const code = err.message.includes('口令至少') ? 'weak-password' : 'format'
      return { id, ok: false, code, message: err.message }
    }
    return {
      id,
      ok: false,
      code: 'unknown',
      message: err instanceof Error ? err.message : String(err),
    }
  }
}

self.addEventListener('message', (event: MessageEvent<UnpackRequest>) => {
  void handle(event.data).then((res) => {
    self.postMessage(res)
  })
})
