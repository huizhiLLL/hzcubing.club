import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/records',
      name: 'records',
      component: () => import('../views/RecordsView.vue'),
      // 记录页面不需要认证
      meta: { requiresAuth: false }
    },
    {
      path: '/leaderboard',
      name: 'leaderboard',
      component: () => import('../views/LeaderboardView.vue'),
      // 排行榜页面不需要认证
      meta: { requiresAuth: false }
    },
    {
      path: '/submit-record',
      name: 'submit-record',
      component: () => import('../views/SubmitRecordView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/minecraft',
      name: 'minecraft',
      component: () => import('../views/MinecraftView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/users',
      name: 'users',
      component: () => import('../views/PlayersView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/user/:id',
      name: 'user-detail',
      component: () => import('../views/UserDetailView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/players',
      name: 'players',
      component: () => import('../views/PlayersView.vue')
    },
    {
      path: '/cube-timer',
      name: 'cube-timer',
      component: () => import('../views/CubeTimer.vue'),
      meta: { requiresAuth: false, standalone: true }
    },
    {
      path: '/online-competition',
      name: 'online-competition',
      component: () => import('../views/OnlineCompetition.vue'),
      meta: { requiresAuth: false }
    },

  ]
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  const token = localStorage.getItem('token')
  
  // 如果有token但没有用户信息，尝试初始化用户
  if (token && !userStore.user) {
    await userStore.initUser()
  }
  
  // 如果需要认证
  if (to.meta.requiresAuth) {
    // 检查 token 和用户状态
    if (!token || !userStore.user) {
      // 记住用户想要访问的页面
      localStorage.setItem('redirectPath', to.fullPath)
      // 不再重定向到登录页，而是显示登录对话框
      return next('/')
    }
  }
  
  next()
})

export default router 