<!--
  归档元信息。

  meta 上除 startedAt 外的数字字段（endedAt / durationMs / entryCount / exportedAt）
  未经解析器校验，格式化函数均对非数字输入有兜底。
-->
<template>
  <v-list density="compact" class="py-0">
    <v-list-item>
      <template #prepend><v-icon size="18">mdi-book-open-variant</v-icon></template>
      <v-list-item-title class="text-body-2">{{ meta.logName }}</v-list-item-title>
      <v-list-item-subtitle class="text-caption">日志名</v-list-item-subtitle>
    </v-list-item>

    <v-list-item>
      <template #prepend><v-icon size="18">mdi-account-tie</v-icon></template>
      <v-list-item-title class="text-body-2">{{ kpName }}</v-list-item-title>
      <v-list-item-subtitle class="text-caption">开团者</v-list-item-subtitle>
    </v-list-item>

    <v-list-item>
      <template #prepend><v-icon size="18">mdi-clock-outline</v-icon></template>
      <v-list-item-title class="text-body-2">{{ formatDuration(meta.durationMs) }}</v-list-item-title>
      <v-list-item-subtitle class="text-caption">有效时长</v-list-item-subtitle>
    </v-list-item>

    <v-list-item>
      <template #prepend><v-icon size="18">mdi-message-text-outline</v-icon></template>
      <v-list-item-title class="text-body-2">{{ entryCount }} 条</v-list-item-title>
      <v-list-item-subtitle class="text-caption">条目数</v-list-item-subtitle>
    </v-list-item>

    <v-list-item>
      <template #prepend><v-icon size="18">mdi-calendar-start</v-icon></template>
      <v-list-item-title class="text-body-2">{{ formatTimestamp(meta.startedAt) }}</v-list-item-title>
      <v-list-item-subtitle class="text-caption">开始时间</v-list-item-subtitle>
    </v-list-item>

    <v-list-item v-if="encrypted">
      <template #prepend><v-icon size="18" color="success">mdi-lock-check</v-icon></template>
      <v-list-item-title class="text-body-2">已加密归档</v-list-item-title>
      <v-list-item-subtitle class="text-caption">口令已验证</v-list-item-subtitle>
    </v-list-item>
  </v-list>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StoryDocument } from '@aemeath-projects/trpg/story'

import { formatDuration, formatTimestamp } from '@/composables/useStoryIndex'

const props = defineProps<{ doc: StoryDocument; encrypted: boolean }>()

const meta = computed(() => props.doc.meta)

/** 开团者在 meta 里只存账号 id，能在 actors 中找到则显示其名字。 */
const kpName = computed(() => {
  const actor = props.doc.actors.find((a) => a.id === meta.value.createdBy)
  return actor?.name ?? meta.value.createdBy
})

/** entryCount 未经校验，非数字时退回实际条目数。 */
const entryCount = computed(() =>
  typeof meta.value.entryCount === 'number' && Number.isFinite(meta.value.entryCount)
    ? meta.value.entryCount
    : props.doc.entries.length,
)
</script>
