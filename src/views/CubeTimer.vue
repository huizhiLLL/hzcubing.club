<template>
  <div class="cube-timer">
    <!-- 背景图片层（全局） -->
    <div v-if="bgImageUrl" class="timer-bg-image" :style="bgImageStyle"></div>
    
    <!-- 返回主页按钮 -->
    <div class="back-button-container" :class="{ 'hidden': state === 2 }">
      <el-button 
        type="primary" 
        size="large" 
        circle
        @click="$router.push('/')"
        class="back-button"
      >
        <el-icon><Icon icon="mdi:arrow-left" /></el-icon>
      </el-button>
    </div>

    <!-- 顶部导航栏 -->
    <header class="top-navbar" :class="{ 'hidden': state === 2 }">
      <div class="nav-center">
        <span class="nav-text">WCA</span>
        <div class="scramble-selector" @click="toggleScrambleType">
          <span class="nav-text">{{ currentScrambleType.name }}</span>
        </div>
        <span class="scramble-hint">（点击切换打乱项目）</span>
      </div>
    </header>

    <!-- 主内容区域 -->
    <div class="main-container" :class="{ 'hidden': state === 2 }">
      <!-- 左侧边栏 -->
      <aside class="sidebar">
        <!-- 应用标题 -->
        <div class="app-title">
          <span class="title-text">Cube Timer</span>
        </div>
        
        <!-- 分组标签 -->
        <div class="group-tag-container">
          <div class="group-tag" @click="toggleGroupDropdown">
            <span>{{ currentGroup.name }}</span>
            <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
          </div>
          <el-button 
            type="text" 
            size="small" 
            class="edit-group-btn"
            @click="editCurrentGroup"
          >
            <el-icon><Edit /></el-icon>
          </el-button>
          
          <!-- 分组下拉菜单 -->
          <div v-if="showGroupDropdown" class="group-dropdown">
            <div 
              v-for="group in groups" 
              :key="group.id"
              class="group-item"
              :class="{ 'active': group.id === currentGroupId }"
              @click="selectGroup(group.id)"
            >
              <span>{{ group.name }}</span>
            </div>
            <div class="group-divider"></div>
            <div class="group-item new-group" @click="createNewGroup">
              <el-icon><Plus /></el-icon>
              <span>新建</span>
            </div>
          </div>
        </div>
        
        <!-- 统计表格 -->
        <div class="stats-table">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>当前</th>
                <th>最快</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="row-label">单次</td>
                <td>{{ stats.current || '-' }}</td>
                <td>{{ stats.best || '-' }}</td>
              </tr>
              <tr>
                <td class="row-label">ao5</td>
                <td>{{ stats.ao5 || '-' }}</td>
                <td>{{ stats.bestAo5 || '-' }}</td>
              </tr>
              <tr>
                <td class="row-label">ao12</td>
                <td>{{ stats.ao12 || '-' }}</td>
                <td>{{ stats.bestAo12 || '-' }}</td>
              </tr>
              <tr>
                <td class="row-label">ao100</td>
                <td>{{ stats.ao100 || '-' }}</td>
                <td>{{ stats.bestAo100 || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- 总体统计 -->
        <div class="overall-stats">
          <div class="solve-count">还原: {{ completedCount }}/{{ totalCount }}</div>
          <div class="average-time">平均: {{ overallAverage || '-' }}</div>
        </div>
        
        <!-- 历史成绩列表 -->
        <div class="times-list">
          <div class="list-header">
            <span>ρ</span>
            <span>时间</span>
            <span>ao5</span>
            <span>ao12</span>
          </div>
          <div class="list-content">
            <div 
              v-for="(time, index) in recentTimes" 
              :key="index"
              class="time-item"
              :class="{
                'new-record': isNewRecord(index)
              }"
              @click="showTimeDetail(index)"
            >
              <span class="time-index">{{ recentTimes.length - index }}</span>
              <span class="time-value">{{ formatTime(time.time, time.penalty, time.status) }}</span>
              <span class="time-ao5" :class="{ 'new-record': isAo5Record(index) }">{{ getAo5(index) }}</span>
              <span class="time-ao12" :class="{ 'new-record': isAo12Record(index) }">{{ getAo12(index) }}</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- 主计时区域 -->
      <main class="timer-main">
        <!-- 打乱公式显示 -->
        <div class="scramble-display">
          {{ currentScramble || '长按或空格开始' }}
        </div>
        
        <!-- 计时器显示 -->
        <div 
          class="timer-display"
          :class="{ 
            'timer-ready': state === 1, 
            'timer-running': state === 2 
          }"
          @pointerdown="handlePointerDown"
          @pointerup="handlePointerUp"
          @keydown="handleKeyDown"
          @keyup="handleKeyUp"
          tabindex="0"
        >
          <span class="timer-text">{{ displayTime }}</span>
          <span v-if="penalty" class="penalty-text">(+{{ penalty }})</span>
        </div>
        
        <!-- 平均成绩显示 -->
        <div class="average-display">
          <div class="avg-item">
            <span class="avg-label">ao5:</span>
            <span class="avg-value">{{ stats.ao5 || '-' }}</span>
          </div>
          <div class="avg-item">
            <span class="avg-label">ao12:</span>
            <span class="avg-value">{{ stats.ao12 || '-' }}</span>
          </div>
        </div>
        
        <!-- 帮助按钮和背景设置 -->
        <div class="top-right-tools">
          <el-button type="text" size="large" circle @click="showBgUpload = true">
            <el-icon><Picture /></el-icon>
          </el-button>
          <el-button v-if="bgImageUrl" type="text" size="large" circle @click="removeBackgroundImage">
            <el-icon><Delete /></el-icon>
          </el-button>
          <el-button type="text" size="large" circle>
            <el-icon><QuestionFilled /></el-icon>
          </el-button>
        </div>

        <!-- 背景图片上传弹窗 -->
        <el-dialog v-model="showBgUpload" title="上传背景图片" width="400px">
          <div class="upload-section">
            <el-upload
              class="bg-uploader"
              drag
              :show-file-list="false"
              :before-upload="handleBgUpload"
              accept="image/*"
            >
              <el-icon class="el-icon--upload"><Upload /></el-icon>
              <div class="el-upload__text">将图片拖到此处，或 <em>点击上传</em></div>
            </el-upload>
          </div>
          
          <template #footer>
            <div class="dialog-footer">
              <el-button @click="useDefaultBackground">使用默认背景</el-button>
              <el-button type="primary" @click="showBgUpload = false">关闭</el-button>
            </div>
          </template>
        </el-dialog>
      </main>
    </div>

    <!-- 全屏计时显示 -->
    <div v-if="state === 2" class="fullscreen-timer">
      <div class="fullscreen-timer-text">{{ displayTime }}</div>
    </div>

    <!-- 粒子效果 -->
    <div v-if="showParticles" class="particle-container">
      <div 
        v-for="particle in particles" 
        :key="particle.id"
        class="particle"
        :style="{
          left: particle.x + 'px',
          top: particle.y + 'px',
          transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
          opacity: particle.opacity,
          backgroundColor: particle.color
        }"
      ></div>
    </div>

    <!-- 成绩详情弹窗 -->
    <el-dialog
      v-model="showDetailDialog"
      :title="`Solves No.${recentTimes.length - selectedTimeIndex}`"
      width="500px"
      class="time-detail-dialog"
    >
      <div v-if="selectedTime" class="time-detail-content">
        <!-- 大号时间显示 -->
        <div class="detail-time-display">
          {{ formatTime(selectedTime.time, selectedTime.penalty, selectedTime.status) }}
        </div>
        
        <!-- 操作按钮行 -->
        <div class="detail-action-buttons">
          <div class="action-item action-ok" @click="applyOK">OK</div>
          <div class="action-divider"></div>
          <div class="action-item action-penalty" @click="applyPlusTwo">+2</div>
          <div class="action-divider"></div>
          <div class="action-item action-dnf" @click="applyDNF">DNF</div>
        </div>
        
        <!-- 注释字段 -->
        <div class="detail-field">
          <label class="field-label">注释</label>
          <el-input 
            v-model="selectedTime.comment" 
            placeholder="添加注释..."
            class="field-input"
          />
        </div>
        
        <!-- 打乱公式字段 -->
        <div class="detail-field">
          <label class="field-label scramble-label">打乱公式</label>
          <span class="field-value">{{ selectedTime.scramble }}</span>
        </div>
        
        <!-- 日期字段 -->
        <div class="detail-field">
          <label class="field-label">日期</label>
          <span class="field-value">{{ formatDate(selectedTime.timestamp) }}</span>
        </div>
      </div>
      
      <template #footer>
        <div class="detail-footer-buttons">
          <el-button type="primary" @click="saveCommentAndClose">确定</el-button>
          <el-button @click="deleteTime" type="danger">删除</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 分组编辑弹窗 -->
    <el-dialog
      v-model="showGroupEditDialog"
      :title="editingGroup ? '编辑分组' : '新建分组'"
      width="400px"
      class="group-edit-dialog"
    >
      <div class="group-edit-content">
        <div class="edit-field">
          <label class="field-label">分组名称</label>
          <el-input 
            v-model="newGroupName" 
            placeholder="请输入分组名称"
            @keyup.enter="saveGroup"
            class="field-input"
          />
        </div>
      </div>
      <template #footer>
        <div class="detail-footer-buttons">
          <div>
            <el-button 
              v-if="editingGroup && !editingGroup.isDefault" 
              type="danger" 
              @click="deleteCurrentGroup"
            >
              删除分组
            </el-button>
          </div>
          <div style="display: flex; gap: 10px;">
            <el-button @click="showGroupEditDialog = false">取消</el-button>
            <el-button type="primary" @click="saveGroup">保存</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Icon } from '@iconify/vue'
