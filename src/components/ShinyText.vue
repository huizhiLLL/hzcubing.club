<template>
  <div
    class="shiny-text"
    :class="{ 'disabled': disabled, [className]: className }"
    :style="{ '--animation-duration': `${speed}s` }"
  >
    <slot>{{ text }}</slot>
  </div>
</template>

<script setup>
defineProps({
  text: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  speed: {
    type: Number,
    default: 5
  },
  className: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.shiny-text {
  position: relative;
  color: inherit;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.9) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  display: inline-block;
  animation: shine var(--animation-duration, 5s) linear infinite;
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
}

.shiny-text::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shine-overlay var(--animation-duration, 5s) linear infinite;
  pointer-events: none;
}

@keyframes shine {
  0% {
    background-position: 200% center;
  }
  100% {
    background-position: -200% center;
  }
}

@keyframes shine-overlay {
  0% {
    background-position: 200% center;
  }
  100% {
    background-position: -200% center;
  }
}

.shiny-text.disabled {
  animation: none;
}

.shiny-text.disabled::before {
  animation: none;
}
</style> 