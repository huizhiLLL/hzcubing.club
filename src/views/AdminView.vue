<template>
  <div class="admin-container">
    <div class="admin-layout">
      <!-- 侧边栏 -->
      <aside class="admin-sidebar">
        <div class="sidebar-header">
          <h2>管理面板</h2>
          <el-tag 
            :type="getRoleTagType(userStore.userRole)" 
            size="small"
            effect="plain"
          >
            {{ getRoleDisplayName(userStore.userRole) }}
          </el-tag>
        </div>
        
        <el-menu
          v-model:default-active="activeMenu"
          class="admin-menu"
          @select="handleMenuSelect"
        >
          <el-menu-item index="dashboard">
            <el-icon><DataBoard /></el-icon>
            <span>仪表板</span>
          </el-menu-item>
          <el-menu-item index="records">
            <el-icon><Trophy /></el-icon>
            <span>成绩管理</span>
          </el-menu-item>
          <el-menu-item index="feedback">
            <el-icon><ChatDotRound /></el-icon>
            <span>用户反馈</span>
          </el-menu-item>
          <el-menu-item index="users-stats">
            <el-icon><User /></el-icon>
            <span>用户统计</span>
          </el-menu-item>
        </el-menu>
        
        <div class="sidebar-footer">
          <el-button type="primary" @click="$router.push('/')" plain>
            <el-icon><Back /></el-icon>
            返回首页
          </el-button>
        </div>
      </aside>
      
      <!-- 主内容区 -->
      <main class="admin-main">
        <!-- 仪表板 -->
        <div v-if="activeMenu === 'dashboard'" class="admin-section">
          <h3 class="section-title">网站统计</h3>
          <!-- 复用AdminDashboard组件 -->
          <AdminDashboard />
        </div>
        
        <!-- 成绩管理 -->
        <div v-if="activeMenu === 'records'" class="admin-section">
          <h3 class="section-title">成绩记录管理</h3>
          <RecordsTable 
            :records="allRecords" 
            :show-actions="false"
            :auto-refresh="false"
            @refresh="fetchAllRecords"
          />
        </div>
        
        <!-- 用户反馈 -->
        <div v-if="activeMenu === 'feedback'" class="admin-section">
          <h3 class="section-title">用户反馈</h3>
          <el-card class="feedback-card">
            <div class="feedback-list">
              <div v-for="feedback in userFeedbacks" :key="feedback.id" class="feedback-item">
                <div class="feedback-header">
                  <span class="feedback-user">{{ feedback.nickname || '匿名用户' }}</span>
                  <span class="feedback-time">{{ formatTime(feedback.timestamp) }}</span>
                </div>
                <div class="feedback-content">{{ feedback.content }}</div>
              </div>
            </div>
            <div v-if="userFeedbacks.length === 0" class="empty-feedback">
              <el-empty description="暂无用户反馈" />
            </div>
          </el-card>
        </div>
        
        <!-- 用户统计 -->
        <div v-if="activeMenu === 'users-stats'" class="admin-section">
          <h3 class="section-title">用户统计信息</h3>
          <div class="user-stats-grid">
            <el-card class="user-stat-card">
              <div class="stat-header">角色分布</div>
              <div class="role-stats">
                <div class="role-stat-item">
                  <span class="role-name">普通用户</span>
                  <span class="role-count">{{ userStats.userCount || 0 }}</span>
                </div>
                <div class="role-stat-item">
                  <span class="role-name">管理员</span>
                  <span class="role-count">{{ userStats.adminCount || 0 }}</span>
                </div>
                <div class="role-stat-item">
                  <span class="role-name">超级管理员</span>
                  <span class="role-count">{{ userStats.superAdminCount || 0 }}</span>
                </div>
              </div>
            </el-card>
            
            <el-card class="user-stat-card">
              <div class="stat-header">用户状态</div>
              <div class="status-stats">
                <div class="status-stat-item">
                  <span class="status-name">活跃用户</span>
                  <span class="status-count">{{ userStats.activeCount || 0 }}</span>
                </div>
                <div class="status-stat-item">
                  <span class="status-name">非活跃用户</span>
                  <span class="status-count">{{ userStats.inactiveCount || 0 }}</span>
                </div>
                <div class="status-stat-item">
                  <span class="status-name">被禁用户</span>
                  <span class="status-count">{{ userStats.bannedCount || 0 }}</span>
                </div>
              </div>
            </el-card>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'
import { useRecordsStore } from '@/stores/records'
import { getRoleDisplayName, getRoleColor } from '@/utils/permissions'
import RecordsTable from '@/components/RecordsTable.vue'
import AdminDashboard from '@/components/AdminDashboard.vue'
import { ElMessage } from 'element-plus'
import { 
  DataBoard, Trophy, ChatDotRound, User, Back, View, UserFilled, Clock 
} from '@element-plus/icons-vue'
import api from '@/api/index.js'

const router = useRouter()
const userStore = useUserStore()
const permissionStore = usePermissionStore()
const recordsStore = useRecordsStore()

