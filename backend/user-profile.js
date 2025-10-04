import cloud from '@lafjs/cloud'
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: 'https://kuxlgxmsnuyf.sealosbja.site', // 允许的源
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // 允许的方法
  allowedHeaders: ['Content-Type', 'Authorization'], // 允许的头部
}));

export default async function (ctx) {
  const db = cloud.database()

  console.log('完整请求体 ctx.body:', ctx.body)

  // 正确从 ctx.body.body 中提取字段
  const { nickname, wcaId, bio } = ctx.body.body || {}

  // 获取用户 ID
  const userId = ctx.body.user?._id

  console.log('提取后的字段:', { nickname, userId })

  // 验证必填字段
  if (!nickname) {
    return {
      error: {
        message: '昵称是必填项'
      }
    }
  }

  // 验证用户是否已登录（是否有 userId）
  if (!userId) {
    return {
      error: {
        message: '缺少用户 ID'
      }
    }
  }

  try {
    // 更新用户信息
    await db.collection('users')
      .where({ _id: userId })
      .update({
        nickname,
        wcaId,
        bio,
        updateTime: new Date()
      })

    // 获取更新后的用户信息
    const updatedUser = await db.collection('users')
      .where({ _id: userId })
      .get()
      .then(res => res.data[0])

    return {
      data: updatedUser
    }

  } catch (error) {
    console.error('更新用户资料失败:', error)
    return {
      error: {
        message: '更新失败，请稍后重试'
      }
    }
  }
}