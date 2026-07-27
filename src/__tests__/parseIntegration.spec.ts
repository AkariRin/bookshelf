/**
 * 真实字节的解析集成测试。
 *
 * useStoryLoader 的测试把 storyClient 整体 mock 掉了（jsdom 下 ?worker 导入不可用），
 * 因此那里验证的是状态机分支而非解包本身。本组测试直接跑 trpg 的解析函数，
 * 确保 fixture 与「打包 → 解包 → 归一到 DisplayEntry」这条链路真的通。
 */
import { describe, expect, it } from 'vitest'
import {
  StoryDecryptError,
  StoryFormatError,
  isStoryEncrypted,
  isSupportedStoryVersion,
  readStoryHeader,
  unpackStory,
  unpackStoryEncrypted,
} from '@aemeath-projects/trpg/story'

import { toDisplayEntries } from '@/composables/useStoryIndex'
import { makeBytes, makeEncryptedBytes, makeDoc } from './fixtures'

describe('未加密归档', () => {
  it('容器头声明为受支持的版本且未加密', () => {
    const header = readStoryHeader(makeBytes())
    expect(isSupportedStoryVersion(header.version)).toBe(true)
    expect(header.encrypted).toBe(false)
  })

  it('解包后可归一为可渲染条目', () => {
    const doc = unpackStory(makeBytes())
    const entries = toDisplayEntries(doc)

    expect(doc.meta.logName).toBe('深海余烬')
    expect(entries.map((e) => e.kind)).toEqual(['message', 'roll'])
    expect(entries[1]).toMatchObject({ kind: 'roll', roll: { total: 23, outcome: 'hard_success' } })
  })

  it('大量条目的归档能完整往返', () => {
    const entries = Array.from({ length: 3000 }, (_, i) => ({
      offset: i * 1000,
      actor: i % 2,
      type: 'message' as const,
      text: `第 ${String(i)} 条`,
    }))
    const doc = unpackStory(makeBytes({ entries }))

    expect(doc.entries).toHaveLength(3000)
    expect(toDisplayEntries(doc)).toHaveLength(3000)
  })

  it('非 .story 字节被拒绝', () => {
    expect(() => unpackStory(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]))).toThrowError(
      StoryFormatError,
    )
  })

  it('截断的文件被拒绝', () => {
    expect(() => unpackStory(makeBytes().subarray(0, 4))).toThrowError(StoryFormatError)
  })
})

describe('加密归档', () => {
  const PASSWORD = 'correct-horse'

  it('头部标记为已加密', async () => {
    const bytes = await makeEncryptedBytes(PASSWORD)
    expect(isStoryEncrypted(bytes)).toBe(true)
  })

  it('正确口令可解出与源文档一致的内容', async () => {
    const bytes = await makeEncryptedBytes(PASSWORD)
    const doc = await unpackStoryEncrypted(bytes, PASSWORD)
    expect(doc.meta.logName).toBe(makeDoc().meta.logName)
    expect(doc.entries).toHaveLength(2)
  })

  it('错误口令抛 StoryDecryptError 而非 StoryFormatError', async () => {
    // 两者对用户是不同的事：一个改口令即可，一个说明文件坏了
    const bytes = await makeEncryptedBytes(PASSWORD)
    await expect(unpackStoryEncrypted(bytes, 'wrong-password')).rejects.toThrowError(
      StoryDecryptError,
    )
  })

  it('对加密归档调用同步解包会被明确拒绝', async () => {
    const bytes = await makeEncryptedBytes(PASSWORD)
    expect(() => unpackStory(bytes)).toThrowError(StoryFormatError)
  })
})
