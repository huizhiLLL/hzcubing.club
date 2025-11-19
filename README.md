# 会枝Cubing

魔方群网站 [hzcubing.club](https://hzcubing.club)

## 特性

- 🎯 成绩管理 - 官方/趣味/整活项目，动态配置
- 🏆 排行榜 - 实时排名，个人统计
- 👥 用户系统 - 四级权限，30天免登录
- 🛡️ 管理后台 - 双层管理，数据统计
- 📱 响应式 - 桌面端/移动端适配

## 技术栈

- **前端**: Vue 3 + Element Plus + Pinia
- **后端**: Sealos 云函数 + JWT
- **数据库**: MongoDB
- **部署**: GitHub Pages

## 功能

### 权限系统
- 四级权限控制
- JWT认证，30天免登录
- 路由和组件级权限检查

### 成绩管理
- 多项目支持，动态整活项目
- 个人最佳和历史记录
- 实时排行榜

### 管理后台
- 网站数据统计
- 用户和权限管理
- 动态内容管理
- 维护模式控制

## 快速开始

```bash
# 安装依赖
npm install

# 开发环境
npm run dev

# 构建部署
npm run build
npm run deploy
```

## 架构

- **数据流**: Vue组件 → Pinia → API → 云函数 → MongoDB
- **权限**: 前后端双重验证，JWT认证
- **性能**: 批量查询，分页加载，API缓存

---

© 2025 会枝Cubing. All rights reserved.
更新时间：2025-10-06