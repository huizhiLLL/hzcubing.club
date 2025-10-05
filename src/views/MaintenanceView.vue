<template>
  <div class="maintenance-container">
    <div class="maintenance-content">
      <div class="maintenance-icon">
        <el-icon size="80"><Tools /></el-icon>
      </div>
      
      <h1 class="maintenance-title">网站维护中</h1>
      
      <div class="maintenance-message">
        <p>{{ maintenanceReason || '我们正在对网站进行维护升级，以提供更好的服务体验。' }}</p>
        <p>维护期间网站暂时无法访问，请稍后再试。</p>
      </div>
      
      <div class="maintenance-info">
        <p v-if="lastUpdated" class="update-time">
          维护开始时间: {{ formatDateTime(lastUpdated) }}
        </p>
        <p v-if="updatedBy" class="update-by">
          操作人员: {{ updatedBy }}
        </p>
      </div>
      
      <!-- 管理员登录入口 -->
      <div class="admin-access" v-if="!userStore.user">
        <el-divider>管理员访问</el-divider>
        <el-button type="primary" @click="showAdminLogin = true">
          <el-icon><Key /></el-icon>
          管理员登录
        </el-button>
      </div>
      
      <!-- 已登录管理员的操作 -->
      <div class="admin-actions" v-if="userStore.user && (permissionStore.isAdmin || permissionStore.isSuperAdmin)">
        <el-divider>管理员操作</el-divider>
        <div class="action-buttons">
          <el-button type="success" @click="router.push('/admin')" v-if="permissionStore.isAdmin">
            <el-icon><Monitor /></el-icon>
            进入管理面板
          </el-button>
          <el-button type="danger" @click="router.push('/super-admin')" v-if="permissionStore.isSuperAdmin">
            <el-icon><Setting /></el-icon>
            进入超级管理
          </el-button>
          <el-button @click="userStore.logout()">
            <el-icon><SwitchButton /></el-icon>
            退出登录
          </el-button>
        </div>
      </div>
      
      <div class="maintenance-footer">
        <p>&copy; {{ new Date().getFullYear() }} 会枝Cubing. All rights reserved.</p>
      </div>
    </div>
    
    <!-- 管理员登录对话框 -->
    <AuthDialog 
      v-model:visible="showAdminLogin"
      mode="login"
      @login-success="handleAdminLogin"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'
import AuthDialog from '@/components/AuthDialog.vue'
import { Tools, Key, Monitor, Setting, SwitchButton } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import api from '@/api/index.js'

const router = useRouter()
const userStore = useUserStore()
const permissionStore = usePermissionStore()

const showAdminLogin = ref(false)
const maintenanceReason = ref('')
const lastUpdated = ref(null)
const updatedBy = ref('')

// 格式化日期时间
const formatDateTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

// 处理管理员登录成功
const handleAdminLogin = () => {
  showAdminLogin.value = false
  ElMessage.success('登录成功')
  
  // 根据角色跳转到对应的管理页面
  if (permissionStore.isSuperAdmin) {
    router.push('/super-admin')
  } else if (permissionStore.isAdmin) {
    router.push('/admin')
  }
}

// 加载维护模式信息
const loadMaintenanceInfo = async () => {
  try {
    const result = await api.getMaintenanceMode()
    if (result.code === 200) {
      maintenanceReason.value = result.data.reason || ''
      lastUpdated.value = result.data.lastUpdated
      updatedBy.value = result.data.updatedBy
    }
  } catch (error) {
    console.error('获取维护模式信息失败:', error)
  }
}

onMounted(() => {
  loadMaintenanceInfo()
})
</script>

<style scoped>
.maintenance-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.maintenance-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 60px 40px;
  text-align: center;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.maintenance-icon {
  margin-bottom: 30px;
  color: #667eea;
}

.maintenance-title {
  font-size: 36px;
  font-weight: bold;
  color: #333;
  margin-bottom: 30px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.maintenance-message {
  margin-bottom: 40px;
}

.maintenance-message p {
  font-size: 16px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 15px;
}

.maintenance-info {
  margin-bottom: 30px;
  padding: 20px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.update-time, .update-by {
  font-size: 14px;
  color: #667eea;
  margin: 5px 0;
}

.admin-access {
  margin: 30px 0;
}

.admin-actions {
  margin: 30px 0;
}

.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

.maintenance-footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.maintenance-footer p {
  font-size: 14px;
  color: #999;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .maintenance-content {
    padding: 40px 20px;
  }
  
  .maintenance-title {
    font-size: 28px;
  }
  
  .maintenance-message p {
    font-size: 14px;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .action-buttons .el-button {
    width: 200px;
  }
}
</style>
