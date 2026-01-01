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

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
