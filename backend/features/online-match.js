import cloud from '@lafjs/cloud'

export default async function (ctx) {
    const { event, action } = ctx.body

    // 验证请求参数
    if (!event || !action) {
        return {
            success: false,
            message: '缺少必要参数'
        }
    }

    // 验证项目类型
    const validEvents = ['333', '222', '333oh', '444']
    if (!validEvents.includes(event)) {
        return {
            success: false,
            message: '无效的项目类型'
        }
    }

    try {
        if (action === 'getResults') {
            // 获取比赛结果
            return await getCompetitionResults(event)
        } else if (action === 'addScore') {
            // 添加选手成绩（需要管理员权限）
            return await addPlayerScore(ctx.body)
        } else if (action === 'updateScore') {
            // 更新选手成绩（需要管理员权限）
            return await updatePlayerScore(ctx.body)
        } else if (action === 'deleteScore') {
            // 删除选手成绩（需要管理员权限）
            return await deletePlayerScore(ctx.body)
        } else {
            return {
                success: false,
                message: '无效的操作类型'
            }
        }
    } catch (error) {
        console.error('处理请求失败:', error)
        return {
            success: false,
            message: '服务器内部错误'
        }
    }
}

// 管理员配置（直接在代码中配置）
const ADMIN_EMAILS = [
    '3679063384@qq.com',
    '3169164181@qq.com'
    // 在这里配置管理员邮箱，只有这些邮箱的用户才能操作成绩
]

// 验证管理员权限
async function verifyAdminPermission(email) {
    if (!email) {
        return false
    }

    return ADMIN_EMAILS.includes(email)
}

// 添加选手成绩
async function addPlayerScore(data) {
    const { event, playerName, scores, email } = data

    // 验证管理员权限
    if (!await verifyAdminPermission(email)) {
        return {
            success: false,
            message: '需要管理员权限'
        }
    }

    // 验证数据
    if (!playerName || !scores || !Array.isArray(scores) || scores.length !== 5) {
        return {
            success: false,
            message: '选手姓名和5次成绩不能为空'
        }
    }

    try {
        const db = cloud.database()

        // 检查是否已存在该选手的成绩
        const existingScore = await db.collection('competition_scores')
            .where({
                event: event,
                playerName: playerName,
                status: 'active'
            })
            .get()

        if (existingScore.data && existingScore.data.length > 0) {
            return {
                success: false,
                message: '该选手已存在成绩记录'
            }
        }

        // 添加新成绩记录
        const result = await db.collection('competition_scores').add({
            event: event,
            playerName: playerName,
            scores: scores,
            status: 'active',
            createTime: new Date(),
            updateTime: new Date(),
            createdBy: email // 记录创建者
        })

        return {
            success: true,
            message: '成绩录入成功',
            data: result
        }

    } catch (error) {
        console.error('添加成绩失败:', error)
        return {
            success: false,
            message: '数据库操作失败'
        }
    }
}

// 更新选手成绩
async function updatePlayerScore(data) {
    const { event, playerId, playerName, scores, email } = data

    // 验证管理员权限
    if (!await verifyAdminPermission(email)) {
        return {
            success: false,
            message: '需要管理员权限'
        }
    }

    // 验证数据
    if (!playerId || !playerName || !scores || !Array.isArray(scores) || scores.length !== 5) {
        return {
            success: false,
            message: '选手ID、姓名和5次成绩不能为空'
        }
    }

    try {
        const db = cloud.database()

        // 检查选手是否存在
        const existingScore = await db.collection('competition_scores')
            .doc(playerId)
            .get()

        if (!existingScore.data) {
            return {
                success: false,
                message: '选手成绩记录不存在'
            }
        }

        // 检查新姓名是否与其他选手冲突（排除自己）
        const nameConflict = await db.collection('competition_scores')
            .where({
                event: event,
                playerName: playerName,
                status: 'active',
                _id: { $ne: playerId }
            })
            .get()

        if (nameConflict.data && nameConflict.data.length > 0) {
            return {
                success: false,
                message: '该选手姓名已存在'
            }
        }

        // 更新成绩记录
        const result = await db.collection('competition_scores')
            .doc(playerId)
            .update({
                playerName: playerName,
                scores: scores,
                updateTime: new Date(),
                updatedBy: email // 记录更新者
            })

        return {
            success: true,
            message: '成绩更新成功',
            data: result
        }

    } catch (error) {
        console.error('更新成绩失败:', error)
        return {
            success: false,
            message: '数据库操作失败'
        }
    }
}

// 删除选手成绩
async function deletePlayerScore(data) {
    const { event, playerId, email } = data

    // 验证管理员权限
    if (!await verifyAdminPermission(email)) {
        return {
            success: false,
            message: '需要管理员权限'
        }
    }

    // 验证数据
    if (!playerId) {
        return {
            success: false,
            message: '选手ID不能为空'
        }
    }

    try {
        const db = cloud.database()

        // 检查选手是否存在
        const existingScore = await db.collection('competition_scores')
            .doc(playerId)
            .get()

        if (!existingScore.data) {
            return {
                success: false,
                message: '选手成绩记录不存在'
            }
        }

        // 软删除：将状态改为inactive
        const result = await db.collection('competition_scores')
            .doc(playerId)
            .update({
                status: 'inactive',
                updateTime: new Date(),
                deletedBy: email // 记录删除者
            })

        return {
            success: true,
            message: '成绩删除成功',
            data: result
        }

    } catch (error) {
        console.error('删除成绩失败:', error)
        return {
            success: false,
            message: '数据库操作失败'
        }
    }
}

