<!--
  发言气泡。

  正文一律作为纯文本渲染（插值而非 v-html）：.story 格式规范明确「归档只存纯文本」，
  引入任何 HTML/markdown 渲染都等于给不可信归档开一条注入通道，且无对应收益。
-->
<template>
  <div class="d-flex ga-3 py-2">
    <ActorAvatar :actor="actor" />
    <div class="flex-grow-1 min-width-0">
      <div class="d-flex align-center ga-2 mb-1">
        <span class="text-body-2 font-weight-medium">{{ actor.name }}</span>
        <span v-if="characterName" class="text-caption text-medium-emphasis">
          {{ characterName }}
        </span>
        <span class="text-caption text-medium-emphasis ml-auto">{{ formatOffset(offset) }}</span>
      </div>
      <div class="bubble text-body-2">{{ text }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StoryActor } from '@aemeath-projects/trpg/story'

import ActorAvatar from '@/components/reader/ActorAvatar.vue'
import { formatOffset } from '@/composables/useStoryIndex'

const props = defineProps<{ actor: StoryActor; offset: number; text: string }>()

const characterName = computed(() => props.actor.characterName ?? '')
</script>

<style scoped>
.bubble {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px 12px 12px 12px;
  padding: 8px 12px;
  /* 归档正文含手动换行，需保留；同时长串英文/URL 要能断行以免撑破容器 */
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.min-width-0 {
  min-width: 0;
}
</style>
