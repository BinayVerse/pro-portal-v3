import { handleError } from '~/utils/apiHandler'

export const usePaymentsStore = defineStore('payments', () => {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Billing details state
  const billingDetails = reactive({
    orgId: null as string | null,
    firstName: '',
    lastName: '',
    orgName: '',
    country: '',
    countryCode: '',
    zip: '',
    city: '',
    region: '',
    addressLine1: '',
    addressLine2: '',
    email: '',
    phone: '',
    isCardUpdated: false,
    cardHolderName: '',
    cardNo: '',
    expDate: '',
    cvv: '',
    cardType: '',
    gstNumber: '',
    taxId: '',
    isValidCardDetails: false,
    isValidAddress: false,
    couponCode: '',
    isCreditCardIsPresent: false,
    isComplereOrderRunning: false,
    paidAmount: 0,
    couponDurationType: '',
    gwToken: '',
    purchaseType: '',
    quantity: 1,
  })

  /**
   * ✅ Merge updates into billingDetails reactively
   */
  const setBillingDetails = (details: Partial<typeof billingDetails>) => {
    Object.entries(details).forEach(([key, value]) => {
      if (key in billingDetails)
        billingDetails[key as keyof typeof billingDetails] = value as never
    })
  }

  /**
   * 🧹 Reset billing details to initial defaults
   */
  const resetBillingDetails = () => {
    Object.keys(billingDetails).forEach((key) => {
      billingDetails[key as keyof typeof billingDetails] = '' as never
    })
    billingDetails.paidAmount = 1
  }

  /**
   * 🔐 Helper to get Authorization header
   */
  const getAuthHeaders = () => {
    let token: string | null = null

    if (process.client) {
      token = localStorage.getItem('authToken')
    }

    if (!token) {
      const authCookie = useCookie('authToken')
      token = authCookie.value || null
    }

    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  }

  /**
   * 💳 Get Braintree client token
   */
  const getClientToken = async () => {
    isLoading.value = true
    error.value = null
    try {
      const res = await fetch('/api/payments/braintree/client-token', {
        headers: getAuthHeaders(),
      })
      const text = await res.text()
      const data = text ? JSON.parse(text) : null

      if (!res.ok || !data?.success || !data.clientToken) {
        const msg = data?.error || 'Failed to fetch client token'
        throw new Error(msg)
      }

      return { success: true, clientToken: data.clientToken }
    } catch (err: any) {
      const msg = handleError(err, 'Failed to fetch client token')
      error.value = msg
      return { success: false, error: msg }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 💳 Generate Braintree client token (3DS)
   */
  const generateClientToken = async (code: string) => {
    isLoading.value = true
    error.value = null
    try {
      const url = `/api/user/3ds/client.token?currencyCode=${encodeURIComponent(code || '')}`
      const res = await fetch(url, { headers: getAuthHeaders() })
      const text = await res.text()
      const data = text ? JSON.parse(text) : null

      if (!res.ok || !data?.clientToken) {
        const msg = data?.error || 'Failed to fetch client token'
        throw new Error(msg)
      }

      return { success: true, clientToken: data.clientToken }
    } catch (err: any) {
      const msg = handleError(err, 'Failed to generate client token')
      error.value = msg
      return { success: false, error: msg }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 🧾 Checkout (Braintree + Chargebee flow)
   */
  const checkout = async (payload: any) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await $fetch<{ status?: boolean; message?: string; errors?: any[]; data?: any }>(
        '/api/payments/braintree/checkout',
        {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: getAuthHeaders(),
        }
      )

      if (response?.status === false) {
        const message = response.message || 'Error while processing payment'
        handleError({ response: { _data: { message } } }, message)
        return { success: false, message, errors: response.errors || [] }
      }

      handleSuccess('Subscription created successfully!')

      return { success: true, data: response.data }
    } catch (err: any) {
      const message = handleError(err, 'Error while processing payment')
      return {
        success: false,
        message,
        errors:
          extractErrors(err),
      }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * ✅ Complete order after successful payment
   */
  const completeOrder = async (body: any) => {
    isLoading.value = true
    error.value = null
    try {
      const res = await fetch('/api/payments/complete-order', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      })
      const text = await res.text()
      const data = text ? JSON.parse(text) : null

      if (!res.ok) {
        const msg = data?.error || 'Complete order failed'
        throw new Error(msg)
      }

      return { success: true, data }
    } catch (err: any) {
      const msg = handleError(err, 'Complete order failed')
      error.value = msg
      return { success: false, error: msg }
    } finally {
      isLoading.value = false
    }
  }

  /**
 * 🆓 Activate free plan (NO Braintree, NO Chargebee)
 */
  const activateFreePlan = async (payload: {
    planId: string, metadata?: any, billing?: {
      firstName?: string
      lastName?: string
      email?: string
      phoneNumber?: string
      addressLine1?: string
      addressLine2?: string
      city?: string
      region?: string
      zipcode?: string
      country?: string
      taxId?: string
    }
  }) => {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch('/api/payments/free', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: payload,
      })

      return { success: true, data: res }
    } catch (err: any) {
      const msg = handleError(err, 'Failed to activate free plan')
      error.value = msg
      return { success: false, error: msg }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * ❌ Cancel subscription
   */

  const cancelSubscription = async () => {
    isLoading.value = true
    error.value = null

    try {
      const res = await fetch('/api/payments/cancel', {
        method: 'POST',
        headers: getAuthHeaders(),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to cancel subscription')
      }

      return { success: true, data }
    } catch (err: any) {
      const msg = handleError(err, 'Failed to cancel subscription')
      error.value = msg
      return { success: false, error: msg }
    } finally {
      isLoading.value = false
    }
  }


  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    billingDetails,
    setBillingDetails,
    resetBillingDetails,
    getClientToken,
    generateClientToken,
    checkout,
    completeOrder,
    activateFreePlan,
    cancelSubscription,
  }
})
