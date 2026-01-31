<template>
  <div class="submit-container">
    <!-- 动态背景光球 -->
    <div class="ambient-orb orb-1"></div>
    <div class="ambient-orb orb-2"></div>

    <el-row :gutter="24">
      <el-col :xs="24" :sm="24" :md="14">
        <ElementTransition name="slide-up" :duration="600" :delay="200" appear>
          <div class="bento-card glass-card form-card">
            <submit-record-form @success="handleSubmitSuccess" />
          </div>
        </ElementTransition>
      </el-col>

      <el-col :xs="24" :sm="24" :md="10">
        <ElementTransition name="slide-up" :duration="600" :delay="400" appear>
          <div class="bento-card glass-card history-card">
            <div class="history-header">
              <h2 class="section-title">
                <el-icon><Timer /></el-icon> 上传历史
              </h2>
              <el-button type="primary" text bg size="small" @click="refreshHistory" class="refresh-btn">
                <el-icon><Refresh /></el-icon> 刷新
              </el-button>
            </div>
            
            <!-- 筛选栏 -->
            <div class="filter-container">
              <el-select
                v-model="filterEvent"
                placeholder="按项目筛选"
                clearable
                class="filter-select glass-select"
              >
                <el-option
                  v-for="event in userEventsOptions"
                  :key="event.value"
                  :label="event.label"
                  :value="event.value"
                />
              </el-select>
            </div>
            
            <div class="records-list-container custom-scrollbar" v-loading="historyLoading">
              <div v-if="filteredRecords.length > 0" class="history-list">
                <div v-for="record in filteredRecords" 
                     :key="record._id || record.timestamp" 
                     class="history-item"
                >
                  <div class="item-header">
                    <span class="event-tag">{{ getEventName(record.event) }}</span>
                    <span class="date-text">{{ formatDate(record.timestamp) }}</span>
                  </div>
                  
                  <div class="item-content">
                    <div class="time-group">
                      <div class="time-item" v-if="record.singleSeconds !== null">
                        <span class="label">单次</span>
                        <span class="value">{{ formatTime(record.singleSeconds) }}</span>
                      </div>
                      <div class="time-item" v-if="record.averageSeconds !== null">
                        <span class="label">平均</span>
                        <span class="value">{{ formatTime(record.averageSeconds) }}</span>
                      </div>
                    </div>
                    
                    <div class="item-actions">
                      <el-button type="primary" link size="small" @click="handleEdit(record)">
                        <el-icon><Edit /></el-icon>
                      </el-button>
                      <el-button type="danger" link size="small" @click="handleDelete(record)">
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                  </div>
                  
                  <div v-if="record.cube || record.method" class="item-footer">
                    <span v-if="record.cube" class="info-tag">
                      <el-icon><Box /></el-icon> {{ record.cube }}
                    </span>
                    <span v-if="record.method" class="info-tag">
                      <el-icon><Guide /></el-icon> {{ record.method }}
                    </span>
                  </div>
                </div>
              </div>
              
              <div v-else-if="!historyLoading" class="empty-state">
                <el-empty
                  :description="userRecords.length > 0 ? '没有找到符合条件的记录' : '暂无上传记录'"
                  :image-size="120"
                />
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
      class="glass-dialog"
      :close-on-click-modal="false"
      destroy-on-close
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
import { Timer, Refresh, Edit, Delete, Box, Guide } from '@element-plus/icons-vue'
import { getEventName } from '@/config/events'
import { formatTime } from '@/utils/timeFormatter'

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

// 使用统一的格式化时间函数

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
  min-height: calc(100vh - 60px);
  padding: 24px;
  position: relative;
  overflow-x: hidden;
}

/* 动态背景光球 */
.ambient-orb {
  position: fixed;
  border-radius: 50%;
  filter: blur(80px);
  z-index: 0;
  animation: float 20s infinite ease-in-out;
  opacity: 0.6;
  pointer-events: none;
}

.orb-1 {
  top: -10%;
  right: -5%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(64, 158, 255, 0.4) 0%, rgba(64, 158, 255, 0) 70%);
  animation-delay: 0s;
}

.orb-2 {
  bottom: -10%;
  left: -5%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(103, 194, 58, 0.3) 0%, rgba(103, 194, 58, 0) 70%);
  animation-delay: -10s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(30px, 50px) rotate(10deg); }
  66% { transform: translate(-20px, 20px) rotate(-5deg); }
}

/* Bento Card 风格 */
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
  height: 100%;
}

.bento-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-2xl);
  border-color: rgba(255, 255, 255, 0.6);
}

.form-card {
  min-height: 500px;
  display: flex;
  flex-direction: column;
}

.history-card {
  display: flex;
  flex-direction: column;
  max-height: 800px;
  padding: 24px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.refresh-btn {
  font-weight: 500;
}

.filter-container {
  margin-bottom: 16px;
}

.glass-select :deep(.el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(4px);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1) inset;
}

.records-list-container {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
  margin-right: -8px;
}

/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background-color: transparent;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  padding: 16px;
  transition: all 0.2s ease;
}

.history-item:hover {
  background: rgba(255, 255, 255, 0.6);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.event-tag {
  font-weight: 700;
  color: var(--primary-color);
  background: rgba(64, 158, 255, 0.1);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 14px;
}

.date-text {
  font-size: 12px;
  color: var(--text-color-secondary);
}

.item-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 12px;
}

.time-group {
  display: flex;
  gap: 16px;
}

.time-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.time-item .label {
  font-size: 12px;
  color: var(--text-color-secondary);
}

.time-item .value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
}

.item-actions {
  display: flex;
  gap: 4px;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.history-item:hover .item-actions {
  opacity: 1;
}

.item-footer {
  display: flex;
  gap: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  font-size: 12px;
  color: var(--text-color-secondary);
}

.info-tag {
  display: flex;
  align-items: center;
  gap: 4px;
}

.empty-state {
  padding: 40px 0;
  display: flex;
  justify-content: center;
}

/* Glass Dialog Styles */
.glass-dialog :deep(.el-dialog) {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.5);
  overflow: hidden;
}

.glass-dialog :deep(.el-dialog__header) {
  margin-right: 0;
  padding: 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.glass-dialog :deep(.el-dialog__title) {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-color);
}

.glass-dialog :deep(.el-dialog__body) {
  padding: 32px 24px;
}

.glass-dialog :deep(.el-dialog__footer) {
  padding: 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

/* Edit Form Styles */
.edit-form {
  padding: 0 12px;
}

.time-edit-container {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.5);
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.time-input-small {
  width: 60px;
}

.time-input-small :deep(.el-input__wrapper) {
  padding: 0 4px;
}

.time-separator {
  font-weight: bold;
  font-size: 16px;
  color: var(--text-color-secondary);
}

.format-switch {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.3);
  padding: 8px 16px;
  border-radius: 8px;
}

.format-label {
  font-size: 14px;
  color: var(--text-color-secondary);
  font-weight: 500;
}

.short-input {
  width: 150px;
}

.medium-input {
  width: 100px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .submit-container {
    padding: 16px;
  }
  
  .bento-card {
    padding: 20px;
    border-radius: 20px;
  }
  
  .history-card {
    max-height: 500px;
    margin-top: 20px;
  }
  
  .glass-dialog :deep(.el-dialog) {
    width: 90% !important;
  }
}
</style> 