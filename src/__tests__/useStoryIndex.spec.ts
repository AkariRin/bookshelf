import { describe, expect, it } from 'vitest'
import type { StoryDocument } from '@aemeath-projects/trpg/story'

import {
  describeOutcome,
  formatDuration,
  formatOffset,
  formatTimestamp,
  initialOf,
  toDisplayEntries,
} from '@/composables/useStoryIndex'
import { makeDoc } from './fixtures'

describe('describeOutcome', () => {
  it('映射六种 CoC 检定等级', () => {
    expect(describeOutcome('great_success').label).toBe('大成功')
    expect(describeOutcome('extreme_success').label).toBe('极难成功')
    expect(describeOutcome('hard_success').label).toBe('困难成功')
    expect(describeOutcome('success').label).toBe('成功')
    expect(describeOutcome('fail').label).toBe('失败')
    expect(describeOutcome('great_fail').label).toBe('大失败')
  })

  it('成功与失败用不同语义色', () => {
    expect(describeOutcome('great_success').color).toBe('success')
    expect(describeOutcome('great_fail').color).toBe('error')
  })

  it('undefined 时不产出标签', () => {
    expect(describeOutcome(undefined).label).toBe('')
  })

  it('未收录的取值原样显示', () => {
    // 归档格式刻意把 outcome 声明为 string，出现新取值属预期情况
    expect(describeOutcome('botch').label).toBe('botch')
  })
})

describe('formatOffset', () => {
  it('一小时内用 mm:ss', () => {
    expect(formatOffset(0)).toBe('00:00')
    expect(formatOffset(63_000)).toBe('01:03')
  })

  it('超过一小时带小时段', () => {
    expect(formatOffset(3_723_000)).toBe('1:02:03')
  })

  it('非法值回退为占位而非 NaN', () => {
    expect(formatOffset(Number.NaN)).toBe('--:--')
    expect(formatOffset(-1)).toBe('--:--')
  })
})

describe('formatTimestamp', () => {
  it('非数字回退为空串而非 Invalid Date', () => {
    // meta.exportedAt 等字段未被解析器校验，可能不是数字
    expect(formatTimestamp(undefined)).toBe('')
    expect(formatTimestamp(Number.NaN)).toBe('')
  })

  it('合法时间戳产出非空文本', () => {
    expect(formatTimestamp(1_700_000_000_000)).not.toBe('')
  })
})

describe('formatDuration', () => {
  it('不足一小时只显示分钟', () => {
    expect(formatDuration(5_400_000)).toBe('1 小时 30 分')
    expect(formatDuration(600_000)).toBe('10 分钟')
  })

  it('非法值回退为「未知」', () => {
    expect(formatDuration(undefined)).toBe('未知')
    expect(formatDuration(-5)).toBe('未知')
  })
})

describe('initialOf', () => {
  it('取首字', () => {
    expect(initialOf('调查员小李')).toBe('调')
  })

  it('空名回退为问号', () => {
    expect(initialOf('   ')).toBe('?')
  })
})

describe('toDisplayEntries', () => {
  it('按 type 归一为对应形态', () => {
    const entries = toDisplayEntries(makeDoc())
    expect(entries.map((e) => e.kind)).toEqual(['message', 'roll'])
  })

  it('回查参与者', () => {
    const entries = toDisplayEntries(makeDoc())
    expect(entries[0]?.actor.name).toBe('调查员小李')
  })

  // 以下三项针对解析器未校验的字段。构造这些文档需要绕过类型，
  // 因为它们表达的正是「类型声明与运行时不符」的情形
  it('type 缺失时降级为 plain 而非丢弃条目', () => {
    const doc = makeDoc({
      entries: [{ offset: 0, actor: 0, text: '没有 type' } as never],
    }) as StoryDocument
    const entries = toDisplayEntries(doc)
    expect(entries).toHaveLength(1)
    expect(entries[0]?.kind).toBe('plain')
    expect(entries[0]?.text).toBe('没有 type')
  })

  it('type 为未知值时降级为 plain', () => {
    const doc = makeDoc({
      entries: [{ offset: 0, actor: 0, type: 'image', text: '[图片]' } as never],
    }) as StoryDocument
    expect(toDisplayEntries(doc)[0]?.kind).toBe('plain')
  })

  it('roll 形状不全时降级为 plain 而非渲染空卡片', () => {
    const doc = makeDoc({
      entries: [
        { offset: 0, actor: 0, type: 'roll', text: '掷骰失败', roll: { expression: '1d6' } } as never,
      ],
    }) as StoryDocument
    expect(toDisplayEntries(doc)[0]?.kind).toBe('plain')
  })

  it('roll 完全缺失时降级为 plain', () => {
    const doc = makeDoc({
      entries: [{ offset: 0, actor: 0, type: 'roll', text: '无载荷' } as never],
    }) as StoryDocument
    expect(toDisplayEntries(doc)[0]?.kind).toBe('plain')
  })

  it('offset 非数字时归零，不产出 NaN', () => {
    const doc = makeDoc({
      entries: [{ offset: 'x', actor: 0, type: 'message', text: 'a' } as never],
    }) as StoryDocument
    expect(toDisplayEntries(doc)[0]?.offset).toBe(0)
  })

  it('actor 下标越界时用占位参与者，不抛异常', () => {
    // 解析器会拦住越界下标，但 UI 层不该依赖上游校验的完备性
    const doc = makeDoc({
      entries: [{ offset: 0, actor: 99, type: 'message', text: 'a' } as never],
    }) as StoryDocument
    expect(() => toDisplayEntries(doc)).not.toThrow()
    expect(toDisplayEntries(doc)[0]?.actor.name).toBe('未知参与者')
  })

  it('text 缺失时为空串而非 undefined', () => {
    const doc = makeDoc({
      entries: [{ offset: 0, actor: 0, type: 'message' } as never],
    }) as StoryDocument
    expect(toDisplayEntries(doc)[0]?.text).toBe('')
  })
})
