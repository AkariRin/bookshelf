/**
 * 测试用的 .story 文档与字节构造。
 *
 * trpg 仓库不提供样本文件，故用 packStory 现造——这样 fixture 与解析器版本天然同步，
 * 不会出现「样本文件停留在旧格式」的漂移。
 */
import { packStory, packStoryEncrypted } from '@aemeath-projects/trpg/story'
import type { StoryDocument } from '@aemeath-projects/trpg/story'

export const START = 1_700_000_000_000

export function makeDoc(overrides: Partial<StoryDocument> = {}): StoryDocument {
  return {
    meta: {
      logName: '深海余烬',
      createdBy: '10001',
      startedAt: START,
      endedAt: START + 7_200_000,
      durationMs: 5_400_000,
      entryCount: 2,
      exportedAt: START + 7_300_000,
      source: 'aemeath',
    },
    actors: [
      { id: '10001', name: 'KP老王' },
      {
        id: '10002',
        name: '调查员小李',
        characterName: '陈默',
        avatar: 'https://example.invalid/avatar.png',
      },
    ],
    characters: [
      {
        name: '陈默',
        ruleset: 'coc7',
        owner: 1,
        attributes: { 力量: 50, 侦查: 65 },
      },
    ],
    entries: [
      { offset: 0, actor: 1, type: 'message', text: '我推开那扇门。' },
      {
        offset: 3_000,
        actor: 1,
        type: 'roll',
        character: 0,
        text: '陈默 进行 侦查 检定',
        roll: {
          expression: '1d100',
          total: 23,
          detail: 'D100=23',
          rolls: [23],
          skill: '侦查',
          target: 65,
          outcome: 'hard_success',
        },
      },
    ],
    ...overrides,
  }
}

export function makeBytes(overrides: Partial<StoryDocument> = {}): Uint8Array {
  return packStory(makeDoc(overrides))
}

export function makeEncryptedBytes(password: string): Promise<Uint8Array> {
  return packStoryEncrypted(makeDoc(), password)
}
