<template>
  <el-dialog
    :modelValue="visible"
    @update:modelValue="updateVisible"
    :title="null"
    :width="isMobile ? '90%' : '400px'"
    :show-close="true"
    :close-on-click-modal="false"
    class="auth-dialog"
    :modal-class="'auth-dialog-modal'"
  >
    <div class="auth-container">
      <div class="auth-header">
        <!-- 删除logo图片 -->
        <h2 class="auth-title">会枝Cubing</h2>
        <p class="auth-subtitle"></p>
      </div>

      <transition name="form-fade" mode="out-in">
        <el-form
          :key="currentMode"
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          class="auth-form"
        >
          <el-form-item v-if="!isLogin" prop="nickname">
            <el-input
              v-model="form.nickname"
              placeholder="设置用户名"
              class="auth-input"
            >
              <template #prefix>
                <Icon icon="material-symbols:person-outline" class="icon" />
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="email">
            <el-input
              v-model="form.email"
              :placeholder="isLogin ? '邮箱' : '邮箱'"
              type="email"
              class="auth-input"
            >
              <template #prefix>
                <Icon icon="material-symbols:mail-outline" class="icon" />
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              :placeholder="isLogin ? '密码' : '设置密码'"
              type="password"
              show-password
              class="auth-input"
            >
              <template #prefix>
                <Icon icon="material-symbols:lock-outline" class="icon" />
              </template>
            </el-input>
          </el-form-item>

          <el-button type="primary" class="submit-button" @click="handleSubmit">
            <Icon icon="mdi:account" class="button-icon" v-if="!isLogin" />
            {{ isLogin ? '登录' : '注册' }}
          </el-button>

          <div class="switch-mode">
            <span class="text">{{ isLogin ? '还没有账号？' : '已有账号？' }}</span>
            <a href="javascript:;" class="link" @click="toggleMode">
              {{ isLogin ? '立即注册' : '立即登录' }}
            </a>
          </div>

          <div class="terms-text" v-if="!isLogin">
            
          </div>
        </el-form>
      </transition>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String,
    default: 'login' // 'login' 或 'register'
  }
})

const emit = defineEmits(['update:visible', 'login-success', 'register-success'])

const router = useRouter()
const userStore = useUserStore()

const formRef = ref()
const currentMode = ref(props.mode)

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

// 监听mode prop的变化
watch(() => props.mode, (newMode) => {
  currentMode.value = newMode
  resetForm()
})

const isLogin = computed(() => currentMode.value === 'login')

const form = reactive({
  email: '',
  nickname: '',
  password: ''
})

const resetForm = () => {
  form.email = ''
  form.nickname = ''
  form.password = ''
  formRef.value?.clearValidate()
}

const rules = computed(() => {
  const baseRules = {
    email: [
      { required: true, message: '请输入邮箱地址', trigger: 'blur' },
      { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' },
      { pattern: /@qq\.com$/, message: '请使用QQ邮箱', trigger: 'blur' }
    ],
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
    ]
  }

  if (!isLogin.value) {
    baseRules.nickname = [
      { required: true, message: '请输入昵称', trigger: 'blur' },
      { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ]
  }

  return baseRules
})

const toggleMode = () => {
  currentMode.value = isLogin.value ? 'register' : 'login'
  resetForm()
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isLogin.value) {
          // 登录逻辑
          await userStore.login(form.email, form.password)
          ElMessage.success('登录成功')
          emit('login-success')
        } else {
          // 注册逻辑
          await userStore.register({
            email: form.email,
            password: form.password,
            nickname: form.nickname
          })
          ElMessage.success('注册成功')
          emit('register-success')
        }
        emit('update:visible', false)
        resetForm()
      } catch (error) {
        ElMessage.error(error.message || '操作失败')
      }
    }
  })
}

// 监听visible变化
const updateVisible = (value) => {
  emit('update:visible', value)
  if (!value) {
    resetForm()
  }
}

// 暴露方法给父组件
defineExpose({
  toggleMode,
  resetForm
})
</script>

<style scoped>
/* 现代化毛玻璃效果 */
.auth-dialog :deep(.el-dialog) {
  background: var(--glass-bg-hover) !important;
  backdrop-filter: blur(var(--glass-blur-lg)) !important;
  -webkit-backdrop-filter: blur(var(--glass-blur-lg)) !important;
  border-radius: var(--radius-xl) !important;
  box-shadow: var(--shadow-2xl) !important;
  border: var(--glass-border) !important;
  overflow: hidden !important;
  padding: 0 !important;
  transition: all var(--duration-normal) var(--ease-in-out) !important;
}

