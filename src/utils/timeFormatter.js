/**
 * 标准化浮点数，修正JavaScript浮点数精度问题
 * 将浮点数标准化为精确的两位小数（例如：8.949999999999999 -> 8.95）
 */
export function normalizeFloat(value) {
  if (value === null || value === undefined) return null
  if (typeof value !== 'number' || Number.isNaN(value)) return value
  // 先四舍五入到4位小数消除浮点数误差，再保留为精确的两位小数
  // 使用 parseFloat 和 toFixed 组合来确保精确度
  return parseFloat((Math.round(value * 10000) / 10000).toFixed(2))
}

/**
 * 格式化时间显示（向下取整到两位小数）
 * 用于显示成绩时间，例如：8.95 -> "8.95", 65.5 -> "1:05.50"
 * 
 * @param {number|null|undefined} seconds - 时间（秒）
 * @returns {string} 格式化后的时间字符串，无效值返回 "-"
 */
export function formatTime(seconds) {
  if (seconds === null || seconds === undefined) return '-'
  
  // 先标准化数据，修正浮点数精度问题
  const normalized = normalizeFloat(seconds)
  if (normalized === null) return '-'
  
  // 向下取整到两位小数：先乘以100并标准化，再向下取整，再除以100
  // 这样可以避免 8.95 * 100 = 894.9999999999999 的问题
  const multiplied = normalizeFloat(normalized * 100)
  const truncated = Math.floor(multiplied) / 100
  
  if (truncated < 60) {
    return truncated.toFixed(2)
  }
  
  const minutes = Math.floor(truncated / 60)
  const remainingSeconds = (truncated % 60).toFixed(2).padStart(5, '0')
  
  return `${minutes}:${remainingSeconds}`
}

