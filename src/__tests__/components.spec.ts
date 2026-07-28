import { describe, expect, it } from 'vitest'
import type { StoryActor } from '@aemeath-projects/trpg/story'

import ActorAvatar from '@/components/reader/ActorAvatar.vue'
import { useSettingsStore } from '@/stores/settings'
import { mountWithVuetify } from './mountWithVuetify'

const actor: StoryActor = {
  id: '10002',
  name: '调查员小李',
  characterName: '陈默',
  avatar: 'https://example.invalid/a.png',
}

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
