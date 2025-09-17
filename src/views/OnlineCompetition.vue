<template>
  <div class="online-competition">
    <div class="page-header">
      <h1 class="page-title">线上赛（临时）</h1>
      <p class="page-subtitle">参与线上魔方比赛，挑战自我</p>
    </div>

    <div class="competition-container">
      <!-- 项目标签栏 -->
      <el-tabs v-model="activeEvent" class="event-tabs" @tab-change="handleEventChange">
        <el-tab-pane label="三阶" name="333">
          <template #label>
            <span class="event-label">三阶</span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="二阶" name="222">
          <template #label>
            <span class="event-label">二阶</span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="三单" name="333oh">
          <template #label>
            <span class="event-label">三单</span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="四阶" name="444">
          <template #label>
            <span class="event-label">四阶</span>
          </template>
        </el-tab-pane>
      </el-tabs>

      <!-- 比赛内容区域 -->
      <div class="competition-content">
        <div class="event-info">
          <h2 class="event-title">{{ getEventDisplayName(activeEvent) }}</h2>
          <p class="event-description">当前项目：{{ getEventDisplayName(activeEvent) }}</p>
        </div>

        <!-- 管理员录入按钮 -->
        <div v-if="isAdmin" class="admin-actions">
          <el-button type="primary" @click="openSubmitWindow">
            录入成绩
          </el-button>
        </div>

        <!-- 实时排行榜 -->
        <div class="leaderboard-section">
          <el-card class="leaderboard-card">
            <template #header>
              <div class="card-header">
                <span>实时排行榜</span>
              </div>
            </template>
            <RecordsTable 
              :records="leaderboardData" 
              :show-actions="false"
              :auto-refresh="true"
              @refresh="loadLeaderboardData"
            />
          </el-card>
        </div>
      </div>
    </div>

    <!-- 成绩录入窗口 -->
    <el-dialog
      v-model="showSubmitWindow"
      title="录入成绩"
      width="800px"
      class="glass-dialog"
    >
      <div class="submit-form-container">
        <el-form
          ref="submitFormRef"
          :model="submitForm"
          :rules="submitRules"
          label-width="100px"
        >
          <el-form-item label="选手昵称" prop="playerName">
            <el-input v-model="submitForm.playerName" placeholder="请输入选手昵称" />
          </el-form-item>
          
          <el-form-item label="项目" prop="event">
            <el-select v-model="submitForm.event" placeholder="请选择项目" disabled>
              <el-option
                v-for="event in eventOptions"
                :key="event.value"
                :label="event.label"
                :value="event.value"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="成绩列表" required>
            <div class="attempts-container">
              <div 
                v-for="(attempt, index) in submitForm.attempts" 
                :key="index" 
                class="attempt-item"
              >
                <span class="attempt-label">第{{ index + 1 }}次:</span>
                <el-input 
                  v-model="attempt.time" 
                  placeholder="请输入成绩（秒）" 
                  @blur="formatAttemptTime(index)"
                />
                <el-button 
                  v-if="submitForm.attempts.length > 5" 
                  @click="removeAttempt(index)" 
                  type="danger" 
                  icon="Delete" 
                  circle
                  size="small"
                />
              </div>
              <el-button 
                v-if="submitForm.attempts.length < 10" 
                @click="addAttempt" 
                type="primary" 
                icon="Plus"
                circle
                size="small"
              />
            </div>
          </el-form-item>
          
          <el-form-item label="时间">
            <el-date-picker
              v-model="submitForm.time"
              type="datetime"
              placeholder="选择时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DDTHH:mm:ss.SSS[Z]"
            />
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showSubmitWindow = false">取消</el-button>
          <el-button type="primary" @click="submitRecord" :loading="submitLoading">提交</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useUserStore } from '@/stores/user'
import { useRecordsStore } from '@/stores/records'
import RecordsTable from '@/components/RecordsTable.vue'
import { ElMessage } from 'element-plus'

// 当前选中的项目
const activeEvent = ref('333')

// 管理员邮箱列表（可手动添加）
const ADMIN_EMAILS = ['3169164181@qq.com', 'admin@cube.com'] // 在这里添加管理员邮箱

const userStore = useUserStore()
const recordsStore = useRecordsStore()

// 控制录入窗口显示
const showSubmitWindow = ref(false)
const submitLoading = ref(false)
const submitFormRef = ref()

// 录入表单数据
const submitForm = reactive({
  playerName: '',
  event: '333',
  attempts: [
    { time: '' },
    { time: '' },
    { time: '' },
    { time: '' },
    { time: '' }
  ],
  time: new Date()
})

