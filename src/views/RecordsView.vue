<template>
  <div class="records-container">
    <ElementTransition name="fade" :duration="600" appear>
      <div class="page-header glass-header">
        <div class="title-with-refresh">
        <h1 class="page-title">记录统计</h1>
          <el-button 
            circle
            plain
            size="small"
            type="info" 
            @click="refreshRecords" 
            :loading="loading"
            class="refresh-icon-button"
          >
            <img v-if="!loading" src="../assets/refresh.svg" alt="刷新" class="refresh-icon" />
            <i v-else class="el-icon-loading"></i>
          </el-button>
        </div>
        <div class="header-actions">
        <router-link v-if="user" to="/submit-record">
          <el-button type="primary">上传成绩</el-button>
        </router-link>
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
          <h2 class="section-title">最佳记录</h2>
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

    <ElementTransition name="slide-up" :duration="600" :delay="400" appear>
      <div class="card glass-card" v-loading="loading">
        <div class="filter-header">
          <h2 class="section-title">历史记录</h2>
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
            :stripe="true"
            class="custom-table glass-table"
          >
            <el-table-column 
              type="expand"
            >
              <template #default="props">
                <div class="record-details">
                  <div class="detail-item">
                    <span class="detail-label">单次成绩：</span>
                    <span class="detail-value">
                      {{ formatTime(props.row.single?.time) }}
                      <el-tag v-if="props.row.isSingleRecord" size="small" type="danger" effect="dark">GR</el-tag>
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">单次保持者：</span>
                    <span class="detail-value">
                      <template v-if="props.row.single?.userId">
                        <router-link :to="`/user/${props.row.single.userId}`" class="player-link">
                          {{ props.row.single.nickname || '未知' }}
                        </router-link>
                      </template>
                      <template v-else>
                        <span>{{ props.row.single?.nickname || '-' }}</span>
                        <el-tooltip content="该选手暂未注册账号" placement="top" v-if="props.row.single?.nickname">
                          <el-icon class="info-icon"><InfoFilled /></el-icon>
                        </el-tooltip>
                      </template>
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">平均成绩：</span>
                    <span class="detail-value">
                      {{ formatTime(props.row.average?.time) }}
                      <el-tag v-if="props.row.isAverageRecord" size="small" type="danger" effect="dark">GR</el-tag>
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">平均保持者：</span>
                    <span class="detail-value">
                      <template v-if="props.row.average?.userId">
                        <router-link :to="`/user/${props.row.average.userId}`" class="player-link">
                          {{ props.row.average.nickname || '未知' }}
                        </router-link>
                      </template>
                      <template v-else>
                        <span>{{ props.row.average?.nickname || '-' }}</span>
                        <el-tooltip content="该选手暂未注册账号" placement="top" v-if="props.row.average?.nickname">
                          <el-icon class="info-icon"><InfoFilled /></el-icon>
                        </el-tooltip>
                      </template>
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">记录时间：</span>
                    <span class="detail-value">{{ formatDate(props.row.timestamp) }}</span>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column 
              prop="index" 
              label="序号" 
              min-width="60"
              type="index"
              :index="1"
            />
            <el-table-column
              label="单次"
              min-width="160"
            >
              <template #default="scope">
                <div class="record-cell">
                  <div class="record-main">
                    {{ formatTime(scope.row.single?.time) }}
                    <el-tag v-if="scope.row.isSingleRecord" size="small" type="danger" effect="dark">GR</el-tag>
                  </div>
                  <div class="record-sub">
                    <template v-if="scope.row.single?.userId">
                      <router-link :to="`/user/${scope.row.single.userId}`" class="player-link">
                        {{ scope.row.single.nickname || '未知' }}
                      </router-link>
                    </template>
                    <template v-else>
                      <span>{{ scope.row.single?.nickname || '-' }}</span>
                      <el-tooltip content="该选手暂未注册账号" placement="top" v-if="scope.row.single?.nickname">
                        <el-icon class="info-icon"><InfoFilled /></el-icon>
                      </el-tooltip>
                    </template>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column
              label="平均"
              min-width="160"
            >
              <template #default="scope">
                <div class="record-cell">
                  <div class="record-main">
                    {{ formatTime(scope.row.average?.time) }}
                    <el-tag v-if="scope.row.isAverageRecord" size="small" type="danger" effect="dark">GR</el-tag>
                  </div>
                  <div class="record-sub">
                    <template v-if="scope.row.average?.userId">
                      <router-link :to="`/user/${scope.row.average.userId}`" class="player-link">
                        {{ scope.row.average.nickname || '未知' }}
                      </router-link>
                    </template>
                    <template v-else>
                      <span>{{ scope.row.average?.nickname || '-' }}</span>
                      <el-tooltip content="该选手暂未注册账号" placement="top" v-if="scope.row.average?.nickname">
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
                {{ formatDate(scope.row.timestamp) }}
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :total="totalRecords"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next"
              class="responsive-pagination"
            />
          </div>
        </div>
      </div>
    </ElementTransition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useRecordsStore } from '@/stores/records'
