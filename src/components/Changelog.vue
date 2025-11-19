<template>
  <el-dialog
    v-model="visible"
    title="更新日志"
    :width="isMobile ? '90%' : '500px'"
    class="changelog-dialog glass-dialog"
    :modal="true"
    :append-to-body="true"
    :z-index="2000"
    :close-on-click-modal="true"
    :overlay-class="'glass-overlay'"
  >
    <div class="changelog-container">
      <div 
        ref="changelogRef" 
        class="changelog" 
        @scroll="handleScroll"
      >
        <transition-group 
          name="changelog-item"
          tag="div"
        >
          <div 
            v-for="(log, logIndex) in changelog" 
            :key="log.version" 
            class="version-block glass-effect-light"
            :class="{ 'selected': selectedIndex === logIndex }"
            :data-index="logIndex"
            :style="{ 
              transitionDelay: `${logIndex * 0.01}s`,
              transform: inView[logIndex] ? 'scale(1)' : 'scale(0.95)',
              opacity: inView[logIndex] ? 1 : 0.5
            }"
            @mouseenter="selectedIndex = logIndex"
            @click="handleItemClick(log, logIndex)"
          >
            <div class="version-header">
              <span class="version">v{{ log.version }}</span>
              <span class="date">{{ log.date }}</span>
            </div>
            <ul class="changes-list">
              <li v-for="(change, index) in log.changes" :key="index">
                {{ change }}
              </li>
            </ul>
          </div>
        </transition-group>
      </div>
      <div
        class="top-gradient"
        :style="{ opacity: topGradientOpacity }"
      ></div>
      <div
        class="bottom-gradient"
        :style="{ opacity: bottomGradientOpacity }"
      ></div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from 'vue'
import { getAllChangelogs } from '@/services/changelog.js'

const visible = ref(false)
const changelogRef = ref(null)
const selectedIndex = ref(-1)
const topGradientOpacity = ref(0)
const bottomGradientOpacity = ref(1)
const inView = ref({})
const changelogData = ref([])

// 添加移动端检测
const windowWidth = ref(window.innerWidth)
const isMobile = computed(() => windowWidth.value <= 768)

// 监听窗口大小变化
const handleResize = () => {
  windowWidth.value = window.innerWidth
}

// 加载更新日志数据
const loadChangelogs = async () => {
  try {
    const logs = await getAllChangelogs()
    changelogData.value = logs
  } catch (error) {
    console.error('加载更新日志失败:', error)
    changelogData.value = []
  }
}

onMounted(async () => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleKeyDown)
})

// 更新日志数据
const changelog = changelogData

// 处理滚动事件，更新渐变透明度
const handleScroll = (e) => {
  const { scrollTop, scrollHeight, clientHeight } = e.target
  topGradientOpacity.value = Math.min(scrollTop / 50, 1)
  const bottomDistance = scrollHeight - (scrollTop + clientHeight)
  bottomGradientOpacity.value = scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1)
  
  // 检查每个项目是否在视图中
  checkItemsInView()
}

// 检查项目是否在视图中
const checkItemsInView = () => {
  if (!changelogRef.value) return
  
  const container = changelogRef.value
  const containerRect = container.getBoundingClientRect()
  const items = container.querySelectorAll('.version-block')
  
  // 使用requestAnimationFrame优化性能
  requestAnimationFrame(() => {
    items.forEach((item, index) => {
      const itemRect = item.getBoundingClientRect()
      const isInView = (
        itemRect.top < containerRect.bottom &&
        itemRect.bottom > containerRect.top
      )
      inView.value[index] = isInView
    })
  })
}

// 处理键盘导航
const handleKeyDown = (e) => {
  if (!visible.value) return
  
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, changelog.length - 1)
    scrollToSelected()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
    scrollToSelected()
  }
}

// 滚动到选中的项目
const scrollToSelected = () => {
  if (selectedIndex.value < 0 || !changelogRef.value) return
  
  nextTick(() => {
    const container = changelogRef.value
    const selectedItem = container.querySelector(`[data-index="${selectedIndex.value}"]`)
    
    if (selectedItem) {
      // 确保选中的项被标记为可见
      inView.value[selectedIndex.value] = true
      
      const extraMargin = 50
      const containerScrollTop = container.scrollTop
      const containerHeight = container.clientHeight
      const itemTop = selectedItem.offsetTop
      const itemBottom = itemTop + selectedItem.offsetHeight
      
      if (itemTop < containerScrollTop + extraMargin) {
        container.scrollTo({ top: itemTop - extraMargin, behavior: 'smooth' })
      } else if (itemBottom > containerScrollTop + containerHeight - extraMargin) {
        container.scrollTo({
          top: itemBottom - containerHeight + extraMargin,
          behavior: 'smooth'
        })
      }
    }
  })
}

// 处理项目点击
const handleItemClick = (item, index) => {
  selectedIndex.value = index
}

// 打开对话框的方法
const open = async () => {
  // 如果数据为空，则加载数据
  if (changelogData.value.length === 0) {
    await loadChangelogs()
  }
  
  visible.value = true
  selectedIndex.value = 0
  
  // 重置所有项目为不可见
  changelog.forEach((_, index) => {
    inView.value[index] = false
  })
  
  // 延迟检查可见性，以便在对话框打开后执行
  nextTick(() => {
    // 确保第一条记录可见
    inView.value[0] = true
    
    checkItemsInView()
    scrollToSelected()
  })
}

