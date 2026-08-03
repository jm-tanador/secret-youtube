import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import WatchView from '../views/WatchView.vue';
import AboutView from '@/views/AboutView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/watch/:id',
      name: 'watch',
      component: WatchView
    },
    {
      path: '/sorry',
      name: 'sorry',
      component: AboutView
    }
  ]
});

export default router;