import cloud from '@lafjs/cloud'

export default async function (ctx) {
  try {
    console.log('开始迁移整活项目到数据库...')
    
    const db = cloud.database()
    
    // 现有的整活项目数据
    const memeEventsData = [
      { eventCode: 'FTO单手', eventName: 'FTO单手', description: 'FTO魔方单手速拧' },
      { eventCode: '二阶单手', eventName: '二阶单手', description: '二阶魔方单手速拧' },
      { eventCode: '四阶单手', eventName: '四阶单手', description: '四阶魔方单手速拧' },
      { eventCode: '魔表单手', eventName: '魔表单手', description: '魔表单手速拧' },
      { eventCode: '3-5阶魔方连拧', eventName: '3-5阶魔方连拧', description: '三阶到五阶魔方连续速拧' },
      { eventCode: '250ml牛奶', eventName: '250ml牛奶', description: '250毫升牛奶饮用速度挑战' },
      { eventCode: 'FTO BO5', eventName: 'FTO BO5', description: 'FTO魔方5次取最佳' },
      { eventCode: '二阶盲拧', eventName: '二阶盲拧', description: '二阶魔方盲拧' },
      { eventCode: '默写群管真名（alpt除外）', eventName: '默写群管真名（alpt除外）', description: '默写群管理员真实姓名' },
      { eventCode: '打出群管真名（alpt除外）', eventName: '打出群管真名（alpt除外）', description: '打字输出群管理员真实姓名' },
      { eventCode: '二三阶连拧', eventName: '二三阶连拧', description: '二阶和三阶魔方连续速拧' },
      { eventCode: '默写Jb perm', eventName: '默写Jb perm', description: '默写Jb perm公式' }
    ]
    
    let migrated = 0
    let skipped = 0
    const errors = []
    
    for (const eventData of memeEventsData) {
      try {
        // 检查是否已存在
        const existingRes = await db.collection('meme_events')
          .where({ eventCode: eventData.eventCode })
          .get()
        
        if (existingRes.data && existingRes.data.length > 0) {
          console.log(`跳过已存在的项目: ${eventData.eventCode}`)
          skipped++
          continue
        }
        
        // 添加新项目
        const newEvent = {
          ...eventData,
          type: 'meme',
          createdAt: new Date(),
          createdBy: 'system',
          createdByName: '系统迁移',
          isActive: true
        }
        
        await db.collection('meme_events').add(newEvent)
        console.log(`迁移项目成功: ${eventData.eventCode}`)
        migrated++
        
      } catch (error) {
        console.error(`迁移项目失败: ${eventData.eventCode}`, error)
        errors.push({
          eventCode: eventData.eventCode,
          error: error.message
        })
      }
    }
    
    const summary = {
      total: memeEventsData.length,
      migrated,
      skipped,
      errors: errors.length,
      errorDetails: errors
    }
    
    console.log('整活项目迁移完成:', summary)
    
    return {
      code: 200,
      message: '整活项目迁移完成',
      data: summary
    }
    
  } catch (error) {
    console.error('整活项目迁移失败:', error)
    return {
      code: 500,
      message: '整活项目迁移失败: ' + (error?.message || String(error))
    }
  }
}
