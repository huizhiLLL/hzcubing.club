<template>
  <div class="minecraft-container">
    <div class="mc-header glass-header">
      <h1 class="page-title">Minecraft 服务器</h1>
    </div>
    
    <!-- 添加标签页切换 -->
    <div class="tabs-container glass-card">
      <el-tabs v-model="activeTab" class="mc-tabs" stretch>
        <el-tab-pane label="坐标信息" name="locations">
          <!-- 坐标信息板块 -->
          <div class="mc-locations">
        <div class="card-header">
          <h2>坐标信息（旧服已结档）</h2>
          <div class="location-controls">
            <!-- 添加搜索框 -->
            <el-input
              v-model="searchQuery"
              placeholder="搜索坐标名称"
              clearable
              class="search-input"
              prefix-icon="Search"
            />
            <!-- 添加维度筛选 -->
            <el-select v-model="selectedDimension" placeholder="筛选维度" class="dimension-filter">
              <el-option label="全部维度" value="" />
              <el-option label="主世界" value="主世界" />
              <el-option label="下界" value="下界" />
              <el-option label="末地" value="末地" />
            </el-select>
          <el-button type="primary" size="small" @click="showAddLocationDialog" v-if="isLoggedIn">
            <el-icon><Plus /></el-icon>
            添加坐标
          </el-button>
          </div>
        </div>
      
      <div class="locations-content">
        <div v-if="loading" class="loading-container">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载中...</span>
        </div>
        
        <div v-else-if="filteredLocations.length === 0" class="empty-locations">
          <el-icon><Location /></el-icon>
          <span>{{ selectedDimension ? `暂无${selectedDimension}的坐标信息` : '暂无坐标信息' }}</span>
          <el-button type="primary" size="small" @click="showAddLocationDialog" v-if="isLoggedIn">
            添加第一个坐标
          </el-button>
        </div>
        
        <div v-else class="locations-grid">
          <div v-for="location in paginatedLocations" :key="location._id" class="location-card glass-effect-light">
            <div class="location-header">
              <h3>{{ location.name }}</h3>
              <el-tag size="small" :type="getTagType(location.type)">{{ location.type }}</el-tag>
            </div>
            <div class="location-coordinates">
              <div class="coordinate">
                <span class="label">X:</span>
                <span class="value">{{ location.x }}</span>
              </div>
              <div class="coordinate">
                <span class="label">Y:</span>
                <span class="value">{{ location.y }}</span>
              </div>
              <div class="coordinate">
                <span class="label">Z:</span>
                <span class="value">{{ location.z }}</span>
              </div>
              <el-button 
                size="small" 
                type="info" 
                plain 
                class="copy-coords-btn"
                @click="copyCoordinates(location)"
              >
                <el-icon><CopyDocument /></el-icon>
              </el-button>
            </div>
            <div class="location-description" v-if="location.description">
              {{ location.description }}
            </div>
            <div class="location-meta">
              <span class="location-author">{{ location.authorName }}</span>
              <span class="location-date" :class="{'mobile-hidden': isMobile}">{{ formatDate(location.createdAt) }}</span>
              <div class="location-actions" v-if="isLoggedIn && location.authorId === currentUser?.id">
                <el-button size="small" type="primary" text @click="showEditLocationDialog(location)">
                  <el-icon><Edit /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 添加分页组件 -->
        <div class="pagination-container" v-if="filteredLocations.length > pageSize">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="filteredLocations.length"
            layout="prev, pager, next"
            background
            @current-change="handlePageChange"
          />
        </div>
      </div>
          </div>
        </el-tab-pane>
    
        <el-tab-pane label="原版模组服" name="server">
          <!-- 服务器信息板块 -->
          <div class="mc-info">
          <div class="card-header">
            <h2>服务器信息</h2>
          </div>
        <div class="server-info">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="地址">
              <span class="server-value">play.simpfun.cn</span>
            </el-descriptions-item>
            <el-descriptions-item label="端口">
              <span class="server-value">22788</span>
            </el-descriptions-item>
            <!-- <el-descriptions-item label="种子">
              <span class="server-value seed-value">6782181293532081135</span>
              <el-button 
                type="text" 
                class="copy-seed-btn" 
                @click="copySeed"
                title="复制种子"
              >
                <el-icon><CopyDocument /></el-icon>
              </el-button>
            </el-descriptions-item> -->
            <el-descriptions-item label="版本">
              <div class="server-value-multi">
                <div class="version-tag">Java 1.20.1</div>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="类型">
              <div class="server-type-tags">
                <span class="mc-tag">机械动力</span>
                <span class="mc-tag">永恒枪械</span>
                <span class="mc-tag">车万女仆</span>
                <span class="mc-tag">YSM</span>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="说明">
              <div>客户端见群文件</div>
            </el-descriptions-item>
          </el-descriptions>
          
          <div class="server-actions">
            <el-button type="primary" @click="copyServerAddress" class="copy-btn">
              <el-icon class="copy-icon"><CopyDocument /></el-icon>
              复制服务器地址
            </el-button>
          </div>
        </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>

  <!-- 添加坐标对话框 -->
  <el-dialog
    v-model="addLocationDialogVisible"
    title="添加坐标"
    :width="isMobile ? '90%' : '500px'"
    class="add-location-dialog glass-dialog"
    :modal="true"
    :append-to-body="true"
    :z-index="2000"
    :close-on-click-modal="true"
    :overlay-class="'glass-overlay'"
    :fullscreen="false"
  >
    <el-form 
      :model="locationForm" 
      :rules="locationRules" 
      ref="locationFormRef"
      :label-width="isMobile ? 'auto' : '80px'"
      :label-position="isMobile ? 'top' : 'right'"
      class="glass-form"
    >
      <el-form-item label="名称" prop="name">
        <el-input v-model="locationForm.name" placeholder="地点名称" style="width: 60%" />
      </el-form-item>
      
      <el-form-item label="维度" prop="type">
        <el-select v-model="locationForm.type" placeholder="选择所在维度" style="width: 30%">
          <el-option label="主世界" value="主世界" />
          <el-option label="下界" value="下界" />
          <el-option label="末地" value="末地" />
        </el-select>
      </el-form-item>
      
      <div class="mobile-coordinates-group" v-if="isMobile">
        <el-form-item label="X" prop="x" class="mobile-coordinate-item">
          <el-input-number v-model="locationForm.x" :precision="0" :step="1" :controls="false" class="mobile-coordinate-input" />
        </el-form-item>
        
        <el-form-item label="Y" prop="y" class="mobile-coordinate-item">
          <el-input-number v-model="locationForm.y" :precision="0" :step="1" :controls="false" class="mobile-coordinate-input" />
        </el-form-item>
        
        <el-form-item label="Z" prop="z" class="mobile-coordinate-item">
          <el-input-number v-model="locationForm.z" :precision="0" :step="1" :controls="false" class="mobile-coordinate-input" />
        </el-form-item>
      </div>
      
      <template v-else>
        <el-form-item label="X坐标" prop="x">
          <el-input-number v-model="locationForm.x" :precision="0" :step="1" :controls="!isMobileSmall" class="coordinate-input" />
        </el-form-item>
        
        <el-form-item label="Y坐标" prop="y">
          <el-input-number v-model="locationForm.y" :precision="0" :step="1" :controls="!isMobileSmall" class="coordinate-input" />
        </el-form-item>
        
        <el-form-item label="Z坐标" prop="z">
          <el-input-number v-model="locationForm.z" :precision="0" :step="1" :controls="!isMobileSmall" class="coordinate-input" />
        </el-form-item>
      </template>
      
      <el-form-item label="描述" prop="description">
        <el-input 
          v-model="locationForm.description" 
          type="textarea" 
          :rows="2"
          placeholder="可选，添加对该地点的描述"
        />
      </el-form-item>
      
      <div class="centered-buttons">
        <el-button type="primary" @click="submitLocation" :loading="submitting">提交</el-button>
        <el-button @click="resetLocationForm">重置</el-button>
      </div>
    </el-form>
  </el-dialog>

  <!-- 添加修改坐标对话框 -->
  <el-dialog
    v-model="editLocationDialogVisible"
    title="修改坐标"
    :width="isMobile ? '90%' : '500px'"
    class="edit-location-dialog glass-dialog"
    :modal="true"
    :append-to-body="true"
    :z-index="2000"
    :close-on-click-modal="true"
    :overlay-class="'glass-overlay'"
    :fullscreen="false"
  >
    <el-form 
      :model="editLocationForm" 
      :rules="locationRules" 
      ref="editLocationFormRef"
      :label-width="isMobile ? 'auto' : '80px'"
      :label-position="isMobile ? 'top' : 'right'"
      class="glass-form"
    >
      <el-form-item label="名称" prop="name" >
        <el-input v-model="editLocationForm.name" placeholder="地点名称" style="width: 60%" />
      </el-form-item>
      
      <el-form-item label="维度" prop="type">
        <el-select v-model="editLocationForm.type" placeholder="选择所在维度" style="width: 30%">
          <el-option label="主世界" value="主世界" />
          <el-option label="下界" value="下界" />
          <el-option label="末地" value="末地" />
        </el-select>
      </el-form-item>
      
      <div class="mobile-coordinates-group" v-if="isMobile">
        <el-form-item label="X" prop="x" class="mobile-coordinate-item">
          <el-input-number v-model="editLocationForm.x" :precision="0" :step="1" :controls="false" class="mobile-coordinate-input" />
        </el-form-item>
        
        <el-form-item label="Y" prop="y" class="mobile-coordinate-item">
          <el-input-number v-model="editLocationForm.y" :precision="0" :step="1" :controls="false" class="mobile-coordinate-input" />
        </el-form-item>
        
        <el-form-item label="Z" prop="z" class="mobile-coordinate-item">
          <el-input-number v-model="editLocationForm.z" :precision="0" :step="1" :controls="false" class="mobile-coordinate-input" />
        </el-form-item>
      </div>
      
      <template v-else>
        <el-form-item label="X坐标" prop="x">
          <el-input-number v-model="editLocationForm.x" :precision="0" :step="1" :controls="!isMobileSmall" class="coordinate-input" />
        </el-form-item>
        
        <el-form-item label="Y坐标" prop="y">
          <el-input-number v-model="editLocationForm.y" :precision="0" :step="1" :controls="!isMobileSmall" class="coordinate-input" />
        </el-form-item>
        
        <el-form-item label="Z坐标" prop="z">
          <el-input-number v-model="editLocationForm.z" :precision="0" :step="1" :controls="!isMobileSmall" class="coordinate-input" />
        </el-form-item>
      </template>
      
      <el-form-item label="描述" prop="description">
        <el-input 
          v-model="editLocationForm.description" 
          type="textarea" 
          :rows="2"
          placeholder="可选，添加对该地点的描述"
        />
      </el-form-item>
      
      <div class="centered-buttons">
        <el-button type="primary" @click="submitEditLocation" :loading="submitting">保存修改</el-button>
        <el-button @click="editLocationDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmDeleteCurrentLocation" :loading="submitting">删除坐标</el-button>
      </div>
    </el-form>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Picture, Loading, CopyDocument, Check, Plus, Location, Delete, Edit, Search } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import api from '@/api/index.js'