import { 
  Setting, Delete, Refresh, Download, Upload, Grid, Star, Menu, Money, Operation, QuestionFilled, ArrowDown, Edit, Plus, Document, Close, Picture 
} from '@element-plus/icons-vue'

// 计时器状态 (0: 空闲, 1: 准备, 2: 运行, 3: 停止)
const state = ref(0)
const startTime = ref(0)
const currentTime = ref(0)
const rafId = ref(null)
const penalty = ref('')
const lastSolveTime = ref(0) // 添加最后完成时间

// 打乱相关
const currentScramble = ref('')

// 打乱类型相关
const scrambleTypes = ref([
  { id: 'wca333', name: '三阶速拧', type: 'wca' },
  { id: 'cto333', name: 'CTO三阶', type: 'cto' }
])
const currentScrambleTypeId = ref('wca333')
const showScrambleDropdown = ref(false)

// 成绩存储 - 改为按分组存储
const groupTimes = ref({
  1: [] // 默认分组一的成绩数组
})

// 分组相关
const groups = ref([
  { id: 1, name: '分组一', isDefault: true }
])
const currentGroupId = ref(1)
const showGroupDropdown = ref(false)
const showGroupEditDialog = ref(false)
const editingGroup = ref(null)
const newGroupName = ref('')

// 统计信息
const stats = reactive({
  current: null,
  best: null,
  ao5: null,
  bestAo5: null,
  ao12: null,
  bestAo12: null,
  ao100: null,
  bestAo100: null
})

// 弹窗状态
const showDetailDialog = ref(false)
const selectedTime = ref(null)
const selectedTimeIndex = ref(-1)

// 计算属性
const displayTime = computed(() => {
  if (state.value === 2) {
    const time = currentTime.value - startTime.value
    return (time / 1000).toFixed(1) // 只显示一位小数
  } else if (state.value === 3) {
    return formatTime(lastSolveTime.value)
  }
  return '0.000'
})

const recentTimes = computed(() => {
  return groupTimes.value[currentGroupId.value] || []
})

const currentGroup = computed(() => {
  return groups.value.find(g => g.id === currentGroupId.value) || groups.value[0]
})

const currentScrambleType = computed(() => {
  return scrambleTypes.value.find(t => t.id === currentScrambleTypeId.value) || scrambleTypes.value[0]
})

const overallAverage = computed(() => {
  const currentGroupTimes = groupTimes.value[currentGroupId.value] || []
  if (currentGroupTimes.length === 0) return null
  
  // 过滤掉DNF的成绩
  const validTimes = currentGroupTimes.filter(t => t.status !== 'DNF')
  if (validTimes.length === 0) return null
  
  // 计算有效成绩的总时间（包括惩罚）
  const total = validTimes.reduce((sum, t) => sum + t.time + (t.penalty || 0), 0)
  return formatTime(total / validTimes.length)
})

const completedCount = computed(() => {
  const currentGroupTimes = groupTimes.value[currentGroupId.value] || []
  // 计算非DNF的成绩数量
  return currentGroupTimes.filter(t => t.status !== 'DNF').length
})

const totalCount = computed(() => {
  const currentGroupTimes = groupTimes.value[currentGroupId.value] || []
  // 返回总成绩数量
  return currentGroupTimes.length
})

// 格式化时间
const formatTime = (time, penalty = 0, status = 'OK') => {
  if (status === 'DNF') {
    return 'DNF'
  }
  const totalTime = time + penalty
  return (totalTime / 1000).toFixed(3) + (penalty > 0 ? '+' : '')
}

// 格式化日期
const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

// 生成WCA三阶魔方打乱
const generateWCA333Scramble = (() => {
  const R = (a) => a[(Math.random() * a.length) | 0]
  const MAIN = [
    ['U', "U'", 'U2'], ['D', "D'", 'D2'],
    ['F', "F'", 'F2'], ['B', "B'", 'B2'],
    ['L', "L'", 'L2'], ['R', "R'", 'R2']
  ]

  return () => {
    const seq = []
    let last = -1
    for (let i = 0; i < 20; ++i) {
      let ax
      do ax = (Math.random() * 6) | 0; while (ax === last)
      seq.push(R(MAIN[ax]))
      last = ax
    }
    return seq.join(' ')
  }
})()

// 生成CTO魔方打乱
const generateCTO333Scramble = (() => {
  const pick = a => a[Math.random()*a.length|0];
  
  // 基本转动
  const axis = [
    ['U','U\'','U2'],['D','D\'','D2'],['F','F\'','F2'],
    ['B','B\'','B2'],['L','L\'','L2'],['R','R\'','R2']
  ];
  
  // 小写转动（双层转动）
  const lower = [
    ['u','u\'','u2'],['d','d\'','d2'],['f','f\'','f2'],
    ['b','b\'','b2'],['l','l\'','l2'],['r','r\'','r2']
  ];

  return () => {
    // 生成20-30步的打乱
    const len = 20 + (Math.random()*11|0);
    const seq = []; 
    let last = -1;
    
    // 生成不连续重复的转动序列
    for (let i = 0; i < len; ++i) {
      let ax; 
      do { 
        ax = Math.random()*6|0; 
      } while (ax === last);
      seq.push(pick(axis[ax])); 
      last = ax;
    }
    
    // 随机添加0-6个双层转动
    const extra = Math.random()*7|0;
    if (extra) {
      const idx = [...Array(6).keys()].sort(()=>Math.random()-0.5).slice(0,extra);
      idx.forEach(i=>seq.push(pick(lower[i])));
    }
    
    return seq.join(' ');
  }
})()

// 生成新打乱
const generateNewScramble = () => {
  if (currentScrambleType.value.type === 'wca') {
    currentScramble.value = generateWCA333Scramble()
  } else if (currentScrambleType.value.type === 'cto') {
    currentScramble.value = generateCTO333Scramble()
  }
}

// 设置状态
const setState = (s) => {
  state.value = s
}

// 绘制计时器
const draw = () => {
  if (state.value !== 2) return
  const now = performance.now()
  currentTime.value = now
  rafId.value = requestAnimationFrame(draw)
}

// 开始计时
const start = () => {
  setState(2)
  startTime.value = performance.now()
  currentTime.value = startTime.value
  draw()
}

// 停止计时
const stop = () => {
  if (rafId.value) {
    cancelAnimationFrame(rafId.value)
  }
  const finalMs = performance.now()
  const solveTime = finalMs - startTime.value
  
  // 保存最后完成时间
  lastSolveTime.value = solveTime
  
  // 检查是否打破记录
  const isNewRecord = checkIfNewRecord(solveTime)
  
  // 保存成绩
  groupTimes.value[currentGroupId.value].unshift({
    time: solveTime,
    scramble: currentScramble.value,
    timestamp: Date.now(),
    comment: '',
    penalty: 0,
    status: 'OK' // OK, +2, DNF
  })
  
  // 更新统计
  updateStats()
  
  // 保存到本地存储
  saveTimes()
  
  // 生成新打乱
  generateNewScramble()
  
  // 设置为停止状态，显示完成时间
  setState(3)
  penalty.value = ''
  
  // 如果打破记录，触发粒子效果
  if (isNewRecord) {
    triggerParticleEffect()
  }
}

// 检查是否打破记录
const checkIfNewRecord = (solveTime) => {
  const currentGroupTimes = groupTimes.value[currentGroupId.value] || []
  if (currentGroupTimes.length === 0) return true // 第一个成绩
  
  // 获取之前的最佳成绩（不包括DNF）
  const validTimes = currentGroupTimes.filter(t => t.status !== 'DNF')
  if (validTimes.length === 0) return true // 之前没有有效成绩
  
  const bestTime = Math.min(...validTimes.map(t => t.time + (t.penalty || 0)))
  return solveTime < bestTime
}

// 重置准备状态
const resetReadyState = () => {
  setState(0)
  lastSolveTime.value = 0 // 重置最后完成时间
}

// 处理指针按下
const handlePointerDown = (e) => {
  if (e && e.target.tagName === 'BUTTON') return
  if (state.value === 0) setState(1)
  else if (state.value === 2) stop()
}

// 处理指针释放
const handlePointerUp = () => {
  if (state.value === 1) start()
  else if (state.value === 3) resetReadyState()
}

// 处理键盘按下
const handleKeyDown = (e) => {
  if (e.code === 'Space') {
    e.preventDefault()
    if (state.value === 0) {
      setState(1)
    } else if (state.value === 2) {
      stop()
    } else if (state.value === 3) {
      resetReadyState()
    }
  }
}

// 处理键盘释放
const handleKeyUp = (e) => {
  if (e.code === 'Space') {
    e.preventDefault()
    if (state.value === 1) {
      start()
    }
  }
}

// 计算平均值
const calculateAverage = (times, count) => {
  if (times.length < count) return null
  
  // 获取最近的count个成绩
  const recent = times.slice(0, count)
  
  // 将DNF转换为一个很大的时间值（比如999999），这样它会被排到最后
  const processedTimes = recent.map(t => ({
    ...t,
    effectiveTime: t.status === 'DNF' ? 999999 : (t.time + (t.penalty || 0))
  }))
  
  // 按有效时间排序
  processedTimes.sort((a, b) => a.effectiveTime - b.effectiveTime)
  
  // 去头尾，取中间的成绩
  const middleCount = count - 2 // 去掉头尾后剩下的数量
  const middleTimes = processedTimes.slice(1, -1) // 去掉第一个和最后一个
  
  // 检查中间的成绩中是否有DNF
  const hasDNF = middleTimes.some(t => t.status === 'DNF')
  if (hasDNF) {
    return 'DNF'
  }
  
  // 计算中间成绩的平均值
  const total = middleTimes.reduce((sum, t) => sum + t.effectiveTime, 0)
  return total / middleTimes.length
}