import RecordsTable from '@/components/RecordsTable.vue'
import ElementTransition from '@/components/ElementTransition.vue'
import { ElMessage } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import { categories, events, getEventName, getCurrentEvents, getAllEvents } from '@/config/events'

const userStore = useUserStore()
const recordsStore = useRecordsStore()

const { user } = userStore

const selectedCategory = ref('official')
const selectedEvent = ref('official_all')
const selectedHistoryEvent = ref('333')
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const error = ref('')

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
  } catch (err) {
    console.error('获取记录失败:', err)
    error.value = err.message || '获取数据失败，请稍后再试'
  } finally {
    loading.value = false
  }
})

const currentEvents = computed(() => {
  if (selectedCategory.value === 'all') {
    return [events.all]
  }
  return selectedCategory.value ? [events[selectedCategory.value]] : []
})

watch(selectedCategory, (newCategory) => {
  selectedEvent.value = newCategory ? `${newCategory}_all` : ''
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
    const eventOptions = events[category]?.options || []
    const validEvents = eventOptions.slice(1).map(opt => opt.value)
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
    const singleTime = record.single?.time ? recordsStore.convertToSeconds(record.single.time) : null
    const averageTime = record.average?.time ? recordsStore.convertToSeconds(record.average.time) : null
    
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
        isAverageRecord: averageTime !== null && averageTime === bestAverageTime
      })
    }
  })
  
  // 将结果反转，使最新记录在上面
  recordBreakHistory.reverse()
  
  // 返回分页后的记录
  return recordBreakHistory
    .slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
})

const totalRecords = computed(() => {
  if (!selectedHistoryEvent.value) return 0
  
  // 计算打破记录的总数
  const records = recordsStore.getRecordsByEvent(selectedHistoryEvent.value)
  
  let bestSingleTime = Infinity
  let bestAverageTime = Infinity
  let count = 0
  
  // 按时间从早到晚排序
  const sortedRecords = [...records].sort((a, b) => {
    // 安全地解析日期，确保有效比较
    const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0
    const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0
    return dateA - dateB
  })
  
  sortedRecords.forEach(record => {
    let isBreakingRecord = false
    
    // 确保有效地转换时间
    const singleTime = record.single?.time ? recordsStore.convertToSeconds(record.single.time) : null
    const averageTime = record.average?.time ? recordsStore.convertToSeconds(record.average.time) : null
    
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
    
    // 如果打破了记录，计数加1
    if (isBreakingRecord) {
      count++
    }
  })
  
  return count
})

// 重置分页
watch(selectedHistoryEvent, () => {
  currentPage.value = 1
})

const formatTime = (time) => {
  return recordsStore.formatTime(time)
}

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
  return getAllEvents()
})
</script>

