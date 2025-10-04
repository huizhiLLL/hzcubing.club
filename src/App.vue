<script setup>
import { Icon } from '@iconify/vue'
import { useUserStore } from '@/stores/user'
import { useRecordsStore } from '@/stores/records'
import { storeToRefs } from 'pinia'
import { useRouter, useRoute } from 'vue-router'
import Changelog from '@/components/Changelog.vue'
import AuthDialog from '@/components/AuthDialog.vue'
import FeedbackDialog from '@/components/FeedbackDialog.vue'
import ParticlesBackground from '@/components/ParticlesBackground.vue'
import ClickEffect from '@/components/ClickEffect.vue'
import { ref, onMounted, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const recordsStore = useRecordsStore()
const { user, token } = storeToRefs(userStore)
const { logout, initUser } = userStore

// 检查当前路由是否为独立页面
const isStandalonePage = computed(() => {
  return route.meta?.standalone === true
})

// 监听独立页面状态变化，控制body滚动条
watch(isStandalonePage, (isStandalone) => {
  if (isStandalone) {
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    document.body.classList.add('standalone-page')
    document.documentElement.classList.add('standalone-page')
  } else {
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
    document.body.classList.remove('standalone-page')
    document.documentElement.classList.remove('standalone-page')
  }
}, { immediate: true })

const changelogRef = ref()
const authDialogRef = ref()
const feedbackDialogRef = ref()
const authDialogVisible = ref(false)
const authDialogMode = ref('login')
const moreMenuVisible = ref(false)

// 移动导航相关
const sidebarVisible = ref(false)
const toggleSidebar = () => {
  sidebarVisible.value = !sidebarVisible.value
}
const closeSidebar = () => {
  sidebarVisible.value = false
}

const showChangelog = () => {
  changelogRef.value?.open()
  // 在移动端下自动收起侧边菜单
  closeSidebar()
}

const showFeedback = () => {
  feedbackDialogRef.value?.open()
  // 在移动端下自动收起侧边菜单
  closeSidebar()
}

const showAuthDialog = (mode) => {
  authDialogMode.value = mode
  authDialogVisible.value = true
}

// 监听路由变化，检查是否需要认证
watch(route, (to) => {
  if (to.meta.requiresAuth && !user.value) {
    showAuthDialog('login')
    ElMessage.warning('请先登录')
  }
}, { immediate: true })

// 初始化用户状态
onMounted(async () => {
  try {
    // 如果localStorage中有token，尝试初始化用户
    if (localStorage.getItem('token')) {
      // 如果store中没有token，从localStorage恢复
      if (!token.value) {
        token.value = localStorage.getItem('token')
      }
      
      // 尝试从localStorage恢复用户信息，避免额外的API调用
      const cachedUserInfo = localStorage.getItem('userInfo')
      if (cachedUserInfo) {
        try {
          const parsedUserInfo = JSON.parse(cachedUserInfo)
          if (parsedUserInfo && (parsedUserInfo.id || parsedUserInfo._id)) {
            // 确保同时有id和_id字段
            if (!parsedUserInfo._id && parsedUserInfo.id) {
              parsedUserInfo._id = parsedUserInfo.id
            }
            if (!parsedUserInfo.id && parsedUserInfo._id) {
              parsedUserInfo.id = parsedUserInfo._id
            }
            
            // 设置用户信息
            user.value = parsedUserInfo
          }
        } catch (e) {
          console.error('App mounted - 解析缓存用户信息失败:', e)
        }
      }
      
      // 无论是否从缓存恢复，都尝试从API初始化用户
      const initSuccess = await initUser()
      
      // 如果初始化失败但有token，可能是token过期，清除token
      if (!initSuccess) {
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        token.value = null
        user.value = null
        
        // 显示错误消息
        ElMessage.error('登录已过期，请重新登录')
      }
    }
  } catch (error) {
    console.error('App mounted - 初始化用户时出错:', error)
    // 出错时清除状态
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    token.value = null
    user.value = null
  }
  
  // 添加全局网络错误处理
  window.addEventListener('online', () => {
    // userStore.checkApiHealth() // 移除健康检查
  })
  
  window.addEventListener('offline', () => {
    userStore.apiStatus = false
    ElMessage.error('网络连接已断开，请检查您的网络设置')
  })
})

const handleLogout = async () => {
  await logout()
  ElMessage.success({
    message: '已成功退出登录',
    duration: 2000, // 2秒后自动关闭
    showClose: true // 允许手动关闭
  })
  // 退出后重定向到首页
  router.push('/')
  // 关闭侧边栏
  closeSidebar()
}

// 登录成功后的处理
const handleLoginSuccess = () => {
  const redirectPath = localStorage.getItem('redirectPath')
  if (redirectPath) {
    router.push(redirectPath)
    localStorage.removeItem('redirectPath')
  }
}
</script>

<template>
  <el-container class="app-container">
    <ParticlesBackground id="tsparticles" />
    
    <!-- 移动端导航栏 - 仅在非独立页面显示 -->
    <div v-if="!isStandalonePage" class="mobile-navbar">
      <div class="mobile-navbar-left">
        <el-button class="menu-button" text @click="toggleSidebar">
          <el-icon size="24"><Icon icon="mdi:menu" /></el-icon>
        </el-button>
      </div>
      <div class="mobile-navbar-right">
        <template v-if="user">
          <router-link to="/profile" class="mobile-user-info">
            <el-avatar :src="user.avatar || '/default-avatar.svg'" :size="32" />
            <span class="mobile-username">{{ user.nickname }}</span>
          </router-link>
        </template>
        <template v-else>
          <el-button type="primary" size="small" @click="showAuthDialog('login')">登录</el-button>
        </template>
      </div>
    </div>

    <!-- 侧边栏菜单 - 仅在非独立页面显示 -->
    <el-drawer
      v-if="!isStandalonePage"
      v-model="sidebarVisible"
      direction="ltr"
      size="80%"
      :with-header="false"
      class="sidebar-drawer"
    >
      <div class="sidebar-header">
        <!-- 删除整个logo容器 -->
        <h2 class="sidebar-title">会枝Cubing</h2>
      </div>
      <el-divider />
      <el-menu class="sidebar-menu" :router="true" @select="closeSidebar">
        <el-menu-item index="/">
          <el-icon><Icon icon="mdi:home" /></el-icon>
          <span>首页</span>
        </el-menu-item>
        <el-menu-item index="/records">
          <el-icon><Icon icon="mdi:trophy" /></el-icon>
          <span>记录</span>
        </el-menu-item>
        <el-menu-item index="/leaderboard">
          <el-icon><Icon icon="mdi:podium" /></el-icon>
          <span>排行榜</span>
        </el-menu-item>
        <el-menu-item index="/users">
          <el-icon><Icon icon="mdi:account-group" /></el-icon>
          <span>选手</span>
        </el-menu-item>
        <el-menu-item index="/minecraft">
          <el-icon><Icon icon="mdi:minecraft" /></el-icon>
          <span>MC</span>
        </el-menu-item>
        <el-menu-item index="/cube-timer">
          <el-icon><Icon icon="mdi:timer" /></el-icon>
          <span>魔方计时器</span>
        </el-menu-item>
        <el-menu-item v-if="user" index="/submit-record">
          <el-icon><Icon icon="mdi:upload" /></el-icon>
          <span>上传成绩</span>
        </el-menu-item>
        <el-menu-item @click="showChangelog">
          <el-icon><Icon icon="mdi:history" /></el-icon>
          <span>更新日志</span>
        </el-menu-item>
        <el-menu-item @click="showFeedback">
          <el-icon><Icon icon="mdi:message-text" /></el-icon>
          <span>反馈</span>
        </el-menu-item>
        <el-menu-item index="/online-competition">
          <el-icon><Icon icon="mdi:trophy-award" /></el-icon>
          <span>线上赛（临时）</span>
        </el-menu-item>
      </el-menu>
      <div class="sidebar-footer">
        <template v-if="user">
          <div class="sidebar-user-info">
            <el-avatar :src="user.avatar || '/default-avatar.svg'" :size="40" />
            <span class="sidebar-username">{{ user.nickname }}</span>
          </div>
          <el-button type="danger" @click="handleLogout" class="sidebar-logout-btn">
            <el-icon><Icon icon="mdi:logout-variant" /></el-icon>
            退出登录
          </el-button>
        </template>
        <template v-else>
          <div class="sidebar-auth-buttons">
            <el-button type="primary" @click="showAuthDialog('login'); closeSidebar()">登录</el-button>
            <el-button @click="showAuthDialog('register'); closeSidebar()">注册</el-button>
          </div>
        </template>
      </div>
    </el-drawer>
    
    <!-- 桌面端导航栏 - 仅在非独立页面显示 -->
    <el-header v-if="!isStandalonePage" class="desktop-header">
      <div class="page-container header-container">
        <div class="navbar-content">
          <div class="nav-left">
            <router-link to="/" class="logo">
              <!-- 删除整个logo容器 -->
              <span class="logo-text">会枝Cubing</span>
            </router-link>
            <div class="nav-menu">
              <el-button text @click="router.push('/')" class="btn-animated">首页</el-button>
              <el-button text @click="router.push('/records')" class="btn-animated">记录</el-button>
              <el-button text @click="router.push('/leaderboard')" class="btn-animated">排行榜</el-button>
              <el-button text @click="router.push('/users')" class="btn-animated">选手</el-button>
              <el-button text @click="router.push('/minecraft')" class="btn-animated">MC</el-button>
              
              <!-- 更多菜单下拉按钮 -->
              <el-dropdown trigger="click" @visible-change="moreMenuVisible = $event" class="more-menu-dropdown">
                <el-button text class="more-menu-btn btn-animated">
                  更多
                  <el-icon class="el-icon--right">
                    <Icon :icon="moreMenuVisible ? 'mdi:chevron-up' : 'mdi:chevron-down'" />
                  </el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu class="more-dropdown-menu">
                    <el-dropdown-item v-if="user" @click="router.push('/submit-record')">
                      <Icon icon="mdi:upload" class="dropdown-icon" />
                      上传成绩
                    </el-dropdown-item>
                    <el-dropdown-item @click="router.push('/cube-timer')">
                      <Icon icon="mdi:timer" class="dropdown-icon" />
                      魔方计时器
                    </el-dropdown-item>
                    <el-dropdown-item @click="showChangelog">
                      <Icon icon="mdi:history" class="dropdown-icon" />
                      更新日志
                    </el-dropdown-item>
                    <el-dropdown-item @click="showFeedback">
                      <Icon icon="mdi:message-text" class="dropdown-icon" />
                      反馈
                    </el-dropdown-item>
                    <el-dropdown-item @click="router.push('/online-competition')">
                      <Icon icon="mdi:trophy-award" class="dropdown-icon" />
                      线上赛
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
          <div class="nav-right">
            <template v-if="user">
              <router-link to="/profile" class="user-info">
                <el-avatar :src="user.avatar || '/default-avatar.svg'" />
                <span class="username">{{ user.nickname }}</span>
              </router-link>
              <el-button 
                @click="handleLogout" 
                class="logout-btn" 
                text
                title="退出登录"
              >
                <Icon icon="mdi:logout-variant" />
              </el-button>
            </template>
            <template v-else>
              <div class="auth-buttons">
                <el-button text @click="showAuthDialog('login')" class="auth-btn btn-animated">登录</el-button>
                <span class="auth-divider">|</span>
                <el-button text @click="showAuthDialog('register')" class="auth-btn btn-animated">注册</el-button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </el-header>

    <el-main :class="{ 'standalone-main': isStandalonePage }">
      <div v-if="!isStandalonePage" class="page-container">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
      <router-view v-else v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </el-main>

    <!-- 页脚 - 仅在非独立页面显示 -->
    <el-footer v-if="!isStandalonePage" class="glass-footer">
      <div class="page-container text-center">
        <div class="footer-content">
          <div class="footer-section">
            <p class="copyright">© {{ new Date().getFullYear() }} 会枝Cubing. All rights reserved.</p>
            
            <!-- ICP备案信息区域 -->
            <div class="icp-info">
              <a href="https://beian.miit.gov.cn" target="_blank" class="icp-link">豫ICP备2025116824号</a>
              <a href="http://www.beian.gov.cn" target="_blank" class="police-link">
                <img src="/images/icons/police-badge.svg" alt="公安备案" class="police-icon" />
                公安备案号
              </a>
            </div>
          </div>
          
          <!-- 社交媒体账号区域 -->
          <div class="social-links">
            <!-- B站账号 -->
            <a href="https://space.bilibili.com/1299547652" target="_blank" class="social-link" title="会枝L">
              <img src="/images/icons/bilibili-icon.svg" alt="Bilibili" class="social-icon" />
            </a>
            
            <!-- QQ群 -->
            <div class="social-link qq-group" title="QQ群">
              <img src="/images/icons/qq-icon.svg" alt="QQ群" class="social-icon" />
              <div class="qrcode-popup">
                <img src="/images/qq-group-qrcode.png" alt="QQ群二维码" class="qrcode-img" />
                <p class="qrcode-text">扫码加入QQ群</p>
              </div>
            </div>
            
            <!-- GitHub仓库 -->
            <a href="https://github.com/huizhiLLL/hzcubing.club" target="_blank" class="social-link" title="GitHub">
              <svg t="1726641706144" class="social-icon icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4396" width="200" height="200"><path d="M512 74.666667A437.333333 437.333333 0 0 0 74.666667 512c0 192 117.333333 354.133333 281.6 416 21.333333 4.266667 21.333333-8.533333 21.333333-21.333333v-74.666667c-117.333333 21.333333-140.8-51.2-140.8-51.2-17.066667-42.666667-42.666667-51.2-42.666667-51.2-36.266667-23.466667 2.133333-23.466667 2.133333-23.466667 40.533333 2.133333 60.8 38.4 60.8 38.4 36.266667 64 93.866667 44.8 117.333333 34.133333 2.133333-27.733333 14.933333-44.8 27.733334-53.333333-89.6-8.533333-185.6-44.8-185.6-200.533333 0-44.8 14.933333-81.066667 40.533333-108.8-4.266667-10.666667-17.066667-51.2 4.266667-106.666667 0 0 34.133333-10.666667 113.066666 40.533333a386.133333 386.133333 0 0 1 102.4-12.8c34.133333 0 68.266667 4.266667 102.4 12.8 78.933333-51.2 113.066667-40.533333 113.066667-40.533333 21.333333 55.466667 8.533333 96 4.266667 106.666667 25.6 27.733333 40.533333 64 40.533333 108.8 0 155.733333-96 192-185.6 200.533333 14.933333 12.8 27.733333 38.4 27.733333 76.8v110.933333c0 12.8 8.533333 25.6 21.333333 21.333333 164.266667-61.866667 281.6-224 281.6-416C949.333333 192 755.2 74.666667 512 74.666667z" p-id="4397" fill="#000000"></path></svg>
            </a>
          </div>
        </div>
      </div>
    </el-footer>

    <Changelog ref="changelogRef" />
    <FeedbackDialog ref="feedbackDialogRef" />
    <AuthDialog 
      v-model:visible="authDialogVisible"
      :mode="authDialogMode"
      ref="authDialogRef"
      @login-success="handleLoginSuccess"
      @register-success="handleLoginSuccess"
    />
    <ClickEffect />
  </el-container>
</template>

<style scoped>
/* 全局样式：在移动端下隐藏各页面的顶部导航栏 */
:deep(.page-header),
:deep(.mc-header),
:deep(.section-header),
:deep(.view-header) {
  @media (max-width: 768px) {
    display: none !important;
  }
}

/* 全局样式：优化移动端卡片和组件显示 */
:deep(.el-card),
:deep(.card-container),
:deep(.record-card),
:deep(.user-card),
:deep(.info-card),
:deep(.stats-card),
:deep(.feature-card),
:deep(.el-table),
:deep(.data-container) {
  @media (max-width: 768px) {
    width: 100% !important;
    max-width: 100% !important;
    margin-left: auto !important;
    margin-right: auto !important;
    box-sizing: border-box !important;
  }
}

/* 限制移动端内容宽度 */
:deep(.content-container),
:deep(.card-grid),
:deep(.record-grid),
:deep(.user-grid) {
  @media (max-width: 768px) {
    width: 100% !important;
    max-width: 100% !important;
    padding-left: 10px !important;
    padding-right: 10px !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
  }
}

/* 移动导航栏样式 */
.mobile-navbar {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  padding: 0 20px;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-light);
  transition: all var(--duration-normal) var(--ease-in-out);
}

