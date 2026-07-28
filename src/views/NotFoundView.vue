<!-- 404 页面：使用 v-empty-state 组件，与首页和其他空状态页面保持一致的视觉语言。 -->
<template>
  <v-container class="py-8" style="max-width: 720px">
    <v-empty-state>
      <template #media>
        <img src="/pwa-192x192.png" alt="Bookshelf" width="48" height="48" />
      </template>
      <template #title>
        <h1 class="text-h4 font-weight-bold">页面未找到</h1>
      </template>
      <template #text>
        <p class="text-body-2 text-medium-emphasis">您访问的地址不存在，请检查链接是否正确。</p>
      </template>
      <template #actions>
        <v-btn color="primary" variant="tonal" @click="router.push('/')">返回首页</v-btn>
      </template>
    </v-empty-state>
  </v-container>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>
