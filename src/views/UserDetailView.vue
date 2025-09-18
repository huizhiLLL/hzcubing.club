<template>
  <div class="profile-container">
    <ElementTransition name="zoom" :duration="600" appear>
      <div class="card profile-header glass-card">
        <div class="user-profile">
          <div class="avatar-container" v-if="user?.avatar && !isDefaultAvatar(user.avatar)">
            <el-avatar
              :size="128"
              :src="user.avatar"
              class="avatar"
            />
          </div>
          <div class="user-info">
            <h1 class="nickname">{{ user?.nickname || '加载中...' }}</h1>
            <p class="bio">{{ user?.bio || '这个人很懒，什么都没写~' }}</p>
            <p v-if="user?.wcaId" class="wca-id">WCA ID: {{ user.wcaId }}</p>
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
              empty-text="该选手暂无成绩记录"
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
                    该选手一共在 <span class="highlight-number">{{ firstPlaceCount }}</span> 个项目中取得了第一名
                  </template>
                  
                  <template v-if="topThreeCount > 0">
                    <template v-if="firstPlaceCount > 0">，</template>
                    <template v-else>该选手</template>
                    在 <span class="highlight-number">{{ topThreeCount }}</span> 个项目中取得了前三名
                  </template>
                  
                  <template v-if="firstPlaceCount > 0 || topThreeCount > 0">，</template>
                  <template v-else>该选手</template>
                  总共参与了 <span class="highlight-number">{{ activeEvents }}</span> 个项目，
                  上传了 <span class="highlight-number">{{ totalRecords }}</span> 个成绩数
                </div>
              </template>
              <template v-else>
                <div class="stats-message">
                  该选手还未参与任何项目哦
                </div>
              </template>
                </div>
            
            <div class="medal-container" v-if="topThreeCount > 0">
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useRecordsStore } from '@/stores/records'
import ElementTransition from '@/components/ElementTransition.vue'
import { ElMessage } from 'element-plus'
import { categories, events, getEventName, getEventType, getAllEvents } from '@/config/events'
import api from '@/api'

const route = useRoute()
const userStore = useUserStore()
const recordsStore = useRecordsStore()
const user = ref(null)
const personalBests = ref({})
const historyRecords = ref([])
const loading = ref(true)
const historyLoading = ref(false)
const activeTab = ref('personal-bests')
const selectedCategory = ref('all')
const selectedEvent = ref('all')
const sortOrder = ref('latest')
const currentPage = ref(1)
const pageSize = ref(10)
const recordDetailVisible = ref(false)
const selectedRecord = ref(null)

const userId = computed(() => route.params.id)

// 项目分组
const eventGroups = computed(() => {
  return getAllEvents()
})

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
    cube: record.cube,
    method: record.method,
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

// 获取用户基本信息
const fetchUserData = async () => {
  loading.value = true
  try {
    const result = await api.getUser(userId.value)
    if (result.code === 0 && result.data) {
      user.value = result.data
    } else {
      ElMessage.error(result.message || '获取用户信息失败')
    }
  } catch (error) {
    console.error('获取用户信息出错:', error)
    ElMessage.error(error.message || '获取用户信息失败')
  } finally {
    loading.value = false
  }
}

// 获取用户个人最佳记录
const fetchUserRecords = async () => {
  try {
    const result = await api.getUsersBestRecord(userId.value)
    if (result.code === 200 && result.data) {
      // 统一为 seconds 结构
      const map = {}
      ;(result.data || []).forEach(it => {
        map[it.event] = {
          singleSeconds: typeof it.bestSingleSeconds === 'number' ? it.bestSingleSeconds : null,
          averageSeconds: typeof it.bestAverageSeconds === 'number' ? it.bestAverageSeconds : null
        }
      })
      personalBests.value = map
    } else {
      console.error('获取用户成绩失败:', result.message)
    }
  } catch (error) {
    console.error('获取用户成绩出错:', error)
  }
}