// 标签页状态
const activeTab = ref('locations')

// 用户相关
const userStore = useUserStore()
const isLoggedIn = computed(() => !!userStore.user)
const currentUser = computed(() => userStore.user)

// 移动端检测
const windowWidth = ref(window.innerWidth)
const isMobile = computed(() => windowWidth.value <= 768)
const isMobileSmall = computed(() => windowWidth.value <= 480)

// 监听窗口大小变化
const handleResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  fetchLocations()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})


// 坐标相关
const locations = ref([])
const loading = ref(false)
const submitting = ref(false)
const addLocationDialogVisible = ref(false)
const locationFormRef = ref(null)

// 修改坐标相关
const editLocationDialogVisible = ref(false)
const editLocationFormRef = ref(null)
const editLocationForm = ref({
  _id: '',
  name: '',
  type: '主世界',
  x: 0,
  y: 64,
  z: 0,
  description: ''
})

// 分页和筛选相关
const currentPage = ref(1)
const pageSize = ref(12) // 每页显示12个坐标，3行4列
const selectedDimension = ref('') // 默认显示所有维度
const searchQuery = ref('') // 搜索查询

// 根据名称和维度筛选坐标
const filteredLocations = computed(() => {
  let result = locations.value

  // 按维度筛选
  if (selectedDimension.value) {
    result = result.filter(location => location.type === selectedDimension.value)
  }
  
  // 按名称搜索
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(location => 
      location.name.toLowerCase().includes(query)
    )
  }
  
  return result
})

