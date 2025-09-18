<template>
  <div class="online-competition">
    <div class="page-header">
      <h1 class="page-title">2025会枝杯夏季线上赛</h1>
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
        </div>

        <!-- 成绩排名表格 -->
        <div class="results-table">
          <el-card class="table-card">
            <template #header>
              <div class="card-header">
                <span>成绩排名</span>
                <div class="header-actions">
                  <el-button v-if="isAdmin" type="success" size="small" @click="showAddDialog">
                    <el-icon><Plus /></el-icon>
                    录入成绩
                  </el-button>
                  <el-button type="primary" size="small" @click="refreshResults">
                    <el-icon><Refresh /></el-icon>
                    刷新
                  </el-button>

                </div>
              </div>
            </template>
            <div class="table-container">
              <!-- 加载状态 -->
              <div v-if="loading" class="loading-container">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>加载中...</span>
              </div>
              
              <!-- 错误提示 -->
              <div v-else-if="errorMessage" class="error-container">
                <el-icon><Warning /></el-icon>
                <span>{{ errorMessage }}</span>
                <el-button type="primary" size="small" @click="refreshResults">重试</el-button>
              </div>
              
              <!-- 数据表格 -->
              <el-table v-else :data="competitionResults" stripe class="results-table" :style="{ transform: `scale(${tableZoom})`, transformOrigin: 'top left' }">
                <el-table-column prop="rank" label="排名" width="60" align="center" class-name="el-table-column--rank">
                  <template #default="scope">
                    <span class="rank-number">{{ scope.row.rank }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="playerName" label="玩家名" width="120" class-name="el-table-column--player">
                  <template #default="scope">
                    <span class="player-name" :title="scope.row.playerName">{{ scope.row.playerName }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="average" label="平均" width="90" align="center" class-name="el-table-column--average">
                  <template #default="scope">
                    <span class="average-time">{{ scope.row.average }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="single" label="单次" width="90" align="center" class-name="el-table-column--single">
                  <template #default="scope">
                    <span class="single-time">{{ scope.row.single }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="scores" label="成绩" min-width="200" class-name="el-table-column--scores">
                  <template #default="scope">
                    <div class="scores-container">
                      <span 
                        v-for="(score, index) in scope.row.scores" 
                        :key="index"
                        :class="['score-item', { 'dropped-score': score.isDropped }]"
                      >
                        {{ score.isDropped ? `(${score.value})` : score.value }}
                      </span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="150" align="center" class-name="el-table-column--actions">
                  <template #default="scope">
                    <el-button v-if="isAdmin" type="primary" size="small" @click="editScore(scope.row)">
                      <el-icon><Edit /></el-icon>
                      编辑
                    </el-button>
                    <el-button v-if="isAdmin" type="danger" size="small" @click="deleteScore(scope.row)">
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-button>
                    <span v-else class="no-permission">仅管理员可操作</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-card>
        </div>
      </div>
    </div>

    <!-- 成绩录入对话框 -->
    <el-dialog 
      v-model="addDialogVisible" 
      title="录入成绩" 
      :width="isMobile ? '90%' : '600px'"
      :close-on-click-modal="false"
    >
      <el-form :model="scoreForm" :rules="scoreRules" ref="scoreFormRef" label-width="100px">
        <el-form-item label="选手姓名" prop="playerName">
          <el-input v-model="scoreForm.playerName" placeholder="请输入选手姓名" />
        </el-form-item>
        <el-form-item label="项目类型">
          <el-tag type="info" size="large">{{ getEventDisplayName(activeEvent) }}</el-tag>
        </el-form-item>
        <el-form-item label="五次成绩" prop="scores">
          <div class="scores-input">
            <div v-for="(score, index) in scoreForm.scores" :key="index" class="score-input-item">
              <span class="score-label">第{{ index + 1 }}次</span>
              <el-input 
                v-model="scoreForm.scores[index]" 
                placeholder="成绩或DNF/DNS"
                class="score-input"
              />
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitScore" :loading="submitting">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑成绩对话框 -->
    <el-dialog 
      v-model="editDialogVisible" 
      title="编辑成绩" 
      :width="isMobile ? '90%' : '600px'"
      :close-on-click-modal="false"
    >
      <el-form :model="editForm" :rules="scoreRules" ref="editFormRef" label-width="100px">
        <el-form-item label="选手姓名" prop="playerName">
          <el-input v-model="editForm.playerName" placeholder="请输入选手姓名" />
        </el-form-item>
        <el-form-item label="项目类型">
          <el-tag type="info" size="large">{{ getEventDisplayName(activeEvent) }}</el-tag>
        </el-form-item>
        <el-form-item label="五次成绩" prop="scores">
          <div class="scores-input">
            <div v-for="(score, index) in editForm.scores" :key="index" class="score-input-item">
              <span class="score-label">第{{ index + 1 }}次</span>
              <el-input 
                v-model="editForm.scores[index]" 
                placeholder="成绩或DNF/DNS"
                class="score-input"
              />
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="updateScore" :loading="submitting">更新</el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Loading, Warning, Plus, Edit, Delete, ZoomOut, ZoomIn } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

// 当前选中的项目
const activeEvent = ref('333')

// 比赛结果数据
const competitionResults = ref([])
// 加载状态
const loading = ref(false)
// 错误信息
const errorMessage = ref('')

// 移动端检测
const isMobile = ref(false)

// 表格缩放比例
const tableZoom = ref(1)

// 检查是否为移动端
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// 管理员相关
const isAdmin = ref(false)

// 成绩录入相关
const addDialogVisible = ref(false)
const editDialogVisible = ref(false)
const submitting = ref(false)
const scoreFormRef = ref()
const editFormRef = ref()

// 成绩表单
const scoreForm = ref({
  playerName: '',
  scores: ['', '', '', '', '']
})

// 编辑表单
const editForm = ref({
  playerId: '',
  playerName: '',
  scores: ['', '', '', '', '']
})

// 表单验证规则
const scoreRules = {
  playerName: [
    { required: true, message: '请输入选手姓名', trigger: 'blur' }
  ],
  scores: [
    { required: true, message: '请输入五次成绩', trigger: 'blur' }
  ]
}

// 处理项目切换
const handleEventChange = (eventName) => {
  activeEvent.value = eventName
  // 切换项目时自动刷新数据
  fetchCompetitionResults()
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

// 获取比赛结果数据
const fetchCompetitionResults = async () => {
  loading.value = true
  errorMessage.value = ''
  
  try {
    // 调用Sealos云开发后端接口获取比赛结果
    const response = await fetch(`https://w3mavh11ex.bja.sealos.run/online-match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: activeEvent.value,
        action: 'getResults'
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.success) {
      competitionResults.value = data.results || []
    } else {
      console.error('获取比赛结果失败:', data.message)
      errorMessage.value = data.message || '获取数据失败'
      competitionResults.value = []
    }
  } catch (error) {
    console.error('获取比赛结果失败:', error)
    errorMessage.value = '网络错误，请稍后重试'
    competitionResults.value = []
  } finally {
    loading.value = false
  }
}

// 刷新结果
const refreshResults = () => {
  fetchCompetitionResults()
}

// 缩放
const zoomIn = () => {
  tableZoom.value = Math.min(tableZoom.value + 0.1, 1.2)
}

const zoomOut = () => {
  tableZoom.value = Math.max(tableZoom.value - 0.1, 0.8)
}

const resetZoom = () => {
  tableZoom.value = 1
}

// 检查管理员状态
const checkAdminStatus = () => {
  // 从网站现有的登录系统获取当前用户邮箱
  // 这里需要根据实际的登录系统来获取用户信息
  const currentUserEmail = getCurrentUserEmail() // 需要实现这个函数
  
  // 检查是否为管理员（配置的管理员邮箱列表）
  const adminEmails = [
    '3169164181@qq.com',
    '3679063384@qq.com'
    // 在这里配置管理员邮箱
  ]
  
  isAdmin.value = adminEmails.includes(currentUserEmail)
}

// 获取当前登录用户邮箱的函数
const getCurrentUserEmail = () => {
  const userStore = useUserStore()
  return userStore.user?.email || ''
}

// 显示录入对话框
const showAddDialog = () => {
  scoreForm.value = {
    playerName: '',
    scores: ['', '', '', '', '']
  }
  addDialogVisible.value = true
}

// 提交成绩
const submitScore = async () => {
  if (!scoreFormRef.value) return
  
  try {
    await scoreFormRef.value.validate()
    submitting.value = true
    
    const currentUserEmail = getCurrentUserEmail()
    
    const response = await fetch('https://w3mavh11ex.bja.sealos.run/online-match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: activeEvent.value,
        action: 'addScore',
        playerName: scoreForm.value.playerName,
        scores: scoreForm.value.scores,
        email: currentUserEmail
      })
    })
    
    const data = await response.json()
    
    if (data.success) {
      ElMessage.success('成绩录入成功')
      addDialogVisible.value = false
      refreshResults()
    } else {
      ElMessage.error(data.message || '录入失败')
    }
  } catch (error) {
    console.error('录入成绩失败:', error)
    ElMessage.error('录入失败，请重试')
  } finally {
    submitting.value = false
  }
}

// 编辑成绩
const editScore = (row) => {
  editForm.value = {
    playerId: row.playerId || row._id,
    playerName: row.playerName,
    scores: row.rawScores || row.scores.map((s) => s.value)
  }
  editDialogVisible.value = true
}

// 更新成绩
const updateScore = async () => {
  if (!editFormRef.value) return
  
  try {
    await editFormRef.value.validate()
    submitting.value = true
    
    const currentUserEmail = getCurrentUserEmail()
    
    const response = await fetch('https://w3mavh11ex.bja.sealos.run/online-match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: activeEvent.value,
        action: 'updateScore',
        playerId: editForm.value.playerId,
        playerName: editForm.value.playerName,
        scores: editForm.value.scores,
        email: currentUserEmail
      })
    })
    
    const data = await response.json()
    
    if (data.success) {
      ElMessage.success('成绩更新成功')
      editDialogVisible.value = false
      refreshResults()
    } else {
      ElMessage.error(data.message || '更新失败')
    }
  } catch (error) {
    console.error('更新成绩失败:', error)
    ElMessage.error('更新失败，请重试')
  } finally {
    submitting.value = false
  }
}

// 删除成绩
const deleteScore = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选手 ${row.playerName} 的成绩吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    const currentUserEmail = getCurrentUserEmail()
    
    const response = await fetch('https://w3mavh11ex.bja.sealos.run/online-match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: activeEvent.value,
        action: 'deleteScore',
        playerId: row.playerId || row._id,
        email: currentUserEmail
      })
    })
    
    const data = await response.json()
    
    if (data.success) {
      ElMessage.success('删除成功')
      refreshResults()
    } else {
      ElMessage.error(data.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除成绩失败:', error)
      ElMessage.error('删除失败，请重试')
    }
  }
}

// 组件挂载时获取数据
onMounted(() => {
  fetchCompetitionResults()
  checkAdminStatus()
  checkMobile()
  
  // 监听窗口大小变化
  window.addEventListener('resize', checkMobile)
})

// 监听项目变化，自动刷新数据
watch(activeEvent, () => {
  fetchCompetitionResults()
})

// 监听用户状态变化，更新管理员权限
const userStore = useUserStore()
watch(() => userStore.user, () => {
  checkAdminStatus()
}, { immediate: true })
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

/* 成绩排名表格样式 */
.results-table {
  margin-bottom: 30px;
}

.table-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.2rem;
  font-weight: 600;
  color: #2c3e50;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.table-container {
  padding: 10px 0;
  position: relative; /* 用于定位缩放控制按钮 */
}

.mobile-zoom-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 8px 12px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 10; /* 确保在表格上方 */
}

.zoom-label {
  font-size: 0.9rem;
  color: #555;
}

.results-table :deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

.results-table :deep(.el-table__header) {
  background-color: #f8f9fa;
}

.results-table :deep(.el-table__header th) {
  background-color: #f8f9fa;
  color: #2c3e50;
  font-weight: 600;
  font-size: 1rem;
  padding: 12px 6px;
  border-bottom: 2px solid #e9ecef;
  white-space: nowrap;
}

.results-table :deep(.el-table__body td) {
  padding: 12px 6px;
  border-bottom: 1px solid #f0f0f0;
  white-space: nowrap;
}

.results-table :deep(.el-table__body tr:hover) {
  background-color: #f8f9fa;
}

.rank-number {
  font-weight: 700;
  font-size: 1.1rem;
  color: #2c3e50;
}

.player-name {
  font-weight: 600;
  color: #2c3e50;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.single-time {
  font-weight: 600;
  color: #409eff;
  font-size: 1rem;
}

.average-time {
  font-weight: 600;
  color: #67c23a;
  font-size: 1rem;
}

.scores-container {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.score-item {
  padding: 4px 8px;
  border-radius: 4px;
  background-color: #f8f9fa;
  color: #606266;
  font-size: 0.9rem;
  font-weight: 500;
}

.dropped-score {
  background-color: #fafafa;
  color: #909399;

}

/* 加载和错误状态样式 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #909399;
  font-size: 1rem;
}

.loading-container .el-icon {
  font-size: 2rem;
  margin-bottom: 16px;
  color: #409eff;
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #f56c6c;
  font-size: 1rem;
  text-align: center;
}

.error-container .el-icon {
  font-size: 2rem;
  margin-bottom: 16px;
  color: #f56c6c;
}

.error-container span {
  margin-bottom: 16px;
}

.error-container .el-button {
  margin-top: 8px;
}

/* 成绩录入表单样式 */
.scores-input {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

  .score-input-item {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .score-label {
    width: 80px;
    font-weight: 600;
    color: #2c3e50;
  }
  
  .score-input {
    flex: 1;
  }
  
  /* 移动端表单优化 */
  @media (max-width: 768px) {
    .scores-input {
      gap: 12px;
    }
    
    .score-input-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
    
    .score-label {
      width: auto;
      font-size: 0.9rem;
    }
    
    .score-input {
      width: 100%;
    }
    
    .dialog-footer {
      flex-direction: column;
      gap: 8px;
    }
    
    .dialog-footer .el-button {
      width: 100%;
    }
  }

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.no-permission {
  color: #909399;
  font-size: 0.9rem;
  font-style: italic;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .online-competition {
    padding: 15px;
    margin-top: 20px; /* 为移动端添加顶部边距 */
  }
  
  .page-header {
    margin-bottom: 20px;
  }
  
  .page-title {
    font-size: 1.8rem;
    margin-bottom: 8px;
  }
  
  .competition-content {
    padding: 15px;
  }
  
  .event-tabs :deep(.el-tabs__header) {
    margin: 0;
  }
  
  .event-tabs :deep(.el-tabs__nav-wrap) {
    padding: 0 10px;
  }
  
  .event-tabs :deep(.el-tabs__item) {
    padding: 12px 15px;
    font-size: 0.9rem;
  }
  
  .event-label {
    padding: 6px 12px;
    font-size: 0.9rem;
  }
  
  .event-info {
    margin-bottom: 20px;
  }
  
  .event-title {
    font-size: 1.5rem;
    margin-bottom: 8px;
  }
  
  .event-description {
    font-size: 1rem;
  }
  
  .card-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .header-actions .el-button {
    flex: 1;
    margin: 0 2px;
  }
  
  .results-table :deep(.el-table__header th) {
    padding: 8px 4px;
    font-size: 0.9rem;
  }
  
  .results-table :deep(.el-table__body td) {
    padding: 8px 4px;
  }
  
  .rank-number {
    font-size: 1rem;
  }
  
  .player-name {
    font-size: 0.9rem;
  }
  
  .single-time,
  .average-time {
    font-size: 0.9rem;
  }
  
  .scores-container {
    gap: 8px;
  }
  
  .score-item {
    font-size: 0.8rem;
    padding: 3px 6px;
  }
  
  .no-permission {
    font-size: 0.8rem;
  }
  
  /* 移动端表格列宽优化 */
  .results-table :deep(.el-table-column--rank) {
    width: 50px !important;
  }
  
  .results-table :deep(.el-table-column--player) {
    width: 60px !important;
  }
  
  .results-table :deep(.el-table-column--single) {
    width: 60px !important;
    order: 4;
  }
  
  .results-table :deep(.el-table-column--average) {
    width: 65px !important;
    order: 3;
  }
  
  .results-table :deep(.el-table-column--scores) {
    min-width: 120px !important;
    max-width: 150px !important;
    order: 5;
  }
  
  .results-table :deep(.el-table-column--actions) {
    display: none !important;
  }
  
  /* 移动端表格列间距优化 */
  .results-table :deep(.el-table__body td) {
    padding: 8px 2px;
  }
  
  .results-table :deep(.el-table__header th) {
    padding: 8px 2px;
  }
}

/* 超小屏幕优化 */
@media (max-width: 480px) {
  .online-competition {
    padding: 10px;
    margin-top: 15px;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
  
  .competition-content {
    padding: 10px;
  }
  
  .event-tabs :deep(.el-tabs__item) {
    padding: 10px 12px;
    font-size: 0.8rem;
  }
  
  .event-label {
    padding: 4px 8px;
    font-size: 0.8rem;
  }
  
  .card-header {
    font-size: 1rem;
  }
  
  .header-actions .el-button {
    font-size: 0.8rem;
    padding: 8px 12px;
  }
  
  .results-table :deep(.el-table__header th) {
    padding: 8px 4px;
    font-size: 0.8rem;
  }
  
  .results-table :deep(.el-table__body td) {
    padding: 8px 4px;
  }
  
  .scores-container {
    gap: 6px;
  }
  
  .score-item {
    font-size: 0.75rem;
    padding: 2px 4px;
  }
}
</style>
