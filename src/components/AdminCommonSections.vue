<template>
  <!-- 仪表板 -->
  <div v-if="activeMenu === 'dashboard'" class="admin-section">
    <h3 class="section-title">网站统计</h3>
    <AdminDashboard />
  </div>
  
  <!-- 成绩管理 -->
  <div v-if="activeMenu === 'records'" class="admin-section">
    <h3 class="section-title">成绩记录管理</h3>
    <AdminRecordsTable 
      :records="allRecords" 
      :loading="recordsLoading"
      @refresh="fetchAllRecords"
    />
  </div>
  
  <!-- 整活项目管理 -->
  <div v-if="activeMenu === 'meme-events'" class="admin-section">
    <div class="section-header">
      <h3 class="section-title">整活项目管理</h3>
      <div class="section-actions">
        <el-button type="primary" @click="showAddMemeEventDialog">
          <el-icon><Plus /></el-icon>
          添加项目
        </el-button>
        <el-button @click="fetchMemeEvents" :loading="memeEventsLoading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>
    
    <el-table :data="memeEvents" v-loading="memeEventsLoading" class="meme-events-table">
      <el-table-column prop="eventName" label="项目名称" width="200" />
      <el-table-column prop="description" label="描述" :show-overflow-tooltip="true" />
      <el-table-column prop="isActive" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.isActive ? 'success' : 'warning'" size="small">
            {{ row.isActive ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdByName" label="创建者" width="100" />
      <el-table-column label="操作" width="200" class-name="action-column">
        <template #default="{ row }">
          <div class="action-buttons">
            <el-button-group>
              <el-button size="small" @click="editMemeEvent(row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button 
                size="small" 
                type="danger" 
                @click="deleteMemeEvent(row)"
              >
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </el-button-group>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
  
  <!-- 添加整活项目对话框 -->
  <el-dialog
    v-model="addMemeEventDialogVisible"
    title="添加整活项目"
    width="500px"
  >
    <el-form :model="memeEventForm" label-width="80px">
      <el-form-item label="项目代码" required>
        <el-input v-model="memeEventForm.eventCode" placeholder="如: 250ml牛奶" />
        <div class="form-tip">项目代码用于系统识别，添加后不可修改</div>
      </el-form-item>
      <el-form-item label="项目名称" required>
        <el-input v-model="memeEventForm.eventName" placeholder="如: 250ml牛奶" />
      </el-form-item>
      <el-form-item label="项目描述">
        <el-input 
          v-model="memeEventForm.description" 
          type="textarea" 
          :rows="3"
          placeholder="项目的详细描述（可选）"
        />
      </el-form-item>
    </el-form>
    
    <template #footer>
      <el-button @click="addMemeEventDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="submitMemeEvent">确认添加</el-button>
    </template>
  </el-dialog>
  
  <!-- 编辑整活项目对话框 -->
  <el-dialog
    v-model="editMemeEventDialogVisible"
    title="编辑整活项目"
    width="500px"
  >
    <el-form :model="memeEventForm" label-width="80px">
      <el-form-item label="项目代码" required>
        <el-input v-model="memeEventForm.eventCode" disabled />
        <div class="form-tip">项目代码不可修改</div>
      </el-form-item>
      <el-form-item label="项目名称" required>
        <el-input v-model="memeEventForm.eventName" placeholder="如: 250ml牛奶" />
      </el-form-item>
      <el-form-item label="项目描述">
        <el-input 
          v-model="memeEventForm.description" 
          type="textarea" 
          :rows="3"
          placeholder="项目的详细描述（可选）"
        />
      </el-form-item>
      <el-form-item label="状态">
        <el-switch
          v-model="memeEventForm.isActive"
          active-text="启用"
          inactive-text="禁用"
        />
      </el-form-item>
    </el-form>
    
    <template #footer>
      <el-button @click="editMemeEventDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="submitMemeEvent">确认修改</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue'
import AdminDashboard from '@/components/AdminDashboard.vue'
import AdminRecordsTable from '@/components/AdminRecordsTable.vue'
import { useAdminCommon } from '@/composables/useAdminCommon'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Refresh } from '@element-plus/icons-vue'
import api from '@/api/index.js'

const props = defineProps({
  activeMenu: {
    type: String,
    required: true
  }
})

// 使用公共 composable
const { recordsLoading, allRecords, fetchAllRecords, formatDate } = useAdminCommon()

// 整活项目管理相关
const memeEvents = ref([])
const memeEventsLoading = ref(false)
const addMemeEventDialogVisible = ref(false)
const editMemeEventDialogVisible = ref(false)
const memeEventForm = ref({
  eventCode: '',
  eventName: '',
  description: '',
  isActive: true
})
const selectedMemeEvent = ref(null)

// 获取整活项目列表
const fetchMemeEvents = async () => {
  memeEventsLoading.value = true
  try {
    const result = await api.getMemeEvents({ page: 1, pageSize: 50 })
    if (result.code === 200) {
      memeEvents.value = result.data || []
    } else {
      throw new Error(result.message || '获取整活项目失败')
    }
  } catch (error) {
    ElMessage.error('获取整活项目失败: ' + error.message)
    memeEvents.value = []
  } finally {
    memeEventsLoading.value = false
  }
}

// 显示添加项目对话框
const showAddMemeEventDialog = () => {
  memeEventForm.value = {
    eventCode: '',
    eventName: '',
    description: '',
    isActive: true
  }
  selectedMemeEvent.value = null
  addMemeEventDialogVisible.value = true
}

// 编辑整活项目
const editMemeEvent = (event) => {
  selectedMemeEvent.value = event
  memeEventForm.value = {
    eventCode: event.eventCode,
    eventName: event.eventName,
    description: event.description || '',
    isActive: event.isActive !== undefined ? event.isActive : true
  }
  editMemeEventDialogVisible.value = true
}

// 删除整活项目
const deleteMemeEvent = async (event) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除整活项目 "${event.eventName}" 吗？如果该项目已有成绩记录，将无法删除。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const result = await api.deleteMemeEvent(event._id)
    
    if (result.code === 200) {
      ElMessage.success('整活项目删除成功')
      await fetchMemeEvents()
    } else {
      throw new Error(result.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + error.message)
    }
  }
}

