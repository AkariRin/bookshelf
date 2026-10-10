import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      server: {
        deps: {
          // Vuetify 的各组件模块分别 import 自己的 .css，被 externalize 后 node 无法解析该
          // 扩展名。内联进转换管线，交由 vite 处理样式导入。
          inline: ['vuetify'],
        },
      },
    },
  }),
)
