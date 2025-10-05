<template>
  <div class="profile-container">
    <ElementTransition name="zoom" :duration="600" appear>
      <div class="card profile-header glass-card">
        <div class="user-profile">
          <div class="avatar-container" @click="triggerFileUpload">
            <el-avatar
              :size="128"
              :src="user?.avatar || '/default-avatar.svg'"
              class="avatar"
            />
            <div class="avatar-overlay">
              <span>更换头像</span>
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
            <h1 class="nickname">{{ user?.nickname }}</h1>
            <p class="bio">{{ user?.bio || '这个人很懒，什么都没写~' }}</p>
            <p v-if="user?.wcaId" class="wca-id">WCA ID: {{ user.wcaId }}</p>
            <div class="action-buttons">
              <el-button type="primary" @click="openEditDialog">
                编辑资料
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </ElementTransition>

    <ElementTransition name="slide-up" :duration="600" :delay="200" appear>
      <el-tabs v-model="activeTab" class="profile-tabs glass-tabs">
        <el-tab-pane label="个人最佳" name="personal-bests">
          <div class="card glass-card">
            <div class="section-header">
              <div></div>
              <el-select v-model="selectedCategory" placeholder="项目类型" size="small" style="width: 120px;" class="glass-select">
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
            >
              <el-table-column label="项目" prop="eventName" min-width="120" />
              <el-table-column label="单次" min-width="120">
                <template #default="scope">
                  <div class="record-value" v-if="!isNaN(scope.row.singleSeconds)">
                    {{ formatTime(scope.row.singleSeconds) }}
                    <el-tag v-if="scope.row.singleRank === 1" size="small" type="danger" effect="dark" class="gr-tag">
                      GR
                    </el-tag>
                  </div>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column label="平均" min-width="120">
                <template #default="scope">
                  <div class="record-value" v-if="!isNaN(scope.row.averageSeconds)">
                    {{ formatTime(scope.row.averageSeconds) }}
                    <el-tag v-if="scope.row.averageRank === 1" size="small" type="danger" effect="dark" class="gr-tag">
                      GR
                    </el-tag>
                  </div>
                  <span v-else>-</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="历史成绩" name="history">
          <div class="card glass-card">
            <div class="section-header">
              <h2 class="section-title">历史成绩</h2>
              <div class="filter-controls">
                <el-select v-model="selectedEvent" placeholder="选择项目" size="small" class="glass-select">
                  <el-option label="全部项目" value="all" />
                  <el-option
                    v-for="event in userEvents"
                    :key="event"
                    :label="getEventName(event)"
                    :value="event"
                  />
                </el-select>
                <el-select v-model="sortOrder" placeholder="排序方式" size="small" class="glass-select">
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
            >
              <el-table-column label="项目" prop="eventName" min-width="100" />
              <el-table-column label="单次" min-width="100">
                <template #default="scope">
                  <span>{{ formatTime(scope.row.singleSeconds) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="平均" min-width="100">
                <template #default="scope">
                  <span>{{ formatTime(scope.row.averageSeconds) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="提交时间" min-width="160">
                <template #default="scope">
                  <div class="record-cell" @click="showRecordDetails(scope.row)">
                  <span>{{ formatDate(scope.row.timestamp) }}</span>
                    <span class="detail-text">
                    详情
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
              />
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="统计分析" name="statistics">
          <div class="card glass-card">
            <h2 class="section-title"></h2>
            
            <div class="stats-container">
              <template v-if="totalRecords > 0">
                <div class="stats-message">
                  <template v-if="firstPlaceCount > 0">
                    你一共在 <span class="highlight-number">{{ firstPlaceCount }}</span> 个项目中取得了第一名
                  </template>
                  
                  <template v-if="topThreeCount > 0">
                    <template v-if="firstPlaceCount > 0">，</template>
                    <template v-else>你</template>
                    在 <span class="highlight-number">{{ topThreeCount }}</span> 个项目中取得了前三名
                  </template>
                  
                  <template v-if="firstPlaceCount > 0 || topThreeCount > 0">，</template>
                  <template v-else>你</template>
                  总共参与了 <span class="highlight-number">{{ activeEvents }}</span> 个项目，
                  上传了 <span class="highlight-number">{{ totalRecords }}</span> 个成绩数
                </div>
              </template>
              <template v-else>
                <div class="stats-message">
                  你还未参与任何项目哦
                </div>
              </template>
                </div>
            
            <div class="medal-container" v-if="sortedTopThreeRecords.length > 0">
              <h3 class="chart-title">排名分布</h3>
              <div class="rank-list">
                <div v-for="(item, index) in sortedTopThreeRecords" :key="index" class="rank-item">
                  <span class="event-name">{{ getEventName(item.eventCode) }}</span>
                  <div class="rank-badges">
                    <el-tag v-if="item.singleRank === 1" type="danger" effect="dark" size="small" round>
                      单次 #1
                    </el-tag>
                    <el-tag v-else-if="item.singleRank === 2" type="warning" effect="dark" size="small" round>
                      单次 #2
                    </el-tag>
                    <el-tag v-else-if="item.singleRank === 3" type="success" effect="dark" size="small" round>
                      单次 #3
                    </el-tag>
                    
                    <el-tag v-if="item.averageRank === 1" type="danger" effect="dark" size="small" round>
                      平均 #1
                    </el-tag>
                    <el-tag v-else-if="item.averageRank === 2" type="warning" effect="dark" size="small" round>
                      平均 #2
                    </el-tag>
                    <el-tag v-else-if="item.averageRank === 3" type="success" effect="dark" size="small" round>
                      平均 #3
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 项目分布部分暂时隐藏，但保留代码 -->
            <div class="chart-container" v-if="false && activeEvents > 0">
              <h3 class="chart-title">项目分布</h3>
              <div class="event-distribution">
                <div 
                  v-for="(count, event) in eventDistribution" 
                  :key="event"
                  class="event-bar"
                >
                  <div class="event-name">{{ getEventName(event) }}</div>
                  <div class="bar-container">
                    <div class="bar" :style="{ width: `${(count / maxEventCount) * 100}%` }"></div>
                    <span class="bar-value">{{ count }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
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
        >
          <el-form-item label="昵称" prop="nickname">
            <el-input v-model="editForm.nickname" placeholder="请输入昵称" />
          </el-form-item>
          <el-form-item label="签名" prop="bio">
            <el-input
              v-model="editForm.bio"
              type="textarea"
              :rows="3"
              placeholder="请输入个人签名"
            />
          </el-form-item>
          <el-form-item label="WCA ID" prop="wcaId">
            <el-input v-model="editForm.wcaId" placeholder="如有请填写" />
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
    >
      <div v-if="selectedRecord" class="record-details">
        <div class="detail-item">
          <span class="detail-label">项目:</span>
          <span class="detail-value">{{ getEventName(selectedRecord.event) }}</span>
        </div>
        
        <template v-if="!isNaN(selectedRecord.singleSeconds)">
          <div class="detail-item">
            <span class="detail-label">单次成绩:</span>
            <span class="detail-value">{{ formatTime(selectedRecord.singleSeconds) }}</span>
          </div>
          
          <div class="detail-item" v-if="selectedRecord.singleRank">
            <span class="detail-label">单次排名:</span>
            <span class="detail-value">#{{ selectedRecord.singleRank }}</span>
          </div>
        </template>
        
        <template v-if="!isNaN(selectedRecord.averageSeconds)">
          <div class="detail-item">
            <span class="detail-label">平均成绩:</span>
            <span class="detail-value">{{ formatTime(selectedRecord.averageSeconds) }}</span>
          </div>
          
          <div class="detail-item" v-if="selectedRecord.averageRank">
            <span class="detail-label">平均排名:</span>
            <span class="detail-value">#{{ selectedRecord.averageRank }}</span>
          </div>
        </template>
        
        <!-- 魔方信息 -->
        <div class="detail-item" v-if="isValidField(selectedRecord.cube)">
          <span class="detail-label">使用魔方:</span>
          <span class="detail-value">{{ selectedRecord.cube }}</span>
        </div>
        
        <!-- 方法信息 -->
        <div class="detail-item" v-if="isValidField(selectedRecord.method)">
          <span class="detail-label">解法:</span>
          <span class="detail-value">{{ selectedRecord.method }}</span>
        </div>
        
        <!-- 感想 -->
        <div class="detail-item" v-if="isValidField(selectedRecord.remark)">
          <span class="detail-label">感想:</span>
          <span class="detail-value">{{ selectedRecord.remark }}</span>
        </div>
        
        <!-- 视频链接 -->
        <div class="detail-item" v-if="isValidField(selectedRecord.videoLink)">
          <span class="detail-label">视频链接:</span>
          <a :href="selectedRecord.videoLink" target="_blank" class="video-link">
            {{ selectedRecord.videoLink }}
          </a>
        </div>
        
        <div class="detail-item">
          <span class="detail-label">提交时间:</span>
          <span class="detail-value">{{ formatDate(selectedRecord.timestamp, true) }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { useUserStore } from '@/stores/user'
import { useRecordsStore } from '@/stores/records'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import ElementTransition from '@/components/ElementTransition.vue'
import { categories, events, getEventName, getEventType, getAllEvents } from '@/config/events'
import api from '@/api'

const router = useRouter()

const userStore = useUserStore()
const recordsStore = useRecordsStore()
const { user } = userStore
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
const pageSize = ref(10)
const recordDetailVisible = ref(false)
const selectedRecord = ref(null)

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

// 格式化时间
const formatTime = (time) => {
  if (!time || isNaN(time)) return '-'
  if (time < 60) {
    return time.toFixed(2)
  }
  const minutes = Math.floor(time / 60)
  const seconds = (time % 60).toFixed(2).padStart(5, '0')
  return `${minutes}:${seconds}`
}

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
  console.log('Record details:', JSON.stringify(record, null, 2))
  
  // 处理记录对象，但保留null或undefined值
  const processedRecord = {
    ...record,
    // 尝试从不同位置获取字段，但不设置默认值
    cube: record.cube || record.single?.cube || record.average?.cube,
    method: record.method || record.single?.method || record.average?.method,
    remark: record.remark,
    videoLink: record.videoLink
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
    console.log('获取个人最佳记录 - 原始用户ID:', currentUserId)
    
    // 确保ID格式正确
    if (!userId && typeof user.value === 'object' && user.value !== null) {
      if (user.value._id) currentUserId = user.value._id
      else if (user.value.id) currentUserId = user.value.id
    }
    
    console.log('获取个人最佳记录 - 最终使用的用户ID:', currentUserId)
    console.log('获取个人最佳记录 - 用户对象:', user.value ? JSON.stringify(user.value) : '未登录')
    
    if (!currentUserId) {
      console.error('无法获取用户ID，用户可能未登录或数据未加载完成')
      return
    }

    console.log('开始请求个人最佳记录API, userId:', currentUserId)
    const result = await api.getUsersBestRecord(currentUserId)
    console.log('个人最佳记录API响应数据:', JSON.stringify(result))
    // 详细调试API返回结构
    debugApiResponse(result, '个人最佳记录')
    
    if (result.code === 200 && result.data) {
      const map = {}
      ;(result.data || []).forEach(it => {
        map[it.event] = {
          singleSeconds: typeof it.bestSingleSeconds === 'number' ? it.bestSingleSeconds : null,
          averageSeconds: typeof it.bestAverageSeconds === 'number' ? it.bestAverageSeconds : null
        }
      })
      personalBests.value = map
      console.log('个人最佳记录数据已加载, 条目数:', Object.keys(map).length)
      
      if (Object.keys(map).length > 0) {
        const firstEvent = Object.keys(map)[0]
        console.log('第一个项目的数据结构:', JSON.stringify(map[firstEvent]))
      }
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
    console.log('获取历史记录 - 原始用户ID:', currentUserId)
    
    // 确保ID格式正确
    if (!userId && typeof user.value === 'object' && user.value !== null) {
      if (user.value._id) currentUserId = user.value._id
      else if (user.value.id) currentUserId = user.value.id
    }
    
    console.log('获取历史记录 - 最终使用的用户ID:', currentUserId)
    console.log('获取历史记录 - 用户对象:', user.value ? JSON.stringify(user.value) : '未登录')
    
    if (!currentUserId) {
      console.error('无法获取用户ID，用户可能未登录或数据未加载完成')
      historyLoading.value = false
      return
    }

    console.log('开始请求历史记录API, userId:', currentUserId)
    const result = await api.getUsersHistoryRecord(currentUserId)
    console.log('历史记录API响应数据:', JSON.stringify(result))
    debugApiResponse(result, '历史记录')
    
    if (result.code === 200 && result.data) {
      const rows = (result.data || []).map(r => ({
        ...r,
        singleSeconds: typeof r.singleSeconds === 'number' ? r.singleSeconds : (r.single && typeof r.single.time === 'number' ? r.single.time : null),
        averageSeconds: typeof r.averageSeconds === 'number' ? r.averageSeconds : (r.average && typeof r.average.time === 'number' ? r.average.time : null)
      }))
      historyRecords.value = rows
      console.log('历史记录数据已加载, 条目数:', rows.length)
      
      if (rows.length > 0) {
        console.log('第一条历史记录的数据结构:', JSON.stringify(rows[0]))
      }
      
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
    console.log('检查排行榜数据是否已加载, 当前记录数:', recordsStore.records.length)
    if (recordsStore.records.length === 0) {
      console.log('排行榜数据未加载，开始获取...')
      await recordsStore.fetchRecords()
      console.log('排行榜数据加载完成, 记录数:', recordsStore.records.length)
    }
    
    // 计算排名
    console.log('开始计算排名...')
    calculateRankings(hardcodedId)
    
    // 强制重新计算统计数据
    console.log('手动计算统计数据...')
    topThreeCount.value = calculateTopThreeCount()
    firstPlaceCount.value = calculateFirstPlaceCount()
    
    // 检查计算结果
    console.log('排名计算完成，统计结果:', {
      topThreeCount: topThreeCount.value,
      firstPlaceCount: firstPlaceCount.value,
      topThreeRecordsCount: Object.keys(topThreeRecords.value).length,
      sortedTopThreeRecordsCount: sortedTopThreeRecords.value.length
    })
  } catch (error) {
    console.error('加载排行榜数据出错:', error)
    // 仍然计算统计数据，使用现有信息
    topThreeCount.value = calculateTopThreeCount()
    firstPlaceCount.value = calculateFirstPlaceCount()
  }
}

// 调试API返回的数据结构
const debugApiResponse = (data, source) => {
  try {
    console.log(`调试${source}API返回数据:`)
    if (!data) {
      console.log('数据为空')
      return
    }
    
    // 检查基本结构
    console.log('数据类型:', typeof data)
    if (typeof data === 'object') {
      console.log('是否为数组:', Array.isArray(data))
      console.log('顶层键:', Object.keys(data))
      
      // 如果是对象，检查一些常见字段
      if (!Array.isArray(data)) {
        if ('code' in data) console.log('code:', data.code)
        if ('message' in data) console.log('message:', data.message)
        if ('data' in data) {
          console.log('data字段类型:', typeof data.data)
          if (Array.isArray(data.data)) {
            console.log('data数组长度:', data.data.length)
            if (data.data.length > 0) {
              console.log('第一条数据示例:', JSON.stringify(data.data[0]).substring(0, 200) + '...')
            }
          } else if (typeof data.data === 'object' && data.data) {
            console.log('data对象键:', Object.keys(data.data))
          }
        }
      }
      // 如果是数组，检查长度和示例
      else {
        console.log('数组长度:', data.length)
        if (data.length > 0) {
          console.log('第一条数据示例:', JSON.stringify(data[0]).substring(0, 200) + '...')
        }
      }
    }
  } catch (error) {
    console.error('调试数据时出错:', error)
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
    
    console.log('开始计算排名, 用户ID:', userId)
    console.log('当前recordsStore中记录数:', recordsStore.records.length)
    
    // 先重置排名计数
    topThreeCount.value = 0
    firstPlaceCount.value = 0
    
    // 遍历个人最佳记录，计算排名
    for (const [eventCode, record] of Object.entries(personalBests.value)) {
      // 获取项目类型，如果是整活项目则跳过排名计算
      const eventType = getEventType(eventCode)
      if (eventType === 'meme') {
        console.log(`项目 ${eventCode} 是整活项目，跳过排名计算`)
        continue
      }
      
      // 获取该项目的所有记录
      const eventRecords = recordsStore.getRecordsByEvent(eventCode)
      console.log(`项目 ${eventCode} 的记录数:`, eventRecords.length)
      
      // 计算单次排名
      if (!isNaN(record.singleSeconds)) {
        // 创建用户单次最佳记录映射
        const userBestSingles = new Map()
        
        eventRecords.forEach(er => {
          if (!er.userId || er.singleSeconds == null) return
          if (!userBestSingles.has(er.userId) || er.singleSeconds < userBestSingles.get(er.userId).time) {
            userBestSingles.set(er.userId, {
              userId: er.userId,
              time: er.singleSeconds
            })
          }
        })
        
        // 转换为数组并排序
        const sortedSingles = Array.from(userBestSingles.values())
          .sort((a, b) => a.time - b.time)
        
        console.log(`项目 ${eventCode} 单次排序后的记录:`, sortedSingles.map(s => ({ userId: s.userId, time: s.time })))
        
        // 查找当前用户的排名
        const userRank = sortedSingles.findIndex(r => r.userId === userId) + 1
        if (userRank > 0) {
          record.singleRank = userRank
          console.log(`项目 ${eventCode} 单次排名:`, userRank)
          
          // 更新统计数据
          if (userRank === 1) {
            firstPlaceCount.value++
            console.log(`第一名计数增加，当前:`, firstPlaceCount.value)
          }
          if (userRank <= 3) {
            topThreeCount.value++
            console.log(`前三名计数增加，当前:`, topThreeCount.value)
          }
        } else {
          console.log(`项目 ${eventCode} 单次排名未找到，用户ID:`, userId)
          console.log('排序后的记录中的用户ID:', sortedSingles.map(s => s.userId))
        }
      }
      
      // 计算平均排名
      if (!isNaN(record.averageSeconds)) {
        // 创建用户平均最佳记录映射
        const userBestAverages = new Map()
        
        eventRecords.forEach(er => {
          if (!er.userId || er.averageSeconds == null) return
          if (!userBestAverages.has(er.userId) || er.averageSeconds < userBestAverages.get(er.userId).time) {
            userBestAverages.set(er.userId, {
              userId: er.userId,
              time: er.averageSeconds
            })
          }
        })
        
        // 转换为数组并排序
        const sortedAverages = Array.from(userBestAverages.values())
          .sort((a, b) => a.time - b.time)
        
        console.log(`项目 ${eventCode} 平均排序后的记录:`, sortedAverages.map(s => ({ userId: s.userId, time: s.time })))
        
        // 查找当前用户的排名
        const userRank = sortedAverages.findIndex(r => r.userId === userId) + 1
        if (userRank > 0) {
          record.averageRank = userRank
          console.log(`项目 ${eventCode} 平均排名:`, userRank)
          
          // 更新统计数据
          if (userRank === 1) {
            firstPlaceCount.value++
            console.log(`第一名计数增加，当前:`, firstPlaceCount.value)
          }
          if (userRank <= 3) {
            topThreeCount.value++
            console.log(`前三名计数增加，当前:`, topThreeCount.value)
          }
        } else {
          console.log(`项目 ${eventCode} 平均排名未找到，用户ID:`, userId)
          console.log('排序后的记录中的用户ID:', sortedAverages.map(s => s.userId))
        }
      }
    }
    
    console.log('排名计算完成, 前三名数量:', topThreeCount.value, '第一名数量:', firstPlaceCount.value)
    
    // 检查topThreeRecords是否有内容
    const topThreeRecordsCount = Object.keys(topThreeRecords.value).length
    console.log('topThreeRecords条目数:', topThreeRecordsCount)
    if (topThreeRecordsCount > 0) {
      console.log('topThreeRecords内容示例:', JSON.stringify(Object.entries(topThreeRecords.value)[0]))
    }
    
    // 检查sortedTopThreeRecords是否有内容
    console.log('sortedTopThreeRecords条目数:', sortedTopThreeRecords.value.length)
    if (sortedTopThreeRecords.value.length > 0) {
      console.log('sortedTopThreeRecords内容示例:', JSON.stringify(sortedTopThreeRecords.value[0]))
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
  console.log('计算排名前三的数量')
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
      console.log(`项目 ${eventCode} 有前三名排名:`, 
        hasSingleRank ? `单次 #${record.singleRank}` : '', 
        hasAverageRank ? `平均 #${record.averageRank}` : '')
    }
  }
  
  console.log(`共检查了 ${eventCounts} 个项目，有 ${count} 个项目排名前三`)
  return count
}

// 计算第一名的数量
const calculateFirstPlaceCount = () => {
  console.log('计算第一名的数量')
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
      console.log(`项目 ${eventCode} 有第一名排名:`, 
        hasSingleRank1 ? '单次 #1' : '', 
        hasAverageRank1 ? '平均 #1' : '')
    }
  }
  
  console.log(`共检查了 ${eventCounts} 个项目，有 ${count} 个项目排名第一`)
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
  console.log('计算topThreeRecords，personalBests条目数:', Object.keys(personalBests.value).length)
  
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
  
  console.log('topThreeRecords结果条目数:', Object.keys(result).length)
  return result
})

// 按排名排序的前三名记录
const sortedTopThreeRecords = computed(() => {
  console.log('计算sortedTopThreeRecords，topThreeRecords条目数:', Object.keys(topThreeRecords.value).length)
  
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
  console.log('sortedTopThreeRecords结果条目数:', sortedRecords.length)
  
  if (sortedRecords.length > 0) {
    console.log('排序后第一条记录:', JSON.stringify({
      eventCode: sortedRecords[0].eventCode,
      singleRank: sortedRecords[0].singleRank,
      averageRank: sortedRecords[0].averageRank,
      rankWeight: sortedRecords[0].rankWeight
    }))
  }
  
  return sortedRecords
})

// 获取第一名的记录
const firstPlaceRecords = computed(() => {
  const result = {}
  for (const [eventCode, record] of Object.entries(personalBests.value)) {
    // 排除整活项目
    const eventType = getEventType(eventCode)
    if (eventType === 'meme') {
      continue
    }
    
    if (record.singleRank === 1 || record.averageRank === 1) {
      result[eventCode] = record
    }
  }
  return result
})

// 编辑资料相关
const showEditDialog = ref(false)
const editFormRef = ref()
const editForm = reactive({
  nickname: '',
  bio: '',
  wcaId: ''
})

const editRules = {
  nickname: [
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  bio: [
    { max: 200, message: '签名不能超过200个字符', trigger: 'blur' }
  ],
  wcaId: [
    { max: 20, message: 'WCA ID 最多20字符', trigger: 'blur' }
  ]
}

const refreshUserInfo = async () => {
  console.log('刷新用户信息')
  
  // 重新获取用户信息
  await userStore.initUser()
  
  // 强制更新视图中的用户信息
  if (user.value) {
    // 直接更新页面上显示的信息
    nextTick(() => {
      try {
        // 更新昵称和签名
        const nicknameElement = document.querySelector('.nickname')
        const bioElement = document.querySelector('.bio')
        
        if (nicknameElement) {
          nicknameElement.textContent = user.value.nickname || ''
        }
        
        if (bioElement) {
          bioElement.textContent = user.value.bio || '这个人很懒，什么都没写~'
        }
        
        // 更新WCA ID显示
        let wcaIdElement = document.querySelector('.wca-id')
        
        if (user.value.wcaId) {
          // 如果有WCA ID
          if (wcaIdElement) {
            // 如果元素已存在，更新内容
            wcaIdElement.textContent = `WCA ID: ${user.value.wcaId}`
            wcaIdElement.style.display = 'block'
          } else {
            // 如果元素不存在，创建一个新元素
            wcaIdElement = document.createElement('p')
            wcaIdElement.className = 'wca-id'
            wcaIdElement.textContent = `WCA ID: ${user.value.wcaId}`
            
            // 插入到签名后面
            if (bioElement && bioElement.parentNode) {
              bioElement.parentNode.insertBefore(wcaIdElement, bioElement.nextSibling)
            }
          }
        } else if (wcaIdElement) {
          // 如果没有WCA ID但元素存在，隐藏它
          wcaIdElement.style.display = 'none'
        }
        
        console.log('页面更新完成')
      } catch (error) {
        console.error('更新页面时出错:', error)
      }
    })
  }
}

// 取消编辑
const cancelEdit = () => {
  console.log('取消编辑')
  showEditDialog.value = false
}

const handleEditSubmit = async () => {
  if (!editFormRef.value) return
  
  await editFormRef.value.validate(async (valid) => {
    if (valid) {
      // 显示加载状态
      const loadingInstance = ElMessage({
        message: '正在更新资料...',
        type: 'info',
        duration: 0
      })
      
      try {
        // 检查用户是否已登录
        if (!userStore.user) {
          loadingInstance.close()
          ElMessage.error('请先登录')
          router.push('/login')
          return
        }

        // 检查token是否存在
        const token = localStorage.getItem('token')
        if (!token) {
          loadingInstance.close()
          ElMessage.error('登录状态已过期，请重新登录')
          router.push('/login')
          return
        }

        // 打印将要提交的数据
        console.log('提交数据:', JSON.stringify(editForm))
        console.log('当前用户状态:', JSON.stringify(userStore.user))
        console.log('当前token:', token)

        // 调用store的更新方法
        const result = await userStore.updateProfile(editForm)
        console.log('更新结果:', result)
        
        // 关闭加载提示
        loadingInstance.close()
        
        // 关闭对话框
        showEditDialog.value = false
        
        // 显示成功消息
        ElMessage.success('个人资料更新成功')
        
        // 刷新用户信息并立即更新页面
        await refreshUserInfo()
      } catch (error) {
        loadingInstance.close()
        console.error('资料更新失败:', error)
        
        // 处理不同类型的错误
        if (error.message && error.message.includes('登录')) {
          ElMessage.error('登录状态已过期，请重新登录')
          // 清除可能已损坏的登录状态
          localStorage.removeItem('token')
          userStore.clearToken()
          router.push('/login')
        } else {
          ElMessage.error(error.message || '更新失败，请重试')
        }
      }
    }
  })
}

// 监听用户数据变化
watch(() => userStore.user, (newUser, oldUser) => {
  console.log('用户数据发生变化:', 
    newUser ? `ID: ${newUser._id || newUser.id}` : '无用户数据', 
    oldUser ? `旧ID: ${oldUser._id || oldUser.id}` : '之前无用户数据')
  
  if (newUser && showEditDialog.value) {
    // 如果对话框打开且用户数据更新，重新设置表单数据
    editForm.nickname = newUser.nickname || ''
    editForm.bio = newUser.bio || ''
    editForm.wcaId = newUser.wcaId || ''
    console.log('用户数据更新，重新设置表单数据:', editForm)
  }
  
  // 如果新获取到用户信息，且之前没有用户信息或用户ID发生变化，则获取成绩记录
  if (newUser && (!oldUser || (newUser._id || newUser.id) !== (oldUser._id || oldUser.id))) {
    console.log('用户信息已更新，重新获取成绩记录')
    
    // 确保ID字段存在
    if (!newUser._id && newUser.id) {
      newUser._id = newUser.id
      console.log('添加_id字段:', newUser._id)
    }
    
    if (!newUser.id && newUser._id) {
      newUser.id = newUser._id
      console.log('添加id字段:', newUser.id)
    }
    
    const userId = newUser._id || newUser.id
    if (userId) {
      console.log('监听到用户ID变化，开始获取成绩记录:', userId)
      fetchUserRecords(userId)
      fetchUserHistoryRecords(userId)
    } else {
      console.error('监听到用户变化，但没有有效的ID字段')
    }
  }
}, { deep: true })

// 测试API是否可用
const testApi = async () => {
  try {
    console.log('开始测试API连接...')
    
    // 测试用户API
    console.log('测试用户API')
    try {
      const userResponse = await api.getUser('test-user-id')
      console.log('用户API响应:', userResponse)
    } catch (error) {
      console.log('用户API错误:', error)
    }
    
    // 测试个人最佳记录API
    console.log('测试个人最佳记录API')
    try {
      const bestRecordResponse = await api.getUsersBestRecord('test-user-id')
      console.log('个人最佳记录API响应:', bestRecordResponse)
    } catch (error) {
      console.log('个人最佳记录API错误:', error)
    }
    
    // 测试历史记录API
    console.log('测试历史记录API')
    try {
      const historyResponse = await api.getUsersHistoryRecord('test-user-id')
      console.log('历史记录API响应:', historyResponse)
    } catch (error) {
      console.log('历史记录API错误:', error)
    }
    
    console.log('API测试完成')
  } catch (error) {
    console.error('API测试失败:', error)
  }
}

// 使用硬编码ID测试API
const testApiWithHardcodedId = async () => {
  try {
    const currentUserId = user.value?._id || user.value?.id
    console.log('使用当前用户ID测试API:', currentUserId)
    
    if (!currentUserId) {
      console.error('无法获取用户ID，用户可能未登录')
      return
    }
    
    // 测试个人最佳记录API
    console.log('测试个人最佳记录API')
    try {
      const bestRecordResult = await api.getUsersBestRecord(currentUserId)
      console.log('硬编码ID测试 - 个人最佳记录响应:', JSON.stringify(bestRecordResult))
      debugApiResponse(bestRecordResult, '硬编码ID测试 - 个人最佳记录')
      
      // 直接使用测试结果更新数据
      if (bestRecordResult.code === 0 && bestRecordResult.data) {
        personalBests.value = bestRecordResult.data
        console.log('已直接使用测试数据更新个人最佳记录')
      }
    } catch (error) {
      console.error('个人最佳记录API错误:', error)
    }
    
    // 测试历史记录API
    console.log('测试历史记录API')
    try {
      const historyResult = await api.getUsersHistoryRecord(currentUserId)
      console.log('历史记录API响应:', historyResult)
    } catch (error) {
      console.error('历史记录API错误:', error)
    }
    
    console.log('硬编码ID API测试完成')
  } catch (error) {
    console.error('API测试失败:', error)
  }
}

// 初始化函数，确保正确加载所有数据
const initializeData = async () => {
  console.log('开始初始化数据...')
  
  try {
    // 从控制台输出可以看到，用户对象结构为 {_id: '68359567c0efb590c7e1092f', ...}
    // 尝试多种方式获取用户ID
    let currentUserId = null
    
    // 检查用户对象
    if (user.value) {
      console.log('用户对象存在，尝试获取ID')
      console.log('用户对象结构:', JSON.stringify(user.value))
      
      // 尝试从各种可能的位置获取ID
      if (user.value._id) {
        currentUserId = user.value._id
        console.log('从user.value._id获取ID:', currentUserId)
      } else if (user.value.id) {
        currentUserId = user.value.id
        console.log('从user.value.id获取ID:', currentUserId)
      } else if (typeof user.value === 'string') {
        // 如果用户对象本身就是ID字符串
        currentUserId = user.value
        console.log('用户对象本身是ID字符串:', currentUserId)
      }
    }
    
    // 如果没有用户ID，尝试等待用户信息加载
    if (!currentUserId) {
      console.log('用户ID未找到，尝试等待用户信息加载...')
      
      // 尝试从localStorage获取token和用户信息
      const token = localStorage.getItem('token')
      const cachedUserInfo = localStorage.getItem('userInfo')
      
      if (cachedUserInfo) {
        try {
          console.log('从localStorage获取缓存的用户信息')
          const userInfo = JSON.parse(cachedUserInfo)
          if (userInfo && (userInfo._id || userInfo.id)) {
            currentUserId = userInfo._id || userInfo.id
            console.log('从缓存用户信息获取ID:', currentUserId)
          }
        } catch (e) {
          console.error('解析缓存用户信息失败:', e)
        }
      }
      
      if (!currentUserId && token) {
        console.log('发现token，尝试初始化用户信息')
        try {
          // 尝试初始化用户
          await userStore.initUser()
          
          // 重新获取用户信息
          if (user.value) {
            if (user.value._id) {
              currentUserId = user.value._id
            } else if (user.value.id) {
              currentUserId = user.value.id
            }
            console.log('用户初始化后的ID:', currentUserId)
          }
        } catch (e) {
          console.error('初始化用户失败:', e)
        }
      }
    }
    
    // 从控制台输出看到的固定ID
    if (!currentUserId) {
      console.log('尝试使用控制台显示的ID')
      currentUserId = '68359567c0efb590c7e1092f'
      console.log('使用固定ID:', currentUserId)
    }
    
    // 如果仍然没有用户ID，显示提示并返回
    if (!currentUserId) {
      console.error('无法获取用户ID，用户可能未登录')
      ElMessage.warning('请先登录后查看个人资料')
      router.push('/') // 可选：重定向到首页
      return
    }
    
    console.log('使用当前用户ID获取成绩记录:', currentUserId)
    
    // 使用统一 API 并映射到 seconds 结构
    await fetchUserRecords(currentUserId)
    await fetchUserHistoryRecords(currentUserId)
    await ensureRecordsLoaded(currentUserId)
    
    console.log('初始化完成，检查排名结果:', {
      personalBestsCount: Object.keys(personalBests.value).length,
      historyRecordsCount: historyRecords.value.length,
      topThreeCount: topThreeCount.value,
      firstPlaceCount: firstPlaceCount.value,
      topThreeRecordsCount: Object.keys(topThreeRecords.value).length,
      sortedTopThreeRecordsCount: sortedTopThreeRecords.value.length
    })
  } catch (error) {
    console.error('初始化数据失败:', error)
  }
}

// 在组件挂载时检查并显示消息
onMounted(async () => {
  console.log('ProfileView 组件挂载开始')
  
  // 检查用户登录状态
  const currentUserId = user.value?._id || user.value?.id
  console.log('组件挂载时的用户ID:', currentUserId || '未登录')
  
  // 初始化数据
  await initializeData()
  
  // 显示消息
  const message = localStorage.getItem('profile_message')
  if (message === 'edit_success') {
    ElMessage.success('资料更新成功')
  }
  // 清除消息标记
  localStorage.removeItem('profile_message')
  
  console.log('ProfileView 组件挂载完成')
})

// 在用户点击"编辑资料"按钮时预先填充表单
const openEditDialog = () => {
  // 先填充数据，再打开对话框
  if (user.value) {
    editForm.nickname = user.value.nickname || ''
    editForm.bio = user.value.bio || ''
    editForm.wcaId = user.value.wcaId || ''
    console.log('预填充表单数据:', editForm)
  }
  showEditDialog.value = true
}

// 头像上传相关
const fileInput = ref(null)
const uploading = ref(false)

// 触发文件选择
const triggerFileUpload = () => {
  fileInput.value.click()
}

// 处理头像选择并上传
const handleAvatarChange = async (event) => {
  const file = event.target.files[0]
  if (!file) {
    ElMessage.error('未选择文件')
    return
  }
  
  console.log('选择的文件:', file.name, '类型:', file.type, '大小:', (file.size / 1024).toFixed(2), 'KB')
  
  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }
  
  // 验证文件大小（限制为2MB）
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过2MB')
    return
  }
  
  uploading.value = true
  ElMessage.info('正在上传头像...')
  
  try {
    // 使用FileReader读取文件为base64
    const reader = new FileReader()
    
    // 设置读取完成的回调
    reader.onload = async (e) => {
      try {
        const base64Data = e.target.result
        console.log('文件已转换为base64，长度:', base64Data.length)
        
        // 提取base64数据部分 (移除前缀 "data:image/png;base64,")
        const base64Content = base64Data.split(',')[1]
        
        // 准备请求数据
        const requestData = {
          userId: userStore.user?._id,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileData: base64Content
        }
        
        console.log('发送数据:', {
          userId: requestData.userId,
          fileName: requestData.fileName,
          fileType: requestData.fileType,
          fileSize: requestData.fileSize,
          fileDataLength: requestData.fileData.length
        })
        
        // 获取授权token
        const token = localStorage.getItem('token')
        console.log('有token:', !!token)
        
        // API URL
        // 使用统一API上传头像
        console.log('开始发送上传请求...')
        const result = await api.uploadAvatar(requestData)
        console.log('解析响应:', result)
        
        if (result.code === 200 && result.data?.avatarUrl) {
          // 更新用户头像
          if (user.value) {
            console.log('更新头像URL:', result.data.avatarUrl)
            user.value.avatar = result.data.avatarUrl
            // 更新localStorage中的用户信息
            localStorage.setItem('userInfo', JSON.stringify(user.value))
          }
          ElMessage.success('头像更新成功')
        } else {
          throw new Error(result.message || '上传失败')
        }
      } catch (error) {
        console.error('处理上传失败:', error)
        ElMessage.error(error.message || '上传头像失败，请重试')
        uploading.value = false
      }
    }
    
    // 读取错误处理
    reader.onerror = (error) => {
      console.error('文件读取失败:', error)
      ElMessage.error('文件读取失败')
      uploading.value = false
    }
    
    // 开始读取文件
    reader.readAsDataURL(file)
    
  } catch (error) {
    console.error('上传头像失败:', error)
    ElMessage.error(error.message || '上传头像失败，请重试')
    uploading.value = false
  } finally {
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

// 在组件挂载时填充表单数据
const fillFormWithUserData = () => {
  console.log('对话框已打开，填充表单数据')
  
  // 延迟一下，确保对话框完全打开
  setTimeout(() => {
    if (user.value) {
      // 直接设置表单值
      editForm.nickname = user.value.nickname || ''
      editForm.bio = user.value.bio || ''
      editForm.wcaId = user.value.wcaId || ''
      console.log('表单数据已填充:', editForm)
    } else {
      console.warn('用户数据不存在，无法填充表单')
      // 尝试重新获取用户数据
      userStore.initUser().then(() => {
        if (user.value) {
          editForm.nickname = user.value.nickname || ''
          editForm.bio = user.value.bio || ''
          editForm.wcaId = user.value.wcaId || ''
          console.log('重新获取用户数据后填充表单:', editForm)
        }
      })
    }
  }, 100)
}

// 项目分组
const eventGroups = computed(() => {
  return getAllEvents()
})
</script>

<style scoped>
.profile-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.profile-header {
  margin-bottom: 20px;
}

.user-profile {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

.avatar-container {
  position: relative;
  cursor: pointer;
  border-radius: 50%;
  overflow: hidden;
}

.avatar {
  display: block;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.3s;
  color: #fff;
}

.avatar-container:hover .avatar-overlay {
  opacity: 1;
}

.user-info {
  flex: 1;
}

.nickname {
  font-size: 24px;
  font-weight: bold;
  margin: 0 0 8px;
  color: var(--el-text-color-primary);
}

.bio {
  margin: 0 0 16px;
  color: var(--el-text-color-secondary);
}

.wca-id {
  margin: 0 0 16px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.loading-text {
  text-align: center;
  padding: 20px;
  color: var(--el-text-color-secondary);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.profile-tabs {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  margin: 0;
  color: var(--el-text-color-primary);
}

.filter-controls {
  display: flex;
  gap: 12px;
}

.record-value {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stats-container {
  margin-bottom: 24px;
  padding: 16px;
  background-color: var(--el-fill-color-light);
  border-radius: 8px;
}

.stats-message {
  font-size: 16px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  text-align: center;
}

.highlight-number {
  font-size: 24px;
  font-weight: bold;
  color: var(--el-color-primary);
  margin: 0 4px;
}

.medal-container {
  margin-top: 24px;
  margin-bottom: 24px;
}

.rank-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.rank-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: var(--el-fill-color-light);
  border-radius: 6px;
}

.rank-badges {
  display: flex;
  gap: 8px;
}

.rank-tabs :deep(.el-tabs__content) {
  padding: 8px 0;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.record-details {
  padding: 16px;
}

.detail-item {
  margin-bottom: 12px;
  display: flex;
}

.detail-label {
  font-weight: bold;
  width: 100px;
  color: var(--el-text-color-secondary);
}

.detail-value {
  flex: 1;
}

.video-link {
  color: var(--el-color-primary);
  text-decoration: none;
}

.video-link:hover {
  text-decoration: underline;
}

.el-tag.el-tag--danger.el-tag--dark {
  background-color: #f56c6c;
  border-color: #f56c6c;
  color: white;
  font-weight: bold;
}

.gr-tag {
  background-color: #f56c6c;
  border-color: #f56c6c;
  color: white;
  font-weight: bold;
  border-radius: 4px;
  padding: 0 5px;
  font-size: 12px;
  line-height: 1;
}

@media (max-width: 768px) {
  .user-profile {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 16px;
  }
  
  .action-buttons {
    justify-content: center;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .filter-controls {
    width: 100%;
  }
  
  .event-name {
    width: 60px;
  }
}

.chart-container {
  margin-top: 24px;
  margin-bottom: 24px;
}

.chart-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 16px;
  color: var(--el-text-color-primary);
}

.event-distribution {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.event-bar {
  display: flex;
  align-items: center;
}

.event-name {
  width: 80px;
  font-size: 14px;
}

.bar-container {
  flex: 1;
  display: flex;
  align-items: center;
  height: 24px;
}

.bar {
  height: 100%;
  background-color: var(--el-color-primary-light-5);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.bar-value {
  margin-left: 8px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.record-cell {
  position: relative;
  cursor: pointer;
  padding: 8px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
}

.detail-text {
  opacity: 0;
  transition: opacity 0.2s ease;
  margin-left: auto;
  color: #67a9e0;
  font-size: 14px;
}

.record-cell:hover .detail-text {
  opacity: 1;
}
</style>