// 获取Ao5
const getAo5 = (index) => {
  const currentGroupTimes = groupTimes.value[currentGroupId.value] || []
  if (currentGroupTimes.length === 0) return '-'
  
  // 计算当前成绩的序号（从1开始）
  const currentNumber = currentGroupTimes.length - index
  
  // 如果序号小于5，无法计算ao5
  if (currentNumber < 5) return '-'
  
  // 获取包含当前成绩在内的5个成绩（当前成绩 + 前面的4个成绩）
  // 序号范围：currentNumber-4 到 currentNumber
  const startIndex = currentGroupTimes.length - currentNumber
  const endIndex = currentGroupTimes.length - (currentNumber - 5)
  
  // 安全检查
  if (startIndex < 0 || endIndex > currentGroupTimes.length || startIndex >= endIndex) {
    return '-'
  }
  
  const recent = currentGroupTimes.slice(startIndex, endIndex)
  
  // 确保有5个成绩
  if (recent.length !== 5) {
    return '-'
  }
  
  // 将DNF转换为一个很大的时间值
  const processedTimes = recent.map(t => ({
    ...t,
    effectiveTime: t.status === 'DNF' ? 999999 : (t.time + (t.penalty || 0))
  }))
  
  // 按有效时间排序
  processedTimes.sort((a, b) => a.effectiveTime - b.effectiveTime)
  
  // 去头尾，取中间3个成绩
  const middleTimes = processedTimes.slice(1, -1) // 去掉第一个和最后一个
  
  // 检查中间的成绩中是否有DNF
  const hasDNF = middleTimes.some(t => t.status === 'DNF')
  if (hasDNF) {
    return 'DNF'
  }
  
  // 计算中间3个成绩的平均值
  const total = middleTimes.reduce((sum, t) => sum + t.effectiveTime, 0)
  const average = total / middleTimes.length
  
  return (average / 1000).toFixed(3)
}

// 获取Ao12
const getAo12 = (index) => {
  const currentGroupTimes = groupTimes.value[currentGroupId.value] || []
  if (currentGroupTimes.length === 0) return '-'
  
  // 计算当前成绩的序号（从1开始）
  const currentNumber = currentGroupTimes.length - index
  
  // 如果序号小于12，无法计算ao12
  if (currentNumber < 12) return '-'
  
  // 获取包含当前成绩在内的12个成绩（当前成绩 + 前面的11个成绩）
  // 序号范围：currentNumber-11 到 currentNumber
  const startIndex = currentGroupTimes.length - currentNumber
  const endIndex = currentGroupTimes.length - (currentNumber - 12)
  
  // 安全检查
  if (startIndex < 0 || endIndex > currentGroupTimes.length || startIndex >= endIndex) {
    return '-'
  }
  
  const recent = currentGroupTimes.slice(startIndex, endIndex)
  
  // 确保有12个成绩
  if (recent.length !== 12) {
    return '-'
  }
  
  // 将DNF转换为一个很大的时间值
  const processedTimes = recent.map(t => ({
    ...t,
    effectiveTime: t.status === 'DNF' ? 999999 : (t.time + (t.penalty || 0))
  }))
  
  // 按有效时间排序
  processedTimes.sort((a, b) => a.effectiveTime - b.effectiveTime)
  
  // 去头尾，取中间10个成绩
  const middleTimes = processedTimes.slice(1, -1) // 去掉第一个和最后一个
  
  // 检查中间的成绩中是否有DNF
  const hasDNF = middleTimes.some(t => t.status === 'DNF')
  if (hasDNF) {
    return 'DNF'
  }
  
  // 计算中间10个成绩的平均值
  const total = middleTimes.reduce((sum, t) => sum + t.effectiveTime, 0)
  return (total / middleTimes.length / 1000).toFixed(3)
}

// 更新统计信息
const updateStats = () => {
  const currentGroupTimes = groupTimes.value[currentGroupId.value] || []
  if (currentGroupTimes.length === 0) return
  
  // 当前成绩
  stats.current = formatTime(currentGroupTimes[0].time, currentGroupTimes[0].penalty, currentGroupTimes[0].status)
  
  // 最快成绩（只考虑有效成绩）
  const validTimes = currentGroupTimes.filter(t => t.status !== 'DNF')
  if (validTimes.length > 0) {
    const bestTime = Math.min(...validTimes.map(t => t.time + (t.penalty || 0)))
    stats.best = formatTime(bestTime)
  }
  
  // Ao5
  if (currentGroupTimes.length >= 5) {
    stats.ao5 = formatTime(calculateAverage(currentGroupTimes, 5))
  }
  
  // Ao12
  if (currentGroupTimes.length >= 12) {
    stats.ao12 = formatTime(calculateAverage(currentGroupTimes, 12))
  }
  
  // Ao100
  if (currentGroupTimes.length >= 100) {
    stats.ao100 = formatTime(calculateAverage(currentGroupTimes, 100))
  }
  
  // 计算最佳平均值
  // 最佳Ao5
  if (currentGroupTimes.length >= 5) {
    let bestAo5 = Infinity
    for (let i = 0; i <= currentGroupTimes.length - 5; i++) {
      const avg = calculateAverage(currentGroupTimes.slice(i, i + 5), 5)
      if (avg && avg < bestAo5) bestAo5 = avg
    }
    stats.bestAo5 = formatTime(bestAo5)
  }
  
  // 最佳Ao12
  if (currentGroupTimes.length >= 12) {
    let bestAo12 = Infinity
    for (let i = 0; i <= currentGroupTimes.length - 12; i++) {
      const avg = calculateAverage(currentGroupTimes.slice(i, i + 12), 12)
      if (avg && avg < bestAo12) bestAo12 = avg
    }
    stats.bestAo12 = formatTime(bestAo12)
  }
  
  // 最佳Ao100
  if (currentGroupTimes.length >= 100) {
    let bestAo100 = Infinity
    for (let i = 0; i <= currentGroupTimes.length - 100; i++) {
      const avg = calculateAverage(currentGroupTimes.slice(i, i + 100), 100)
      if (avg && avg < bestAo100) bestAo100 = avg
    }
    stats.bestAo100 = formatTime(bestAo100)
  }
}

// 检查是否是最佳单次成绩
const isBestSingleTime = (index) => {
  const currentGroupTimes = groupTimes.value[currentGroupId.value] || []
  if (currentGroupTimes.length === 0 || index < 0) return false
  
  const validTimes = currentGroupTimes.filter(t => t.status !== 'DNF')
  if (validTimes.length === 0) return false
  
  const bestTime = Math.min(...validTimes.map(t => t.time + (t.penalty || 0)))
  const currentTime = currentGroupTimes[index]
  return currentTime.status !== 'DNF' && (currentTime.time + (currentTime.penalty || 0)) === bestTime
}

// 检查是否是最佳Ao5成绩
const isBestAo5Time = (index) => {
  const currentGroupTimes = groupTimes.value[currentGroupId.value] || []
  if (currentGroupTimes.length < 5 || index < 4) return false
  
  // 计算当前成绩的Ao5
  const currentAo5 = calculateAverage(currentGroupTimes.slice(index, index + 5), 5)
  if (!currentAo5 || currentAo5 === 'DNF') return false
  
  // 计算所有可能的Ao5，找到最佳值
  let bestAo5 = Infinity
  for (let i = 0; i <= currentGroupTimes.length - 5; i++) {
    const avg = calculateAverage(currentGroupTimes.slice(i, i + 5), 5)
    if (avg && avg !== 'DNF' && avg < bestAo5) bestAo5 = avg
  }
  
  return currentAo5 === bestAo5
}

// 检查是否是最佳Ao12成绩
const isBestAo12Time = (index) => {
  const currentGroupTimes = groupTimes.value[currentGroupId.value] || []
  if (currentGroupTimes.length < 12 || index < 11) return false
  
  // 计算当前成绩的Ao12
  const currentAo12 = calculateAverage(currentGroupTimes.slice(index, index + 12), 12)
  if (!currentAo12 || currentAo12 === 'DNF') return false
  
  // 计算所有可能的Ao12，找到最佳值
  let bestAo12 = Infinity
  for (let i = 0; i <= currentGroupTimes.length - 12; i++) {
    const avg = calculateAverage(currentGroupTimes.slice(i, i + 12), 12)
    if (avg && avg !== 'DNF' && avg < bestAo12) bestAo12 = avg
  }
  
  return currentAo12 === bestAo12
}

// 保存成绩到本地存储
const saveTimes = () => {
  localStorage.setItem('cubeTimerGroupTimes', JSON.stringify(groupTimes.value))
}

// 从本地存储加载成绩
const loadTimes = () => {
  const saved = localStorage.getItem('cubeTimerGroupTimes')
  if (saved) {
    groupTimes.value = JSON.parse(saved)
  }
}

// 显示成绩详情
const showTimeDetail = (index) => {
  const currentGroupTimes = groupTimes.value[currentGroupId.value] || []
  if (index >= 0 && index < currentGroupTimes.length) {
    selectedTimeIndex.value = index
    selectedTime.value = currentGroupTimes[index]
    showDetailDialog.value = true
  }
}

// 删除成绩
const deleteTime = () => {
  if (selectedTimeIndex.value >= 0) {
    const currentGroupTimes = groupTimes.value[currentGroupId.value] || []
    if (selectedTimeIndex.value < currentGroupTimes.length) {
      currentGroupTimes.splice(selectedTimeIndex.value, 1)
      saveTimes()
      updateStats()
      showDetailDialog.value = false
      ElMessage.success('成绩已删除')
    }
  }
}

