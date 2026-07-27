import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import vueDevTools from 'vite-plugin-vue-devtools'
import ViteFonts from 'unplugin-fonts/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // 按需引入 Vuetify 组件与样式，替代全量 import * as components
    vuetify({ autoImport: true }),
    vueDevTools(),
    ViteFonts({
      fontsource: {
        families: [
          {
            name: 'Roboto',
            weights: [100, 300, 400, 500, 700, 900],
            styles: ['normal', 'italic'],
          },
        ],
      },
    }),
    VitePWA({
      // prompt 而非 autoUpdate：静默重载会丢失滚动位置，且只存在内存中的本地文件会失效
      registerType: 'prompt',
      manifest: {
        name: 'Bookshelf',
        short_name: 'Bookshelf',
        description: '跑团日志阅读器',
        lang: 'zh-CN',
        theme_color: '#22DFF2',
        background_color: '#FFF3F8',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff,woff2,ttf,eot,svg,png,ico}'],
        runtimeCaching: [
          {
            // 已读过的日志离线可重读。这是 HTTP 传输层缓存，字节会留在 Cache Storage 中；
            // 不需要此行为时删掉本条即可，其余 PWA 能力不受影响
            urlPattern: /\.story$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'story-archives',
              expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    // trpg 是 link 依赖，其 msgpackr / fflate 需显式预构建才能被正确解析
    include: ['msgpackr', 'fflate', 'workbox-window'],
  },
})
