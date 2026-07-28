<!-- 阅读页：加载 / 口令 / 错误 / 正文四种形态。 -->
<template>
  <div class="reader d-flex flex-column">
    <!-- 加载中：骨架屏，结构与正文完全一致，避免额外 DOM 层级导致错位 -->
    <template v-if="isBusy">
      <!-- 团信息栏骨架 -->
      <div class="party-info-bar d-flex align-center ga-3 px-4 py-2">
        <div class="skel-bar" style="width: 140px; height: 18px" />
        <div class="skel-bar" style="width: 72px; height: 16px" />
        <div class="skel-bar" style="width: 56px; height: 16px" />
        <div class="skel-bar" style="width: 100px; height: 16px" />
      </div>

      <v-divider />

      <!-- 人物卡栏骨架 -->
      <div class="character-bar d-flex align-center ga-2 px-4 py-2">
        <div class="skel-bar" style="width: 52px; height: 14px" />
        <div v-for="n in 4" :key="n" class="skel-chip" style="width: 72px; height: 24px" />
      </div>

      <v-divider />

      <!-- 条目时间线骨架 -->
      <div class="timeline-wrap flex-grow-1">
        <v-container style="max-width: 800px" class="py-2">
          <div class="text-body-2 text-medium-emphasis mb-3">
            {{ state === 'fetching' ? '正在获取日志…' : '正在解析…' }}
          </div>
          <div v-for="n in 6" :key="n" class="d-flex ga-3 py-2">
            <div class="skel-circle" style="width: 36px; height: 36px" />
            <div class="flex-grow-1">
              <div class="skel-bar mb-1" style="width: 72px; height: 14px" />
              <div
                class="skel-bar"
                :style="{ width: n % 3 === 0 ? '60%' : '100%', height: '14px' }"
              />
              <div
                class="skel-bar mt-1"
                :style="{ width: n % 2 === 0 ? '45%' : '85%', height: '14px' }"
              />
            </div>
          </div>
        </v-container>
      </div>
    </template>

    <!-- 需要口令 -->
    <div v-else-if="state === 'need-password'" class="flex-grow-1 d-flex align-center justify-center pa-4">
      <div style="max-width: 420px; width: 100%">
        <v-empty-state class="password-empty-state">
          <template #media>
            <img src="/pwa-192x192.png" alt="Bookshelf" width="48" height="48" />
          </template>
          <template #title>
            <h1 class="text-h4 font-weight-bold">此日志已加密</h1>
          </template>
          <template #text>
            <p class="text-body-2 text-medium-emphasis">输入口令以阅读内容。</p>
          </template>
          <template #default>
            <v-form @submit.prevent="doSubmitPassword">
              <v-text-field
                v-model="passwordInput"
                :append-inner-icon="passwordVisible ? 'mdi-eye-off' : 'mdi-eye'"
                :type="passwordVisible ? 'text' : 'password'"
                :error-messages="passwordError"
                :hint="`至少 ${MIN_PASSWORD_LENGTH} 个字符`"
                autofocus
                label="密码"
                variant="underlined"
                @click:append-inner="passwordVisible = !passwordVisible"
              />
              <v-btn
                :disabled="!canSubmitPassword"
                block
                color="primary"
                type="submit"
                class="mt-2"
              >
                解密
              </v-btn>
            </v-form>
          </template>
        </v-empty-state>
      </div>
    </div>

    <!-- 出错 -->
    <div v-else-if="state === 'error'" class="flex-grow-1 d-flex align-center justify-center pa-4">
      <v-empty-state>
        <template #media>
          <img src="/pwa-192x192.png" alt="Bookshelf" width="48" height="48" />
        </template>
        <template #title>
          <h1 class="text-h4 font-weight-bold">无法打开</h1>
        </template>
        <template #text>
          <p class="text-body-2 text-medium-emphasis">{{ errorMessage }}</p>
        </template>
        <template #actions>
          <v-btn variant="text" @click="router.push('/')">返回首页</v-btn>
          <v-btn v-if="canRetry" color="primary" variant="tonal" @click="load">重试</v-btn>
        </template>
      </v-empty-state>
    </div>

    <!-- 本地文件已失效（刷新后 File 丢失） -->
    <div v-else-if="state === 'idle'" class="flex-grow-1 d-flex align-center justify-center pa-4">
      <v-empty-state>
        <template #media>
          <img src="/pwa-192x192.png" alt="Bookshelf" width="48" height="48" />
        </template>
        <template #title>
          <h1 class="text-h4 font-weight-bold">请重新选择文件</h1>
        </template>
        <template #text>
          <p class="text-body-2 text-medium-emphasis">本地文件只在打开期间保留在内存中，刷新页面后需要重新选择。</p>
        </template>
        <template #actions>
          <v-btn color="primary" variant="tonal" @click="router.push('/')">回到首页</v-btn>
        </template>
      </v-empty-state>
    </div>

    <!-- 正文 -->
    <template v-else-if="doc">
      <!-- 团信息栏：直接展示在顶部，替代原右侧抽屉 -->
      <div class="party-info-bar d-flex align-center ga-3 px-4 py-2 flex-wrap">
        <div class="d-flex align-center ga-1">
          <v-icon size="18" color="medium-emphasis">mdi-book-open-variant</v-icon>
          <span class="text-body-2 font-weight-medium">{{ doc.meta.logName }}</span>
        </div>
        <v-divider vertical length="16" />
        <div class="d-flex align-center ga-1">
          <v-icon size="16" color="medium-emphasis">mdi-account-tie</v-icon>
          <span class="text-caption">{{ resolveKpName(doc) }}</span>
        </div>
        <v-divider vertical length="16" />
        <span class="text-caption text-medium-emphasis">{{
          formatDuration(doc.meta.durationMs)
        }}</span>
        <v-divider vertical length="16" />
        <span class="text-caption text-medium-emphasis">{{ resolveEntryCount(doc) }} 条</span>
        <v-divider vertical length="16" />
        <span class="text-caption text-medium-emphasis">{{
          formatTimestamp(doc.meta.startedAt)
        }}</span>
        <v-divider vertical length="16" />
        <span class="text-caption text-medium-emphasis">来源：{{ doc.meta.source }}</span>
        <v-divider vertical length="16" />
        <span class="text-caption text-medium-emphasis">格式：v{{ storyVersion }}</span>
        <v-divider vertical length="16" />
        <span v-if="storyCompression !== 'none'" class="text-caption text-medium-emphasis"
          >已压缩</span
        >
        <v-divider v-if="storyCompression !== 'none'" vertical length="16" />
        <span v-if="isEncrypted" class="text-caption text-medium-emphasis">已加密</span>
      </div>

      <v-divider />

      <!-- 人物卡栏：可点击 chips，点击弹出 dialog 详情 -->
      <div
        v-if="doc.characters.length > 0"
        class="character-bar d-flex align-center ga-2 px-4 py-2 flex-wrap"
      >
        <span class="text-caption text-medium-emphasis">人物卡：</span>
        <v-chip
          v-for="(char, i) in doc.characters"
          :key="i"
          size="small"
          variant="tonal"
          label
          @click="openCharacter(char)"
        >
          <v-icon start size="14">mdi-card-account-details-outline</v-icon>
          {{ char.name }}
          <span class="text-caption text-medium-emphasis ml-1">{{ char.ruleset }}</span>
        </v-chip>
      </div>

      <v-divider v-if="doc.characters.length > 0" />

      <!-- 人物卡详情对话框 -->
      <v-dialog v-model="charDialogOpen" max-width="420">
        <v-card v-if="selectedCharacter">
          <v-card-title class="d-flex align-center ga-2">
            <v-icon>mdi-card-account-details-outline</v-icon>
            {{ selectedCharacter.name }}
            <v-chip size="x-small" variant="tonal">{{ selectedCharacter.ruleset }}</v-chip>
          </v-card-title>
          <v-card-subtitle>
            持卡人：{{ doc.actors[selectedCharacter.owner]?.name ?? '未知' }}
            <template v-if="selectedCharacter.houserule">
              · 房规 {{ selectedCharacter.houserule }}</template
            >
          </v-card-subtitle>
          <v-card-text>
            <div v-if="attrEntries(selectedCharacter).length > 0" class="attr-grid">
              <div
                v-for="[key, value] in attrEntries(selectedCharacter)"
                :key="key"
                class="attr-item"
              >
                <span class="text-caption text-medium-emphasis">{{ key }}</span>
                <span class="text-body-2 font-weight-medium">{{ value }}</span>
              </div>
            </div>
            <p v-else class="text-caption">该卡未记录属性。</p>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="charDialogOpen = false">关闭</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- 条目时间线 -->
      <div class="timeline-wrap flex-grow-1" :class="`font-${settings.fontScale}`">
        <v-container class="py-2" style="max-width: 800px; height: 100%">
          <v-virtual-scroll :items="entries" :item-height="undefined" class="timeline">
            <template #default="{ item }">
              <!-- 发言气泡 -->
              <div v-if="item.kind === 'message'" class="d-flex ga-3 py-2">
                <ActorAvatar :actor="item.actor" />
                <div class="flex-grow-1 min-width-0">
                  <div class="d-flex align-center ga-2 mb-1">
                    <span class="text-body-2 font-weight-medium">{{ item.actor.name }}</span>
                    <span
                      v-if="item.actor.characterName"
                      class="text-caption character-link"
                      @click="openCharacterByName(item.actor.characterName)"
                    >
                      {{ item.actor.characterName }}
                    </span>
                    <span class="text-caption text-medium-emphasis ml-auto">{{
                      formatOffset(item.offset)
                    }}</span>
                  </div>
                  <div class="bubble text-body-2">{{ item.text }}</div>
                </div>
              </div>

              <!-- 掷骰卡片 -->
              <div v-else-if="item.kind === 'roll'" class="d-flex ga-3 py-2">
                <ActorAvatar :actor="item.actor" />
                <div class="flex-grow-1 min-width-0">
                  <div class="d-flex align-center ga-2 mb-1">
                    <span class="text-body-2 font-weight-medium">{{ item.actor.name }}</span>
                    <span class="text-caption text-medium-emphasis ml-auto">{{
                      formatOffset(item.offset)
                    }}</span>
                  </div>

                  <v-card class="roll-card" elevation="2">
                    <div class="d-flex align-center ga-2 px-3 pt-2">
                      <v-icon size="16" color="accent">mdi-dice-d20-outline</v-icon>
                      <span v-if="item.roll.skill" class="text-body-2 font-weight-medium">{{
                        item.roll.skill
                      }}</span>
                      <span v-else class="text-body-2 font-weight-medium">掷骰</span>
                      <span
                        v-if="item.roll.target !== undefined"
                        class="text-caption text-medium-emphasis"
                      >
                        目标 {{ item.roll.target }}
                      </span>
                      <v-chip
                        v-if="item.roll.hidden"
                        size="x-small"
                        color="secondary"
                        variant="tonal"
                        class="ml-1"
                      >
                        暗骰
                      </v-chip>
                      <v-spacer />
                      <v-chip
                        v-if="rollOutcomeLabel(item.roll)"
                        :color="rollOutcomeColor(item.roll)"
                        size="small"
                        variant="tonal"
                      >
                        {{ rollOutcomeLabel(item.roll) }}
                      </v-chip>
                    </div>

                    <div
                      v-if="isRollConcealed(item.roll)"
                      class="px-3 py-2 text-caption text-medium-emphasis"
                    >
                      暗骰内容已隐藏，可在显示设置中开启。
                    </div>
                    <div v-else class="px-3 py-2">
                      <div class="detail text-body-2">{{ item.roll.detail }}</div>
                      <div class="d-flex align-center ga-2 mt-1">
                        <span class="text-caption text-medium-emphasis">{{
                          item.roll.expression
                        }}</span>
                        <v-spacer />
                        <span class="text-h6 font-weight-bold">{{ item.roll.total }}</span>
                      </div>
                    </div>
                  </v-card>
                </div>
              </div>

              <!-- 回退：无法识别的条目按纯文本气泡渲染 -->
              <div v-else class="d-flex ga-3 py-2">
                <ActorAvatar :actor="item.actor" />
                <div class="flex-grow-1 min-width-0">
                  <div class="d-flex align-center ga-2 mb-1">
                    <span class="text-body-2 font-weight-medium">{{ item.actor.name }}</span>
                    <span
                      v-if="item.actor.characterName"
                      class="text-caption character-link"
                      @click="openCharacterByName(item.actor.characterName)"
                    >
                      {{ item.actor.characterName }}
                    </span>
                    <span class="text-caption text-medium-emphasis ml-auto">{{
                      formatOffset(item.offset)
                    }}</span>
                  </div>
                  <div class="bubble text-body-2">{{ item.text || '（本条内容无法识别）' }}</div>
                </div>
              </div>
            </template>
          </v-virtual-scroll>
        </v-container>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { StoryCharacter, StoryDocument, StoryRollPayload } from '@aemeath-projects/trpg/story'
