<template>
  <div class="leaderboard-container">
    <!-- Dynamic Ambient Orbs -->
    <div class="ambient-orb orb-1"></div>
    <div class="ambient-orb orb-2"></div>

    <div v-if="error" class="error-alert">
      <el-alert
        title="获取数据失败"
        type="error"
        :description="error"
        show-icon
        closable
        @close="error = ''"
      />
    </div>

    <ElementTransition name="slide-up" :duration="600" :delay="200" appear>
      <div class="bento-card" v-loading="loading">
        <div class="filter-header">
          <h2 class="section-title">
            <el-icon class="title-icon"><Trophy /></el-icon>
            排行榜
          </h2>
          <div class="filter-controls">
            <div class="filter-row">
              <el-select v-model="selectedCategory" placeholder="选择项目类型" class="category-select glass-select">
                <el-option
                  v-for="category in categories"
                  :key="category.value"
                  :label="category.label"
                  :value="category.value"
                />
              </el-select>
              <el-select
                v-model="selectedEvent"
                placeholder="选择具体项目"
                class="event-select glass-select"
                :loading="loading"
              >
                <el-option-group
                  v-for="group in currentEvents"
                  :key="group.label"
                  :label="group.label"
                >
                  <el-option
                    v-for="item in group.options"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-option-group>
              </el-select>
              <el-radio-group v-model="rankType" class="rank-type-select">
                <el-radio-button label="single">单次</el-radio-button>
                <el-radio-button label="average">平均</el-radio-button>
              </el-radio-group>
            </div>
          </div>
        </div>

        <div v-if="selectedEvent && !selectedEvent.endsWith('_all')" class="table-responsive">
          <el-table
            :data="leaderboardData"
            style="width: 100%"
            :stripe="true"
            class="leaderboard-table glass-table"
            empty-text="暂无排行榜数据"
          >
            <el-table-column 
              prop="rank" 
              label="排名" 
              min-width="60"
              align="center"
            >
              <template #default="scope">
                <div class="rank-cell">
                  <span v-if="scope.row.rank <= 3" class="medal-rank">
                    <el-icon v-if="scope.row.rank === 1" class="gold-medal">
                      <Icon icon="mdi:trophy" />
                    </el-icon>
                    <el-icon v-else-if="scope.row.rank === 2" class="silver-medal">
                      <Icon icon="mdi:trophy" />
                    </el-icon>
                    <el-icon v-else-if="scope.row.rank === 3" class="bronze-medal">
                      <Icon icon="mdi:trophy" />
                    </el-icon>
                  </span>
                  <span v-else class="rank-number">{{ scope.row.rank }}</span>
                </div>
              </template>
            </el-table-column>
            
            <el-table-column
              label="选手"
              min-width="120"
            >
              <template #default="scope">
                <div class="player-cell">
                  <router-link :to="`/user/${scope.row.userId}`" class="player-name">
                    {{ scope.row.nickname }}
                  </router-link>
                </div>
              </template>
            </el-table-column>
            
            <el-table-column
              :label="rankType === 'single' ? '单次成绩' : '平均成绩'"
              min-width="120"
              align="center"
            >
              <template #default="scope">
                <div class="time-cell">
                  <span class="time-value" @click="viewRecord(scope.row.recordId)" :class="{ 'clickable': scope.row.recordId }">
                    {{ formatTime(scope.row.time) }}
                  </span>
                </div>
              </template>
            </el-table-column>
            
            <el-table-column
              label="提交时间"
              min-width="120"
              class-name="hide-on-mobile"
            >
              <template #default="scope">
              <span class="date-text">{{ formatDate(scope.row.timestamp) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <div v-else-if="selectedEvent && selectedEvent.endsWith('_all')" class="no-event-selected">
          <el-empty description="请选择具体项目查看排行榜" />
        </div>
        
        <div v-else class="no-event-selected">
          <el-empty description="请选择项目查看排行榜" />
        </div>
      </div>
    </ElementTransition>

    <!-- 记录详情对话框 -->
    <el-dialog
      v-model="recordDetailVisible"
      title="记录详情"
      width="500px"
      class="glass-dialog"
    >
      <div v-if="selectedRecord" class="record-details glass-form">
        <div class="detail-item">
          <span class="label">项目:</span>
          <span class="value">{{ getEventName(selectedRecord.event) }}</span>
        </div>
        
        <div class="detail-item">
          <span class="label">单次成绩:</span>
          <span class="value">{{ selectedRecord.singleSeconds ? formatTime(selectedRecord.singleSeconds) : '-' }}</span>
        </div>
        
        <div class="detail-item">
          <span class="label">平均成绩:</span>
          <span class="value">{{ selectedRecord.averageSeconds ? formatTime(selectedRecord.averageSeconds) : '-' }}</span>
        </div>
        
        <div class="detail-item" v-if="isValidField(getCubeValue(selectedRecord))">
          <span class="label">使用魔方:</span>
          <span class="value">{{ getCubeValue(selectedRecord) }}</span>
        </div>
        
        <div class="detail-item" v-if="isValidField(getMethodValue(selectedRecord))">
          <span class="label">使用方法:</span>
          <span class="value">{{ getMethodValue(selectedRecord) }}</span>
        </div>
        
        <!-- 已移除感想与视频链接字段展示 -->
        
        <div class="detail-item" v-if="selectedRecord.timestamp">
          <span class="label">提交时间:</span>
          <span class="value date-text">{{ formatDate(selectedRecord.timestamp, true) }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRecordsStore } from '@/stores/records'
import ElementTransition from '@/components/ElementTransition.vue'
import { ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'
import { Trophy } from '@element-plus/icons-vue'
import { categories, events, getEventName, getMemeEventsFromAPI } from '@/config/events'
import api from '@/api'
import { formatTime } from '@/utils/timeFormatter'

const recordsStore = useRecordsStore()

const selectedCategory = ref('official')
const selectedEvent = ref('333')
const rankType = ref('single') // 'single' 或 'average'
const loading = ref(false)
const error = ref('')
const recordDetailVisible = ref(false)
const selectedRecord = ref(null)
const dynamicMemeEvents = ref([])
// 来自后端 Astrobot 接口的排行榜数据
const leaderboardData = ref([])

// 从后端获取排行榜数据
const fetchLeaderboard = async () => {
  // 只有在选择了具体项目时才请求
  if (!selectedEvent.value || selectedEvent.value.endsWith('_all')) {
    leaderboardData.value = []
    return
  }

  loading.value = true
  error.value = ''

  try {
    const resp = await api.getAstroLeaderboard({
      event: selectedEvent.value,
      rankType: rankType.value
    })

    if (resp && resp.code === 200) {
      const list = resp.data?.leaderboard || []
      // 后端已计算好 rank/time/nickname，这里直接使用
      leaderboardData.value = list.map(item => ({
        rank: item.rank,
        userId: item.userId,
        nickname: item.nickname || '未知用户',
        time: item.time,
        recordId: item.recordId,
        timestamp: item.timestamp
      }))
    } else {
      throw new Error(resp?.message || '获取排行榜失败')
    }
  } catch (err) {
    console.error('获取排行榜失败:', err)
    error.value = err.message || '获取排行榜失败，请稍后再试'
    leaderboardData.value = []
  } finally {
    loading.value = false
  }
}

// 刷新按钮：同步刷新排行榜和本地记录（用于查看记录详情等）
const refreshLeaderboard = async () => {
  loading.value = true
  error.value = ''
  
  try {
    await Promise.all([
      recordsStore.fetchRecords(),
      fetchLeaderboard()
    ])
    ElMessage.success('数据刷新成功')
  } catch (err) {
    console.error('刷新排行榜失败:', err)
    error.value = err.message || '获取数据失败，请稍后再试'
  } finally {
    loading.value = false
  }
}

// 初始化数据
onMounted(async () => {
  loading.value = true
  error.value = ''
  
  try {
    // 加载记录（用于详情弹窗等）和排行榜
    await Promise.all([
      recordsStore.fetchRecords(),
      fetchLeaderboard()
    ])
    // 预加载整活项目
    await loadMemeEvents()
  } catch (err) {
    console.error('获取排行榜数据失败:', err)
    error.value = err.message || '获取数据失败，请稍后再试'
  } finally {
    loading.value = false
  }
})

const currentEvents = computed(() => {
  if (selectedCategory.value === 'all') {
    return [events.all]
  }
  
  // 如果是整活项目，使用动态数据
  if (selectedCategory.value === 'meme') {
    const staticOptions = events.meme.options || []
    const dynamicOptions = dynamicMemeEvents.value.map(event => ({
      label: event.eventName,
      value: event.eventCode
    }))
    
    // 合并静态和动态选项
    const allOptions = [...staticOptions]
    
    // 添加动态选项（避免重复）
    dynamicOptions.forEach(dynamicOption => {
      if (!allOptions.some(option => option.value === dynamicOption.value)) {
        allOptions.push(dynamicOption)
      }
    })
    
    return [{
      label: events.meme.label,
      options: allOptions
    }]
  }
  
  return selectedCategory.value ? [events[selectedCategory.value]] : []
})

watch(selectedCategory, async (newCategory) => {
  selectedEvent.value = newCategory ? `${newCategory}_all` : ''
  
  // 如果选择了整活项目，加载动态数据
  if (newCategory === 'meme') {
    await loadMemeEvents()
  }
})

// 选择具体项目或排行榜类型变化时，重新获取排行榜
watch(selectedEvent, async (newEvent) => {
  if (!newEvent || newEvent.endsWith('_all')) {
    leaderboardData.value = []
    return
  }
  await fetchLeaderboard()
})

watch(rankType, async () => {
  await fetchLeaderboard()
})

// 加载动态整活项目
const loadMemeEvents = async () => {
  try {
    const memeEvents = await getMemeEventsFromAPI()
    dynamicMemeEvents.value = memeEvents.filter(event => event.isActive !== false)
  } catch (error) {
    console.error('加载整活项目失败:', error)
    dynamicMemeEvents.value = []
  }
}

// 格式化日期
const formatDate = (timestamp, showTime = false) => {
  if (!timestamp) return '-'
  
  // 处理可能的MongoDB日期格式
  let dateValue = timestamp;
  if (typeof timestamp === 'object' && timestamp.$date) {
    dateValue = timestamp.$date;
  }
  
  const date = new Date(dateValue)
  if (isNaN(date)) return '-'
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  let result = `${year}.${month}.${day}`
  
  if (showTime) {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    result += ` ${hours}:${minutes}`
  }
  
  return result
}

// 从记录中获取魔方信息
const getCubeValue = (record) => {
  return record.cube || record.single?.cube || record.average?.cube || ''
}

// 从记录中获取方法信息
const getMethodValue = (record) => {
  return record.method || record.single?.method || record.average?.method || ''
}

// 检查字段是否有效
const isValidField = (value) => {
  return value !== null && value !== undefined && value !== 'null' && value !== ''
}

// 查看记录详情
const viewRecord = async (recordId) => {
  try {
    const record = recordsStore.records.find(r => r._id === recordId)
    if (record) {
      selectedRecord.value = record
      recordDetailVisible.value = true
    } else {
      ElMessage.error('记录不存在')
    }
  } catch (error) {
    console.error('获取记录详情失败:', error)
    ElMessage.error('获取记录详情失败')
  }
}
</script>

<style scoped>
.leaderboard-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  min-height: 80vh;
}

/* Ambient Orbs */
.ambient-orb {
  position: fixed;
  border-radius: 50%;
  filter: blur(80px);
  z-index: 0;
  opacity: 0.6;
  animation: floatOrb 20s infinite ease-in-out;
  pointer-events: none;
}

.orb-1 {
  top: -10%;
  right: -5%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(66, 211, 146, 0.4) 0%, rgba(66, 211, 146, 0) 70%);
  animation-delay: 0s;
}

.orb-2 {
  bottom: 10%;
  left: -10%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(64, 158, 255, 0.4) 0%, rgba(64, 158, 255, 0) 70%);
  animation-delay: -5s;
}

