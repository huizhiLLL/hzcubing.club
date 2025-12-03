<template>
  <div class="submit-container">
    <el-row :gutter="24">
      <el-col :xs="24" :sm="24" :md="14">
        <ElementTransition name="slide-up" :duration="600" :delay="200" appear>
          <submit-record-form @success="handleSubmitSuccess" />
        </ElementTransition>
      </el-col>

      <el-col :xs="24" :sm="24" :md="10">
        <ElementTransition name="slide-up" :duration="600" :delay="400" appear>
          <div class="card">
            <div class="history-header">
              <h2 class="section-title">上传历史</h2>
              <el-button type="primary" text @click="refreshHistory">
                刷新
              </el-button>
            </div>
            
            <!-- 添加筛选栏 -->
            <div class="filter-container">
              <div class="filter-row">
                <el-select
                  v-model="filterEvent"
                  placeholder="按项目筛选"
                  clearable
                  class="filter-select"
                >
                  <el-option
                    v-for="event in userEventsOptions"
                    :key="event.value"
                    :label="event.label"
                    :value="event.value"
                  />
                </el-select>
                <el-button 
                  v-if="filterEvent" 
                  type="primary" 
                  text 
                  @click="filterEvent = ''"
                >
                  清除筛选
                </el-button>
              </div>
            </div>
            
            <div class="records-list-container" v-loading="historyLoading">
              <div class="records-list">
                <template v-if="filteredRecords.length > 0">
                  <div v-for="record in filteredRecords" 
                       :key="record._id || record.timestamp" 
                       class="record-item"
                  >
                    <div class="record-content">
                      <div class="record-main">
                        <span class="event-name">{{ getEventName(record.event) }}</span>
                        <div class="record-times">
                          <template v-if="record.singleSeconds !== null && record.singleSeconds !== undefined">
                            <span class="record-label">单次:</span>
                            <span class="record-time">{{ formatTime(record.singleSeconds) }}</span>
                          </template>
                          <template v-if="record.averageSeconds !== null && record.averageSeconds !== undefined">
                            <span class="record-label">平均:</span>
                            <span class="record-time">{{ formatTime(record.averageSeconds) }}</span>
                          </template>
                        </div>
                      </div>
                      <div class="record-info">
                        <span class="record-date">{{ formatDate(record.timestamp) }}</span>
                        <div class="record-actions">
                          <el-button 
                            type="primary" 
                            link 
                            @click="handleEdit(record)"
                          >
                            修改
                          </el-button>
                          <el-button 
                            type="danger" 
                            link 
                            @click="handleDelete(record)"
                          >
                            删除
                          </el-button>
                        </div>
                      </div>
                      <div v-if="record.cube" class="record-cube">
                        使用魔方: {{ record.cube }}
                      </div>
                      <div v-if="record.method" class="record-method">
                        解法: {{ record.method }}
                      </div>
                    </div>
                  </div>
                </template>
                <template v-else-if="!historyLoading">
                  <el-empty
                    description="暂无上传记录"
                    :image-size="200"
                  >
                    <template #description>
                      <p>{{ userRecords.length > 0 ? '没有找到符合筛选条件的记录' : '暂无上传记录' }}</p>
                      <p class="empty-tip">{{ userRecords.length > 0 ? '尝试更改筛选条件' : '开始上传你的第一个成绩吧！' }}</p>
                    </template>
                  </el-empty>
                </template>
              </div>
            </div>
          </div>
        </ElementTransition>
      </el-col>
    </el-row>

    <!-- 编辑记录对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="修改记录"
      width="500px"
      class="edit-dialog"
    >
      <div class="edit-form">
        <el-form
          ref="editFormRef"
          :model="editForm"
          label-width="100px"
        >
          <el-form-item label="单次成绩">
            <!-- 分钟:秒格式输入 -->
            <div v-if="useMinutesFormat" class="time-edit-container">
              <el-input-number
                v-model="editForm.singleMinutes"
                :min="0"
                :precision="0"
                :step="1"
                :controls="false"
                class="time-input-small"
                placeholder="分"
              />
              <span class="time-separator">:</span>
              <el-input-number
                v-model="editForm.singleSeconds"
                :min="0"
                :max="59"
                :precision="0"
                :step="1"
                :controls="false"
                class="time-input-small"
                placeholder="秒"
              />
              <span class="time-separator">.</span>
              <el-input-number
                v-model="editForm.singleMilliseconds"
                :min="0"
                :max="99"
                :precision="0"
                :step="1"
                :controls="false"
                class="time-input-small"
                placeholder="毫秒"
              />
            </div>
            
            <!-- 秒格式输入 -->
            <el-input-number
              v-else
              v-model="editForm.single"
              :min="0"
              :precision="2"
              :step="0.01"
              class="short-input"
            />
          </el-form-item>
          
          <el-form-item label="平均成绩">
            <!-- 分钟:秒格式输入 -->
            <div v-if="useMinutesFormat" class="time-edit-container">
              <el-input-number
                v-model="editForm.averageMinutes"
                :min="0"
                :precision="0"
                :step="1"
                :controls="false"
                class="time-input-small"
                placeholder="分"
              />
              <span class="time-separator">:</span>
              <el-input-number
                v-model="editForm.averageSeconds"
                :min="0"
                :max="59"
                :precision="0"
                :step="1"
                :controls="false"
                class="time-input-small"
                placeholder="秒"
              />
              <span class="time-separator">.</span>
              <el-input-number
                v-model="editForm.averageMilliseconds"
                :min="0"
                :max="99"
                :precision="0"
                :step="1"
                :controls="false"
                class="time-input-small"
                placeholder="毫秒"
              />
            </div>
            
            <!-- 秒格式输入 -->
            <el-input-number
              v-else
              v-model="editForm.average"
              :min="0"
              :precision="2"
              :step="0.01"
              class="short-input"
            />
          </el-form-item>
          
          <!-- 时间格式切换 -->
          <el-form-item>
            <div class="format-switch">
              <span class="format-label">秒</span>
              <el-switch v-model="useMinutesFormat" />
              <span class="format-label">分:秒</span>
            </div>
          </el-form-item>
          
          <el-form-item label="使用魔方">
            <el-input v-model="editForm.cube" class="medium-input" />
          </el-form-item>
          <el-form-item label="解法">
            <el-input v-model="editForm.method" class="medium-input" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmEdit">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRecordsStore } from '@/stores/records'
