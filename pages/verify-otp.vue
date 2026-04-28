<template>
  <div class="min-h-screen bg-black flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <NuxtLink to="/" class="inline-flex items-center space-x-3 mb-6">
          <img src="~/assets/media/logo.svg" class="w-10 h-10" />
          <span class="text-white text-2xl font-semibold">provento.ai</span>
        </NuxtLink>
        <h2 class="text-3xl font-bold text-white">Verify Your Identity</h2>
        <p class="mt-2 text-gray-400">Enter the code from your authenticator app</p>
      </div>

      <!-- OTP Form -->
      <form @submit.prevent="handleVerify" class="space-y-6">
        <div>
          <label class="block text-sm text-gray-300 mb-2"> 6-digit code </label>
          <input
            ref="otpInput"
            v-model="otp"
            maxlength="6"
            inputmode="numeric"
            class="input-field w-full text-center tracking-widest text-lg"
            placeholder="123456"
          />
        </div>

        <button type="submit" :disabled="authStore.loading" class="w-full btn-primary">
          <span v-if="authStore.loading">Verifying...</span>
          <span v-else>Verify & Login</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useRoute } from 'vue-router'

definePageMeta({
  layout: 'minimal',
  middleware: 'guest',
})

const route = useRoute()
const authStore = useAuthStore()
const redirect = (route.query.redirect as string) || ''
const { showNotification } = useNotification()

const tempToken = route.query.token as string
const otp = ref('')
const otpInput = ref<HTMLInputElement | null>(null)

// 🔹 Verify OTP login
const handleVerify = async () => {
  try {
    await authStore.verifyOTPLogin(tempToken, otp.value)

    showNotification('Login successful!', 'success')

    await nextTick()

    // 🔥 USE REDIRECT
    if (redirect) {
      await navigateTo(redirect)
    } else {
      await authStore.handlePostLoginRedirect()
    }
  } catch (e: any) {
    console.error('OTP verification failed:', e)

    // 🔥 Extract message safely from all cases
    const message =
      e?.response?._data?.message || e?.data?.message || e?.message || 'Verification failed'

    const normalized = message.toLowerCase()

    // 🔐 Temp token expired
    if (normalized.includes('link has expired')) {
      setTimeout(() => {
        navigateTo('/login')
      }, 500)

      return
    }
  }
}

onMounted(() => {
  if (!tempToken) {
    navigateTo('/login')
    return
  }

  nextTick(() => {
    otpInput.value?.focus()
  })
})
</script>
