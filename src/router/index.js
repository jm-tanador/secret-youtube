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

let cachedUserIp = null;

async function getUserIp() {
  if (cachedUserIp) return cachedUserIp;

  try {
    // Specify the full URL of your running backend server (e.g. Laravel port 8000)
    const backendUrl = 'https://backend-production-5b9e.up.railway.app/api'; 
    
    const response = await fetch(backendUrl);
    const data = await response.json();
    cachedUserIp = data.ip; 
    return cachedUserIp;
  } catch (error) {
    console.error("Failed to detect client IP:", error);
    return null;
  }
}

// Router Guard to check IP permissions before entering a route
router.beforeEach(async (to, from, next) => {
  // Always allow access to '/sorry' to prevent infinite redirection loops
  if (to.path === '/sorry') {
    return next();
  }

  const allowedIp = "10.169.142.172";
  const userIp = await getUserIp();


  if (userIp == allowedIp) {
    next(); // IP matches, allow access to '/' or '/watch/:id'
  } else {
    console.log(userIp);
    next({ name: 'sorry' }); // Redirect unauthorized users
  }
});

export default router;