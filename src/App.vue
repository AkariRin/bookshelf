<template>
  <v-app>
    <!-- 顶部应用栏 -->
    <v-app-bar color="primary" flat :elevation="1">
      <a href="/" class="logo-link ms-4" @click.prevent="router.push('/')">
        <img src="/pwa-192x192.png" alt="Bookshelf" width="24" height="24" />
      </a>
      <v-app-bar-title class="font-weight-medium">
        {{ title }}
      </v-app-bar-title>
      <v-spacer />

      <v-tooltip text="GitHub" location="bottom">
        <template #activator="{ props }">
          <v-btn
            icon="mdi-github"
            v-bind="props"
            href="https://github.com/AkariRin/bookshelf"
            target="_blank"
            rel="noopener"
          />
        </template>
      </v-tooltip>
      <v-tooltip text="显示设置" location="bottom">
        <template #activator="{ props }">
          <v-btn icon="mdi-cog" v-bind="props" @click="dialogOpen = true" />
        </template>
      </v-tooltip>
    </v-app-bar>

    <!-- 主题偏好与阅读偏好设置对话框 -->
    <v-dialog :model-value="dialogOpen" max-width="340" @update:model-value="dialogOpen = $event">
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
            开启后可能向第三方服务器发起请求。
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
          <v-btn variant="text" @click="dialogOpen = false">
            <v-icon start>mdi-close</v-icon>
            关闭
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-main class="main-fill">
      <router-view />
    </v-main>

    <!-- Service Worker 更新提示 -->
    <v-snackbar :model-value="needRefresh" location="bottom" timeout="-1" color="info">
      <span class="text-body-2">有新版本可用</span>
      <template #actions>
        <v-btn variant="text" @click="closeUpdatePrompt">稍后</v-btn>
        <v-btn variant="text" @click="update">刷新</v-btn>
      </template>
    </v-snackbar>

    <v-snackbar :model-value="offlineReady" location="bottom" :timeout="3000" color="success">
      <span class="text-body-2">已可离线使用</span>
    </v-snackbar>
  </v-app>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from 'vuetify'
import { useRegisterSW } from 'virtual:pwa-register/vue'

import { useReaderChrome } from '@/composables/useReaderChrome'
import { useThemeStore, type ThemePreference } from '@/stores/theme'
import { useSettingsStore } from '@/stores/settings'

const router = useRouter()
const vuetifyTheme = useTheme()
const themeStore = useThemeStore()
const settings = useSettingsStore()
const { title } = useReaderChrome()
const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW()

const dialogOpen = ref(false)

const themePreference = computed({
  get: (): ThemePreference => themeStore.preference,
  set: (value: ThemePreference) => {
    themeStore.setPreference(value, vuetifyTheme)
  },
})

function update() {
  void updateServiceWorker(true)
}

function closeUpdatePrompt() {
  needRefresh.value = false
}

onMounted(() => {
  themeStore.initTheme(vuetifyTheme)
})
</script>

<style>
/* 让 v-main 的内容区撑满视口余高，使阅读页的虚拟滚动容器有确定高度可用 */
html,
body,
#app {
  height: 100%;
}

.main-fill > .v-main__wrap {
  height: 100%;
}

.logo-link {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}
</style>
