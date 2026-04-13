import { isProd } from '~/server/utlis/helper'

export const BrainTreeMerchantAccountIdType = {
  INR_MERCHANT: isProd() ? 'provento_INR' : 'proximasystems_inr',
  EUR_MERCHANT: isProd() ? 'provento_EUR' : 'proximasystems_eur',
  USD_MERCHANT: isProd() ? 'provento_USD' : 'proximasystems',
}
