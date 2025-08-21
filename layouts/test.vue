<template>
  <div class="min-h-screen bg-red-900">
    <header class="bg-blue-900 p-4">
      <h1 class="text-white text-xl">TEST HEADER - LAYOUT IS WORKING</h1>
    </header>
    <main class="p-4">
      <slot />
    </main>
    <footer class="bg-green-900 p-4">
      <p class="text-white">TEST FOOTER - LAYOUT IS WORKING</p>
    </footer>
  </div>
</template>

<script setup>
console.log('Test layout is loading...')
</script>
