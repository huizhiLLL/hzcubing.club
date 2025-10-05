<template>
  <div class="admin-dashboard">
    <!-- 网站统计 -->
    <div class="stats-grid">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ websiteStats.totalVisits || '-' }}</div>
          <div class="stat-label">总访问量</div>
          <div class="stat-extra">今日: {{ websiteStats.visitsToday || 0 }}</div>
        </div>
        <el-icon class="stat-icon"><View /></el-icon>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ websiteStats.totalRecords || '-' }}</div>
          <div class="stat-label">成绩提交数</div>
        </div>
        <el-icon class="stat-icon"><Trophy /></el-icon>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ websiteStats.totalUsers || '-' }}</div>
          <div class="stat-label">注册用户数</div>
        </div>
        <el-icon class="stat-icon"><User /></el-icon>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ websiteStats.activeUsers || '-' }}</div>
          <div class="stat-label">活跃用户数</div>
        </div>
        <el-icon class="stat-icon"><UserFilled /></el-icon>
      </el-card>
    </div>
    
    <!-- 最近活动 -->
    <h4 class="section-subtitle">最近活动</h4>
    <el-card class="activity-card">
      <div class="activity-list">
        <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
          <el-icon class="activity-icon"><Clock /></el-icon>
          <div class="activity-content">
            <div class="activity-text">{{ activity.description }}</div>
            <div class="activity-time">{{ formatTime(activity.timestamp) }}</div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRecordsStore } from '@/stores/records'
import { View, Trophy, User, UserFilled, Clock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import api from '@/api/index.js'

const recordsStore = useRecordsStore()

const websiteStats = ref({
  totalVisits: 0,
  visitsToday: 0,
  visitsThisMonth: 0,
  totalRecords: 0,
  totalUsers: 0,
  activeUsers: 0
})

const recentActivities = ref([])

// 加载数据
const loadData = async () => {
  try {
    // 从后端获取真实统计数据
    const statsResult = await api.getWebsiteStats()
    
    if (statsResult.code === 200) {
      const { userStats, recordStats, visitStats, recentActivities: activities } = statsResult.data
      
      // 更新网站统计
      websiteStats.value = {
        totalVisits: visitStats.totalVisits,
        visitsToday: visitStats.visitsToday,
        visitsThisMonth: visitStats.visitsThisMonth,
        totalRecords: recordStats.totalRecords,
        totalUsers: userStats.totalUsers,
        activeUsers: userStats.activeUsers
      }
      
      // 更新最近活动
      recentActivities.value = activities || []
    } else {
      throw new Error(statsResult.message || '获取统计数据失败')
    }
  } catch (error) {
    ElMessage.error('加载统计数据失败: ' + error.message)
    
    // 降级到本地数据
    try {
      await recordsStore.fetchRecords()
      websiteStats.value.totalRecords = recordsStore.records.length
    } catch (recordError) {
      // 静默处理本地数据获取失败
    }
  }
}

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 1000 * 60) {
    return '刚刚'
  } else if (diff < 1000 * 60 * 60) {
    return `${Math.floor(diff / (1000 * 60))}分钟前`
  } else if (diff < 1000 * 60 * 60 * 24) {
    return `${Math.floor(diff / (1000 * 60 * 60))}小时前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.admin-dashboard {
  width: 100%;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  cursor: default;
}

.stat-card .el-card__body {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: var(--primary-color);
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: var(--text-color-secondary);
  margin-top: 5px;
}

.stat-extra {
  font-size: 12px;
  color: var(--text-color-secondary);
  margin-top: 2px;
  opacity: 0.8;
}

.stat-icon {
  font-size: 32px;
  color: var(--primary-color);
  opacity: 0.7;
}

.section-subtitle {
  margin: 0 0 15px 0;
  color: var(--text-color);
  font-size: 16px;
  font-weight: 600;
}

.activity-card {
  margin-top: 20px;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-light);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  color: var(--primary-color);
  font-size: 16px;
}

.activity-content {
  flex: 1;
}

.activity-text {
  color: var(--text-color);
  font-size: 14px;
}

.activity-time {
  color: var(--text-color-secondary);
  font-size: 12px;
  margin-top: 2px;
}
</style>
