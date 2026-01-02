<template>
  <div class="home">
    <div class="battle-container">
      <img src="/battle_animation.png" alt="Warcraft Battle" class="battle-img" />
    </div>
    <h1>vudungeo</h1>

    
    <div class="nav-button">
      <button @click="$router.push('/stats')">Dungeons</button>
      <button @click="$router.push('/logs')">Logs</button>
      <button class="doc-btn" @click="$router.push('/api-docs')">API Docs</button>
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
  display: flex;
  gap: 20px;
}

.doc-btn {
  background: transparent;
  border: 1px solid #ffbd0a;
  color: #ffbd0a;
}

.doc-btn:hover {
  background: rgba(255, 189, 10, 0.1);
}

.battle-container {
  width: 100%;
  max-width: 500px;
  margin: 30px auto 10px;
  display: flex;
  justify-content: center;
  position: relative;
  
  /* Old School Pixel Border */
  border: 4px solid #1a1a1a;
  background: #242424;
  padding: 8px;
  box-shadow: 
    0 0 0 4px #444, /* Outer darkest frame */
    inset 0 0 0 2px #666, /* Inner highlight ring */
    5px 5px 15px rgba(0, 0, 0, 0.8); /* Depth shadow */
}

.battle-img {
  width: 100%;
  height: auto;
  image-rendering: pixelated;
  display: block;
  border: 2px solid #000; /* Crisp image edge */
}
</style>
