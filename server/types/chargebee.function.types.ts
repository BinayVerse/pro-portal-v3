export type ChargebeeProductFamilyType = {
  proFamId: string
  descp?: string
  name: string
}

export type ChargebeeItemType = {
  itemId: string
  itemName: string
  description?: string
  productFamily: string
}

export type ChargebeeItemPriceType = {
  priceId: string
  itemId: string
  name: string
  price: number
  currencyCode: string
  period: number
  periodUnit: string
}
