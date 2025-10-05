import api from '@/api/index.js'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'

/**
 * 维护模式检查工具
 */
export class MaintenanceChecker {
  constructor() {
    this.isMaintenanceMode = false
    this.checkInterval = null
    this.checkFrequency = 60000 // 每分钟检查一次
  }
  
  /**
   * 检查维护模式状态
   */
  async checkMaintenanceMode() {
    try {
      const result = await api.getMaintenanceMode()
      
      if (result.code === 200) {
        const wasInMaintenance = this.isMaintenanceMode
        this.isMaintenanceMode = result.data.maintenanceMode || false
        
        // 如果维护模式状态发生变化
        if (wasInMaintenance !== this.isMaintenanceMode) {
          this.handleMaintenanceModeChange(this.isMaintenanceMode)
        }
        
        return this.isMaintenanceMode
      }
    } catch (error) {
      // 静默处理维护模式检查失败
    }
    
    return false
  }
  
  /**
   * 处理维护模式状态变化
   */
  handleMaintenanceModeChange(isMaintenanceMode) {
    const userStore = useUserStore()
    const permissionStore = usePermissionStore()
    
    if (isMaintenanceMode) {
      // 进入维护模式
      // 如果不是管理员，跳转到维护页面
      if (!permissionStore.isAdmin && !permissionStore.isSuperAdmin) {
        window.location.href = '/maintenance'
      }
    } else {
      // 退出维护模式
      // 如果当前在维护页面，跳转到首页
      if (window.location.pathname === '/maintenance') {
        window.location.href = '/'
      }
    }
  }
  
  /**
   * 开始定期检查维护模式
   */
  startPeriodicCheck() {
    // 立即检查一次
    this.checkMaintenanceMode()
    
    // 设置定期检查
    this.checkInterval = setInterval(() => {
      this.checkMaintenanceMode()
    }, this.checkFrequency)
  }
  
  /**
   * 停止定期检查
   */
  stopPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }
  
  /**
   * 检查当前用户是否可以在维护模式下访问
   */
  canAccessDuringMaintenance() {
    const permissionStore = usePermissionStore()
    return permissionStore.isAdmin || permissionStore.isSuperAdmin
  }
}

// 创建全局实例
export const maintenanceChecker = new MaintenanceChecker()
