import braintree from 'braintree'
import { BrainTreeMerchantAccountIdType } from '~/server/types/enum'
import { isProd } from '~/server/utlis/helper'

export default defineEventHandler(async (event) => {
  try {
    const params = getQuery(event)
    const config = useRuntimeConfig()

    const gateway = new braintree.BraintreeGateway({
      environment: isProd() ? braintree.Environment.Production : braintree.Environment.Sandbox,
      merchantId: config.braintreeMerchantId,
      publicKey: config.braintreePublicKey,
      privateKey: config.braintreePrivateKey,
    })

    let merchantAccountId = ''
    if (params.currencyCode === 'EUR') merchantAccountId = BrainTreeMerchantAccountIdType.EUR_MERCHANT
    else if (params.currencyCode === 'USD') merchantAccountId = BrainTreeMerchantAccountIdType.USD_MERCHANT
    else if (params.currencyCode === 'INR') merchantAccountId = BrainTreeMerchantAccountIdType.INR_MERCHANT

    const clientToken = await gateway.clientToken
      .generate({
        merchantAccountId,
      })
      .catch((error) => {
        throw new CustomError(`Error: ${error.message}`, error.statusCode || 500)
      })

    if (!clientToken.success) throw new CustomError(`Error generating client token: ${clientToken.message}`, 404)

    return {
      clientToken: clientToken.clientToken,
      message: 'Success',
      status: 200,
    }
  } catch (error: any) {
    throw new CustomError(`Error: ${error.message}`, error.statusCode)
  }
})