import { useUserStore } from '@/stores/user'
import SubmitRecordForm from '@/components/SubmitRecordForm.vue'
import ElementTransition from '@/components/ElementTransition.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getEventName, getAllEvents } from '@/config/events'

const recordsStore = useRecordsStore()
const userStore = useUserStore()

// 用户历史记录
const userRecords = ref([])
const historyLoading = ref(false)
const filterEvent = ref('')

// 根据用户记录生成筛选选项
const userEventsOptions = computed(() => {
  // 提取用户所有不同的项目
  const uniqueEvents = Array.from(new Set(userRecords.value.map(record => record.event)))
  
  // 转换为选项格式
  return uniqueEvents.map(event => ({
    label: getEventName(event),
    value: event
  }))
})

// 筛选后的记录
const filteredRecords = computed(() => {
  if (!filterEvent.value) {
    return userRecords.value
  }
  return userRecords.value.filter(record => record.event === filterEvent.value)
})

// 获取用户历史记录
const fetchUserHistory = async () => {
  if (!userStore.user?._id) {
    userRecords.value = []
    return
  }

  historyLoading.value = true
  try {
    // 使用recordsStore提供的方法获取用户记录
    const records = await recordsStore.fetchUserRecords(userStore.user._id)
    // 兼容旧结构，确保 seconds 字段存在
    userRecords.value = (records || []).map(r => ({
      ...r,
      singleSeconds: typeof r.singleSeconds === 'number' ? r.singleSeconds : (r.single && typeof r.single.time === 'number' ? r.single.time : null),
      averageSeconds: typeof r.averageSeconds === 'number' ? r.averageSeconds : (r.average && typeof r.average.time === 'number' ? r.average.time : null)
    }))
  } catch (error) {
    console.error('获取历史记录出错:', error)
    userRecords.value = []
    ElMessage.error('获取历史记录失败')
  } finally {
    historyLoading.value = false
  }
}

// 编辑相关
const editDialogVisible = ref(false)
const editFormRef = ref()
const editForm = ref({})
const editingRecord = ref(null)
const useMinutesFormat = ref(false) // 是否使用分钟格式

// 分解时间为分、秒、毫秒
const splitTimeToComponents = (time) => {
  if (time === null || time === undefined) return { minutes: null, seconds: null, milliseconds: null }
  
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  const milliseconds = Math.round((time % 1) * 100)
  
  return { minutes, seconds, milliseconds }
}

