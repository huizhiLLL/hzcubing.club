<template>
  <div class="view-container">
    <!-- 动态背景装饰 -->
    <div class="ambient-orb orb-1"></div>
    <div class="ambient-orb orb-2"></div>

    <div class="content-wrapper">
      <ElementTransition name="slide-up" :duration="600" :delay="200" appear>
        <div class="bento-card main-card">
          <div class="card-header">
            <div class="header-left">
              <div class="icon-box">
                <Icon icon="material-symbols:groups-outline" class="header-icon" />
              </div>
              <div class="header-text">
                <h2>所有选手</h2>
                <p>hzcubing 的每一位成员</p>
              </div>
            </div>
            
            <div class="header-right">
              <el-input
                v-model="searchQuery"
                placeholder="搜索选手昵称..."
                clearable
                class="glass-input search-input"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>
          </div>
          
          <el-table
            v-loading="loading"
            :data="paginatedPlayers"
            style="width: 100%"
            :empty-text="loading ? '加载中...' : '暂无选手数据'"
            class="glass-table custom-table"
          >
            <el-table-column prop="nickname" label="昵称" min-width="140">
              <template #default="scope">
                <router-link 
                  :to="`/user/${scope.row._id || scope.row.id}`" 
                  class="player-info-cell"
                >
                  <el-avatar 
                    :size="32" 
                    :src="scope.row.avatar" 
                    class="player-avatar"
                  >
                    {{ scope.row.nickname?.charAt(0)?.toUpperCase() }}
                  </el-avatar>
                  <div class="player-text">
                    <span class="player-name">{{ scope.row.nickname }}</span>
                    <span v-if="hasWcaId(scope.row)" class="wca-id">{{ getWcaId(scope.row) }}</span>
                  </div>
                </router-link>
              </template>
            </el-table-column>
            
            <el-table-column prop="bio" label="签名" min-width="200">
              <template #default="scope">
                <span class="bio-text">{{ scope.row.bio || '这个人很懒，什么都没写~' }}</span>
              </template>
            </el-table-column>
            
            <el-table-column label="注册时间" min-width="120" align="right">
              <template #default="scope">
                <span class="date-tag">{{ formatDate(scope.row.createTime) }}</span>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination-container" v-if="players.length > 0">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[20, 40]"
              layout="total, prev, pager, next"
              :total="filteredPlayers.length"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
              background
            />
          </div>
        </div>
      </ElementTransition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { Icon } from '@iconify/vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import ElementTransition from '@/components/ElementTransition.vue'
import api from '@/api/index.js'

const router = useRouter()
const players = ref([])
const loading = ref(true)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

// 过滤后的选手列表
const filteredPlayers = computed(() => {
  if (!searchQuery.value) {
    return players.value
  }
  
  return players.value.filter(player => 
    player.nickname && player.nickname.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// 分页后的选手列表
const paginatedPlayers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredPlayers.value.slice(start, end)
})

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知'
  
  try {
    const date = new Date(dateString.$date || dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    
    return `${year}.${month}.${day}`
  } catch (error) {
    return '日期格式错误'
  }
}

// 处理页面大小变化
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

// 处理页码变化
const handleCurrentChange = (page) => {
  currentPage.value = page
}

// 获取所有选手数据
const fetchPlayers = async () => {
  loading.value = true
  try {
    const data = await api.getPlayers()
    
    if (data.code === 0) {
      players.value = data.data || []
    } else if (data.data) {
      // 直接处理返回的data字段
      players.value = Array.isArray(data.data) ? data.data : []
      if (!Array.isArray(data.data)) {
        console.warn('API返回的数据格式不符合预期:', data)
        ElMessage.warning('选手数据格式异常，请联系管理员')
      }
    } else {
      ElMessage.error(data.message || '获取选手列表失败')
    }
  } catch (error) {
    console.error('获取选手列表出错:', error)
    ElMessage.error('网络错误，请稍后再试')
  } finally {
    loading.value = false
  }
}

// 检查选手是否有WCA ID
const hasWcaId = (player) => {
  if (!player) return false
  
  const keys = Object.keys(player)
  for (const key of keys) {
    if (key.toLowerCase() === 'wcaid' && player[key]) {
      return true
    }
  }
  
  return Boolean(player.wcaId || player.wca_id || player.wcaid || player.WCAID)
}

// 获取选手的WCA ID
const getWcaId = (player) => {
  if (!player) return ''
  
  const keys = Object.keys(player)
  for (const key of keys) {
    if (key.toLowerCase() === 'wcaid' && player[key]) {
      return player[key]
    }
  }
  
  return player.wcaId || player.wca_id || player.wcaid || player.WCAID || ''
}

onMounted(() => {
  fetchPlayers()
})
</script>

<style scoped>
/* 布局容器 */
.view-container {
  position: relative;
  min-height: 80vh;
  padding: var(--space-xl) var(--space-md);
  overflow: hidden;
  display: flex;
  justify-content: center;
}

.content-wrapper {
  width: 100%;
  max-width: 1200px;
  position: relative;
  z-index: 1;
}

/* 动态背景光斑 */
.ambient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  z-index: 0;
  opacity: 0.4;
  animation: float 10s infinite ease-in-out;
}

