<template>
  <div class="records-container">
    <!-- 动态背景光球 -->
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

    <ElementTransition name="slide-up" :duration="600" :delay="0" appear>
      <div class="bento-card glass-card" v-loading="loading">
        <div class="filter-header">
          <h2 class="section-title">
            <el-icon><Trophy /></el-icon> 记录榜单
          </h2>
          <div class="filter-controls">
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
          </div>
        </div>
        <div class="table-responsive">
          <records-table :records="filteredRecords" />
        </div>
      </div>
    </ElementTransition>

    <ElementTransition name="slide-up" :duration="600" :delay="200" appear>
      <div class="bento-card glass-card" v-loading="loading">
        <div class="filter-header">
          <h2 class="section-title">
            <el-icon><Timer /></el-icon> 历史记录
          </h2>
          <div class="filter-controls">
            <el-select
              v-model="selectedHistoryEvent"
              placeholder="选择项目"
              class="event-select glass-select"
            >
              <el-option-group
                v-for="group in allEvents"
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
          </div>
        </div>

        <div v-if="selectedHistoryEvent" class="table-responsive">
          <el-table
            :data="historyRecords"
            style="width: 100%"
            class="custom-table glass-table"
            :header-cell-style="{ background: 'transparent', color: 'var(--el-text-color-primary)' }"
            :row-style="{ background: 'transparent' }"
          >
            <el-table-column 
              type="expand"
            >
              <template #default="props">
                <div class="record-details">
                  <div class="detail-item">
                    <span class="detail-label">单次成绩:</span>
                    <span class="detail-value">
                      {{ formatTime(props.row.singleSeconds) }}
                      <el-tag v-if="props.row.isSingleRecord" size="small" type="danger" effect="dark" class="rank-tag">GR</el-tag>
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">单次保持者:</span>
                    <span class="detail-value">
                      <template v-if="props.row.userId">
                        <router-link :to="`/user/${props.row.userId}`" class="player-link">
                          {{ props.row.nickname || '未知' }}
                        </router-link>
                      </template>
                      <template v-else>
                        <span>{{ props.row.nickname || '-' }}</span>
                        <el-tooltip content="该选手暂未注册账号" placement="top" v-if="props.row.nickname">
                          <el-icon class="info-icon"><InfoFilled /></el-icon>
                        </el-tooltip>
                      </template>
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">平均成绩:</span>
                    <span class="detail-value">
                      {{ formatTime(props.row.averageSeconds) }}
                      <el-tag v-if="props.row.isAverageRecord" size="small" type="danger" effect="dark" class="rank-tag">GR</el-tag>
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">平均保持者:</span>
                    <span class="detail-value">
                      <template v-if="props.row.userId">
                        <router-link :to="`/user/${props.row.userId}`" class="player-link">
                          {{ props.row.nickname || '未知' }}
                        </router-link>
                      </template>
                      <template v-else>
                        <span>{{ props.row.nickname || '-' }}</span>
                        <el-tooltip content="该选手暂未注册账号" placement="top" v-if="props.row.nickname">
                          <el-icon class="info-icon"><InfoFilled /></el-icon>
                        </el-tooltip>
                      </template>
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">时间:</span>
                    <span class="detail-value date-text">{{ formatDate(props.row.timestamp) }}</span>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column 
              prop="index" 
              label="序号" 
              width="60"
              type="index"
              :index="1"
              align="center"
              class-name="hide-on-mobile"
            />
            <el-table-column
              label="单次"
              min-width="120"
            >
              <template #default="scope">
                <div class="record-cell">
                  <div class="record-main">
                    <span class="time">{{ formatTime(scope.row.singleSeconds) }}</span>
                    <el-tag v-if="scope.row.isSingleRecord" size="small" type="danger" effect="dark" class="rank-tag">GR</el-tag>
                  </div>
                  <div class="record-sub">
                    <template v-if="scope.row.userId">
                      <router-link :to="`/user/${scope.row.userId}`" class="player-link">
                        {{ scope.row.nickname || '未知' }}
                      </router-link>
                    </template>
                    <template v-else>
                      <span>{{ scope.row.nickname || '-' }}</span>
                      <el-tooltip content="该选手暂未注册账号" placement="top" v-if="scope.row.nickname">
                        <el-icon class="info-icon"><InfoFilled /></el-icon>
                      </el-tooltip>
                    </template>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column
              label="平均"
              min-width="120"
            >
              <template #default="scope">
                <div class="record-cell">
                  <div class="record-main">
                    <span class="time">{{ formatTime(scope.row.averageSeconds) }}</span>
                    <el-tag v-if="scope.row.isAverageRecord" size="small" type="danger" effect="dark" class="rank-tag">GR</el-tag>
                  </div>
                  <div class="record-sub">
                    <template v-if="scope.row.userId">
                      <router-link :to="`/user/${scope.row.userId}`" class="player-link">
                        {{ scope.row.nickname || '未知' }}
                      </router-link>
                    </template>
                    <template v-else>
                      <span>{{ scope.row.nickname || '-' }}</span>
                      <el-tooltip content="该选手暂未注册账号" placement="top" v-if="scope.row.nickname">
                        <el-icon class="info-icon"><InfoFilled /></el-icon>
                      </el-tooltip>
                    </template>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column 
              prop="timestamp" 
              label="时间"
              min-width="120"
              class-name="hide-on-mobile"
            >
              <template #default="scope">
                <span class="date-text">{{ formatDate(scope.row.timestamp) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </ElementTransition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRecordsStore } from '@/stores/records'
import RecordsTable from '@/components/RecordsTable.vue'
import ElementTransition from '@/components/ElementTransition.vue'
import { ElMessage } from 'element-plus'
import { InfoFilled, Trophy, Timer } from '@element-plus/icons-vue'
import { categories, events, getEventName, getAllEvents, getMemeEventsFromAPI } from '@/config/events'
import { formatTime } from '@/utils/timeFormatter'

const recordsStore = useRecordsStore()

const selectedCategory = ref('official')
const selectedEvent = ref('official_all')
const selectedHistoryEvent = ref('333')
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const error = ref('')
const dynamicMemeEvents = ref([])

const loadMemeEvents = async () => {
  try {
    const memeEvents = await getMemeEventsFromAPI()
    dynamicMemeEvents.value = memeEvents.filter(event => event.isActive !== false)
  } catch (err) {
    console.error('加载整活项目失败:', err)
    dynamicMemeEvents.value = []
  }
}

// 刷新记录数据
const refreshRecords = async () => {
  loading.value = true
  error.value = ''
  
  try {
    await recordsStore.fetchRecords()
    ElMessage.success('数据刷新成功')
  } catch (err) {
    console.error('刷新记录失败:', err)
    error.value = err.message || '获取数据失败，请稍后再试'
  } finally {
    loading.value = false
  }
}

// 初始化记录
onMounted(async () => {
  loading.value = true
  error.value = ''
  
  try {
    // 从后端获取所有记录
    await recordsStore.fetchRecords()
    await loadMemeEvents()
    // 补齐当前历史项目下的昵称
    const currentList = recordsStore.getRecordsByEvent(selectedHistoryEvent.value)
    await recordsStore.ensureNicknamesForRecords(currentList)
  } catch (err) {
    console.error('获取记录失败:', err)
    error.value = err.message || '获取数据失败，请稍后再试'
  } finally {
    loading.value = false
  }
})

const mergedMemeOptions = computed(() => {
  const staticOptions = events.meme?.options || []
  const merged = [...staticOptions]
  
  dynamicMemeEvents.value.forEach(event => {
    if (!merged.some(option => option.value === event.eventCode)) {
      merged.push({
        label: event.eventName,
        value: event.eventCode
      })
    }
  })
  
  return merged
})

const currentEvents = computed(() => {
  if (selectedCategory.value === 'all') {
    return [events.all]
  }
  
  if (selectedCategory.value === 'meme') {
    return [{
      label: events.meme.label,
      options: mergedMemeOptions.value
    }]
  }
  return selectedCategory.value ? [events[selectedCategory.value]] : []
})

watch(selectedCategory, (newCategory) => {
  selectedEvent.value = newCategory ? `${newCategory}_all` : ''
  if (newCategory === 'meme') {
    loadMemeEvents()
  }
})

// 获取当前选择项目的所有记录
const getCurrentEventRecords = () => {
  // 如果选择了具体项目
  if (!selectedEvent.value.endsWith('_all')) {
    return recordsStore.getRecordsByEvent(selectedEvent.value)
  }
  return []
}

// 最佳记录的筛选逻辑
const filteredRecords = computed(() => {
  const bestRecords = recordsStore.getBestRecords()
  if (selectedEvent.value === 'all_all') {
    return Object.values(bestRecords)
  }
  
  if (selectedEvent.value.endsWith('_all')) {
    const category = selectedEvent.value.split('_')[0]
    const eventOptions = category === 'meme' ? mergedMemeOptions.value : (events[category]?.options || [])
    const validEvents = eventOptions.filter(opt => !opt.value.endsWith('_all')).map(opt => opt.value)
    return Object.values(bestRecords).filter(record => validEvents.includes(record.event))
  }
  
  return [bestRecords[selectedEvent.value]].filter(Boolean)
})

// 历史记录的筛选逻辑
const historyRecords = computed(() => {
  if (!selectedHistoryEvent.value) return []
  
  const records = recordsStore.getRecordsByEvent(selectedHistoryEvent.value)
  
  // 记录打破历史的逻辑
  const recordBreakHistory = []
  let bestSingleTime = Infinity
  let bestAverageTime = Infinity
  
  // 按时间从早到晚排序
  const sortedRecords = [...records].sort((a, b) => {
    // 安全地解析日期，确保有效比较
    const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0
    const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0
    
    // 如果日期相同，优先考虑有更好成绩的记录
    if (dateA === dateB) {
      const aSingleTime = a.single?.time ? recordsStore.convertToSeconds(a.single.time) : Infinity
      const bSingleTime = b.single?.time ? recordsStore.convertToSeconds(b.single.time) : Infinity
      const aAverageTime = a.average?.time ? recordsStore.convertToSeconds(a.average.time) : Infinity
      const bAverageTime = b.average?.time ? recordsStore.convertToSeconds(b.average.time) : Infinity
      
      // 比较最佳成绩（单次或平均）
      const aBestTime = Math.min(aSingleTime, aAverageTime)
      const bBestTime = Math.min(bSingleTime, bAverageTime)
      return aBestTime - bBestTime
    }
    
    return dateA - dateB
  })
  
  sortedRecords.forEach(record => {
    let isBreakingRecord = false
    
    // 确保有效地转换时间
    const singleTime = typeof record.singleSeconds === 'number' ? record.singleSeconds : null
    const averageTime = typeof record.averageSeconds === 'number' ? record.averageSeconds : null
    
    // 检查单次是否打破记录
    if (singleTime !== null && singleTime < bestSingleTime) {
      bestSingleTime = singleTime
      isBreakingRecord = true
    }
    
    // 检查平均是否打破记录
    if (averageTime !== null && averageTime < bestAverageTime) {
      bestAverageTime = averageTime
      isBreakingRecord = true
    }
    
    // 如果打破了记录，添加到历史中
    if (isBreakingRecord) {
      recordBreakHistory.push({
        ...record,
        isSingleRecord: singleTime !== null && singleTime === bestSingleTime,
        isAverageRecord: averageTime !== null && averageTime === bestAverageTime,
        nickname: record.nickname || recordsStore.getNicknameForUser(record.userId) || ''
      })
    }
  })
  
  // 将结果反转，使最新记录在上面
  recordBreakHistory.reverse()
  
  // 不再分页，直接返回全部
  return recordBreakHistory
})

// 使用统一的格式化时间函数

const formatDate = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}.${month}.${day}`
}

// 所有项目的列表
const allEvents = computed(() => {
  const all = getAllEvents()
  const memeSection = all.find(section => section.label === events.meme.label)
  if (memeSection) {
    memeSection.options = mergedMemeOptions.value.filter(opt => !opt.value.endsWith('_all'))
  }
  return all
})
</script>

<style scoped>
.records-container {
  min-height: 100vh;
  padding: var(--space-xl);
  position: relative;
  overflow-x: hidden;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* 动态背景光球 */
.ambient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  z-index: 0;
  opacity: 0.4;
  animation: float 10s infinite ease-in-out;
}

.orb-1 {
  top: 5%;
  right: 5%;
  width: 400px;
  height: 400px;
  background: var(--primary-gradient);
}

.orb-2 {
  bottom: 10%;
  left: 5%;
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  animation-delay: -5s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(30px, -30px); }
}

/* Bento Card 通用样式 */
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
  box-shadow: var(--shadow-xl);
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.error-alert {
  margin-bottom: -16px;
  z-index: 2;
  position: relative;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.filter-controls {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title .el-icon {
  color: var(--primary-color);
  font-size: 24px;
}

/* Glass Inputs */
:deep(.glass-select .el-input__wrapper) {
  background: rgba(255, 255, 255, 0.5);
  box-shadow: none;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  padding: 4px 12px;
  transition: all 0.3s;
}

:deep(.glass-select .el-input__wrapper:hover),
:deep(.glass-select .el-input__wrapper.is-focus) {
  background: rgba(255, 255, 255, 0.8);
  border-color: var(--primary-color);
  box-shadow: 0 0 0 1px var(--primary-color-light);
}

.category-select {
  width: 140px;
}

.event-select {
  width: 180px;
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* Glass Table */
.glass-table {
  background: transparent !important;
  --el-table-border-color: rgba(0, 0, 0, 0.05);
  --el-table-header-bg-color: transparent;
  --el-table-row-hover-bg-color: rgba(66, 211, 146, 0.1);
}

:deep(.el-table__inner-wrapper::before) {
  display: none;
}

:deep(.el-table .cell) {
  white-space: nowrap;
}

.record-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.record-main {
  font-weight: 700;
  font-size: 1em;
  display: flex;
  align-items: center;
  gap: 8px;
}

.time {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
  color: #2c3e50;
}

.record-sub {
  color: var(--el-text-color-secondary);
  font-size: 0.9em;
}

.rank-tag {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 800;
  border: none;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5253 100%);
  box-shadow: 0 2px 8px rgba(238, 82, 83, 0.4);
}

.record-details {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  margin: 10px 0;
}

.detail-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.detail-label {
  color: #666;
  font-weight: 600;
  min-width: 80px;
}

.detail-value {
  font-weight: 500;
  color: #2c3e50;
  font-family: 'JetBrains Mono', monospace;
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-text {
  font-family: 'JetBrains Mono', monospace;
  color: #666;
}

.player-link {
  color: var(--primary-color-dark);
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  position: relative;
}

.player-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--primary-color);
  transition: width 0.3s ease;
}

.player-link:hover {
  color: var(--primary-color);
}

.player-link:hover::after {
  width: 100%;
}

.info-icon {
  margin-left: 5px;
  font-size: 14px;
  color: var(--el-color-info);
  vertical-align: middle;
}

@media (max-width: 768px) {
  .records-container {
    padding: 16px;
    gap: 20px;
  }

  .bento-card {
    padding: 20px;
    border-radius: 16px;
  }

  .section-title {
    font-size: 18px;
  }
  
  .filter-header {
    margin-bottom: 16px;
    gap: 12px;
  }

  .filter-controls {
    width: 100%;
    flex-direction: column;
    gap: 12px;
  }
  
  .category-select,
  .event-select {
    width: 100%;
  }

  :deep(.hide-on-mobile) {
    display: none;
  }
  
  /* Table Mobile Optimizations */
  :deep(.el-table .cell) {
    padding: 8px 4px;
    font-size: 13px;
  }
  
  .record-main {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
  
  .record-sub {
    font-size: 12px;
  }
  
  .time {
    font-size: 14px;
  }
  
  .rank-tag {
    transform: scale(0.85);
    transform-origin: left center;
    margin-top: 2px;
  }
}
</style>
