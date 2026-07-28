import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { StoryUnpackError } from '@/services/storyClient'
import { StorySourceError } from '@/services/storySource'

// worker 在 jsdom 下不可用（?worker 导入依赖 vite 的 worker 管线），
// 故把 storyClient 整体替换掉——本组测试的对象是状态机的分支，不是解包本身
const unpackMock = vi.hoisted(() =>
  vi.fn<typeof import('@/services/storyClient').unpackStoryBytes>(),
)
vi.mock('@/services/storyClient', async () => {
  const actual =
    await vi.importActual<typeof import('@/services/storyClient')>('@/services/storyClient')
  return { ...actual, unpackStoryBytes: unpackMock }
})

const fetchMock = vi.hoisted(() => vi.fn<typeof import('@/services/storySource').fetchFromS3>())
vi.mock('@/services/storySource', async () => {
  const actual =
    await vi.importActual<typeof import('@/services/storySource')>('@/services/storySource')
  return { ...actual, fetchFromS3: fetchMock }
})

const { useStoryLoader } = await import('@/composables/useStoryLoader')
const { makeDoc } = await import('./fixtures')

const BYTES = new Uint8Array([1, 2, 3])
const DOC = makeDoc()

beforeEach(() => {
  fetchMock.mockReset()
  unpackMock.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useStoryLoader / S3 路径', () => {
  it('成功后进入 ready 并持有文档', async () => {
    fetchMock.mockResolvedValue(BYTES)
    unpackMock.mockResolvedValue({ doc: DOC, encrypted: false, version: 1, compression: 'none' })

    const loader = useStoryLoader()
    await loader.loadFromS3('a')

    expect(loader.state.value).toBe('ready')
    expect(loader.doc.value).toEqual(DOC)
    expect(loader.isEncrypted.value).toBe(false)
  })

  it('404 时进入 error 并给出含名称的文案', async () => {
    fetchMock.mockRejectedValue(new StorySourceError('not-found', 'x'))

    const loader = useStoryLoader()
    await loader.loadFromS3('深海余烬')

    expect(loader.state.value).toBe('error')
    expect(loader.errorMessage.value).toContain('深海余烬')
  })

  it('network 失败的文案同时提示网络与跨域', async () => {
    // fetch 无法区分两者，文案必须覆盖两种可能
    fetchMock.mockRejectedValue(new StorySourceError('network', 'x'))

    const loader = useStoryLoader()
    await loader.loadFromS3('a')

    expect(loader.errorMessage.value).toContain('网络')
    expect(loader.errorMessage.value).toContain('跨域')
  })

  it('端点未配置时提示可改用本地文件', async () => {
    fetchMock.mockRejectedValue(new StorySourceError('no-endpoint', 'x'))

    const loader = useStoryLoader()
    await loader.loadFromS3('a')

    expect(loader.errorMessage.value).toContain('本地文件')
  })

  it('请求被中止时不写入错误态', async () => {
    fetchMock.mockRejectedValue(new DOMException('Aborted', 'AbortError'))

    const loader = useStoryLoader()
    await loader.loadFromS3('a')

    // 中止发生在导航离开时，覆写状态会在已卸载的视图上闪出错误
    expect(loader.state.value).not.toBe('error')
  })
})

describe('useStoryLoader / 加密流程', () => {
  it('需要口令时进入 need-password 而非 error', async () => {
    fetchMock.mockResolvedValue(BYTES)
    unpackMock.mockRejectedValue(new StoryUnpackError('need-password', '该日志已加密'))

    const loader = useStoryLoader()
    await loader.loadFromS3('a')

    expect(loader.state.value).toBe('need-password')
    expect(loader.isEncrypted.value).toBe(true)
    expect(loader.errorMessage.value).toBe('')
  })

  it('口令错误时停在口令界面并给出校验文案', async () => {
    fetchMock.mockResolvedValue(BYTES)
    unpackMock.mockRejectedValueOnce(new StoryUnpackError('need-password', '已加密'))

    const loader = useStoryLoader()
    await loader.loadFromS3('a')

    unpackMock.mockRejectedValueOnce(new StoryUnpackError('decrypt', '口令错误'))
    await loader.submitPassword('wrongpass')

    expect(loader.state.value).toBe('need-password')
    expect(loader.passwordError.value).toContain('口令错误')
  })

  it('口令正确后进入 ready 且标记为加密归档', async () => {
    fetchMock.mockResolvedValue(BYTES)
    unpackMock.mockRejectedValueOnce(new StoryUnpackError('need-password', '已加密'))

    const loader = useStoryLoader()
    await loader.loadFromS3('a')

    unpackMock.mockResolvedValueOnce({ doc: DOC, encrypted: true, version: 1, compression: 'none' })
    await loader.submitPassword('correctpass')

    expect(loader.state.value).toBe('ready')
    expect(loader.isEncrypted.value).toBe(true)
  })

  it('重试口令时复用已下载的字节，不重新请求', async () => {
    fetchMock.mockResolvedValue(BYTES)
    unpackMock.mockRejectedValueOnce(new StoryUnpackError('need-password', '已加密'))

    const loader = useStoryLoader()
    await loader.loadFromS3('a')
    expect(fetchMock).toHaveBeenCalledTimes(1)

    unpackMock.mockResolvedValueOnce({ doc: DOC, encrypted: true, version: 1, compression: 'none' })
    await loader.submitPassword('correctpass')

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('useStoryLoader / 解析失败', () => {
  it('格式错误进入 error', async () => {
    fetchMock.mockResolvedValue(BYTES)
    unpackMock.mockRejectedValue(new StoryUnpackError('format', 'magic 不匹配'))

    const loader = useStoryLoader()
    await loader.loadFromS3('a')

    expect(loader.state.value).toBe('error')
    expect(loader.errorMessage.value).toContain('.story')
  })

  it('版本超前时原样透出解析器的升级提示', async () => {
    fetchMock.mockResolvedValue(BYTES)
    unpackMock.mockRejectedValue(
      new StoryUnpackError('unsupported-version', '该日志的格式版本为 2，当前阅读器不支持'),
    )

    const loader = useStoryLoader()
    await loader.loadFromS3('a')

    expect(loader.errorMessage.value).toContain('版本')
  })
})

describe('useStoryLoader / 本地文件', () => {
  it('成功后进入 ready', async () => {
    unpackMock.mockResolvedValue({ doc: DOC, encrypted: false, version: 1, compression: 'none' })

    const loader = useStoryLoader()
    await loader.loadFromFile(new File([BYTES], 'a.story'))

    expect(loader.state.value).toBe('ready')
  })

  it('无缓存字节时提交口令给出可操作提示', async () => {
    const loader = useStoryLoader()
    await loader.submitPassword('whatever1')

    expect(loader.state.value).toBe('error')
    expect(loader.errorMessage.value).toContain('重新打开')
  })
})

describe('useStoryLoader / reset', () => {
  it('清空文档与错误', async () => {
    fetchMock.mockResolvedValue(BYTES)
    unpackMock.mockResolvedValue({ doc: DOC, encrypted: false, version: 1, compression: 'none' })

    const loader = useStoryLoader()
    await loader.loadFromS3('a')
    loader.reset()

    expect(loader.state.value).toBe('idle')
    expect(loader.doc.value).toBeUndefined()
    expect(loader.errorMessage.value).toBe('')
  })
})