// 表单验证规则
const submitRules = {
  playerName: [
    { required: true, message: '请输入选手昵称', trigger: 'blur' }
  ],
  event: [
    { required: true, message: '请选择项目', trigger: 'change' }
  ]
}

// 项目选项
const eventOptions = [
  { value: '333', label: '三阶' },
  { value: '222', label: '二阶' },
  { value: '333oh', label: '三单' },
  { value: '444', label: '四阶' }
]

// 检查当前用户是否为管理员
const isAdmin = computed(() => {
  return userStore.user && ADMIN_EMAILS.includes(userStore.user.email)
})

// 检查当前用户是否为管理员
const isAdmin = computed(() => {
  return userStore.user && ADMIN_EMAILS.includes(userStore.user.email)
})

// 处理项目切换
const handleEventChange = (eventName) => {
  activeEvent.value = eventName
  loadLeaderboardData()
}

// 获取项目显示名称
const getEventDisplayName = (eventCode) => {
  const eventNames = {
    '333': '三阶',
    '222': '二阶',
    '333oh': '三单',
    '444': '四阶'
  }
  return eventNames[eventCode] || '未知项目'
}

// 排行榜数据
const leaderboardData = ref([])

// 加载排行榜数据
const loadLeaderboardData = async () => {
  try {
    await recordsStore.fetchRecords()
    const bestRecords = recordsStore.getBestRecords()
    
    // 过滤当前项目的数据
    const eventData = bestRecords[activeEvent.value] || {}
    
    // 格式化数据以适应RecordsTable组件
    const formattedData = []
    
    if (eventData.single || eventData.average) {
      formattedData.push({
        event: activeEvent.value,
        single: eventData.single,
        average: eventData.average
      })
    }
    
    // 从所有记录中筛选当前项目的记录
    const eventRecords = recordsStore.records
      .filter(record => record.event === activeEvent.value)
      .map(record => ({
        event: record.event,
        single: record.single,
        average: record.average
      }))
    
    leaderboardData.value = eventRecords
  } catch (error) {
    console.error('加载排行榜数据失败:', error)
    ElMessage.error('加载排行榜数据失败')
  }
}

// 处理成绩提交
const handleRecordSubmit = async (recordData) => {
  try {
    await recordsStore.addRecord(recordData)
    ElMessage.success('成绩录入成功')
    showSubmitDialog.value = false
    loadLeaderboardData() // 重新加载数据
  } catch (error) {
    console.error('成绩录入失败:', error)
    ElMessage.error('成绩录入失败: ' + error.message)
  }
}

onMounted(() => {
  loadLeaderboardData()
})
</script>

<style scoped>
.online-competition {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 10px;
}

.page-subtitle {
  font-size: 1.1rem;
  color: #7f8c8d;
  margin: 0;
}

.competition-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.event-tabs {
  background: #f8f9fa;
}

.event-tabs :deep(.el-tabs__header) {
  margin: 0;
  background: white;
}

.event-tabs :deep(.el-tabs__nav-wrap) {
  padding: 0 20px;
}

.event-tabs :deep(.el-tabs__item) {
  font-size: 1.1rem;
  font-weight: 600;
  padding: 20px 30px;
  color: #606266;
}

.event-tabs :deep(.el-tabs__item.is-active) {
  color: #409eff;
  font-weight: 700;
}

.event-tabs :deep(.el-tabs__active-bar) {
  background-color: #409eff;
  height: 3px;
}

.event-label {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.event-tabs :deep(.el-tabs__item.is-active) .event-label {
  background: rgba(64, 158, 255, 0.1);
  color: #409eff;
}

.competition-content {
  padding: 30px;
}

.event-info {
  text-align: center;
  margin-bottom: 30px;
}

.event-title {
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 10px;
}

.event-description {
  font-size: 1.1rem;
  color: #7f8c8d;
  margin: 0;
}

.admin-actions {
  text-align: center;
  margin-bottom: 20px;
}

.leaderboard-section {
  margin-bottom: 30px;
}

.leaderboard-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  font-size: 1.2rem;
  font-weight: 600;
  color: #2c3e50;
}

.submit-form-container {
  max-height: 60vh;
  overflow-y: auto;
}

.attempts-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.attempt-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.attempt-label {
  width: 60px;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .online-competition {
    padding: 15px;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .competition-content {
    padding: 20px;
  }
  
  .event-tabs :deep(.el-tabs__item) {
    padding: 15px 20px;
    font-size: 1rem;
  }
  
  .attempt-item {
    flex-wrap: wrap;
  }
  
  .attempt-label {
    width: 100%;
  }
}
</style>