.mobile-navbar-left, .mobile-navbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.menu-button {
  color: var(--text-color);
  padding: 10px;
  border-radius: var(--radius-md);
  transition: all var(--duration-normal) var(--ease-in-out);
  background: rgba(64, 158, 255, 0.05);
  border: 1px solid rgba(64, 158, 255, 0.1);
}

.menu-button:hover {
  background: rgba(64, 158, 255, 0.1);
  color: var(--primary-color);
  transform: scale(1.05);
  box-shadow: var(--shadow-md);
}

.mobile-user-info {
  display: flex;
  align-items: center;
  text-decoration: none;
}

.mobile-username {
  margin-left: 8px;
  font-size: 14px;
  color: #303133;
  font-weight: 500;
  max-width: 80px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px) {
  .desktop-header {
    display: none !important;
  }
  
  .mobile-navbar {
    display: flex;
  }
  
  .el-main {
    padding-top: 80px !important; /* 为固定的移动导航栏留出空间 */
    padding-left: var(--space-md) !important;
    padding-right: var(--space-md) !important;
    padding-bottom: var(--space-lg) !important;
  }
  
  .page-container {
    padding: 0 !important;
  }
  
  /* 移动端导航栏优化 */
  .mobile-navbar {
    height: 64px;
    padding: 0 var(--space-lg);
  }
  
  .menu-button {
    padding: 12px;
    border-radius: var(--radius-md);
  }
  
  /* 移动端用户信息优化 */
  .mobile-user-info {
    padding: 6px 12px;
    border-radius: var(--radius-full);
    background: rgba(64, 158, 255, 0.05);
    border: 1px solid rgba(64, 158, 255, 0.1);
  }
  
  .mobile-username {
    font-size: 14px;
    font-weight: 500;
    max-width: 100px;
  }
}

