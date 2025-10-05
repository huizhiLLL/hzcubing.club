import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from './user'

// 权限角色定义
export const ROLES = {
  GUEST: 'guest',           // 访客 - 未登录状态
  USER: 'user',             // 用户 - 已登录普通用户  
  ADMIN: 'admin',           // 管理员 - 内容管理权限
  SUPER_ADMIN: 'super_admin' // 顶级管理员 - 最高权限
}

// 权限功能定义
export const PERMISSIONS = {
  // 基础浏览权限
  VIEW_RECORDS: 'view_records',
  VIEW_LEADERBOARD: 'view_leaderboard', 
  VIEW_PLAYERS: 'view_players',
  
  // 用户操作权限
  SUBMIT_RECORD: 'submit_record',
  EDIT_OWN_RECORD: 'edit_own_record',
  DELETE_OWN_RECORD: 'delete_own_record',
  UPDATE_PROFILE: 'update_profile',
  
  // 管理员权限（暂时与用户相同，后续扩展）
  ADMIN_PANEL: 'admin_panel',
  
  // 顶级管理员权限
  SUPER_ADMIN_PANEL: 'super_admin_panel',
  MANAGE_USERS: 'manage_users',
  MANAGE_PERMISSIONS: 'manage_permissions',
  SYSTEM_CONFIG: 'system_config',
  DATA_EXPORT: 'data_export',
  DATA_IMPORT: 'data_import'
}

// 角色权限映射
const ROLE_PERMISSIONS = {
  [ROLES.GUEST]: [
    PERMISSIONS.VIEW_RECORDS,
    PERMISSIONS.VIEW_LEADERBOARD,
    PERMISSIONS.VIEW_PLAYERS
  ],
  [ROLES.USER]: [
    PERMISSIONS.VIEW_RECORDS,
    PERMISSIONS.VIEW_LEADERBOARD,
    PERMISSIONS.VIEW_PLAYERS,
    PERMISSIONS.SUBMIT_RECORD,
    PERMISSIONS.EDIT_OWN_RECORD,
    PERMISSIONS.DELETE_OWN_RECORD,
    PERMISSIONS.UPDATE_PROFILE
  ],
  [ROLES.ADMIN]: [
    // 暂时与用户权限相同，后续扩展
    PERMISSIONS.VIEW_RECORDS,
    PERMISSIONS.VIEW_LEADERBOARD,
    PERMISSIONS.VIEW_PLAYERS,
    PERMISSIONS.SUBMIT_RECORD,
    PERMISSIONS.EDIT_OWN_RECORD,
    PERMISSIONS.DELETE_OWN_RECORD,
    PERMISSIONS.UPDATE_PROFILE,
    PERMISSIONS.ADMIN_PANEL
  ],
  [ROLES.SUPER_ADMIN]: [
    // 包含所有权限
    ...Object.values(PERMISSIONS)
  ]
}

export const usePermissionStore = defineStore('permission', () => {
  const userStore = useUserStore()
  
  // 获取当前用户角色
  const currentRole = computed(() => {
    if (!userStore.user) return ROLES.GUEST
    return userStore.user.role || ROLES.USER
  })
  
  // 获取当前用户权限列表
  const currentPermissions = computed(() => {
    return ROLE_PERMISSIONS[currentRole.value] || ROLE_PERMISSIONS[ROLES.GUEST]
  })
  
  // 检查是否有特定权限
  const hasPermission = (permission) => {
    return currentPermissions.value.includes(permission)
  }
  
  // 检查是否有任一权限
  const hasAnyPermission = (permissions) => {
    return permissions.some(permission => hasPermission(permission))
  }
  
  // 检查是否有所有权限
  const hasAllPermissions = (permissions) => {
    return permissions.every(permission => hasPermission(permission))
  }
  
  // 角色检查函数
  const isGuest = computed(() => currentRole.value === ROLES.GUEST)
  const isUser = computed(() => currentRole.value === ROLES.USER)
  const isAdmin = computed(() => currentRole.value === ROLES.ADMIN)
  const isSuperAdmin = computed(() => currentRole.value === ROLES.SUPER_ADMIN)
  
  // 权限等级检查（用于层级权限）
  const getRoleLevel = (role) => {
    const levels = {
      [ROLES.GUEST]: 0,
      [ROLES.USER]: 1,
      [ROLES.ADMIN]: 2,
      [ROLES.SUPER_ADMIN]: 3
    }
    return levels[role] || 0
  }
  
  // 检查是否有足够的权限等级
  const hasMinimumRole = (requiredRole) => {
    return getRoleLevel(currentRole.value) >= getRoleLevel(requiredRole)
  }
  
  // 检查是否可以访问特定路由
  const canAccessRoute = (routeMeta) => {
    if (!routeMeta) return true
    
    // 检查是否需要登录
    if (routeMeta.requiresAuth && isGuest.value) {
      return false
    }
    
    // 检查角色要求
    if (routeMeta.requiredRole && !hasMinimumRole(routeMeta.requiredRole)) {
      return false
    }
    
    // 检查权限要求
    if (routeMeta.requiredPermissions) {
      if (Array.isArray(routeMeta.requiredPermissions)) {
        return hasAllPermissions(routeMeta.requiredPermissions)
      } else {
        return hasPermission(routeMeta.requiredPermissions)
      }
    }
    
    return true
  }
  
  // 检查是否可以操作特定资源（比如编辑自己的记录）
  const canOperateResource = (resource, operation, resourceOwnerId = null) => {
    // 如果是操作自己的资源
    if (resourceOwnerId && userStore.user && resourceOwnerId === userStore.user._id) {
      return hasPermission(`${operation}_own_${resource}`)
    }
    
    // 如果是操作他人的资源
    return hasPermission(`${operation}_${resource}`)
  }
  
  return {
    // 状态
    currentRole,
    currentPermissions,
    
    // 权限检查
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessRoute,
    canOperateResource,
    
    // 角色检查
    isGuest,
    isUser,
    isAdmin,
    isSuperAdmin,
    hasMinimumRole,
    
    // 常量
    ROLES,
    PERMISSIONS
  }
})