import { MIN_PASSWORD_LENGTH } from '@aemeath-projects/trpg/story'

import ActorAvatar from '@/components/reader/ActorAvatar.vue'
import { useStoryLoader } from '@/composables/useStoryLoader'
import { useLocalStoryFile } from '@/composables/useLocalStoryFile'
import {
  describeOutcome,
  formatDuration,
  formatOffset,
  formatTimestamp,
  toDisplayEntries,
} from '@/composables/useStoryIndex'
import { useReaderChrome } from '@/composables/useReaderChrome'
import { useSettingsStore } from '@/stores/settings'

const props = defineProps<{ source: 's3' | 'local' }>()

const route = useRoute()
const router = useRouter()
const settings = useSettingsStore()
const { takeFile } = useLocalStoryFile()
const { setTitle, reset: resetChrome } = useReaderChrome()

const {
  state,
  errorMessage,
  passwordError,
  doc,
  isEncrypted,
  storyVersion,
  storyCompression,
  isBusy,
  loadFromS3,
  loadFromFile,
  submitPassword,
} = useStoryLoader()

// 口令输入 state
const passwordInput = ref('')
const passwordVisible = ref(false)
const canSubmitPassword = computed(() => passwordInput.value.length >= MIN_PASSWORD_LENGTH)

function doSubmitPassword() {
  if (!canSubmitPassword.value) return
  submitPassword(passwordInput.value)
}

