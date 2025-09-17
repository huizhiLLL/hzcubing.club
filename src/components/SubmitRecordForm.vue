<template>
  <div class="card">
    <div class="header-with-tip">
      <h2 class="text-2xl font-bold mb-6">上传成绩</h2>
      <el-tooltip
        content="开创新的【整活项目】可以联系群主添加：3169164181（q）
        或者直接在意见箱中写明"
        placement="top"
        effect="light"
        class="form-popover"
      >
        <span class="new-project-tip">我想开创新项目</span>
      </el-tooltip>
    </div>
    
    <div class="form-scroll-container">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        class="max-w-xl form-container"
        v-loading="loading"
      >
        <el-form-item label="项目类型" prop="category">
          <el-select 
            v-model="form.category" 
            placeholder="请选择项目类型" 
            class="w-full custom-select short-select"
            @change="handleCategoryChange"
          >
            <el-option
              v-for="category in categories"
              :key="category.value"
              :label="category.label"
              :value="category.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="具体项目" prop="event">
          <el-select 
            v-model="form.event" 
            placeholder="请选择具体项目" 
            class="w-full custom-select short-select"
            :disabled="!form.category"
          >
            <el-option
              v-for="event in currentEvents"
              :key="event.value"
              :label="event.label"
              :value="event.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="单次成绩" prop="single">
          <div class="time-input-container">
            <div class="time-input-row">
              <!-- 时间输入框 -->
              <template v-if="form.singleTimeFormat === 'minutes'">
                <div class="time-input-field min-field">
                  <el-input-number
                    v-model="form.singleMinutes"
                    :min="0"
                    :precision="0"
                    :step="1"
                    :controls="false"
                    placeholder=""
                    class="number-input"
                  />
                </div>
                <div class="time-separator">:</div>
                <div class="time-input-field sec-field">
                  <el-input-number
                    v-model="form.singleSeconds"
                    :min="0"
                    :max="59"
                    :precision="0"
                    :step="1"
                    :controls="false"
                    placeholder=""
                    class="number-input"
                  />
                </div>
                <div class="time-separator">.</div>
                <div class="time-input-field ms-field">
                  <el-input-number
                    v-model="form.singleMilliseconds"
                    :min="0"
                    :max="99"
                    :precision="0"
                    :step="1"
                    :controls="false"
                    placeholder=""
                    class="number-input"
                  />
                </div>
              </template>
              
              <template v-else>
                <div class="time-input-field sec-field">
                  <el-input-number
                    v-model="form.singleSeconds"
                    :min="0"
                    :precision="0"
                    :step="1"
                    :controls="false"
                    placeholder=""
                    class="number-input"
                  />
                </div>
                <div class="time-separator">.</div>
                <div class="time-input-field ms-field">
                  <el-input-number
                    v-model="form.singleMilliseconds"
                    :min="0"
                    :max="99"
                    :precision="0"
                    :step="1"
                    :controls="false"
                    placeholder=""
                    class="number-input"
                  />
                </div>
              </template>
            </div>
            
            <!-- 时间格式切换开关 - 移到单次成绩右侧 -->
            <div class="format-toggle-container">
              <div class="toggle-label">秒</div>
              <div class="toggle-switch">
                <el-switch
                  v-model="timeFormatMinutes"
                  @change="toggleGlobalFormat"
                  active-color="#409EFF"
                  inactive-color="#409EFF"
                />
              </div>
              <div class="toggle-label">分:秒</div>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="平均成绩" prop="average">
          <div class="time-input-container">
            <div class="time-input-row">
              <!-- 时间输入框 -->
              <template v-if="form.averageTimeFormat === 'minutes'">
                <div class="time-input-field min-field">
                  <el-input-number
                    v-model="form.averageMinutes"
                    :min="0"
                    :precision="0"
                    :step="1"
                    :controls="false"
                    placeholder=""
                    class="number-input"
                  />
                </div>
                <div class="time-separator">:</div>
                <div class="time-input-field sec-field">
                  <el-input-number
                    v-model="form.averageSeconds"
                    :min="0"
                    :max="59"
                    :precision="0"
                    :step="1"
                    :controls="false"
                    placeholder=""
                    class="number-input"
                  />
                </div>
                <div class="time-separator">.</div>
                <div class="time-input-field ms-field">
                  <el-input-number
                    v-model="form.averageMilliseconds"
                    :min="0"
                    :max="99"
                    :precision="0"
                    :step="1"
                    :controls="false"
                    placeholder=""
                    class="number-input"
                  />
                </div>
              </template>
              
              <template v-else>
                <div class="time-input-field sec-field">
                  <el-input-number
                    v-model="form.averageSeconds"
                    :min="0"
                    :precision="0"
                    :step="1"
                    :controls="false"
                    placeholder=""
                    class="number-input"
                  />
                </div>
                <div class="time-separator">.</div>
                <div class="time-input-field ms-field">
                  <el-input-number
                    v-model="form.averageMilliseconds"
                    :min="0"
                    :max="99"
                    :precision="0"
                    :step="1"
                    :controls="false"
                    placeholder=""
                    class="number-input"
                  />
                </div>
              </template>
            </div>
            
            <!-- 添加提示信息 -->
            
          </div>
        </el-form-item>

        <el-form-item label="使用魔方" prop="cube">
          <el-input 
            v-model="form.cube" 
            placeholder="选填，请输入使用的魔方型号" 
            class="medium-input"
          />
        </el-form-item>

        <el-form-item label="使用方法" prop="method">
          <el-input 
            v-model="form.method" 
            placeholder="选填，请输入使用的方法" 
            class="medium-input"
          />
        </el-form-item>

        <div class="more-options-toggle" v-if="!showMoreOptions">
          <el-button type="primary" link @click="showMoreOptions = true">
            展开更多选项
            <el-icon class="ml-1">
              <component :is="'ArrowDown'"></component>
            </el-icon>
          </el-button>
        </div>

        <div v-show="showMoreOptions" class="more-options">
          <el-form-item label="感想" prop="remark">
            <el-input 
              v-model="form.remark" 
              type="textarea" 
              :rows="3"
              placeholder="选填，记录你的感想"
              class="short-input"
            />
          </el-form-item>

          <el-form-item label="视频链接" prop="videoLink">
            <el-input 
              v-model="form.videoLink" 
              placeholder="选填，可附上你的视频链接地址"
              class="short-input"
            />
          </el-form-item>
          
          <div class="collapse-options-toggle">
            <el-button type="primary" link @click="showMoreOptions = false">
              收起更多选项
              <el-icon class="ml-1">
                <component :is="'ArrowUp'"></component>
              </el-icon>
            </el-button>
          </div>
        </div>

        <!-- 常规按钮区域，不再使用固定容器 -->
        <el-form-item class="form-actions">
          <div class="action-buttons">
            <el-button type="primary" class="submit-button" @click="submitForm(formRef)" :loading="loading">
              <div class="button-content" v-if="!loading">
                <span class="button-text">上传</span>
              </div>
            </el-button>
            <el-button class="reset-button" @click="resetForm(formRef)">
              <div class="button-content">
                <span class="button-text">重置</span>
              </div>
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useRecordsStore } from '@/stores/records'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { ArrowDown, ArrowUp } from '@element-plus/icons-vue'
import { categories, events } from '@/config/events'

