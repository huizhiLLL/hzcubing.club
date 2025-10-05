<template>
  <div class="table-container">
    <el-table
      :data="filteredRecords"
      style="width: 100%"
      :stripe="true"
      class="records-table glass-table"
      v-loading="loading"
    >
      <el-table-column
        label="项目"
        min-width="100"
      >
        <template #default="scope">
          {{ getEventName(scope.row.event) }}
        </template>
      </el-table-column>
      
      <!-- 昵称列（桌面端）：单次持有人 -->
      <el-table-column
        label="昵称"
        min-width="120"
        class-name="nickname-column"
      >
        <template #default="scope">
          <router-link v-if="scope.row.singleHolderUserId" :to="`/user/${scope.row.singleHolderUserId}`" class="player-name-link">
            {{ scope.row.singleHolderNickname || '-' }}
          </router-link>
          <span v-else>{{ scope.row.singleHolderNickname || '-' }}</span>
        </template>
      </el-table-column>
      
      
      
      <el-table-column
        label="单次"
        min-width="100"
      >
        <template #default="scope">
          <div class="record-cell">
          <span v-if="scope.row.singleSeconds !== undefined" class="record-value">
            {{ formatTime(scope.row.singleSeconds) }}
            <span v-if="scope.row.singleRank" class="rank">(#{{ scope.row.singleRank }})</span>
          </span>
          <template v-else>
            <span>-</span>
          </template>
            
            <!-- 显示单次记录持有人（桌面/移动统一） -->
            <span v-if="scope.row.singleHolderNickname" class="holder-nickname">
              <router-link v-if="scope.row.singleHolderUserId" :to="`/user/${scope.row.singleHolderUserId}`" class="player-name-link">
                {{ scope.row.singleHolderNickname }}
              </router-link>
              <span v-else>{{ scope.row.singleHolderNickname }}</span>
            </span>
          </div>
        </template>
      </el-table-column>
      
      <!-- 平均成绩列 -->
      <el-table-column
        label="平均"
        min-width="100"
      >
        <template #default="scope">
          <div class="record-cell">
          <span v-if="scope.row.averageSeconds !== undefined" class="record-value">
            {{ formatTime(scope.row.averageSeconds) }}
            <span v-if="scope.row.averageRank" class="rank">(#{{ scope.row.averageRank }})</span>
          </span>
          <template v-else>
            <span>-</span>
          </template>
            
            <!-- 显示平均记录持有人（桌面/移动统一） -->
            <span v-if="scope.row.averageHolderNickname" class="holder-nickname">
              <router-link v-if="scope.row.averageHolderUserId" :to="`/user/${scope.row.averageHolderUserId}`" class="player-name-link">
                {{ scope.row.averageHolderNickname }}
              </router-link>
              <span v-else>{{ scope.row.averageHolderNickname }}</span>
            </span>
          </div>
        </template>
      </el-table-column>
      
      <!-- 昵称列（桌面端）：平均持有人 -->
      <el-table-column
        label="昵称"
        min-width="120"
        class-name="nickname-column"
      >
        <template #default="scope">
          <router-link v-if="scope.row.averageHolderUserId" :to="`/user/${scope.row.averageHolderUserId}`" class="player-name-link">
            {{ scope.row.averageHolderNickname || '-' }}
          </router-link>
          <span v-else>{{ scope.row.averageHolderNickname || '-' }}</span>
        </template>
      </el-table-column>
      
      
    </el-table>
    
    <!-- 成绩详情对话框 -->
    <el-dialog
      v-model="detailsDialogVisible"
      title="成绩详情"
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
        
        <div v-if="selectedRecord.singleHolderUserId || selectedRecord.singleHolderNickname" class="detail-item">
          <span class="label">单次保持者:</span>
          <span class="value">
            <router-link v-if="selectedRecord.singleHolderUserId" :to="`/user/${selectedRecord.singleHolderUserId}`" class="player-name-link">
              {{ selectedRecord.singleHolderNickname || '-' }}
            </router-link>
            <span v-else>{{ selectedRecord.singleHolderNickname || '-' }}</span>
          </span>
        </div>
        
        <div class="detail-item" v-if="isValidField(getCubeValue(selectedRecord))">
          <span class="label">使用魔方:</span>
          <span class="value">{{ getCubeValue(selectedRecord) }}</span>
        </div>
        
        <div class="detail-item" v-if="isValidField(getMethodValue(selectedRecord))">
          <span class="label">使用方法:</span>
          <span class="value">{{ getMethodValue(selectedRecord) }}</span>
        </div>
        
        <div class="detail-item">
          <span class="label">平均成绩:</span>
          <span class="value">{{ selectedRecord.averageSeconds !== undefined ? formatTime(selectedRecord.averageSeconds) : '-' }}</span>
        </div>
        
        <div v-if="selectedRecord.averageHolderUserId || selectedRecord.averageHolderNickname" class="detail-item">
          <span class="label">平均保持者:</span>
          <span class="value">
            <router-link v-if="selectedRecord.averageHolderUserId" :to="`/user/${selectedRecord.averageHolderUserId}`" class="player-name-link">
              {{ selectedRecord.averageHolderNickname || '-' }}
            </router-link>
            <span v-else>{{ selectedRecord.averageHolderNickname || '-' }}</span>
          </span>
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
        
        <div v-if="isCurrentUserRecord(selectedRecord)" class="actions">
          <el-button type="danger" size="small" @click="confirmDelete">删除</el-button>
        </div>
      </div>
    </el-dialog>
    
    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteConfirmVisible"
      title="确认删除"
      width="300px"
      class="glass-dialog"
    >
      <p>确定要删除这条成绩记录吗？此操作不可恢复。</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteConfirmVisible = false">取消</el-button>
          <el-button type="danger" @click="deleteRecord" :loading="deleteLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineProps, defineEmits } from 'vue'
import { useRecordsStore } from '@/stores/records'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getEventName } from '@/config/events'
import { canEditRecord, canDeleteRecord } from '@/utils/permissions'

const props = defineProps({
  records: {
    type: Array,
    default: () => []
  },
  showActions: {
    type: Boolean,
    default: true
  },
  autoRefresh: {
    type: Boolean,
    default: true
  },
  isDebug: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['refresh', 'delete'])

const recordsStore = useRecordsStore()
const userStore = useUserStore()
const permissionStore = usePermissionStore()
const loading = ref(false)
const deleteLoading = ref(false)
const detailsDialogVisible = ref(false)
const deleteConfirmVisible = ref(false)
const selectedRecord = ref(null)

// 从记录中获取魔方信息，尝试多个可能的位置
const getCubeValue = (record) => {
  return record.cube || record.single?.cube || record.average?.cube || ''
}

// 从记录中获取方法信息，尝试多个可能的位置
const getMethodValue = (record) => {
  return record.method || record.single?.method || record.average?.method || ''
}

// 检查字段是否有效
const isValidField = (value) => {
  return value !== null && value !== undefined && value !== 'null' && value !== ''
}

// 格式化时间
const formatTime = (time) => {
  return recordsStore.formatTime(time)
}

// 格式化日期
const formatDate = (dateString, showTime = false) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
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

// 直接使用传入的记录
const filteredRecords = computed(() => {
  return props.records
})

// 查看详情
const viewDetails = (record) => {
  selectedRecord.value = record
  detailsDialogVisible.value = true
}

// 刷新数据
const refresh = async () => {
  if (props.autoRefresh) {
    loading.value = true
    try {
      await recordsStore.fetchRecords()
      emit('refresh')
    } catch (error) {
      ElMessage.error('刷新数据失败')
    } finally {
      loading.value = false
    }
  } else {
    emit('refresh')
  }
}

// 检查记录是否属于当前用户
const isCurrentUserRecord = (record) => {
  if (!userStore.user || !record) return false
  return record.userId === userStore.user._id
}

// 检查是否可以编辑记录
const canEdit = (record) => {
  if (!userStore.user) return false
  return canEditRecord(record, userStore.user._id)
}

// 检查是否可以删除记录
const canDelete = (record) => {
  if (!userStore.user) return false
  return canDeleteRecord(record, userStore.user._id)
}

// 确认删除
const confirmDelete = () => {
  deleteConfirmVisible.value = true
}

// 删除记录
const deleteRecord = async () => {
  if (!selectedRecord.value || !selectedRecord.value._id) {
    ElMessage.error('无法删除，记录ID不存在')
    deleteConfirmVisible.value = false
    return
  }
  
  deleteLoading.value = true
  
  try {
    await recordsStore.deleteRecord(selectedRecord.value._id)
    ElMessage.success('记录已删除')
    deleteConfirmVisible.value = false
    detailsDialogVisible.value = false
    emit('delete', selectedRecord.value._id)
    refresh()
  } catch (error) {
    ElMessage.error('删除失败: ' + error.message)
  } finally {
    deleteLoading.value = false
  }
}

onMounted(() => {
  if (props.autoRefresh) {
    refresh()
  }
})
</script>

<style scoped>
.table-container {
  width: 100%;
  overflow-x: auto;
}

.records-table {
  width: 100%;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-light);
  transition: all var(--duration-normal) var(--ease-in-out);
}

.records-table:hover {
  box-shadow: var(--shadow-lg);
}

.rank {
  font-size: 12px;
  color: #909399;
  margin-left: 4px;
}

.record-value {
  position: relative;
  display: inline-block;
  font-weight: 600;
  color: var(--text-color);
  transition: all var(--duration-normal) var(--ease-in-out);
}

.record-value:hover {
  color: var(--primary-color);
  transform: scale(1.02);
}

.record-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
}

