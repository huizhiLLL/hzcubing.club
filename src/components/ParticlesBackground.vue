<script setup>
import { ref, onMounted } from 'vue'
import { tsParticles } from "tsparticles-engine";
import { loadFull } from "tsparticles";

const particlesContainer = ref(null)

onMounted(async () => {
  try {
    await loadFull(tsParticles);
    await tsParticles.load('tsparticles', {
      fullScreen: {
        enable: true,
        zIndex: 0
      },
      fpsLimit: 60,
      particles: {
        number: {
          value: 40,
          density: {
            enable: true,
            area: 800
          }
        },
        color: {
          value: "#409EFF"
        },
        shape: {
          type: "circle"
        },
        opacity: {
          value: 0.3,
          random: true,
          anim: {
            enable: false
          }
        },
        size: {
          value: { min: 1, max: 3 },
          random: true
        },
        links: {
          enable: true,
          distance: 150,
          color: "#409EFF",
          opacity: 0.2,
          width: 1,
          frequency: 0.2
        },
        move: {
          enable: true,
          speed: 0.6,
          direction: "none",
          random: true,
          straight: false,
          outMode: "bounce"
        }
      },
      interactivity: {
        detectsOn: "window",
        events: {
          onHover: {
            enable: true,
            mode: "connect"
          },
          onClick: {
            enable: false
          },
          resize: true
        },
        modes: {
          connect: {
            distance: 150,
            links: {
              opacity: 0.2
            },
            radius: 100
          }
        }
      },
      detectRetina: true,
      background: {
        color: "transparent",
        opacity: 0
      }
    })
  } catch (error) {
    console.error('粒子效果初始化失败:', error)
  }
})
</script>

<template>
  <div id="tsparticles" class="particles-container"></div>
</template>

<style scoped>
.particles-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}
</style> 