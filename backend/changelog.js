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
    
    // 获取更新日志列表（公开接口）
    if (method === 'GET') {
      const { page = 1, pageSize = 10 } = ctx.query || {}
      
      const p = Math.max(1, parseInt(page))
      const ps = Math.min(50, Math.max(1, parseInt(pageSize)))
      
      try {
        // 获取更新日志列表
        const changelogRes = await db.collection('changelogs')
          .orderBy('createdAt', 'desc')
          .skip((p - 1) * ps)
          .limit(ps)
          .get()
        
        // 获取总数
        let total = null
        try {
          const countRes = await db.collection('changelogs').count()
          total = countRes?.total ?? null
        } catch { 
          total = null 
        }
        
        const data = (changelogRes.data || []).map(log => ({
          ...log,
          // 确保日期格式一致
          date: log.date || log.createdAt
        }))
        
        return {
          code: 200,
          message: '获取更新日志成功',
          data,
          page: p,
          pageSize: ps,
          total
        }
      } catch (error) {
        console.error('获取更新日志失败:', error)
        return {
          code: 200,
          message: '获取更新日志成功',
          data: [],
          page: p,
          pageSize: ps,
          total: 0
        }
      }
    }
    
    // 添加更新日志（仅超级管理员）
    if (method === 'POST') {
      // 验证超级管理员权限
      const currentUser = await verifyToken(ctx)
      if (!currentUser || currentUser.role !== 'super_admin') {
        return { code: 403, message: '权限不足，仅超级管理员可操作' }
      }
      
      if (currentUser.status !== 'active') {
        return { code: 403, message: '账户已被禁用' }
      }
      
      const { version, changes, date } = ctx.request.body || {}
      
      if (!version || !changes || !Array.isArray(changes) || changes.length === 0) {
        return { code: 400, message: '版本号和更新内容不能为空' }
      }
      
      // 创建更新日志
      const changelogData = {
        version,
        date: date || new Date().toISOString().split('T')[0], // YYYY-MM-DD格式
        changes,
        createdAt: new Date(),
        createdBy: currentUser._id,
        createdByName: currentUser.nickname
      }
      
      const result = await db.collection('changelogs').add(changelogData)
      
      return {
        code: 200,
        message: '更新日志添加成功',
        data: { _id: result.id, ...changelogData }
      }
    }
    
    // 更新更新日志（仅超级管理员）
    if (method === 'PUT') {
      // 验证超级管理员权限
      const currentUser = await verifyToken(ctx)
      if (!currentUser || currentUser.role !== 'super_admin') {
        return { code: 403, message: '权限不足，仅超级管理员可操作' }
      }
      
      if (currentUser.status !== 'active') {
        return { code: 403, message: '账户已被禁用' }
      }
      
      const { id, version, changes, date } = ctx.request.body || {}
      
      if (!id || !version || !changes || !Array.isArray(changes)) {
        return { code: 400, message: '缺少必要参数' }
      }
      
      // 检查日志是否存在
      const existingLog = await db.collection('changelogs').doc(id).get()
      if (!existingLog.data) {
        return { code: 404, message: '更新日志不存在' }
      }
      
      // 更新日志
      const updateData = {
        version,
        date: date || new Date().toISOString().split('T')[0],
        changes,
        updatedAt: new Date(),
        updatedBy: currentUser._id,
        updatedByName: currentUser.nickname
      }
      
      await db.collection('changelogs').doc(id).update(updateData)
      
      return {
        code: 200,
        message: '更新日志修改成功',
        data: { _id: id, ...updateData }
      }
    }
    
    // 删除更新日志（仅超级管理员）
    if (method === 'DELETE') {
      // 验证超级管理员权限
      const currentUser = await verifyToken(ctx)
      if (!currentUser || currentUser.role !== 'super_admin') {
        return { code: 403, message: '权限不足，仅超级管理员可操作' }
      }
      
      if (currentUser.status !== 'active') {
        return { code: 403, message: '账户已被禁用' }
      }
      
      const { id } = ctx.query || {}
      
      if (!id) {
        return { code: 400, message: '缺少日志ID参数' }
      }
      
      // 检查日志是否存在
      const existingLog = await db.collection('changelogs').doc(id).get()
      if (!existingLog.data) {
        return { code: 404, message: '更新日志不存在' }
      }
      
      // 删除日志
      await db.collection('changelogs').doc(id).remove()
      
      return {
        code: 200,
        message: '更新日志删除成功'
      }
    }
    
    return { code: 405, message: '不支持的请求方法' }
    
  } catch (error) {
    console.error('changelog 接口异常:', error)
    return { code: 500, message: '服务端错误: ' + (error?.message || String(error)) }
  }
}
