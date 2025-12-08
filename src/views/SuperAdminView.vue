<template>
  <AdminLayout title="超级管理" :default-menu="activeMenu" @menu-select="handleMenuSelect">
    <template #menu-items>
      <!-- 继承管理员功能 -->
      <el-menu-item index="dashboard">
        <el-icon><DataBoard /></el-icon>
        <span>仪表板</span>
      </el-menu-item>
      <el-menu-item index="records">
        <el-icon><Trophy /></el-icon>
        <span>成绩管理</span>
      </el-menu-item>
      <el-menu-item index="meme-events">
        <el-icon><Trophy /></el-icon>
        <span>整活项目</span>
      </el-menu-item>
      
      <!-- 超级管理员专属功能 -->
      <el-menu-item index="user-management">
        <el-icon><UserFilled /></el-icon>
        <span>用户管理</span>
      </el-menu-item>
    </template>
    
    <template #content>
      <!-- 管理员功能（继承） -->
      <AdminCommonSections 
        v-if="['dashboard', 'records', 'meme-events'].includes(activeMenu)"
        :active-menu="activeMenu"
        ref="commonSectionsRef"
      />
      
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
                {{ formatUserDate(row.createTime) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" class-name="action-column">
              <template #default="{ row }">
                <div class="action-buttons">
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
                </div>
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
    </template>
  </AdminLayout>
    
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
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePermissionStore } from '@/stores/permission'
import AdminLayout from '@/components/AdminLayout.vue'
import AdminCommonSections from '@/components/AdminCommonSections.vue'
import { useAdminCommon } from '@/composables/useAdminCommon'
import { getRoleDisplayName } from '@/utils/permissions'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  DataBoard, Trophy, UserFilled, Search, Refresh, Edit
} from '@element-plus/icons-vue'
import api from '@/api/index.js'

const router = useRouter()
const permissionStore = usePermissionStore()

// 使用公共 composable
const { getRoleTagType } = useAdminCommon()

const activeMenu = ref('dashboard')
const loading = ref(false)
const commonSectionsRef = ref(null)

// 用户管理相关
const users = ref([])
const userSearchQuery = ref('')
const userRoleFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const totalUsers = ref(0)

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
        if (commonSectionsRef.value) {
          await commonSectionsRef.value.fetchAllRecords()
        }
        break
      case 'meme-events':
        if (commonSectionsRef.value) {
          await commonSectionsRef.value.fetchMemeEvents()
        }
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

// 格式化用户日期（用于用户管理表格）
const formatUserDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (isNaN(date)) return '-'
  return date.toLocaleDateString('zh-CN')
}

// getRoleTagType 已从 useAdminCommon 导入

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

/* 操作按钮默认隐藏，鼠标悬停时显示 */
.action-buttons {
  opacity: 0;
  transition: opacity 0.2s ease;
}

:deep(.el-table__row:hover .action-buttons) {
  opacity: 1;
}

/* 确保操作列有足够的空间 */
:deep(.action-column) {
  padding: 0 !important;
}

:deep(.action-column .cell) {
  padding: 0 !important;
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
