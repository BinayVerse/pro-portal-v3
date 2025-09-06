<template>
  <div class="min-h-screen bg-black flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <NuxtLink to="/" class="inline-flex items-center space-x-3 mb-6">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2Fb2a7382a9c9146babd538ccc60e9d0b5%2Fbddd43caf4614f99a3fbff498927abcc?format=webp&width=800"
            alt="Provento Logo"
            class="w-10 h-10"
          />
          <span class="text-white text-2xl font-semibold">provento.ai</span>
        </NuxtLink>
        <h2 class="text-3xl font-bold text-white">Change your password</h2>
        <p class="mt-2 text-gray-400">Enter your current and new password below</p>
      </div>

      <div v-if="passwordUpdated" class="bg-green-900/20 border border-green-500/20 rounded-lg p-4">
        <div class="flex">
          <UIcon name="i-heroicons-check-circle" class="h-5 w-5 text-green-400 mt-0.5" />
          <div class="ml-3">
            <h3 class="text-sm font-medium text-green-400">Password changed successfully!</h3>
            <p class="mt-1 text-sm text-green-300">Your password has been changed.</p>
          </div>
        </div>
      </div>

      <form v-if="!passwordUpdated" @submit.prevent="handleChangePassword" class="space-y-6">
        <div>
          <label for="currentPassword" class="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
          <input
            id="currentPassword"
            v-model="form.currentPassword"
            :type="showCurrent ? 'text' : 'password'"
            required
            class="input-field w-full"
            placeholder="Enter current password"
            :disabled="loading"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-300 mb-2">New Password</label>
          <div class="relative">
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              required
              class="input-field w-full pr-12"
              placeholder="Enter your new password"
              :disabled="loading"
            />
            <button type="button" class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-300 transition-colors" @click="showPassword = !showPassword">
              <UIcon :name="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'" class="h-5 w-5" />
            </button>
          </div>
          <div v-if="form.password" class="mt-3 space-y-2 text-xs text-gray-400">
            <div :class="passwordValidation.hasMinLength ? 'text-green-400' : ''">• At least 8 characters</div>
            <div :class="passwordValidation.hasUppercase ? 'text-green-400' : ''">• One uppercase letter</div>
            <div :class="passwordValidation.hasLowercase ? 'text-green-400' : ''">• One lowercase letter</div>
            <div :class="passwordValidation.hasNumber ? 'text-green-400' : ''">• One number</div>
            <div :class="passwordValidation.hasSpecialChar ? 'text-green-400' : ''">• One special character (@$!%*?&)</div>
          </div>
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            :type="showConfirm ? 'text' : 'password'"
            required
            class="input-field w-full"
            placeholder="Confirm your new password"
            :disabled="loading"
          />
        </div>

        <button type="submit" :disabled="loading || !isFormValid" class="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
          <span v-if="loading" class="flex items-center justify-center">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
            Changing password...
          </span>
          <span v-else>Change password</span>
        </button>
      </form>

      <div class="text-center">
        <NuxtLink to="/" class="inline-flex items-center text-sm text-primary-400 hover:text-primary-300 transition-colors">
          <UIcon name="i-heroicons-arrow-left" class="h-4 w-4 mr-2" />
          Back to home
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth/index'
import { useNotification } from '~/composables/useNotification'

definePageMeta({ layout: 'minimal' })

const authStore = useAuthStore()
const { showNotification } = useNotification()

const form = ref({ currentPassword: '', password: '', confirmPassword: '' })
const loading = ref(false)
const passwordUpdated = ref(false)
const showPassword = ref(false)
const showConfirm = ref(false)
const showCurrent = ref(false)

const passwordValidation = computed(() => {
  const p = form.value.password || ''
  return {
    hasMinLength: p.length >= 8,
    hasUppercase: /[A-Z]/.test(p),
    hasLowercase: /[a-z]/.test(p),
    hasNumber: /\d/.test(p),
    hasSpecialChar: /[@$!%*?&]/.test(p),
  }
})

const isFormValid = computed(() => {
  const checks = Object.values(passwordValidation.value).every(Boolean)
  const match = form.value.password === form.value.confirmPassword && form.value.password.length > 0
  return checks && match && form.value.currentPassword.length > 0
})

const handleChangePassword = async () => {
  if (!isFormValid.value) {
    showNotification('Please ensure all fields are valid', 'error')
    return
  }

  loading.value = true
  try {
    const userId = authStore.user?.user_id
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const result = await authStore.changePassword({
      userId,
      currentPassword: form.value.currentPassword,
      newPassword: form.value.password,
    })

    if (result?.status === 'success') {
      passwordUpdated.value = true
      showNotification('Password changed successfully', 'success')
    }
  } catch (err: any) {
    console.error('Change password error:', err)
    showNotification(err.message || 'Failed to change password', 'error')
  } finally {
    loading.value = false
    form.value.currentPassword = ''
    form.value.password = ''
    form.value.confirmPassword = ''
  }
}
</script>
