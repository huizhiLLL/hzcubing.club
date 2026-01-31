<template>
  <div class="view-container">
    <!-- 动态背景光球 -->
    <div class="ambient-orb orb-1"></div>
    <div class="ambient-orb orb-2"></div>

    <ElementTransition name="zoom" :duration="600" appear>
      <div class="bento-card profile-header">
        <div class="user-profile">
          <div class="avatar-wrapper" @click="triggerFileUpload">
            <el-avatar
              :size="120"
              :src="user?.avatar || '/default-avatar.svg'"
              class="avatar clickable"
              :class="{ 'default-avatar': !user?.avatar || isDefaultAvatar(user?.avatar) }"
            >
              <template #default>
                <span class="avatar-text">{{ user?.nickname?.charAt(0)?.toUpperCase() || 'User' }}</span>
              </template>
            </el-avatar>
            <div class="avatar-overlay">
              <el-icon><Camera /></el-icon>
            </div>
            <!-- 隐藏的文件上传输入框 -->
            <input 
              type="file" 
              ref="fileInput" 
              style="display: none" 
              accept="image/*" 
              @change="handleAvatarChange"
            />
          </div>
          <div class="user-info">
            <div class="info-header">
              <h1 class="nickname">{{ user?.nickname }}</h1>
              <el-button circle class="edit-btn" @click="openEditDialog" title="编辑资料">
                <el-icon><EditPen /></el-icon>
              </el-button>
            </div>
            <p class="bio">{{ user?.bio || '这个人很懒，什么都没写~' }}</p>
            <div class="user-meta" v-if="user?.wcaId">
              <el-tag effect="dark" type="primary" class="wca-tag">WCA ID: {{ user.wcaId }}</el-tag>
            </div>
          </div>
        </div>
      </div>
    </ElementTransition>

    <ElementTransition name="slide-up" :duration="600" :delay="200" appear>
      <div class="tabs-container">
        <el-tabs v-model="activeTab" class="glass-tabs">
          <el-tab-pane label="个人最佳" name="personal-bests">
            <div class="bento-card tab-content">
              <div class="section-header">
                <h3 class="section-title">
                  <el-icon><Trophy /></el-icon> 最佳成绩
                </h3>
                <el-select v-model="selectedCategory" placeholder="项目类型" size="default" class="glass-select" style="width: 140px;">
                  <el-option label="全部类型" value="all" />
                  <el-option label="官方项目" value="official" />
                  <el-option label="趣味项目" value="fun" />
                  <el-option label="整活项目" value="meme" />
                </el-select>
              </div>
              
              <el-table
                v-loading="loading"
                :data="filteredPersonalBests"
                style="width: 100%"
                empty-text="暂无成绩记录"
                class="glass-table"
                :header-cell-style="{ background: 'transparent', color: 'var(--el-text-color-primary)' }"
                :row-style="{ background: 'transparent' }"
              >
                <el-table-column label="项目" prop="eventName" min-width="140">
                  <template #default="scope">
                    <div class="event-cell">
                      <span class="event-name">{{ scope.row.eventName }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="单次" min-width="120">
                  <template #default="scope">
                    <div class="record-value" v-if="!isNaN(scope.row.singleSeconds)">
                      <span class="time">{{ formatTime(scope.row.singleSeconds) }}</span>
                      <el-tag v-if="scope.row.singleRank === 1" size="small" type="danger" effect="dark" class="rank-tag">GR</el-tag>
                    </div>
                    <span v-else class="empty-value">-</span>
                  </template>
                </el-table-column>
                <el-table-column label="平均" min-width="120">
                  <template #default="scope">
                    <div class="record-value" v-if="!isNaN(scope.row.averageSeconds)">
                      <span class="time">{{ formatTime(scope.row.averageSeconds) }}</span>
                      <el-tag v-if="scope.row.averageRank === 1" size="small" type="danger" effect="dark" class="rank-tag">GR</el-tag>
                    </div>
                    <span v-else class="empty-value">-</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="历史成绩" name="history">
            <div class="bento-card tab-content">
              <div class="section-header">
                <h3 class="section-title">
                  <el-icon><Timer /></el-icon> 历史记录
                </h3>
                <div class="filter-controls">
                  <el-select v-model="selectedEvent" placeholder="选择项目" size="default" class="glass-select" style="width: 140px;">
                    <el-option label="全部项目" value="all" />
                    <el-option
                      v-for="event in userEvents"
                      :key="event"
                      :label="getEventName(event)"
                      :value="event"
                    />
                  </el-select>
                  <el-select v-model="sortOrder" placeholder="排序方式" size="default" class="glass-select" style="width: 120px;">
                    <el-option label="最新优先" value="latest" />
                    <el-option label="最快优先" value="fastest" />
                  </el-select>
                </div>
              </div>
              
              <el-table
                v-loading="historyLoading"
                :data="filteredHistoryRecords"
                style="width: 100%"
                empty-text="暂无历史成绩记录"
                class="glass-table"
                :header-cell-style="{ background: 'transparent', color: 'var(--el-text-color-primary)' }"
                :row-style="{ background: 'transparent' }"
              >
                <el-table-column label="项目" prop="eventName" min-width="120" />
                <el-table-column label="单次" min-width="100">
                  <template #default="scope">
                    <span class="value time">{{ formatTime(scope.row.singleSeconds) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="平均" min-width="100">
                  <template #default="scope">
                    <span class="value time">{{ formatTime(scope.row.averageSeconds) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="提交时间" min-width="160">
                  <template #default="scope">
                    <div class="record-cell" @click="showRecordDetails(scope.row)">
                      <span>{{ formatDate(scope.row.timestamp) }}</span>
                      <span class="detail-btn">
                        <el-icon><ArrowRight /></el-icon>
                      </span>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
              
              <div class="pagination-container" v-if="totalHistoryRecords > 0">
                <el-pagination
                  v-model:current-page="currentPage"
                  v-model:page-size="pageSize"
                  :page-sizes="[10, 20, 50, 100]"
                  layout="total, sizes, prev, pager, next"
                  :total="totalHistoryRecords"
                  @size-change="handleSizeChange"
                  @current-change="handleCurrentChange"
                  class="glass-pagination"
                  background
                />
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="统计分析" name="statistics">
            <div class="bento-card tab-content">
              <div class="section-header">
                <h3 class="section-title">
                  <el-icon><DataAnalysis /></el-icon> 数据概览
                </h3>
              </div>
              
              <div class="stats-overview">
                <div class="stats-card highlight">
                  <div class="stat-value">{{ firstPlaceCount }}</div>
                  <div class="stat-label">第一名次数</div>
                </div>
                <div class="stats-card">
                  <div class="stat-value">{{ topThreeCount }}</div>
                  <div class="stat-label">前三名次数</div>
                </div>
                <div class="stats-card">
                  <div class="stat-value">{{ totalRecords }}</div>
                  <div class="stat-label">总提交数</div>
                </div>
                <div class="stats-card">
                  <div class="stat-value">{{ activeEvents }}</div>
                  <div class="stat-label">参与项目</div>
                </div>
              </div>

              <div class="medal-section" v-if="sortedTopThreeRecords.length > 0">
                <h4 class="subsection-title">排名分布</h4>
                <div class="rank-grid">
                  <div v-for="(item, index) in sortedTopThreeRecords" :key="index" class="rank-card">
                    <div class="rank-event">{{ getEventName(item.eventCode) }}</div>
                    <div class="rank-badges">
                      <div v-if="item.singleRank === 1" class="rank-badge rank-1">
                        <span>单次</span> <span class="badge-val">#1</span>
                      </div>
                      <div v-else-if="item.singleRank === 2" class="rank-badge rank-2">
                        <span>单次</span> <span class="badge-val">#2</span>
                      </div>
                      <div v-else-if="item.singleRank === 3" class="rank-badge rank-3">
                        <span>单次</span> <span class="badge-val">#3</span>
                      </div>
                      
                      <div v-if="item.averageRank === 1" class="rank-badge rank-1">
                        <span>平均</span> <span class="badge-val">#1</span>
                      </div>
                      <div v-else-if="item.averageRank === 2" class="rank-badge rank-2">
                        <span>平均</span> <span class="badge-val">#2</span>
                      </div>
                      <div v-else-if="item.averageRank === 3" class="rank-badge rank-3">
                        <span>平均</span> <span class="badge-val">#3</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div v-else-if="totalRecords > 0" class="empty-stats">
                暂无前三名记录，继续加油！
              </div>
              <div v-else class="empty-stats">
                暂无数据
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </ElementTransition>

    <!-- 编辑资料对话框 -->
    <el-dialog
      v-model="showEditDialog"
      title="编辑资料"
      width="500px"
      :destroy-on-close="false"
      :close-on-click-modal="false"
      @open="fillFormWithUserData"
      class="glass-dialog"
    >
      <div v-if="user" class="glass-form">
        <el-form
          ref="editFormRef"
          :model="editForm"
          :rules="editRules"
          label-width="80px"
          label-position="top"
        >
          <el-form-item label="昵称" prop="nickname">
            <el-input v-model="editForm.nickname" placeholder="请输入昵称" class="glass-input" />
          </el-form-item>
          <el-form-item label="签名" prop="bio">
            <el-input
              v-model="editForm.bio"
              type="textarea"
              :rows="3"
              placeholder="请输入个人签名"
              class="glass-input"
            />
          </el-form-item>
          <el-form-item label="WCA ID" prop="wcaId">
            <el-input v-model="editForm.wcaId" placeholder="如有请填写" class="glass-input" />
          </el-form-item>
        </el-form>
      </div>
      <div v-else class="loading-text">
        加载用户数据中...
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelEdit">取消</el-button>
          <el-button type="primary" @click="handleEditSubmit" :disabled="!user">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 记录详情对话框 -->
    <el-dialog
      v-model="recordDetailVisible"
      title="成绩详情"
      width="500px"
      class="glass-dialog"
    >
      <div v-if="selectedRecord" class="record-details">
        <div class="detail-row highlight">
          <span class="label">项目</span>
          <span class="value">{{ getEventName(selectedRecord.event) }}</span>
        </div>
        
        <div class="detail-group" v-if="!isNaN(selectedRecord.singleSeconds)">
          <div class="detail-row">
            <span class="label">单次成绩</span>
            <span class="value time">{{ formatTime(selectedRecord.singleSeconds) }}</span>
          </div>
          <div class="detail-row" v-if="selectedRecord.singleRank">
            <span class="label">单次排名</span>
            <span class="value rank">#{{ selectedRecord.singleRank }}</span>
          </div>
        </div>
        
        <div class="detail-group" v-if="!isNaN(selectedRecord.averageSeconds)">
          <div class="detail-row">
            <span class="label">平均成绩</span>
            <span class="value time">{{ formatTime(selectedRecord.averageSeconds) }}</span>
          </div>
          <div class="detail-row" v-if="selectedRecord.averageRank">
            <span class="label">平均排名</span>
            <span class="value rank">#{{ selectedRecord.averageRank }}</span>
          </div>
        </div>
        
        <div class="detail-row" v-if="isValidField(selectedRecord.cube)">
          <span class="label">使用魔方</span>
          <span class="value">{{ selectedRecord.cube }}</span>
        </div>
        
        <div class="detail-row" v-if="isValidField(selectedRecord.method)">
          <span class="label">解法</span>
          <span class="value">{{ selectedRecord.method }}</span>
        </div>
        
        <div class="detail-row">
          <span class="label">提交时间</span>
          <span class="value">{{ formatDate(selectedRecord.timestamp, true) }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'
import { useRecordsStore } from '@/stores/records'
import { formatTime as formatTimeUtil, normalizeFloat } from '@/utils/timeFormatter'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import ElementTransition from '@/components/ElementTransition.vue'
import { categories, events, getEventName, getEventType, getAllEvents } from '@/config/events'
import api from '@/api'
import { Trophy, Timer, DataAnalysis, ArrowRight, EditPen, Camera } from '@element-plus/icons-vue'

const router = useRouter()

const userStore = useUserStore()
const recordsStore = useRecordsStore()
const { user } = storeToRefs(userStore)
const loading = ref(false)

// 新增：个人最佳、历史记录和统计分析相关
const personalBests = ref({})
const historyRecords = ref([])
const historyLoading = ref(false)
const activeTab = ref('personal-bests')
const selectedCategory = ref('all')
const selectedEvent = ref('all')
const sortOrder = ref('latest')
const currentPage = ref(1)
const pageSize = ref(20)
const recordDetailVisible = ref(false)
const selectedRecord = ref(null)

// 编辑资料相关
const showEditDialog = ref(false)
const editFormRef = ref(null)
const fileInput = ref(null)
const editForm = reactive({
  nickname: '',
  bio: '',
  wcaId: ''
})

const editRules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  bio: [
    { max: 100, message: '签名不能超过 100 个字符', trigger: 'blur' }
  ]
}

// 格式化个人最佳数据，添加项目名称
const formattedPersonalBests = computed(() => {
  const result = []
  
  for (const [eventCode, record] of Object.entries(personalBests.value || {})) {
    if (record && (!isNaN(record.singleSeconds) || !isNaN(record.averageSeconds))) {
      result.push({
        event: eventCode,
        eventName: getEventName(eventCode),
        eventType: getEventType(eventCode),
        ...record
      })
    }
  }
  
  // 按项目类型排序：官方项目、趣味项目、整活项目
  result.sort((a, b) => {
    // 定义项目类型优先级
    const typePriority = {
      'official': 1,
      'fun': 2,
      'meme': 3
    }
    
    // 先按类型排序
    const typeComparison = typePriority[a.eventType] - typePriority[b.eventType]
    if (typeComparison !== 0) {
      return typeComparison
    }
    
    // 如果类型相同，则按照events.js中的顺序排序
    // 获取当前类型的所有项目
    const typeOptions = events[a.eventType]?.options || []
    
    // 找到项目在数组中的索引
    const indexA = typeOptions.findIndex(opt => opt.value === a.event)
    const indexB = typeOptions.findIndex(opt => opt.value === b.event)
    
    // 如果找不到索引，则放到最后
    const finalIndexA = indexA === -1 ? 999 : indexA
    const finalIndexB = indexB === -1 ? 999 : indexB
    
    // 按索引排序
    return finalIndexA - finalIndexB
  })
  
  return result
})

// 根据选择的类别过滤个人最佳
const filteredPersonalBests = computed(() => {
  if (selectedCategory.value === 'all') {
    return formattedPersonalBests.value
  }
  
  return formattedPersonalBests.value.filter(record => {
    return record.eventType === selectedCategory.value
  })
})

// 过滤历史记录
const filteredHistoryRecords = computed(() => {
  let records = historyRecords.value.map(record => ({
    ...record,
    eventName: getEventName(record.event)
  }))
  
  // 按项目过滤
  if (selectedEvent.value !== 'all') {
    records = records.filter(record => record.event === selectedEvent.value)
  }
  
  // 排序
  if (sortOrder.value === 'fastest') {
    records.sort((a, b) => {
      const aTime = a.singleSeconds ?? Infinity
      const bTime = b.singleSeconds ?? Infinity
      return aTime - bTime
    })
  } else {
    // 默认按时间倒序
    records.sort((a, b) => {
      const aDate = new Date(a.timestamp)
      const bDate = new Date(b.timestamp)
      return bDate - aDate
    })
  }
  
  // 分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return records.slice(start, end)
})

// 总历史记录数
const totalHistoryRecords = computed(() => {
  if (selectedEvent.value === 'all') {
    return historyRecords.value.length
  }
  return historyRecords.value.filter(record => record.event === selectedEvent.value).length
})

// 获取用户参与过的所有项目
const userEvents = computed(() => {
  const events = new Set()
  historyRecords.value.forEach(record => {
    if (record.event) {
      events.add(record.event)
    }
  })
  return Array.from(events).sort()
})

// 统计数据
const totalRecords = computed(() => historyRecords.value.length)

const activeEvents = computed(() => {
  const events = new Set()
  historyRecords.value.forEach(record => {
    events.add(record.event)
  })
  return events.size
})

const topThreeCount = ref(0)
const firstPlaceCount = ref(0)

// 项目分布
const eventDistribution = computed(() => {
  const distribution = {}
  
  historyRecords.value.forEach(record => {
    if (!distribution[record.event]) {
      distribution[record.event] = 0
    }
    distribution[record.event]++
  })
  
  return distribution
})

const maxEventCount = computed(() => {
  const counts = Object.values(eventDistribution.value)
  return counts.length > 0 ? Math.max(...counts) : 0
})

// 使用统一的格式化时间函数
const formatTime = formatTimeUtil

// 格式化日期
const formatDate = (dateString, includeTime = false) => {
  if (!dateString) return '-'
  
  try {
    const date = new Date(dateString.$date || dateString)
    
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    
    let result = `${year}.${month}.${day}`
    
    if (includeTime) {
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      result += ` ${hours}:${minutes}`
    }
    
    return result
  } catch (error) {
    return '日期格式错误'
  }
}

// 显示记录详情
const showRecordDetails = (record) => {
  // 处理记录对象，但保留null或undefined值
  const processedRecord = {
    ...record,
    // 尝试从不同位置获取字段
    cube: record.cube || record.single?.cube || record.average?.cube,
    method: record.method || record.single?.method || record.average?.method
  }
  
  selectedRecord.value = processedRecord
  recordDetailVisible.value = true
}

// 处理分页
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page) => {
  currentPage.value = page
}

// 获取用户个人最佳记录
const fetchUserRecords = async (userId) => {
  try {
    // 获取当前登录用户的ID
    let currentUserId = userId || user.value?._id || user.value?.id
    
    // 确保ID格式正确
    if (!userId && typeof user.value === 'object' && user.value !== null) {
      if (user.value._id) currentUserId = user.value._id
      else if (user.value.id) currentUserId = user.value.id
    }
    
    if (!currentUserId) {
      console.error('无法获取用户ID，用户可能未登录或数据未加载完成')
      return
    }

    const result = await api.getUsersBestRecord(currentUserId)
    
    if (result.code === 200 && result.data) {
      const map = {}
      ;(result.data || []).forEach(it => {
        map[it.event] = {
          singleSeconds: typeof it.bestSingleSeconds === 'number' ? normalizeFloat(it.bestSingleSeconds) : null,
          averageSeconds: typeof it.bestAverageSeconds === 'number' ? normalizeFloat(it.bestAverageSeconds) : null
        }
      })
      personalBests.value = map
    } else {
      console.error('获取用户成绩失败:', result.message, '响应码:', result.code)
    }
  } catch (error) {
    console.error('获取用户成绩出错:', error)
  }
}

// 获取用户历史记录
const fetchUserHistoryRecords = async (userId) => {
  historyLoading.value = true
  try {
    // 获取当前登录用户的ID
    let currentUserId = userId || user.value?._id || user.value?.id
    
    // 确保ID格式正确
    if (!userId && typeof user.value === 'object' && user.value !== null) {
      if (user.value._id) currentUserId = user.value._id
      else if (user.value.id) currentUserId = user.value.id
    }
    
    if (!currentUserId) {
      console.error('无法获取用户ID，用户可能未登录或数据未加载完成')
      historyLoading.value = false
      return
    }

    const result = await api.getUsersHistoryRecord(currentUserId)
    
    if (result.code === 200 && result.data) {
      const rows = (result.data || []).map(r => {
        const single = typeof r.singleSeconds === 'number' ? r.singleSeconds : (r.single && typeof r.single.time === 'number' ? r.single.time : null)
        const average = typeof r.averageSeconds === 'number' ? r.averageSeconds : (r.average && typeof r.average.time === 'number' ? r.average.time : null)
        return {
          ...r,
          singleSeconds: typeof single === 'number' ? normalizeFloat(single) : null,
          averageSeconds: typeof average === 'number' ? normalizeFloat(average) : null
        }
      })
      historyRecords.value = rows
      
      await ensureRecordsLoaded(currentUserId)
    } else {
      console.error('获取用户历史成绩失败:', result.message, '响应码:', result.code)
    }
  } catch (error) {
    console.error('获取用户历史成绩出错:', error)
  } finally {
    historyLoading.value = false
  }
}

// 确保排行榜数据已加载
const ensureRecordsLoaded = async (hardcodedId) => {
  try {
    // 检查recordsStore是否有数据
    if (recordsStore.records.length === 0) {
      await recordsStore.fetchRecords()
    }
    
    // 计算排名
    calculateRankings(hardcodedId)
    
    // 强制重新计算统计数据
    topThreeCount.value = calculateTopThreeCount()
    firstPlaceCount.value = calculateFirstPlaceCount()
  } catch (error) {
    console.error('加载排行榜数据出错:', error)
    // 仍然计算统计数据，使用现有信息
    topThreeCount.value = calculateTopThreeCount()
    firstPlaceCount.value = calculateFirstPlaceCount()
  }
}

// 添加：计算排名信息
const calculateRankings = (hardcodedId) => {
  try {
    // 不再调用API，而是使用recordsStore中的数据
    
    // 获取当前用户ID
    const userId = hardcodedId || user.value?._id || user.value?.id
    if (!userId) {
      console.error('计算排名时无法获取用户ID')
      return
    }
    
    // 先重置排名计数
    topThreeCount.value = 0
    firstPlaceCount.value = 0
    
    // 遍历个人最佳记录，计算排名
    for (const [eventCode, record] of Object.entries(personalBests.value)) {
      // 获取项目类型，如果是整活项目则跳过排名计算
      const eventType = getEventType(eventCode)
      if (eventType === 'meme') {
        continue
      }
      
      // 获取该项目的所有记录
      const eventRecords = recordsStore.getRecordsByEvent(eventCode)
      
      // 计算单次排名
      if (!isNaN(record.singleSeconds)) {
        // 创建用户单次最佳记录映射
        const userBestSingles = new Map()
        
        eventRecords.forEach(er => {
          if (!er.userId || er.singleSeconds == null) return
          // 标准化时间值以确保比较准确
          const normalizedTime = normalizeFloat(er.singleSeconds)
          if (normalizedTime === null) return
          
          if (!userBestSingles.has(er.userId) || normalizedTime < userBestSingles.get(er.userId).time) {
            userBestSingles.set(er.userId, {
              userId: er.userId,
              time: normalizedTime
            })
          }
        })
        
        // 转换为数组并排序
        const sortedSingles = Array.from(userBestSingles.values())
          .sort((a, b) => a.time - b.time)
        
        // 查找当前用户的排名（通过 userId 查找）
        const userRank = sortedSingles.findIndex(r => r.userId === userId) + 1
        
        if (userRank > 0) {
          record.singleRank = userRank
          
          // 更新统计数据
          if (userRank === 1) {
            firstPlaceCount.value++
          }
          if (userRank <= 3) {
            topThreeCount.value++
          }
        }
      }
      
      // 计算平均排名
      if (!isNaN(record.averageSeconds)) {
        // 创建用户平均最佳记录映射
        const userBestAverages = new Map()
        
        eventRecords.forEach(er => {
          if (!er.userId || er.averageSeconds == null) return
          // 标准化时间值以确保比较准确
          const normalizedTime = normalizeFloat(er.averageSeconds)
          if (normalizedTime === null) return
          
          if (!userBestAverages.has(er.userId) || normalizedTime < userBestAverages.get(er.userId).time) {
            userBestAverages.set(er.userId, {
              userId: er.userId,
              time: normalizedTime
            })
          }
        })
        
        // 转换为数组并排序
        const sortedAverages = Array.from(userBestAverages.values())
          .sort((a, b) => a.time - b.time)
        
        // 查找当前用户的排名（通过 userId 查找）
        const userRank = sortedAverages.findIndex(r => r.userId === userId) + 1
        
        if (userRank > 0) {
          record.averageRank = userRank
          
          // 更新统计数据
          if (userRank === 1) {
            firstPlaceCount.value++
          }
          if (userRank <= 3) {
            topThreeCount.value++
          }
        }
      }
    }
  } catch (error) {
    console.error('计算排名信息出错:', error)
    // 出错时仍然计算统计数据，使用现有信息
    topThreeCount.value = calculateTopThreeCount()
    firstPlaceCount.value = calculateFirstPlaceCount()
  }
}

// 计算排名前三的数量
const calculateTopThreeCount = () => {
  let count = 0
  let eventCounts = 0
  
  for (const [eventCode, record] of Object.entries(personalBests.value)) {
    // 排除整活项目
    const eventType = getEventType(eventCode)
    if (eventType === 'meme') {
      continue
    }
    
    eventCounts++
    const hasSingleRank = record.singleRank && record.singleRank <= 3
    const hasAverageRank = record.averageRank && record.averageRank <= 3
    
    if (hasSingleRank || hasAverageRank) {
      count++
    }
  }
  
  return count
}

// 计算第一名的数量
const calculateFirstPlaceCount = () => {
  let count = 0
  let eventCounts = 0
  
  for (const [eventCode, record] of Object.entries(personalBests.value)) {
    // 排除整活项目
    const eventType = getEventType(eventCode)
    if (eventType === 'meme') {
      continue
    }
    
    eventCounts++
    const hasSingleRank1 = record.singleRank === 1
    const hasAverageRank1 = record.averageRank === 1
    
    if (hasSingleRank1 || hasAverageRank1) {
      count++
    }
  }
  
  return count
}

// 检查字段是否有效
const isValidField = (value) => {
  return value !== null && value !== undefined && value !== 'null' && value !== ''
}

// 检查是否为默认头像
const isDefaultAvatar = (avatar) => {
  if (!avatar) return true
  return avatar.includes('default-avatar') || avatar === '/default-avatar.svg'
}

// 获取排名前三的记录
const topThreeRecords = computed(() => {
  const result = {}
  for (const [eventCode, record] of Object.entries(personalBests.value)) {
    // 排除整活项目
    const eventType = getEventType(eventCode)
    if (eventType === 'meme') {
      continue
    }
    
    // 检查是否有排名信息
    const hasSingleRank = record.singleRank && record.singleRank <= 3
    const hasAverageRank = record.averageRank && record.averageRank <= 3
    
    if (hasSingleRank || hasAverageRank) {
      result[eventCode] = {
        ...record,
        eventCode // 添加eventCode以便在sortedTopThreeRecords中使用
      }
    }
  }
  
  return result
})

// 按排名排序的前三名记录
const sortedTopThreeRecords = computed(() => {
  const records = []
  
  for (const [eventCode, record] of Object.entries(topThreeRecords.value)) {
    // 确保记录有eventCode
    const recordWithEventCode = {
      ...record,
      eventCode: eventCode || record.eventCode
    }
    
    // 计算排名权重
    const singleRankWeight = record.singleRank && record.singleRank <= 3 ? record.singleRank : 999
    const averageRankWeight = record.averageRank && record.averageRank <= 3 ? record.averageRank : 999
    
    records.push({
      ...recordWithEventCode,
      singleRank: record.singleRank,
      averageRank: record.averageRank,
      // 计算一个综合排名权重，优先使用更好的排名
      rankWeight: Math.min(singleRankWeight, averageRankWeight)
    })
  }
  
  // 按排名从小到大排序（第一名在前）
  const sortedRecords = records.sort((a, b) => a.rankWeight - b.rankWeight)
  
  return sortedRecords
})

// 头像上传
const triggerFileUpload = () => {
  fileInput.value.click()
}

const handleAvatarChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  // 检查文件大小 (2MB)
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.warning('图片大小不能超过 2MB')
    return
  }
  
  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请上传图片文件')
    return
  }
  
  try {
      const formData = new FormData()
      formData.append('avatar', file)
      
      const result = await api.uploadAvatar(formData)
      
      if (result.code === 200) {
        ElMessage.success('头像上传成功')
        // 更新用户Store中的头像
        if (result.data && result.data.avatar) {
          // 直接更新本地状态
          if (user.value) {
            user.value.avatar = result.data.avatar
            // 同时更新localStorage
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
            userInfo.avatar = result.data.avatar
            localStorage.setItem('userInfo', JSON.stringify(userInfo))
          }
        } else {
          // 如果后端没有返回新的头像URL，重新获取用户信息
          await userStore.initUser()
        }
      } else {
        ElMessage.error(result.message || '头像上传失败')
      }
    } catch (error) {
    console.error('上传头像出错:', error)
    ElMessage.error('上传头像出错，请稍后重试')
  }
}

// 编辑资料
const openEditDialog = () => {
  showEditDialog.value = true
}

const fillFormWithUserData = () => {
  if (user.value) {
    editForm.nickname = user.value.nickname || ''
    editForm.bio = user.value.bio || ''
    editForm.wcaId = user.value.wcaId || ''
  }
}

const cancelEdit = () => {
  showEditDialog.value = false
}

const handleEditSubmit = async () => {
  if (!editFormRef.value) return
  
  await editFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 使用 store action 更新资料
        const success = await userStore.updateProfile(editForm)
        
        if (success) {
          ElMessage.success('资料更新成功')
          showEditDialog.value = false
        } else {
          ElMessage.error('更新失败')
        }
      } catch (error) {
        console.error('更新资料出错:', error)
        ElMessage.error(error.message || '更新资料出错，请稍后重试')
      }
    }
  })
}

