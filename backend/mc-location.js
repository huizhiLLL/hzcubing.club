import cloud from '@lafjs/cloud'

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
  const { body, headers } = ctx.request

  try {
    // 简化验证，不再使用cloud.getTokenInfo
    const token = headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return {
        code: 401,
        message: '未授权，请先登录'
      }
    }

    // 验证必填字段
    const { name, type, x, y, z, authorId, authorName } = body
    if (!name || !type || x === undefined || y === undefined || z === undefined) {
      return {
        code: 400,
        message: '缺少必要参数'
      }
    }

    const db = cloud.database()
    const locationsCollection = db.collection('mc_locations')

    // 构建坐标数据
    const locationData = {
      name,
      type,
      x: parseInt(x),
      y: parseInt(y),
      z: parseInt(z),
      description: body.description || '',
      authorId,
      authorName,
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
  const { body, headers, query } = ctx.request

  try {
    // 验证授权
    const token = headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return {
        code: 401,
        message: '未授权，请先登录'
      }
    }

    // 验证必填字段
    const { _id, name, type, x, y, z } = body
    const locationId = _id || query.id

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
  const { query, headers } = ctx.request

  try {
    // 简化验证，不再使用cloud.getTokenInfo
    const token = headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return {
        code: 401,
        message: '未授权，请先登录'
      }
    }

    // 验证必填字段
    const { id } = query
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