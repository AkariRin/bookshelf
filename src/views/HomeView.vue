<!-- 首页：本地文件打开与按名称打开远程日志两条入口。 -->
<template>
  <v-container class="py-8" style="max-width: 720px">
    <v-empty-state class="home-empty-state">
      <template #media>
        <img src="/pwa-192x192.png" alt="Bookshelf" width="48" height="48" />
      </template>
      <template #title>
        <h1 class="text-h4 font-weight-bold">Bookshelf</h1>
      </template>
      <template #text>
        <p class="text-body-2 text-medium-emphasis">跑团日志阅读器</p>
      </template>

      <template #default>
        <v-card
          class="drop-zone mb-6"
          :class="{ 'drop-zone--active': dragging }"
          @click="picker?.click()"
          @dragenter.prevent="dragging = true"
          @dragover.prevent="dragging = true"
          @dragleave.prevent="dragging = false"
          @drop.prevent="onDrop"
        >
          <div class="d-flex flex-column align-center py-10 px-4 text-center">
            <v-icon size="40" color="primary">mdi-file-upload-outline</v-icon>
            <p class="text-body-1 font-weight-medium mt-3">拖入 .story 文件，或点击选择</p>
            <p class="text-caption text-medium-emphasis mt-1">
              文件只在本次浏览中打开，不会被保存或上传
            </p>
          </div>
        </v-card>

        <input ref="picker" type="file" accept=".story" class="d-none" @change="onPick" />

        <template v-if="hasEndpoint">
          <div class="d-flex align-center ga-3 mb-4">
            <v-divider />
            <span class="text-caption text-medium-emphasis">或</span>
            <v-divider />
          </div>

          <v-form @submit.prevent="openRemote">
            <v-text-field
              v-model="remoteName"
              label="日志名称"
              hint="对应远程存储中的文件名，无需输入 .story 后缀"
              prepend-inner-icon="mdi-cloud-outline"
              variant="outlined"
              @keydown.enter.prevent="openRemote"
            >
              <template #append>
                <v-btn :disabled="remoteName.trim() === ''" color="primary" @click="openRemote">
                  打开
                </v-btn>
              </template>
            </v-text-field>
          </v-form>
        </template>

      </template>
    </v-empty-state>
  </v-container>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'

import { hasS3Endpoint } from '@/services/storySource'
import { useLocalStoryFile } from '@/composables/useLocalStoryFile'

const router = useRouter()
const picker = useTemplateRef<HTMLInputElement>('picker')
const { setFile } = useLocalStoryFile()

const dragging = ref(false)
const remoteName = ref('')
const hasEndpoint = hasS3Endpoint()

function openLocal(file: File) {
  setFile(file)
  void router.push('/read')
}

function onDrop(event: DragEvent) {
  dragging.value = false
  const file = event.dataTransfer?.files[0]
  if (file) openLocal(file)
}

function onPick(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) openLocal(file)
  // 清空 value，使再次选择同一文件仍能触发 change
  input.value = ''
}

function openRemote() {
  const name = remoteName.value.trim()
  if (name === '') return
  void router.push(`/read/${name.split('/').map(encodeURIComponent).join('/')}`)
}
</script>

<style scoped>
.drop-zone {
  border-style: dashed;
  border-width: 2px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.drop-zone--active {
  background: rgba(var(--v-theme-primary), 0.08);
}

/* v-empty-state 的 content 区域默认不撑满，导致内部卡片被挤窄 */
.home-empty-state :deep(.v-empty-state__content) {
  width: 100%;
}
</style>
