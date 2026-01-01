<template>
  <router-view></router-view>
  <div class="version-badge">
    v{{ appVersion }} © {{ currentYear }}
  </div>
</template>

<script>
export default {
  data() {
    return {
      appVersion: __APP_VERSION__,
      currentYear: new Date().getFullYear()
    }
  }
}
</script>

<style>
.version-badge {
  position: fixed;
  bottom: 20px;
  left: 20px;
  font-size: 0.75rem;
  color: #666;
  font-family: 'Inter', sans-serif;
  opacity: 0.8;
  pointer-events: none;
  z-index: 1000;
}
</style>