// 从分、秒、毫秒计算总秒数
const calculateTimeInSeconds = () => {
  if (useMinutesFormat.value) {
    // 计算单次成绩
    const singleMinutes = editForm.value.singleMinutes || 0
    const singleSeconds = editForm.value.singleSeconds || 0
    const singleMilliseconds = editForm.value.singleMilliseconds || 0
    
    if (singleMinutes > 0 || singleSeconds > 0 || singleMilliseconds > 0) {
      editForm.value.single = singleMinutes * 60 + singleSeconds + singleMilliseconds / 100
    } else {
      editForm.value.single = null
    }
    
    // 计算平均成绩
    const averageMinutes = editForm.value.averageMinutes || 0
    const averageSeconds = editForm.value.averageSeconds || 0
    const averageMilliseconds = editForm.value.averageMilliseconds || 0
    
    if (averageMinutes > 0 || averageSeconds > 0 || averageMilliseconds > 0) {
      editForm.value.average = averageMinutes * 60 + averageSeconds + averageMilliseconds / 100
    } else {
      editForm.value.average = null
    }
  }
}

// 自动检测是否使用分钟格式
const detectTimeFormat = (singleTime, averageTime) => {
  // 如果任一时间超过60秒，使用分钟格式
  if ((singleTime && singleTime >= 60) || (averageTime && averageTime >= 60)) {
    useMinutesFormat.value = true
    return true
  }
  return false
}

const handleEdit = (record) => {
  editingRecord.value = record
  const singleTime = record.singleSeconds ?? null
  const averageTime = record.averageSeconds ?? null
  
  // 检测是否应该使用分钟格式
  const useMinutes = detectTimeFormat(singleTime, averageTime)
  
  if (useMinutes) {
    // 分解时间
    const { minutes: singleMinutes, seconds: singleSeconds, milliseconds: singleMilliseconds } = 
      splitTimeToComponents(singleTime)
    const { minutes: averageMinutes, seconds: averageSeconds, milliseconds: averageMilliseconds } = 
      splitTimeToComponents(averageTime)
    
    editForm.value = {
      single: singleTime,
      singleMinutes,
      singleSeconds,
      singleMilliseconds,
      average: averageTime,
      averageMinutes,
      averageSeconds,
      averageMilliseconds,
      cube: record.cube || '',
      method: record.method || ''
    }
  } else {
    // 使用普通秒格式
    editForm.value = {
      single: singleTime,
      singleMinutes: null,
      singleSeconds: null,
      singleMilliseconds: null,
      average: averageTime,
      averageMinutes: null,
      averageSeconds: null,
      averageMilliseconds: null,
      cube: record.cube || '',
      method: record.method || ''
    }
  }
  
  editDialogVisible.value = true
}

const confirmEdit = async () => {
  if (!editingRecord.value) return
  
  try {
    // 如果使用分钟格式，计算总秒数
    if (useMinutesFormat.value) {
      calculateTimeInSeconds()
    }
    
    // 准备更新记录的数据
    const recordId = editingRecord.value._id
    
    // 更新数据
    const updateData = {
      singleSeconds: editForm.value.single ?? null,
      averageSeconds: editForm.value.average ?? null,
      nickname: userStore.user.nickname,
      userId: userStore.user._id,
      cube: editForm.value.cube,
      method: editForm.value.method
    }
    
    // 将需要更新的记录ID和更新数据提供给store方法
    await recordsStore.updateRecord({
      _id: recordId,
      ...updateData
    })
    
    editDialogVisible.value = false
    ElMessage.success('记录已更新')
    
    // 刷新历史记录
    await fetchUserHistory()
  } catch (error) {
    ElMessage.error('更新记录失败: ' + error.message)
  }
}

const handleDelete = async (record) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条记录吗？此操作不可恢复。',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await recordsStore.deleteRecord(record._id)
    ElMessage.success('记录已删除')
    
    // 刷新历史记录
    await fetchUserHistory()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除记录失败: ' + error.message)
    }
  }
}

const refreshHistory = async () => {
  await fetchUserHistory()
}

const formatTime = (time) => {
  return recordsStore.formatTime(time)
}

const formatDate = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleSubmitSuccess = async () => {
  ElMessage.success('成绩上传成功！')
  // 刷新历史记录
  await fetchUserHistory()
}

// 监听用户状态变化
watch(() => userStore.user, (newUser) => {
  if (newUser) {
    fetchUserHistory()
  } else {
    userRecords.value = []
  }
}, { immediate: true })

// 组件挂载时获取历史记录
onMounted(() => {
  if (userStore.user) {
    fetchUserHistory()
  }
})
</script>

