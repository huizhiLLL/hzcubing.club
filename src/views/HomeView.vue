<template>
  <div class="home-wrapper">
    <!-- 动态背景装饰 -->
    <div class="ambient-orb orb-1"></div>
    <div class="ambient-orb orb-2"></div>
    
    <div class="content-container">
      <!-- 头部区域 -->
      <header class="home-header">
        <div class="header-content">
          <h1 class="brand-title">
            <span class="chinese-part">会枝</span>
            <span class="english-part">Cubing</span>
          </h1>
          
        </div>
        
        <!-- 装饰性 3D 元素 -->
        <div class="header-visual">
          <div class="floating-cube">
            <div class="side front"></div>
            <div class="side back"></div>
            <div class="side right"></div>
            <div class="side left"></div>
            <div class="side top"></div>
            <div class="side bottom"></div>
          </div>
        </div>
      </header>

      <!-- Bento Grid 布局 -->
      <div class="bento-grid">
        
        <!-- 1. 核心功能：记录与排行 (大卡片) -->
        <div 
          class="bento-card card-records"
          @click="$router.push('/records')"
        >
          <div class="card-bg-decoration"></div>
          <div class="card-content">
            <div class="card-header">
              <span class="card-tag">Core</span>
              <Icon icon="material-symbols:arrow-outward" class="action-icon" />
            </div>
            <div class="card-main">
              <Icon icon="material-symbols:leaderboard-outline" class="main-icon" />
              <h2>记录与排行</h2>
              <p>探索全站最佳成绩 (GR) 与各项目排行榜，见证速度的极限。</p>
            </div>
          </div>
        </div>

        <!-- 2. 行动点：上传成绩 (高亮卡片) -->
        <div 
          class="bento-card card-submit"
          @click="$router.push('/submit-record')"
        >
          <div class="card-content centered">
            <div class="icon-circle">
              <Icon icon="material-symbols:timer-outline" />
            </div>
            <h2>上传成绩</h2>
            <p>支持官方及趣味项目</p>
            <button class="action-btn">立即上传</button>
          </div>
        </div>

        <!-- 3. 社区：麦麦 Bot -->
        <div class="bento-card card-bot">
          <div class="card-content">
            <div class="bot-info">
              <div class="bot-avatar">
                <Icon icon="mdi:robot" />
              </div>
              <div class="bot-text">
                <h3>麦麦 Bot</h3>
                <span class="status-dot">Online</span>
              </div>
            </div>
            <p class="bot-desc">群聊助手，数据实时联动。</p>
          </div>
        </div>

        <!-- 4. 装饰/信息卡片 -->
        <div class="bento-card card-info">
          <div class="card-content">
             <span class="info-label">Platform</span>
             <span class="info-value">HzCubing</span>
             <Icon icon="material-symbols:hub" class="bg-watermark" />
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
</script>

<style scoped>
/* 容器与布局 */
.home-wrapper {
  position: relative;
  min-height: 80vh;
  padding: var(--space-xl) var(--space-md);
  overflow: hidden;
  display: flex;
  justify-content: center;
}

.content-container {
  width: 100%;
  max-width: 1200px;
  position: relative;
  z-index: 1;
}

/* 动态背景光斑 */
.ambient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  z-index: 0;
  opacity: 0.4;
  animation: float 10s infinite ease-in-out;
}

.orb-1 {
  top: -10%;
  left: -10%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, var(--primary-color), transparent 70%);
}

.orb-2 {
  bottom: 10%;
  right: -5%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, var(--success-color), transparent 70%);
  animation-delay: -5s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(30px, -30px); }
}

/* Header 区域 */
.home-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 60px;
  padding: 0 var(--space-md);
}

.brand-title {
  font-size: 64px;
  line-height: 1.1;
  font-weight: 800;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
}

