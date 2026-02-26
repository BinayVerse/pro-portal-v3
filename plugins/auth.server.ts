import { useAuthStore } from '~/stores/auth/index'
import { useProfileStore } from '~/stores/profile/index'

export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()

  // Initialize authentication on server startup (reads cookie)
  await authStore.initializeAuth()

  // If logged in on server, fetch the user's profile so SSR has same state as client
  try {
    if (authStore.isLoggedIn) {
      const profileStore = useProfileStore()
      await profileStore.fetchUserProfile()
    }
  } catch (e) {
    // Ignore profile fetch errors during SSR to avoid blocking render
    console.warn('SSR profile fetch failed:', e?.message || e)
  }
})
