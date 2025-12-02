<template>
  <div class="leaderboard-container">
    <ElementTransition name="fade" :duration="600" appear>
      <div class="page-header glass-header">
        <div class="title-with-refresh">
          <h1 class="page-title">排行榜</h1>
          <el-button 
            circle
            plain
            size="small"
            type="info" 
            @click="refreshLeaderboard" 
            :loading="loading"
            class="refresh-icon-button"
          >
            <img v-if="!loading" src="../assets/refresh.svg" alt="刷新" class="refresh-icon" />
            <i v-else class="el-icon-loading"></i>
          </el-button>
        </div>
      </div>
    </ElementTransition>

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
      <div class="card glass-card" v-loading="loading">
        <div class="filter-header">
          <h2 class="section-title">项目排行榜</h2>
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
              width="80"
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
                {{ formatDate(scope.row.timestamp) }}
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
        
        <div class="detail-item" v-if="isValidField(selectedRecord.remark)">
          <span class="label">备注:</span>
          <span class="value">{{ selectedRecord.remark }}</span>
        </div>
        
        <div v-if="selectedRecord.videoLink" class="detail-item">
          <span class="label">视频链接:</span>
          <a :href="selectedRecord.videoLink" target="_blank" class="video-link">{{ selectedRecord.videoLink }}</a>
        </div>
        
        <div class="detail-item" v-if="selectedRecord.timestamp">
          <span class="label">提交时间:</span>
          <span class="value">{{ formatDate(selectedRecord.timestamp, true) }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRecordsStore } from '@/stores/records'
import { useUserStore } from '@/stores/user'
import ElementTransition from '@/components/ElementTransition.vue'
import { ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'
import { categories, events, getEventName, getCurrentEvents, getMemeEventsFromAPI } from '@/config/events'
import api from '@/api'

const recordsStore = useRecordsStore()
const userStore = useUserStore()

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

// 格式化时间
const formatTime = (time) => {
  return recordsStore.formatTime(time)
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
  padding: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.title-with-refresh {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-title {
  font-size: 28px;
  font-weight: bold;
  color: var(--text-color);
  margin: 0;
}

.refresh-icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-icon {
  width: 16px;
  height: 16px;
}

.error-alert {
  margin-bottom: 16px;
}

.card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.filter-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  width: 100%;
}

.category-select,
.event-select {
  min-width: 120px;
  width: auto;
  flex: 0 1 auto;
}

.rank-type-select {
  margin-left: 0;
}

.table-responsive {
  overflow-x: auto;
}

.leaderboard-table {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
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

.gold-medal {
  color: #f7d794;
  font-size: 20px;
}

.silver-medal {
  color: #c0c0c0;
  font-size: 20px;
}

.bronze-medal {
  color: #cd7f32;
  font-size: 20px;
}

.rank-number {
  font-weight: 600;
  color: var(--text-color);
}

.player-cell {
  display: flex;
  align-items: center;
  padding-left: 8px;
}

.player-name {
  font-weight: 600;
  color: inherit;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 16px;
  letter-spacing: 0.5px;
  text-decoration: none;
  transition: all var(--duration-normal) var(--ease-in-out);
  position: relative;
}

.player-name::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--primary-color);
  transition: width var(--duration-normal) var(--ease-in-out);
}

.player-name:hover {
  transform: translateY(-1px);
}

.player-name:hover::after {
  width: 100%;
}

.time-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.time-value {
  font-weight: 600;
  color: var(--text-color);
  font-size: 16px;
}

.time-value.clickable {
  color: #1e88a8;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.time-value.clickable:hover {
  color: #409eff;
  text-decoration: underline;
}

.time-value.clickable:active {
  transform: scale(0.98);
}

.no-event-selected {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.record-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  gap: 8px;
}

.label {
  font-weight: 500;
  color: var(--text-color);
  min-width: 80px;
}

.value {
  color: var(--text-color);
  flex: 1;
}

.video-link {
  color: #409eff;
  text-decoration: none;
}

.video-link:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .leaderboard-container {
    padding: 12px;
    gap: 24px;
  }

  .page-title {
    font-size: 24px;
  }

  .section-title {
    font-size: 18px;
  }

  .filter-header {
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 16px;
  }

  .filter-controls {
    width: 100%;
  }

  .filter-row {
    flex-direction: column;
    width: 100%;
  }

  .category-select,
  .event-select {
    width: 100%;
  }

  .rank-type-select {
    margin-left: 0;
    align-self: center;
  }

  :deep(.hide-on-mobile) {
    display: none;
  }

  .player-cell {
    gap: 6px;
  }

  .player-name {
    font-size: 14px;
  }

  .time-value {
    font-size: 14px;
  }
  
  .time-value.clickable {
    background-color: rgba(30, 136, 168, 0.1);
    padding: 4px 8px;
    border-radius: 4px;
  }
}

@media (max-width: 480px) {
  .leaderboard-container {
    padding: 8px;
    gap: 16px;
  }

  .page-title {
    font-size: 20px;
  }

  .section-title {
    font-size: 16px;
  }

  .card {
    padding: 16px;
  }

  .player-name {
    font-size: 13px;
  }

  .time-value {
    font-size: 13px;
  }
  }

.time-value {
  font-size: 13px;
  }

.time-value.clickable {
  background-color: rgba(30, 136, 168, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
}
</style> 