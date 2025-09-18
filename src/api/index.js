// 统一 API 模块
const BASE_URL = 'https://w3mavh11ex.bja.sealos.run'

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

export default {
  getUser,
  getRecords,
  getUserRecords,
  addRecord,
  updateRecord,
  deleteRecord,
  getUsersBestRecord,
  getUsersHistoryRecord
}