// 重试打乱
const retryScramble = () => {
  generateNewScramble()
  ElMessage.success('打乱已重试')
}

// 保存注释
const saveComment = () => {
  if (selectedTime.value && selectedTimeIndex.value >= 0) {
    const currentGroupTimes = groupTimes.value[currentGroupId.value] || []
    if (selectedTimeIndex.value < currentGroupTimes.length) {
      currentGroupTimes[selectedTimeIndex.value].comment = selectedTime.value.comment
      saveTimes()
      ElMessage.success('注释已保存')
    }
  }
}

// 保存注释并关闭弹窗
const saveCommentAndClose = () => {
  saveComment()
  showDetailDialog.value = false
}

// 应用+2惩罚
const applyPlusTwo = () => {
  if (selectedTime.value && selectedTimeIndex.value >= 0) {
    const currentGroupTimes = groupTimes.value[currentGroupId.value] || []
    if (selectedTimeIndex.value < currentGroupTimes.length) {
      const time = currentGroupTimes[selectedTimeIndex.value]
      time.penalty = 2000 // 2秒 = 2000毫秒
      time.status = '+2'
      saveTimes()
      updateStats()
      ElMessage.success('已应用+2惩罚')
    }
  }
}

// 应用DNF
const applyDNF = () => {
  if (selectedTime.value && selectedTimeIndex.value >= 0) {
    const currentGroupTimes = groupTimes.value[currentGroupId.value] || []
    if (selectedTimeIndex.value < currentGroupTimes.length) {
      const time = currentGroupTimes[selectedTimeIndex.value]
      time.status = 'DNF'
      saveTimes()
      updateStats()
      ElMessage.success('已标记为DNF')
    }
  }
}

// 应用OK（清除惩罚）
const applyOK = () => {
  if (selectedTime.value && selectedTimeIndex.value >= 0) {
    const currentGroupTimes = groupTimes.value[currentGroupId.value] || []
    if (selectedTimeIndex.value < currentGroupTimes.length) {
      const time = currentGroupTimes[selectedTimeIndex.value]
      time.penalty = 0
      time.status = 'OK'
      saveTimes()
      updateStats()
      ElMessage.success('已清除惩罚')
    }
  }
}

// 分组管理
const toggleGroupDropdown = () => {
  showGroupDropdown.value = !showGroupDropdown.value
}

const selectGroup = (groupId) => {
  currentGroupId.value = groupId
  showGroupDropdown.value = false
  
  // 确保分组有成绩数组
  if (!groupTimes.value[groupId]) {
    groupTimes.value[groupId] = []
  }
  
  updateStats() // 更新统计
}

const editCurrentGroup = () => {
  editingGroup.value = currentGroup.value
  newGroupName.value = currentGroup.value.name
  showGroupEditDialog.value = true
}

const editGroup = (group) => {
  editingGroup.value = group
  newGroupName.value = group.name
  showGroupEditDialog.value = true
}

const createNewGroup = () => {
  editingGroup.value = null
  newGroupName.value = ''
  showGroupEditDialog.value = true
}

const saveGroup = () => {
  if (!newGroupName.value.trim()) {
    ElMessage.error('分组名称不能为空')
    return
  }
  
  if (editingGroup.value) {
    // 编辑现有分组
    editingGroup.value.name = newGroupName.value.trim()
    ElMessage.success('分组名称已更新')
  } else {
    // 创建新分组
    const newId = Math.max(...groups.value.map(g => g.id)) + 1
    groups.value.push({
      id: newId,
      name: newGroupName.value.trim(),
      isDefault: false
    })
    currentGroupId.value = newId
    groupTimes.value[newId] = [] // 初始化新分组的成绩数组
    ElMessage.success('新分组已创建')
  }
  
  showGroupEditDialog.value = false
  saveGroups()
}

const deleteGroup = (groupId) => {
  if (groups.value.length <= 1) {
    ElMessage.error('至少需要保留一个分组')
    return
  }
  
  ElMessageBox.confirm(
    '确定要删除这个分组吗？删除后该分组的所有成绩将无法恢复。',
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    // 删除分组
    groups.value = groups.value.filter(g => g.id !== groupId)
    
    // 如果删除的是当前分组，切换到第一个分组
    if (currentGroupId.value === groupId) {
      currentGroupId.value = groups.value[0].id
    }
    
    // 删除该分组的所有成绩
    groupTimes.value[groupId] = [] // 删除分组的成绩数组
    
    ElMessage.success('分组已删除')
    saveGroups()
    saveTimes()
  }).catch(() => {
    // 用户取消删除
  })
}

const deleteCurrentGroup = () => {
  if (!editingGroup.value || editingGroup.value.isDefault) {
    ElMessage.error('默认分组不能删除')
    return
  }
  
  if (groups.value.length <= 1) {
    ElMessage.error('至少需要保留一个分组')
    return
  }
  
  ElMessageBox.confirm(
    '您确定要删除该分组吗？删除后该分组的所有成绩将无法恢复。',
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    const groupId = editingGroup.value.id
    
    // 删除分组
    groups.value = groups.value.filter(g => g.id !== groupId)
    
    // 如果删除的是当前分组，切换到第一个分组
    if (currentGroupId.value === groupId) {
      currentGroupId.value = groups.value[0].id
    }
    
    // 删除该分组的所有成绩
    groupTimes.value[groupId] = [] // 删除分组的成绩数组
    
    ElMessage.success('分组已删除')
    showGroupEditDialog.value = false
    saveGroups()
    saveTimes()
    updateStats()
  }).catch(() => {
    // 用户取消删除
  })
}

const saveGroups = () => {
  localStorage.setItem('cubeTimerGroups', JSON.stringify(groups.value))
  localStorage.setItem('cubeTimerCurrentGroup', currentGroupId.value.toString())
}

const loadGroups = () => {
  const savedGroups = localStorage.getItem('cubeTimerGroups')
  if (savedGroups) {
    groups.value = JSON.parse(savedGroups)
  }
  
  const savedCurrentGroup = localStorage.getItem('cubeTimerCurrentGroup')
  if (savedCurrentGroup) {
    currentGroupId.value = parseInt(savedCurrentGroup)
  }
  
  // 确保所有分组都有成绩数组
  groups.value.forEach(group => {
    if (!groupTimes.value[group.id]) {
      groupTimes.value[group.id] = []
    }
  })
}

// 检查是否曾经打破过记录（只检查单次记录）
const isNewRecord = (index) => {
  const currentGroupTimes = groupTimes.value[currentGroupId.value] || []
  if (currentGroupTimes.length === 0 || index < 0) return false

  const currentTime = currentGroupTimes[index]
  const currentTimeValue = currentTime.time + (currentTime.penalty || 0)
  
  // 只检查是否曾经是最佳单次记录
  if (currentTime.status !== 'DNF' && currentTimeValue <= getBestSingleTimeBefore(index)) {
    return true
  }
  
  return false
}

// 检查ao5列是否应该变色
const isAo5Record = (index) => {
  const currentGroupTimes = groupTimes.value[currentGroupId.value] || []
  if (currentGroupTimes.length === 0 || index < 0) return false
  
  // 计算当前成绩的序号（从1开始）
  const currentNumber = currentGroupTimes.length - index
  
  // 如果序号小于5，无法计算ao5
  if (currentNumber < 5) return false
  
  // 获取包含当前成绩在内的5个成绩
  const startIndex = currentGroupTimes.length - currentNumber
  const endIndex = currentGroupTimes.length - (currentNumber - 5)
  
  if (startIndex < 0 || endIndex > currentGroupTimes.length || startIndex >= endIndex) {
    return false
  }
  
  const recent = currentGroupTimes.slice(startIndex, endIndex)
  if (recent.length !== 5) return false
  
  const currentAo5 = calculateAverage(recent, 5)
  if (!currentAo5 || currentAo5 === 'DNF') return false
  
  // 检查该ao5是否曾经是最佳ao5
  return currentAo5 <= getBestAo5TimeBefore(index)
}

// 检查ao12列是否应该变色
const isAo12Record = (index) => {
  const currentGroupTimes = groupTimes.value[currentGroupId.value] || []
  if (currentGroupTimes.length === 0 || index < 0) return false
  
  // 计算当前成绩的序号（从1开始）
  const currentNumber = currentGroupTimes.length - index
  
  // 如果序号小于12，无法计算ao12
  if (currentNumber < 12) return false
  
  // 获取包含当前成绩在内的12个成绩
  const startIndex = currentGroupTimes.length - currentNumber
  const endIndex = currentGroupTimes.length - (currentNumber - 12)
  
  if (startIndex < 0 || endIndex > currentGroupTimes.length || startIndex >= endIndex) {
    return false
  }
  
  const recent = currentGroupTimes.slice(startIndex, endIndex)
  if (recent.length !== 12) return false
  
  const currentAo12 = calculateAverage(recent, 12)
  if (!currentAo12 || currentAo12 === 'DNF') return false
  
  // 检查该ao12是否曾经是最佳ao12
  return currentAo12 <= getBestAo12TimeBefore(index)
}

// 获取该成绩之前的最佳单次时间
const getBestSingleTimeBefore = (index) => {
  const currentGroupTimes = groupTimes.value[currentGroupId.value] || []
  const beforeTimes = currentGroupTimes.slice(index + 1) // 该成绩之前的成绩
  if (beforeTimes.length === 0) return Infinity
  
  const validTimes = beforeTimes.filter(t => t.status !== 'DNF')
  if (validTimes.length === 0) return Infinity
  
  return Math.min(...validTimes.map(t => t.time + (t.penalty || 0)))
}

