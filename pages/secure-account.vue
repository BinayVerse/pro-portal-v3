<template>
  <div class="min-h-screen bg-black flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <NuxtLink to="/" class="inline-flex items-center space-x-3 mb-6">
          <img src="~/assets/media/logo.svg" class="w-10 h-10" />
          <span class="text-white text-2xl font-semibold">provento.ai</span>
        </NuxtLink>
        <h2 class="text-3xl font-bold text-white">Secure Your Account</h2>
        <p class="mt-2 text-gray-400">Set up two-factor authentication</p>
      </div>

      <!-- QR Section -->
      <div class="bg-dark-800 p-6 rounded-lg text-center space-y-4">
        <p class="text-sm text-gray-300">Scan this QR code using your authenticator app</p>

        <div v-if="qrCode" class="flex justify-center">
          <img :src="qrCode" class="w-40 h-40 bg-white p-2 rounded" />
        </div>

        <p class="text-xs text-gray-400 break-all">
          {{ manualKey }}
        </p>
      </div>

      <!-- OTP Form -->
      <form @submit.prevent="handleVerify" class="space-y-6">
        <div>
          <label class="block text-sm text-gray-300 mb-2"> Enter 6-digit code </label>
          <input
            v-model="otp"
            maxlength="6"
            inputmode="numeric"
            class="input-field w-full text-center tracking-widest text-lg"
            placeholder="123456"
          />
        </div>

        <button type="submit" :disabled="authStore.loading" class="w-full btn-primary">
          <span v-if="authStore.loading">Verifying...</span>
          <span v-else>Verify & Continue</span>
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
const { showNotification } = useNotification()
const redirect = (route.query.redirect as string) || ''

const tempToken = route.query.token as string

const qrCode = ref('')
const manualKey = ref('')
const otp = ref('')

// 🔹 Fetch QR on mount
onMounted(async () => {
  if (!tempToken) {
    return navigateTo('/login')
  }

  try {
    const res = await authStore.setup2FA(tempToken)
    qrCode.value = res.qrCode
    manualKey.value = res.manualKey
  } catch (e: any) {
    console.error('Failed to load 2FA setup', e)

    const message = e?.message || e?.response?._data?.message || 'Something went wrong'

    if (message.toLowerCase().includes('temp token')) {
      // showNotification(message, 'error')
      return navigateTo('/login')
    }
  }
})

// 🔹 Verify OTP
const handleVerify = async () => {
  try {
    await authStore.verify2FASetup(tempToken, otp.value)

    showNotification('2FA setup successful!', 'success')

    await nextTick()

    if (redirect) {
      await navigateTo(redirect)
    } else {
      await authStore.handlePostLoginRedirect()
    }
  } catch (e: any) {
    console.error('Failed to verify 2FA setup', e)

    const message = e?.message || e?.response?._data?.message || 'Verification failed'

    if (message.toLowerCase().includes('link has expired')) {
      // showNotification(message, 'error')
      return setTimeout(() => {
        navigateTo('/login')
      }, 500)
    }
  }
}
</script>