// 获取比赛结果
async function getCompetitionResults(event) {
    try {
        // 从数据库获取比赛结果
        const db = cloud.database()

        // 查询指定项目的原始成绩数据
        const rawResults = await db.collection('competition_scores')
            .where({
                event: event,
                status: 'active' // 只查询活跃的比赛
            })
            .get()

        if (!rawResults.data || rawResults.data.length === 0) {
            return {
                success: true,
                results: [],
                message: '暂无比赛数据'
            }
        }

        // 处理数据：计算单次最佳、平均成绩、排名
        const processedResults = rawResults.data.map((result) => {
            const scores = result.scores || []

            // 过滤有效成绩（非DNF）
            const validScores = scores.filter((score) => score !== 'DNF' && score !== 'DNS')

            if (validScores.length === 0) {
                return null // 跳过无效成绩
            }

            // 计算单次最佳（最快成绩）
            const single = Math.min(...validScores.map(Number))

            // 计算平均成绩（去掉最快和最慢，取中间3个成绩的平均值）
            let average = 0
            if (validScores.length >= 3) {
                const sortedScores = validScores.map(Number).sort((a, b) => a - b)
                const middleScores = sortedScores.slice(1, -1) // 去掉最快和最慢
                average = middleScores.reduce((sum, score) => sum + score, 0) / middleScores.length
            } else {
                average = validScores.reduce((sum, score) => sum + Number(score), 0) / validScores.length
            }

            // 格式化成绩显示
            const formattedScores = scores.map((score) => {
                if (score === 'DNF' || score === 'DNS') {
                    return { value: score, isDropped: false }
                }

                const numScore = Number(score)
                const isDropped = validScores.length >= 3 &&
                    (numScore === Math.min(...validScores.map(Number)) ||
                        numScore === Math.max(...validScores.map(Number)))

                return {
                    value: numScore.toFixed(2),
                    isDropped: isDropped
                }
            })

            return {
                _id: result._id, // 添加ID用于编辑和删除
                playerName: result.playerName,
                single: single.toFixed(2),
                average: average.toFixed(2),
                scores: formattedScores,
                rawScores: scores // 保留原始成绩用于编辑
            }
        }).filter(Boolean) // 过滤掉null值

        // 按平均成绩排序并添加排名
        const sortedResults = processedResults.sort((a, b) => Number(a.average) - Number(b.average))

        const finalResults = sortedResults.map((result, index) => ({
            rank: index + 1,
            ...result
        }))

        return {
            success: true,
            results: finalResults,
            message: '获取成功'
        }

    } catch (error) {
        console.error('查询数据库失败:', error)
        return {
            success: false,
            message: '数据库查询失败'
        }
    }
}

// 数据库集合结构说明：
// collection: competition_scores
// 文档结构：
// {
//   _id: "唯一ID",
//   event: "项目类型 (333/222/333oh/444)",
//   playerName: "玩家姓名",
//   scores: ["成绩1", "成绩2", "成绩3", "成绩4", "成绩5"],
//   status: "状态 (active/inactive)",
//   createTime: "创建时间",
//   updateTime: "更新时间",
//   createdBy: "创建者邮箱",
//   updatedBy: "更新者邮箱",
//   deletedBy: "删除者邮箱"
// }
//
// 成绩格式说明：
// - 正常成绩：数字字符串，如 "8.60", "12.34"
// - DNF：未完成，字符串 "DNF"
// - DNS：未开始，字符串 "DNS"
//
// 计算规则：
// 1. 单次最佳：所有有效成绩中的最小值
// 2. 平均成绩：去掉最快和最慢成绩，取中间3个成绩的平均值
// 3. 排名：按平均成绩升序排列
// 4. 被删除成绩：最快和最慢成绩用括号包围显示
//
// 管理员配置：
// 在 ADMIN_EMAILS 数组中配置管理员邮箱，只有这些邮箱的用户才能操作成绩
//
// API使用说明：
// 1. 获取成绩：POST /online-match { "event": "333", "action": "getResults" }
// 2. 录入成绩：POST /online-match { "event": "333", "action": "addScore", "playerName": "MIBT", "scores": ["8.60", "9.37", "9.54", "10.22", "10.48"], "email": "admin@example.com" }
// 3. 更新成绩：POST /online-match { "event": "333", "action": "updateScore", "playerId": "选手ID", "playerName": "MIBT", "scores": ["8.60", "9.37", "9.54", "10.22", "10.48"], "email": "admin@example.com" }
// 4. 删除成绩：POST /online-match { "event": "333", "action": "deleteScore", "playerId": "选手ID", "email": "admin@example.com" }