<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// 控制粒子数量
const PARTICLE_COUNT = 7
// 粒子颜色
const PARTICLE_COLORS = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C']
// 粒子大小范围
const PARTICLE_SIZE = { min: 3, max: 6 }
// 粒子存在时间(毫秒)
const PARTICLE_LIFETIME = 800
// 粒子移动速度范围
const PARTICLE_SPEED = { min: 1, max: 3 }

// 存储所有活跃的粒子
const particles = ref([])

// 创建一个粒子
const createParticle = (x, y) => {
  // 随机选择颜色
  const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)]
  // 随机大小
  const size = Math.random() * (PARTICLE_SIZE.max - PARTICLE_SIZE.min) + PARTICLE_SIZE.min
  // 随机角度
  const angle = Math.random() * Math.PI * 2
  // 随机速度
  const speed = Math.random() * (PARTICLE_SPEED.max - PARTICLE_SPEED.min) + PARTICLE_SPEED.min
  
  // 创建粒子对象
  return {
    id: Date.now() + Math.random(),
    x,
    y,
    color,
    size,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    alpha: 1,
    lifetime: PARTICLE_LIFETIME,
    createdAt: Date.now()
  }
}

// 创建粒子爆炸效果
const createParticleExplosion = (x, y) => {
  const newParticles = []
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    newParticles.push(createParticle(x, y))
  }
  particles.value = [...particles.value, ...newParticles]
}

// 更新粒子状态
const updateParticles = () => {
  const now = Date.now()
  particles.value = particles.value
    .map(p => {
      const elapsed = now - p.createdAt
      const remaining = Math.max(0, p.lifetime - elapsed)
      const progress = 1 - remaining / p.lifetime
      
      // 更新位置
      const x = p.x + p.vx
      const y = p.y + p.vy
      
      // 更新透明度
      const alpha = 1 - progress
      
      return {
        ...p,
        x,
        y,
        alpha,
        // 如果粒子生命周期结束，标记为删除
        remove: remaining <= 0
      }
    })
    .filter(p => !p.remove)
}

// 点击事件处理
const handleClick = (event) => {
  // 检查点击的是否是可交互元素
  const target = event.target
  const isInteractive = 
    target.tagName === 'BUTTON' || 
    target.tagName === 'A' || 
    target.closest('button') || 
    target.closest('a') ||
    target.classList.contains('el-button') ||
    target.closest('.el-button') ||
    target.getAttribute('role') === 'button' ||
    target.classList.contains('social-link') ||
    target.closest('.social-link')
  
  if (isInteractive) {
    // 获取点击位置
    const rect = target.getBoundingClientRect()
    const x = event.clientX
    const y = event.clientY
    
    // 创建粒子爆炸
    createParticleExplosion(x, y)
  }
}

// 动画循环
let animationFrame = null
const animate = () => {
  updateParticles()
  animationFrame = requestAnimationFrame(animate)
}

// 组件挂载时
onMounted(() => {
  // 添加点击事件监听
  document.addEventListener('click', handleClick)
  // 启动动画循环
  animationFrame = requestAnimationFrame(animate)
})

// 组件卸载时
onUnmounted(() => {
  // 移除事件监听
  document.removeEventListener('click', handleClick)
  // 停止动画循环
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
  }
})
</script>

<template>
  <div class="click-effect-container">
    <div 
      v-for="particle in particles" 
      :key="particle.id"
      class="particle"
      :style="{
        left: `${particle.x}px`,
        top: `${particle.y}px`,
        width: `${particle.size}px`,
        height: `${particle.size}px`,
        backgroundColor: particle.color,
        opacity: particle.alpha
      }"
    ></div>
  </div>
</template>

<style scoped>
.click-effect-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
  overflow: hidden;
}

.particle {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  transform: translate(-50%, -50%);
}
</style> 