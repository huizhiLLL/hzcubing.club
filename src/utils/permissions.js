import { usePermissionStore } from '@/stores/permission'
import { useUserStore } from '@/stores/user'

// 权限检查工具函数

/**
 * 检查是否可以编辑记录
 * @param {Object} record - 记录对象
 * @param {string} currentUserId - 当前用户ID
 * @returns {boolean}
 */
export function canEditRecord(record, currentUserId) {
  const permissionStore = usePermissionStore()
  
  // 如果是自己的记录
  if (record.userId === currentUserId) {
    return permissionStore.hasPermission('edit_own_record')
  }
  
  // 如果是他人的记录（目前管理员也不能编辑）
  return false
}

/**
 * 检查是否可以删除记录
 * @param {Object} record - 记录对象
 * @param {string} currentUserId - 当前用户ID
 * @returns {boolean}
 */
export function canDeleteRecord(record, currentUserId) {
  const permissionStore = usePermissionStore()
  
  // 如果是自己的记录
  if (record.userId === currentUserId) {
    return permissionStore.hasPermission('delete_own_record')
  }
  
  // 如果是他人的记录（目前管理员也不能删除）
  return false
}

/**
 * 检查是否可以提交成绩
 * @returns {boolean}
 */
export function canSubmitRecord() {
  const permissionStore = usePermissionStore()
  return permissionStore.hasPermission('submit_record')
}

/**
 * 检查是否可以访问管理面板
 * @returns {boolean}
 */
export function canAccessAdminPanel() {
  const permissionStore = usePermissionStore()
  return permissionStore.hasPermission('admin_panel')
}

/**
 * 检查是否可以访问超级管理员面板
 * @returns {boolean}
 */
export function canAccessSuperAdminPanel() {
  const permissionStore = usePermissionStore()
  return permissionStore.hasPermission('super_admin_panel')
}

/**
 * 检查是否可以管理用户
 * @returns {boolean}
 */
export function canManageUsers() {
  const permissionStore = usePermissionStore()
  return permissionStore.hasPermission('manage_users')
}

/**
 * 检查是否可以管理权限
 * @returns {boolean}
 */
export function canManagePermissions() {
  const permissionStore = usePermissionStore()
  return permissionStore.hasPermission('manage_permissions')
}

/**
 * 获取用户角色显示名称
 * @param {string} role - 角色代码
 * @returns {string}
 */
export function getRoleDisplayName(role) {
  const roleNames = {
    'guest': '访客',
    'user': '用户',
    'admin': '管理员',
    'super_admin': '顶级管理员'
  }
  return roleNames[role] || '未知'
}

/**
 * 获取角色颜色（用于UI显示）
 * @param {string} role - 角色代码
 * @returns {string}
 */
export function getRoleColor(role) {
  const roleColors = {
    'guest': '#909399',      // 灰色
    'user': '#409EFF',       // 蓝色
    'admin': '#E6A23C',      // 橙色
    'super_admin': '#F56C6C' // 红色
  }
  return roleColors[role] || '#909399'
}

/**
 * 检查角色等级是否足够
 * @param {string} userRole - 用户角色
 * @param {string} requiredRole - 需要的最低角色
 * @returns {boolean}
 */
export function hasMinimumRole(userRole, requiredRole) {
  const roleLevels = {
    'guest': 0,
    'user': 1,
    'admin': 2,
    'super_admin': 3
  }
  
  const userLevel = roleLevels[userRole] || 0
  const requiredLevel = roleLevels[requiredRole] || 0
  
  return userLevel >= requiredLevel
}