// 人物卡对话框 state
const charDialogOpen = ref(false)
const selectedCharacter = ref<StoryCharacter>()

function openCharacter(char: StoryCharacter) {
  selectedCharacter.value = char
  charDialogOpen.value = true
}

/** 按角色名从人物卡列表中查找对应卡并打开 dialog。 */
function openCharacterByName(name: string) {
  if (!doc.value) return
  const char = doc.value.characters.find((c) => c.name === name)
  if (char) openCharacter(char)
}

// 掷骰显示 helpers
function isRollConcealed(roll: StoryRollPayload): boolean {
  return roll.hidden === true && !settings.revealHiddenRolls
}

function rollOutcomeLabel(roll: StoryRollPayload): string {
  return describeOutcome(roll.outcome).label
}

function rollOutcomeColor(roll: StoryRollPayload): string {
  return describeOutcome(roll.outcome).color
}

// 人物卡 helpers
function attrEntries(char: StoryCharacter): [string, number][] {
  return Object.entries(char.attributes ?? {})
}

// 元信息 helpers
function resolveKpName(d: StoryDocument): string {
  const actor = d.actors.find((a) => a.id === d.meta.createdBy)
  return actor?.name ?? d.meta.createdBy
}

function resolveEntryCount(d: StoryDocument): number {
  return typeof d.meta.entryCount === 'number' && Number.isFinite(d.meta.entryCount)
    ? d.meta.entryCount
    : d.entries.length
}

