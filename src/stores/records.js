import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from './user'
import api from '@/api'

export const useRecordsStore = defineStore('records', () => {
  const userStore = useUserStore()
  const records = ref([])
  const personalBests = ref({})
  const isLoading = ref(false)
  const error = ref(null)
  const userNicknameCache = ref({})

  // 将时间字符串或数字转换为秒数
  function convertToSeconds(time) {
    if (time === null || time === undefined) return null
    
    // 如果已经是数字，直接返回（确保不是 NaN）
    if (typeof time === 'number') return Number.isNaN(time) ? null : time

    // 标准化字符串
    const raw = time.toString().trim()
    if (!raw) return null
    const s = raw.toUpperCase()

    // 处理特殊值
    if (s === 'DNF' || s === 'DNS') return null

    const parts = s.split(':')
    let seconds = null

    try {
      if (parts.length === 3) {
        // h:mm:ss.xx
        const h = parseInt(parts[0], 10)
        const m = parseInt(parts[1], 10)
        const sec = parseFloat(parts[2])
        seconds = h * 3600 + m * 60 + sec
      } else if (parts.length === 2) {
        // m:ss.xx
        const m = parseInt(parts[0], 10)
        const sec = parseFloat(parts[1])
        seconds = m * 60 + sec
      } else {
        // 纯秒
        seconds = parseFloat(s)
      }
    } catch (e) {
      seconds = null
    }

    // 兜底：NaN 转 null
    if (seconds === null || Number.isNaN(seconds)) return null
    return seconds
  }

  // 格式化时间显示
  function formatTime(seconds) {
    if (seconds === null || seconds === undefined) return '-'
    
    if (seconds < 60) {
      return seconds.toFixed(2)
    }
    
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = (seconds % 60).toFixed(2).padStart(5, '0')
    
    return `${minutes}:${remainingSeconds}`
  }

  // 从后端获取所有记录
  async function fetchRecords() {
    isLoading.value = true
    error.value = null
    
    try {
      // 拉取全量或足够大的数据集，避免分页导致"最佳记录"不完整
      const result = await api.getRecords({ page: 1, pageSize: 10000 })
      
      if (result.code === 200) {
        records.value = (result.data || []).map((r) => {
          // 兼容旧结构：在缺少 seconds 时从旧字段转换
          if (typeof r.singleSeconds !== 'number' && r.single && typeof r.single.time !== 'undefined') {
            const sec = convertToSeconds(r.single.time)
            if (typeof sec === 'number') r.singleSeconds = sec
          }
          if (typeof r.averageSeconds !== 'number' && r.average && typeof r.average.time !== 'undefined') {
            const sec = convertToSeconds(r.average.time)
            if (typeof sec === 'number') r.averageSeconds = sec
          }
          return r
        })
        await ensureNicknamesForRecords(records.value)
        // 更新个人最佳记录
        personalBests.value = {}
        records.value.forEach(record => {
          updatePersonalBests(record)
        })
      } else {
        throw new Error(result.message || '获取成绩记录失败')
      }
    } catch (err) {
      console.error('获取成绩记录错误:', err)
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  // 为缺失昵称的记录补齐昵称（基于 userId），并做简单缓存
  async function ensureNicknamesForRecords(list) {
    if (!Array.isArray(list) || list.length === 0) return
    const cache = userNicknameCache.value || {}
    const missingUserIds = new Set()
    for (const rec of list) {
      if (rec && rec.userId && (!rec.nickname || rec.nickname === '')) {
        if (!cache[rec.userId]) missingUserIds.add(rec.userId)
      }
    }
    if (missingUserIds.size === 0) return
    const tasks = Array.from(missingUserIds).map(async (uid) => {
      try {
        const resp = await api.getUser(uid)
        const nickname = resp?.data?.nickname || resp?.nickname || resp?.data?.user?.nickname || ''
        if (nickname) cache[uid] = nickname
      } catch (e) {
        // 忽略单个失败
      }
    })
    await Promise.all(tasks)
    userNicknameCache.value = cache
    // 回填到记录列表
    for (const rec of list) {
      if (rec && rec.userId && (!rec.nickname || rec.nickname === '')) {
        const nk = cache[rec.userId]
        if (nk) rec.nickname = nk
      }
    }
  }

  // 获取用户个人记录
  async function fetchUserRecords(userId) {
    isLoading.value = true
    error.value = null
    
    try {
      const result = await api.getUserRecords(userId)
      
      if (result.code === 200) {
        return result.data || []
      } else {
        throw new Error(result.message || '获取个人成绩记录失败')
      }
    } catch (err) {
      console.error('获取个人成绩记录错误:', err)
      error.value = err.message
      return []
    } finally {
      isLoading.value = false
    }
  }

  // 初始化函数 - 如果需要的话可以保留但简化它
  function initializeRecords() {
    // 这个函数现在不再需要做任何事情，因为数据已经在数据库中
  }

  // 递归清洗空值：将 'null'、'' 转为 null
  function cleanNullishDeep(obj) {
    if (obj === null || obj === undefined) return obj
    if (Array.isArray(obj)) return obj.map(cleanNullishDeep)
    if (typeof obj === 'object') {
      const out = {}
      for (const k in obj) {
        const v = obj[k]
        if (v === 'null' || v === '') {
          out[k] = null
        } else {
          out[k] = cleanNullishDeep(v)
        }
      }
      return out
    }
    return obj
  }

  // 添加新记录到后端（使用 seconds 字段）
  async function addRecord(record, submitToBackend = true) {
    const cleanRecord = cleanNullishDeep({ ...record })
    const recordWithTimestamp = {
      ...cleanRecord,
      timestamp: cleanRecord.timestamp || new Date().toISOString(),
      userId: userStore.user?._id || null,
      nickname: cleanRecord.nickname || userStore.user?.nickname || cleanRecord.nickname || null
    }
    // 规范化：允许传入旧结构，自动转为 seconds
    if (cleanRecord.single && typeof cleanRecord.single.time !== 'undefined') {
      recordWithTimestamp.singleSeconds = convertToSeconds(cleanRecord.single.time)
      delete recordWithTimestamp.single
    }
    if (cleanRecord.average && typeof cleanRecord.average.time !== 'undefined') {
      recordWithTimestamp.averageSeconds = convertToSeconds(cleanRecord.average.time)
      delete recordWithTimestamp.average
    }
    
    if (submitToBackend) {
      isLoading.value = true
      error.value = null
      try {
        const result = await api.addRecord(recordWithTimestamp)
        if (result.code === 200) {
          const savedRecord = { ...recordWithTimestamp, _id: result.data._id }
          // 本地也补齐昵称
          if (savedRecord.userId && (!savedRecord.nickname || savedRecord.nickname === '')) {
            await ensureNicknamesForRecords([savedRecord])
          }
          records.value.push(savedRecord)
          updatePersonalBests(savedRecord)
          // 新增后重算 rank
          updateAllRanks()
          return savedRecord
        } else {
          throw new Error(result.message || '提交成绩失败')
        }
      } catch (err) {
        console.error('提交成绩错误:', err)
        error.value = err.message
        throw err
      } finally {
        isLoading.value = false
      }
    } else {
      // 本地添加
      records.value.push(recordWithTimestamp)
      updatePersonalBests(recordWithTimestamp)
      updateAllRanks()
    }
  }

  function updatePersonalBests(record) {
    const eventCode = record.event
    if (!eventCode) return
    const recSingle = record.singleSeconds
    const recAverage = record.averageSeconds
    if (!personalBests.value[eventCode]) {
      personalBests.value[eventCode] = {
        singleSeconds: typeof recSingle === 'number' ? recSingle : null,
        averageSeconds: typeof recAverage === 'number' ? recAverage : null
      }
      return
    }
    const current = personalBests.value[eventCode]
    const currentSingle = typeof current.singleSeconds === 'number' ? current.singleSeconds : null
    const currentAverage = typeof current.averageSeconds === 'number' ? current.averageSeconds : null
    if (typeof recSingle === 'number' && (currentSingle === null || recSingle < currentSingle)) {
      current.singleSeconds = recSingle
    }
    if (typeof recAverage === 'number' && (currentAverage === null || recAverage < currentAverage)) {
      current.averageSeconds = recAverage
    }
  }

  // 已不持久化排名，保留空实现以减少入侵
  function updateAllRanks() {}

  // 删除记录
  async function deleteRecord(recordId) {
    isLoading.value = true
    error.value = null
    
    try {
      const result = await api.deleteRecord(recordId)
      
      if (result.code === 200) {
        const index = records.value.findIndex(r => r._id === recordId)
        if (index !== -1) {
          records.value.splice(index, 1)
          personalBests.value = {}
          records.value.forEach(record => {
            updatePersonalBests(record)
          })
          // 删除后重算 rank
          updateAllRanks()
        }
        return true
      } else {
        throw new Error(result.message || '删除成绩失败')
      }
    } catch (err) {
      console.error('删除成绩错误:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // 更新记录
  async function updateRecord(record) {
    isLoading.value = true
    error.value = null
    
    try {
      const requestData = {
        recordId: record._id,
        updateData: { ...record }
      }
      delete requestData.updateData._id
      // 确保顶层昵称存在
      if (!requestData.updateData.nickname && record.userId) {
        const cached = userNicknameCache.value[record.userId]
        if (cached) requestData.updateData.nickname = cached
      }
      // 规范化：若存在旧结构则转 seconds
      if (requestData.updateData.single && typeof requestData.updateData.single.time !== 'undefined') {
        requestData.updateData.singleSeconds = convertToSeconds(requestData.updateData.single.time)
        delete requestData.updateData.single
      }
      if (requestData.updateData.average && typeof requestData.updateData.average.time !== 'undefined') {
        requestData.updateData.averageSeconds = convertToSeconds(requestData.updateData.average.time)
        delete requestData.updateData.average
      }
      
      const result = await api.updateRecord(requestData)
      
      if (result.code === 200) {
        const index = records.value.findIndex(r => r._id === record._id)
        if (index !== -1) {
          const merged = { ...records.value[index], ...record }
          // 本地也补齐昵称
          await ensureNicknamesForRecords([merged])
          records.value[index] = merged
          personalBests.value = {}
          records.value.forEach(record => {
            updatePersonalBests(record)
          })
          // 更新后重算 rank
          updateAllRanks()
        }
        return true
      } else {
        throw new Error(result.message || '更新成绩失败')
      }
    } catch (err) {
      console.error('更新成绩错误:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function getRecordsByEvent(event) {
    return records.value
      .filter(r => r.event === event)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }
  
  // 获取用户的个人最佳成绩
  function getUserPersonalBests(userId) {
    const userRecords = records.value.filter(r => r.userId === userId)
    return userRecords.reduce((bestRecords, record) => {
      const event = record.event
      if (!event) return bestRecords
      const s = record.singleSeconds
      const a = record.averageSeconds
      if (!bestRecords[event]) {
        bestRecords[event] = {
          event,
          singleSeconds: typeof s === 'number' ? s : null,
          averageSeconds: typeof a === 'number' ? a : null
        }
      } else {
        const cur = bestRecords[event]
        if (typeof s === 'number' && (cur.singleSeconds == null || s < cur.singleSeconds)) {
          cur.singleSeconds = s
        }
        if (typeof a === 'number' && (cur.averageSeconds == null || a < cur.averageSeconds)) {
          cur.averageSeconds = a
        }
      }
      return bestRecords
    }, {})
  }

  function getBestRecords() {
    return records.value.reduce((bestRecords, record) => {
      const event = record.event
      if (!event) return bestRecords
      const s = record.singleSeconds
      const a = record.averageSeconds
      const nicknameFromCache = (uid) => (uid ? (userNicknameCache.value?.[uid] || '') : '')
      if (!bestRecords[event]) {
        bestRecords[event] = {
          event,
          // 单次最佳
          singleSeconds: typeof s === 'number' ? s : null,
          singleHolderUserId: typeof s === 'number' ? (record.userId || null) : null,
          singleHolderNickname: typeof s === 'number' ? (record.nickname || nicknameFromCache(record.userId) || '') : '',
          singleTimestamp: typeof s === 'number' ? record.timestamp : null,
          // 平均最佳
          averageSeconds: typeof a === 'number' ? a : null,
          averageHolderUserId: typeof a === 'number' ? (record.userId || null) : null,
          averageHolderNickname: typeof a === 'number' ? (record.nickname || nicknameFromCache(record.userId) || '') : '',
          averageTimestamp: typeof a === 'number' ? record.timestamp : null
        }
      } else {
        const current = bestRecords[event]
        if (typeof s === 'number' && (current.singleSeconds == null || s < current.singleSeconds)) {
          current.singleSeconds = s
          current.singleHolderUserId = record.userId || null
          current.singleHolderNickname = record.nickname || nicknameFromCache(record.userId) || ''
          current.singleTimestamp = record.timestamp
        }
        if (typeof a === 'number' && (current.averageSeconds == null || a < current.averageSeconds)) {
          current.averageSeconds = a
          current.averageHolderUserId = record.userId || null
          current.averageHolderNickname = record.nickname || nicknameFromCache(record.userId) || ''
          current.averageTimestamp = record.timestamp
        }
      }
      return bestRecords
    }, {})
  }

  // 通过 userId 获取昵称（先读缓存，再从已加载记录里找）
  function getNicknameForUser(userId) {
    if (!userId) return ''
    const cached = userNicknameCache.value?.[userId]
    if (cached) return cached
    const fromRecords = records.value.find(r => r.userId === userId && r.nickname)
    return fromRecords?.nickname || ''
  }

  // 清除所有记录的函数（用于测试）
  function clearRecords() {
    records.value = []
    personalBests.value = {}
  }
  
  // 计算统计数据
  const statistics = computed(() => {
    const currentUser = userStore.user
    if (!currentUser) return null
    
    const userRecords = records.value.filter(r => r.userId === currentUser._id)
    
    return {
      totalRecords: userRecords.length,
      events: Object.keys(getUserPersonalBests(currentUser._id)).length,
      bestRank: userRecords.reduce((best, record) => {
        const singleRank = record.singleRank || Number.MAX_SAFE_INTEGER
        const averageRank = record.averageRank || Number.MAX_SAFE_INTEGER
        const minRank = Math.min(singleRank, averageRank)
        return minRank < best ? minRank : best
      }, Number.MAX_SAFE_INTEGER) === Number.MAX_SAFE_INTEGER ? null : userRecords.reduce((best, record) => {
        const singleRank = record.singleRank || Number.MAX_SAFE_INTEGER
        const averageRank = record.averageRank || Number.MAX_SAFE_INTEGER
        const minRank = Math.min(singleRank, averageRank)
        return minRank < best ? minRank : best
      }, Number.MAX_SAFE_INTEGER)
    }
  })

  return {
    records,
    personalBests,
    isLoading,
    error,
    statistics,
    addRecord,
    getRecordsByEvent,
    getBestRecords,
    getNicknameForUser,
    ensureNicknamesForRecords,
    initializeRecords,
    clearRecords,
    updateAllRanks,
    fetchRecords,
    fetchUserRecords,
    deleteRecord,
    getUserPersonalBests,
    convertToSeconds,
    formatTime,
    updateRecord
  }
}) 