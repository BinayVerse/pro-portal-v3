<template>
  <div>
    <!-- DEBUG: App.vue is rendering -->
    <div style="position: fixed; top: 50px; left: 0; width: 100%; background: blue; color: white; padding: 10px; text-align: center; font-weight: bold; z-index: 9998;">
      DEBUG: APP.VUE IS WORKING!
    </div>
    <NuxtPage />
  </div>
</template>

<script setup>
console.log('App.vue is loading!')
// Auth initialization will be handled by individual components that need it
</script>
