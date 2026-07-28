import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@/views/HomeView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
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
      path: '/read',
      name: 'local',
      component: ReaderView,
      props: { source: 'local' },
    },
    {
      // 通配是必要的：S3 key 可能含斜杠表示子目录，普通 :name 只匹配单段
      path: '/read/:name(.*)',
      name: 'read',
      component: ReaderView,
      props: { source: 's3' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
    },
  ],
})

export default router
