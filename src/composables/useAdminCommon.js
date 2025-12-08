import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/api/index.js'

/**
 * 管理员公共功能 composable
 */
export function useAdminCommon() {
  const recordsLoading = ref(false)
  const allRecords = ref([])

  /**
   * 获取所有成绩记录（分批获取）
   */
  const fetchAllRecords = async () => {
    recordsLoading.value = true
    try {
      // 分批获取所有records，避免数量限制
      let allRecordsData = []
      let page = 1
      const pageSize = 100
      
      while (true) {
        const result = await api.getRecords({ page, pageSize })
        if (result.code === 200 && result.data && result.data.length > 0) {
          allRecordsData = allRecordsData.concat(result.data)
          
          // 如果返回的数据少于pageSize，说明已经是最后一页
          if (result.data.length < pageSize) {
            break
          }
          page++
        } else {
          break
        }
      }
      
      allRecords.value = allRecordsData
      console.log(`获取到${allRecordsData.length}条成绩记录`)
      return allRecordsData
    } catch (error) {
      console.error('获取成绩记录失败:', error)
      ElMessage.error('获取成绩记录失败: ' + error.message)
      allRecords.value = []
      return []
    } finally {
      recordsLoading.value = false
    }
  }

  /**
   * 格式化日期
   */
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    if (isNaN(date)) return '-'
    
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    
    return `${year}.${month}.${day}`
  }

  /**
   * 获取角色标签类型
   */
  const getRoleTagType = (role) => {
    const roleTypes = {
      'guest': 'info',
      'user': 'primary',
      'admin': 'warning',
      'super_admin': 'danger'
    }
    return roleTypes[role] || 'info'
  }

  return {
    recordsLoading,
    allRecords,
    fetchAllRecords,
    formatDate,
    getRoleTagType
  }
}

