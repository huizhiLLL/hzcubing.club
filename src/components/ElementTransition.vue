<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  name: {
    type: String,
    default: 'fade'
  },
  mode: {
    type: String,
    default: 'out-in'
  },
  tag: {
    type: String,
    default: 'div'
  },
  duration: {
    type: [Number, Object],
    default: 300
  }
})
</script>

<template>
  <transition
    :name="name"
    :mode="mode"
    :duration="duration"
    :appear="true"
  >
    <slot></slot>
  </transition>
</template>

<style scoped>
/* 淡入淡出效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity v-bind('`${typeof duration === "number" ? duration : duration.enter}ms`') ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 滑动效果 */
.slide-enter-active,
.slide-leave-active {
  transition: transform v-bind('`${typeof duration === "number" ? duration : duration.enter}ms`') ease,
              opacity v-bind('`${typeof duration === "number" ? duration : duration.enter}ms`') ease;
}

.slide-enter-from {
  transform: translateY(20px);
  opacity: 0;
}

.slide-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

/* 缩放效果 */
.scale-enter-active,
.scale-leave-active {
  transition: transform v-bind('`${typeof duration === "number" ? duration : duration.enter}ms`') ease,
              opacity v-bind('`${typeof duration === "number" ? duration : duration.enter}ms`') ease;
}

.scale-enter-from,
.scale-leave-to {
  transform: scale(0.9);
  opacity: 0;
}
</style> 