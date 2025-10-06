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
      // 使用JWT库验证token
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
      console.error('Token验证失败:', e)
      return null
    }
  } catch (error) {
    console.error('权限验证错误:', error)
    return null
  }
}

export default async function (ctx) {
  try {
    const { method } = ctx.request
    const db = cloud.database()
    
    // GET - 获取整活项目列表
    if (method === 'GET') {
      const { page = 1, pageSize = 50 } = ctx.query || {}
      const p = Math.max(1, parseInt(page))
      const ps = Math.min(100, Math.max(1, parseInt(pageSize)))
      
      const col = db.collection('meme_events')
      
      // 获取总数
      let total = null
      try {
        const countRes = await col.count()
        total = countRes.total || 0
      } catch { 
        total = null 
      }
      
      // 获取项目列表
      const listRes = await col
        .orderBy('createdAt', 'desc')
        .skip((p - 1) * ps)
        .limit(ps)
        .get()
      
      const data = (listRes.data || []).map(event => ({
        ...event,
        type: 'meme' // 确保类型为meme
      }))
      
      return { 
        code: 200, 
        message: '获取整活项目成功', 
        data, 
        page: p, 
        pageSize: ps, 
        total 
      }
    }
    
    // POST - 添加整活项目（需要管理员权限）
    if (method === 'POST') {
      const currentUser = await verifyToken(ctx)
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super_admin')) {
        return { code: 403, message: '权限不足，仅管理员可操作' }
      }
      
      if (currentUser.status !== 'active') {
        return { code: 403, message: '账户已被禁用' }
      }
      
      const { eventCode, eventName, description } = ctx.request.body || {}
      
      if (!eventCode || !eventName) {
        return { code: 400, message: '项目代码和名称不能为空' }
      }
      
      // 检查项目代码是否已存在
      const existingRes = await db.collection('meme_events')
        .where({ eventCode })
        .get()
      
      if (existingRes.data && existingRes.data.length > 0) {
        return { code: 400, message: '项目代码已存在' }
      }
      
      // 添加新项目
      const newEvent = {
        eventCode,
        eventName,
        description: description || '',
        type: 'meme',
        createdAt: new Date(),
        createdBy: currentUser._id,
        createdByName: currentUser.nickname,
        isActive: true
      }
      
      await db.collection('meme_events').add(newEvent)
      
      return {
        code: 200,
        message: '整活项目添加成功',
        data: newEvent
      }
    }
    
    // PUT - 更新整活项目（需要管理员权限）
    if (method === 'PUT') {
      const currentUser = await verifyToken(ctx)
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super_admin')) {
        return { code: 403, message: '权限不足，仅管理员可操作' }
      }
      
      if (currentUser.status !== 'active') {
        return { code: 403, message: '账户已被禁用' }
      }
      
      const { id, eventCode, eventName, description, isActive } = ctx.request.body || {}
      
      if (!id || !eventCode || !eventName) {
        return { code: 400, message: '项目ID、代码和名称不能为空' }
      }
      
      // 检查项目是否存在
      const existingRes = await db.collection('meme_events').doc(id).get()
      if (!existingRes.data) {
        return { code: 404, message: '项目不存在' }
      }
      
      // 检查项目代码是否与其他项目冲突
      const conflictRes = await db.collection('meme_events')
        .where({
          eventCode,
          _id: db.command.neq(id)
        })
        .get()
      
      if (conflictRes.data && conflictRes.data.length > 0) {
        return { code: 400, message: '项目代码与其他项目冲突' }
      }
      
      // 更新项目
      const updateData = {
        eventCode,
        eventName,
        description: description || '',
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date(),
        updatedBy: currentUser._id,
        updatedByName: currentUser.nickname
      }
      
      await db.collection('meme_events').doc(id).update(updateData)
      
      return {
        code: 200,
        message: '整活项目更新成功',
        data: { id, ...updateData }
      }
    }
    
    // DELETE - 删除整活项目（需要管理员权限）
    if (method === 'DELETE') {
      const currentUser = await verifyToken(ctx)
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super_admin')) {
        return { code: 403, message: '权限不足，仅管理员可操作' }
      }
      
      if (currentUser.status !== 'active') {
        return { code: 403, message: '账户已被禁用' }
      }
      
      const { id } = ctx.request.body || {}
      
      if (!id) {
        return { code: 400, message: '项目ID不能为空' }
      }
      
      // 检查项目是否存在
      const existingRes = await db.collection('meme_events').doc(id).get()
      if (!existingRes.data) {
        return { code: 404, message: '项目不存在' }
      }
      
      // 检查是否有相关的成绩记录
      const recordsRes = await db.collection('records')
        .where({ event: existingRes.data.eventCode })
        .limit(1)
        .get()
      
      if (recordsRes.data && recordsRes.data.length > 0) {
        return { code: 400, message: '该项目已有成绩记录，无法删除' }
      }
      
      // 删除项目
      await db.collection('meme_events').doc(id).remove()
      
      return {
        code: 200,
        message: '整活项目删除成功'
      }
    }
    
    return { code: 405, message: '不支持的请求方法' }
    
  } catch (error) {
    console.error('meme-events 接口异常:', error)
    return { code: 500, message: '服务端错误: ' + (error?.message || String(error)) }
  }
}
