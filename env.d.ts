/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// 让 defineStore 的 persist 选项在所有 tsconfig 项目中都可见。
// 该选项来自 pinia-plugin-persistedstate 对 pinia 的模块增强，而增强只在插件被导入的程序里
// 生效——tsconfig.vitest.json 仅 include 测试文件，不含导入插件的 main.ts。
// 用 reference 而非 import：顶层 import 会把本文件变成模块，
// 使下方 ImportMetaEnv 的接口增强退化为模块内的局部声明而不再作用于全局。
/// <reference types="pinia-plugin-persistedstate" />

interface ImportMetaEnv {
  /**
   * S3 兼容存储的公开读取端点，不含结尾斜杠。
   * 例：https://story.example.com 或 https://pub-xxxx.r2.dev
   */
  readonly S3_ENDPOINT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
