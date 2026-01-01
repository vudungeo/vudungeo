<template>
  <div class="home">
    <h1>vudungeo</h1>

    
    <div class="nav-button">
      <button @click="$router.push('/stats')">Dungeons</button>
    </div>

    <div class="version-badge">
      v{{ appVersion }} © {{ currentYear }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home',
  data() {
    return {
      appVersion: __APP_VERSION__,
      currentYear: new Date().getFullYear()
    }
  }
}
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 50px;
}
.nav-button {
  margin-top: 80px; 
  z-index: 10;
}
/* Re-using global styles from style.css for lion, but ensuring container alignment */
.version-badge {
  position: fixed;
  bottom: 20px;
  left: 20px;
  font-size: 0.75rem;
  color: #666;
  font-family: 'Inter', sans-serif;
  opacity: 0.8;
  pointer-events: none;
}
</style>
