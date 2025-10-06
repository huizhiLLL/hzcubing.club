import api from '@/api/index.js'

// 更新日志数据（现在从数据库获取）
let changelogData = []

// 从数据库获取更新日志
export const loadChangelogData = async () => {
  try {
    const result = await api.getChangelogs({ page: 1, pageSize: 100 })
    if (result.code === 200) {
      changelogData = result.data || []
    }
  } catch (error) {
    console.error('获取更新日志失败:', error)
    changelogData = []
  }
  return changelogData
}

// 获取最近的更新日志
export const getRecentChangelogs = async (count = 5) => {
  if (changelogData.length === 0) {
    await loadChangelogData()
  }
  return changelogData.slice(0, count)
}

// 获取所有更新日志
export const getAllChangelogs = async () => {
  if (changelogData.length === 0) {
    await loadChangelogData()
  }
  return changelogData
}

// 刷新更新日志数据
export const refreshChangelogData = async () => {
  return await loadChangelogData()
} 