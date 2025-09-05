import type { State, createAPIPayload, DemoRequestPayload } from './types'

function initialState(): State {
  return {
    loading: false,
  }
}

import { handleError } from '../../utils/apiHandler'

export const useContactStore = defineStore('contactStore', {
  state: (): State => initialState(),
  getters: {},
  actions: {
    async create(payload: createAPIPayload) {
      this.loading = true;
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        let data: any;

        try {
          const responseText = await response.text();

          if (!responseText) {
            data = { status: 'error', message: 'Empty response from server' };
          } else {
            try {
              data = JSON.parse(responseText);
            } catch (parseError) {
              data = { status: 'error', message: responseText };
            }
          }
        } catch (textError) {
          data = { status: 'error', message: 'Failed to read response from server' };
        }

        if (!response.ok) {
          const msg = data?.message || 'Failed to send message'
          handleError({ response: { _data: { message: msg } } }, msg)
          throw new Error(msg);
        }

        return data;
      } catch (error: any) {
        const msg = handleError(error, 'Failed to send message')
        throw new Error(msg);
      } finally {
        this.loading = false;
      }
    },

    async submitDemoRequest(payload: DemoRequestPayload) {
      this.loading = true;
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        let data: any;

        try {
          const responseText = await response.text();

          if (!responseText) {
            data = { status: 'error', message: 'Empty response from server' };
          } else {
            try {
              data = JSON.parse(responseText);
            } catch (parseError) {
              data = { status: 'error', message: responseText };
            }
          }
        } catch (textError) {
          data = { status: 'error', message: 'Failed to read response from server' };
        }

        if (!response.ok) {
          const msg = data?.message || 'Failed to submit demo request'
          handleError({ response: { _data: { message: msg } } }, msg)
          throw new Error(msg);
        }

        return data;
      } catch (error: any) {
        const msg = handleError(error, 'Failed to submit demo request')
        throw new Error(msg);
      } finally {
        this.loading = false;
      }
    },
  },
})
