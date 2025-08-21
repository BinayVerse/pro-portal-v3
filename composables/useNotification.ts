export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastOptions {
  title?: string
  duration?: number
  action?: {
    label: string
    handler: () => void
  }
}

export const useNotification = () => {
  const showNotification = (message: string, type: ToastType = 'info', options?: ToastOptions) => {
    // Simple console logging for now - in a real app you'd integrate with a toast library
    const timestamp = new Date().toLocaleTimeString()
    console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`, options)
    
    // You could integrate with libraries like:
    // - @vueuse/core notifications
    // - vue-toastification
    // - Custom toast component
    
    return { id: Date.now().toString() }
  }

  const showSuccess = (message: string, options?: ToastOptions) => {
    return showNotification(message, 'success', options)
  }

  const showError = (message: string, options?: ToastOptions) => {
    return showNotification(message, 'error', options)
  }

  const showWarning = (message: string, options?: ToastOptions) => {
    return showNotification(message, 'warning', options)
  }

  const showInfo = (message: string, options?: ToastOptions) => {
    return showNotification(message, 'info', options)
  }

  return {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }
}