/* 侧边栏样式 */
.sidebar-drawer :deep(.el-drawer__body) {
  padding: 0;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

.sidebar-header {
  padding: 20px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.5), rgba(103, 194, 58, 0.3));
}

.sidebar-title {
  color: #303133;
  margin: 0;
  font-size: 20px;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.5);
  font-family: 'CustomChinese', sans-serif;
}

.sidebar-menu {
  flex: 1;
  border-right: none;
}

.sidebar-menu :deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
}

.sidebar-menu :deep(.el-icon) {
  margin-right: 12px;
  font-size: 18px;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sidebar-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
}

.sidebar-username {
  font-weight: 500;
  font-size: 16px;
}

.sidebar-logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.sidebar-auth-buttons {
  display: flex;
  gap: 12px;
}

.sidebar-auth-buttons .el-button {
  flex: 1;
}

/* 原有样式保留 */
.app-container {
  min-height: 100vh;
  position: relative;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.05), rgba(103, 194, 58, 0.05));
}

.app-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at top left, rgba(64, 158, 255, 0.05), transparent 50%),
              radial-gradient(circle at bottom right, rgba(103, 194, 58, 0.05), transparent 50%);
  z-index: -1;
}

.desktop-header {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-light);
  padding: 0;
  height: 72px;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--duration-normal) var(--ease-in-out);
}

