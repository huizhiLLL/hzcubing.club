<template>
  <div class="view-container">
    <!-- 动态背景光球 -->
    <div class="ambient-orb orb-1"></div>
    <div class="ambient-orb orb-2"></div>

    <ElementTransition name="zoom" :duration="600" appear>
      <div class="bento-card profile-header">
        <div class="user-profile">
          <div class="avatar-wrapper">
            <el-avatar
              :size="120"
              :src="user?.avatar"
              class="avatar"
              :class="{ 'default-avatar': !user?.avatar || isDefaultAvatar(user?.avatar) }"
            >
              <template #default>
                <span class="avatar-text">{{ user?.nickname?.charAt(0)?.toUpperCase() || 'User' }}</span>
              </template>
            </el-avatar>
          </div>
          <div class="user-info">
            <h1 class="nickname">{{ user?.nickname || '加载中...' }}</h1>
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
                empty-text="该选手暂无成绩记录"
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
          
          <el-tab-pane label="统计分析" name="statistics">
            <div class="bento-card tab-content">
              <h3 class="section-title">
                <el-icon><DataAnalysis /></el-icon> 数据概览
              </h3>
              
              <div class="stats-overview">
                <template v-if="totalRecords > 0">
                  <div class="stats-card">
                    <div class="stat-value">{{ activeEvents }}</div>
                    <div class="stat-label">参与项目</div>
                  </div>
                  <div class="stats-card">
                    <div class="stat-value">{{ totalRecords }}</div>
                    <div class="stat-label">总成绩数</div>
                  </div>
                  <div class="stats-card highlight" v-if="firstPlaceCount > 0">
                    <div class="stat-value">{{ firstPlaceCount }}</div>
                    <div class="stat-label">冠军项目</div>
                  </div>
                  <div class="stats-card highlight" v-if="topThreeCount > 0">
                    <div class="stat-value">{{ topThreeCount }}</div>
                    <div class="stat-label">前三项目</div>
                  </div>
                </template>
                <template v-else>
                  <div class="empty-stats">该选手还未参与任何项目</div>
                </template>
              </div>
              
              <div class="medal-section" v-if="topThreeCount > 0">
                <h4 class="subsection-title">排名分布</h4>
                <div class="rank-grid">
                  <div v-for="(item, index) in sortedTopThreeRecords" :key="index" class="rank-card">
                    <div class="rank-event">{{ getEventName(item.eventCode) }}</div>
                    <div class="rank-badges">
                      <div v-if="item.singleRank <= 3" class="rank-badge" :class="`rank-${item.singleRank}`">
                        <span class="badge-label">单次</span>
                        <span class="badge-val">#{{ item.singleRank }}</span>
                      </div>
                      <div v-if="item.averageRank <= 3" class="rank-badge" :class="`rank-${item.averageRank}`">
                        <span class="badge-label">平均</span>
                        <span class="badge-val">#{{ item.averageRank }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </ElementTransition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useRecordsStore } from '@/stores/records'
import { formatTime as formatTimeUtil, normalizeFloat } from '@/utils/timeFormatter'
import ElementTransition from '@/components/ElementTransition.vue'
import { ElMessage } from 'element-plus'
import { categories, events, getEventName, getEventType, getAllEvents } from '@/config/events'
import { Trophy, DataAnalysis } from '@element-plus/icons-vue'
import api from '@/api'

const route = useRoute()
const userStore = useUserStore()
const recordsStore = useRecordsStore()
const user = ref(null)
const personalBests = ref({})
const historyRecords = ref([])
const loading = ref(true)
const activeTab = ref('personal-bests')
const selectedCategory = ref('all')

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

// 使用统一的格式化时间函数
const formatTime = formatTimeUtil

// 获取用户基本信息
const fetchUserData = async () => {
  loading.value = true
  try {
    const result = await api.getUser(userId.value)
    if (result.code === 200 && result.data) {
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
          singleSeconds: typeof it.bestSingleSeconds === 'number' ? normalizeFloat(it.bestSingleSeconds) : null,
          averageSeconds: typeof it.bestAverageSeconds === 'number' ? normalizeFloat(it.bestAverageSeconds) : null
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
  try {
    const result = await api.getUsersHistoryRecord(userId.value)
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
      // 计算排名前先确保recordsStore有数据
      await ensureRecordsLoaded()
    } else {
      console.error('获取用户历史成绩失败:', result.message)
    }
  } catch (error) {
    console.error('获取用户历史成绩出错:', error)
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
/* 继承全局设计变量 */
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
}

.avatar {
  border: 4px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.avatar:hover {
  transform: scale(1.05) rotate(5deg);
}

.avatar-text {
  font-size: 48px;
  font-weight: bold;
  color: var(--primary-color);
}

.user-info {
  flex: 1;
}

.nickname {
  font-size: 36px;
  font-weight: 800;
  margin: 0 0 12px;
  background: linear-gradient(135deg, #2c3e50 0%, #4facfe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
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

/* Glass Inputs */
:deep(.glass-select .el-input__wrapper) {
  background: rgba(255, 255, 255, 0.5);
  box-shadow: none;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  padding: 4px 12px;
  transition: all 0.3s;
}

:deep(.glass-select .el-input__wrapper:hover),
:deep(.glass-select .el-input__wrapper.is-focus) {
  background: rgba(255, 255, 255, 0.8);
  border-color: var(--primary-color);
  box-shadow: 0 0 0 1px var(--primary-color-light);
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
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .glass-select {
    width: 100% !important;
  }
  
  .stats-overview {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
