import { afterEach, describe, expect, it, vi } from 'vitest'

import { StorySourceError, buildR2Url, fetchFromR2, readLocalFile } from '@/services/storySource'

const ENDPOINT = 'https://pub-test.r2.dev'

/** 覆写 VITE_R2_ENDPOINT。vi.stubEnv 会在 unstubAllEnvs 时还原。 */
function withEndpoint(value: string) {
  vi.stubEnv('VITE_R2_ENDPOINT', value)
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('buildR2Url', () => {
  it('自动补 .story 后缀', () => {
    withEndpoint(ENDPOINT)
    expect(buildR2Url('deepsea')).toBe(`${ENDPOINT}/deepsea.story`)
  })

  it('已带后缀时不重复追加', () => {
    withEndpoint(ENDPOINT)
    expect(buildR2Url('deepsea.story')).toBe(`${ENDPOINT}/deepsea.story`)
  })

  it('对中文名做百分号编码', () => {
    withEndpoint(ENDPOINT)
    expect(buildR2Url('深海余烬')).toBe(`${ENDPOINT}/${encodeURIComponent('深海余烬')}.story`)
  })

  it('保留斜杠作为路径分隔而非编码成 %2F', () => {
    withEndpoint(ENDPOINT)
    const url = buildR2Url('2024/深海余烬')
    expect(url).toBe(`${ENDPOINT}/2024/${encodeURIComponent('深海余烬')}.story`)
    expect(url).not.toContain('%2F')
  })

  it('去掉端点结尾的多余斜杠', () => {
    withEndpoint(`${ENDPOINT}///`)
    expect(buildR2Url('a')).toBe(`${ENDPOINT}/a.story`)
  })

  it('端点未配置时抛 no-endpoint', () => {
    withEndpoint('')
    expect(() => buildR2Url('a')).toThrowError(
      expect.objectContaining({ kind: 'no-endpoint' }) as Error,
    )
  })
})

describe('fetchFromR2', () => {
  it('成功时返回字节', async () => {
    withEndpoint(ENDPOINT)
    const payload = new Uint8Array([1, 2, 3])
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(payload, { status: 200 })),
    )

    await expect(fetchFromR2('a')).resolves.toEqual(payload)
  })

  it('404 映射为 not-found', async () => {
    withEndpoint(ENDPOINT)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 })))

    await expect(fetchFromR2('missing')).rejects.toThrowError(
      expect.objectContaining({ kind: 'not-found' }) as Error,
    )
  })

  it('403 映射为 forbidden', async () => {
    withEndpoint(ENDPOINT)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 403 })))

    await expect(fetchFromR2('a')).rejects.toThrowError(
      expect.objectContaining({ kind: 'forbidden' }) as Error,
    )
  })

  it('其它非 2xx 映射为 http', async () => {
    withEndpoint(ENDPOINT)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 500 })))

    await expect(fetchFromR2('a')).rejects.toThrowError(
      expect.objectContaining({ kind: 'http' }) as Error,
    )
  })

  it('fetch 抛错映射为 network', async () => {
    withEndpoint(ENDPOINT)
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(fetchFromR2('a')).rejects.toThrowError(
      expect.objectContaining({ kind: 'network' }) as Error,
    )
  })

  it('中止请求时原样抛出 AbortError，不包装成 StorySourceError', async () => {
    withEndpoint(ENDPOINT)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError')),
    )

    // 主动取消属正常控制流，调用方要能区分它与真实故障
    await expect(fetchFromR2('a')).rejects.toSatisfy(
      (err: unknown) => err instanceof DOMException && !(err instanceof StorySourceError),
    )
  })
})

describe('readLocalFile', () => {
  it('返回文件字节', async () => {
    const file = new File([new Uint8Array([7, 8])], 'a.story')
    await expect(readLocalFile(file)).resolves.toEqual(new Uint8Array([7, 8]))
  })
})