const activeMenu = ref('dashboard')
const loading = ref(false)

// 数据状态
const userStats = ref({
  userCount: 0,
  adminCount: 0,
  superAdminCount: 0,
  activeCount: 0,
  inactiveCount: 0,
  bannedCount: 0
})

const allRecords = ref([])
const userFeedbacks = ref([])

// 菜单选择处理
const handleMenuSelect = (key) => {
  activeMenu.value = key
  loadSectionData(key)
}

// 加载不同section的数据
const loadSectionData = async (section) => {
  loading.value = true
  try {
    switch (section) {
      case 'dashboard':
        // 仪表板数据由AdminDashboard组件自己加载
        break
      case 'records':
        await fetchAllRecords()
        break
      case 'feedback':
        await fetchUserFeedbacks()
        break
      case 'users-stats':
        await fetchUserStats()
        break
    }
  } catch (error) {
    ElMessage.error('加载数据失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

// 获取所有成绩记录
const fetchAllRecords = async () => {
  try {
    await recordsStore.fetchRecords()
    allRecords.value = recordsStore.records
  } catch (error) {
    console.error('获取成绩记录失败:', error)
  }
}

// 获取用户反馈
const fetchUserFeedbacks = async () => {
  try {
    const result = await api.getFeedbackList({ page: 1, pageSize: 50 })
    
    if (result.code === 200) {
      userFeedbacks.value = result.data || []
    } else {
      throw new Error(result.message || '获取用户反馈失败')
    }
  } catch (error) {
    ElMessage.error('获取用户反馈失败: ' + error.message)
    userFeedbacks.value = []
  }
}

// 获取用户统计
const fetchUserStats = async () => {
  try {
    const result = await api.getWebsiteStats()
    
    if (result.code === 200) {
      const { userStats: stats } = result.data
      
      userStats.value = {
        userCount: stats.usersByRole.user,
        adminCount: stats.usersByRole.admin,
        superAdminCount: stats.usersByRole.super_admin,
        activeCount: stats.activeUsers,
        inactiveCount: stats.inactiveUsers,
        bannedCount: stats.bannedUsers
      }
      
      // 总用户数已在AdminDashboard中显示
    } else {
      throw new Error(result.message || '获取用户统计失败')
    }
  } catch (error) {
    console.error('获取用户统计失败:', error)
    ElMessage.error('获取用户统计失败: ' + error.message)
  }
}

// 格式化时间（用于反馈显示）
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 1000 * 60) {
    return '刚刚'
  } else if (diff < 1000 * 60 * 60) {
    return `${Math.floor(diff / (1000 * 60))}分钟前`
  } else if (diff < 1000 * 60 * 60 * 24) {
    return `${Math.floor(diff / (1000 * 60 * 60))}小时前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

// 获取角色标签类型
const getRoleTagType = (role) => {
  const roleTypes = {
    'guest': 'info',
    'user': 'primary',
    'admin': 'warning',
    'super_admin': 'danger'
  }
  return roleTypes[role] || 'info'
}

onMounted(() => {
  // 检查权限
  if (!permissionStore.hasPermission('admin_panel')) {
    ElMessage.error('权限不足')
    router.push('/')
    return
  }
  
  loadSectionData('dashboard')
})
</script>

<style scoped>
.admin-container {
  min-height: 100vh;
  background: var(--background-color);
}

.admin-layout {
  display: flex;
  min-height: 100vh;
}

.admin-sidebar {
  width: 250px;
  background: var(--surface-color);
  border-right: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h2 {
  margin: 0;
  color: var(--text-color);
  font-size: 18px;
}

.admin-menu {
  flex: 1;
  border: none;
}

.admin-menu .el-menu-item {
  height: 50px;
  line-height: 50px;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid var(--border-light);
}

.admin-main {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.admin-section {
  max-width: 1200px;
}

.section-title {
  margin: 0 0 20px 0;
  color: var(--text-color);
  font-size: 20px;
  font-weight: 600;
}


.feedback-card {
  margin-top: 20px;
}

.feedback-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.feedback-item {
  padding: 15px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  background: var(--surface-color);
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.feedback-user {
  font-weight: 500;
  color: var(--text-color);
}

.feedback-time {
  color: var(--text-color-secondary);
  font-size: 12px;
}

.feedback-content {
  color: var(--text-color);
  line-height: 1.5;
}

.empty-feedback {
  text-align: center;
  padding: 40px;
}

.user-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.user-stat-card {
  padding: 0;
}

.stat-header {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 15px;
}

.role-stats, .status-stats {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.role-stat-item, .status-stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-light);
}

.role-stat-item:last-child, .status-stat-item:last-child {
  border-bottom: none;
}

.role-name, .status-name {
  color: var(--text-color);
  font-size: 14px;
}

.role-count, .status-count {
  font-weight: bold;
  color: var(--primary-color);
  font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .admin-layout {
    flex-direction: column;
  }
  
  .admin-sidebar {
    width: 100%;
    height: auto;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  
  .user-stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
