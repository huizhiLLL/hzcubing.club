import cloud from '@lafjs/cloud'

/**
 * 用户角色迁移脚本
 * 为所有现有用户添加默认的role和status字段
 */
export default async function (ctx) {
  try {
    const db = cloud.database()
    
    // 批量处理，避免一次性处理过多数据
    const batchSize = 100
    let skip = 0
    let processed = 0
    let updated = 0
    
    const summary = {
      processed: 0,
      updated: 0,
      errors: []
    }
    
    console.log('开始用户角色迁移...')
    
    while (true) {
      // 分批获取用户
      const usersRes = await db.collection('users')
        .skip(skip)
        .limit(batchSize)
        .get()
      
      const users = usersRes.data || []
      if (users.length === 0) break
      
      skip += users.length
      processed += users.length
      
      // 处理每个用户
      for (const user of users) {
        try {
          const updates = {}
          let needUpdate = false
          
          // 如果没有role字段，设置默认值
          if (!user.role) {
            updates.role = 'user'
            needUpdate = true
          }
          
          // 如果没有status字段，设置默认值
          if (!user.status) {
            updates.status = 'active'
            needUpdate = true
          }
          
          // 如果需要更新
          if (needUpdate) {
            await db.collection('users').doc(user._id).update({
              ...updates,
              updatedAt: new Date()
            })
            updated++
          }
        } catch (error) {
          summary.errors.push({
            userId: user._id,
            email: user.email,
            error: error.message
          })
        }
      }
      
      // 如果这批数据少于batchSize，说明已经处理完所有数据
      if (users.length < batchSize) break
    }
    
    summary.processed = processed
    summary.updated = updated
    
    console.log('用户角色迁移完成:', summary)
    
    return {
      code: 200,
      message: '用户角色迁移完成',
      data: summary
    }
    
  } catch (error) {
    console.error('用户角色迁移失败:', error)
    return {
      code: 500,
      message: '迁移失败: ' + (error?.message || String(error))
    }
  }
}