.orb-1 {
  top: -10%;
  right: -10%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, var(--primary-color), transparent 70%);
}

.orb-2 {
  bottom: 10%;
  left: -5%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, var(--success-color), transparent 70%);
  animation-delay: -5s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(30px, -30px); }
}

/* Bento Card 风格主容器 */
.bento-card {
  background: var(--glass-bg-light);
  backdrop-filter: blur(var(--glass-blur-lg));
  -webkit-backdrop-filter: blur(var(--glass-blur-lg));
  border: var(--glass-border);
  border-radius: 24px;
  padding: 32px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

/* 头部样式 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.icon-box {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: var(--shadow-md);
}

.header-icon {
  font-size: 24px;
}

.header-text h2 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 4px;
  color: var(--text-color);
}

.header-text p {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 14px;
}

/* 搜索框样式 */
.search-input {
  width: 280px;
}

:deep(.glass-input .el-input__wrapper) {
  background: rgba(255, 255, 255, 0.5);
  box-shadow: none;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  padding: 4px 16px;
  transition: all 0.3s;
}

:deep(.glass-input .el-input__wrapper.is-focus) {
  background: #fff;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 1px var(--primary-color);
}

/* 表格样式优化 */
.custom-table {
  background: transparent !important;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: rgba(0, 0, 0, 0.02);
  --el-table-row-hover-bg-color: rgba(64, 158, 255, 0.08);
  --el-table-border-color: rgba(0, 0, 0, 0.05);
}

:deep(.el-table__inner-wrapper::before) {
  display: none;
}

.player-info-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s;
  padding: 4px 0;
}

.player-info-cell:hover {
  transform: translateX(4px);
}

.player-text {
  display: flex;
  flex-direction: column;
}

.player-name {
  font-weight: 600;
  color: var(--text-color);
}

.wca-id {
  font-size: 12px;
  color: var(--text-color-secondary);
  font-family: monospace;
}

.bio-text {
  color: var(--text-color-secondary);
  font-size: 14px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.date-tag {
  font-size: 13px;
  color: var(--text-color-secondary);
  background: rgba(0, 0, 0, 0.03);
  padding: 4px 8px;
  border-radius: 6px;
  font-family: monospace;
}

/* 分页 */
.pagination-container {
  margin-top: 32px;
  display: flex;
  justify-content: center;
}

:deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
  background-color: var(--primary-color);
}

:deep(.el-pagination.is-background .el-pager li) {
  background-color: rgba(255, 255, 255, 0.5);
}

/* 响应式 */
@media (max-width: 768px) {
  .view-container {
    padding: var(--space-lg) var(--space-md);
  }

  .bento-card {
    padding: 20px;
    border-radius: 16px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }
  
  .header-right {
    width: 100%;
  }

  .search-input {
    width: 100%;
  }
}
</style>