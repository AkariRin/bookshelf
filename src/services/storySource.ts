/**
 * 归档字节的获取层。
 *
 * 本层只负责「拿到 Uint8Array」，不认识 .story 的容器格式——解析是 worker 的职责。
 * 这样以后 S3 从公开直连改为 Worker 预签名，只需改动本文件。
 */
import { STORY_EXTENSION } from '@aemeath-projects/trpg/story'

/** 取字节失败的原因，供 UI 分派到不同文案。 */
export type StorySourceErrorKind =
  /** 端点未配置 */
  | 'no-endpoint'
  /** 目标不存在（404） */
  | 'not-found'
  /** 无权访问（401/403），公开桶下通常是对象未公开 */
  | 'forbidden'
  /** 其它非 2xx 响应 */
  | 'http'
  /**
   * 请求未能完成。
   *
   * fetch 对「网络不可用」与「被 CORS 拦截」抛出的是同一种不可区分的 TypeError，
   * 浏览器刻意不透露细节以防跨源探测，因此两者只能合并成一类并在文案中同时提示。
   */
  | 'network'
  /** 读取本地文件失败 */
  | 'read-failed'

export class StorySourceError extends Error {
  constructor(
    readonly kind: StorySourceErrorKind,
    message: string,
  ) {
    super(message)
    this.name = 'StorySourceError'
  }
}

/** S3 端点，未配置时为空串。 */
export function getS3Endpoint(): string {
  return (import.meta.env.VITE_S3_ENDPOINT ?? '').replace(/\/+$/, '')
}

export function hasS3Endpoint(): boolean {
  return getS3Endpoint() !== ''
}

/**
 * 把路由参数拼成 S3 对象 URL。
 *
 * 逐段 encodeURIComponent 而非整体编码：key 可能含中文（需编码）也可能含斜杠表示子目录
 * （不能编码，否则 %2F 会被当作字面量而非路径分隔）。
 * 已带 .story 后缀时不重复追加，使直接粘贴完整文件名的地址也能工作。
 */
export function buildS3Url(name: string): string {
  const endpoint = getS3Endpoint()
  if (endpoint === '') {
    throw new StorySourceError('no-endpoint', '未配置 S3 端点（VITE_S3_ENDPOINT）')
  }

  const key = name.endsWith(STORY_EXTENSION) ? name : `${name}${STORY_EXTENSION}`
  const encoded = key.split('/').map(encodeURIComponent).join('/')
  return `${endpoint}/${encoded}`
}

/**
 * 从 S3 取归档字节。
 *
 * @param name 路由参数中的日志名，不含 .story 后缀
 * @param signal 用于在组件卸载或重新导航时中止请求
 * @throws {StorySourceError}
 */
export async function fetchFromS3(name: string, signal?: AbortSignal): Promise<Uint8Array> {
  const url = buildS3Url(name)

  let res: Response
  try {
    res = await fetch(url, { signal })
  } catch (err) {
    // AbortError 是调用方主动取消，属正常控制流，原样抛出不包装成错误态
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new StorySourceError('network', '网络请求未能完成')
  }

  if (!res.ok) {
    if (res.status === 404) {
      throw new StorySourceError('not-found', `未找到日志：${name}`)
    }
    if (res.status === 401 || res.status === 403) {
      throw new StorySourceError('forbidden', '无权访问该日志')
    }
    throw new StorySourceError('http', `服务器返回 ${String(res.status)}`)
  }

  return new Uint8Array(await res.arrayBuffer())
}

/**
 * 读取本地选择的文件。
 *
 * @throws {StorySourceError}
 */
export async function readLocalFile(file: File): Promise<Uint8Array> {
  try {
    return new Uint8Array(await file.arrayBuffer())
  } catch {
    throw new StorySourceError('read-failed', `无法读取文件：${file.name}`)
  }
}