.label {
  flex: 0 0 80px;
  font-weight: 500;
  color: #606266;
}

.value {
  flex: 1;
  color: #303133;
}

.video-link {
  color: #409EFF;
  text-decoration: none;
}

.video-link:hover {
  text-decoration: underline;
}

.actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

/* 添加移动端样式 */
.record-cell {
  display: flex;
  flex-direction: column;
}

.holder-nickname {
  display: none;
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* 选手名字链接样式 - 无颜色但有下划线动画 */
.player-name-link {
  color: inherit;
  text-decoration: none;
  font-weight: 500;
  transition: all var(--duration-normal) var(--ease-in-out);
  position: relative;
}

.player-name-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--primary-color);
  transition: width var(--duration-normal) var(--ease-in-out);
}

.player-name-link:hover {
  transform: translateY(-1px);
}

.player-name-link:hover::after {
  width: 100%;
}

@media (max-width: 768px) {
  .holder-nickname { 
    display: block; 
    font-size: 12px;
    color: var(--text-color-secondary);
    margin-top: var(--space-xs);
  }
  
  :deep(.nickname-column) { 
    display: none !important; 
  }
  
  .record-value {
    font-weight: 600;
    font-size: 15px;
  }

  :deep(.el-table .cell) {
    padding: var(--space-sm) var(--space-xs);
    font-size: 14px;
  }

  :deep(.el-table__header th) {
    font-size: 13px;
    padding: var(--space-sm) var(--space-xs);
    font-weight: 600;
  }
  
  :deep(.el-table) {
    font-size: 14px;
    border-radius: var(--radius-md);
  }
  
  .table-container {
    margin: 0 calc(-1 * var(--space-md));
    width: calc(100% + 2 * var(--space-md));
    border-radius: var(--radius-md);
    overflow: hidden;
  }
  
  :deep(.el-table__body td) {
    padding: var(--space-sm) var(--space-xs);
  }
  
  .rank {
    display: block;
    margin-top: var(--space-xs);
    font-size: 11px;
    color: var(--text-color-muted);
  }
  
  /* 移动端表格行悬停效果 */
  :deep(.el-table__body tr:hover > td) {
    background-color: rgba(64, 158, 255, 0.05) !important;
  }
}
</style> 