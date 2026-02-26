import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const merchantId = config.braintreeMerchantId || process.env.BRAINTREE_MERCHANT_ID
  const publicKey = config.braintreePublicKey || process.env.BRAINTREE_PUBLIC_KEY
  const privateKey = config.braintreePrivateKey || process.env.BRAINTREE_PRIVATE_KEY
  const envName = config.braintreeEnvironment || process.env.BRAINTREE_ENVIRONMENT || 'sandbox'

  if (!merchantId || !publicKey || !privateKey) {
    return { success: false, error: 'Braintree not configured on server (missing keys)' }
  }

  try {
    const braintree = await import('braintree')
    const env = envName === 'production' ? braintree.Environment.Production : braintree.Environment.Sandbox
    const gateway = new braintree.BraintreeGateway({
      environment: env,
      merchantId,
      publicKey,
      privateKey,
    })

    console.log('Generating Braintree client token in environment:', envName)

    const resp = await gateway.clientToken.generate({})
    const token = resp && (resp as any).clientToken
    console.log('Braintree client token generated successfully')
    return { success: true, clientToken: token }
  } catch (err: any) {
    console.error('Failed to generate Braintree client token', err)
    return { success: false, error: err?.message || 'Failed to generate client token' }
  }
})
