<template>
  <div class="home-container">
    <div class="hero-section-wrapper">
      <section 
        class="hero-section glass-section"
      >
        <div class="hero-inner">
          <h1 class="hero-title">
            <span class="welcome-text"></span>
            <span class="title-inline">
              <span class="title-part chinese">会枝</span>
              <span class="title-part cubing">Cubing</span>
            </span>
          </h1>
          
          <!-- 将特性卡片移入渐变卡片 -->
          <div class="hero-features">
            <el-row :gutter="16">
              <el-col v-for="(feature, index) in features" 
                      :key="feature.title" 
                      :xs="24" 
                      :sm="8" 
                      :md="8" 
                      :lg="8">
                <div class="feature-card-wrapper">
                  <div 
                    ref="featureCardRefs"
                    class="feature-card" 
                    :class="{ 'clickable': feature.link }"
                    @mousemove="(e) => handleFeatureMouseMove(e, index)"
                    @mouseenter="() => handleFeatureMouseEnter(index)"
                    @mouseleave="() => handleFeatureMouseLeave(index)"
                    @click="feature.link && $router.push(feature.link)"
                    :style="{
                      transform: `perspective(1000px) rotateX(${featureRotateX[index] || 0}deg) rotateY(${featureRotateY[index] || 0}deg) scale(${featureScale[index] || 1})`,
                      transition: featureIsHovering[index] ? 'none' : 'all 0.5s ease'
                    }"
                  >
                    <template v-if="feature.localIcon">
                      <!-- 完全移除logo容器 -->
                      <Icon icon="mdi:minecraft" class="feature-icon" />
                    </template>
                    <Icon v-else :icon="feature.icon" class="feature-icon" />
                    <h3 class="feature-title">{{ feature.title }}</h3>
                    <p class="feature-description">{{ feature.description }}</p>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </div>
      </section>
    </div>

    <!-- 最近记录和更新日志 -->
    <section class="content-section">
      <el-row :gutter="24">
        <!-- 左侧：最近打破的记录 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <div class="section-card glass-card">
            <h2 class="section-title">
              <ShinyText :speed="4" className="enhanced-shiny">New G-Records</ShinyText>
            </h2>
            <div class="records-list" v-loading="recordsLoading">
              <div v-if="recentRecords.length === 0" class="empty-placeholder">
                暂无记录
              </div>
              <div v-else v-for="(record, index) in recentRecords" :key="index" class="record-item">
                <div class="record-header">
                  <span class="record-event">{{ getEventName(record.event) }}</span>
                  <span class="record-date">{{ formatDate(record.timestamp) }}</span>
                </div>
                <div class="record-content">
                  <div class="record-user">
                    <span class="user-name">{{ record.nickname || '匿名' }}</span>
                  </div>
                  <div class="record-times">
                    <span v-if="record.isSingleRecord" class="record-single">
                      单次: {{ formatTime(record.singleSeconds) }}
                    </span>
                    <span v-if="record.isAverageRecord" class="record-average">
                      平均: {{ formatTime(record.averageSeconds) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-col>
        
        <!-- 右侧：更新日志 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <div class="section-card glass-card">
            <h2 class="section-title">
              <ShinyText :speed="4" className="enhanced-shiny">最近更新</ShinyText>
            </h2>
            <div class="changelog-list">
              <div v-for="(log, index) in recentChangelogs" :key="log.version" class="changelog-item">
                <div class="changelog-header">
                  <span class="changelog-version">v{{ log.version }}</span>
                  <span class="changelog-date">{{ log.date }}</span>
                </div>
                <ul class="changelog-changes">
                  <li v-for="(change, changeIndex) in log.changes" :key="changeIndex">
                    {{ change }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </section>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { useUserStore } from '@/stores/user'
import { useRecordsStore } from '@/stores/records'
import { storeToRefs } from 'pinia'
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { getEventName, getEventType } from '@/config/events'
import ShinyText from '@/components/ShinyText.vue'
// 导入更新日志数据
import { getRecentChangelogs } from '@/services/changelog.js'

const userStore = useUserStore()
const recordsStore = useRecordsStore()
const { user } = storeToRefs(userStore)

// 移除主卡片的倾斜效果相关代码
const featureCardRefs = ref([])

// 倾斜卡片效果相关 - 特性卡片
const featureRotateX = reactive({})
const featureRotateY = reactive({})
const featureScale = reactive({})
const featureIsHovering = reactive({})
const featureRotateAmplitude = 10 // 特性卡片旋转幅度

// 处理鼠标移动 - 特性卡片
const handleFeatureMouseMove = (e, index) => {
  const card = e.currentTarget
  if (!card) return
  
  const rect = card.getBoundingClientRect()
  const offsetX = e.clientX - rect.left - rect.width / 2
  const offsetY = e.clientY - rect.top - rect.height / 2
  
  featureRotateX[index] = (offsetY / (rect.height / 2)) * -featureRotateAmplitude
  featureRotateY[index] = (offsetX / (rect.width / 2)) * featureRotateAmplitude
}

// 鼠标进入 - 特性卡片
const handleFeatureMouseEnter = (index) => {
  featureIsHovering[index] = true
  featureScale[index] = 1.05
}

// 鼠标离开 - 特性卡片
const handleFeatureMouseLeave = (index) => {
  featureIsHovering[index] = false
  featureRotateX[index] = 0
  featureRotateY[index] = 0
  featureScale[index] = 1
}

const features = [
  {
    icon: 'material-symbols:timer-outline',
    title: '上传成绩',
    description: '支持所有官方和一些趣味（整活） 项目的成绩上传',
    link: '/submit-record'
  },
  
  {
    icon: 'material-symbols:leaderboard-outline',
    title: '记录与排行',
    description: '网站最佳记录（WER&GR）表（含历史记录），以及各项目的排行榜。',
    link: '/records'
  },
  {
    icon: null,
    title: 'Minecraft',
    description: '会枝的Minecraft服务器，一起游玩！',
    link: '/minecraft',
    localIcon: true
  }
]

// 最近记录相关
const recordsLoading = ref(false)
const recentRecords = ref([])

// 更新日志相关
const recentChangelogs = ref([])

// 格式化时间
const formatTime = (time) => {
  return recordsStore.formatTime(time)
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}.${month}.${day}`
}

// 获取最近打破的记录
const fetchRecentRecords = async () => {
  recordsLoading.value = true
  try {
    await recordsStore.fetchRecords()
    
    // 获取所有记录
    const allRecords = []
    const events = Object.keys(recordsStore.getBestRecords())
    
    events.forEach(event => {
      // 跳过整活项目
      const eventType = getEventType(event)
      if (eventType === 'meme') {
        return
      }
      
      const eventRecords = recordsStore.getRecordsByEvent(event)
      
      // 记录打破历史的逻辑
      const recordBreakHistory = []
      let bestSingleTime = Infinity
      let bestAverageTime = Infinity
      
      // 按时间从早到晚排序
      const sortedRecords = [...eventRecords].sort((a, b) => {
        // 安全地解析日期，确保有效比较
        const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0
        const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0
        return dateA - dateB
      })
      
      sortedRecords.forEach(record => {
        let isBreakingRecord = false
        
        // 直接使用秒字段
        const singleTime = typeof record.singleSeconds === 'number' ? record.singleSeconds : null
        const averageTime = typeof record.averageSeconds === 'number' ? record.averageSeconds : null
        
        // 检查单次是否打破记录
        if (singleTime !== null && singleTime < bestSingleTime) {
          bestSingleTime = singleTime
          isBreakingRecord = true
        }
        
        // 检查平均是否打破记录
        if (averageTime !== null && averageTime < bestAverageTime) {
          bestAverageTime = averageTime
          isBreakingRecord = true
        }
        
        // 如果打破了记录，添加到历史中
        if (isBreakingRecord) {
          recordBreakHistory.push({
            ...record,
            isSingleRecord: singleTime !== null && singleTime === bestSingleTime,
            isAverageRecord: averageTime !== null && averageTime === bestAverageTime,
            singleSeconds: singleTime,
            averageSeconds: averageTime,
            nickname: record.nickname || recordsStore.getNicknameForUser(record.userId) || ''
          })
        }
      })
      
      allRecords.push(...recordBreakHistory)
    })
    
    // 按时间从新到旧排序
    allRecords.sort((a, b) => {
      // 安全地解析日期，确保有效比较
      const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0
      const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0
      return dateB - dateA
    })
    
    // 取前5条记录
    recentRecords.value = allRecords.slice(0, 5)
  } catch (error) {
    console.error('获取最近记录失败:', error)
  } finally {
    recordsLoading.value = false
  }
}

// 获取最近更新日志
const fetchRecentChangelogs = () => {
  try {
    // 使用共享的更新日志数据服务
    recentChangelogs.value = getRecentChangelogs(5)
  } catch (error) {
    console.error('获取更新日志失败:', error)
    recentChangelogs.value = []
  }
}

onMounted(() => {
  fetchRecentRecords()
  fetchRecentChangelogs()
})
</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.hero-section-wrapper {
  display: flex;
  justify-content: center;
}

.hero-section {
  text-align: center;
  padding: 60px 24px;
  background: linear-gradient(135deg, rgba(var(--primary-color-rgb, 64, 158, 255), 0.8), rgba(var(--success-color-rgb, 103, 194, 58), 0.8));
  border-radius: 12px;
  color: #fff;
  position: relative;
  overflow: hidden;
  width: 100%;
}

.hero-inner {
  position: relative;
  width: 100%;
  height: 100%;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('/hero-bg.jpg') center/cover no-repeat;
  opacity: 0.15;
  z-index: -1;
}

.hero-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-bottom: 24px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.welcome-text {
  font-family: 'CustomChinese', sans-serif;
  font-size: 36px;
  margin-bottom: 10px;
  display: block;
}

.title-inline {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 15px;
}

.title-part {
  display: inline-block;
  line-height: 1.2;
}

.title-part.chinese {
  font-family: 'CustomChinese', sans-serif;
  font-size: 80px;
}

.title-part.cubing {
  font-family: 'CustomEnglish', sans-serif;
  color: #ffffff;
  font-style: normal;
  letter-spacing: 3px;
  font-size: 60px;
}

/* 确保ShinyText组件继承字体样式 */
:deep(.shiny-text) {
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  color: inherit;
  font-style: inherit;
  letter-spacing: inherit;
}

.hero-features {
  margin-top: 32px;
}

.feature-card-wrapper {
  perspective: 1000px;
  height: 100%;
  margin-bottom: 16px;
}

.feature-card {
  height: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: all 0.3s ease;
  transform-style: preserve-3d;
  will-change: transform;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.feature-card.clickable {
  cursor: pointer;
}

.feature-card.clickable:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  width: 32px;
  height: 32px;
  color: #ffffff;
  margin-bottom: 12px;
  transform: translateZ(20px);
}

.feature-local-icon {
  width: 32px;
  height: 32px;
  margin-bottom: 12px;
  transform: translateZ(20px);
}

.feature-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 6px;
  color: #ffffff;
  transform: translateZ(15px);
}

.feature-description {
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.4;
  transform: translateZ(10px);
  font-size: 14px;
}

/* 内容区域样式 */
.content-section {
  margin: 32px 0;
}

.section-card {
  padding: 24px 24px 0 24px;
  height: 100%;
  border-radius: 12px;
  margin-bottom: 24px;
}

.section-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 16px;
  color: var(--text-color);
  border-bottom: 1px solid rgba(var(--border-color-rgb), 0.1);
  padding-bottom: 12px;
}

/* 记录列表样式 */
.records-list {
  min-height: 200px;
  padding-bottom: 0;
  margin-bottom: 0;
}

.record-item {
  padding: 12px 0;
  border-bottom: 1px solid rgba(var(--border-color-rgb), 0.1);
}

.record-item:last-child {
  border-bottom: none;
}

.record-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.record-event {
  font-weight: bold;
  color:rgb(107, 119, 255);
}

.record-date {
  color: var(--text-color-secondary);
  font-size: 12px;
}

.record-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-name {
  font-weight: 500;
  color: #333;
}

.record-times {
  display: flex;
  gap: 12px;
}

.record-single, .record-average {
  font-family: monospace;
  font-size: 14px;
  background-color: rgba(255, 107, 107, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  color: #e74c3c;
}

.record-average {
  background-color: rgba(52, 152, 219, 0.1);
  color: #3498db;
}

.empty-placeholder {
  text-align: center;
  padding: 40px 0;
  color: var(--text-color-secondary);
}

/* 更新日志样式 */
.changelog-list {
  max-height: 400px;
  overflow-y: auto;
  padding-bottom: 0;
  margin-bottom: 0;
}

.changelog-item {
  padding: 12px 0;
  border-bottom: 1px solid rgba(var(--border-color-rgb), 0.1);
}

.changelog-item:last-child {
  border-bottom: none;
}

.changelog-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.changelog-version {
  font-weight: bold;
  color: rgb(107, 119, 255);
}

.changelog-date {
  color: var(--text-color-secondary);
  font-size: 12px;
}

.changelog-changes {
  padding-left: 20px;
  margin: 8px 0;
}

.changelog-changes li {
  margin-bottom: 4px;
  color: var(--text-color);
}

@media (max-width: 768px) {
  .welcome-text {
    font-size: 30px;
  }
  
  .title-part.chinese {
    font-size: 60px;
  }
  
  .title-part.cubing {
    font-size: 45px;
  }
  
  .title-inline {
    gap: 10px;
  }
  
  .hero-features {
    margin-top: 24px;
  }
  
  .feature-description {
    display: none;
  }
}

@media (max-width: 480px) {
  .welcome-text {
    font-size: 24px;
  }
  
  .title-part.chinese {
    font-size: 48px;
  }
  
  .title-part.cubing {
    font-size: 36px;
  }
  
  .title-inline {
    gap: 8px;
    flex-direction: column;
  }
  
  .feature-title {
    font-size: 14px;
  }
  
  .hero-features .el-row {
    margin-left: 0 !important;
    margin-right: 0 !important;
  }
}

/* 增强闪光效果 */
:deep(.enhanced-shiny) {
  font-weight: bold;
  color: #ff6b6b;
  text-shadow: 0 0 8px rgba(255, 107, 107, 0.3);
}
</style> 