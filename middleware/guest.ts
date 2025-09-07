import { useAuthStore } from '~/stores/auth/index'

export default defineNuxtRouteMiddleware(async (to, from) => {
  const authStore = useAuthStore()

  // Ensure auth initialized
  await authStore.initializeAuth()

  if (authStore.isLoggedIn) {
    // If user is authenticated, prevent access to guest-only pages
    return navigateTo('/admin/dashboard')
  }
})
