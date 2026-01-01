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
