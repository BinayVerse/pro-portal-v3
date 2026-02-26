import axios from 'axios'
import { CustomError } from './custom.error'

export async function processFulfillment(
  registrationToken: string,
): Promise<any> {
  const config = useRuntimeConfig();
  const botEndpoint = config.public.botEndpoint;

  // Ensure trailing slash handling
  const apiUrl = `${botEndpoint}api/aws/fulfillment`;

  const payload = { registrationToken }

  try {
    const response = await axios.post(apiUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      // timeout: 15000,
    })

    if (response.status === 200 || response.status === 201) {
      return response.data
    }

    throw new CustomError(`Unexpected response status: ${response.status}`, response.status)
  } catch (error: any) {
    if (error?.response) {
      const msg = error.response.data?.message || error.response.data || 'Fulfillment failed'
      throw new CustomError(msg, error.response.status || 500)
    }
    throw new CustomError(error?.message || 'Fulfillment request error', 500)
  }
}