.desktop-header:hover {
  background: rgba(255, 255, 255, 0.9);
  box-shadow: var(--shadow-lg);
}

.el-main {
  padding-top: var(--space-lg);
  padding-bottom: var(--space-xl);
}

/* 非独立页面保持正常的最小高度 */
.el-main:not(.standalone-main) {
  min-height: calc(100vh - 120px);
}

.glass-footer {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid var(--border-light);
  padding: var(--space-2xl) 0;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.05);
  margin-top: auto;
}

.navbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0;
  width: 100%;
}

.nav-left {
  display: flex;
  align-items: center;
  height: 100%;
}

.logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  margin-right: 40px;
  height: 100%;
  transition: transform 0.2s ease;
  padding-left: 0;
  margin-left: -10px;
}

.logo:hover {
  transform: scale(1.05);
}

.logo-text {
  font-size: 30px;
  font-weight: bold;
  color: var(--primary-color);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  line-height: 1;
  font-family: 'CustomChinese', sans-serif;
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 100%;
}

.nav-menu .el-button {
  font-size: 15px;
  height: 40px;
  padding: 0 20px;
  border-radius: var(--radius-lg);
  transition: all var(--duration-normal) var(--ease-in-out);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  position: relative;
  overflow: hidden;
}

.nav-menu .el-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(64, 158, 255, 0.1), transparent);
  transition: left var(--duration-slow) var(--ease-in-out);
}