// 获取该成绩之前的最佳Ao5时间
const getBestAo5TimeBefore = (index) => {
  const currentGroupTimes = groupTimes.value[currentGroupId.value] || []
  const beforeTimes = currentGroupTimes.slice(index + 1) // 该成绩之前的成绩
  if (beforeTimes.length < 4) return Infinity
  
  let bestAo5 = Infinity
  for (let i = 0; i <= beforeTimes.length - 5; i++) {
    const avg = calculateAverage(beforeTimes.slice(i, i + 5), 5)
    if (avg && avg !== 'DNF' && avg < bestAo5) {
      bestAo5 = avg
    }
  }
  return bestAo5
}

// 获取该成绩之前的最佳Ao12时间
const getBestAo12TimeBefore = (index) => {
  const currentGroupTimes = groupTimes.value[currentGroupId.value] || []
  const beforeTimes = currentGroupTimes.slice(index + 1) // 该成绩之前的成绩
  if (beforeTimes.length < 11) return Infinity
  
  let bestAo12 = Infinity
  for (let i = 0; i <= beforeTimes.length - 12; i++) {
    const avg = calculateAverage(beforeTimes.slice(i, i + 12), 12)
    if (avg && avg !== 'DNF' && avg < bestAo12) {
      bestAo12 = avg
    }
  }
  return bestAo12
}

// 获取该成绩之前的最佳Ao100时间
const getBestAo100TimeBefore = (index) => {
  const currentGroupTimes = groupTimes.value[currentGroupId.value] || []
  const beforeTimes = currentGroupTimes.slice(index + 1) // 该成绩之前的成绩
  if (beforeTimes.length < 99) return Infinity
  
  let bestAo100 = Infinity
  for (let i = 0; i <= beforeTimes.length - 100; i++) {
    const avg = calculateAverage(beforeTimes.slice(i, i + 100), 100)
    if (avg && avg !== 'DNF' && avg < bestAo100) {
      bestAo100 = avg
    }
  }
  return bestAo100
}

// 生命周期
onMounted(() => {
  loadTimes()
  loadGroups() // 加载分组
  loadScrambleType() // 加载打乱类型
  generateNewScramble()
  
  // 添加全局键盘事件监听
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('keyup', handleKeyUp)
  
  // ...原有代码...
  const localBg = localStorage.getItem('cubeTimerBgImage')
  if (localBg) bgImageUrl.value = localBg
})

onUnmounted(() => {
  // 移除键盘事件监听
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('keyup', handleKeyUp)
  
  // 清理定时器
  if (rafId.value) {
    cancelAnimationFrame(rafId.value)
  }
  
  // 清理粒子动画
  if (particleAnimationId.value) {
    cancelAnimationFrame(particleAnimationId.value)
  }
})

// 打乱类型管理
const toggleScrambleType = () => {
  // 切换到下一个打乱类型
  const currentIndex = scrambleTypes.value.findIndex(t => t.id === currentScrambleTypeId.value)
  const nextIndex = (currentIndex + 1) % scrambleTypes.value.length
  const nextType = scrambleTypes.value[nextIndex]
  
  currentScrambleTypeId.value = nextType.id
  
  // 生成新打乱
  generateNewScramble()
  
  // 保存选择到本地存储
  saveScrambleType()
}

const selectScrambleType = (typeId) => {
  currentScrambleTypeId.value = typeId
  
  // 生成新打乱
  generateNewScramble()
  
  // 保存选择到本地存储
  saveScrambleType()
}

const saveScrambleType = () => {
  localStorage.setItem('cubeTimerScrambleType', currentScrambleTypeId.value)
}

const loadScrambleType = () => {
  const savedType = localStorage.getItem('cubeTimerScrambleType')
  if (savedType) {
    currentScrambleTypeId.value = savedType
  }
}

// 背景图片处理
const bgImageUrl = ref('')
const showBgUpload = ref(false)

// 粒子效果相关
const showParticles = ref(false)
const particles = ref([])
const particleAnimationId = ref(null)

// 裁剪相关
const cropImage = ref(false)
const tempImageUrl = ref('')
const cropPreview = ref(null)
const cropImageRef = ref(null)
const cropOverlay = ref(null)
const cropData = ref({
  x: 0,
  y: 0,
  width: 0,
  height: 0
})

const bgImageStyle = computed(() => ({
  background: bgImageUrl.value
    ? `linear-gradient(rgba(230,242,253,0.7),rgba(187,222,251,0.7)), url(${bgImageUrl.value})`
    : '',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
}))

const handleBgUpload = (file) => {
  console.log('开始处理图片上传:', file)
  
  const reader = new FileReader()
  reader.onload = (e) => {
    console.log('图片读取完成，直接应用背景')
    bgImageUrl.value = e.target.result
    localStorage.setItem('cubeTimerBgImage', e.target.result)
    showBgUpload.value = false
    ElMessage.success('背景图片已设置')
  }
  reader.onerror = () => {
    console.error('图片读取失败')
    ElMessage.error('图片加载失败，请重试')
  }
  reader.readAsDataURL(file)
  return false // 阻止el-upload自动上传
}

const initCrop = () => {
  // 等待DOM更新后初始化裁剪
  nextTick(() => {
    // 延迟一点时间确保DOM完全渲染
    setTimeout(() => {
      console.log('开始初始化裁剪，元素状态:', {
        cropImageRef: cropImageRef.value,
        cropOverlay: cropOverlay.value,
        tempImageUrl: tempImageUrl.value
      })
      
      if (cropImageRef.value && cropOverlay.value && tempImageUrl.value) {
        const img = cropImageRef.value
        const overlay = cropOverlay.value
        
        // 等待图片完全加载
        if (img.complete && img.naturalWidth > 0) {
          setupCrop()
        } else {
          img.onload = setupCrop
          img.onerror = () => {
            console.error('图片加载失败')
            ElMessage.error('图片加载失败，请重试')
          }
        }
        
        function setupCrop() {
          console.log('图片加载完成，尺寸:', {
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            offsetWidth: img.offsetWidth,
            offsetHeight: img.offsetHeight
          })
          
          // 设置默认裁剪区域为图片中心的正方形
          const size = Math.min(img.naturalWidth, img.naturalHeight) * 0.8
          const x = (img.naturalWidth - size) / 2
          const y = (img.naturalHeight - size) / 2
          
          cropData.value = { x, y, width: size, height: size }
          
          // 更新裁剪框显示
          updateCropOverlay()
          
          // 添加拖拽功能
          addDragListeners()
          
          console.log('裁剪初始化完成', cropData.value)
        }
      } else {
        console.error('裁剪元素未找到', { 
          img: cropImageRef.value, 
          overlay: cropOverlay.value,
          tempImageUrl: tempImageUrl.value
        })
        
        // 尝试重试一次
        setTimeout(() => {
          if (cropImageRef.value && cropOverlay.value && tempImageUrl.value) {
            console.log('重试成功，开始初始化裁剪')
            initCrop()
          } else {
            console.error('重试失败，裁剪元素仍未找到')
            ElMessage.error('裁剪初始化失败，请重试')
          }
        }, 100) // 延迟50ms确保DOM完全渲染
      }
    }, 50) // 延迟50ms确保DOM完全渲染
  })
}

const updateCropOverlay = () => {
  if (cropOverlay.value && cropImageRef.value) {
    const img = cropImageRef.value
    const overlay = cropOverlay.value
    
    // 检查图片是否已加载
    if (!img.complete || img.naturalWidth === 0) {
      console.log('图片未完全加载，跳过更新裁剪框')
      return
    }
    
    // 计算缩放比例
    const scaleX = img.offsetWidth / img.naturalWidth
    const scaleY = img.offsetHeight / img.naturalHeight
    
    console.log('更新裁剪框，缩放比例:', { scaleX, scaleY })
    
    // 设置裁剪框位置和大小
    overlay.style.left = cropData.value.x * scaleX + 'px'
    overlay.style.top = cropData.value.y * scaleY + 'px'
    overlay.style.width = cropData.value.width * scaleX + 'px'
    overlay.style.height = cropData.value.height * scaleY + 'px'
    
    console.log('裁剪框已更新', {
      cropData: cropData.value,
      scale: { scaleX, scaleY },
      overlay: {
        left: overlay.style.left,
        top: overlay.style.top,
        width: overlay.style.width,
        height: overlay.style.height
      }
    })
  } else {
    console.error('更新裁剪框失败，元素未找到')
  }
}