// 计算当前页的坐标
const paginatedLocations = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  return filteredLocations.value.slice(startIndex, endIndex)
})

// 当筛选条件或搜索查询变化时，重置页码
watch([selectedDimension, searchQuery], () => {
  currentPage.value = 1
})

// 页码变化处理函数
const handlePageChange = (page) => {
  currentPage.value = page
}

// 坐标表单
const locationForm = ref({
  name: '',
  type: '主世界',
  x: 0,
  y: 64,
  z: 0,
  description: ''
})

// 表单验证规则
const locationRules = {
  name: [
    { required: true, message: '请输入地点名称', trigger: 'blur' },
    { min: 1, max: 20, message: '长度在 1 到 20 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择维度类型', trigger: 'change' }
  ],
  x: [
    { required: true, message: '请输入X坐标', trigger: 'blur' }
  ],
  y: [
    { required: true, message: '请输入Y坐标', trigger: 'blur' }
  ],
  z: [
    { required: true, message: '请输入Z坐标', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '描述不能超过200个字符', trigger: 'blur' }
  ]
}


// 复制服务器地址到剪贴板
const copyServerAddress = () => {
  const serverAddress = 'play.simpfun.cn:22788'
  navigator.clipboard.writeText(serverAddress)
    .then(() => {
      ElMessage.success('服务器地址已复制到剪贴板')
    })
    .catch(() => {
      ElMessage.error('复制失败，请手动复制')
    })
}

