<!-- 阅读页：加载 / 口令 / 错误 / 正文四种形态。 -->
<template>
  <div class="reader d-flex flex-column">
    <!-- 加载中 -->
    <div v-if="isBusy" class="flex-grow-1 d-flex flex-column align-center justify-center ga-3">
      <v-progress-circular color="primary" indeterminate size="40" />
      <span class="text-body-2 text-medium-emphasis">
        {{ state === 'fetching' ? '正在获取日志…' : '正在解析…' }}
      </span>
    </div>

    <!-- 需要口令 -->
    <div v-else-if="state === 'need-password'" class="flex-grow-1 d-flex align-center pa-4">
      <PasswordPrompt
        class="flex-grow-1"
        :busy="false"
        :error-message="passwordError"
        @submit="submitPassword"
      />
    </div>

    <!-- 出错 -->
    <div v-else-if="state === 'error'" class="flex-grow-1 d-flex align-center justify-center pa-4">
      <v-card class="mx-auto" max-width="440" variant="outlined">
        <v-card-item>
          <div class="d-flex align-center ga-2">
            <v-icon color="error">mdi-alert-circle-outline</v-icon>
            <span class="text-subtitle-1 font-weight-medium">无法打开</span>
          </div>
        </v-card-item>
        <v-card-text class="text-body-2">{{ errorMessage }}</v-card-text>
        <v-card-actions>
          <v-btn variant="text" @click="router.push('/')">返回首页</v-btn>
          <v-spacer />
          <v-btn v-if="canRetry" color="primary" variant="tonal" @click="load">重试</v-btn>
        </v-card-actions>
      </v-card>
    </div>

    <!-- 本地文件已失效（刷新后 File 丢失） -->
    <div v-else-if="state === 'idle'" class="flex-grow-1 d-flex align-center justify-center pa-4">
      <v-card class="mx-auto" max-width="420" variant="outlined">
        <v-card-item>
          <div class="d-flex align-center ga-2">
            <v-icon color="info">mdi-file-question-outline</v-icon>
            <span class="text-subtitle-1 font-weight-medium">请重新选择文件</span>
          </div>
        </v-card-item>
        <v-card-text class="text-body-2 text-medium-emphasis">
          本地文件只在打开期间保留在内存中，刷新页面后需要重新选择。
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="tonal" @click="router.push('/')">回到首页</v-btn>
        </v-card-actions>
      </v-card>
    </div>

    <!-- 正文 -->
    <template v-else-if="doc">
      <v-navigation-drawer v-model="infoOpen" location="right" temporary width="320">
        <StoryMetaPanel :doc="doc" :encrypted="isEncrypted" />
        <v-divider class="my-2" />
        <div class="text-caption text-medium-emphasis px-4 pb-1">人物卡</div>
        <CharacterSheet :doc="doc" />
      </v-navigation-drawer>

      <div class="timeline-wrap flex-grow-1" :class="`font-${settings.fontScale}`">
        <v-container class="py-2" style="max-width: 800px; height: 100%">
          <StoryTimeline :entries="entries" />
        </v-container>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import PasswordPrompt from '@/components/reader/PasswordPrompt.vue'
import StoryTimeline from '@/components/reader/StoryTimeline.vue'
import StoryMetaPanel from '@/components/reader/StoryMetaPanel.vue'
import CharacterSheet from '@/components/reader/CharacterSheet.vue'
import { useStoryLoader } from '@/composables/useStoryLoader'
import { useLocalStoryFile } from '@/composables/useLocalStoryFile'
import { toDisplayEntries } from '@/composables/useStoryIndex'
import { useReaderChrome } from '@/composables/useReaderChrome'
import { useSettingsStore } from '@/stores/settings'

const props = defineProps<{ source: 'r2' | 'local' }>()

const route = useRoute()
const router = useRouter()
const settings = useSettingsStore()
const { takeFile } = useLocalStoryFile()
const { infoOpen, setTitle, setInfoAvailable, reset: resetChrome } = useReaderChrome()

const {
  state,
  errorMessage,
  passwordError,
  doc,
  isEncrypted,
  isBusy,
  loadFromR2,
  loadFromFile,
  submitPassword,
} = useStoryLoader()

const name = computed(() => {
  const raw = route.params.name
  return Array.isArray(raw) ? raw.join('/') : (raw ?? '')
})

// 本地来源无法重试：File 已被消费，重新加载需用户再次选择
const canRetry = computed(() => props.source === 'r2')

const entries = computed(() => (doc.value ? toDisplayEntries(doc.value) : []))

// AppBar 标题跟着文档走：文档就绪后显示日志名，否则退回路由参数
watch(
  [doc, name],
  () => {
    setTitle(doc.value?.meta.logName ?? (name.value === '' ? '阅读' : name.value))
    setInfoAvailable(doc.value !== undefined)
  },
  { immediate: true },
)

onUnmounted(resetChrome)

function load() {
  if (props.source === 'r2') {
    void loadFromR2(name.value)
    return
  }
  const file = takeFile()
  // 无文件时停在 idle，由模板显示「请重新选择」——刷新后 File 丢失是既定行为，不是错误
  if (file) void loadFromFile(file)
}

onMounted(load)

// 同一路由下切换日志名（如从收藏直接跳转）需重新加载
watch(name, () => {
  if (props.source === 'r2') load()
})
</script>

<style scoped>
.reader {
  height: 100%;
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
</style>
