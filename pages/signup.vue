<template>
  <div class="min-h-screen bg-black flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
    <div class="max-w-md w-full space-y-8">
      <!-- Logo and header -->
      <div class="text-center">
        <NuxtLink to="/" class="inline-flex items-center space-x-3 mb-6">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2Fb2a7382a9c9146babd538ccc60e9d0b5%2Fbddd43caf4614f99a3fbff498927abcc?format=webp&width=800"
            alt="Provento Logo"
            class="w-10 h-10"
          />
          <span class="text-white text-2xl font-semibold">provento.ai</span>
        </NuxtLink>
        <h2 class="text-3xl font-bold text-white">Create your account</h2>
      </div>

      <!-- Signup form -->
      <form @submit.prevent="handleSignup" class="space-y-6">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="firstName" class="block text-sm font-medium text-gray-300 mb-2">
              First Name
            </label>
            <input
              id="firstName"
              v-model="signupForm.firstName"
              type="text"
              required
              class="input-field w-full"
              placeholder="John"
            />
          </div>
          <div>
            <label for="lastName" class="block text-sm font-medium text-gray-300 mb-2">
              Last Name
            </label>
            <input
              id="lastName"
              v-model="signupForm.lastName"
              type="text"
              required
              class="input-field w-full"
              placeholder="Doe"
            />
          </div>
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-300 mb-2">
            Email address
          </label>
          <input
            id="email"
            v-model="signupForm.email"
            type="email"
            required
            class="input-field w-full"
            placeholder="john@company.com"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-300 mb-2">
            Password
          </label>
          <input
            id="password"
            v-model="signupForm.password"
            type="password"
            required
            class="input-field w-full"
            placeholder="Create a strong password"
          />
        </div>

        <div>
          <label for="company" class="block text-sm font-medium text-gray-300 mb-2">
            Company
          </label>
          <input
            id="company"
            v-model="signupForm.company"
            type="text"
            class="input-field w-full"
            placeholder="Your company name"
          />
        </div>

        <div class="flex items-center">
          <input
            id="terms"
            v-model="signupForm.agreeToTerms"
            type="checkbox"
            required
            class="h-4 w-4 text-primary-500 bg-dark-800 border-dark-600 rounded focus:ring-primary-500 focus:ring-2"
          />
          <label for="terms" class="ml-2 text-sm text-gray-300">
            I agree to the
            <a href="#" class="text-primary-400 hover:text-primary-300">Terms of Service</a>
            and
            <a href="#" class="text-primary-400 hover:text-primary-300">Privacy Policy</a>
          </label>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="loading" class="flex items-center justify-center">
            <UIcon
              name="i-heroicons-arrow-path"
              class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            />
            Creating account...
          </span>
          <span v-else>Create Account</span>
        </button>
      </form>

      <!-- Divider -->
      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-dark-700" />
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-black text-gray-400">Already have an account?</span>
        </div>
      </div>

      <!-- Login link -->
      <div class="text-center">
        <NuxtLink to="/login" class="btn-outline w-full"> Sign In Instead </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'minimal',
})

const { showNotification } = useNotification()
const loading = ref(false)

const signupForm = ref({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  company: '',
  agreeToTerms: false,
})

const handleSignup = async () => {
  if (!signupForm.value.agreeToTerms) {
    showNotification('Please agree to the terms of service', 'error')
    return
  }

  loading.value = true

  try {
    // Simulate signup process
    await new Promise((resolve) => setTimeout(resolve, 2000))

    showNotification(
      'Account created successfully! Please check your email to verify your account.',
      'success',
      {
        title: 'Welcome to Provento.ai!',
        duration: 5000,
      },
    )

    // Redirect to login
    await navigateTo('/login')
  } catch (error) {
    showNotification('Failed to create account. Please try again.', 'error')
  } finally {
    loading.value = false
  }
}
</script>
