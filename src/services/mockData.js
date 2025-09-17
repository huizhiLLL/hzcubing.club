// 模拟数据服务 - 用于前端开发和测试
// 在实际部署时，这些数据应该从后端API获取

// 模拟API延迟
const mockDelay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms))

// 模拟API响应格式
const mockResponse = (data, success = true, message = '') => ({
  code: success ? 200 : 400,
  message: message || (success ? 'success' : 'error'),
  data: data
})

// 检查是否使用模拟数据
export const useMockData = () => {
  // 可以通过环境变量或配置来控制是否使用模拟数据
  return import.meta.env.DEV || import.meta.env.VITE_USE_MOCK === 'true'
} 