// 监听用户ID变化，加载数据
watch(() => user.value?.id || user.value?._id, (newId) => {
  if (newId) {
    fetchUserRecords(newId)
    fetchUserHistoryRecords(newId)
  }
}, { immediate: true })

onMounted(() => {
  const currentUserId = user.value?.id || user.value?._id
  if (currentUserId) {
    fetchUserRecords(currentUserId)
    fetchUserHistoryRecords(currentUserId)
  }
})
</script>

<style scoped>
.view-container {
  min-height: 100vh;
  padding: var(--space-xl);
  position: relative;
  overflow-x: hidden;
  max-width: 1400px;
  margin: 0 auto;
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

/* 个人信息头部 */
.profile-header {
  margin-bottom: 24px;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 40px;
}

.avatar-wrapper {
  position: relative;
  cursor: pointer;
}

.avatar {
  border: 4px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.avatar-wrapper:hover .avatar {
  transform: scale(1.05) rotate(5deg);
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  opacity: 0;
  transition: opacity 0.3s;
  font-size: 32px;
  pointer-events: none; /* 让点击事件穿透到wrapper */
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.avatar-text {
  font-size: 48px;
  font-weight: bold;
  color: var(--primary-color);
}

.user-info {
  flex: 1;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.nickname {
  font-size: 36px;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, #2c3e50 0%, #4facfe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.edit-btn {
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: #666;
  transition: all 0.3s;
}

.edit-btn:hover {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
  transform: scale(1.1);
}

.bio {
  font-size: 16px;
  color: #666;
  margin: 0 0 20px;
  line-height: 1.6;
  max-width: 600px;
}

.wca-tag {
  font-size: 14px;
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* Tabs 样式 */
.tabs-container {
  position: relative;
  z-index: 1;
}

.glass-tabs :deep(.el-tabs__header) {
  margin-bottom: 24px;
}

.glass-tabs :deep(.el-tabs__nav-wrap::after) {
  background-color: transparent;
}

.glass-tabs :deep(.el-tabs__item) {
  font-size: 16px;
  font-weight: 600;
  color: #666;
  padding: 0 24px;
  transition: all 0.3s ease;
}

.glass-tabs :deep(.el-tabs__item.is-active) {
  color: var(--primary-color);
  font-size: 18px;
}

.glass-tabs :deep(.el-tabs__active-bar) {
  height: 4px;
  border-radius: 2px;
  background: var(--primary-gradient);
  box-shadow: 0 2px 8px rgba(66, 211, 146, 0.4);
}

/* 标签页内容 */
.tab-content {
  min-height: 400px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
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

.filter-controls {
  display: flex;
  gap: 16px;
}

/* Glass Inputs */
:deep(.glass-select .el-input__wrapper),
:deep(.glass-input .el-input__wrapper),
:deep(.glass-input .el-textarea__inner) {
  background: rgba(255, 255, 255, 0.5) !important;
  box-shadow: none !important;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  padding: 4px 12px;
  transition: all 0.3s;
}

:deep(.glass-input .el-textarea__inner) {
  padding: 12px;
}

:deep(.glass-select .el-input__wrapper:hover),
:deep(.glass-input .el-input__wrapper:hover),
:deep(.glass-input .el-textarea__inner:hover),
:deep(.glass-select .el-input__wrapper.is-focus),
:deep(.glass-input .el-input__wrapper.is-focus),
:deep(.glass-input .el-textarea__inner:focus) {
  background: rgba(255, 255, 255, 0.8) !important;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 1px var(--primary-color-light) !important;
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

.event-cell {
  display: flex;
  align-items: center;
}

.event-name {
  font-weight: 600;
  color: #2c3e50;
}

.record-value {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
  color: #2c3e50;
}

.rank-tag {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 800;
  border: none;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5253 100%);
  box-shadow: 0 2px 8px rgba(238, 82, 83, 0.4);
}

.empty-value {
  color: #ccc;
}

.record-cell {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 4px 0;
  transition: all 0.2s;
}

.record-cell:hover .detail-btn {
  opacity: 1;
  transform: translateX(0);
}

.detail-btn {
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--primary-color);
}

/* 统计概览 */
.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stats-card {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.6);
  transition: transform 0.3s;
}

.stats-card:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.8);
}

.stats-card.highlight {
  background: linear-gradient(135deg, rgba(66, 211, 146, 0.1) 0%, rgba(47, 144, 185, 0.1) 100%);
  border-color: rgba(66, 211, 146, 0.2);
}

.stat-value {
  font-size: 36px;
  font-weight: 800;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 8px;
  font-family: 'JetBrains Mono', monospace;
}

.stat-label {
  font-size: 14px;
  color: #666;
  font-weight: 600;
}

.empty-stats {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 16px;
}

/* 排名分布 */
.medal-section {
  margin-top: 24px;
}

.subsection-title {
  font-size: 16px;
  color: #666;
  margin-bottom: 16px;
  font-weight: 600;
}

.rank-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.rank-card {
  background: white;
  padding: 16px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.rank-event {
  font-weight: 700;
  color: #2c3e50;
  font-size: 16px;
}

.rank-badges {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rank-badge {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.rank-1 { background: rgba(255, 107, 107, 0.1); color: #ff6b6b; }
.rank-2 { background: rgba(255, 159, 67, 0.1); color: #ff9f43; }
.rank-3 { background: rgba(10, 189, 227, 0.1); color: #0abde3; }

.badge-val {
  font-family: 'JetBrains Mono', monospace;
}

/* 分页 */
.pagination-container {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

:deep(.glass-pagination .el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
  background-color: var(--primary-color);
}

:deep(.glass-pagination .el-pagination.is-background .el-pager li) {
  background-color: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

/* 记录详情 */
.record-details {
  padding: 10px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row.highlight {
  background: rgba(66, 211, 146, 0.05);
  padding: 12px;
  border-radius: 8px;
  margin: 4px 0;
  border-bottom: none;
}

.detail-group {
  margin: 8px 0;
}

.label {
  color: #666;
  font-weight: 500;
}

.value {
  font-weight: 600;
  color: #2c3e50;
}

.value.time {
  font-family: 'JetBrains Mono', monospace;
  font-size: 16px;
  color: var(--primary-color);
}

.value.rank {
  color: #ff6b6b;
}

/* 响应式 */
@media (max-width: 768px) {
  .view-container {
    padding: 16px;
  }
  
  .bento-card {
    padding: 20px;
    border-radius: 16px;
  }
  
  .user-profile {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }
  
  .avatar {
    width: 100px !important;
    height: 100px !important;
  }
  
  .avatar-text {
    font-size: 36px;
  }
  
  .info-header {
    justify-content: center;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .filter-controls {
    width: 100%;
    flex-direction: column;
  }
  
  .glass-select {
    width: 100% !important;
  }
  
  .stats-overview {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
