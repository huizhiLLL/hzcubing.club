<template>
  <div class="super-admin-container">
    <div class="admin-layout">
      <!-- 侧边栏 -->
      <aside class="admin-sidebar">
        <div class="sidebar-header">
          <h2>超级管理</h2>
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
          <!-- 继承管理员功能 -->
          <el-sub-menu index="admin-functions">
            <template #title>
              <el-icon><DataBoard /></el-icon>
              <span>管理员功能</span>
            </template>
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
          </el-sub-menu>
          
          <!-- 超级管理员专属功能 -->
          <el-sub-menu index="super-admin-functions">
            <template #title>
              <el-icon><Key /></el-icon>
              <span>超级管理</span>
            </template>
            <el-menu-item index="user-management">
              <el-icon><UserFilled /></el-icon>
              <span>用户管理</span>
            </el-menu-item>
            <el-menu-item index="role-management">
              <el-icon><Key /></el-icon>
              <span>权限管理</span>
            </el-menu-item>
            <el-menu-item index="system-settings">
              <el-icon><Setting /></el-icon>
              <span>系统设置</span>
            </el-menu-item>
          </el-sub-menu>
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
        <!-- 管理员功能（继承） -->
        <div v-if="activeMenu === 'dashboard'" class="admin-section">
          <h3 class="section-title">网站统计</h3>
          <!-- 复用管理员页面的仪表板内容 -->
          <AdminDashboard />
        </div>
        
        <!-- 成绩管理（继承自管理员） -->
        <div v-if="activeMenu === 'records'" class="admin-section">
          <h3 class="section-title">成绩记录管理</h3>
          <RecordsTable 
            :records="allRecords" 
            :show-actions="false"
            :auto-refresh="false"
            @refresh="fetchAllRecords"
          />
        </div>
        
        <!-- 用户反馈（继承自管理员） -->
        <div v-if="activeMenu === 'feedback'" class="admin-section">
          <h3 class="section-title">用户反馈</h3>
          <el-card class="feedback-card">
            <div class="feedback-list">
              <div v-for="feedback in userFeedbacks" :key="feedback._id" class="feedback-item">
                <div class="feedback-header">
                  <span class="feedback-user">{{ feedback.nickname || '匿名用户' }}</span>
                  <span class="feedback-time">{{ formatTime(feedback.timestamp) }}</span>
                </div>
                <div class="feedback-content">{{ feedback.content }}</div>
                <div class="feedback-status">
                  <el-tag :type="feedback.status === 'processed' ? 'success' : 'warning'" size="small">
                    {{ feedback.status === 'processed' ? '已处理' : '待处理' }}
                  </el-tag>
                </div>
              </div>
            </div>
            <div v-if="userFeedbacks.length === 0" class="empty-feedback">
              <el-empty description="暂无用户反馈" />
            </div>
          </el-card>
        </div>
        
        <!-- 用户统计（继承自管理员） -->
        <div v-if="activeMenu === 'users-stats'" class="admin-section">
          <h3 class="section-title">用户统计信息</h3>
          <div class="user-stats-grid">
            <el-card class="user-stat-card">
              <div class="stat-header">角色分布</div>
              <div class="role-stats">
                <div class="role-stat-item">
                  <span class="role-name">普通用户</span>
                  <span class="role-count">{{ adminUserStats.userCount || 0 }}</span>
                </div>
                <div class="role-stat-item">
                  <span class="role-name">管理员</span>
                  <span class="role-count">{{ adminUserStats.adminCount || 0 }}</span>
                </div>
                <div class="role-stat-item">
                  <span class="role-name">超级管理员</span>
                  <span class="role-count">{{ adminUserStats.superAdminCount || 0 }}</span>
                </div>
              </div>
            </el-card>
            
            <el-card class="user-stat-card">
              <div class="stat-header">用户状态</div>
              <div class="status-stats">
                <div class="status-stat-item">
                  <span class="status-name">活跃用户</span>
                  <span class="status-count">{{ adminUserStats.activeCount || 0 }}</span>
                </div>
                <div class="status-stat-item">
                  <span class="status-name">非活跃用户</span>
                  <span class="status-count">{{ adminUserStats.inactiveCount || 0 }}</span>
                </div>
                <div class="status-stat-item">
                  <span class="status-name">被禁用户</span>
                  <span class="status-count">{{ adminUserStats.bannedCount || 0 }}</span>
                </div>
              </div>
            </el-card>
          </div>
        </div>
        
        <!-- 用户管理 -->
        <div v-if="activeMenu === 'user-management'" class="admin-section">
          <div class="section-header">
            <h3 class="section-title">用户管理</h3>
            <div class="section-actions">
              <el-input
                v-model="userSearchQuery"
                placeholder="搜索用户..."
                style="width: 200px;"
                clearable
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <el-select v-model="userRoleFilter" placeholder="筛选角色" style="width: 120px;" clearable>
                <el-option label="用户" value="user" />
                <el-option label="管理员" value="admin" />
                <el-option label="超级管理员" value="super_admin" />
              </el-select>
              <el-button @click="fetchUsers" :loading="loading">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </div>
          
          <el-table :data="filteredUsers" v-loading="loading" class="users-table">
            <el-table-column prop="nickname" label="昵称" width="120" />
            <el-table-column prop="email" label="邮箱" width="200" />
            <el-table-column prop="role" label="角色" width="100">
              <template #default="{ row }">
                <el-tag 
                  :type="getRoleTagType(row.role)" 
                  size="small"
                  effect="plain"
                >
                  {{ getRoleDisplayName(row.role) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'warning'" size="small">
                  {{ row.status === 'active' ? '正常' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="注册时间" width="120">
              <template #default="{ row }">
                {{ formatDate(row.createTime) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button-group>
                  <el-button size="small" @click="editUserRole(row)">
                    <el-icon><Edit /></el-icon>
                    角色
                  </el-button>
                  <el-button 
                    size="small" 
                    :type="row.status === 'active' ? 'warning' : 'success'"
                    @click="toggleUserStatus(row)"
                  >
                    {{ row.status === 'active' ? '禁用' : '启用' }}
                  </el-button>
                </el-button-group>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="totalUsers"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </div>
        
        <!-- 权限管理 -->
        <div v-if="activeMenu === 'role-management'" class="admin-section">
          <h3 class="section-title">权限管理</h3>
          <el-card class="role-management-card">
            <div class="role-overview">
              <h4>角色权限概览</h4>
              <div class="roles-overview-grid">
                <div v-for="role in roleOverview" :key="role.key" class="role-overview-item">
                  <div class="role-header">
                    <el-tag 
                      :type="getRoleTagType(role.key)"
                      effect="plain"
                    >
                      {{ role.name }}
                    </el-tag>
                    <span class="user-count">{{ role.userCount }} 用户</span>
                  </div>
                  <div class="role-permissions">
                    <el-tag 
                      v-for="permission in role.permissions" 
                      :key="permission"
                      size="small"
                      class="permission-tag"
                    >
                      {{ getPermissionName(permission) }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </div>
        
        <!-- 系统设置 -->
        <div v-if="activeMenu === 'system-settings'" class="admin-section">
          <h3 class="section-title">系统设置</h3>
          <el-card class="system-settings-card">
            <div class="setting-item">
              <div class="setting-info">
                <h4>维护模式</h4>
                <p>开启后，网站将显示维护页面，仅管理员可访问</p>
              </div>
              <el-switch
                v-model="maintenanceMode"
                @change="toggleMaintenanceMode"
                :loading="maintenanceLoading"
                size="large"
              />
            </div>
          </el-card>
        </div>
      </main>
    </div>
    
    <!-- 编辑用户角色对话框 -->
    <el-dialog
      v-model="editRoleDialogVisible"
      title="编辑用户角色"
      width="400px"
    >
      <div v-if="selectedUser" class="edit-role-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="用户昵称">{{ selectedUser.nickname }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ selectedUser.email }}</el-descriptions-item>
          <el-descriptions-item label="当前角色">
            <el-tag 
              :type="getRoleTagType(selectedUser.role)"
              effect="plain"
            >
              {{ getRoleDisplayName(selectedUser.role) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
        
        <div class="role-selection">
          <h4>选择新角色：</h4>
          <el-radio-group v-model="newRole">
            <el-radio label="user">
              <el-tag type="primary" effect="plain">用户</el-tag>
            </el-radio>
            <el-radio label="admin">
              <el-tag type="warning" effect="plain">管理员</el-tag>
            </el-radio>
            <el-radio label="super_admin">
              <el-tag type="danger" effect="plain">超级管理员</el-tag>
            </el-radio>
          </el-radio-group>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="editRoleDialogVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="confirmRoleChange"
          :loading="roleChangeLoading"
          :disabled="!newRole || newRole === selectedUser?.role"
        >
          确认修改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'
import { useRecordsStore } from '@/stores/records'
import { getRoleDisplayName, getRoleColor } from '@/utils/permissions'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  DataBoard, Trophy, ChatDotRound, User, UserFilled, 
  Key, Setting, Back, Search, Refresh, Edit, View, Clock
} from '@element-plus/icons-vue'
import AdminDashboard from '@/components/AdminDashboard.vue'
import RecordsTable from '@/components/RecordsTable.vue'
import api from '@/api/index.js'

const router = useRouter()
const userStore = useUserStore()
const permissionStore = usePermissionStore()

const activeMenu = ref('dashboard')
const loading = ref(false)

// 用户管理相关
const users = ref([])
const userSearchQuery = ref('')
const userRoleFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const totalUsers = ref(0)

// 管理员功能继承的数据
const allRecords = ref([])
const userFeedbacks = ref([])
const adminUserStats = ref({
  userCount: 0,
  adminCount: 0,
  superAdminCount: 0,
  activeCount: 0,
  inactiveCount: 0,
  bannedCount: 0
})

// 对话框相关
const editRoleDialogVisible = ref(false)
const selectedUser = ref(null)
const newRole = ref('')
const roleChangeLoading = ref(false)

// 系统设置相关
const maintenanceMode = ref(false)
const maintenanceLoading = ref(false)

// 角色权限概览
const roleOverview = ref([
  {
    key: 'user',
    name: '用户',
    userCount: 0,
    permissions: ['view_records', 'submit_record', 'edit_own_record']
  },
  {
    key: 'admin', 
    name: '管理员',
    userCount: 0,
    permissions: ['view_records', 'submit_record', 'admin_panel']
  },
  {
    key: 'super_admin',
    name: '超级管理员', 
    userCount: 0,
    permissions: ['manage_users', 'manage_permissions', 'system_config']
  }
])

// 计算过滤后的用户列表
const filteredUsers = computed(() => {
  let filtered = users.value
  
  if (userSearchQuery.value) {
    const query = userSearchQuery.value.toLowerCase()
    filtered = filtered.filter(user => 
      user.nickname?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    )
  }
  
  if (userRoleFilter.value) {
    filtered = filtered.filter(user => user.role === userRoleFilter.value)
  }
  
  return filtered
})

// 菜单选择处理
const handleMenuSelect = (key) => {
  activeMenu.value = key
  loadSectionData(key)
}

// 加载section数据
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
        await fetchAdminUserStats()
        break
      case 'user-management':
        await fetchUsers()
        break
      case 'role-management':
        await fetchRoleStats()
        break
      case 'system-settings':
        await fetchSystemSettings()
        break
    }
  } catch (error) {
    ElMessage.error('加载数据失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

// 获取所有成绩记录（继承自管理员）
const fetchAllRecords = async () => {
  try {
    const recordsStore = useRecordsStore()
    await recordsStore.fetchRecords()
    allRecords.value = recordsStore.records
  } catch (error) {
    console.error('获取成绩记录失败:', error)
    ElMessage.error('获取成绩记录失败: ' + error.message)
  }
}

// 获取用户反馈（继承自管理员）
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

// 获取管理员用户统计（继承自管理员）
const fetchAdminUserStats = async () => {
  try {
    const result = await api.getWebsiteStats()
    
    if (result.code === 200) {
      const { userStats: stats } = result.data
      
      adminUserStats.value = {
        userCount: stats.usersByRole.user,
        adminCount: stats.usersByRole.admin,
        superAdminCount: stats.usersByRole.super_admin,
        activeCount: stats.activeUsers,
        inactiveCount: stats.inactiveUsers,
        bannedCount: stats.bannedUsers
      }
    } else {
      throw new Error(result.message || '获取用户统计失败')
    }
  } catch (error) {
    console.error('获取用户统计失败:', error)
    ElMessage.error('获取用户统计失败: ' + error.message)
  }
}

// 获取用户列表
const fetchUsers = async () => {
  try {
    const result = await api.getAllUsers({
      page: currentPage.value,
      pageSize: pageSize.value,
      role: userRoleFilter.value
    })
    
    if (result.code === 200) {
      users.value = result.data || []
      totalUsers.value = result.total || 0
    } else {
      throw new Error(result.message || '获取用户列表失败')
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败: ' + error.message)
  }
}

// 获取角色统计
const fetchRoleStats = async () => {
  try {
    const result = await api.getWebsiteStats()
    
    if (result.code === 200) {
      const { userStats } = result.data
      
      roleOverview.value.forEach(role => {
        role.userCount = userStats.usersByRole[role.key] || 0
      })
    } else {
      throw new Error(result.message || '获取角色统计失败')
    }
  } catch (error) {
    console.error('获取角色统计失败:', error)
    ElMessage.error('获取角色统计失败: ' + error.message)
  }
}

// 获取系统设置
const fetchSystemSettings = async () => {
  try {
    const result = await api.getMaintenanceMode()
    if (result.code === 200) {
      maintenanceMode.value = result.data.maintenanceMode || false
    }
  } catch (error) {
    console.error('获取系统设置失败:', error)
    maintenanceMode.value = false
  }
}

// 编辑用户角色
const editUserRole = (user) => {
  selectedUser.value = user
  newRole.value = user.role
  editRoleDialogVisible.value = true
}

// 确认角色变更
const confirmRoleChange = async () => {
  if (!selectedUser.value || !newRole.value) return
  
  // 敏感操作二次确认
  try {
    await ElMessageBox.confirm(
      `确定要将用户 "${selectedUser.value.nickname}" 的角色从 "${getRoleDisplayName(selectedUser.value.role)}" 修改为 "${getRoleDisplayName(newRole.value)}" 吗？`,
      '确认角色变更',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    roleChangeLoading.value = true
    
    const result = await api.updateUserRole(selectedUser.value._id, newRole.value)
    
    if (result.code === 200) {
      ElMessage.success('角色修改成功')
      selectedUser.value.role = newRole.value
      editRoleDialogVisible.value = false
      await fetchUsers() // 刷新用户列表
    } else {
      throw new Error(result.message || '角色修改失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('角色修改失败: ' + error.message)
    }
  } finally {
    roleChangeLoading.value = false
  }
}

// 切换用户状态
const toggleUserStatus = async (user) => {
  const newStatus = user.status === 'active' ? 'inactive' : 'active'
  const actionText = newStatus === 'active' ? '启用' : '禁用'
  
  try {
    await ElMessageBox.confirm(
      `确定要${actionText}用户 "${user.nickname}" 吗？`,
      `确认${actionText}`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const result = await api.updateUserStatus(user._id, newStatus)
    
    if (result.code === 200) {
      ElMessage.success(`用户${actionText}成功`)
      user.status = newStatus
    } else {
      throw new Error(result.message || `用户${actionText}失败`)
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`用户${actionText}失败: ` + error.message)
    }
  }
}

// 切换维护模式
const toggleMaintenanceMode = async (value) => {
  maintenanceLoading.value = true
  try {
    const reason = value ? '系统维护升级中，请稍后访问' : ''
    const result = await api.setMaintenanceMode(value, reason)
    
    if (result.code === 200) {
      ElMessage.success(value ? '维护模式已开启' : '维护模式已关闭')
    } else {
      throw new Error(result.message || '设置维护模式失败')
    }
  } catch (error) {
    ElMessage.error('设置维护模式失败: ' + error.message)
    maintenanceMode.value = !value // 回滚状态
  } finally {
    maintenanceLoading.value = false
  }
}

// 分页处理
const handleSizeChange = (size) => {
  pageSize.value = size
  fetchUsers()
}

const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchUsers()
}

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

// 格式化时间（用于反馈时间显示）
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

// 获取权限名称
const getPermissionName = (permission) => {
  const permissionNames = {
    'view_records': '查看记录',
    'submit_record': '提交成绩',
    'edit_own_record': '编辑记录',
    'admin_panel': '管理面板',
    'manage_users': '用户管理',
    'manage_permissions': '权限管理',
    'system_config': '系统配置'
  }
  return permissionNames[permission] || permission
}

// 获取角色标签类型（用于Element Plus的type属性）
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
  // 检查超级管理员权限
  if (!permissionStore.hasPermission('super_admin_panel')) {
    ElMessage.error('权限不足')
    router.push('/')
    return
  }
  
  // 默认加载仪表板
  loadSectionData('dashboard')
})
</script>

<style scoped>
.super-admin-container {
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

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.users-table {
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.role-management-card {
  margin-top: 20px;
}

.roles-overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.role-overview-item {
  padding: 20px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  background: var(--surface-color);
}

.role-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.user-count {
  color: var(--text-color-secondary);
  font-size: 14px;
}

.role-permissions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.permission-tag {
  font-size: 12px;
}

.system-settings-card {
  margin-top: 20px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid var(--border-light);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info h4 {
  margin: 0 0 5px 0;
  color: var(--text-color);
}

.setting-info p {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 14px;
}

.edit-role-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.role-selection h4 {
  margin: 0 0 10px 0;
  color: var(--text-color);
}

.role-selection .el-radio-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
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
  margin-bottom: 10px;
}

.feedback-status {
  display: flex;
  justify-content: flex-end;
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
  
  .section-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .section-actions {
    flex-wrap: wrap;
  }
  
  .roles-overview-grid {
    grid-template-columns: 1fr;
  }
  
  .user-stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
