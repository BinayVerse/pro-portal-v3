import { useNotification } from '../composables/useNotification'

export function handleError(error: any, defaultMessage: string, silent: boolean = false): string {
  const { showError } = useNotification()
  const errorMessage =
    // prefer Nuxt $fetch unpacked body (_data) for non-2xx responses
    error?.response?._data?.message ||
    error?.response?._data?.statusMessage ||
    // fallback to axios-like response.data or other shapes
    error?.response?.data?.message ||
    error?.response?.statusText ||
    error?.data?.message ||
    error?.statusMessage ||
    error?.message ||
    defaultMessage

  if (!silent) {
    try {
      showError(errorMessage)
    } catch (e) {
      // Fallback to console if notification fails
      // eslint-disable-next-line no-console
      console.error('Error showing notification:', e)
    }
  }

  return errorMessage
}

export function handleSuccess(message: string): void {
  const { showSuccess } = useNotification()
  try {
    showSuccess(message)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error showing success notification:', e)
  }
}

export function extractErrors(err: any): any[] {
  return (
    err?.response?._data?.errors || err?.response?.data?.errors || err?.data?.errors || []
  )
}