@keyframes floatOrb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
}

/* Bento Card Style */
.bento-card {
  background: var(--glass-bg-light);
  backdrop-filter: blur(var(--glass-blur-lg));
  -webkit-backdrop-filter: blur(var(--glass-blur-lg));
  border: var(--glass-border);
  border-radius: 24px;
  padding: 32px;
  box-shadow: var(--shadow-lg);
  position: relative;
  z-index: 1;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.bento-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--glass-shadow-lg);
}

.error-alert {
  margin-bottom: 16px;
  position: relative;
  z-index: 2;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 24px;
}

.section-title {
  font-size: 28px;
  font-weight: 800;
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 32px;
  color: #f1c40f; /* Gold for trophy */
  filter: drop-shadow(0 2px 4px rgba(241, 196, 15, 0.3));
}

.filter-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.category-select,
.event-select {
  min-width: 140px;
}

/* Glass Select Overrides */
:deep(.el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.5) !important;
  backdrop-filter: blur(8px);
  box-shadow: none !important;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

:deep(.el-input__wrapper.is-focus) {
  background-color: rgba(255, 255, 255, 0.8) !important;
  border-color: var(--primary-color) !important;
  box-shadow: 0 0 0 1px var(--primary-color) !important;
}

.table-responsive {
  overflow-x: auto;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  padding: 8px;
  -webkit-overflow-scrolling: touch;
}

