<template>
  <div class="admin-container">
    <div class="admin-layout">
      <!-- 侧边栏 -->
      <aside class="admin-sidebar">
        <div class="sidebar-header">
          <h2>{{ title }}</h2>
          <el-button type="primary" @click="$router.push('/')" plain>
            <el-icon><Back /></el-icon>
            返回首页
          </el-button>
        </div>
        
        <el-menu
          v-model:default-active="activeMenu"
          class="admin-menu"
          @select="handleMenuSelect"
        >
          <slot name="menu-items"></slot>
        </el-menu>
      </aside>
      
      <!-- 主内容区 -->
      <main class="admin-main">
        <slot name="content"></slot>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Back } from '@element-plus/icons-vue'

const props = defineProps({
  title: {
    type: String,
    default: '管理面板'
  },
  defaultMenu: {
    type: String,
    default: 'dashboard'
  }
})

const emit = defineEmits(['menu-select'])

const router = useRouter()

const activeMenu = ref(props.defaultMenu)

// 菜单选择处理
const handleMenuSelect = (key) => {
  activeMenu.value = key
  emit('menu-select', key)
}

defineExpose({
  activeMenu
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
  border-radius: 0 var(--radius-xl) var(--radius-xl) 0;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.sidebar-header h2 {
  margin: 0;
  color: var(--text-color);
  font-size: 18px;
  flex: 1;
}

.admin-menu {
  flex: 1;
  border: none;
}

.admin-menu .el-menu-item {
  height: 50px;
  line-height: 50px;
}

.admin-main {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .admin-layout {
    flex-direction: column;
  }
  
  .admin-sidebar {
    width: 100%;
    height: auto;
  }
}
</style>