const recordsStore = useRecordsStore()
const userStore = useUserStore()
const router = useRouter()
const loading = ref(false)
const showMoreOptions = ref(false)

// 时间格式开关状态 - 合并为一个全局状态
const timeFormatMinutes = ref(false)

// 切换全局时间格式
const toggleGlobalFormat = (value) => {
  // 同时更新单次和平均成绩的格式
  const newFormat = value ? 'minutes' : 'seconds'
  form.singleTimeFormat = newFormat
  form.averageTimeFormat = newFormat
  
  // 重置相关字段
  handleTimeFormatChange('single')
  handleTimeFormatChange('average')
}

const formRef = ref()
const form = reactive({
  category: '',
  event: '',
  single: null,
  average: null,
  singleTimeFormat: 'seconds', // 默认秒格式
  averageTimeFormat: 'seconds', // 默认秒格式
  // 拆分的时间输入字段
  singleMinutes: null,
  singleSeconds: null,
  singleMilliseconds: null,
  averageMinutes: null,
  averageSeconds: null,
  averageMilliseconds: null,
  cube: '',
  method: '',
  remark: '',
  videoLink: ''
})

// 当任一格式改变时，同步开关状态
watch([() => form.singleTimeFormat, () => form.averageTimeFormat], ([newSingleFormat, newAverageFormat]) => {
  // 如果两者不一致，使用单次成绩的格式作为标准
  if (newSingleFormat !== newAverageFormat) {
    form.averageTimeFormat = newSingleFormat
  }
  timeFormatMinutes.value = newSingleFormat === 'minutes'
})

