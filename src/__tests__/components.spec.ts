import { describe, expect, it } from 'vitest'
import type { StoryActor, StoryRollPayload } from '@aemeath-projects/trpg/story'

import MessageBubble from '@/components/reader/MessageBubble.vue'
import RollCard from '@/components/reader/RollCard.vue'
import StoryMetaPanel from '@/components/reader/StoryMetaPanel.vue'
import CharacterSheet from '@/components/reader/CharacterSheet.vue'
import ActorAvatar from '@/components/reader/ActorAvatar.vue'
import { useSettingsStore } from '@/stores/settings'
import { mountWithVuetify } from './mountWithVuetify'
import { makeDoc } from './fixtures'

const actor: StoryActor = {
  id: '10002',
  name: '调查员小李',
  characterName: '陈默',
  avatar: 'https://example.invalid/a.png',
}

const roll: StoryRollPayload = {
  expression: '1d100',
  total: 23,
  detail: 'D100=23',
  rolls: [23],
  skill: '侦查',
  target: 65,
  outcome: 'hard_success',
}

describe('MessageBubble', () => {
  it('渲染参与者名、卡名与正文', () => {
    const w = mountWithVuetify(MessageBubble, {
      props: { actor, offset: 63_000, text: '我推开那扇门。' },
    })
    expect(w.text()).toContain('调查员小李')
    expect(w.text()).toContain('陈默')
    expect(w.text()).toContain('我推开那扇门。')
    expect(w.text()).toContain('01:03')
  })

  it('正文按纯文本渲染，不解释 HTML', () => {
    // 归档只存纯文本，任何 HTML 渲染都会成为注入通道
    const w = mountWithVuetify(MessageBubble, {
      props: { actor, offset: 0, text: '<img src=x onerror=alert(1)>' },
    })
    expect(w.html()).not.toContain('onerror=alert(1)>')
    expect(w.text()).toContain('<img src=x onerror=alert(1)>')
  })
})

describe('RollCard', () => {
  it('渲染检定项、目标值、明细与结果', () => {
    const w = mountWithVuetify(RollCard, { props: { actor, offset: 0, roll } })
    expect(w.text()).toContain('侦查')
    expect(w.text()).toContain('65')
    expect(w.text()).toContain('D100=23')
    expect(w.text()).toContain('困难成功')
  })

  it('自由掷骰无技能名时显示通用标题', () => {
    const w = mountWithVuetify(RollCard, {
      props: { actor, offset: 0, roll: { expression: '3d6', total: 11, detail: '3D6=11', rolls: [4, 3, 4] } },
    })
    expect(w.text()).toContain('掷骰')
  })

  it('暗骰默认隐藏内容', () => {
    const w = mountWithVuetify(RollCard, {
      props: { actor, offset: 0, roll: { ...roll, hidden: true } },
    })
    expect(w.text()).toContain('暗骰')
    expect(w.text()).not.toContain('D100=23')
  })

  it('开启设置后显示暗骰内容', async () => {
    const w = mountWithVuetify(RollCard, {
      props: { actor, offset: 0, roll: { ...roll, hidden: true } },
    })
    useSettingsStore().revealHiddenRolls = true
    await w.vm.$nextTick()
    expect(w.text()).toContain('D100=23')
  })
})

describe('ActorAvatar', () => {
  it('默认不发起远程头像请求', () => {
    // 加载远程头像会把阅读行为暴露给第三方 CDN
    const w = mountWithVuetify(ActorAvatar, { props: { actor } })
    expect(w.html()).not.toContain('example.invalid')
    expect(w.text()).toContain('调')
  })

  it('开启设置后使用远程头像', async () => {
    const w = mountWithVuetify(ActorAvatar, { props: { actor } })
    useSettingsStore().loadRemoteAvatars = true
    await w.vm.$nextTick()
    expect(w.html()).toContain('example.invalid')
  })
})

describe('StoryMetaPanel', () => {
  it('渲染日志名、时长与条目数', () => {
    const w = mountWithVuetify(StoryMetaPanel, { props: { doc: makeDoc(), encrypted: false } })
    expect(w.text()).toContain('深海余烬')
    expect(w.text()).toContain('1 小时 30 分')
    expect(w.text()).toContain('2 条')
  })

  it('把开团者 id 解析为参与者名', () => {
    const w = mountWithVuetify(StoryMetaPanel, { props: { doc: makeDoc(), encrypted: false } })
    expect(w.text()).toContain('KP老王')
  })

  it('entryCount 非数字时回退为实际条目数', () => {
    const doc = makeDoc()
    const broken = { ...doc, meta: { ...doc.meta, entryCount: undefined as never } }
    const w = mountWithVuetify(StoryMetaPanel, { props: { doc: broken, encrypted: false } })
    expect(w.text()).toContain('2 条')
  })

  it('加密归档时标注已验证', () => {
    const w = mountWithVuetify(StoryMetaPanel, { props: { doc: makeDoc(), encrypted: true } })
    expect(w.text()).toContain('已加密归档')
  })
})

describe('CharacterSheet', () => {
  it('渲染卡名与规则系统', () => {
    const w = mountWithVuetify(CharacterSheet, { props: { doc: makeDoc() } })
    expect(w.text()).toContain('陈默')
    expect(w.text()).toContain('coc7')
  })

  it('无人物卡时给出说明而非空白', () => {
    const w = mountWithVuetify(CharacterSheet, { props: { doc: makeDoc({ characters: [] }) } })
    expect(w.text()).toContain('本场团未记录人物卡')
  })
})
