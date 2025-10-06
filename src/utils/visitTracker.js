import api from '@/api/index.js'

/**
 * 访问统计工具
 */
class VisitTracker {
  constructor() {
    this.isTracking = false
    this.sessionId = this.generateSessionId()
    this.lastTrackTime = 0
    this.trackingInterval = 30000 // 30秒内不重复统计同一页面
  }
  
  /**
   * 生成会话ID
   */
  generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
  
  /**
   * 跟踪页面访问（仅统计主页访问）
   * @param {string} page - 页面路径
   * @param {Object} options - 额外选项
   */
  async trackPageVisit(page, options = {}) {
    try {
      const currentPage = page || window.location.pathname
      
      // 只统计主页访问（/ 或 /home）
      if (currentPage !== '/' && currentPage !== '/home') {
        return
      }
      
      // 防止频繁统计
      const now = Date.now()
      if (now - this.lastTrackTime < this.trackingInterval) {
        return
      }
      
      const visitData = {
        page: currentPage,
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        ...options
      }
      
      // 异步发送，不阻塞页面
      api.trackVisit(visitData).catch(() => {
        // 静默处理访问统计失败
      })
      
      this.lastTrackTime = now
      
    } catch (error) {
      // 静默处理访问跟踪错误
    }
  }
  
  /**
   * 自动跟踪路由变化
   */
  startAutoTracking(router) {
    if (this.isTracking) return
    
    this.isTracking = true
    
    // 跟踪初始页面
    this.trackPageVisit(window.location.pathname)
    
    // 跟踪路由变化
    router.afterEach((to) => {
      this.trackPageVisit(to.path)
    })
    
    // 跟踪页面可见性变化（用户回到页面时）
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.trackPageVisit(window.location.pathname, { type: 'visibility_change' })
      }
    })
  }
  
  /**
   * 停止自动跟踪
   */
  stopAutoTracking() {
    this.isTracking = false
  }
  
  /**
   * 跟踪特殊事件
   * @param {string} event - 事件名称
   * @param {Object} data - 事件数据
   */
  async trackEvent(event, data = {}) {
    try {
      const eventData = {
        page: window.location.pathname,
        event,
        data,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString()
      }
      
      api.trackVisit(eventData).catch(() => {
        // 静默处理事件统计失败
      })
      
    } catch (error) {
      // 静默处理事件跟踪错误
    }
  }
}

// 创建全局实例
export const visitTracker = new VisitTracker()
