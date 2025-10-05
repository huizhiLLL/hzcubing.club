import './assets/main.css'
import './assets/glassmorphism.css'
import './assets/animations.css'
import './assets/fonts.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import App from './App.vue'
import router from './router'

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus, {
  locale: zhCn,
})


// 启用访问统计
import('./utils/visitTracker.js').then(({ visitTracker }) => {
  // 等待应用挂载后启动访问统计
  app.mount('#app')
  
  // 延迟启动访问统计，确保router已就绪
  setTimeout(() => {
    visitTracker.startAutoTracking(router)
  }, 1000)
}).catch(() => {
  // 如果访问统计加载失败，仍然正常挂载应用
  app.mount('#app')
}) 