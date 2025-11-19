import cloud from '@lafjs/cloud'

// 简单的内存缓存
let playersCache = null
let cacheTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

export default async function (ctx) {
  try {
    const db = cloud.database()

    // 检查缓存是否有效
    const now = Date.now()
    if (playersCache && (now - cacheTime) < CACHE_DURATION) {
      // 直接返回缓存的所有数据
      return {
        code: 0,
        message: '获取选手列表成功',
        data: playersCache
      }
    }

    // 查询users集合中的所有用户（只查询一次，然后缓存）
    const { data: users } = await db.collection('users')
      .field({
        // 只返回选手页面需要显示的字段
        _id: true,
        nickname: true,
        bio: true,
        createTime: true,
        wcaId: true
      })
      .orderBy('createTime', 'desc') // 按注册时间降序排列
      .get()

    // 更新缓存
    playersCache = users || []
    cacheTime = now

    // 返回成功响应
    return {
      code: 0,
      message: '获取选手列表成功',
      data: playersCache
    }
  } catch (error) {
    // 记录错误日志
    console.error('获取选手列表失败:', error)

    // 返回错误响应
    return {
      code: 1,
      message: '获取选手列表失败: ' + error.message
    }
  }
}