// 提交整活项目（添加或编辑）
const submitMemeEvent = async () => {
  try {
    // 验证表单
    if (!memeEventForm.value.eventCode || !memeEventForm.value.eventName) {
      ElMessage.error('项目代码和名称不能为空')
      return
    }
    
    const data = {
      eventCode: memeEventForm.value.eventCode,
      eventName: memeEventForm.value.eventName,
      description: memeEventForm.value.description,
      isActive: memeEventForm.value.isActive
    }
    
    let result
    if (selectedMemeEvent.value) {
      // 编辑模式
      result = await api.updateMemeEvent({
        id: selectedMemeEvent.value._id,
        ...data
      })
    } else {
      // 添加模式
      result = await api.addMemeEvent(data)
    }
    
    if (result.code === 200) {
      ElMessage.success(selectedMemeEvent.value ? '整活项目修改成功' : '整活项目添加成功')
      addMemeEventDialogVisible.value = false
      editMemeEventDialogVisible.value = false
      await fetchMemeEvents()
    } else {
      throw new Error(result.message || '操作失败')
    }
  } catch (error) {
    ElMessage.error('操作失败: ' + error.message)
  }
}

// 暴露方法供父组件调用
defineExpose({
  fetchMemeEvents,
  fetchAllRecords
})
</script>

<style scoped>
.admin-section {
  max-width: 1200px;
}

.section-title {
  margin: 0 0 20px 0;
  color: var(--text-color);
  font-size: 20px;
  font-weight: 600;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-actions {
  display: flex;
  gap: 8px;
}

.meme-events-table {
  width: 100%;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* 操作按钮默认隐藏，鼠标悬停时显示 */
.action-buttons {
  opacity: 0;
  transition: opacity 0.2s ease;
}

:deep(.el-table__row:hover .action-buttons) {
  opacity: 1;
}

/* 确保操作列有足够的空间 */
:deep(.action-column) {
  padding: 0 !important;
}

:deep(.action-column .cell) {
  padding: 0 !important;
}
</style>

