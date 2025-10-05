import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import { usePermissionStore } from '../stores/permission'
import { ElMessage } from 'element-plus'
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
      meta: { 
        requiresAuth: true,
        requiredPermissions: 'submit_record'
      }
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
      path: '/online-competition',
      name: 'online-competition',
      component: () => import('../views/OnlineCompetition.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/maintenance',
      name: 'maintenance',
      component: () => import('../views/MaintenanceView.vue'),
      meta: { requiresAuth: false, allowInMaintenance: true }
    },
    
    // 管理员路由
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue'),
      meta: { 
        requiresAuth: true,
        requiredRole: 'admin',
        requiredPermissions: 'admin_panel'
      }
    },
    {
      path: '/super-admin',
      name: 'super-admin',
      component: () => import('../views/SuperAdminView.vue'),
      meta: { 
        requiresAuth: true,
        requiredRole: 'super_admin',
        requiredPermissions: 'super_admin_panel'
      }
    },

  ]
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  const permissionStore = usePermissionStore()
  const token = localStorage.getItem('token')
  
  // 如果有token但没有用户信息，尝试初始化用户
  if (token && !userStore.user) {
    await userStore.initUser()
  }
  
  // 检查路由权限
  if (!permissionStore.canAccessRoute(to.meta)) {
    // 如果是因为未登录
    if (to.meta.requiresAuth && !userStore.isLoggedIn) {
      // 记住用户想要访问的页面
      localStorage.setItem('redirectPath', to.fullPath)
      // 显示登录对话框
      return next('/')
    }
    
    // 如果是权限不足
    ElMessage.error('权限不足，无法访问该页面')
    return next('/')
  }
  
  next()
})

export default router 