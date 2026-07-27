import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@/views/HomeView.vue'
import ReaderView from '@/views/ReaderView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/local',
      name: 'local',
      component: ReaderView,
      props: { source: 'local' },
    },
    {
      // 通配是必要的：R2 key 可能含斜杠表示子目录，普通 :name 只匹配单段
      path: '/read/:name(.*)',
      name: 'read',
      component: ReaderView,
      props: { source: 'r2' },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

export default router
