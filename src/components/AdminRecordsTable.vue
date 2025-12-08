<template>
  <div class="admin-records-container">
    <div class="table-header">
      <div class="table-info">
        <span class="record-count">共 {{ records.length }} 条记录</span>
      </div>
      <div class="table-actions">
        <el-button @click="refresh" :loading="loading" size="small">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>
    
    <el-table
      :data="paginatedRecords"
      style="width: 100%"
      :stripe="true"
      class="admin-records-table"
      v-loading="loading"
      :default-sort="{ prop: 'timestamp', order: 'descending' }"
    >
      <el-table-column
        label="项目"
        prop="event"
        width="100"
        :show-overflow-tooltip="true"
      >
        <template #default="{ row }">
          <el-tag size="small" type="primary">
            {{ getEventName(row.event) }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column
        label="用户"
        prop="nickname"
        width="120"
        :show-overflow-tooltip="true"
      >
        <template #default="{ row }">
          <div class="user-info">
            <router-link 
              v-if="row.userId" 
              :to="`/user/${row.userId}`" 
              class="user-link"
            >
              {{ row.nickname || '匿名用户' }}
            </router-link>
            <span v-else class="anonymous-user">
              {{ row.nickname || '匿名用户' }}
            </span>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column
        label="单次成绩"
        prop="singleSeconds"
        width="120"
        sortable
      >
        <template #default="{ row }">
          <div class="time-cell">
            <span v-if="row.singleSeconds !== null && row.singleSeconds !== undefined" class="time-value">
              {{ formatTime(row.singleSeconds) }}
            </span>
            <span v-else class="no-time">-</span>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column
        label="平均成绩"
        prop="averageSeconds"
        width="120"
        sortable
      >
        <template #default="{ row }">
          <div class="time-cell">
            <span v-if="row.averageSeconds !== null && row.averageSeconds !== undefined" class="time-value">
              {{ formatTime(row.averageSeconds) }}
            </span>
            <span v-else class="no-time">-</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        label="提交时间"
        prop="timestamp"
        width="140"
        sortable
      >
        <template #default="{ row }">
          <div class="timestamp-cell">
            <div class="date">{{ formatDate(row.timestamp) }}</div>
            <div class="time">{{ formatTime(row.timestamp, true) }}</div>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column
        label="操作"
        width="250"
        fixed="right"
      >
        <template #default="{ row }">
          <div class="action-buttons">
            <el-button size="small" @click="viewDetails(row)">
              <el-icon><View /></el-icon>
              详情
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="records.length"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    
    <!-- 记录详情对话框 -->
    <el-dialog
      v-model="detailsDialogVisible"
      title="成绩记录详情"
      width="500px"
      class="record-details-dialog"
    >
      <div v-if="selectedRecord" class="record-details">
        <div class="detail-section">
          <h4>基本信息</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">项目:</span>
              <span class="value">{{ getEventName(selectedRecord.event) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">用户:</span>
              <span class="value">{{ selectedRecord.nickname || '匿名用户' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">时间:</span>
              <span class="value">{{ formatDate(selectedRecord.timestamp) }} {{ formatTime(selectedRecord.timestamp, true) }}</span>
            </div>
          </div>
        </div>
        
        <div class="detail-section">
          <h4>成绩信息</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">单次:</span>
              <span class="value">
                {{ selectedRecord.singleSeconds !== null && selectedRecord.singleSeconds !== undefined 
                   ? formatTime(selectedRecord.singleSeconds) : '-' }}
              </span>
            </div>
            <div class="detail-item">
              <span class="label">平均:</span>
              <span class="value">
                {{ selectedRecord.averageSeconds !== null && selectedRecord.averageSeconds !== undefined 
                   ? formatTime(selectedRecord.averageSeconds) : '-' }}
              </span>
            </div>
          </div>
        </div>
        
        <div class="detail-section">
          <h4>其他</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">魔方:</span>
              <span class="value">{{ selectedRecord.cube || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">方法:</span>
              <span class="value">{{ selectedRecord.method || '-' }}</span>
            </div>
          </div>
        </div>
        
        <!-- 已移除感想与视频链接字段展示 -->
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'
import { getEventName } from '@/config/events'
import { Refresh, View } from '@element-plus/icons-vue'
import { useRecordsStore } from '@/stores/records'
import { formatTime as formatTimeUtil } from '@/utils/timeFormatter'

const recordsStore = useRecordsStore()

const props = defineProps({
  records: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['refresh'])

// 分页相关
const currentPage = ref(1)
const pageSize = ref(20)

// 对话框相关
const detailsDialogVisible = ref(false)
const selectedRecord = ref(null)

// 分页数据
const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return props.records.slice(start, end)
})

// 格式化时间
const formatTime = (time, isTimestamp = false) => {
  if (isTimestamp) {
    // 格式化时间戳为时间
    if (!time) return '-'
    const date = new Date(time)
    if (isNaN(date)) return '-'
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }
  
  // 使用统一的格式化成绩时间函数
  return formatTimeUtil(time)
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (isNaN(date)) return '-'
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}.${month}.${day}`
}

// 查看详情
const viewDetails = (record) => {
  selectedRecord.value = record
  detailsDialogVisible.value = true
}

// 刷新数据
const refresh = () => {
  emit('refresh')
}

// 分页处理
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page) => {
  currentPage.value = page
}
</script>

<style scoped>
.admin-records-container {
  width: 100%;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 4px;
}

.table-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.record-count {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.admin-records-table {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #EBEEF5;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-link {
  color: #409EFF;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;
}

.user-link:hover {
  color: #66b1ff;
  text-decoration: underline;
}

.anonymous-user {
  color: #909399;
  font-style: italic;
}

.time-cell {
  display: flex;
  align-items: center;
}

.time-value {
  font-weight: 600;
  color: #303133;
  font-family: 'Consolas', 'Monaco', monospace;
}

.no-time {
  color: #C0C4CC;
}

.cube-info, .method-info {
  color: #606266;
  font-size: 13px;
}

.timestamp-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.date {
  font-weight: 500;
  color: #303133;
  font-size: 13px;
}

.time {
  color: #909399;
  font-size: 12px;
}

.action-buttons {
  display: flex;
  gap: 4px;
}

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

/* 记录详情对话框样式 */
.record-details {
  padding: 8px 0;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section h4 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid #EBEEF5;
  padding-bottom: 8px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.detail-item {
  display: flex;
  align-items: center;
}

.label {
  flex: 0 0 60px;
  font-weight: 500;
  color: #606266;
  font-size: 14px;
}

.value {
  flex: 1;
  color: #303133;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .table-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
