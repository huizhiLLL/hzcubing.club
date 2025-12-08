<template>
  <div class="home-container">
    <div class="hero-section-wrapper">
      <section 
        class="hero-section glass-section"
      >
        <div class="hero-inner">
          <h1 class="hero-title text-fade-in">
            <span class="welcome-text"></span>
            <span class="title-inline">
              <span class="title-part chinese">会枝</span>
              <span class="title-part cubing">Cubing</span>
            </span>
          </h1>
          
          <!-- 将特性卡片移入渐变卡片 -->
          <div class="hero-features">
            <el-row :gutter="16">
              <el-col v-for="(feature, index) in features" 
                      :key="feature.title" 
                      :xs="24" 
                      :sm="8" 
                      :md="8" 
                      :lg="8">
                <div class="feature-card-wrapper">
                  <div 
                    ref="featureCardRefs"
                    class="feature-card card-hover" 
                    :class="{ 'clickable': feature.link }"
                    @mousemove="(e) => handleFeatureMouseMove(e, index)"
                    @mouseenter="() => handleFeatureMouseEnter(index)"
                    @mouseleave="() => handleFeatureMouseLeave(index)"
                    @click="feature.link && $router.push(feature.link)"
                    :style="{
                      transform: `perspective(1000px) rotateX(${featureRotateX[index] || 0}deg) rotateY(${featureRotateY[index] || 0}deg) scale(${featureScale[index] || 1})`,
                      transition: featureIsHovering[index] ? 'none' : 'all 0.5s ease'
                    }"
                  >
                    <template v-if="feature.localIcon">
                      <!-- 完全移除logo容器 -->
                      <Icon icon="mdi:robot" class="feature-icon icon-bounce" />
                    </template>
                    <Icon v-else :icon="feature.icon" class="feature-icon icon-bounce" />
                    <h3 class="feature-title">{{ feature.title }}</h3>
                    <p class="feature-description">{{ feature.description }}</p>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </div>
      </section>
    </div>

  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { ref, reactive } from 'vue'

// 移除主卡片的倾斜效果相关代码
const featureCardRefs = ref([])

// 倾斜卡片效果相关 - 特性卡片
const featureRotateX = reactive({})
const featureRotateY = reactive({})
const featureScale = reactive({})
const featureIsHovering = reactive({})
const featureRotateAmplitude = 10 // 特性卡片旋转幅度

// 处理鼠标移动 - 特性卡片
const handleFeatureMouseMove = (e, index) => {
  const card = e.currentTarget
  if (!card) return
  
  const rect = card.getBoundingClientRect()
  const offsetX = e.clientX - rect.left - rect.width / 2
  const offsetY = e.clientY - rect.top - rect.height / 2
  
  featureRotateX[index] = (offsetY / (rect.height / 2)) * -featureRotateAmplitude
  featureRotateY[index] = (offsetX / (rect.width / 2)) * featureRotateAmplitude
}

// 鼠标进入 - 特性卡片
const handleFeatureMouseEnter = (index) => {
  featureIsHovering[index] = true
  featureScale[index] = 1.05
}

// 鼠标离开 - 特性卡片
const handleFeatureMouseLeave = (index) => {
  featureIsHovering[index] = false
  featureRotateX[index] = 0
  featureRotateY[index] = 0
  featureScale[index] = 1
}

const features = [
  {
    icon: 'material-symbols:timer-outline',
    title: '上传成绩',
    description: '支持所有官方和一些趣味（整活） 项目的成绩上传',
    link: '/submit-record'
  },
  
  {
    icon: 'material-symbols:leaderboard-outline',
    title: '记录与排行',
    description: '个人记录，网站最佳记录（GR），以及各项目的排行榜。',
    link: '/records'
  },
  {
    icon: null,
    title: '群聊麦麦bot',
    description: '功能丰富并且网站联动的Bot！',
    link: '#',
    localIcon: true
  }
]

</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-3xl);
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-lg);
}

.hero-section-wrapper {
  display: flex;
  justify-content: center;
}

