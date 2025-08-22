import type { State, createAPIPayload, DemoRequestPayload } from './types'

function initialState(): State {
  return {
    loading: false,
  }
}

export const useContactStore = defineStore('contactStore', {
  state: (): State => initialState(),
  getters: {},
  actions: {
    async create(payload: createAPIPayload) {
      this.loading = true;
      try {
        const response = await $fetch<any>('/api/contact', {
          method: 'POST',
          body: payload,
        });

        return response;
      } catch (error: any) {
        throw new Error(error?.data?.message || error?.message || 'Failed to send message');
      } finally {
        this.loading = false;
      }
    },

    async submitDemoRequest(payload: DemoRequestPayload) {
      this.loading = true;
      try {
        const response = await $fetch<any>('/api/contact', {
          method: 'POST',
          body: payload,
        });

        return response;
      } catch (error: any) {
        throw new Error(error?.data?.message || error?.message || 'Failed to submit demo request');
      } finally {
        this.loading = false;
      }
    },
  },
})
