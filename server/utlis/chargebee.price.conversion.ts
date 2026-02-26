type Currency = 'USD' | 'EUR' | 'INR'

export function getFormatPrice(amountInCents: number, currency: Currency): string {
  const amount = amountInCents / 100
  let formattedPrice: string
  switch (currency) {
    case 'USD':
      formattedPrice = amount.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      })
      break

    case 'EUR':
      formattedPrice = amount.toLocaleString('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      break

    case 'INR':
      formattedPrice = amount.toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
      })
      break

    default:
      throw new Error('Unsupported currency')
  }

  return formattedPrice
}
