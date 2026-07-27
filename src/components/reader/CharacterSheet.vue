<!--
  人物卡快照。

  attributes 是松散 KV（CoC7 是八围+百分制技能，DnD5e 形状完全不同），故按 ruleset
  分派解读没有意义，统一以键值对列出。
-->
<template>
  <div>
    <v-expansion-panels v-if="characters.length > 0" variant="accordion" class="mb-2">
      <v-expansion-panel v-for="(char, i) in characters" :key="i">
        <v-expansion-panel-title>
          <div class="d-flex align-center ga-2">
            <v-icon size="18">mdi-card-account-details-outline</v-icon>
            <span class="text-body-2 font-weight-medium">{{ char.name }}</span>
            <v-chip size="x-small" variant="tonal">{{ char.ruleset }}</v-chip>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="text-caption text-medium-emphasis mb-2">
            持卡人：{{ ownerName(char.owner) }}
            <template v-if="char.houserule"> · 房规 {{ char.houserule }}</template>
          </div>
          <div v-if="attrEntries(char).length > 0" class="attr-grid">
            <div v-for="[key, value] in attrEntries(char)" :key="key" class="attr-item">
              <span class="text-caption text-medium-emphasis">{{ key }}</span>
              <span class="text-body-2 font-weight-medium">{{ value }}</span>
            </div>
          </div>
          <div v-else class="text-caption text-medium-emphasis">该卡未记录属性。</div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <p v-else class="text-caption text-medium-emphasis px-4 py-2">本场团未记录人物卡。</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StoryCharacter, StoryDocument } from '@aemeath-projects/trpg/story'

const props = defineProps<{ doc: StoryDocument }>()

const characters = computed(() => props.doc.characters)

/** owner 是 actors 的下标，已由解析器保证不越界，但类型上仍可空。 */
function ownerName(owner: number): string {
  return props.doc.actors[owner]?.name ?? '未知'
}

/** attributes 的值理论上是 number，但未经逐项校验，非数字原样透传给模板显示。 */
function attrEntries(char: StoryCharacter): [string, number][] {
  return Object.entries(char.attributes ?? {})
}
</script>

<style scoped>
.attr-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 8px;
}

.attr-item {
  display: flex;
  flex-direction: column;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 6px;
  padding: 4px 8px;
}
</style>
