import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

// API基础URL配置（使用时替换为实际地址）
const API_BASE_URL = 'https://w3mavh11ex.bja.sealos.run'  // 直接使用完整的后端API地址

// 当前前端调用的API接口列表：
// 1. 用户初始化接口
//   - 路径: /init
//   - 方法: GET
//   - 使用函数: initUser()

// 2. 用户登录接口
//   - 路径: /user-login
//   - 方法: POST
//   - 使用函数: login()

// 3. 用户注册接口
//   - 路径: /user-register
//   - 方法: POST
//   - 使用函数: register()

// 4. 用户登出接口
//   - 路径: /user-logout
//   - 方法: POST
//   - 使用函数: logout()

// 5. 用户资料更新接口
//   - 路径: /user-profile
//   - 方法: PUT
//   - 使用函数: updateProfile()

// 6. 用户密码更新接口
//   - 路径: /user-password
//   - 方法: PUT
//   - 使用函数: updatePassword()

// 7. 头像上传接口
//   - 路径: /upload-avatar
//   - 方法: POST
//   - 使用函数: uploadAvatar()

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)
  const userInfo = ref(null)
  const router = useRouter()
  const apiStatus = ref(true) // API服务状态
  const debug = ref(true) // 调试模式

  // 调试日志
  function logDebug(...args) {
    if (debug.value) {
      console.log(...args)
    }
  }

  // 检查API服务是否可用
  async function checkApiHealth() {
    try {
      console.log('checkApiHealth - 检查API服务状态')
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: controller.signal
      }).catch(error => {
        console.error('健康检查请求失败:', error)
        return { ok: false }
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        console.log('checkApiHealth - API服务正常')
        apiStatus.value = true
        return true
      } else {
        console.error('checkApiHealth - API服务异常')
        apiStatus.value = false
        return false
      }
    } catch (error) {
      console.error('checkApiHealth - 检查失败:', error)
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
    if (!newToken) {
      console.warn('setToken - 试图设置空token')
      return
    }
    console.log('setToken - 设置新token:', newToken)
    token.value = newToken
    localStorage.setItem('token', newToken)
    console.log('setToken - 验证token设置:', {
      storeToken: token.value,
      localStorageToken: localStorage.getItem('token')
    })
  }

  // 清除Token
  function clearToken() {
    token.value = null
    localStorage.removeItem('token')
  }

  // 从API初始化用户状态
  async function initUser() {
    try {
      console.log('initUser - 开始初始化用户状态')
      console.log('initUser - token值:', token.value)
      console.log('initUser - localStorage token:', localStorage.getItem('token'))
      
      // 检查是否有token
      if (!token.value) {
        console.log('initUser - 没有token，返回false')
        return false
      }

      // 添加超时控制
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时
      
      console.log('initUser - 发送初始化请求到:', `${API_BASE_URL}/init`)
      const response = await fetch(`${API_BASE_URL}/init`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.value}`
        },
        signal: controller.signal
      }).catch(error => {
        console.error('initUser - 请求失败:', error)
        return { ok: false }
      })
      
      clearTimeout(timeoutId)
      
      console.log('initUser - 收到响应, 状态:', response.status)
      
      // 如果请求失败
      if (!response.ok) {
        console.error('initUser - HTTP错误:', response.status)
        const errorText = await response.text().catch(() => '')
        console.error('initUser - 错误详情:', errorText)
        return false
      }
      
      const result = await response.json().catch(error => {
        console.error('initUser - 解析JSON失败:', error)
        return null
      })
      
      console.log('initUser - 接口返回:', result)

      // 如果响应成功且有数据
      if (result && result.code === 200 && result.data) {
        // 确保用户数据中同时包含id和_id字段
        const userData = result.data
        
        if (!userData._id && userData.id) {
          userData._id = userData.id
          console.log('initUser - 添加_id字段:', userData._id)
        }
        
        if (!userData.id && userData._id) {
          userData.id = userData._id
          console.log('initUser - 添加id字段:', userData.id)
        }
        
        console.log('initUser - 处理后的用户数据:', {
          id: userData.id,
          _id: userData._id,
          hasId: !!userData.id,
          has_Id: !!userData._id
        })
        
        user.value = userData
        
        // 将用户信息保存到localStorage
        localStorage.setItem('userInfo', JSON.stringify(userData))
        console.log('initUser - 用户信息已保存到localStorage:', userData)
        
        console.log('initUser - 用户信息设置成功:', user.value)
        return true
      }
      
      // 如果响应不成功或没有数据
      console.log('initUser - 初始化失败，清除状态')
      user.value = null
      clearToken()
      localStorage.removeItem('userInfo')
      return false
      
    } catch (error) {
      console.error('初始化用户失败:', error)
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
      console.error('解析JWT失败:', e);
      return null;
    }
  }

  // API登录
  async function login(email, password) {
    try {
      // 清除旧的登录状态
      clearToken()
      user.value = null
      
      console.log('login - 开始登录流程')
      console.log('login - 登录参数:', { email })
      
      // 添加超时控制
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时
      
      // 构建请求体
      const requestBody = {
        email,
        password
      }
      
      console.log('login - 发送登录请求到:', `${API_BASE_URL}/user-login`)
      const response = await fetch(`${API_BASE_URL}/user-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      }).catch(error => {
        console.error('login - 请求失败:', error)
        throw new Error('网络连接失败，请检查您的网络连接')
      })
      
      clearTimeout(timeoutId)
      
      console.log('login - 收到响应, 状态:', response.status)
      
      // 如果请求失败
      if (!response.ok) {
        console.error('login - HTTP错误:', response.status)
        const errorText = await response.text().catch(() => '')
        console.error('login - 错误详情:', errorText)
        throw new Error(`登录失败 (${response.status}): ${errorText || '未知错误'}`)
      }
      
      const result = await response.json().catch(error => {
        console.error('login - 解析JSON失败:', error)
        throw new Error('无法解析服务器响应')
      })
      
      console.log('login - 登录接口返回:', result)
      
      if (result.code !== 200) {
        throw new Error(result.message || '登录失败')
      }
      
      // 获取token和用户数据
      const newToken = result.data.token
      const userData = result.data.user
      
      if (!newToken) {
        console.error('login - 服务器未返回token')
        throw new Error('登录失败: 服务器未返回有效的认证信息')
      }
      
      if (!userData) {
        console.error('login - 服务器未返回用户信息')
        throw new Error('登录失败: 服务器未返回用户信息')
      }
      
      console.log('login - 登录成功，收到token:', newToken)
      
      // 确保用户数据中同时包含id和_id字段
      if (!userData._id && userData.id) {
        userData._id = userData.id
        console.log('login - 添加_id字段:', userData._id)
      }
      
      if (!userData.id && userData._id) {
        userData.id = userData._id
        console.log('login - 添加id字段:', userData.id)
      }
      
      console.log('login - 处理后的用户数据:', {
        id: userData.id,
        _id: userData._id,
        hasId: !!userData.id,
        has_Id: !!userData._id
      })
      
      // 先设置token，再初始化用户信息
      setToken(newToken)
      // 直接设置用户信息，避免再次请求
      user.value = userData
      
      // 将用户信息保存到localStorage
      localStorage.setItem('userInfo', JSON.stringify(userData))
      console.log('login - 用户信息已保存到localStorage:', userData)
      
      console.log('login - token已保存，当前store token:', token.value)
      console.log('login - localStorage token:', localStorage.getItem('token'))
      
      // 登录成功后刷新页面以更新状态
      window.location.reload()
      return user.value
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  }

  // API注册
  async function register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/user-register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        credentials: 'include',
        body: JSON.stringify(userData)
      })
      const data = await response.json()
      // 新增：判断后端返回的 code 字段
      if (!response.ok || data.code === 400) throw new Error(data.message || '注册失败')
      
      // 注册成功后自动登录
      await login(userData.email, userData.password)
      // login函数中会自动刷新页面
      return user.value

    } catch (error) {
      console.error('注册失败:', error)
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
      console.log('updateProfile - 开始更新用户资料:', profileData)
        
      // 检查用户是否已登录
      if (!user.value || !token.value) {
        console.error('updateProfile - 用户未登录')
        throw new Error('用户未登录')
        }

      // 获取用户ID - 使用_id，因为这是后端数据库中的文档ID
      const userId = user.value._id
        if (!userId) {
        console.error('updateProfile - 用户ID不存在')
        throw new Error('用户ID不存在')
        }

      console.log('updateProfile - 使用用户ID:', userId)
        
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
        
      console.log('updateProfile - 请求体:', JSON.stringify(requestBody))

      // 使用正确的API路径 - 根据之前的注释，应该是/user-profile
        const response = await fetch(`${API_BASE_URL}/user-profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token.value}`
          },
        body: JSON.stringify(requestBody)
      })
      
      // 检查HTTP状态
        if (!response.ok) {
        const errorText = await response.text()
        console.error('updateProfile - HTTP错误:', response.status, errorText)
        throw new Error(`服务器错误 (${response.status}): ${errorText || '未知错误'}`)
        }
        
        const result = await response.json()
      console.log('updateProfile - 接口返回:', result)
        
      // 更新本地用户信息
      if (result && result.data) {
        user.value = { ...user.value, ...result.data }
      } else {
        // 如果后端没有返回更新后的数据，手动更新
        user.value = { ...user.value, ...profileData }
            }
            
      // 更新localStorage中的用户信息
      localStorage.setItem('userInfo', JSON.stringify(user.value))
      
      console.log('updateProfile - 用户资料更新成功:', user.value)
      return true
      } catch (error) {
      console.error('更新用户资料失败:', error)
        throw error
    }
  }

  // API更新密码
  async function updatePassword(oldPassword, newPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/user-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        credentials: 'include',
        body: JSON.stringify({ oldPassword, newPassword })
      })
      if (!response.ok) throw new Error('密码更新失败')
      return true
    } catch (error) {
      console.error('更新密码失败:', error)
      throw error
    }
  }

  return {
    user,
    token,
    userInfo,
    apiStatus,
    debug,
    login,
    register,
    logout,
    updateProfile,
    updatePassword,
    initUser,
    clearToken,
    checkApiHealth,
    getAuthHeader,
    logDebug,
    API_BASE_URL
  }
})