/* Glass Table Styles */
.leaderboard-table {
  background: transparent !important;
  --el-table-border-color: rgba(0, 0, 0, 0.05);
  --el-table-header-bg-color: transparent;
  --el-table-row-hover-bg-color: rgba(66, 211, 146, 0.1);
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
}

:deep(.el-table__inner-wrapper::before) {
  display: none;
}

:deep(.el-table th.el-table__cell) {
  background-color: transparent !important;
  font-weight: 700;
  color: #2c3e50;
  font-size: 15px;
}

:deep(.el-table tr) {
  background-color: transparent !important;
}

.rank-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.medal-rank {
  display: flex;
  align-items: center;
  justify-content: center;
}

.gold-medal { color: #f7d794; font-size: 24px; filter: drop-shadow(0 2px 4px rgba(247, 215, 148, 0.4)); }
.silver-medal { color: #dcdde1; font-size: 24px; filter: drop-shadow(0 2px 4px rgba(220, 221, 225, 0.4)); }
.bronze-medal { color: #e1b12c; font-size: 24px; filter: drop-shadow(0 2px 4px rgba(225, 177, 44, 0.4)); }

.rank-number {
  font-weight: 700;
  color: var(--text-color);
  font-family: 'JetBrains Mono', monospace;
  font-size: 16px;
}

.player-cell {
  display: flex;
  align-items: center;
  padding-left: 8px;
}

.player-name {
  font-weight: 600;
  color: #2c3e50;
  text-decoration: none;
  font-size: 16px;
  transition: all 0.3s ease;
  position: relative;
}

.player-name:hover {
  color: var(--primary-color);
}

.time-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.time-value {
  font-weight: 700;
  color: #2c3e50;
  font-size: 16px;
  font-family: 'JetBrains Mono', monospace;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.time-value.clickable {
  cursor: pointer;
  background: rgba(64, 158, 255, 0.1);
}

.time-value.clickable:hover {
  background: rgba(64, 158, 255, 0.2);
  color: var(--primary-color);
  transform: translateY(-1px);
}

.date-text {
  font-family: 'JetBrains Mono', monospace;
  color: #666;
  font-size: 14px;
}

.no-event-selected {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

/* Glass Dialog & Details */
:deep(.glass-dialog) {
  border-radius: 20px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

:deep(.el-dialog__header) {
  margin: 0;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

:deep(.el-dialog__body) {
  padding: 24px;
}

.record-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
}

.detail-item:last-child {
  border-bottom: none;
}

.label {
  font-weight: 600;
  color: #666;
  min-width: 90px;
}

.value {
  color: #2c3e50;
  flex: 1;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 500;
}

@media (max-width: 768px) {
  .leaderboard-container {
    padding: 16px;
    gap: 20px;
  }

  .bento-card {
    padding: 20px;
    border-radius: 16px;
  }

  .section-title {
    font-size: 22px;
  }

  .filter-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 24px;
  }

  .filter-row {
    flex-direction: column;
    width: 100%;
    align-items: stretch;
  }

  .category-select,
  .event-select,
  .rank-type-select {
    width: 100%;
  }

  .rank-type-select {
    margin: 0;
    display: flex;
  }
  
  :deep(.el-radio-button) {
    flex: 1;
  }
  
  :deep(.el-radio-button__inner) {
    width: 100%;
  }

  :deep(.hide-on-mobile) {
    display: none;
  }
  
  /* Table Mobile Optimizations */
  :deep(.el-table .cell) {
    padding: 8px 4px;
    line-height: 1.4;
  }

  .time-value {
    font-size: 14px;
    padding: 2px 6px;
  }
  
  .rank-number {
    font-size: 14px;
  }
  
  .player-name {
    font-size: 14px;
    white-space: normal;
    display: block;
    line-height: 1.3;
  }
  
  .medal-rank {
    transform: scale(0.9);
  }
}
</style> 