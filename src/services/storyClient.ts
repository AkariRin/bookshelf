/**
 * story worker 的 Promise 化封装。
 *
 * worker 惰性创建并复用：解包是低频操作，但每次新建 worker 都要重新加载并实例化
 * msgpackr 与 fflate，复用省去这份开销。
 */
import type { StoryDocument } from '@aemeath-projects/trpg/story'

import StoryWorker from '@/workers/story.worker?worker'
import type { UnpackErrorCode, UnpackRequest, UnpackResponse } from '@/workers/story.worker'

export type { UnpackErrorCode }

/** 解包失败。code 用于 UI 分派文案，message 是解析器给出的原始说明。 */
export class StoryUnpackError extends Error {
  constructor(
    readonly code: UnpackErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'StoryUnpackError'
  }
}

export interface UnpackResult {
  doc: StoryDocument
  encrypted: boolean
  /** .story 容器格式版本号 */
  version: number
  /** payload 压缩算法 */
  compression: string
}

let worker: Worker | undefined
let nextId = 0
const pending = new Map<number, (res: UnpackResponse) => void>()

function getWorker(): Worker {
  if (worker === undefined) {
    worker = new StoryWorker()
    worker.addEventListener('message', (event: MessageEvent<UnpackResponse>) => {
      const resolve = pending.get(event.data.id)
      if (resolve === undefined) return
      pending.delete(event.data.id)
      resolve(event.data)
    })
  }
  return worker
}

/**
 * 解包归档字节。
 *
 * @param bytes 完整的 .story 字节
 * @param password 加密归档的口令；未加密归档忽略此参数
 * @throws {StoryUnpackError} code 为 'need-password' 时表示需要向用户索取口令
 */
export async function unpackStoryBytes(
  bytes: Uint8Array,
  password?: string,
): Promise<UnpackResult> {
  const id = nextId++
  const req: UnpackRequest = { id, bytes, password }

  const res = await new Promise<UnpackResponse>((resolve) => {
    pending.set(id, resolve)
    // 不转移 bytes 的所有权：调用方可能因口令错误而重试，转移后原 buffer 会被置空
    getWorker().postMessage(req)
  })

  if (!res.ok) {
    throw new StoryUnpackError(res.code, res.message)
  }
  return {
    doc: res.doc,
    encrypted: res.encrypted,
    version: res.version,
    compression: res.compression,
  }
}
