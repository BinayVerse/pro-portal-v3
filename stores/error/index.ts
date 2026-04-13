import { defineStore } from 'pinia'

export const useErrorStore = defineStore('error', {
  state: () => ({
    errorMessage: '' as string,
    isErrorModalOpen: false,
  }),

  actions: {
    showError(message: string) {
      this.errorMessage = message
      this.isErrorModalOpen = true
    },

    closeErrorModal() {
      this.isErrorModalOpen = false
      this.errorMessage = ''
    },
  },
})
