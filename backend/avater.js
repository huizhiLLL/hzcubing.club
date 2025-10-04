import cloud from '@lafjs/cloud'

export default async function (ctx) {
  console.log('收到头像上传请求')
  
  try {
    // 从请求体中获取数据
    const { userId, fileName, fileType, fileSize, fileData } = ctx.body
    
    // 验证必要参数
    if (!userId || !fileData) {
      console.log('缺少必要参数:', { 
        hasUserId: !!userId, 
        hasFileData: !!fileData 
      })
      
      return {
        code: 400,
        message: '没有提供头像文件或用户ID'
      }
    }
    
    // 将base64转换为Buffer
    const buffer = Buffer.from(fileData, 'base64')
    
    if (buffer.length === 0) {
      return {
        code: 400,
        message: '文件内容为空'
      }
    }
    
    // 生成文件名
    const fileExt = fileType.split('/')[1] || 'png'
    const timestamp = Date.now()
    const cloudFileName = `avatar_${userId}_${timestamp}.${fileExt}`

    // 检查cloud.file API
    console.log('cloud对象包含以下属性:', Object.keys(cloud))
    if (cloud.file) {
      console.log('file对象包含以下属性:', Object.keys(cloud.file))
    } else {
      console.log('cloud对象不包含file属性')
    }

    let avatarUrl = ''
    
    // 使用可能的文件上传方法
    // 方法1: 直接使用 database 存储base64
    if (!cloud.file || !cloud.file.uploadFile) {
      console.log('使用数据库存储头像')
      const db = cloud.database()
      // 直接将base64数据存入数据库
      avatarUrl = `data:${fileType};base64,${fileData}`
    } 
    // 方法2: 尝试使用 cloud.uploadFile (如果存在)
    else if (typeof cloud.uploadFile === 'function') {
      console.log('使用cloud.uploadFile上传头像')
      const result = await cloud.uploadFile({
        name: cloudFileName,
        data: buffer
      })
      avatarUrl = result.url
    } 
    // 方法3: 使用 cloud.file.uploadFile (如果存在)
    else if (typeof cloud.file.uploadFile === 'function') {
      console.log('使用cloud.file.uploadFile上传头像')
      const result = await cloud.file.uploadFile({
        name: cloudFileName,
        data: buffer
      })
      avatarUrl = result.url
    } 
    // 如果没有可用方法，返回错误
    else {
      return {
        code: 500,
        message: '服务器不支持文件上传功能'
      }
    }
    
    // 更新用户头像URL
    if (avatarUrl) {
      const db = cloud.database()
      await db.collection('users').doc(userId).update({
        avatar: avatarUrl
      })
      
      return {
        code: 200,
        message: '头像上传成功',
        data: {
          avatarUrl: avatarUrl
        }
      }
    } else {
      throw new Error('获取头像URL失败')
    }
  } catch (error) {
    console.error('头像上传处理失败:', error)
    return {
      code: 500,
      message: '头像上传失败: ' + (error.message || '未知错误')
    }
  }
}