.nav-menu .el-button:hover {
  background: rgba(64, 158, 255, 0.1);
  transform: translateY(-2px);
  color: var(--primary-color);
  box-shadow: var(--shadow-md);
}

.nav-menu .el-button:hover::before {
  left: 100%;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 100%;
  margin-left: auto;
  padding-right: 0;
}

.nav-right .el-button {
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
}

.nav-right .el-button:not(.logout-btn):hover {
  transform: translateY(-2px);
}

.user-info {
  display: flex;
  align-items: center;
  text-decoration: none;
  margin-right: 0;
  padding: 6px 16px;
  border-radius: var(--radius-full);
  transition: all var(--duration-normal) var(--ease-in-out);
  height: 44px;
  background: rgba(64, 158, 255, 0.05);
  border: 1px solid rgba(64, 158, 255, 0.1);
}

.user-info .el-avatar {
  height: 32px;
  width: 32px;
  border: 2px solid rgba(64, 158, 255, 0.2);
  transition: all var(--duration-normal) var(--ease-in-out);
}

.user-info:hover {
  background: rgba(64, 158, 255, 0.1);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: rgba(64, 158, 255, 0.2);
}

.user-info:hover .el-avatar {
  border-color: rgba(64, 158, 255, 0.4);
  transform: scale(1.05);
}

