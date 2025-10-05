import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/index.js'
import { ROLES } from './permission'

// 使用统一的API模块，不再需要单独的BASE_URL

// 所有API调用现在通过统一的api模块处理
// 详细的API接口列表请参考 src/api/index.js

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)
  const userInfo = ref(null)
  const router = useRouter()
  const apiStatus = ref(true) // API服务状态

  // 检查API服务是否可用
  async function checkApiHealth() {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      // 使用统一的API模块进行健康检查
      await api.initUser()
      
      clearTimeout(timeoutId)
      apiStatus.value = true
      return true
    } catch (error) {
      apiStatus.value = false
      return false
    }
  }

  // 获取授权头
  function getAuthHeader() {
    return token.value ? { 'Authorization': `Bearer ${token.value}` } : {}
  }

  // 存储Token
  function setToken(newToken) {
    if (!newToken) return
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  // 清除Token
  function clearToken() {
    token.value = null
    localStorage.removeItem('token')
  }

  // 从API初始化用户状态
  async function initUser() {
    try {
      if (!token.value) return false

      // 添加超时控制
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      const result = await api.initUser().catch(error => {
        return { ok: false, code: 500 }
      })
      
      clearTimeout(timeoutId)

      // 如果响应成功且有数据
      if (result && result.code === 200 && result.data) {
        // 确保用户数据中同时包含id和_id字段
        const userData = result.data
        
        if (!userData._id && userData.id) {
          userData._id = userData.id
        }
        
        if (!userData.id && userData._id) {
          userData.id = userData._id
        }
        
        user.value = userData
        
        // 将用户信息保存到localStorage
        localStorage.setItem('userInfo', JSON.stringify(userData))
        return true
      }
      
      // 如果响应不成功或没有数据
      user.value = null
      clearToken()
      localStorage.removeItem('userInfo')
      return false
      
    } catch (error) {
      return false
    }
  }
  
  // 解析JWT Token
  function parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  // API登录
  async function login(email, password) {
    try {
      // 清除旧的登录状态
      clearToken()
      user.value = null
      
      // 添加超时控制
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      // 构建请求体
      const requestBody = { email, password }
      
      const result = await api.loginUser(requestBody).catch(error => {
        throw new Error('网络连接失败，请检查您的网络连接')
      })
      
      clearTimeout(timeoutId)
      
      
      if (result.code !== 200) {
        throw new Error(result.message || '登录失败')
      }
      
      // 获取token和用户数据
      const newToken = result.data.token
      const userData = result.data.user
      
      if (!newToken) {
        throw new Error('登录失败: 服务器未返回有效的认证信息')
      }
      
      if (!userData) {
        throw new Error('登录失败: 服务器未返回用户信息')
      }
      
      // 确保用户数据中同时包含id和_id字段
      if (!userData._id && userData.id) {
        userData._id = userData.id
      }
      
      if (!userData.id && userData._id) {
        userData.id = userData._id
      }
      
      // 先设置token，再初始化用户信息
      setToken(newToken)
      // 直接设置用户信息，避免再次请求
      user.value = userData
      
      // 将用户信息保存到localStorage
      localStorage.setItem('userInfo', JSON.stringify(userData))
      
      // 登录成功后刷新页面以更新状态
      window.location.reload()
      return user.value
    } catch (error) {
      throw error
    }
  }

  // API注册
  async function register(userData) {
    try {
      const data = await api.registerUser(userData)
      // 新增：判断后端返回的 code 字段
      if (data.code === 400) throw new Error(data.message || '注册失败')
      
      // 注册成功后自动登录
      await login(userData.email, userData.password)
      // login函数中会自动刷新页面
      return user.value

    } catch (error) {
      throw error
    }
  }

  // API登出
  async function logout() {
    // 清除用户状态
    token.value = null
    userInfo.value = null
    user.value = null  // 确保清除用户状态
    
    // 清除本地存储
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    
    // 返回已解析的Promise
    return Promise.resolve()
  }

  // 更新用户资料
  async function updateProfile(profileData) {
    try {
      // 检查用户是否已登录
      if (!user.value || !token.value) {
        throw new Error('用户未登录')
      }

      // 获取用户ID - 使用_id，因为这是后端数据库中的文档ID
      const userId = user.value._id
      if (!userId) {
        throw new Error('用户ID不存在')
      }
        
      // 构建请求体 - 根据后端API期望的格式
        const requestBody = {
          user: {
            _id: userId
          },
          body: {
          nickname: profileData.nickname || '',
          wcaId: profileData.wcaId || '',
          bio: profileData.bio || ''
          }
        }
        
      // 使用统一API更新用户资料
      const result = await api.updateUserProfile(requestBody)
        
      // 更新本地用户信息
      if (result && result.data) {
        user.value = { ...user.value, ...result.data }
      } else {
        // 如果后端没有返回更新后的数据，手动更新
        user.value = { ...user.value, ...profileData }
            }
            
      // 更新localStorage中的用户信息
      localStorage.setItem('userInfo', JSON.stringify(user.value))
      
      return true
    } catch (error) {
      throw error
    }
  }

  // API更新密码
  async function updatePassword(oldPassword, newPassword) {
    try {
      const result = await api.updateUserPassword({ oldPassword, newPassword })
      if (result.code !== 200) throw new Error('密码更新失败')
      return true
    } catch (error) {
      throw error
    }
  }

  // 用户角色相关计算属性
  const userRole = computed(() => {
    return user.value?.role || ROLES.GUEST
  })
  
  const isLoggedIn = computed(() => {
    return !!user.value && !!token.value
  })
  
  // 角色检查函数
  const hasRole = (role) => {
    return userRole.value === role
  }
  
  const isGuest = computed(() => userRole.value === ROLES.GUEST)
  const isUser = computed(() => userRole.value === ROLES.USER)
  const isAdmin = computed(() => userRole.value === ROLES.ADMIN)
  const isSuperAdmin = computed(() => userRole.value === ROLES.SUPER_ADMIN)

  return {
    user,
    token,
    userInfo,
    apiStatus,
    login,
    register,
    logout,
    updateProfile,
    updatePassword,
    initUser,
    clearToken,
    checkApiHealth,
    getAuthHeader,
    
    // 权限相关
    userRole,
    isLoggedIn,
    hasRole,
    isGuest,
    isUser,
    isAdmin,
    isSuperAdmin
  }
})