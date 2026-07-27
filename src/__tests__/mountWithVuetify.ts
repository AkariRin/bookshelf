/**
 * 组件测试的挂载辅助。
 *
 * Vuetify 组件依赖注入的主题/display/locale 上下文，直接 mount 会因缺少这些 provide 而报错，
 * 故统一经由本 helper 挂载。
 */
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import type { ComponentMountingOptions } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import type { Component } from 'vue'

/**
 * jsdom 不实现 ResizeObserver，而 Vuetify 的若干组件（v-virtual-scroll 等）依赖它。
 * 提供最小桩实现，避免测试因环境缺失而失败。
 */
function stubResizeObserver() {
  if ('ResizeObserver' in globalThis) return
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

export function mountWithVuetify<C extends Component>(
  component: C,
  options: ComponentMountingOptions<C> = {},
) {
  stubResizeObserver()
  setActivePinia(createPinia())

  // 全量注册而非按需：测试环境不经 vite-plugin-vuetify 的自动导入
  const vuetify = createVuetify({ components, directives })

  return mount(component, {
    ...options,
    global: {
      ...options.global,
      plugins: [vuetify, ...(options.global?.plugins ?? [])],
    },
  })
}