.username {
  margin-left: 8px;
  color: var(--text-color);
  font-weight: 500;
}

.copyright {
  color: var(--text-color-secondary);
  font-size: 14px;
}

@media (max-width: 768px) {
  .page-container {
    padding: 10px;
  }

  .el-header {
    height: auto;
    padding: 5px 0;
  }

  .navbar-content {
    flex-direction: column;
    gap: 10px;
    padding: 0;
    height: auto;
  }

  .nav-left {
    flex-direction: column;
    align-items: center;
    width: 100%;
    height: auto;
  }

  .logo {
    margin-right: 0;
    margin-bottom: 8px;
    height: 48px;
    padding-left: 0;
    justify-content: center;
  }

  .nav-menu {
    width: 100%;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
    height: auto;
  }

  .nav-menu .el-button {
    font-size: 14px;
    padding: 0 10px;
    height: 36px;
  }

  .nav-right {
    width: 100%;
    justify-content: center;
    margin-top: 8px;
    height: auto;
    padding-right: 0;
    gap: 12px;
  }

  .nav-right .el-button {
    height: 36px;
    min-width: 70px;
    font-size: 14px;
  }

  .user-info {
    margin-right: 0;
    height: 36px;
    padding: 4px 10px;
  }

  .header-container {
    height: auto;
    padding: 5px var(--space-sm);
    max-width: 100%;
  }
}