// 获取所有坐标信息
const fetchLocations = async () => {
  loading.value = true
  try {
    // 使用现有的API端点，确保后端已经部署此接口
    const result = await api.getMcLocations('list')
    if (result.code === 0) {
      locations.value = result.data || []
      // 重置页码
      currentPage.value = 1
    } else {
      throw new Error(result.message || '获取坐标信息失败')
    }
  } catch (error) {
    console.error('获取坐标信息出错:', error)
    ElMessage.error(error.message || '获取坐标信息失败，请稍后再试')
    // 初始化一个空数组，避免界面报错
    locations.value = []
  } finally {
    loading.value = false
  }
}

// 显示添加坐标对话框
const showAddLocationDialog = () => {
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录后再添加坐标')
    return
  }
  addLocationDialogVisible.value = true
}

// 提交坐标信息
const submitLocation = async () => {
  if (!locationFormRef.value) return
  
  await locationFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        // 获取授权token
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('未登录或登录已过期')
        }
        
        // 构建提交数据
        const submitData = {
          ...locationForm.value,
          authorId: currentUser.value?._id || currentUser.value?.id,
          authorName: currentUser.value?.nickname || '匿名用户'
        }
        
        console.log('提交坐标数据:', submitData)
        
        // 发送请求
        const result = await api.addMcLocation(submitData)
        if (result.code === 0) {
          ElMessage.success('坐标添加成功')
          resetLocationForm()
          addLocationDialogVisible.value = false
          // 重新获取坐标列表
          fetchLocations()
        } else {
          throw new Error(result.message || '添加坐标失败')
        }
      } catch (error) {
        console.error('添加坐标出错:', error)
        ElMessage.error(error.message || '添加坐标失败，请稍后再试')
      } finally {
        submitting.value = false
      }
    }
  })
}

// 重置坐标表单
const resetLocationForm = () => {
  if (locationFormRef.value) {
    locationFormRef.value.resetFields()
  }
}

// 删除坐标
const deleteLocation = async (locationId) => {
  try {
    // 确认删除
    await ElMessageBox.confirm('确定要删除这个坐标吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 获取授权token
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('未登录或登录已过期')
    }
    
    // 发送请求
    const result = await api.deleteMcLocation(locationId)
    if (result.code === 0) {
      ElMessage.success('坐标删除成功')
      // 重新获取坐标列表
      fetchLocations()
    } else {
      throw new Error(result.message || '删除坐标失败')
    }
  } catch (error) {
    if (error === 'cancel') return
    console.error('删除坐标出错:', error)
    ElMessage.error(error.message || '删除坐标失败，请稍后再试')
  }
}

// 根据类型获取标签样式
const getTagType = (type) => {
  const typeMap = {
    '主世界': 'success',
    '下界': 'danger',
    '末地': 'warning'
  }
  return typeMap[type] || ''
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-'
  
  try {
    const date = new Date(dateString.$date || dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    
    return `${year}.${month}.${day}`
  } catch (error) {
    return '-'
  }
}

// 复制坐标到剪贴板
const copyCoordinates = (location) => {
  const coordsText = `${location.x} ${location.y} ${location.z}`
  navigator.clipboard.writeText(coordsText)
    .then(() => {
      ElMessage.success(`坐标 ${coordsText} 已复制到剪贴板`)
    })
    .catch(() => {
      ElMessage.error('复制失败，请手动复制')
    })
}

// 复制种子到剪贴板
const copySeed = () => {
  const seed = '6782181293532081135'
  navigator.clipboard.writeText(seed)
    .then(() => {
      ElMessage.success('服务器种子已复制到剪贴板')
    })
    .catch(() => {
      ElMessage.error('复制失败，请手动复制')
    })
}

// 显示修改坐标对话框
const showEditLocationDialog = (location) => {
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录后再修改坐标')
    return
  }
  editLocationForm.value._id = location._id
  editLocationForm.value.name = location.name
  editLocationForm.value.type = location.type
  editLocationForm.value.x = location.x
  editLocationForm.value.y = location.y
  editLocationForm.value.z = location.z
  editLocationForm.value.description = location.description
  editLocationDialogVisible.value = true
}

