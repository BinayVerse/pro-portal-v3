import { defineStore } from 'pinia'

export interface OrganizationState {
  // Other organization-related state can be added here
}

import { handleError, handleSuccess, extractErrors } from '../../utils/apiHandler'

export const useOrganizationStore = defineStore('organizationStore', {
  state: (): OrganizationState => ({
    // Organization state
  }),

  getters: {
    // Organization getters can be added here
  },

  actions: {
    // Delegate error/success helpers to shared api handler for consistency
    handleError(error: any, defaultMessage: string, silent: boolean = false): string {
      return handleError(error, defaultMessage, silent)
    },

    handleSuccess(message: string): void {
      handleSuccess(message)
    },

    extractErrors(err: any): any[] {
      return extractErrors(err)
    },

    // Organization actions can be added here
  },
})