.header-container {
  height: 100%;
  display: flex;
  align-items: center;
  padding-left: var(--space-lg);
  padding-right: var(--space-lg);
  max-width: 1400px;
}

/* 添加退出按钮样式 */
.logout-btn {
  width: 40px;
  height: 38px;
  padding: 0;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: #606266;
  min-width: auto !important;
}

.logout-btn:hover {
  transform: translateY(-2px);
  color: #f56c6c;
}

.auth-buttons {
  display: flex;
  align-items: center;
  gap: 4px;
}

.auth-btn {
  font-size: 15px;
  height: 32px;
  padding: 0 8px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: auto !important;
  font-weight: 500;
  color: #606266;
}

.auth-btn:hover {
  background-color: transparent;
  color: var(--primary-color);
}

.auth-divider {
  color: #c0c4cc;
  font-size: 14px;
  padding: 0 2px;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.footer-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.copyright {
  color: var(--text-color-secondary);
  font-size: 14px;
  margin-bottom: 10px;
}

.icp-info {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: var(--text-color-secondary);
}

.icp-link, .police-link {
  color: var(--text-color-secondary);
  text-decoration: none;
  display: flex;
  align-items: center;
  transition: color 0.2s ease;
}

.icp-link:hover, .police-link:hover {
  color: var(--primary-color);
}

.police-icon {
  height: 16px;
  margin-right: 5px;
}

.social-links {
  display: flex;
  gap: 15px;
  align-items: center;
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.7);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
}

.social-link:hover {
  transform: translateY(-3px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
}

.social-icon {
  width: 24px;
  height: 24px;
}

.qq-group {
  cursor: pointer;
}

.qrcode-popup {
  position: absolute;
  bottom: 45px;
  right: -82px;
  background-color: white;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: none;
  flex-direction: column;
  align-items: center;
  width: 200px;
  z-index: 10;
}

.qq-group:hover .qrcode-popup {
  display: flex;
}

.qrcode-img {
  width: 180px;
  height: 180px;
  object-fit: contain;
}

.qrcode-text {
  margin-top: 8px;
  font-size: 14px;
  color: var(--text-color);
}

@media (max-width: 768px) {
  .footer-content {
    flex-direction: column;
    text-align: center;
  }
  
  .icp-info {
    flex-direction: column;
    gap: 8px;
    align-items: center;
  }
  
  .social-links {
    margin-top: 15px;
  }
  
  .qrcode-popup {
    right: -82px;
  }
}

/* 添加更多菜单下拉样式 */
.more-menu-dropdown {
  margin-left: 4px;
}

.more-menu-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}

:deep(.more-dropdown-menu) {
  min-width: 120px;
  padding: 5px 0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  font-size: 14px;
  transition: all 0.2s ease;
}

:deep(.el-dropdown-menu__item:hover) {
  background-color: rgba(var(--primary-color-rgb, 64, 158, 255), 0.1);
  color: var(--primary-color);
}

.dropdown-icon {
  margin-right: 8px;
  font-size: 16px;
}