// 提交修改坐标
const submitEditLocation = async () => {
  if (!editLocationFormRef.value) return
  
  await editLocationFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        // 获取授权token
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('未登录或登录已过期')
        }
        
        // 构建提交数据
        const submitData = {
          ...editLocationForm.value,
          authorId: currentUser.value?._id || currentUser.value?.id,
          authorName: currentUser.value?.nickname || '匿名用户'
        }
        
        console.log('提交坐标数据:', submitData)
        
        // 发送请求
        const result = await api.updateMcLocation(submitData._id, submitData)
        if (result.code === 0) {
          ElMessage.success('坐标修改成功')
          editLocationDialogVisible.value = false
          // 重新获取坐标列表
          fetchLocations()
        } else {
          throw new Error(result.message || '修改坐标失败')
        }
      } catch (error) {
        console.error('修改坐标出错:', error)
        ElMessage.error(error.message || '修改坐标失败，请稍后再试')
      } finally {
        submitting.value = false
      }
    }
  })
}

// 确认删除当前坐标
const confirmDeleteCurrentLocation = async () => {
  try {
    // 确认删除
    await ElMessageBox.confirm('确定要删除这个坐标吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 获取授权token
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('未登录或登录已过期')
    }
    
    // 发送请求
    const result = await api.deleteMcLocation(editLocationForm.value._id)
    if (result.code === 0) {
      ElMessage.success('坐标删除成功')
      editLocationDialogVisible.value = false
      // 重新获取坐标列表
      fetchLocations()
    } else {
      throw new Error(result.message || '删除坐标失败')
    }
  } catch (error) {
    if (error === 'cancel') return
    console.error('删除坐标出错:', error)
    ElMessage.error(error.message || '删除坐标失败，请稍后再试')
  }
}
</script>

<style scoped>
.minecraft-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  background-color: rgba(245, 245, 245, 0.4);
  border-radius: 16px;
}

.mc-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 32px;
  padding: 24px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.7), rgba(33, 150, 243, 0.5));
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.mc-logo {
  width: 64px;
  height: 64px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  transition: transform 0.3s ease;
}

.mc-logo:hover {
  transform: scale(1.1) rotate(5deg);
}

.page-title {
  font-size: 32px;
  font-weight: bold;
  color: white;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
}

.mc-info {
  margin-bottom: 0;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-radius: 16px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.mc-info:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}

.glass-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f5f7fa;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.card-header h2 {
  margin: 0;
  font-size: 22px;
  color: var(--el-text-color-primary);
  text-shadow: none;
}

.server-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
}

:deep(.el-descriptions) {
  --el-descriptions-item-bordered-label-background: rgba(76, 175, 80, 0.1);
}

:deep(.el-descriptions__label) {
  font-weight: bold !important;
}

