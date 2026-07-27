<template>
  <v-app>
    <AppBar :show-back="showBack" />

    <v-main class="main-fill">
      <router-view />
    </v-main>

    <UpdatePrompt />
  </v-app>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTheme } from 'vuetify'

import AppBar from '@/components/AppBar.vue'
import UpdatePrompt from '@/components/UpdatePrompt.vue'
import { useThemeStore } from '@/stores/theme'

const route = useRoute()
const vuetifyTheme = useTheme()
const themeStore = useThemeStore()

const showBack = computed(() => route.name !== 'home')

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
</style>