const addDragListeners = () => {
  if (!cropOverlay.value || !cropImageRef.value) return
  
  const overlay = cropOverlay.value
  const img = cropImageRef.value
  let isDragging = false
  let startX = 0
  let startY = 0
  let startCropX = 0
  let startCropY = 0
  
  const onMouseDown = (e) => {
    e.preventDefault() // 防止默认行为
    isDragging = true
    startX = e.clientX
    startY = e.clientY
    startCropX = cropData.value.x
    startCropY = cropData.value.y
    
    // 添加事件监听器到document
    document.addEventListener('mousemove', onMouseMove, { passive: false })
    document.addEventListener('mouseup', onMouseUp, { passive: false })
    
    // 防止文本选择
    document.body.style.userSelect = 'none'
    document.body.style.webkitUserSelect = 'none'
  }
  
  const onMouseMove = (e) => {
    if (!isDragging) return
    
    e.preventDefault() // 防止默认行为
    
    const deltaX = e.clientX - startX
    const deltaY = e.clientY - startY
    
    // 计算缩放比例
    const scaleX = img.naturalWidth / img.offsetWidth
    const scaleY = img.naturalHeight / img.offsetHeight
    
    // 更新裁剪位置
    const newX = startCropX + deltaX * scaleX
    const newY = startCropY + deltaY * scaleY
    
    // 限制在图片范围内
    cropData.value.x = Math.max(0, Math.min(newX, img.naturalWidth - cropData.value.width))
    cropData.value.y = Math.max(0, Math.min(newY, img.naturalHeight - cropData.value.height))
    
    updateCropOverlay()
  }
  
  const onMouseUp = (e) => {
    isDragging = false
    
    // 移除事件监听器
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    
    // 恢复文本选择
    document.body.style.userSelect = ''
    document.body.style.webkitUserSelect = ''
  }
  
  // 添加触摸事件支持（移动端）
  const onTouchStart = (e) => {
    e.preventDefault()
    if (e.touches.length === 1) {
      isDragging = true
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
      startCropX = cropData.value.x
      startCropY = cropData.value.y
      
      document.addEventListener('touchmove', onTouchMove, { passive: false })
      document.addEventListener('touchend', onTouchEnd, { passive: false })
    }
  }
  
  const onTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return
    
    e.preventDefault()
    
    const deltaX = e.touches[0].clientX - startX
    const deltaY = e.touches[0].clientY - startY
    
    // 计算缩放比例
    const scaleX = img.naturalWidth / img.offsetWidth
    const scaleY = img.naturalHeight / img.offsetHeight
    
    // 更新裁剪位置
    const newX = startCropX + deltaX * scaleX
    const newY = startCropY + deltaY * scaleY
    
    // 限制在图片范围内
    cropData.value.x = Math.max(0, Math.min(newX, img.naturalWidth - cropData.value.width))
    cropData.value.y = Math.max(0, Math.min(newY, img.naturalHeight - cropData.value.height))
    
    updateCropOverlay()
  }
  
  const onTouchEnd = (e) => {
    isDragging = false
    document.removeEventListener('touchmove', onTouchMove)
    document.removeEventListener('touchend', onTouchEnd)
  }
  
  // 添加鼠标事件监听器
  overlay.addEventListener('mousedown', onMouseDown)
  
  // 添加触摸事件监听器
  overlay.addEventListener('touchstart', onTouchStart)
  
  // 清理函数
  return () => {
    overlay.removeEventListener('mousedown', onMouseDown)
    overlay.removeEventListener('touchstart', onTouchStart)
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    document.removeEventListener('touchmove', onTouchMove)
    document.removeEventListener('touchend', onTouchEnd)
  }
}

const cancelCrop = () => {
  cropImage.value = false
  tempImageUrl.value = ''
  cropData.value = { x: 0, y: 0, width: 0, height: 0 }
}

const applyCrop = () => {
  console.log('开始应用裁剪，检查元素状态:', {
    cropImageRef: cropImageRef.value,
    cropData: cropData.value
  })
  
  // 创建canvas进行裁剪
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const img = cropImageRef.value
  
  if (!img) {
    ElMessage.error('图片元素未找到，请重试')
    return
  }
  
  if (!img.complete) {
    ElMessage.error('图片未完全加载，请稍后再试')
    return
  }
  
  if (img.naturalWidth === 0 || img.naturalHeight === 0) {
    ElMessage.error('图片尺寸无效，请重试')
    return
  }
  
  console.log('图片状态检查通过:', {
    complete: img.complete,
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
    src: img.src
  })
  
  canvas.width = cropData.value.width
  canvas.height = cropData.value.height
  
  try {
    // 确保图片是HTMLImageElement类型
    if (!(img instanceof HTMLImageElement)) {
      throw new Error('图片元素类型不正确')
    }
    
    console.log('开始绘制裁剪图片:', {
      sourceX: cropData.value.x,
      sourceY: cropData.value.y,
      sourceWidth: cropData.value.width,
      sourceHeight: cropData.value.height,
      destX: 0,
      destY: 0,
      destWidth: cropData.value.width,
      destHeight: cropData.value.height
    })
    
    // 绘制裁剪后的图片
    ctx.drawImage(
      img,
      cropData.value.x, cropData.value.y, cropData.value.width, cropData.value.height,
      0, 0, cropData.value.width, cropData.value.height
    )
    
    // 转换为base64并保存
    const croppedImageUrl = canvas.toDataURL('image/jpeg', 0.8)
    bgImageUrl.value = croppedImageUrl
    localStorage.setItem('cubeTimerBgImage', croppedImageUrl)
    
    // 关闭裁剪界面
    cropImage.value = false
    tempImageUrl.value = ''
    showBgUpload.value = false
    
    console.log('裁剪成功完成')
    ElMessage.success('背景图片已设置')
  } catch (error) {
    console.error('裁剪失败:', error)
    ElMessage.error('裁剪失败，请重试')
  }
}

const removeBackgroundImage = () => {
  bgImageUrl.value = ''
  localStorage.removeItem('cubeTimerBgImage')
}

const useDefaultBackground = () => {
  bgImageUrl.value = ''
  localStorage.removeItem('cubeTimerBgImage')
  showBgUpload.value = false
}

// 触发粒子效果
const triggerParticleEffect = () => {
  console.log('触发粒子效果，当前粒子数量:', particles.value.length)
  
  // 先停止之前的动画
  if (particleAnimationId.value) {
    cancelAnimationFrame(particleAnimationId.value)
    particleAnimationId.value = null
    console.log('停止之前的动画')
  }
  
  // 清除之前的粒子
  particles.value = []
  showParticles.value = false
  
  // 等待一帧确保清理完成
  nextTick(() => {
    showParticles.value = true
    
    // 创建粒子
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2
    
    for (let i = 0; i < 100; i++) { // 增加到100个粒子
      const angle = (Math.PI * 2 * i) / 100
      const velocity = 4 + Math.random() * 6 // 增加速度范围
      const distance = 100 + Math.random() * 200 // 增加距离范围
      
      particles.value.push({
        id: i,
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        rotation: Math.random() * 360,
        scale: 0.3 + Math.random() * 1.5, // 增加缩放范围
        opacity: 1,
        color: getRandomParticleColor(),
        life: 150 + Math.random() * 100 // 增加生命值
      })
    }
    
    console.log('创建了', particles.value.length, '个新粒子')
    
    // 开始动画
    animateParticles()
  })
}