.server-value {
  font-size: 16px;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.server-value-multi {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.version-tag {
  font-weight: bold;
  color: #2196F3;
}

.server-type-tags {
  display: flex;
  gap: 8px;
}

.mc-tag {
  background-color: rgba(76, 175, 80, 0.2);
  color: #2e7d32;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
}

.server-actions {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 16px;
  transition: transform 0.3s ease;
}

.copy-btn:hover {
  transform: scale(1.05);
}


/* 坐标信息样式 */
.mc-locations {
  margin: 0 0 32px 0;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-radius: 16px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.mc-locations:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}

.location-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.dimension-filter {
  width: 120px;
}

.dimension-filter :deep(.el-input__wrapper) {
  border-radius: 20px;
}

.search-input {
  width: 200px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 20px;
}

.locations-content {
  padding: 24px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  gap: 16px;
  color: var(--el-text-color-secondary);
}

.empty-locations {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  gap: 16px;
  color: var(--el-text-color-secondary);
}

.locations-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.location-card {
  padding: 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  font-size: 0.9em;
}

.location-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.location-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.location-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.location-header .el-tag {
  transform: scale(0.8);
  transform-origin: left top;
  padding: 0 4px;
  margin-left: 0;
}

.location-coordinates {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
  background-color: rgba(0, 0, 0, 0.05);
  padding: 6px 8px;
  border-radius: 6px;
  position: relative;
}

.coordinate {
  display: flex;
  align-items: center;
  gap: 4px;
}

.coordinate .label {
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.coordinate .value {
  font-family: monospace;
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.location-description {
  margin: 8px 0;
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1.4;
  max-height: 60px;
  overflow-y: auto;
  padding: 6px;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 6px;
}

.location-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.location-author {
  max-width: calc(100% - 80px); /* 为日期和操作按钮预留空间 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.location-actions {
  display: flex;
  align-items: center;
}

.glass-overlay {
  background-color: rgba(255, 255, 255, 0.3) !important;
  backdrop-filter: blur(8px) !important;
  -webkit-backdrop-filter: blur(8px) !important;
}

.join-server {
  text-align: center;
  padding: 32px 20px;
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(33, 150, 243, 0.2));
  border-radius: 16px;
  margin-top: 24px;
}

.join-title {
  font-size: 28px;
  color: var(--el-text-color-primary);
  margin-top: 0;
  margin-bottom: 16px;
}

.join-desc {
  font-size: 16px;
  color: var(--el-text-color-secondary);
  margin-bottom: 24px;
}

.join-button {
  padding: 12px 32px;
  font-size: 18px;
  border-radius: 24px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.join-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.pagination-container {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

:deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
  background-color: rgba(76, 175, 80, 0.8);
}

:deep(.el-pagination.is-background .el-pager li:not(.is-disabled):hover) {
  color: rgba(76, 175, 80, 1);
}

.copy-coords-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.6;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.copy-coords-btn:hover {
  opacity: 1;
  transform: translateY(-50%) scale(1.1);
}

/* 移动端隐藏元素 */
.mobile-hidden {
  display: inline-block;
}

/* 表单按钮样式 */
.form-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 24px;
  margin-bottom: 0;
}

.button-group {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
}

.form-buttons :deep(.el-form-item__content) {
  flex-direction: column;
  align-items: center;
  width: 100%;
}

/* 删除按钮样式 */
.form-buttons :deep(.el-button--danger) {
  width: 200px;
}

@media (max-width: 768px) {
  /* 在移动端隐藏元素 */
  .mobile-hidden {
    display: none;
  }
  
  /* 调整作者名称在移动端的样式 */
  .location-author {
    max-width: calc(100% - 40px); /* 为单个操作按钮预留空间 */
  }
  
  /* 修改对话框中的删除按钮样式 */
  .form-buttons :deep(.el-button--danger) {
    margin-top: 12px;
    width: 100%;
    max-width: none;
  }
  
  /* 操作按钮在移动端的样式 */
  .button-group {
    flex-direction: column;
    width: 100%;
    gap: 8px;
    margin-bottom: 12px;
  }
  
  .button-group .el-button {
    width: 100%;
  }
  
  /* 其他对话框移动端适配样式保持不变 */
  :deep(.add-location-dialog),
  :deep(.edit-location-dialog) {
    width: 70% !important;
    margin: 10% auto;
    max-height: 80vh;
  }

  :deep(.el-dialog__header) {
    padding: 12px 16px;
  }

  :deep(.el-dialog__body) {
    padding: 16px;
    max-height: calc(80vh - 100px);
    overflow-y: auto;
  }

  :deep(.el-form-item) {
    margin-bottom: 16px;
  }

  :deep(.el-form-item__label) {
    padding: 0 0 6px;
    line-height: 1.2;
    text-align: left;
    width: 100% !important;
    display: block;
    font-size: 14px;
  }

  :deep(.el-form-item__content) {
    margin-left: 0 !important;
    width: 100%;
  }

  :deep(.el-input-number) {
    width: 100%;
  }

  :deep(.el-button) {
    padding: 8px 16px;
    font-size: 14px;
  }
  
  /* 表单按钮在移动端的样式 */
  .form-buttons {
    margin-top: 16px;
  }
  
  .form-buttons :deep(.el-form-item__content) {
    gap: 8px;
  }
  
  /* 在移动端隐藏原始标题，避免与全站导航栏重复 */
  .mc-header {
    display: none;
  }
  
  .content-grid {
    grid-template-columns: 1fr;
  }

  .page-title {
    font-size: 26px;
    text-align: center;
  }

  .card-header {
    flex-direction: column;
    gap: 12px;
  }

  
  /* 减小卡片容器的边距 */
  .locations-content {
    padding: 6px !important;
  }
  
  /* 减小网格间距 */
  .locations-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  
  /* 调整坐标卡片样式 */
  .location-card {
    padding: 6px !important;
    font-size: 0.8em;
    overflow: hidden;
  }
  
  /* 调整标题和标签的布局，改为垂直排列 */
  .location-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    margin-bottom: 6px;
  }
  
  /* 减小坐标名称字号，允许完整显示 */
  .location-header h3 {
    font-size: 12px !important;
    max-width: none; /* 移除最大宽度限制 */
    white-space: normal; /* 允许文本换行 */
    overflow: visible; /* 移除溢出隐藏 */
    text-overflow: clip; /* 移除省略号 */
    margin: 0;
    line-height: 1.2; /* 添加适当的行高 */
    word-break: break-word; /* 允许在任何字符处换行 */
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
  
  /* 调整标签样式 */
  .location-header .el-tag {
    transform: scale(0.8);
    transform-origin: left top; /* 从左上角开始缩放 */
    padding: 0 4px;
    margin-left: 0; /* 移除左边距 */
  }
  
  /* 完全重构坐标显示为紧凑一行 */
  .location-coordinates {
    flex-direction: row;
    flex-wrap: nowrap;
    gap: 2px;
    padding: 4px 30px 4px 4px; /* 右侧为复制按钮预留空间 */
    justify-content: flex-start;
    align-items: center;
    position: relative;
    min-height: 28px;
    font-size: 0.85em;
  }
  
  .coordinate {
    display: flex;
    align-items: center;
    gap: 1px;
  }
  
  .coordinate .label {
    font-size: 11px;
  }
  
  .coordinate .value {
    font-size: 11px;
  }
  
  .copy-coords-btn {
    position: absolute;
    right: 2px;
    top: 50%;
    transform: translateY(-50%) scale(0.7);
    padding: 1px 3px;
    min-height: 20px;
    width: 24px;
    height: 20px;
  }
  
  .copy-coords-btn .el-icon {
    font-size: 12px;
  }
  
  .copy-coords-btn:hover {
    transform: translateY(-50%) scale(0.75);
  }
  
  .location-description {
    font-size: 11px;
    max-height: 40px;
    padding: 4px;
    margin: 6px 0;
  }
  
  .location-meta {
    font-size: 10px;
    margin-top: 6px;
  }
  
  .location-actions .el-button {
    transform: scale(0.8);
    transform-origin: right center;
  }
  
  /* 调整分页组件大小 */
  .pagination-container {
    transform: scale(0.9);
    transform-origin: center center;
  }
  
  .mc-locations {
    margin-top: 20px;
  }
  
  /* 调整搜索和筛选控件 */
  .location-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .dimension-filter,
  .search-input {
    width: 100%;
  }

  /* 优化服务器信息部分 */
  .server-info {
    gap: 12px;
    padding: 12px;
  }
  
  :deep(.el-descriptions__cell) {
    padding: 8px !important;
  }
  
  :deep(.el-descriptions__label) {
    font-size: 12px !important;
    padding: 6px 8px !important;
  }
  
  .server-value {
    font-size: 13px;
  }
  
  .server-value-multi {
    gap: 4px;
  }
  
  .version-tag {
    font-size: 12px;
  }
  
  .server-type-tags {
    flex-wrap: wrap;
    gap: 6px;
  }
  
  .mc-tag {
    padding: 2px 8px;
    font-size: 12px;
  }
  
  .server-actions {
    margin-top: 12px;
  }
  
  .copy-btn {
    font-size: 13px;
    padding: 8px 12px;
  }
  
  /* 优化加入服务器部分 */
  .join-server {
    padding: 20px 15px;
    margin-top: 16px;
  }
  
  .join-title {
    font-size: 20px;
    margin-bottom: 10px;
  }
  
  .join-desc {
    font-size: 14px;
    margin-bottom: 16px;
  }
  
  .join-button {
    padding: 8px 20px;
    font-size: 15px;
  }

  .seed-value {
    font-size: 13px;
    letter-spacing: normal;
  }
  
  .copy-seed-btn {
    margin-left: 4px;
    transform: scale(0.9);
  }

  /* 移动端居中按钮组样式 */
  .centered-buttons {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }
  
  .centered-buttons .el-button {
    padding: 8px 12px;
    font-size: 13px;
    min-width: 0;
    flex: 0 0 auto;
  }
}

/* 小屏幕手机特别适配 */
@media (max-width: 380px) {
  /* 在单列布局下进一步减小边距 */
  .locations-content {
    padding: 10px;
  }
  
  .locations-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  /* 在单列布局下可以有更多空间，但字号仍然保持小一点 */
  .location-header h3 {
    max-width: 150px;
    font-size: 12px !important; /* 修改为12px，但保持比768px断点的字号大一些 */
  }
  
  .location-coordinates {
    padding-right: 30px;
    gap: 6px;
  }
  
  .coordinate .label {
    font-size: 12px;
  }
  
  .coordinate .value {
    font-size: 12px;
  }

  /* 进一步优化服务器信息 */
  .server-info {
    padding: 10px;
  }
  
  :deep(.el-descriptions__label) {
    font-size: 11px !important;
    padding: 5px 6px !important;
  }
  
  .server-value {
    font-size: 12px;
  }
  
  .mc-tag {
    padding: 1px 6px;
    font-size: 11px;
  }
  
  /* 对话框标题 */
  :deep(.el-dialog__title) {
    font-size: 16px;
  }

  :deep(.el-form-item__label) {
    font-size: 13px;
  }

  :deep(.el-button) {
    padding: 6px 12px;
    font-size: 13px;
  }
  
  /* 表单按钮在小屏幕的样式 */
  .form-buttons :deep(.el-form-item__content) {
    flex-direction: column;
    width: 100%;
  }
  
  .form-buttons :deep(.el-button) {
    width: 100%;
  }
}

/* 增加中等屏幕的响应式布局 */
@media (min-width: 769px) and (max-width: 1200px) {
  .locations-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.seed-value {
  font-family: inherit;
  letter-spacing: normal;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.copy-seed-btn {
  margin-left: 8px;
  padding: 2px;
  color: var(--el-color-primary);
}

.copy-seed-btn:hover {
  color: var(--el-color-primary-light-3);
}

/* 坐标输入框样式 */
.coordinate-input {
  width: 160px;
}

@media (max-width: 768px) {
  .coordinate-input {
    width: 30%;
    max-width: 200px;
  }
}

/* 居中按钮组样式 */
.centered-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin: 24px 0 8px;
  flex-wrap: wrap;
}

/* 删除按钮样式 */
.centered-buttons .el-button--danger {
  margin-top: 0;
}

/* 移动端坐标组样式 */
.mobile-coordinates-group {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 16px;
}

.mobile-coordinate-item {
  flex: 1;
  margin-bottom: 0 !important;
}

.mobile-coordinate-item :deep(.el-form-item__label) {
  display: block;
  text-align: center;
  padding: 0 0 4px;
  line-height: 1;
  font-size: 14px;
}

.mobile-coordinate-input {
  width: 100% !important;
}

.mobile-coordinate-input :deep(.el-input__inner) {
  padding: 0 5px;
  text-align: center;
}

/* 标签页容器样式 */
.tabs-container {
  margin-bottom: 20px;
  border-radius: 12px;
  overflow: hidden;
  background-color: #ffffff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.mc-tabs {
  padding: 0;
}

:deep(.el-tabs__header) {
  margin-bottom: 0;
  background-color: #ffffff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

:deep(.el-tabs__nav-wrap::after) {
  display: none;
}

:deep(.el-tabs__active-bar) {
  background-color: var(--primary-color);
  height: 3px;
}

:deep(.el-tabs__item) {
  font-size: 16px;
  font-weight: 500;
  color: #666;
  padding: 16px 20px;
  transition: all 0.3s;
}

:deep(.el-tabs__item.is-active) {
  color: var(--primary-color);
  font-weight: 600;
}

:deep(.el-tabs__content) {
  padding: 20px;
}

/* 移动端标签页样式调整 */
@media (max-width: 768px) {
  :deep(.el-tabs__item) {
    font-size: 14px;
    padding: 12px 16px;
  }
  
  :deep(.el-tabs__content) {
    padding: 16px 12px;
  }
}

/* 坐标信息和服务器信息内容区域样式 */
.mc-locations, .mc-info {
  background-color: transparent;
}
</style>
