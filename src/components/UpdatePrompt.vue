<!--
  Service Worker 更新提示。

  用 registerType: 'prompt' 而非自动重载：阅读到一半被静默刷新会丢失滚动位置，
  以及本地打开的文件（只在内存中）会直接失效。
-->
<template>
  <v-snackbar :model-value="needRefresh" location="bottom" timeout="-1" color="info">
    <span class="text-body-2">有新版本可用</span>
    <template #actions>
      <v-btn variant="text" @click="close">稍后</v-btn>
      <v-btn variant="text" @click="update">刷新</v-btn>
    </template>
  </v-snackbar>

  <v-snackbar :model-value="offlineReady" location="bottom" :timeout="3000" color="success">
    <span class="text-body-2">已可离线使用</span>
  </v-snackbar>
</template>

<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue'

const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW()

function update() {
  void updateServiceWorker(true)
}

function close() {
  needRefresh.value = false
}
</script>