const currentEvents = computed(() => {
  if (!form.category) return []
  return events[form.category]?.options || []
})

// 处理时间格式变更
const handleTimeFormatChange = (type) => {
  // 重置相关字段
  if (type === 'single') {
    form.singleMinutes = null
    form.singleSeconds = null
    form.singleMilliseconds = null
  } else if (type === 'average') {
    form.averageMinutes = null
    form.averageSeconds = null
    form.averageMilliseconds = null
  }
}

// 根据项目选择合适的时间格式
watch(() => form.event, (newEvent) => {
  if (newEvent) {
    // 对于大型项目，默认设置为分钟格式
    const largeEvents = ['444', '555', '666', '777', 'meg', '333bf', '444bf', '555bf', '333mbf'];
    if (largeEvents.includes(newEvent)) {
      // 更新全局格式
      timeFormatMinutes.value = true;
      toggleGlobalFormat(true);
    }
  }
})

const handleCategoryChange = () => {
  form.event = ''
}

// 验证时间输入
const validateTimeInput = (type) => {
  if (type === 'single') {
    if (form.singleTimeFormat === 'seconds') {
      // 秒格式验证
      return form.singleSeconds !== null || form.singleMilliseconds !== null;
    } else {
      // 分:秒格式验证
      return form.singleMinutes !== null || form.singleSeconds !== null || form.singleMilliseconds !== null;
    }
  } else if (type === 'average') {
    if (form.averageTimeFormat === 'seconds') {
      // 秒格式验证
      return form.averageSeconds !== null || form.averageMilliseconds !== null;
    } else {
      // 分:秒格式验证
      return form.averageMinutes !== null || form.averageSeconds !== null || form.averageMilliseconds !== null;
    }
  }
  return false;
}