/* 优化移动端表格显示 */
:deep(.el-table) {
  @media (max-width: 768px) {
    font-size: 12px !important;
    
    th, td {
      padding: 8px 4px !important;
    }
    
    .cell {
      padding-left: 5px !important;
      padding-right: 5px !important;
    }
  }
}

/* 优化移动端列表项显示 */
:deep(.el-list-item),
:deep(.list-item) {
  @media (max-width: 768px) {
    padding: 10px 8px !important;
  }
}

/* 优化移动端表单显示 */
:deep(.el-form-item) {
  @media (max-width: 768px) {
    margin-bottom: 15px !important;
  }
}

/* 优化移动端下拉菜单和选择器 */
:deep(.el-select),
:deep(.el-dropdown) {
  @media (max-width: 768px) {
    width: 100% !important;
  }
}

/* 优化移动端按钮组 */
:deep(.el-button-group),
:deep(.button-group) {
  @media (max-width: 768px) {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 8px !important;
    
    .el-button {
      flex-grow: 1 !important;
      margin-right: 0 !important;
    }
  }
}

/* 优化首页卡片布局 */
:deep(.home-feature-card),
:deep(.home-card) {
  @media (max-width: 768px) {
    width: 100% !important;
    max-width: 350px !important;
    margin-bottom: 16px !important;
    
    .el-card__body {
      padding: 15px !important;
    }
  }
}

/* 优化图表容器 */
:deep(.chart-container) {
  @media (max-width: 768px) {
    height: auto !important;
    min-height: 250px !important;
    width: 100% !important;
  }
}

/* 优化图片显示 */
:deep(img.responsive-image) {
  @media (max-width: 768px) {
    max-width: 100% !important;
    height: auto !important;
  }
}

/* 优化标题和文本 */
:deep(h1) {
  @media (max-width: 768px) {
    font-size: 24px !important;
  }
}

:deep(h2) {
  @media (max-width: 768px) {
    font-size: 20px !important;
  }
}

:deep(h3) {
  @media (max-width: 768px) {
    font-size: 18px !important;
  }
}

:deep(.large-text) {
  @media (max-width: 768px) {
    font-size: 16px !important;
  }
}

/* 移动端下隐藏首页特性卡片，减小渐变卡片高度 */
:deep(.home-container .hero-features) {
  @media (max-width: 768px) {
    display: none !important;
  }
}

:deep(.home-container .hero-section) {
  @media (max-width: 768px) {
    height: auto !important;
    min-height: 250px !important;
    padding: 30px 20px !important;
  }
}

:deep(.home-container .hero-inner) {
  @media (max-width: 768px) {
    padding: 20px 10px !important;
  }
}

/* 优化首页卡片布局 */
:deep(.home-feature-card),
:deep(.home-card) {
  @media (max-width: 768px) {
    width: 100% !important;
    max-width: 350px !important;
    margin-bottom: 16px !important;
    
    .el-card__body {
      padding: 15px !important;
    }
  }
}

/* 独立页面样式 - 只针对计时器页面 */
.standalone-main {
  padding: 0 !important;
  height: 100vh !important;
  overflow: hidden !important;
}

.standalone-main :deep(.cube-timer) {
  height: 100vh !important;
  width: 100vw !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  z-index: 1000 !important;
  margin: 0 !important;
  padding: 0 !important;
  box-sizing: border-box !important;
}

/* 当路由是独立页面时，强制隐藏body和html的滚动条 */
body.standalone-page,
html.standalone-page {
  overflow: hidden !important;
  height: 100vh !important;
  width: 100vw !important;
}

/* 非独立页面保持正常布局 */
.el-main:not(.standalone-main) {
  padding: 20px !important;
  height: auto !important;
  overflow: visible !important;
}

.el-main:not(.standalone-main) :deep(.page-container) {
  max-width: 1200px !important;
  margin: 0 auto !important;
  height: auto !important;
  overflow: visible !important;
}
</style>
