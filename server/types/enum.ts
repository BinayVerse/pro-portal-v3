import { isProd } from '~/server/utlis/helper'

export const BrainTreeMerchantAccountIdType = {
  INR_MERCHANT: isProd() ? 'flowmapperai_INR' : 'proximasystems_inr',
  EUR_MERCHANT: isProd() ? 'flowmapperai_EUR' : 'proximasystems_eur',
  USD_MERCHANT: isProd() ? 'flowmapper' : 'proximasystems',
}
