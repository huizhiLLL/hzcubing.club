<template>
  <div class="players-container">
    <ElementTransition name="slide-up" :duration="600" :delay="200" appear>
      <el-card class="players-card glass-card">
        <template #header>
          <div class="card-header">
            <h2>所有选手</h2>
            <el-input
              v-model="searchQuery"
              placeholder="搜索选手昵称"
              clearable
              class="search-input"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
        </template>
        
        <el-table
          v-loading="loading"
          :data="paginatedPlayers"
          style="width: 100%"
          :empty-text="loading ? '加载中...' : '暂无选手数据'"
          class="glass-table"
        >
          <el-table-column prop="nickname" label="昵称" min-width="120">
            <template #default="scope">
              <router-link 
                :to="`/user/${scope.row._id || scope.row.id}`" 
                class="player-name-link"
              >
                {{ scope.row.nickname }}
                <span v-if="hasWcaId(scope.row)" class="wca-id">({{ getWcaId(scope.row) }})</span>
              </router-link>
            </template>
          </el-table-column>
          
          <el-table-column prop="bio" label="签名" min-width="200">
            <template #default="scope">
              {{ scope.row.bio || '' }}
            </template>
          </el-table-column>
          
          <el-table-column label="注册时间" min-width="120">
            <template #default="scope">
              {{ formatDate(scope.row.createTime) }}
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination-container" v-if="players.length > 0">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            :total="filteredPlayers.length"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </ElementTransition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import ElementTransition from '@/components/ElementTransition.vue'
import api from '@/api/index.js'

const router = useRouter()
const players = ref([])
const loading = ref(true)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

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

// 查看选手详情
const viewPlayerDetails = (player) => {
  // 跳转到选手详情页
  router.push(`/user/${player._id || player.id}`)
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
.players-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 16px;
}

.players-card {
  margin-bottom: 0;
}

/* 确保 el-card 的圆角与 glass-card 统一 */
:deep(.el-card) {
  border-radius: var(--radius-xl);
}

:deep(.el-card__header) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding: 20px 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.card-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  color: var(--text-color);
}

.search-input {
  width: 250px;
}

.player-name-link {
  color: var(--el-color-primary);
  text-decoration: none;
  font-weight: 500;
}

.player-name-link:hover {
  text-decoration: underline;
  color: var(--el-color-primary-light-3);
}

.wca-id {
  font-size: 0.9em;
  color: var(--el-text-color-secondary);
  margin-left: 4px;
}

.pagination-container {
  margin-top: 24px;
  display: flex;
  justify-content: center;
  width: 100%;
  overflow-x: auto;
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .search-input {
    width: 100%;
  }
}
</style> 