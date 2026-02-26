export async function handleAuthError(err: any): Promise<boolean> {
  // Normalize various 401/unauthorized shapes
  const is401 =
    err?.statusCode === 401 ||
    err?.response?.status === 401 ||
    err?.status === 401 ||
    err?.data?.statusCode === 401 ||
    (err?.message && (err.message.includes('401') || err.message.toLowerCase().includes('unauthorized')))

  if (is401) {
    try {
    } catch {}

    // Clear client-side storage if running on client
    if (process.client) {
      try {
        localStorage.removeItem('authUser')
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
      } catch (e) {}

      // Also clear auth store state to avoid guest middleware redirecting away from login
      try {
        const authStore = useAuthStore()
        // call clearAuth if available
        if (authStore && typeof authStore.clearAuth === 'function') {
          // clearAuth may be async in store
          await authStore.clearAuth()
        } else if (authStore && typeof authStore.setAuthUser === 'function') {
          authStore.setAuthUser(null)
        }
      } catch (e) {}

      // Give router a moment to initialize then navigate to login
      try {
        setTimeout(() => {
          navigateTo('/login')
        }, 250)
      } catch (e) {}
    }

    // Clear cookies (both variations used across the codebase)
    try {
      const c1 = useCookie('auth-token')
      c1.value = null
    } catch (e) {}
    try {
      const c2 = useCookie('authToken')
      c2.value = null
    } catch (e) {}

    return true
  }

  return false
}

export function clearAuth(): void {
  if (process.client) {
    try {
      localStorage.removeItem('authUser')
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
    } catch (e) {}
    try {
      navigateTo('/')
    } catch (e) {}
  }
  try {
    const c1 = useCookie('auth-token')
    c1.value = null
  } catch {}
  try {
    const c2 = useCookie('authToken')
    c2.value = null
  } catch {}
}