.hero-section {
  text-align: center;
  padding: 80px 32px;
  background: linear-gradient(135deg, 
    rgba(64, 158, 255, 0.8) 0%, 
    rgba(103, 194, 58, 0.8) 100%);
  border-radius: var(--radius-2xl);
  color: #fff;
  position: relative;
  overflow: hidden;
  width: 100%;
  box-shadow: var(--shadow-2xl);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.hero-inner {
  position: relative;
  width: 100%;
  height: 100%;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.15;
  z-index: -1;
}

.hero-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-bottom: 24px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.welcome-text {
  font-family: 'CustomChinese', sans-serif;
  font-size: 36px;
  margin-bottom: 10px;
  display: block;
}

.title-inline {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 15px;
}

.title-part {
  display: inline-block;
  line-height: 1.2;
}

.title-part.chinese {
  font-family: 'CustomChinese', sans-serif;
  font-size: 80px;
}

.title-part.cubing {
  font-family: 'CustomEnglish', sans-serif;
  color: #ffffff;
  font-style: normal;
  letter-spacing: 3px;
  font-size: 60px;
}

/* 确保ShinyText组件继承字体样式 */
:deep(.shiny-text) {
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  color: inherit;
  font-style: inherit;
  letter-spacing: inherit;
}

.hero-features {
  margin-top: 32px;
}

.feature-card-wrapper {
  perspective: 1000px;
  height: 100%;
  margin-bottom: 16px;
}

.feature-card {
  height: 100%;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: all var(--duration-normal) var(--ease-in-out);
  transform-style: preserve-3d;
  will-change: transform;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  border-radius: var(--radius-xl);
  border: 1px solid rgba(255, 255, 255, 0.3);
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
}

.feature-card.clickable {
  cursor: pointer;
}

.feature-card.clickable:hover {
  background: rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

.feature-icon {
  width: 40px;
  height: 40px;
  color: #ffffff;
  margin-bottom: 16px;
  transform: translateZ(20px);
  transition: all var(--duration-normal) var(--ease-in-out);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.feature-card:hover .feature-icon {
  transform: translateZ(20px) scale(1.1);
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}

.feature-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #ffffff;
  transform: translateZ(15px);
  transition: all var(--duration-normal) var(--ease-in-out);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.feature-description {
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.5;
  transform: translateZ(10px);
  font-size: 15px;
  transition: all var(--duration-normal) var(--ease-in-out);
}

.feature-card:hover .feature-title {
  transform: translateZ(15px) scale(1.05);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.feature-card:hover .feature-description {
  transform: translateZ(10px) scale(1.02);
  color: rgba(255, 255, 255, 1);
}

@media (max-width: 768px) {
  .home-container {
    padding: 0 var(--space-md);
    gap: var(--space-2xl);
  }
  
  .hero-section {
    padding: var(--space-2xl) var(--space-lg);
    border-radius: var(--radius-xl);
  }
  
  .welcome-text {
    font-size: 28px;
  }
  
  .title-part.chinese {
    font-size: 56px;
  }
  
  .title-part.cubing {
    font-size: 42px;
  }
  
  .title-inline {
    gap: var(--space-sm);
  }
  
  .hero-features {
    margin-top: var(--space-lg);
  }
  
  .feature-card {
    padding: var(--space-lg) var(--space-md);
  }
  
  .feature-icon {
    width: 36px;
    height: 36px;
    margin-bottom: var(--space-md);
  }
  
  .feature-title {
    font-size: 18px;
    margin-bottom: var(--space-sm);
  }
  
  .feature-description {
    font-size: 14px;
    line-height: 1.4;
  }
  
}

@media (max-width: 480px) {
  .home-container {
    padding: 0 var(--space-sm);
    gap: var(--space-xl);
  }
  
  .hero-section {
    padding: var(--space-xl) var(--space-md);
  }
  
  .welcome-text {
    font-size: 24px;
  }
  
  .title-part.chinese {
    font-size: 48px;
  }
  
  .title-part.cubing {
    font-size: 36px;
  }
  
  .title-inline {
    gap: var(--space-xs);
    flex-direction: column;
  }
  
  .feature-card {
    padding: var(--space-md);
  }
  
  .feature-icon {
    width: 32px;
    height: 32px;
  }
  
  .feature-title {
    font-size: 16px;
  }
  
  .feature-description {
    font-size: 13px;
  }
  
  .hero-features .el-row {
    margin-left: 0 !important;
    margin-right: 0 !important;
  }
}

</style> 