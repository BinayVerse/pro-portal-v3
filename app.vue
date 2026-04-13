<template>
  <NuxtLayout>
    <NuxtPage />
    <UNotifications />
    <ErrorModal />
  </NuxtLayout>
</template>

<script setup lang="ts">
import ErrorModal from '~/components/ui/ErrorModal.vue'
</script>
