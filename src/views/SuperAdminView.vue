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
          <AdminRecordsTable 
            :records="allRecords" 
            :loading="recordsLoading"
            @refresh="fetchAllRecords"
          />
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
  Key, Back, Search, Refresh
} from '@element-plus/icons-vue'
import AdminDashboard from '@/components/AdminDashboard.vue'
import RecordsTable from '@/components/RecordsTable.vue'
import AdminRecordsTable from '@/components/AdminRecordsTable.vue'
import api from '@/api/index.js'

const router = useRouter()
const userStore = useUserStore()
const permissionStore = usePermissionStore()

const activeMenu = ref('dashboard')
const loading = ref(false)
const recordsLoading = ref(false)

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
// 对话框相关
const editRoleDialogVisible = ref(false)
const selectedUser = ref(null)
const newRole = ref('')
const roleChangeLoading = ref(false)

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
      case 'user-management':
        await fetchUsers()
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
  recordsLoading.value = true
  try {
    // 分批获取所有records，避免数量限制
    let allRecordsData = []
    let page = 1
    const pageSize = 100
    
    while (true) {
      const result = await api.getRecords({ page, pageSize })
      if (result.code === 200 && result.data && result.data.length > 0) {
        allRecordsData = allRecordsData.concat(result.data)
        
        // 如果返回的数据少于pageSize，说明已经是最后一页
        if (result.data.length < pageSize) {
          break
        }
        page++
      } else {
        break
      }
    }
    
    allRecords.value = allRecordsData
    console.log(`超级管理员页面：获取到${allRecordsData.length}条成绩记录`)
  } catch (error) {
    console.error('获取成绩记录失败:', error)
    ElMessage.error('获取成绩记录失败: ' + error.message)
    allRecords.value = []
  } finally {
    recordsLoading.value = false
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
  border-radius: 0 var(--radius-xl) var(--radius-xl) 0;
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

/* 统一卡片圆角 */
:deep(.el-card) {
  border-radius: var(--radius-xl) !important;
  overflow: hidden;
}

/* 统一表格圆角 */
:deep(.el-table) {
  border-radius: var(--radius-lg) !important;
  overflow: hidden;
}

/* 统一对话框圆角 */
:deep(.el-dialog) {
  border-radius: var(--radius-2xl) !important;
}

.changelog-table {
  border-radius: var(--radius-lg);
  overflow: hidden;
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
  border-radius: var(--radius-xl);
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
  border-radius: var(--radius-xl);
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

/* 更新日志管理样式 */
.changelog-table {
  margin-bottom: 20px;
}

.changes-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.change-item {
  font-size: 14px;
  color: var(--text-color);
  line-height: 1.4;
}

.changes-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.change-input-group {
  display: flex;
  align-items: center;
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