<style scoped>
.records-container {
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

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.error-alert {
  margin-bottom: -16px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.filter-controls {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.section-title {
  font-size: 24px;
  font-weight: bold;
  color: var(--text-color);
  margin: 0;
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

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
  width: 100%;
  overflow-x: auto;
}

.responsive-pagination {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
}

:deep(.custom-table) {
  border-radius: 4px;
  overflow: hidden;
}

:deep(.custom-table .el-table__header-wrapper) {
  background-color: var(--background-color);
}

:deep(.custom-table .el-table__row:hover > td) {
  background-color: var(--background-color);
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
  font-weight: 500;
  font-size: 1em;
}

.record-sub {
  color: var(--el-text-color-secondary);
  font-size: 0.9em;
}

.record-details {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  gap: 8px;
}

.detail-label {
  color: var(--el-text-color-secondary);
  min-width: 90px;
}

.detail-value {
  font-weight: 500;
  color: #1e88a8;
}

.player-link {
  color: var(--el-color-primary);
  text-decoration: none;
  font-weight: 500;
}

.player-link:hover {
  text-decoration: underline;
  color:  #1e88a8;
}

.info-icon {
  margin-left: 5px;
  font-size: 14px;
  color: var(--el-color-info);
  vertical-align: middle;
}

@media (max-width: 768px) {
  .records-container {
    padding: 12px;
    gap: 24px;
  }

  .page-title {
    font-size: 24px;
  }

  .section-title {
    font-size: 20px;
  }

  .filter-header {
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 16px;
  }

  .filter-controls {
    width: 100%;
  }

  .category-select,
  .event-select {
    width: 100%;
  }

  :deep(.el-pagination) {
    justify-content: flex-start;
    padding: 0;
  }

  :deep(.el-pagination .el-pagination__total) {
    display: block;
    width: 100%;
    margin-bottom: 8px;
  }

  :deep(.el-pagination .el-pagination__sizes) {
    margin-right: 0;
    margin-bottom: 8px;
  }

  .record-cell {
    gap: 2px;
  }

  .record-main {
    font-size: 0.95em;
  }

  .record-sub {
    font-size: 0.85em;
  }

  :deep(.hide-on-mobile) {
    display: none;
  }

  .record-details {
    padding: 12px;
    gap: 8px;
  }

  .detail-item {
    gap: 4px;
  }

  .detail-label {
    min-width: 80px;
    font-size: 0.9em;
  }

  .detail-value {
    font-size: 0.9em;
  }

  .header-actions {
    gap: 8px;
  }
  
  /* 移动端表格适配 */
  :deep(.el-table) {
    font-size: 13px;
  }
  
  :deep(.el-table .cell) {
    padding-left: 5px;
    padding-right: 5px;
  }
  
  :deep(.el-table__header th) {
    padding: 6px 0;
  }
  
  :deep(.el-table__row td) {
    padding: 6px 0;
  }
  
  /* 减小序号列宽度 */
  :deep(.el-table .el-table__cell:first-child .cell) {
    padding: 0 2px;
  }
  
  /* 调整表格内容间距 */
  :deep(.el-table-column--selection .cell) {
    padding-right: 2px;
  }
}

@media (max-width: 480px) {
  .records-container {
    padding: 8px;
    gap: 16px;
  }

  .page-title {
    font-size: 20px;
  }

  .section-title {
    font-size: 18px;
  }

  :deep(.el-table) {
    font-size: 12px;
  }

  :deep(.el-pagination) {
    font-size: 12px;
  }

  .record-main {
    font-size: 0.9em;
  }

  .record-sub {
    font-size: 0.8em;
  }

  .record-details {
    padding: 8px;
    gap: 6px;
  }

  .detail-label {
    min-width: 75px;
    font-size: 0.85em;
  }

  .detail-value {
    font-size: 0.85em;
  }
  
  /* 更小屏幕的表格适配 */
  :deep(.el-table .cell) {
    padding-left: 2px;
    padding-right: 2px;
  }
  
  :deep(.el-tag--small) {
    padding: 0 2px;
    margin-left: 2px;
  }
  
  .record-cell {
    gap: 0;
  }
}

/* 添加表格列宽度控制 */
:deep(.el-table .el-table__cell:nth-child(1)) {
  width: 60px !important;
  min-width: 60px !important;
}

:deep(.el-table .el-table__cell:nth-child(2)),
:deep(.el-table .el-table__cell:nth-child(3)) {
  width: auto !important;
  min-width: 120px !important;
}

:deep(.el-table .el-table__cell:nth-child(4)) {
  width: 120px !important;
  min-width: 120px !important;
}
</style> 