.chinese-part {
  font-family: 'CustomChinese', sans-serif;
  background: linear-gradient(120deg, var(--primary-color), var(--success-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.english-part {
  font-family: 'CustomEnglish', sans-serif;
  color: var(--text-color);
  font-size: 48px;
  letter-spacing: -1px;
  opacity: 0.8;
}

.brand-subtitle {
  font-size: 18px;
  color: var(--text-color-secondary);
  max-width: 400px;
  line-height: 1.6;
}

.mobile-break {
  display: none;
}

/* 3D Cube Animation */
.header-visual {
  perspective: 1000px;
  padding-right: 40px;
}

.floating-cube {
  width: 100px;
  height: 100px;
  position: relative;
  transform-style: preserve-3d;
  animation: rotate 20s infinite linear;
}

.side {
  position: absolute;
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(5px);
  box-shadow: 0 0 20px rgba(64, 158, 255, 0.2);
}

.front  { transform: translateZ(50px); }
.back   { transform: rotateY(180deg) translateZ(50px); }
.right  { transform: rotateY(90deg) translateZ(50px); }
.left   { transform: rotateY(-90deg) translateZ(50px); }
.top    { transform: rotateX(90deg) translateZ(50px); }
.bottom { transform: rotateX(-90deg) translateZ(50px); }

@keyframes rotate {
  from { transform: rotateX(0deg) rotateY(0deg); }
  to { transform: rotateX(360deg) rotateY(360deg); }
}

/* Bento Grid */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 240px);
  gap: 24px;
}

/* 通用卡片样式 */
.bento-card {
  background: var(--glass-bg-light);
  backdrop-filter: blur(var(--glass-blur-lg));
  -webkit-backdrop-filter: blur(var(--glass-blur-lg));
  border: var(--glass-border);
  border-radius: 24px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  cursor: pointer;
  display: flex;
  flex-direction: column;
}

.bento-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-xl);
  border-color: rgba(255, 255, 255, 0.8);
  background: var(--glass-bg-hover);
}

/* 卡片具体布局 */
.card-records {
  grid-column: span 2;
  grid-row: span 2;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.1));
}

.card-submit {
  grid-column: span 1;
  grid-row: span 1;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.15), rgba(64, 158, 255, 0.05));
  border-color: rgba(64, 158, 255, 0.2);
}

.card-bot {
  grid-column: span 1;
  grid-row: span 1;
}

.card-info {
  grid-column: span 1;
  grid-row: span 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.02);
}

/* 卡片内容样式 */
.card-content {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-records .card-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 20px;
}

.card-records h2 {
  font-size: 32px;
  margin: 16px 0 12px;
  color: var(--text-color);
}

.card-records p {
  color: var(--text-color-secondary);
  font-size: 16px;
  max-width: 80%;
  line-height: 1.6;
}

.main-icon {
  font-size: 48px;
  color: var(--primary-color);
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-tag {
  background: var(--primary-color);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.action-icon {
  font-size: 24px;
  color: var(--text-color-secondary);
  transition: transform 0.3s ease;
}

.card-records:hover .action-icon {
  transform: translate(4px, -4px);
  color: var(--primary-color);
}

/* Submit Card */
.card-submit .centered {
  align-items: center;
  justify-content: center;
  text-align: center;
}

.icon-circle {
  width: 60px;
  height: 60px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: var(--primary-color);
  margin-bottom: 16px;
  box-shadow: var(--shadow-md);
}

.card-submit h2 {
  font-size: 20px;
  margin-bottom: 8px;
}

.card-submit p {
  font-size: 14px;
  color: var(--text-color-secondary);
  margin-bottom: 20px;
}

.action-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.card-submit:hover .action-btn {
  background: var(--primary-dark);
  transform: scale(1.05);
}

/* Bot Card */
.bot-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.bot-avatar {
  width: 48px;
  height: 48px;
  background: var(--success-color);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.bot-text h3 {
  font-size: 18px;
  margin: 0 0 4px;
}

.status-dot {
  font-size: 12px;
  color: var(--success-color);
  position: relative;
  padding-left: 12px;
}

.status-dot::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  background: currentColor;
  border-radius: 50%;
}

.bot-desc {
  font-size: 14px;
  color: var(--text-color-secondary);
  line-height: 1.5;
}

/* Info Card */
.card-info .card-content {
  align-items: center;
  justify-content: center;
}

.info-label {
  font-size: 12px;
  text-transform: uppercase;
  color: var(--text-color-secondary);
  letter-spacing: 2px;
  margin-bottom: 8px;
}

.info-value {
  font-size: 24px;
  font-weight: 800;
  color: var(--text-color);
}

.bg-watermark {
  position: absolute;
  bottom: -20px;
  right: -20px;
  font-size: 120px;
  opacity: 0.05;
  color: var(--text-color);
  transform: rotate(-15deg);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: auto;
  }
  
  .card-records {
    grid-column: span 2;
    height: 300px;
  }
}

@media (max-width: 768px) {
  .home-wrapper {
    padding: var(--space-lg) var(--space-md);
    display: block;
  }

  .home-header {
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 40px;
  }

  .header-visual {
    display: none; /* 移动端隐藏 3D 方块以节省空间 */
  }

  .brand-title {
    font-size: 48px;
  }

  .english-part {
    font-size: 36px;
  }

  .mobile-break {
    display: inline;
  }

  .bento-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .bento-card {
    grid-column: span 1 !important;
    grid-row: span 1 !important;
    min-height: 200px;
  }

  .card-records {
    height: auto;
    min-height: 260px;
  }

  .card-records h2 {
    font-size: 24px;
  }
}
</style>