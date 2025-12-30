<template>
  <div class="home">
    <h1>vudungeo</h1>

    
    <div class="nav-button">
      <button @click="$router.push('/stats')">Dungeons</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home'
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
</style>
