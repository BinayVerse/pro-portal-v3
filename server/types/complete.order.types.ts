export type OrderType = {
  email?: string
  firstName?: string
  lastName?: string
  phoneNumber?: string
  city?: string
  countryCode?: string
  zipcode?: string
  address?: string
  amount?: number
  planType?: string
  currencyCode?: string
  userId?: string
  currentDate?: string
  endDate?: string
  chargebeeSubId?: string
  object?: any
  paidAmount?: number
  cardHolderName?: string
  expiryMonth?: number | string
  expiryYear?: number | string
  securityCode?: string
  gstNumber?: string
  subscriptionTypeId?: string
}

export type SubscriptionDetails = {
  subscriptionTypeId?: string
  itemPriceId: string
  amount: number
  gwToken?: string
  couponCode?: string
  couponDurationType?: string
  planType?: string
  userId?: string
  currentDate?: string
  endDate?: string
  chargebeeSubId?: string
  currencyCode?: string
  paidAmount?: number
}
