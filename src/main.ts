import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import 'unfonts.css'

import App from './App.vue'
import router from './router'
import { createAppVuetify } from './plugins/vuetify'
import { useThemeStore } from './stores/theme'

const app = createApp(App)
const pinia = createPinia().use(piniaPluginPersistedstate)
app.use(pinia)

// 先读出持久化的主题选择，据此构造 Vuetify，避免首帧渲染默认配色再跳变成品牌色
const themeStore = useThemeStore()

app.use(router)
app.use(createAppVuetify(themeStore.theme))
app.mount('#app')
