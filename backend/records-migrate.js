import cloud from '@lafjs/cloud'

/**
 * 全量批处理：规范 records 文档结构（不存排名，只存 seconds 缓存）
 * - 保留: singleSeconds, averageSeconds
 * - 删除: single, average, singleRank, averageRank
 * - 补齐: 顶层 nickname, userId（若可从嵌套提取）
 * - 直接写库（无 dryRun），返回变更摘要
 */
export default async function (ctx) {
  const db = cloud.database()
  const _ = db.command

  // 批量分页拉取，避免一次性读爆
  const batchSize = 500
  let skip = 0
  let scanned = 0
  let updated = 0

  const summary = {
    scanned: 0,
    updated: 0,
    removedFields: {
      single: 0,
      average: 0,
      singleRank: 0,
      averageRank: 0
    },
    setFields: {
      singleSeconds: 0,
      averageSeconds: 0,
      nickname: 0,
      userId: 0
    },
    errors: []
  }

  // 工具: 仅字符串/数字且允许空串，否则返回 null（用于原始time校验）
  const normalizeTimeRaw = (v) => {
    if (v === '' || typeof v === 'string') return v
    if (typeof v === 'number') return v
    return null
  }

  // 工具: 将时间字符串/数字转秒（鲁棒，空串/无效->null）
  const convertToSeconds = (time) => {
    if (time === null || time === undefined) return null
    if (typeof time === 'number') return Number.isNaN(time) ? null : time

    const raw = time.toString().trim()
    if (!raw) return null
    const s = raw.toUpperCase()
    if (s === 'DNF' || s === 'DNS') return null

    const parts = s.split(':')
    let seconds = null
    try {
      if (parts.length === 3) {
        const h = parseInt(parts[0], 10)
        const m = parseInt(parts[1], 10)
        const sec = parseFloat(parts[2])
        seconds = h * 3600 + m * 60 + sec
      } else if (parts.length === 2) {
        const m = parseInt(parts[0], 10)
        const sec = parseFloat(parts[1])
        seconds = m * 60 + sec
      } else {
        seconds = parseFloat(s)
      }
    } catch {
      seconds = null
    }
    return (seconds === null || Number.isNaN(seconds)) ? null : seconds
  }

  // 尝试从记录中提取顶层 nickname、userId
  const extractNickname = (r) => {
    if (typeof r?.nickname === 'string' && r.nickname.trim()) return r.nickname.trim()
    if (typeof r?.user?.nickname === 'string' && r.user.nickname.trim()) return r.user.nickname.trim()
    if (typeof r?.user?.name === 'string' && r.user.name.trim()) return r.user.name.trim()
    return null
  }
  const extractUserId = (r) => {
    if (typeof r?.userId === 'string' && r.userId.trim()) return r.userId.trim()
    if (typeof r?.userId === 'number') return String(r.userId)
    if (typeof r?.user?._id === 'string' && r.user._id.trim()) return r.user._id.trim()
    if (typeof r?.user?.id === 'string' && r.user.id.trim()) return r.user.id.trim()
    return null
  }

  // 循环分页处理
  while (true) {
    const page = await db.collection('records')
      .skip(skip)
      .limit(batchSize)
      .get()

    const docs = page.data || []
    if (docs.length === 0) break
    skip += docs.length
    scanned += docs.length
    summary.scanned = scanned

    // 针对每条记录计算更新
    for (const r of docs) {
      try {
        // 允许空串/字符串/数字，其他类型置 null（虽然最终要删除 single/average，但先规范化、再删除）
        const rawSingleTime = normalizeTimeRaw(r?.single?.time)
        const rawAverageTime = normalizeTimeRaw(r?.average?.time)

        const singleSeconds = convertToSeconds(rawSingleTime)
        const averageSeconds = convertToSeconds(rawAverageTime)

        const nickname = extractNickname(r)
        const userId = extractUserId(r)

        // 组装更新数据
        const toSet = {}
        const toUnset = {}

        // set 秒数字段（只有变化时才设置，减少写放大）
        if (r.singleSeconds !== singleSeconds) {
          toSet.singleSeconds = singleSeconds
          summary.setFields.singleSeconds++
        }
        if (r.averageSeconds !== averageSeconds) {
          toSet.averageSeconds = averageSeconds
          summary.setFields.averageSeconds++
        }

        // 顶层 nickname / userId
        if (nickname && r.nickname !== nickname) {
          toSet.nickname = nickname
          summary.setFields.nickname++
        }
        if (userId && r.userId !== userId) {
          toSet.userId = userId
          summary.setFields.userId++
        }

        // 删除字段：single / average / singleRank / averageRank
        if (r.hasOwnProperty('single')) {
          toUnset.single = _.remove()
          summary.removedFields.single++
        }
        if (r.hasOwnProperty('average')) {
          toUnset.average = _.remove()
          summary.removedFields.average++
        }
        if (r.hasOwnProperty('singleRank')) {
          toUnset.singleRank = _.remove()
          summary.removedFields.singleRank++
        }
        if (r.hasOwnProperty('averageRank')) {
          toUnset.averageRank = _.remove()
          summary.removedFields.averageRank++
        }

        // 若无任何改动则跳过
        if (Object.keys(toSet).length === 0 && Object.keys(toUnset).length === 0) continue

        await db.collection('records').doc(r._id).update({
          ...(Object.keys(toSet).length ? toSet : {}),
          ...(Object.keys(toUnset).length ? toUnset : {})
        })
        updated++
        summary.updated = updated
      } catch (e) {
        summary.errors.push({ id: r._id, message: e?.message || String(e) })
      }
    }

    // 若最后一页不足 batchSize，终止
    if (docs.length < batchSize) break
  }

  return {
    code: 200,
    message: '批处理完成',
    data: summary
  }
}