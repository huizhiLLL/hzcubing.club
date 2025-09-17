// 项目配置文件
export const categories = [
  {
    label: '全部类型',
    value: 'all'
  },
  {
    label: '官方项目',
    value: 'official'
  },
  {
    label: '趣味项目',
    value: 'fun'
  },
  {
    label: '整活项目',
    value: 'meme'
  }
]

export const events = {
  all: {
    label: '全部类型',
    options: [
      { label: '全部', value: 'all_all' }
    ]
  },
  official: {
    label: '官方项目',
    options: [
      { label: '全部', value: 'official_all' },
      { label: '三阶速拧', value: '333' },
      { label: '二阶速拧', value: '222' },
      { label: '三阶单手', value: '333oh' },
      { label: '四阶速拧', value: '444' },
      { label: '五阶速拧', value: '555' },
      { label: '六阶速拧', value: '666' },
      { label: '七阶速拧', value: '777' },
      { label: '五魔方', value: 'meg' },
      { label: '三阶盲拧', value: '333bf' },
      { label: '四阶盲拧', value: '444bf' },
      { label: '五阶盲拧', value: '555bf' },
      { label: '最少步', value: '333fm' },
      { label: '金字塔', value: 'py' },
      { label: '斜转', value: 'sk' },
      { label: 'SQ1', value: 'sq1' },
      { label: '魔表', value: 'clock' },
      { label: '多盲', value: '333mbf' },
      { label: 'FTO', value: 'fto' }
    ]
  },
  fun: {
    label: '趣味项目',
    options: [
      { label: '全部', value: 'fun_all' },
      { label: '二阶镜面', value: '二阶镜面' },
      { label: '三阶镜面', value: '三阶镜面' },
      { label: '四阶镜面', value: '四阶镜面' },
      { label: '五阶镜面', value: '五阶镜面' },
      { label: '二阶FTO', value: '二阶FTO' },
      { label: '齿轮', value: '齿轮' },
      { label: '四阶华容道', value: '四阶华容道' },
      { label: '正阶连拧(2-7)', value: '正阶连拧(2-7)' },
      { label: '异形连拧(5个)', value: '异形连拧(5个)' },
      { label: '全项目连拧(12个)', value: '全项目连拧(12个)' },
      { label: '枫叶', value: '枫叶' },
      { label: 'CTO', value: 'CTO' },
      { label: 'REDI', value: 'REDI' },
      { label: '八阶速拧', value: '八阶速拧' },
      { label: '九阶速拧', value: '九阶速拧' },
      { label: '十阶速拧', value: '十阶速拧' },
      { label: '十一阶速拧', value: '十一阶速拧' }
    ]
  },
  meme: {
    label: '整活项目',
    options: [
      { label: '全部', value: 'meme_all' },
      { label: 'FTO单手', value: 'FTO单手' },
      { label: '二阶单手', value: '二阶单手' },
      { label: '四阶单手', value: '四阶单手' },
      { label: '魔表单手', value: '魔表单手' },
      { label: '3-5阶魔方连拧', value: '3-5阶魔方连拧' },
      { label: '250ml牛奶', value: '250ml牛奶' },
      { label: 'FTO BO5', value: 'FTO BO5' },
      { label: '二阶盲拧', value: '二阶盲拧' },
    ]
  }
}

// 项目名称映射
export const eventNames = {
  '333': '三阶',
  '222': '二阶',
  '333oh': '三单',
  '444': '四阶',
  '555': '五阶',
  '666': '六阶',
  '777': '七阶',
  'fto': 'FTO',
  'sq1': 'SQ1',
  'meg': '五魔',
  'sk': '斜转',
  'py': '金字塔',
  'clock': '魔表',
  '333bf': '三盲',
  '444bf': '四盲',
  '555bf': '五盲',
  '333fm': '最少步',
  '333mbf': '多盲'
}

// 获取项目名称
export const getEventName = (eventCode) => {
  return eventNames[eventCode] || eventCode
}

// 获取项目类型
export const getEventType = (eventCode) => {
  if (events.official.options.some(opt => opt.value === eventCode)) {
    return 'official'
  }
  if (events.fun.options.some(opt => opt.value === eventCode)) {
    return 'fun'
  }
  if (events.meme.options.some(opt => opt.value === eventCode)) {
    return 'meme'
  }
  return 'unknown'
}

// 获取所有项目（不包括"全部"选项）
export const getAllEvents = () => {
  const officialEvents = events.official.options.slice(1) // 移除"全部"选项
  const funEvents = events.fun.options.slice(1)
  const memeEvents = events.meme.options.slice(1)
  
  return [
    {
      label: '官方项目',
      options: officialEvents
    },
    {
      label: '趣味项目',
      options: funEvents
    },
    {
      label: '整活项目',
      options: memeEvents
    }
  ]
}

// 根据类别获取当前项目列表
export const getCurrentEvents = (selectedCategory) => {
  if (selectedCategory === 'all') {
    return [events.all]
  }
  return selectedCategory ? [events[selectedCategory]] : []
}

// 获取所有项目代码（不包括"全部"选项）
export const getAllEventCodes = () => {
  const codes = []
  Object.values(events).forEach(category => {
    category.options.forEach(option => {
      if (!option.value.endsWith('_all')) {
        codes.push(option.value)
      }
    })
  })
  return codes
} 