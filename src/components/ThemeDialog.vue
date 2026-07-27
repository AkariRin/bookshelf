<!-- 主题偏好与阅读偏好设置对话框。 -->
<template>
  <v-dialog :model-value="open" max-width="340" @update:model-value="emit('close')">
    <v-card>
      <v-card-title>显示设置</v-card-title>
      <v-card-text>
        <div class="text-subtitle-2 mb-1">主题</div>
        <v-radio-group v-model="themePreference" density="compact" hide-details mandatory>
          <v-radio label="浅色模式" value="light" />
          <v-radio label="深色模式" value="dark" />
          <v-radio label="跟随系统设置" value="followOS" />
        </v-radio-group>

        <v-divider class="my-4" />

        <div class="text-subtitle-2 mb-2">正文字号</div>
        <v-btn-toggle
          v-model="settings.fontScale"
          color="primary"
          density="compact"
          mandatory
          variant="outlined"
        >
          <v-btn value="sm" size="small">小</v-btn>
          <v-btn value="md" size="small">中</v-btn>
          <v-btn value="lg" size="small">大</v-btn>
        </v-btn-toggle>

        <v-divider class="my-4" />

        <v-switch
          v-model="settings.loadRemoteAvatars"
          color="primary"
          density="compact"
          hide-details
          label="加载远程头像"
        />
        <p class="text-caption text-medium-emphasis mt-1 mb-3">
          头像存放在聊天平台的服务器上。开启会向第三方发起请求，离线时无法显示。
        </p>

        <v-switch
          v-model="settings.revealHiddenRolls"
          color="primary"
          density="compact"
          hide-details
          label="显示暗骰内容"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="emit('close')">
          <v-icon start>mdi-close</v-icon>
          关闭
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from 'vuetify'

import { useThemeStore, type ThemePreference } from '@/stores/theme'
import { useSettingsStore } from '@/stores/settings'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const vuetifyTheme = useTheme()
const themeStore = useThemeStore()
const settings = useSettingsStore()

const themePreference = computed({
  get: (): ThemePreference => themeStore.preference,
  set: (value: ThemePreference) => {
    themeStore.setPreference(value, vuetifyTheme)
  },
})
</script>