// 获取随机粒子颜色
const getRandomParticleColor = () => {
  const colors = [
    '#FF6B6B', // 红色
    '#4ECDC4', // 青色
    '#45B7D1', // 蓝色
    '#96CEB4', // 绿色
    '#FFEAA7', // 黄色
    '#DDA0DD', // 紫色
    '#FFB347', // 橙色
    '#87CEEB'  // 天蓝色
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

// 动画粒子
const animateParticles = () => {
  // 检查是否还有粒子
  if (particles.value.length === 0) {
    showParticles.value = false
    particleAnimationId.value = null
    return
  }
  
  particles.value.forEach(particle => {
    // 更新位置
    particle.x += particle.vx
    particle.y += particle.vy
    
    // 添加重力效果（减小重力）
    particle.vy += 0.05
    
    // 更新旋转
    particle.rotation += 3
    
    // 更新透明度（减慢消失速度）
    particle.opacity -= 0.01
    
    // 更新生命值
    particle.life -= 0.8
  })
  
  // 移除死亡的粒子
  particles.value = particles.value.filter(particle => particle.life > 0)
  
  // 继续动画
  particleAnimationId.value = requestAnimationFrame(animateParticles)
}
</script>

<style scoped>
/* 全局样式 - 隐藏所有滚动条 */
:deep(*) {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

:deep(*::-webkit-scrollbar) {
  display: none !important;
}

.cube-timer {
  position: relative;
  z-index: 1;
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  color: #333;
  overflow: hidden;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 返回主页按钮 */
.back-button-container {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1000;
}

.back-button {
  background-color: rgba(255, 255, 255, 0.9);
  border-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  color: #333;
  font-size: 18px;
}

.back-button:hover {
  background-color: rgba(255, 255, 255, 1);
  border-color: rgba(255, 255, 255, 1);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

/* 顶部导航栏 */
.top-navbar {
  height: 60px;
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
}

.nav-center {
  display: flex;
  gap: 10px;
  align-items: center;
}

.nav-text {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.scramble-hint {
  font-size: 12px;
  color: #999;
  margin-left: 8px;
  opacity: 0.7;
  font-weight: normal;
}

/* 打乱选择器 */
.scramble-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.2s ease;
  position: relative;
  white-space: nowrap;
  min-width: fit-content;
}

.scramble-selector:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.scramble-selector .dropdown-icon {
  font-size: 14px;
  transition: transform 0.2s ease;
}

.scramble-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  padding: 6px 0;
  z-index: 1000;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  margin-top: 8px;
  width: auto;
  min-width: 120px;
}

.scramble-item {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 12px;
  color: #333;
}

.scramble-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.scramble-item.active {
  background: rgba(64, 158, 255, 0.1);
  color: #409eff;
  font-weight: 600;
}

/* 主内容区域 */
.main-container {
  flex: 1;
  display: flex;
  padding: 30px;
  gap: 30px;
  min-height: 0;
  width: 100%;
  overflow: hidden;
}

/* 左侧边栏 */
.sidebar {
  flex: 0 0 25%; /* 使用百分比宽度 */
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.5);
  overflow: visible;
  height: 100%;
  min-height: 0;
}

.app-title {
  margin-bottom: 20px;
  text-align: center;
}

.title-text {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.group-tag {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 15px;
  padding: 6px 12px;
  margin-bottom: 20px;
  font-size: 12px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s ease;
}

.group-tag:hover {
  background: rgba(255, 255, 255, 0.3);
}

.group-tag span {
  font-weight: bold;
  margin-right: 8px;
}

.dropdown-icon {
  font-size: 12px;
  transition: transform 0.2s ease;
}

.group-tag-container {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.edit-group-btn {
  margin-left: 8px;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s ease;
  align-self: center;
  margin-bottom: 20px;
}

.edit-group-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.group-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  padding: 6px 0;
  z-index: 1000;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  max-height: 250px;
  overflow-y: auto;
}

.group-item {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 12px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.group-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.group-item.active {
  background: rgba(64, 158, 255, 0.1);
  color: #409eff;
}

.group-item span {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.1);
  margin: 4px 0;
}

.new-group {
  color: #409eff;
  font-weight: 500;
}

.new-group .el-icon {
  margin-right: 6px;
  font-size: 12px;
}

.stats-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 30px;
  table-layout: fixed;
}

.stats-table table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.stats-table th, .stats-table td {
  padding: 6px 8px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  box-sizing: border-box;
  word-wrap: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stats-table th:first-child, .stats-table td:first-child {
  width: 30%;
  text-align: left;
}

.stats-table th:not(:first-child), .stats-table td:not(:first-child) {
  width: 35%;
}

.stats-table th {
  font-size: 14px;
  opacity: 0.7;
  color: #666;
}

.stats-table td {
  font-size: 16px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  color: #333;
}

.row-label {
  font-family: inherit !important;
  font-weight: 600 !important;
  color: #666 !important;
  font-size: 14px !important;
}

.overall-stats {
  width: 100%;
  text-align: center;
  margin-bottom: 20px;
}

.solve-count {
  font-size: 18px;
  color: #333;
  margin-bottom: 8px;
}

.average-time {
  font-size: 14px;
  color: #666;
}

.times-list {
  width: 100%;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 15px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  overflow: hidden;
  max-height: 400px;
  flex: 1;
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

.times-list::-webkit-scrollbar {
  width: 6px;
}

.times-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.times-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
}

.times-list::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.5);
}

.list-header {
  display: grid;
  grid-template-columns: 50px 1fr 70px 70px;
  gap: 12px;
  padding: 0 0 15px 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  font-size: 11px;
  color: #666;
}

.list-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.time-item {
  display: grid;
  grid-template-columns: 50px 1fr 70px 70px;
  gap: 12px;
  padding: 12px 0 12px 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: background-color 0.2s;
  align-items: center;
}

.time-item:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 多重记录的情况 */
.time-item.new-record .time-value {
  color:rgb(255, 68, 111); /* 深蓝色 */
  font-weight: 900;
}

.time-ao5.new-record {
  color: rgb(255, 68, 111) !important;
  font-weight: 900;
}

.time-ao12.new-record {
  color: rgb(255, 68, 111) !important;
  font-weight: 900;
}

.time-index {
  font-weight: bold;
  color: #666;
  font-size: 13px;
}

.time-value {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.time-ao5, .time-ao12 {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  font-weight: bold;
  color: #333;
}

/* 主计时区域 */
.timer-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  gap: 50px;
  min-height: 0;
  width: 100%;
}

.scramble-display {
  font-size: 24px;
  font-weight: 500;
  max-width: 600px;
  text-align: center;
  line-height: 1.4;
  color: #333;
  margin-bottom: 20px;
}

.timer-display {
  /* 移除白色背景容器 */
  background: none;
  backdrop-filter: none;
  border: none;
  border-radius: 0;
  padding: 100px 120px;
  cursor: pointer;
  transition: none;
  user-select: none;
  outline: none;
  text-align: center;
  min-width: 500px;
  position: relative;
  box-shadow: none;
}

.timer-display:hover {
  transform: none;
  border-color: none;
  box-shadow: none;
}

.timer-display.timer-ready {
  background: none;
  border-color: none;
}

.timer-display.timer-ready .timer-text {
  color: #67c23a; /* 绿色 */
}

.timer-display.timer-running {
  background: none;
  border-color: none;
}

.timer-display.timer-running .timer-text {
  color: #333; /* 运行时保持黑色 */
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

.timer-text {
  font-size: 120px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  margin-bottom: 15px;
  color: #333;
}

.penalty-text {
  font-size: 36px;
  color: #ff6b6b;
  font-weight: bold;
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
}

.average-display {
  display: flex;
  gap: 30px;
  margin-top: 20px;
  max-width: 800px;
  width: 100%;
}

.avg-item {
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 20px;
  padding: 20px;
  text-align: center;
  transition: transform 0.2s ease;
}

.avg-item:hover {
  transform: translateY(-3px);
}

.avg-label {
  font-size: 14px;
  opacity: 0.7;
  margin-bottom: 8px;
  color: #666;
}

.avg-value {
  font-size: 24px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  color: #333;
}

.help-button {
  position: absolute;
  bottom: 30px;
  right: 30px;
}

/* 弹窗样式 */
.time-detail-dialog .el-dialog__header {
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
  padding: 15px 20px;
  border-radius: 8px 8px 0 0;
}

.time-detail-dialog .el-dialog__header .el-dialog__title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.time-detail-dialog .el-dialog__body {
  padding: 20px 20px 10px 20px;
  background-color: #fefefe;
}

.time-detail-dialog .el-dialog__footer {
  padding: 15px 20px;
  border-top: 1px solid #ebeef5;
  background-color: #f9fafc;
}

.time-detail-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.detail-time-display {
  font-size: 48px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  color: #333;
  text-align: center;
  margin-bottom: 15px;
  padding: 20px 0;
}

.detail-action-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
  gap: 20px;
}

.action-item {
  padding: 8px 15px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
}

.action-item:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.action-item .el-icon {
  font-size: 16px;
}

.action-ok {
  background-color: #409eff;
}

.action-penalty {
  background-color: #67c23a;
}

.action-dnf {
  background-color: #f56c6c;
}

.action-close {
  background-color: #909399;
  border: 2px solid #dcdfe6;
  color: #333;
}

.action-divider {
  width: 1px;
  height: 20px;
  background-color: #ebeef5;
}

.detail-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.field-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  transition: border-color 0.2s ease;
  background-color: #fff;
}

.field-input:focus {
  border-color: #409eff;
  outline: none;
}

.scramble-label {
  color: #409eff;
  font-weight: 600;
}

.field-value {
  font-size: 14px;
  font-family: 'Courier New', monospace;
  color: #333;
  font-weight: 500;
  word-break: break-all;
  white-space: pre-wrap;
  padding: 8px 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background-color: #f9fafc;
  line-height: 1.4;
}

.detail-footer-buttons {
  display: flex;
  justify-content: space-around;
  gap: 10px;
}

.detail-footer-buttons .el-button {
  flex: 1;
  border-radius: 8px;
  font-weight: 500;
  border: none;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.detail-footer-buttons .el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.detail-footer-buttons .el-button--primary {
  background: radial-gradient(circle, rgba(64, 158, 255, 0.2) 0%, rgba(64, 158, 255, 0.1) 50%, rgba(64, 158, 255, 0.05) 100%);
  color: #409eff;
}

.detail-footer-buttons .el-button--primary:hover {
  background: radial-gradient(circle, rgba(64, 158, 255, 0.3) 0%, rgba(64, 158, 255, 0.2) 50%, rgba(64, 158, 255, 0.1) 100%);
}

.detail-footer-buttons .el-button--danger {
  background: radial-gradient(circle, rgba(245, 108, 108, 0.2) 0%, rgba(245, 108, 108, 0.1) 50%, rgba(245, 108, 108, 0.05) 100%);
  color: #f56c6c;
}

.detail-footer-buttons .el-button--danger:hover {
  background: radial-gradient(circle, rgba(245, 108, 108, 0.3) 0%, rgba(245, 108, 108, 0.2) 50%, rgba(245, 108, 108, 0.1) 100%);
}

.detail-footer-buttons .el-button:not(.el-button--primary):not(.el-button--danger) {
  background: radial-gradient(circle, rgba(103, 194, 58, 0.2) 0%, rgba(103, 194, 58, 0.1) 50%, rgba(103, 194, 58, 0.05) 100%);
  color: #67c23a;
}

.detail-footer-buttons .el-button:not(.el-button--primary):not(.el-button--danger):hover {
  background: radial-gradient(circle, rgba(103, 194, 58, 0.3) 0%, rgba(103, 194, 58, 0.2) 50%, rgba(103, 194, 58, 0.1) 100%);
}

/* 弹窗样式 */
.group-edit-dialog .el-dialog__header {
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
  padding: 15px 20px;
  border-radius: 8px 8px 0 0;
}

.group-edit-dialog .el-dialog__header .el-dialog__title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.group-edit-dialog .el-dialog__body {
  padding: 20px 20px 10px 20px;
  background-color: #fefefe;
}

.group-edit-dialog .el-dialog__footer {
  padding: 15px 20px;
  border-top: 1px solid #ebeef5;
  background-color: #f9fafc;
}

.group-edit-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.edit-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.field-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  transition: border-color 0.2s ease;
  background-color: #fff;
}

.field-input:focus {
  border-color: #409eff;
  outline: none;
}

.scramble-label {
  color: #409eff;
  font-weight: 600;
}

.field-value {
  font-size: 14px;
  font-family: 'Courier New', monospace;
  color: #333;
  font-weight: 500;
  word-break: break-all;
  white-space: pre-wrap;
  padding: 8px 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background-color: #f9fafc;
  line-height: 1.4;
}

.detail-footer-buttons {
  display: flex;
  justify-content: space-around;
  gap: 10px;
}

.detail-footer-buttons .el-button {
  flex: 1;
  border-radius: 8px;
  font-weight: 500;
  border: none;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.detail-footer-buttons .el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.detail-footer-buttons .el-button--primary {
  background: radial-gradient(circle, rgba(64, 158, 255, 0.2) 0%, rgba(64, 158, 255, 0.1) 50%, rgba(64, 158, 255, 0.05) 100%);
  color: #409eff;
}

.detail-footer-buttons .el-button--primary:hover {
  background: radial-gradient(circle, rgba(64, 158, 255, 0.3) 0%, rgba(64, 158, 255, 0.2) 50%, rgba(64, 158, 255, 0.1) 100%);
}

.detail-footer-buttons .el-button--danger {
  background: radial-gradient(circle, rgba(245, 108, 108, 0.2) 0%, rgba(245, 108, 108, 0.1) 50%, rgba(245, 108, 108, 0.05) 100%);
  color: #f56c6c;
}

.detail-footer-buttons .el-button--danger:hover {
  background: radial-gradient(circle, rgba(245, 108, 108, 0.3) 0%, rgba(245, 108, 108, 0.2) 50%, rgba(245, 108, 108, 0.1) 100%);
}

.detail-footer-buttons .el-button:not(.el-button--primary):not(.el-button--danger) {
  background: radial-gradient(circle, rgba(103, 194, 58, 0.2) 0%, rgba(103, 194, 58, 0.1) 50%, rgba(103, 194, 58, 0.05) 100%);
  color: #67c23a;
}

.detail-footer-buttons .el-button:not(.el-button--primary):not(.el-button--danger):hover {
  background: radial-gradient(circle, rgba(103, 194, 58, 0.3) 0%, rgba(103, 194, 58, 0.2) 50%, rgba(103, 194, 58, 0.1) 100%);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .timer-text {
    font-size: 80px;
  }
  
  .timer-display {
    padding: 70px 80px;
    min-width: 400px;
  }
  
  .penalty-text {
    font-size: 28px;
  }
  
  .average-display {
    max-width: 700px;
    gap: 25px;
  }
  
  .avg-value {
    font-size: 20px;
  }
}

@media (max-width: 768px) {
  .top-navbar {
    height: 50px;
    padding: 0 15px;
  }
  
  .nav-center {
    gap: 8px;
  }
  
  .nav-text {
    font-size: 16px;
  }
  
  .scramble-hint {
    font-size: 10px;
    margin-left: 5px;
  }
  
  .scramble-selector {
    padding: 6px 10px;
    gap: 6px;
    white-space: nowrap;
    min-width: fit-content;
  }
  
  .scramble-selector .nav-text {
    font-size: 14px;
  }
  
  .scramble-selector .dropdown-icon {
    font-size: 12px;
  }
  
  .scramble-dropdown {
    margin-top: 6px;
    min-width: 100px;
  }
  
  .main-container {
    padding: 15px;
    gap: 15px;
    flex-direction: column;
  }
  
  .sidebar {
    flex: none;
    width: 100%;
    padding: 15px;
    order: 2;
  }
  
  .timer-main {
    flex: none;
    width: 100%;
    padding: 30px 15px;
    gap: 30px;
    order: 1;
  }
  
  .title-text {
    font-size: 20px;
  }
  
  .group-tag {
    padding: 6px 12px;
    margin-bottom: 15px;
    font-size: 12px;
  }
  
  .stats-table th, .stats-table td {
    padding: 6px 8px;
    box-sizing: border-box;
  }
  
  .stats-table th:first-child, .stats-table td:first-child {
    width: 30%;
  }
  
  .stats-table th:not(:first-child), .stats-table td:not(:first-child) {
    width: 35%;
  }
  
  .stats-table th {
    font-size: 12px;
  }
  
  .stats-table td {
    font-size: 14px;
  }
  
  .row-label {
    font-size: 12px !important;
  }
  
  .overall-stats {
    margin-bottom: 15px;
  }
  
  .solve-count {
    font-size: 16px;
  }
  
  .average-time {
    font-size: 12px;
  }
  
  .times-list {
    max-height: 200px;
  }
  
  .list-header {
    grid-template-columns: 50px 1fr 60px 60px;
    gap: 10px;
    padding-bottom: 8px;
    font-size: 11px;
  }
  
  .time-item {
    grid-template-columns: 50px 1fr 60px 60px;
    gap: 10px;
  }
  
  .time-index {
    font-size: 12px;
  }
  
  .time-value {
    font-size: 16px;
  }
  
  .time-ao5, .time-ao12 {
    font-size: 14px;
  }
  
  .scramble-display {
    font-size: 18px;
    max-width: 100%;
    margin-bottom: 15px;
  }
  
  .timer-display {
    padding: 60px 40px;
    min-width: 280px;
  }
  
  .timer-text {
    font-size: 80px;
  }
  
  .penalty-text {
    font-size: 24px;
  }
  
  .average-display {
    max-width: 100%;
    gap: 15px;
    flex-direction: column;
  }
  
  .avg-item {
    padding: 15px;
  }
  
  .avg-value {
    font-size: 20px;
  }
  
  .top-right-tools {
    top: 15px;
    right: 15px;
    gap: 8px;
  }
  
  .back-button-container {
    top: 15px;
    left: 15px;
  }
}

@media (max-width: 480px) {
  .top-navbar {
    height: 45px;
    padding: 0 10px;
  }
  
  .nav-center {
    gap: 5px;
  }
  
  .nav-text {
    font-size: 14px;
  }
  
  .scramble-hint {
    font-size: 9px;
    margin-left: 3px;
  }
  
  .scramble-selector {
    padding: 4px 8px;
    gap: 4px;
    white-space: nowrap;
    min-width: fit-content;
  }
  
  .scramble-selector .nav-text {
    font-size: 12px;
  }
  
  .scramble-selector .dropdown-icon {
    font-size: 10px;
  }
  
  .scramble-dropdown {
    margin-top: 4px;
    min-width: 80px;
  }
  
  .scramble-item {
    padding: 4px 8px;
    font-size: 10px;
  }
  
  .main-container {
    padding: 10px;
    gap: 10px;
  }
  
  .sidebar {
    padding: 10px;
  }
  
  .title-text {
    font-size: 18px;
  }
  
  .group-tag {
    padding: 4px 8px;
    margin-bottom: 10px;
    font-size: 10px;
  }
  
  .stats-table th, .stats-table td {
    padding: 4px 6px;
    width: 33.33%;
    box-sizing: border-box;
  }
  
  .stats-table td {
    font-size: 12px;
  }
  
  .overall-stats {
    margin-bottom: 10px;
  }
  
  .solve-count {
    font-size: 14px;
  }
  
  .average-time {
    font-size: 10px;
  }
  
  .times-list {
    max-height: 150px;
  }
  
  .list-header {
    grid-template-columns: 40px 1fr 50px 50px;
    gap: 8px;
    padding-bottom: 5px;
    font-size: 9px;
  }
  
  .time-item {
    grid-template-columns: 40px 1fr 50px 50px;
    gap: 8px;
  }
  
  .time-index {
    font-size: 10px;
  }
  
  .time-value {
    font-size: 14px;
  }
  
  .time-ao5, .time-ao12 {
    font-size: 12px;
  }
  
  .timer-main {
    padding: 20px 10px;
    gap: 20px;
  }
  
  .scramble-display {
    font-size: 16px;
    max-width: 100%;
    margin-bottom: 10px;
  }
  
  .timer-display {
    padding: 40px 30px;
    min-width: 240px;
  }
  
  .timer-text {
    font-size: 60px;
  }
  
  .penalty-text {
    font-size: 20px;
  }
  
  .average-display {
    max-width: 100%;
    gap: 10px;
  }
  
  .avg-item {
    padding: 10px;
  }
  
  .avg-value {
    font-size: 16px;
  }
  
  .top-right-tools {
    top: 10px;
    right: 10px;
    gap: 5px;
  }
  
  .back-button-container {
    top: 10px;
    left: 10px;
  }
}

/* 隐藏元素 */
.hidden {
  display: none !important;
}

/* 全屏计时显示 */
.fullscreen-timer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  will-change: transform;
  transform: translateZ(0);
  backface-visibility: hidden;
}

.fullscreen-timer-text {
  font-size: 200px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  color: #333;
  text-align: center;
  user-select: none;
  will-change: contents;
  transform: translateZ(0);
  backface-visibility: hidden;
}

/* 帮助按钮和背景设置 */
.top-right-tools {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 10px;
  z-index: 1000;
}

/* 背景图片层 */
.timer-bg-image {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  pointer-events: none;
}

/* 裁剪相关样式 */
.upload-section {
  text-align: center;
}

.crop-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.crop-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.crop-preview {
  position: relative;
  max-width: 100%;
  max-height: 400px;
  overflow: hidden;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.crop-preview img {
  max-width: 100%;
  max-height: 400px;
  display: block;
  object-fit: contain;
}

.crop-overlay {
  position: absolute;
  border: 3px solid #409eff;
  background: rgba(64, 158, 255, 0.2);
  cursor: move;
  box-sizing: border-box;
  box-shadow: 0 0 10px rgba(64, 158, 255, 0.5);
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.crop-overlay::before {
  content: '';
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  border: 1px dashed rgba(64, 158, 255, 0.3);
  pointer-events: none;
}

.crop-overlay::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    linear-gradient(90deg, transparent 0%, transparent 49%, rgba(255,255,255,0.1) 50%, transparent 51%, transparent 100%),
    linear-gradient(0deg, transparent 0%, transparent 49%, rgba(255,255,255,0.1) 50%, transparent 51%, transparent 100%);
  background-size: 20px 20px;
  pointer-events: none;
}

.crop-controls {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.crop-instructions {
  text-align: center;
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

/* 粒子效果 */
.particle-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 999;
}

.particle {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  pointer-events: none;
  transition: all 0.1s ease;
  box-shadow: 0 0 15px currentColor;
}
</style> 