import cloud from '@lafjs/cloud'

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
      const payload = JSON.parse(atob(token.split('.')[1]))
      const userId = payload.uid || payload.userId || payload.sub
      
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

// 主函数，根据请求方法和action参数调用不同的处理函数
export default async function (ctx) {
  const { method, query } = ctx.request
  const action = query.action

  // 使用统一的端点 /mc-location，通过action参数区分操作
  if (ctx.request.path === '/mc-location') {
    // GET请求处理
    if (method === 'GET') {
      // 获取所有坐标信息
      if (action === 'list') {
        return await getMcLocations(ctx)
      }
    }
    // POST请求处理（添加坐标）
    else if (method === 'POST') {
      return await addMcLocation(ctx)
    }
    // PUT请求处理（修改坐标）
    else if (method === 'PUT') {
      return await updateMcLocation(ctx)
    }
    // DELETE请求处理（删除坐标）
    else if (method === 'DELETE') {
      return await deleteMcLocation(ctx)
    }
  }

  return {
    code: 404,
    message: '接口不存在'
  }
}

// 获取所有坐标信息
async function getMcLocations(ctx) {
  try {
    const db = cloud.database()
    const locationsCollection = db.collection('mc_locations')

    // 获取所有坐标记录并按创建时间降序排列
    const result = await locationsCollection
      .orderBy('createdAt', 'desc')
      .get()

    return {
      code: 0,
      data: result.data,
      message: '获取坐标信息成功'
    }
  } catch (error) {
    console.error('获取坐标信息失败:', error)
    return {
      code: 1,
      message: '获取坐标信息失败: ' + error.message
    }
  }
}

// 添加坐标信息
async function addMcLocation(ctx) {
  try {
    // 验证用户登录状态
    const currentUser = await verifyToken(ctx)
    if (!currentUser) {
      return { code: 401, message: '未登录或token无效' }
    }
    
    if (currentUser.status !== 'active') {
      return { code: 403, message: '账户已被禁用' }
    }

    // 验证必填字段
    const { name, type, x, y, z } = ctx.request.body || {}
    if (!name || !type || x === undefined || y === undefined || z === undefined) {
      return {
        code: 400,
        message: '缺少必要参数'
      }
    }

    const db = cloud.database()
    const locationsCollection = db.collection('mc_locations')

    // 构建坐标数据，使用当前用户信息
    const locationData = {
      name,
      type,
      x: parseInt(x),
      y: parseInt(y),
      z: parseInt(z),
      description: ctx.request.body.description || '',
      authorId: currentUser._id,
      authorName: currentUser.nickname,
      createdAt: new Date()
    }

    // 添加到数据库
    const result = await locationsCollection.add(locationData)

    return {
      code: 0,
      data: {
        _id: result.id
      },
      message: '添加坐标成功'
    }
  } catch (error) {
    console.error('添加坐标失败:', error)
    return {
      code: 500,
      message: '添加坐标失败: ' + error.message
    }
  }
}

// 修改坐标信息
async function updateMcLocation(ctx) {
  try {
    // 验证用户登录状态
    const currentUser = await verifyToken(ctx)
    if (!currentUser) {
      return { code: 401, message: '未登录或token无效' }
    }
    
    if (currentUser.status !== 'active') {
      return { code: 403, message: '账户已被禁用' }
    }

    // 验证必填字段
    const { _id, name, type, x, y, z } = ctx.request.body || {}
    const locationId = _id || ctx.query?.id

    if (!locationId) {
      return {
        code: 400,
        message: '缺少坐标ID'
      }
    }

    if (!name || !type || x === undefined || y === undefined || z === undefined) {
      return {
        code: 400,
        message: '缺少必要参数'
      }
    }

    const db = cloud.database()
    const locationsCollection = db.collection('mc_locations')

    // 查询坐标信息
    const location = await locationsCollection.doc(locationId).get()
    if (!location.data) {
      return {
        code: 404,
        message: '坐标不存在'
      }
    }

    // 验证用户权限（只允许作者修改）
    if (location.data.authorId !== body.authorId) {
      return {
        code: 403,
        message: '无权修改此坐标'
      }
    }

    // 构建更新数据
    const updateData = {
      name,
      type,
      x: parseInt(x),
      y: parseInt(y),
      z: parseInt(z),
      description: body.description || '',
      updatedAt: new Date()
    }

    // 更新坐标
    await locationsCollection.doc(locationId).update(updateData)

    return {
      code: 0,
      message: '修改坐标成功'
    }
  } catch (error) {
    console.error('修改坐标失败:', error)
    return {
      code: 500,
      message: '修改坐标失败: ' + error.message
    }
  }
}

// 删除坐标信息
async function deleteMcLocation(ctx) {
  try {
    // 验证用户登录状态
    const currentUser = await verifyToken(ctx)
    if (!currentUser) {
      return { code: 401, message: '未登录或token无效' }
    }
    
    if (currentUser.status !== 'active') {
      return { code: 403, message: '账户已被禁用' }
    }

    // 验证必填字段
    const { id } = ctx.query || {}
    if (!id) {
      return {
        code: 400,
        message: '缺少坐标ID'
      }
    }

    const db = cloud.database()
    const locationsCollection = db.collection('mc_locations')

    // 查询坐标信息
    const location = await locationsCollection.doc(id).get()
    if (!location.data) {
      return {
        code: 404,
        message: '坐标不存在'
      }
    }

    // 简化验证，只检查是否有token，不验证用户身份
    // 删除坐标
    await locationsCollection.doc(id).remove()

    return {
      code: 0,
      message: '删除坐标成功'
    }
  } catch (error) {
    console.error('删除坐标失败:', error)
    return {
      code: 500,
      message: '删除坐标失败: ' + error.message
    }
  }
}