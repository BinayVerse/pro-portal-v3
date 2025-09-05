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
  const toast = useToast()

  const showNotification = (message: string, type: ToastType = 'info', options?: ToastOptions) => {
    const toastConfig: any = {
      title: options?.title,
      description: message,
      timeout: options?.duration || 5000,
    }

    // Allow passing a custom class via options.className or default to enabling pre-line for errors
    const extraClass = (options as any)?.className ?? (type === 'error' ? 'toast-pre-line' : undefined)
    if (extraClass) toastConfig.class = extraClass

    switch (type) {
      case 'success':
        return toast.add({
          ...toastConfig,
          color: 'green',
          icon: 'i-heroicons-check-circle',
        })
      case 'error':
        return toast.add({
          ...toastConfig,
          color: 'red',
          icon: 'i-heroicons-x-circle',
        })
      case 'warning':
        return toast.add({
          ...toastConfig,
          color: 'yellow',
          icon: 'i-heroicons-exclamation-triangle',
        })
      case 'info':
      default:
        return toast.add({
          ...toastConfig,
          color: 'blue',
          icon: 'i-heroicons-information-circle',
        })
    }
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

  // Add clear function to remove all toasts
  const clear = () => {
    toast.clear()
  }

  return {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clear,
  }
}
