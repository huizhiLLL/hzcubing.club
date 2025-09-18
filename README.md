# 会枝Cubing

一个基于 Vue 3 为群友服务的魔方网站，提供成绩记录、排行榜、选手信息等功能。

## 功能特性

- 📊 成绩记录与管理
- 🏆 实时排行榜
- 👤 选手个人资料
- 🎮 Minecraft 服务器信息
- 📱 响应式设计，支持多设备访问

## 技术栈

- [Vue 3](https://v3.vuejs.org/) - 渐进式 JavaScript 框架
- [Vite](https://vitejs.dev/) - 快速的构建工具
- [Element Plus](https://element-plus.org/) - Vue 3 UI 组件库
- [Pinia](https://pinia.vuejs.org/) - Vue 状态管理
- [Vue Router](https://router.vuejs.org/) - Vue 应用路由
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [GSAP](https://greensock.com/gsap/) - 专业的动画库

## 环境要求

- Node.js >= 18
- npm / yarn / pnpm

## 安装与运行

### 安装依赖

```bash
npm install
```

### 开发环境运行

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 本地预览生产版本

```bash
npm run preview
```

## 项目结构

```
.
├── public/                 # 静态资源目录
├── src/
│   ├── api/                # API 接口封装
│   ├── assets/             # 样式和静态资源
│   ├── components/         # 可复用组件
│   ├── config/             # 配置文件
│   ├── router/             # 路由配置
│   ├── services/           # 业务服务逻辑
│   ├── stores/             # 状态管理
│   ├── views/              # 页面级组件
│   ├── App.vue             # 根组件
│   └── main.js             # 应用入口
├── .gitignore              # Git 忽略文件配置
├── index.html              # HTML 模板
├── package.json            # 项目配置和依赖
├── tailwind.config.js      # Tailwind CSS 配置
└── vite.config.js          # Vite 配置
```

## 主要页面

- 首页 - 展示平台功能和导航入口
- 记录 - 查看和管理个人成绩记录
- 排行榜 - 查看各项目排名情况
- 选手 - 浏览所有选手信息
- MC - Minecraft 相关功能
- 个人中心 - 查看和编辑个人资料

## 部署

项目使用 Vite 构建，生成的 [dist/](file:///home/devbox/project/dist/) 目录可部署到任何静态文件服务器上。

推荐部署平台：
- Sealos Cloud

## 开发规范

1. 使用 Vue 3 组合式 API
2. 通过 Pinia 管理全局状态
3. 使用 Element Plus 组件库
4. 遵循 Tailwind CSS 样式规范
5. 所有新功能需要添加相应注释

