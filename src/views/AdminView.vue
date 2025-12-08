<template>
  <AdminLayout title="管理面板" :default-menu="activeMenu" @menu-select="handleMenuSelect">
    <template #menu-items>
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
    </template>
    
    <template #content>
      <AdminCommonSections 
        :active-menu="activeMenu"
        ref="commonSectionsRef"
      />
    </template>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePermissionStore } from '@/stores/permission'
import AdminLayout from '@/components/AdminLayout.vue'
import AdminCommonSections from '@/components/AdminCommonSections.vue'
import { ElMessage } from 'element-plus'
import { DataBoard, Trophy } from '@element-plus/icons-vue'

const router = useRouter()
const permissionStore = usePermissionStore()

const activeMenu = ref('dashboard')
const commonSectionsRef = ref(null)

// 菜单选择处理
const handleMenuSelect = (key) => {
  activeMenu.value = key
  loadSectionData(key)
}

// 加载不同section的数据
const loadSectionData = async (section) => {
  if (!commonSectionsRef.value) return
  
  try {
    switch (section) {
      case 'dashboard':
        // 仪表板数据由AdminDashboard组件自己加载
        break
      case 'records':
        await commonSectionsRef.value.fetchAllRecords()
        break
      case 'meme-events':
        await commonSectionsRef.value.fetchMemeEvents()
        break
    }
  } catch (error) {
    ElMessage.error('加载数据失败: ' + error.message)
  }
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

