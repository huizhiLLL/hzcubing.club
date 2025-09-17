import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from './user'

export const useRecordsStore = defineStore('records', () => {
  const userStore = useUserStore()
  const records = ref([])
  const personalBests = ref({})
  const isLoading = ref(false)
  const error = ref(null)

  // 将时间字符串或数字转换为秒数
  function convertToSeconds(time) {
    if (time === null || time === undefined) return null
    
    // 如果已经是数字，直接返回
    if (typeof time === 'number') return time
    
    // 处理字符串格式的时间 (例如: '1:23.45' 或 '2:34:56.78')
    const parts = time.toString().split(':')
    let seconds = 0
    
    if (parts.length === 3) {
      // 处理小时格式 (h:mm:ss.xx)
      seconds = parseInt(parts[0]) * 3600 + 
                parseInt(parts[1]) * 60 + 
                parseFloat(parts[2])
    } else if (parts.length === 2) {
      // 处理分钟格式 (m:ss.xx)
      seconds = parseInt(parts[0]) * 60 + 
                parseFloat(parts[1])
    } else {
      // 处理纯秒格式
      seconds = parseFloat(time)
    }
    
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
      const token = localStorage.getItem('token')
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
      
      const response = await fetch(`https://w3mavh11ex.bja.sealos.run/record?pattern=/records`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      })
      
      if (!response.ok) {
        throw new Error('获取成绩记录失败')
      }
      
      const result = await response.json()
      
      if (result.code === 200) {
        records.value = result.data || []
        // 更新个人最佳记录
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

  // 获取用户个人记录
  async function fetchUserRecords(userId) {
    isLoading.value = true
    error.value = null
    
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
      
      const response = await fetch(`https://w3mavh11ex.bja.sealos.run/record?pattern=/user-records&userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      })
      
      if (!response.ok) {
        throw new Error('获取个人成绩记录失败')
      }
      
      const result = await response.json()
      
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

  // 添加新记录到后端
  async function addRecord(record, submitToBackend = true) {
    // 处理可能为空的字段，确保使用实际的null而不是字符串"null"
    const cleanRecord = { ...record }
    for (const key in cleanRecord) {
      if (cleanRecord[key] === 'null' || cleanRecord[key] === '') {
        cleanRecord[key] = null
      }
    }
    
    // 如果没有时间戳，添加当前时间
    const recordWithTimestamp = {
      ...cleanRecord,
      timestamp: cleanRecord.timestamp || new Date().toISOString(),
      userId: userStore.user?._id || null,
      singleRank: calculateRank(cleanRecord.event, cleanRecord.single?.time, 'single'),
      averageRank: calculateRank(cleanRecord.event, cleanRecord.average?.time, 'average')
    }
    
    // 如果需要提交到后端
    if (submitToBackend) {
      isLoading.value = true
      error.value = null
      
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('请先登录')
        }
        
        const response = await fetch(`https://w3mavh11ex.bja.sealos.run/record?pattern=/add-record`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(recordWithTimestamp)
        })
        
        if (!response.ok) {
          throw new Error('提交成绩失败')
        }
        
        const result = await response.json()
        
        if (result.code === 200) {
          // 使用后端返回的ID
          const savedRecord = {
            ...recordWithTimestamp,
            _id: result.data._id
          }
          
          records.value.push(savedRecord)
          updatePersonalBests(savedRecord)
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
    }
  }

  function updatePersonalBests(record) {
    if (!personalBests.value[record.event]) {
      personalBests.value[record.event] = {
        single: record.single,
        average: record.average,
        singleRank: record.singleRank || null,
        averageRank: record.averageRank || null
      }
    } else {
      const current = personalBests.value[record.event]
      const currentSingleTime = current.single ? convertToSeconds(current.single.time) : null
      const newSingleTime = record.single ? convertToSeconds(record.single.time) : null
      const currentAverageTime = current.average ? convertToSeconds(current.average.time) : null
      const newAverageTime = record.average ? convertToSeconds(record.average.time) : null

      if (newSingleTime && (!currentSingleTime || newSingleTime < currentSingleTime)) {
        current.single = record.single
        current.singleRank = record.singleRank
      }
      if (newAverageTime && (!currentAverageTime || newAverageTime < currentAverageTime)) {
        current.average = record.average
        current.averageRank = record.averageRank
      }
    }
  }

  // 计算排名
  function calculateRank(event, time, type) {
    if (!time) return null
    
    const eventRecords = records.value
      .filter(r => r.event === event)
      .map(r => type === 'single' ? 
        (r.single?.time ? convertToSeconds(r.single.time) : null) : 
        (r.average?.time ? convertToSeconds(r.average.time) : null))
      .filter(Boolean)
      .sort((a, b) => a - b)

    const timeInSeconds = convertToSeconds(time)
    const rank = eventRecords.indexOf(timeInSeconds) + 1
    return rank > 0 ? rank : null
  }

  // 更新所有记录的排名
  function updateAllRanks() {
    records.value.forEach(record => {
      record.singleRank = calculateRank(record.event, record.single?.time, 'single')
      record.averageRank = calculateRank(record.event, record.average?.time, 'average')
    })
  }

  // 删除记录
  async function deleteRecord(recordId) {
    isLoading.value = true
    error.value = null
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('请先登录')
      }
      
      const response = await fetch(`https://w3mavh11ex.bja.sealos.run/record?pattern=/delete-record`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ recordId })
      })
      
      if (!response.ok) {
        throw new Error('删除成绩失败')
      }
      
      const result = await response.json()
      
      if (result.code === 200) {
        // 从本地记录中删除
        const index = records.value.findIndex(r => r._id === recordId)
        if (index !== -1) {
          records.value.splice(index, 1)
          // 重新计算个人最佳
          personalBests.value = {}
          records.value.forEach(record => {
            updatePersonalBests(record)
          })
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
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('请先登录')
      }
      
      // 准备请求数据，按照后端API的期望格式
      const requestData = {
        recordId: record._id,
        updateData: { ...record }
      }
      
      // 移除recordId，因为它已经在外层
      delete requestData.updateData._id
      
      const response = await fetch(`https://w3mavh11ex.bja.sealos.run/record?pattern=/update-record`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      })
      
      if (!response.ok) {
        throw new Error('更新成绩失败')
      }
      
      const result = await response.json()
      
      if (result.code === 200) {
        // 更新本地记录
        const index = records.value.findIndex(r => r._id === record._id)
        if (index !== -1) {
          records.value[index] = { ...records.value[index], ...record }
          // 重新计算个人最佳
          personalBests.value = {}
          records.value.forEach(record => {
            updatePersonalBests(record)
          })
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
      if (!bestRecords[record.event]) {
        bestRecords[record.event] = {
          event: record.event,
          single: record.single,
          average: record.average
        }
      } else {
        const current = bestRecords[record.event]
        const currentSingleTime = current.single ? convertToSeconds(current.single.time) : null
        const newSingleTime = record.single ? convertToSeconds(record.single.time) : null
        const currentAverageTime = current.average ? convertToSeconds(current.average.time) : null
        const newAverageTime = record.average ? convertToSeconds(record.average.time) : null

        if (newSingleTime && (!currentSingleTime || newSingleTime < currentSingleTime)) {
          current.single = record.single
        }
        if (newAverageTime && (!currentAverageTime || newAverageTime < currentAverageTime)) {
          current.average = record.average
        }
      }
      return bestRecords
    }, {})
  }

  function getBestRecords() {
    return records.value.reduce((bestRecords, record) => {
      if (!bestRecords[record.event]) {
        bestRecords[record.event] = {
          event: record.event,
          single: record.single,
          average: record.average,
          timestamp: record.timestamp
        }
      } else {
        const current = bestRecords[record.event]
        const currentSingleTime = current.single ? convertToSeconds(current.single.time) : null
        const newSingleTime = record.single ? convertToSeconds(record.single.time) : null
        const currentAverageTime = current.average ? convertToSeconds(current.average.time) : null
        const newAverageTime = record.average ? convertToSeconds(record.average.time) : null

        // 更新单次最佳记录
        if (newSingleTime !== null && (currentSingleTime === null || newSingleTime < currentSingleTime)) {
          current.single = record.single
          
          // 如果这是一个新的单次记录，更新时间戳
          if (current.single && !current.average) {
            current.timestamp = record.timestamp;
          }
        }
        
        // 更新平均最佳记录
        if (newAverageTime !== null && (currentAverageTime === null || newAverageTime < currentAverageTime)) {
          current.average = record.average
          
          // 如果这是一个新的平均记录，更新时间戳
          if (current.average && !current.single) {
            current.timestamp = record.timestamp;
          }
        }
        
        // 如果单次和平均都更新了，使用最新的时间戳
        if (current.single && current.average && 
            current.single.time === record.single?.time && 
            current.average.time === record.average?.time) {
          current.timestamp = record.timestamp;
        }
      }
      return bestRecords
    }, {})
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