// 核心逻辑
const name = computed(() => {
  const raw = route.params.name
  return Array.isArray(raw) ? raw.join('/') : (raw ?? '')
})

// 本地来源无法重试：File 已被消费，重新加载需用户再次选择
const canRetry = computed(() => props.source === 's3')

const entries = computed(() => (doc.value ? toDisplayEntries(doc.value) : []))

// AppBar 标题跟着文档走：文档就绪后显示日志名，否则退回路由参数
watch(
  [doc, name],
  () => {
    setTitle(doc.value?.meta.logName ?? (name.value === '' ? '阅读' : name.value))
  },
  { immediate: true },
)

onUnmounted(resetChrome)

function load() {
  if (props.source === 's3') {
    void loadFromS3(name.value)
    return
  }
  const file = takeFile()
  // 无文件时停在 idle，由模板显示「请重新选择」——刷新后 File 丢失是既定行为，不是错误
  if (file) void loadFromFile(file)
}

onMounted(load)

// 同一路由下切换日志名（如从收藏直接跳转）需重新加载
watch(name, () => {
  if (props.source === 's3') load()
})
</script>

<style scoped>
.reader {
  height: 100%;
}

/* 团信息栏 */
.party-info-bar {
  background: rgba(var(--v-theme-on-surface), 0.03);
  min-height: 40px;
}

