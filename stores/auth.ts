import { defineStore } from 'pinia'

export interface User {
  id: number
  email: string
  name: string
  role: string
  createdAt: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupCredentials {
  name: string
  email: string
  password: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value)

  const login = async (credentials: LoginCredentials) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean; data?: User; error?: string }>(
        '/api/auth/login',
        {
          method: 'POST',
          body: credentials,
        },
      )

      if (response.success && response.data) {
        user.value = response.data
        // Store in localStorage for persistence
        if (process.client) {
          localStorage.setItem('isAuthenticated', 'true')
          localStorage.setItem('user', JSON.stringify(response.data))
        }
        return { success: true }
      } else {
        throw new Error(response.error || 'Login failed')
      }
    } catch (err: any) {
      error.value = err?.data?.statusMessage || err.message || 'Login failed'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const signup = async (credentials: SignupCredentials) => {
    isLoading.value = true
    error.value = null

    try {
      const { data } = await $fetch<{ success: boolean; data?: User; error?: string }>(
        '/api/auth/signup',
        {
          method: 'POST',
          body: credentials,
        },
      )

      if (data) {
        user.value = data
        // Store in localStorage for persistence
        if (process.client) {
          localStorage.setItem('isAuthenticated', 'true')
          localStorage.setItem('user', JSON.stringify(data))
        }
        return { success: true }
      } else {
        throw new Error('Signup failed')
      }
    } catch (err: any) {
      error.value = err?.data?.error || err.message || 'Signup failed'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const logout = () => {
    user.value = null
    if (process.client) {
      localStorage.removeItem('isAuthenticated')
      localStorage.removeItem('user')
    }
  }

  const initializeAuth = () => {
    if (process.client) {
      const storedUser = localStorage.getItem('user')
      if (storedUser && localStorage.getItem('isAuthenticated') === 'true') {
        user.value = JSON.parse(storedUser)
      }
    }
  }

  // Auto-initialize on store creation
  if (process.client) {
    initializeAuth()
  }

  return {
    user: readonly(user),
    loading: readonly(isLoading),
    isLoading: readonly(isLoading),
    error: readonly(error),
    isAuthenticated,
    login,
    signup,
    logout,
    initializeAuth,
  }
})