// 获取用户历史记录
const fetchUserHistoryRecords = async () => {
  historyLoading.value = true
  try {
    const result = await api.getUsersHistoryRecord(userId.value)
    if (result.code === 200 && result.data) {
      const rows = (result.data || []).map(r => ({
        ...r,
        singleSeconds: typeof r.singleSeconds === 'number' ? r.singleSeconds : (r.single && typeof r.single.time === 'number' ? r.single.time : null),
        averageSeconds: typeof r.averageSeconds === 'number' ? r.averageSeconds : (r.average && typeof r.average.time === 'number' ? r.average.time : null)
      }))
      historyRecords.value = rows
      // 计算排名前先确保recordsStore有数据
      await ensureRecordsLoaded()
    } else {
      console.error('获取用户历史成绩失败:', result.message)
    }
  } catch (error) {
    console.error('获取用户历史成绩出错:', error)
  } finally {
    historyLoading.value = false
  }
}

// 确保排行榜数据已加载
const ensureRecordsLoaded = async () => {
  try {
    // 检查recordsStore是否有数据
    if (recordsStore.records.length === 0) {
      await recordsStore.fetchRecords()
    }
    // 计算排名
    calculateRankings()
  } catch (error) {
    console.error('加载排行榜数据出错:', error)
    // 仍然计算统计数据，使用现有信息
    topThreeCount.value = calculateTopThreeCount()
    firstPlaceCount.value = calculateFirstPlaceCount()
  }
}

// 添加：计算排名信息
const calculateRankings = () => {
  try {
    // 不再调用API，而是使用recordsStore中的数据
    
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
        
        // 查找当前用户的排名
        const userRank = sortedSingles.findIndex(r => r.userId === userId.value) + 1
        if (userRank > 0) {
          record.singleRank = userRank
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
        
        // 查找当前用户的排名
        const userRank = sortedAverages.findIndex(r => r.userId === userId.value) + 1
        if (userRank > 0) {
          record.averageRank = userRank
        }
      }
    }
    
    // 更新统计数据
    topThreeCount.value = calculateTopThreeCount()
    firstPlaceCount.value = calculateFirstPlaceCount()
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
  for (const [eventCode, record] of Object.entries(personalBests.value)) {
    // 排除整活项目
    const eventType = getEventType(eventCode)
    if (eventType === 'meme') {
      continue
    }
    
    if ((record.singleRank && record.singleRank <= 3) || 
        (record.averageRank && record.averageRank <= 3)) {
      count++
    }
  }
  return count
}

// 计算第一名的数量
const calculateFirstPlaceCount = () => {
  let count = 0
  for (const [eventCode, record] of Object.entries(personalBests.value)) {
    // 排除整活项目
    const eventType = getEventType(eventCode)
    if (eventType === 'meme') {
      continue
    }
    
    if (record.singleRank === 1 || record.averageRank === 1) {
      count++
    }
  }
  return count
}

watch(() => route.params.id, () => {
  fetchUserData()
  fetchUserRecords()
  fetchUserHistoryRecords()
})

onMounted(() => {
  fetchUserData()
  fetchUserRecords()
  fetchUserHistoryRecords()
})

// 处理可能是字符串"null"的字段
const getDisplayValue = (value) => {
  if (value === null || value === undefined || value === 'null' || value === '') {
    return '未知'
  }
  return value
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
    
    if ((record.singleRank && record.singleRank <= 3) || 
        (record.averageRank && record.averageRank <= 3)) {
      result[eventCode] = record
    }
  }
  return result
})

// 按排名排序的前三名记录
const sortedTopThreeRecords = computed(() => {
  const records = []
  
  for (const [eventCode, record] of Object.entries(topThreeRecords.value)) {
    records.push({
      eventCode,
      singleRank: record.singleRank,
      averageRank: record.averageRank,
      // 计算一个综合排名权重，优先使用更好的排名
      rankWeight: Math.min(
        record.singleRank && record.singleRank <= 3 ? record.singleRank : 999,
        record.averageRank && record.averageRank <= 3 ? record.averageRank : 999
      )
    })
  }
  
  // 按排名从小到大排序（第一名在前）
  return records.sort((a, b) => a.rankWeight - b.rankWeight)
})

// 获取第一名的记录（不再需要，但保留代码以备后用）
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
  border-radius: 50%;
  overflow: hidden;
}

.avatar {
  display: block;
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
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
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

@media (max-width: 768px) {
  .user-profile {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 16px;
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

.chart-container {
  margin-top: 24px;
  margin-bottom: 24px;
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