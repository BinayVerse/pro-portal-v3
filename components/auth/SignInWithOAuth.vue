<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth/index'

const authStore = useAuthStore()
const config = useRuntimeConfig()
const { $error, $success } = useNuxtApp()
const { showNotification } = useNotification()

const props = defineProps<{ authView: string }>()

interface GoogleResponse {
  credential: string
}

const handleGoogleResponse = async (response: GoogleResponse) => {
  const { credential } = response
  if (credential) {
    try {
      const result = await authStore.googleSignIn({ googleToken: credential })

      if (result.status === 'success') {
        showNotification(result.message || 'Sign-in successful!', 'success')
        const user = authStore.user as any
        if (user?.role_id === 0) {
          window.location.href = '/admin/superadmin'
        } else {
          window.location.href = result.redirect || '/admin/profile'
        }
      } else {
        showNotification(result.message || 'Sign-in failed.', 'error')
      }
    } catch (err) {
      console.error('Error handling Google sign-in:', err)
    }
  }
}

const loadGoogleScript = () => {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.accounts?.id) return resolve(true)
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(true), { once: true })
      existing.addEventListener('error', () => reject('Google API script failed to load.'), {
        once: true,
      })
      return
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve(true)
    script.onerror = () => reject('Google API script failed to load.')
    document.body.appendChild(script)
  })
}

const googleClientId = config.public.googleClientId

const initGoogleSignIn = async () => {
  try {
    await loadGoogleScript()
    if ((window as any).google) {
      const google = (window as any).google
      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleResponse,
      })
    } else {
      console.error('Google API not loaded')
    }
  } catch (error) {
    console.error('Error initializing Google Sign-In:', error)
    showNotification('Failed to initialize Google Sign-In. Please try again.', 'error')
  }
}

const handleCustomGoogleSignIn = () => {
  if ((window as any).google) {
    const googleLoginWrapper = document.createElement('div')
    googleLoginWrapper.style.display = 'none'
    document.body.appendChild(googleLoginWrapper)
    ;(window as any).google.accounts.id.renderButton(googleLoginWrapper, {
      theme: 'outline',
      size: 'large',
    })

    const googleButton = googleLoginWrapper.querySelector('div[role=button]') as HTMLElement | null
    if (googleButton) {
      googleButton.click()
    } else {
      console.error('Google button not found')
      showNotification(
        'Google sign-in button not available. Please refresh and try again.',
        'error',
      )
    }

    // cleanup
    setTimeout(() => {
      try {
        document.body.removeChild(googleLoginWrapper)
      } catch (e) {}
    }, 500)
  } else {
    console.error('Google API not ready yet.')
    showNotification('Google API not ready yet. Please refresh and try again.', 'error')
  }
}

onMounted(() => {
  initGoogleSignIn()
})
</script>

<template>
  <a
    href="#"
    class="flex justify-center ma-4 text-white rounded-full border-gray-500 bg-gray-100"
    @click.prevent="handleCustomGoogleSignIn"
  >
    <div class="px-4 py-3">
      <svg class="h-6 w-6" viewBox="0 0 40 40">
        <path
          d="M36.3425 16.7358H35V16.6667H20V23.3333H29.4192C28.045 27.2142 24.3525 30 20 30C14.4775 30 10 25.5225 10 20C10 14.4775 14.4775 9.99999 20 9.99999C22.5492 9.99999 24.8683 10.9617 26.6342 12.5325L31.3483 7.81833C28.3717 5.04416 24.39 3.33333 20 3.33333C10.7958 3.33333 3.33335 10.7958 3.33335 20C3.33335 29.2042 10.7958 36.6667 20 36.6667C29.2042 36.6667 36.6667 29.2042 36.6667 20C36.6667 18.8825 36.5517 17.7917 36.3425 16.7358Z"
          fill="#FFC107"
        />
        <path
          d="M5.25497 12.2425L10.7308 16.2583C12.2125 12.59 15.8008 9.99999 20 9.99999C22.5491 9.99999 24.8683 10.9617 26.6341 12.5325L31.3483 7.81833C28.3716 5.04416 24.39 3.33333 20 3.33333C13.5983 3.33333 8.04663 6.94749 5.25497 12.2425Z"
          fill="#FF3D00"
        />
        <path
          d="M20 36.6667C24.305 36.6667 28.2167 35.0192 31.1742 32.34L26.0159 27.975C24.3425 29.2425 22.2625 30 20 30C15.665 30 11.9842 27.2359 10.5975 23.3784L5.16254 27.5659C7.92087 32.9634 13.5225 36.6667 20 36.6667Z"
          fill="#4CAF50"
        />
        <path
          d="M36.3425 16.7358H35V16.6667H20V23.3333H29.4192C28.7592 25.1975 27.56 26.805 26.0133 27.9758C26.0142 27.975 26.015 27.975 26.0158 27.9742L31.1742 32.3392C30.8092 32.6708 36.6667 28.3333 36.6667 20C36.6667 18.8825 36.5517 17.7917 36.3425 16.7358Z"
          fill="#1976D2"
        />
      </svg>
    </div>
    <h1 class="px-4 py-3 text-gray-600 font-bold">
      {{ props.authView === 'signin' ? 'Sign In With Google' : 'Sign In With Google' }}
    </h1>
  </a>
</template>