<style scoped>
.submit-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 16px;
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.card {
  min-height: auto;
  display: flex;
  flex-direction: column;
  max-height: 600px;
  margin-bottom: 0;
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  transition: all var(--duration-normal) var(--ease-in-out);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 24px;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-2xl);
  background: rgba(255, 255, 255, 0.9);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
}

.section-title {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  color: var(--text-color);
}

.filter-container {
  margin-bottom: 24px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-select {
  flex: 1;
}

.records-list-container {
  overflow-y: auto;
  max-height: 460px;
  border-radius: var(--radius-lg);
  position: relative;
  flex: 1;
  scrollbar-width: thin;
  scrollbar-color: rgba(144, 147, 153, 0.5) rgba(255, 255, 255, 0.05);
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 4px;
}

.record-item {
  padding: 16px;
  background-color: rgba(245, 247, 250, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: var(--radius-lg);
  transition: all var(--duration-normal) var(--ease-in-out);
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.record-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.record-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.record-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.event-name {
  font-weight: 600;
  color: var(--text-color);
  font-size: 16px;
}

.record-times {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.record-label {
  color: var(--text-color-secondary);
  font-size: 14px;
}

.record-time {
  color: var(--primary-color);
  font-weight: 600;
  font-size: 16px;
}

.record-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-date {
  color: var(--text-color-secondary);
  font-size: 14px;
}

.record-actions {
  display: flex;
  gap: 12px;
}

.record-actions .el-button {
  padding: 4px 0;
}

.record-cube,
.record-method {
  font-size: 14px;
  color: var(--text-color-secondary);
  margin-top: 2px;
  line-height: 1.5;
}

.video-link {
  color: var(--primary-color);
  text-decoration: none;
}

.video-link:hover {
  text-decoration: underline;
}

.empty-tip {
  color: var(--text-color-secondary);
  font-size: 14px;
  margin-top: 8px;
}

/* 修改滚动条样式 */
.records-list-container::-webkit-scrollbar {
  width: 8px;
}

.records-list-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.records-list-container::-webkit-scrollbar-thumb {
  background-color: rgba(144, 147, 153, 0.5);
  border-radius: 4px;
}

.records-list-container::-webkit-scrollbar-thumb:hover {
  background-color: rgba(144, 147, 153, 0.7);
}

@media (max-width: 768px) {
  .submit-container {
    padding: 12px;
    gap: 24px;
  }

  .record-main {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .record-times {
    flex-direction: column;
    gap: 4px;
  }

  .record-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .record-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .records-list-container {
    max-height: 380px;
  }

  .card {
    padding: 16px;
  }

  .record-item {
    padding: 12px;
  }
  
  .record-content {
    gap: 8px;
  }
  
  .event-name {
    font-size: 15px;
  }
  
  .record-time {
    font-size: 15px;
  }

  .edit-dialog :deep(.el-dialog) {
    width: 95% !important;
    margin: 0 auto;
  }
  
  .edit-dialog :deep(.el-dialog__body) {
    padding: 16px;
  }
  
  .edit-form {
    padding: 0;
  }
}

.full-width {
  width: 100%;
}

.short-input {
  width: 150px;
}

.medium-input {
  width: 100px;
}

.edit-dialog {
  background: #ffffff;
}

.edit-dialog :deep(.el-dialog) {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.edit-dialog :deep(.el-dialog__header) {
  padding: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.edit-dialog :deep(.el-dialog__title) {
  font-weight: 600;
  color: var(--text-color);
}

.edit-dialog :deep(.el-dialog__body) {
  padding: 24px 20px;
}

.edit-dialog :deep(.el-dialog__footer) {
  padding: 16px 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.edit-form {
  padding: 0 10px;
}

.view-records-link {
  text-decoration: none;
}

/* 自定义el-button样式 */
:deep(.el-button) {
  transition: all 0.3s;
}

:deep(.el-button:hover) {
  transform: translateY(-2px);
}

.time-edit-container {
  display: flex;
  align-items: center;
  gap: 5px;
  background-color: #f5f7fa;
  padding: 5px 10px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  max-width: 220px;
}

.time-input-small {
  width: 50px;
  text-align: center;
}

.time-separator {
  font-weight: bold;
  font-size: 16px;
  margin: 0 2px;
}

.format-switch {
  display: flex;
  align-items: center;
  gap: 10px;
}

.format-label {
  font-size: 14px;
  color: var(--text-color-secondary);
}
</style> 