<template>
  <el-dialog
    v-model="visible"
    title="反馈"
    :width="isMobile ? '90%' : '500px'"
    class="feedback-dialog glass-dialog"
    :modal="true"
    :append-to-body="true"
    :z-index="2000"
    :close-on-click-modal="true"
    :overlay-class="'glass-overlay'"
  >
    <div class="feedback-container">
      <el-form 
        :model="feedbackForm" 
        :rules="rules" 
        ref="feedbackFormRef"
        label-width="80px"
        class="glass-form"
      >
        <transition-group name="form-item">
          <el-form-item key="nickname" label="昵称" prop="nickname" 
            :style="{ transitionDelay: '0.05s' }">
            <el-input 
              v-model="feedbackForm.nickname" 
              placeholder="选填，匿名提交请留空"
            />
          </el-form-item>
          
          <el-form-item key="content" label="意见" prop="content"
            :style="{ transitionDelay: '0.1s' }">
            <el-input 
              v-model="feedbackForm.content" 
              type="textarea" 
              :rows="4"
              placeholder="bug、意见等均可在此提出。"
            />
          </el-form-item>
          
          <el-form-item key="buttons" :style="{ transitionDelay: '0.15s' }">
            <el-button type="primary" @click="submitFeedback">提交</el-button>
            <el-button @click="resetForm">重置</el-button>
          </el-form-item>
        </transition-group>
      </el-form>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/api/index.js'

const visible = ref(false)
const feedbackFormRef = ref(null)
const feedbackForm = ref({
  nickname: '',
  content: ''
})

// 添加移动端检测
const windowWidth = ref(window.innerWidth)
const isMobile = computed(() => windowWidth.value <= 768)

// 监听窗口大小变化
const handleResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const rules = {
  content: [
    { required: true, message: '请输入您的意见或建议', trigger: 'blur' },
    { min: 5, message: '意见内容至少 5 个字符', trigger: 'blur' }
  ]
}

const submitFeedback = async () => {
  if (!feedbackFormRef.value) return
  
  await feedbackFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const result = await api.submitFeedback(feedbackForm.value)
        
        if (result.code === 200) {
          ElMessage({
            type: 'success',
            message: '感谢您的反馈！'
          })
          resetForm()
          close()
        } else {
          throw new Error(result.message || '提交失败')
        }
      } catch (error) {
        console.error('提交反馈时出错:', error)
        ElMessage({
          type: 'error',
          message: error.message || '提交失败，请稍后重试'
        })
      }
    }
  })
}

const resetForm = () => {
  if (feedbackFormRef.value) {
    feedbackFormRef.value.resetFields()
  }
}

// 打开对话框的方法
const open = () => {
  visible.value = true
}

// 关闭对话框的方法
const close = () => {
  visible.value = false
}

defineExpose({
  open,
  close
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
.feedback-dialog {
  border-radius: var(--radius-2xl);
  overflow: hidden;
}

.feedback-container {
  position: relative;
  width: 100%;
}

.el-form {
  padding: 8px;
}

/* 表单项动画 */
.form-item-enter-active,
.form-item-leave-active {
  transition: all 0.3s ease;
}

.form-item-enter-from,
.form-item-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

:deep(.el-form-item) {
  transition: all 0.3s ease;
  transform-origin: top left;
}

:deep(.el-dialog) {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-2xl);
  overflow: hidden;
  transition: all var(--duration-normal) var(--ease-in-out);
}

:deep(.el-dialog__header) {
  padding: var(--space-lg) var(--space-xl);
  margin-right: 0;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-bottom: 1px solid var(--border-light);
  position: relative;
}

:deep(.el-dialog__header)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(64, 158, 255, 0.3), transparent);
}

:deep(.el-dialog__title) {
  font-weight: 600;
  color: var(--text-color);
  font-size: 20px;
}

:deep(.el-dialog__headerbtn) {
  font-size: 18px;
}

:deep(.el-dialog__headerbtn:hover .el-dialog__close) {
  color: var(--primary-color);
}

:deep(.el-dialog__body) {
  padding: var(--space-xl);
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
}

:deep(.el-dialog__footer) {
  padding: var(--space-lg) var(--space-xl);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-top: 1px solid var(--border-light);
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: all var(--duration-normal) var(--ease-in-out);
}

:deep(.el-input__wrapper:hover),
:deep(.el-textarea__inner:hover) {
  border-color: var(--primary-light);
  box-shadow: var(--shadow-md);
  background: rgba(255, 255, 255, 0.9);
}

:deep(.el-input__wrapper:focus-within),
:deep(.el-textarea__inner:focus) {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  background: rgba(255, 255, 255, 0.95);
}

:deep(.el-button) {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: all var(--duration-normal) var(--ease-in-out);
  border-radius: var(--radius-md);
  font-weight: 500;
}

:deep(.el-button:not(.el-button--primary)) {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid var(--border-light);
  color: var(--text-color);
}

:deep(.el-button:not(.el-button--primary):hover) {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-light);
}

:deep(.el-button--primary) {
  box-shadow: var(--shadow-md);
}

:deep(.el-button--primary:hover) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* 添加移动端样式 */
@media (max-width: 768px) {
  :deep(.el-dialog) {
    margin: 10vh auto !important;
    border-radius: var(--radius-2xl);
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
  
  :deep(.el-form-item) {
    margin-bottom: 15px;
  }
  
  :deep(.el-form-item__label) {
    padding-right: 8px;
    font-size: 14px;
  }
  
  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner) {
    font-size: 14px;
  }
  
  :deep(.el-button) {
    padding: 8px 15px;
    font-size: 14px;
  }
}
</style> 