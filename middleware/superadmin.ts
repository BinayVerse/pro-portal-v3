import { useAuthStore } from '~/stores/auth/index'

export default defineNuxtRouteMiddleware(async () => {
  const auth = useAuthStore()
  await auth.initializeAuth()

  if (!auth.isLoggedIn) {
    return navigateTo('/login')
  }

  if (auth.user?.role_id !== 0) {
    return navigateTo('/admin/dashboard')
  }
})
