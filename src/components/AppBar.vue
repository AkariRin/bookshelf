<!--
  顶部应用栏。

  构成沿用 aemeath-frontend（primary 底色 + tooltip 包裹的图标按钮），但刻意不用其 prominent
  密度——阅读器要把垂直空间让给正文。
-->
<template>
  <v-app-bar color="primary" flat :elevation="1">
    <v-btn v-if="showBack" icon="mdi-arrow-left" @click="router.push('/')" />
    <v-icon v-else class="ms-4" size="24">mdi-bookshelf</v-icon>
    <v-app-bar-title class="font-weight-medium">
      {{ title }}
    </v-app-bar-title>
    <v-spacer />

    <v-tooltip v-if="infoAvailable" text="日志信息" location="bottom">
      <template #activator="{ props }">
        <v-btn
          icon="mdi-information-outline"
          v-bind="props"
          @click="infoOpen = !infoOpen"
        />
      </template>
    </v-tooltip>

    <v-tooltip text="显示设置" location="bottom">
      <template #activator="{ props }">
        <v-btn icon="mdi-tune-variant" v-bind="props" @click="dialogOpen = true" />
      </template>
    </v-tooltip>
    <v-tooltip text="GitHub" location="bottom">
      <template #activator="{ props }">
        <v-btn
          icon="mdi-github"
          v-bind="props"
          href="https://github.com/aemeath-projects"
          target="_blank"
          rel="noopener"
        />
      </template>
    </v-tooltip>
  </v-app-bar>

  <ThemeDialog :open="dialogOpen" @close="dialogOpen = false" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import ThemeDialog from '@/components/ThemeDialog.vue'
import { useReaderChrome } from '@/composables/useReaderChrome'

withDefaults(defineProps<{ showBack?: boolean }>(), { showBack: false })

const router = useRouter()
const dialogOpen = ref(false)
const { title, infoOpen, infoAvailable } = useReaderChrome()
</script>
