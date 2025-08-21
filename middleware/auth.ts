export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore()

  // Initialize auth store if not already done
  if (process.client && !authStore.isAuthenticated) {
    authStore.initializeAuth()
  }

  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    // Store the intended destination
    const redirectTo = to.fullPath

    // Redirect to login with return URL
    return navigateTo({
      path: '/auth/login',
      query: { redirect: redirectTo },
    })
  }
})
