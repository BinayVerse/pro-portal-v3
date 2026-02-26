import axios from 'axios'
import { CustomError } from './custom.error'

export async function predictRag(payload: any, authToken: string): Promise<any> {
  const config = useRuntimeConfig()
  const botEndpoint = config.public.botEndpoint
  if (!botEndpoint) {
    throw new CustomError('Bot endpoint not configured', 500)
  }

  const apiUrl = `${botEndpoint}predict_rag`

  try {
    const response = await axios.post(apiUrl, payload, {
      headers: {
        Authorization: authToken ? `Bearer ${authToken}` : undefined,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })

    if (response.status === 200) {
      return response.data
    }

    throw new CustomError(`Unexpected response status: ${response.status}`, response.status)
  } catch (error: any) {
    if (error.response) {
      const message = error.response.data?.message || error.response.statusText || 'Failed to fetch prediction'
      const status = error.response.status || 500
      throw new CustomError(message, status)
    }

    throw new CustomError(error.message || 'Network error while calling RAG predict', 500)
  }
}
