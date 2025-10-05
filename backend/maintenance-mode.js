import cloud from '@lafjs/cloud'
import jwt from 'jsonwebtoken'

// 内嵌权限验证函数
async function verifyToken(ctx) {
  try {
    const authHeader = ctx.headers?.authorization || ctx.headers?.Authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    
    const token = authHeader.substring(7)
    if (!token) return null
    
    try {
      const secret = '3#x!L9@qAaBvTmZ$8KpQwE2^VdF7'
      const payload = jwt.verify(token, secret)
      const userId = payload.uid
      
      if (!userId) return null
      
      const db = cloud.database()
      const userRes = await db.collection('users').doc(userId).get()
      
      if (!userRes.data) return null
      
      return {
        ...userRes.data,
        role: userRes.data.role || 'user',
        status: userRes.data.status || 'active'
      }
    } catch (e) {
      return null
    }
  } catch (error) {
    return null
  }
}

export default async function (ctx) {
  try {
    const db = cloud.database()
    const method = ctx.method
    
    // 获取维护模式状态（公开接口，任何人都可以查询）
    if (method === 'GET') {
      try {
        // 从系统配置集合获取维护模式状态
        const configRes = await db.collection('system_config')
          .where({ key: 'maintenance_mode' })
          .get()
        
        let maintenanceMode = false
        if (configRes.data && configRes.data.length > 0) {
          maintenanceMode = configRes.data[0].value === true || configRes.data[0].value === 'true'
        }
        
        return {
          code: 200,
          message: '获取维护模式状态成功',
          data: {
            maintenanceMode,
            lastUpdated: configRes.data?.[0]?.updatedAt || null,
            updatedBy: configRes.data?.[0]?.updatedBy || null
          }
        }
      } catch (error) {
        console.error('获取维护模式状态失败:', error)
        return {
          code: 200,
          message: '获取维护模式状态成功',
          data: { maintenanceMode: false }
        }
      }
    }
    
    // 设置维护模式（仅超级管理员）
    if (method === 'PUT') {
      // 验证超级管理员权限
      const currentUser = await verifyToken(ctx)
      if (!currentUser || currentUser.role !== 'super_admin') {
        return { code: 403, message: '权限不足，仅超级管理员可操作' }
      }
      
      if (currentUser.status !== 'active') {
        return { code: 403, message: '账户已被禁用' }
      }
      
      const { maintenanceMode, reason } = ctx.request.body || {}
      
      if (typeof maintenanceMode !== 'boolean') {
        return { code: 400, message: '维护模式状态必须为布尔值' }
      }
      
      try {
        // 查找现有配置
        const existingConfig = await db.collection('system_config')
          .where({ key: 'maintenance_mode' })
          .get()
        
        const configData = {
          key: 'maintenance_mode',
          value: maintenanceMode,
          reason: reason || (maintenanceMode ? '系统维护中' : ''),
          updatedAt: new Date(),
          updatedBy: currentUser._id,
          updatedByName: currentUser.nickname
        }
        
        if (existingConfig.data && existingConfig.data.length > 0) {
          // 更新现有配置
          await db.collection('system_config')
            .doc(existingConfig.data[0]._id)
            .update(configData)
        } else {
          // 创建新配置
          await db.collection('system_config').add({
            ...configData,
            createdAt: new Date()
          })
        }
        
        return {
          code: 200,
          message: `维护模式已${maintenanceMode ? '开启' : '关闭'}`,
          data: {
            maintenanceMode,
            reason: configData.reason,
            updatedBy: currentUser.nickname,
            updatedAt: configData.updatedAt
          }
        }
      } catch (error) {
        console.error('设置维护模式失败:', error)
        return { code: 500, message: '设置维护模式失败: ' + error.message }
      }
    }
    
    return { code: 405, message: '不支持的请求方法' }
    
  } catch (error) {
    console.error('maintenance-mode 接口异常:', error)
    return { code: 500, message: '服务端错误: ' + (error?.message || String(error)) }
  }
}
