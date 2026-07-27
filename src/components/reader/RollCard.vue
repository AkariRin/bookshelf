<!-- 结构化掷骰卡片：表达式、明细、检定项与成功等级。 -->
<template>
  <div class="d-flex ga-3 py-2">
    <ActorAvatar :actor="actor" />
    <div class="flex-grow-1 min-width-0">
      <div class="d-flex align-center ga-2 mb-1">
        <span class="text-body-2 font-weight-medium">{{ actor.name }}</span>
        <span class="text-caption text-medium-emphasis ml-auto">{{ formatOffset(offset) }}</span>
      </div>

      <v-card class="roll-card" variant="outlined">
        <div class="d-flex align-center ga-2 px-3 pt-2">
          <v-icon size="16" color="accent">mdi-dice-d20-outline</v-icon>
          <span v-if="roll.skill" class="text-body-2 font-weight-medium">{{ roll.skill }}</span>
          <span v-else class="text-body-2 font-weight-medium">掷骰</span>
          <span v-if="roll.target !== undefined" class="text-caption text-medium-emphasis">
            目标 {{ roll.target }}
          </span>
          <v-chip v-if="hidden" size="x-small" color="secondary" variant="tonal" class="ml-1">
            暗骰
          </v-chip>
          <v-spacer />
          <v-chip v-if="outcome.label" :color="outcome.color" size="small" variant="tonal">
            {{ outcome.label }}
          </v-chip>
        </div>

        <div v-if="concealed" class="px-3 py-2 text-caption text-medium-emphasis">
          暗骰内容已隐藏，可在显示设置中开启。
        </div>
        <div v-else class="px-3 py-2">
          <div class="detail text-body-2">{{ roll.detail }}</div>
          <div class="d-flex align-center ga-2 mt-1">
            <span class="text-caption text-medium-emphasis">{{ roll.expression }}</span>
            <v-spacer />
            <span class="text-h6 font-weight-bold">{{ roll.total }}</span>
          </div>
        </div>
      </v-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StoryActor, StoryRollPayload } from '@aemeath-projects/trpg/story'

import ActorAvatar from '@/components/reader/ActorAvatar.vue'
import { describeOutcome, formatOffset } from '@/composables/useStoryIndex'
import { useSettingsStore } from '@/stores/settings'

const props = defineProps<{ actor: StoryActor; offset: number; roll: StoryRollPayload }>()

const settings = useSettingsStore()

const hidden = computed(() => props.roll.hidden === true)
const concealed = computed(() => hidden.value && !settings.revealHiddenRolls)
const outcome = computed(() => describeOutcome(props.roll.outcome))
</script>

<style scoped>
.roll-card {
  border-radius: 8px;
}

.detail {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  overflow-wrap: anywhere;
}

.min-width-0 {
  min-width: 0;
}
</style>
