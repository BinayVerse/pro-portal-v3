<template>
  <div class="max-w-3xl mx-auto bg-dark-900 p-6 rounded-lg">
    <h1 class="text-2xl font-semibold text-white mb-4">My Profile</h1>

    <div class="flex items-center space-x-4 mb-6">
      <div class="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center">
        <span class="text-white text-xl font-bold">{{ initials }}</span>
      </div>
      <div>
        <div class="text-lg font-semibold text-white">{{ profile.name || profile.email }}</div>
        <div class="text-sm text-gray-400">{{ profile.company || 'No company' }}</div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="text-gray-300 text-sm">Full name</label>
        <div class="mt-1 text-white">{{ profile.name || '-' }}</div>
      </div>
      <div>
        <label class="text-gray-300 text-sm">Email</label>
        <div class="mt-1 text-white">{{ profile.email || '-' }}</div>
      </div>
      <div>
        <label class="text-gray-300 text-sm">Contact number</label>
        <div class="mt-1 text-white">{{ profile.contact_number || '-' }}</div>
      </div>
      <div>
        <label class="text-gray-300 text-sm">Primary contact</label>
        <div class="mt-1 text-white">{{ profile.primary_contact ? 'Yes' : 'No' }}</div>
      </div>
    </div>

    <div class="mt-6">
      <UButton color="primary" @click="editProfile">Edit Profile</UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useProfileStore } from '~/stores/profile'

definePageMeta({ layout: 'admin' })

const profileStore = useProfileStore()
const profile = computed(() => profileStore.userProfile || {})

const initials = computed(() => {
  const name = profile.value.name || profile.value.email || ''
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
})

const editProfile = () => {
  navigateTo('/profile-update')
}

onMounted(async () => {
  try {
    await profileStore.fetchUserProfile()
  } catch (e) {
    // ignore; store handles errors
  }
})
</script>