/* 自定义遮罩层 */
:deep(.auth-dialog-modal) {
  background-color: rgba(0, 0, 0, 0.4) !important;
  backdrop-filter: blur(var(--glass-blur-sm)) !important;
  -webkit-backdrop-filter: blur(var(--glass-blur-sm)) !important;
}

/* 确保背景是透明的 */
.auth-dialog :deep(.el-dialog__header),
.auth-dialog :deep(.el-dialog__body),
.auth-dialog :deep(.el-dialog__footer) {
  background-color: transparent !important;
  padding: 0;
}

.auth-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.auth-dialog :deep(.el-dialog__headerbtn) {
  top: 15px;
  right: 15px;
  z-index: 10;
}

.auth-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
  color: #606266;
  font-size: 20px;
}

.auth-container {
  width: 100%;
  padding: 0;
}

.auth-header {
  text-align: center;
  padding: 30px 20px 10px;
  background-color: transparent;
}

.auth-logo {
  width: 60px;
  height: 60px;
  margin-bottom: 10px;
}

.auth-title {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 5px;
  color: var(--text-color);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  line-height: 1;
  font-family: 'CustomChinese', sans-serif;
}

.auth-subtitle {
  font-size: 14px;
  color: #666;
  margin: 0 0 20px;
}

.auth-form {
  padding: 10px 30px 30px;
}

/* 表单元素样式 */
.auth-input {
  height: 50px;
}

.auth-dialog :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.8) !important;
  border: 1px solid var(--border-light) !important;
  box-shadow: var(--shadow-sm) !important;
  border-radius: var(--radius-md) !important;
  padding: 0 15px !important;
  transition: all var(--duration-normal) var(--ease-in-out);
}

.auth-dialog :deep(.el-input__wrapper:hover) {
  background: rgba(255, 255, 255, 0.9) !important;
  border-color: var(--primary-light) !important;
  box-shadow: var(--shadow-md) !important;
}

.auth-dialog :deep(.el-input__wrapper.is-focus) {
  background: rgba(255, 255, 255, 0.95) !important;
  border-color: var(--primary-color) !important;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2) !important;
}

.auth-dialog :deep(.el-form-item__label) {
  padding: 0 0 8px;
  color: var(--text-color) !important;
  font-weight: 500;
  font-size: 14px;
}

.auth-dialog :deep(.el-form-item) {
  margin-bottom: 20px;
}

.icon {
  color: #999;
  font-size: 18px;
  margin-right: 8px;
}

.form-footer {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}

.submit-button {
  width: 100%;
  margin-bottom: 16px;
  height: 46px;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 1px;
  transition: all var(--duration-normal) var(--ease-in-out);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
}

.button-icon {
  margin-right: 8px;
  font-size: 20px;
}

.submit-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.switch-mode {
  text-align: center;
  margin-bottom: 10px;
}

.text {
  color: #666;
  font-size: 14px;
}

.link {
  color: var(--primary-color);
  text-decoration: none;
  margin-left: 4px;
  transition: opacity 0.3s;
  cursor: pointer;
  font-weight: 500;
}

.link:hover {
  opacity: 0.8;
}

.terms-text {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin-top: 10px;
}

/* 添加表单切换动画 */
.form-fade-enter-active,
.form-fade-leave-active {
  transition: all 0.3s ease;
}

.form-fade-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.form-fade-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* 添加移动端样式 */
@media (max-width: 768px) {
  .auth-dialog :deep(.el-dialog) {
    margin: 10vh auto !important;
    border-radius: 12px !important;
  }
  
  .auth-header {
    padding: 20px 15px 5px;
  }
  
  .auth-logo {
    width: 50px;
    height: 50px;
    margin-bottom: 8px;
  }
  
  .auth-title {
    font-size: 20px;
    margin: 0 0 3px;
  }
  
  .auth-subtitle {
    font-size: 13px;
    margin: 0 0 15px;
  }
  
  .auth-form {
    padding: 5px 20px 20px;
  }
  
  .auth-input {
    height: 46px;
  }
  
  .auth-dialog :deep(.el-input__wrapper) {
    padding: 0 12px !important;
  }
  
  .auth-dialog :deep(.el-form-item) {
    margin-bottom: 16px;
  }
  
  .form-footer {
    margin-bottom: 20px;
  }
  
  .submit-button {
    height: 42px;
    font-size: 15px;
    margin-bottom: 14px;
  }
  
  .button-icon {
    font-size: 18px;
  }
  
  .switch-mode {
    margin-bottom: 8px;
  }
  
  .text {
    font-size: 13px;
  }
  
  .terms-text {
    font-size: 11px;
    margin-top: 8px;
  }
  
  .icon {
    font-size: 16px;
    margin-right: 6px;
  }
}
</style> 