<!--
  参与者头像。

  默认只渲染名字首字：actor.avatar 是指向聊天平台头像服务的活引用，加载它会把阅读行为
  暴露给第三方 CDN，且离线必然失败。远程加载需用户在设置中显式开启。
-->
<template>
  <v-avatar :size="size" :color="showRemote ? undefined : 'secondary'">
    <v-img v-if="showRemote" :src="actor.avatar" :alt="actor.name">
      <template #error>
        <span class="text-caption">{{ initialOf(actor.name) }}</span>
      </template>
    </v-img>
    <span v-else class="text-caption font-weight-medium">{{ initialOf(actor.name) }}</span>
  </v-avatar>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StoryActor } from '@aemeath-projects/trpg/story'

import { useSettingsStore } from '@/stores/settings'
import { initialOf } from '@/composables/useStoryIndex'

const props = withDefaults(defineProps<{ actor: StoryActor; size?: number }>(), { size: 36 })

const settings = useSettingsStore()

const showRemote = computed(
  () => settings.loadRemoteAvatars && (props.actor.avatar ?? '') !== '',
)
</script>