const rules = {
  category: [
    { required: true, message: '请选择项目类型', trigger: 'change' }
  ],
  event: [
    { required: true, message: '请选择具体项目', trigger: 'change' }
  ],
  single: [
    { 
      validator: (rule, value, callback) => {
        callback(); // 不在单次成绩处显示错误
      },
      trigger: 'blur'
    }
  ],
  average: [
    {
      validator: (rule, value, callback) => {
        const singleValid = validateTimeInput('single');
        const averageValid = validateTimeInput('average');
        
        if (!singleValid && !averageValid) {
          callback(new Error('单次成绩和平均成绩至少填写一个'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
}

// 将拆分的时间字段转换为秒数
const calculateTimeInSeconds = (type) => {
  if (type === 'single') {
    if (form.singleTimeFormat === 'seconds') {
      // 秒.毫秒格式
      const seconds = form.singleSeconds || 0;
      const milliseconds = form.singleMilliseconds || 0;
      return seconds + (milliseconds / 100); // 毫秒保留两位
    } else {
      // 分:秒.毫秒格式
      const minutes = form.singleMinutes || 0;
      const seconds = form.singleSeconds || 0;
      const milliseconds = form.singleMilliseconds || 0;
      return (minutes * 60) + seconds + (milliseconds / 100);
    }
  } else if (type === 'average') {
    if (form.averageTimeFormat === 'seconds') {
      // 秒.毫秒格式
      const seconds = form.averageSeconds || 0;
      const milliseconds = form.averageMilliseconds || 0;
      return seconds + (milliseconds / 100);
    } else {
      // 分:秒.毫秒格式
      const minutes = form.averageMinutes || 0;
      const seconds = form.averageSeconds || 0;
      const milliseconds = form.averageMilliseconds || 0;
      return (minutes * 60) + seconds + (milliseconds / 100);
    }
  }
  return null;
}

const submitForm = async (formEl) => {
  if (!formEl) return
  
  try {
    await formEl.validate(async (valid) => {
      if (valid) {
        loading.value = true;
        
        try {
          // 检查用户是否已登录
          if (!userStore.user || !userStore.user._id) {
            ElMessage.error('请先登录');
            router.push('/login');
            return;
          }
          
          // 根据拆分时间字段计算成绩
          const singleTime = validateTimeInput('single') ? 
            calculateTimeInSeconds('single') : null;
          const averageTime = validateTimeInput('average') ? 
            calculateTimeInSeconds('average') : null;
          
          // 创建记录对象
          const record = {
            event: form.event,
            single: singleTime ? {
              time: singleTime,
              nickname: userStore.user.nickname,
              userId: userStore.user._id
            } : null,
            average: averageTime ? {
              time: averageTime,
              nickname: userStore.user.nickname,
              userId: userStore.user._id
            } : null,
            cube: form.cube || '',
            method: form.method || '',
            remark: form.remark || '',
            videoLink: form.videoLink || '',
            timestamp: new Date().toISOString()
          };
          
          // 提交记录到后端
          await recordsStore.addRecord(record);
          
          // 重置表单
          resetForm(formEl);
          
          // 显示成功消息
          ElMessage.success('成绩提交成功');
          
          // 触发成功事件
          emit('success');
        } catch (error) {
          ElMessage.error(error.message || '提交失败，请重试');
        } finally {
          loading.value = false;
        }
      }
    });
  } catch (error) {
    ElMessage.error('表单验证失败，请检查输入');
    loading.value = false;
  }
}

const resetForm = (formEl) => {
  if (!formEl) return
  formEl.resetFields()
  form.singleTimeFormat = 'seconds'
  form.averageTimeFormat = 'seconds'
  // 更新开关状态
  timeFormatMinutes.value = false
  // 重置拆分的时间字段
  form.singleMinutes = null
  form.singleSeconds = null
  form.singleMilliseconds = null
  form.averageMinutes = null
  form.averageSeconds = null
  form.averageMilliseconds = null
  showMoreOptions.value = false
}

const emit = defineEmits(['success'])
</script>

<style scoped>
.card {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  transition: all 0.4s cubic-bezier(0.215, 0.610, 0.355, 1.000);
  animation: cardAppear 0.6s cubic-bezier(0.215, 0.610, 0.355, 1.000);
  display: flex;
  flex-direction: column;
  max-height: 600px; /* 设置最大高度 */
  border: 1px solid rgba(0, 0, 0, 0.1);
}

/* 定义动画 */
@keyframes cardAppear {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-container {
  background: transparent;
  min-height: 300px;
  border-bottom: none;
}

:deep(.el-form) {
  border-bottom: none;
}

:deep(.el-form-item:last-child) {
  margin-bottom: 0;
  border-bottom: none;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner),
:deep(.el-select .el-input__wrapper) {
  background-color: #ffffff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1) inset;
  transition: all 0.3s;
}

:deep(.el-input__wrapper:hover),
:deep(.el-textarea__inner:hover),
:deep(.el-select .el-input__wrapper:hover) {
  background-color: #ffffff;
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-textarea__inner:focus),
:deep(.el-select .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
}

:deep(.el-form-item__label) {
  color: var(--text-color);
  font-weight: 500;
}

:deep(.el-input-number .el-input__inner) {
  text-align: center;
  background-color: transparent;
}

.time-input-container {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 16px;
  margin-bottom: 4px;
}

.time-input-row {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 3px;
  flex-shrink: 0;
  background-color: transparent;
  padding: 4px 0;
  border-radius: 6px;
  border: none;
  transition: all 0.3s;
  width: 180px; /* 设置固定宽度使时间输入框更短 */
}

.time-input-row:hover {
  background-color: transparent;
  border-color: transparent;
}

.time-input-field {
  width: auto;
  position: relative;
}

.time-input-field :deep(.el-input__wrapper) {
  background-color: #ffffff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1) inset;
}

.min-field {
  width: 40px; /* 减小宽度 */
}

.sec-field {
  width: 40px; /* 减小宽度 */
}

.ms-field {
  width: 40px; /* 减小宽度 */
}

.number-input {
  width: 100%;
}

:deep(.el-input-number .el-input__wrapper) {
  padding: 0 8px;
}

:deep(.el-button) {
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s;
}

/* 基础按钮悬停效果 */
:deep(.el-button:hover) {
  transform: translateY(-2px);
}

/* 基础按钮点击效果 */
:deep(.el-button:active) {
  transform: translateY(1px);
}

/* Switch控件样式 */
:deep(.el-switch) {
  --el-switch-on-color: var(--primary-color);
}

/* 文字按钮样式 */
:deep(.el-button--text) {
  background-color: transparent;
  box-shadow: none;
}

:deep(.el-button--text:hover) {
  background-color: rgba(var(--el-color-primary-rgb), 0.1);
  color: var(--primary-color);
  transform: translateY(-1px);
}

/* 主要按钮样式 */
:deep(.el-button--primary) {
  border: none;
  background: linear-gradient(45deg, var(--primary-color), var(--primary-color-light));
  background-size: 200% 200%;
  animation: gradientAnimation 4s ease infinite;
  box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
}

:deep(.el-button--primary:hover) {
  background: linear-gradient(45deg, var(--primary-color-light), var(--primary-color));
  box-shadow: 0 6px 16px rgba(var(--el-color-primary-rgb), 0.4);
}

/* 默认按钮样式 */
:deep(.el-button--default) {
  border: 1px solid rgba(0, 0, 0, 0.1);
  background-color: #ffffff;
  color: var(--text-color);
}

:deep(.el-button--default:hover) {
  background-color: #f9f9f9;
  border-color: rgba(0, 0, 0, 0.2);
}

/* 表单操作区域样式 */
.form-actions {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  position: relative;
}

.form-actions::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.2), transparent);
}

.form-actions :deep(.el-form-item__content) {
  justify-content: center;
  margin-bottom: 0;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  width: 100%;
  max-width: 400px;
}

.action-buttons .submit-button,
.action-buttons .reset-button {
  min-width: 140px;
  height: 46px;
  border-radius: 8px;
  padding: 0;
  position: relative;
  overflow: hidden;
}

/* 隐藏Element Plus默认的按钮内容 */
.action-buttons .submit-button :deep(.el-button__content),
.action-buttons .reset-button :deep(.el-button__content) {
  display: none;
}

.button-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.button-text {
  display: inline-block;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-align: center;
}

.time-separator {
  font-size: 18px;
  font-weight: bold;
  margin: 0 2px;
  width: 10px;
  text-align: center;
  flex-shrink: 0;
}

.format-toggle-container {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  background-color: transparent;
  border-radius: 6px;
  border: none;
  width: 150px; /* 设置固定宽度 */
}

.toggle-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.toggle-switch {
  margin: 0 2px;
}

.form-note {
  font-size: 12px;
  color: #f56c6c;
  margin-top: 5px;
}

.more-options-toggle {
  display: flex;
  justify-content: center;
  margin: 12px 0;
  position: relative;
  z-index: 5;
}

.collapse-options-toggle {
  display: flex;
  justify-content: center;
  margin: 16px 0 20px;
  position: relative;
  z-index: 5;
}

.more-options-toggle :deep(.el-button),
.collapse-options-toggle :deep(.el-button) {
  background-color: #f5f7fa;
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.more-options-toggle :deep(.el-button:hover),
.collapse-options-toggle :deep(.el-button:hover) {
  background-color: #f0f2f5;
  transform: translateY(-2px);
}

.more-options {
  position: relative;
  z-index: 5;
  border-top: 1px dashed rgba(0, 0, 0, 0.15);
  padding-top: 16px;
  margin-top: 4px;
  margin-bottom: 16px;
  transition: all 0.3s ease;
  animation: fadeIn 0.3s ease-out;
}

.header-with-tip {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.header-with-tip h2 {
  color: var(--text-color);
  position: relative;
  display: inline-block;
}

.header-with-tip h2::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 40px;
  height: 3px;
  background-color: var(--primary-color);
  border-radius: 2px;
}

.new-project-tip {
  font-size: 14px;
  color: var(--el-color-primary);
  cursor: pointer;
  transition: color 0.3s;
}

.new-project-tip:hover {
  color: var(--el-color-primary-dark-2);
}

.form-popover {
  background: #ffffff;
}

:deep(.el-tooltip__popper) {
  background: #ffffff !important;
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: var(--text-color) !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

:deep(.el-select__popper) {
  background-color: #ffffff !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1) !important;
}

:deep(.el-select-dropdown__item) {
  background-color: transparent !important;
}

:deep(.el-select-dropdown__item.hover),
:deep(.el-select-dropdown__item:hover) {
  background-color: rgba(var(--el-color-primary-rgb), 0.1) !important;
}

:deep(.el-select-dropdown__item.selected) {
  background-color: rgba(var(--el-color-primary-rgb), 0.2) !important;
  color: var(--el-color-primary) !important;
  font-weight: 600;
}

:deep(.el-input-number.is-controls-right .el-input-number__decrease),
:deep(.el-input-number.is-controls-right .el-input-number__increase) {
  background-color: transparent;
  border-left: 1px solid rgba(0, 0, 0, 0.1);
}

/* 添加滚动容器 */
.form-scroll-container {
  flex: 1;
  overflow-y: auto;
  padding-right: 10px;
  scrollbar-width: thin;
  scrollbar-color: rgba(144, 147, 153, 0.3) transparent;
  border-bottom: none;
}

/* 定制滚动条样式 */
.form-scroll-container::-webkit-scrollbar {
  width: 6px;
}

.form-scroll-container::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.form-scroll-container::-webkit-scrollbar-thumb {
  background-color: rgba(144, 147, 153, 0.3);
  border-radius: 3px;
}

.form-scroll-container::-webkit-scrollbar-thumb:hover {
  background-color: rgba(144, 147, 153, 0.5);
}

/* 移动设备适配 */
@media (max-width: 768px) {
  .min-field,
  .sec-field,
  .ms-field {
    width: 45px;
  }
  
  .time-input-container {
    gap: 10px;
  }
  
  .card {
    padding: 16px;
    max-height: 500px; /* 移动设备上稍微缩小高度 */
  }
  
  .format-toggle-container {
    padding: 3px 6px;
  }
  
  .time-input-row {
    padding: 3px 6px;
  }
  
  .toggle-label {
    font-size: 12px;
  }
  
  .form-actions {
    padding-top: 16px;
    margin-top: 16px;
  }
  
  .action-buttons {
    gap: 12px;
  }
  
  .action-buttons .submit-button,
  .action-buttons .reset-button {
    min-width: 110px;
    height: 40px;
  }
  
  .button-content {
    gap: 6px;
  }
  
  .button-text {
    font-size: 15px;
  }
  
  .button-content .el-icon {
    font-size: 16px;
  }
}

/* 统一select下拉框的样式与其他输入框一致 */
.custom-select :deep(.el-input__wrapper) {
  background-color: #ffffff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1) inset;
}

.custom-select :deep(.el-input__wrapper:hover) {
  background-color: #ffffff;
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}

.custom-select :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
}

/* 添加中等宽度输入框样式 */
.medium-input {
  width: 250px;
}

/* 添加短下拉框样式 */
.short-select {
  width: 200px;
}

/* 添加短输入框样式 */
.short-input {
  width: 350px;
}

/* 上传按钮样式 */
.action-buttons .submit-button {
  background: linear-gradient(135deg, #4b7bec, #3867d6);
  border: none;
  box-shadow: 0 4px 15px rgba(59, 103, 214, 0.4);
}

.action-buttons .submit-button .button-text {
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.action-buttons .submit-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(59, 103, 214, 0.5);
  background: linear-gradient(135deg, #5d8bf4, #4b7bec);
}

.action-buttons .submit-button:hover .button-text {
  color: #ffffff;
}

/* 重置按钮样式 */
.action-buttons .reset-button {
  background: linear-gradient(135deg, #f5f7fa, #e2e6ed);
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.action-buttons .reset-button .button-text {
  color: #3a3f51;
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.5);
}

.action-buttons .reset-button:hover {
  background: linear-gradient(135deg, #ffffff, #f0f2f7);
  border-color: rgba(0, 0, 0, 0.15);
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
}

.action-buttons .reset-button:hover .button-text {
  color: #202538;
}

.action-buttons .submit-button:active,
.action-buttons .reset-button:active {
  transform: translateY(1px);
}
</style> 