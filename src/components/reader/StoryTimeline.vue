<!--
  条目时间线。

  用 v-virtual-scroll 而非直接 v-for：一场团的归档常有数千条，全量挂载会让首屏渲染
  与滚动都明显卡顿。气泡高度不定，v-virtual-scroll 支持动态高度项。
-->
<template>
  <v-virtual-scroll :items="entries" :item-height="undefined" class="timeline">
    <template #default="{ item }">
      <MessageBubble
        v-if="item.kind === 'message'"
        :actor="item.actor"
        :offset="item.offset"
        :text="item.text"
      />
      <RollCard
        v-else-if="item.kind === 'roll'"
        :actor="item.actor"
        :offset="item.offset"
        :roll="item.roll"
      />
      <MessageBubble
        v-else
        :actor="item.actor"
        :offset="item.offset"
        :text="item.text || '（本条内容无法识别）'"
      />
    </template>
  </v-virtual-scroll>
</template>

<script setup lang="ts">
import MessageBubble from '@/components/reader/MessageBubble.vue'
import RollCard from '@/components/reader/RollCard.vue'
import type { DisplayEntry } from '@/composables/useStoryIndex'

defineProps<{ entries: DisplayEntry[] }>()
</script>

<style scoped>
.timeline {
  /* 让虚拟滚动容器撑满可用高度，滚动条归它而非页面 */
  height: 100%;
}
</style>