// 关闭对话框的方法
const close = () => {
  visible.value = false
}

// 监听对话框可见性变化
watch(visible, (newVal) => {
  if (newVal) {
    // 对话框打开时，添加键盘事件监听
    nextTick(() => {
      window.addEventListener('keydown', handleKeyDown)
      
      // 确保第一个项目可见
      if (changelog.length > 0) {
        inView.value[0] = true
        
        // 延迟一下再次检查可见性，确保DOM已经完全渲染
        setTimeout(() => {
          checkItemsInView()
        }, 100)
      }
    })
  } else {
    // 对话框关闭时，移除键盘事件监听
    window.removeEventListener('keydown', handleKeyDown)
  }
})

defineExpose({
  open,
  close,
  changelog
})
</script>

<style>
/* 全局样式，控制遮罩层为毛玻璃效果 */
.glass-overlay {
  background-color: rgba(255, 255, 255, 0.2) !important;
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
}
</style>

<style scoped>
.changelog-container {
  position: relative;
  width: 100%;
}

.changelog {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 16px;
  scrollbar-width: thin;
  scrollbar-color: rgba(64, 158, 255, 0.3) transparent;
  position: relative;
  z-index: 1;
}

.changelog::-webkit-scrollbar {
  width: 6px;
}

.changelog::-webkit-scrollbar-track {
  background: transparent;
}

.changelog::-webkit-scrollbar-thumb {
  background-color: rgba(64, 158, 255, 0.3);
  border-radius: 10px;
}

.top-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 30px;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.6), transparent);
  pointer-events: none;
  transition: opacity 0.3s ease;
  z-index: 2;
}

.bottom-gradient {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: linear-gradient(to top, rgba(255, 255, 255, 0.8), transparent);
  pointer-events: none;
  transition: opacity 0.3s ease;
  z-index: 2;
}

.version-block {
  margin-bottom: 24px;
  padding: 16px;
  border-radius: 12px;
  transition: all 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
  background-color: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  will-change: transform, opacity;
}

.version-block:hover {
  transform: translateY(-3px) scale(1.01) !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  background-color: rgba(255, 255, 255, 0.5);
}

.version-block.selected {
  background-color: rgba(64, 158, 255, 0.1);
  border-color: rgba(64, 158, 255, 0.3);
  box-shadow: 0 8px 24px rgba(64, 158, 255, 0.1);
}

.version-block:last-child {
  margin-bottom: 0;
}

.version-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.version {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-color-primary);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.date {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.changes-list {
  margin: 0;
  padding-left: 20px;
}

.changes-list li {
  margin-bottom: 8px;
  color: var(--el-text-color-regular);
  line-height: 1.5;
}

.changes-list li:last-child {
  margin-bottom: 0;
}

/* 动画效果 */
.changelog-item-enter-active,
.changelog-item-leave-active {
  transition: all 0.2s ease;
}

.changelog-item-enter-from,
.changelog-item-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.9);
}

:deep(.el-dialog__header) {
  padding: 16px 20px;
  margin-right: 0;
  background-color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-bottom: 1px solid rgba(229, 231, 235, 0.3);
}

:deep(.el-dialog__body) {
  padding: 20px;
  background-color: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
}

:deep(.el-dialog__footer) {
  padding: 16px 20px;
  background-color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-top: 1px solid rgba(229, 231, 235, 0.3);
}

.changelog-dialog {
  border-radius: 16px;
  overflow: hidden;
}

:deep(.el-dialog) {
  background-color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

:deep(.el-dialog__title) {
  font-weight: 600;
  color: var(--el-color-primary);
  font-size: 20px;
}

:deep(.el-dialog__headerbtn) {
  font-size: 18px;
}

:deep(.el-dialog__headerbtn:hover .el-dialog__close) {
  color: var(--el-color-primary);
}

/* 增强移动端样式 */
@media (max-width: 768px) {
  .changelog {
    padding-right: 8px;
    max-height: 50vh; /* 减小在移动端的最大高度 */
  }

  .version-block {
    padding: 12px;
    margin-bottom: 16px;
    border-radius: 10px;
  }

  .version-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    margin-bottom: 8px;
  }

  .version {
    font-size: 16px;
  }

  .date {
    font-size: 12px;
  }
  
  .changes-list {
    padding-left: 16px;
  }
  
  .changes-list li {
    margin-bottom: 6px;
    font-size: 13px;
  }
  
  :deep(.el-dialog) {
    margin: 10vh auto !important;
    border-radius: 12px;
  }
  
  :deep(.el-dialog__header) {
    padding: 12px 15px;
  }
  
  :deep(.el-dialog__title) {
    font-size: 18px;
  }
  
  :deep(.el-dialog__body) {
    padding: 15px;
  }
  
  :deep(.el-dialog__footer) {
    padding: 12px 15px;
  }
  
  /* 优化渐变效果 */
  .top-gradient {
    height: 40px;
  }
  
  .bottom-gradient {
    height: 60px;
  }
}
</style> 