/* 人物卡栏 */
.character-bar {
  min-height: 36px;
}

.timeline-wrap {
  min-height: 0;
}

.font-sm {
  font-size: 0.875rem;
}

.font-md {
  font-size: 1rem;
}

.font-lg {
  font-size: 1.125rem;
}

/* 条目时间线 */
.timeline {
  /* 让虚拟滚动容器撑满可用高度，滚动条归它而非页面 */
  height: 100%;
}

/* 虚拟滚动条目右侧留白，防止内容（elevation 阴影等）被 overflow 裁剪 */
.timeline :deep(.v-virtual-scroll__item) {
  padding-right: 6px;
}

/* 发言气泡 */
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

/* 可点击角色名 */
.character-link {
  cursor: pointer;
  border-bottom: 1px dashed currentColor;
  transition: color 0.15s;
}
.character-link:hover {
  color: rgb(var(--v-theme-primary));
  opacity: 1;
}

/* 掷骰卡片 */
.roll-card {
  border-radius: 8px;
  /* 防止 elevation 阴影被虚拟滚动容器的 overflow 裁剪 */
  margin-right: 6px;
}

.detail {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  overflow-wrap: anywhere;
}

/* 人物卡属性网格 */
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

/* v-empty-state 的 content 区域默认不撑满，导致内部表单被挤窄 */
.password-empty-state :deep(.v-empty-state__content) {
  width: 100%;
}

/* ---- 骨架屏（自定义元素，避免 v-skeleton-loader 内置固定尺寸/margin 干扰布局）---- */
.skel-bar,
.skel-chip,
.skel-circle {
  background: rgba(var(--v-theme-on-surface), var(--v-border-opacity));
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
}

.skel-bar {
  border-radius: 4px;
}

.skel-chip {
  border-radius: 12px;
}

.skel-circle {
  border-radius: 50%;
}

/* 微光动画 */
.skel-bar::after,
.skel-chip::after,
.skel-circle::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(var(--v-theme-on-surface), 0.05) 40%,
    rgba(var(--v-theme-on-surface), 0.08) 50%,
    rgba(var(--v-theme-on-surface), 0.05) 60%,
    transparent 100%
  );
  transform: translateX(-100%);
  animation: skel-shimmer 1.5s infinite;
}

@keyframes skel-shimmer {
  100% {
    transform: translateX(100%);
  }
}
</style>
