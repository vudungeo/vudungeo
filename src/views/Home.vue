<template>
  <div class="home">
    <div class="battle-container">
      <img src="/battle_animation.png" alt="Warcraft Battle" class="battle-img" />
    </div>
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
