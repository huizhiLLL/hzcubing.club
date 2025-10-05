// 统一 API 模块
const BASE_URL = 'https://backend.hzcubing.club'

function getAuthHeaders() {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...(options.headers || {})
  }
  const resp = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers
  })
  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw new Error(`请求失败: ${resp.status} ${resp.statusText} ${text}`)
  }
  return resp.json()
}

export function getUser(userId) {
  return request(`/user?userId=${encodeURIComponent(userId)}`, { method: 'GET' })
}

export function getRecords(params = {}) {
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  if (params.pageSize) q.set('pageSize', String(params.pageSize))
  const qs = q.toString()
  const suffix = qs ? `&${qs}` : ''
  return request(`/record?pattern=/records${suffix ? '' : ''}${suffix}`, { method: 'GET' })
}

export function getUserRecords(userId, params = {}) {
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  if (params.pageSize) q.set('pageSize', String(params.pageSize))
  const qs = q.toString()
  const suffix = qs ? `&${qs}` : ''
  return request(`/record?pattern=/user-records&userId=${encodeURIComponent(userId)}${suffix}`, { method: 'GET' })
}

export function addRecord(data) {
  return request('/record?pattern=/add-record', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export function updateRecord(data) {
  return request('/record?pattern=/update-record', {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export function deleteRecord(recordId) {
  return request('/record?pattern=/delete-record', {
    method: 'DELETE',
    body: JSON.stringify({ recordId })
  })
}

export function getUsersBestRecord(userId) {
  return request(`/users-best-record?userId=${encodeURIComponent(userId)}`, { method: 'GET' })
}

export function getUsersHistoryRecord(userId, params = {}) {
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  if (params.pageSize) q.set('pageSize', String(params.pageSize))
  if (params.event) q.set('event', String(params.event))
  const qs = q.toString()
  const suffix = qs ? `&${qs}` : ''
  return request(`/users-history-record?userId=${encodeURIComponent(userId)}${suffix}`, { method: 'GET' })
}

// 用户相关API
export function initUser() {
  return request('/init', { method: 'GET' })
}

export function loginUser(credentials) {
  return request('/user-login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  })
}

export function registerUser(userData) {
  return request('/user-register', {
    method: 'POST',
    body: JSON.stringify(userData)
  })
}

export function logoutUser() {
  return request('/user-logout', { method: 'POST' })
}

export function updateUserProfile(profileData) {
  return request('/user-profile', {
    method: 'PUT',
    body: JSON.stringify(profileData)
  })
}

export function updateUserPassword(passwordData) {
  return request('/user-password', {
    method: 'PUT',
    body: JSON.stringify(passwordData)
  })
}

export function uploadAvatar(avatarData) {
  return request('/avater', {
    method: 'POST',
    body: JSON.stringify(avatarData)
  })
}

// 反馈API
export function submitFeedback(feedbackData) {
  return request('/feedback', {
    method: 'POST',
    body: JSON.stringify(feedbackData)
  })
}

// 玩家API
export function getPlayers() {
  return request('/get-players', { method: 'GET' })
}

// Minecraft相关API
export function getMcLocations(action = 'list') {
  return request(`/mc-location?action=${action}`, { method: 'GET' })
}

export function addMcLocation(locationData) {
  return request('/mc-location', {
    method: 'POST',
    body: JSON.stringify(locationData)
  })
}

export function updateMcLocation(locationId, locationData) {
  return request(`/mc-location?id=${locationId}`, {
    method: 'PUT',
    body: JSON.stringify(locationData)
  })
}

export function deleteMcLocation(locationId) {
  return request(`/mc-location?id=${locationId}`, { method: 'DELETE' })
}

// 在线比赛API
export function getOnlineMatchResults(eventData) {
  return request('/online-match', {
    method: 'POST',
    body: JSON.stringify(eventData)
  })
}

export function createOnlineMatch(matchData) {
  return request('/online-match', {
    method: 'POST',
    body: JSON.stringify({ ...matchData, action: 'create' })
  })
}

export function joinOnlineMatch(matchData) {
  return request('/online-match', {
    method: 'POST',
    body: JSON.stringify({ ...matchData, action: 'join' })
  })
}

export function submitOnlineMatchResult(resultData) {
  return request('/online-match', {
    method: 'POST',
    body: JSON.stringify({ ...resultData, action: 'submit' })
  })
}

export default {
  // 用户相关
  getUser,
  initUser,
  loginUser,
  registerUser,
  logoutUser,
  updateUserProfile,
  updateUserPassword,
  uploadAvatar,
  
  // 记录相关
  getRecords,
  getUserRecords,
  addRecord,
  updateRecord,
  deleteRecord,
  getUsersBestRecord,
  getUsersHistoryRecord,
  
  // 其他功能
  submitFeedback,
  getPlayers,
  
  // Minecraft相关
  getMcLocations,
  addMcLocation,
  updateMcLocation,
  deleteMcLocation,
  
  // 在线比赛
  getOnlineMatchResults,
  createOnlineMatch,
  joinOnlineMatch,
  submitOnlineMatchResult
}


