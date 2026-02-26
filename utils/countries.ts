export interface CountryTaxInfo {
  label: string
  taxIdLabel: string
  taxIdPlaceholder: string
  verificationUrl: string | null
  taxIdKey: string
}

export const COUNTRY_TAX_MAP: Record<string, CountryTaxInfo> = {
  // others: {
  //   label: 'Others',
  //   taxIdLabel: 'Organization Identifier',
  //   taxIdPlaceholder: 'Enter your organization identifier (minimum 5 characters)',
  //   verificationUrl: null,
  //   taxIdKey: 'others',
  // },
  india: {
    label: 'India',
    taxIdLabel: 'GSTIN',
    taxIdPlaceholder: '27AABCT1234F1Z0',
    verificationUrl: 'https://services.gst.gov.in/services/searchtp',
    taxIdKey: 'gstin',
  },
  usa: {
    label: 'United States',
    taxIdLabel: 'EIN',
    taxIdPlaceholder: 'XX-XXXXXXX',
    verificationUrl: null,
    taxIdKey: 'ein',
  },
  // uk: {
  //   label: 'United Kingdom',
  //   taxIdLabel: 'Company Registration Number (CRN)',
  //   taxIdPlaceholder: '12345678',
  //   verificationUrl: 'https://find-and-update.company-information.service.gov.uk/',
  //   taxIdKey: 'crn',
  // },
  // canada: {
  //   label: 'Canada',
  //   taxIdLabel: 'Business Number (BN)',
  //   taxIdPlaceholder: 'XXXXXXXXXX',
  //   verificationUrl: null,
  //   taxIdKey: 'bn',
  // },
  // australia: {
  //   label: 'Australia',
  //   taxIdLabel: 'ABN',
  //   taxIdPlaceholder: 'XXX XXX XXX',
  //   verificationUrl: 'https://connectonline.asic.gov.au/',
  //   taxIdKey: 'abn',
  // },
  // eu: {
  //   label: 'European Union',
  //   taxIdLabel: 'VAT Number',
  //   taxIdPlaceholder: 'XXXXXXXXXXXXXXXXXXX',
  //   verificationUrl: 'https://ec.europa.eu/taxation_customs/vies/',
  //   taxIdKey: 'vat',
  // },
  // singapore: {
  //   label: 'Singapore',
  //   taxIdLabel: 'UEN',
  //   taxIdPlaceholder: 'XXXXXXXXXXX',
  //   verificationUrl: 'https://www.bizfile.gov.sg',
  //   taxIdKey: 'uen',
  // },
  // uae: {
  //   label: 'United Arab Emirates',
  //   taxIdLabel: 'VAT Number',
  //   taxIdPlaceholder: 'XXXXXXXXXXX',
  //   verificationUrl: 'https://eservices.tax.gov.ae',
  //   taxIdKey: 'vat',
  // },
  // new_zealand: {
  //   label: 'New Zealand',
  //   taxIdLabel: 'NZBN',
  //   taxIdPlaceholder: 'XXXXXXXXXXX',
  //   verificationUrl: 'https://www.nzbn.govt.nz/',
  //   taxIdKey: 'nzbn',
  // },
  // brazil: {
  //   label: 'Brazil',
  //   taxIdLabel: 'CNPJ',
  //   taxIdPlaceholder: 'XX.XXX.XXX/XXXX-XX',
  //   verificationUrl: 'https://servicos.receita.fazenda.gov.br/servicos/cnpjreva/cnpjreva_solicitacao.asp',
  //   taxIdKey: 'cnpj',
  // },
  // japan: {
  //   label: 'Japan',
  //   taxIdLabel: 'Corporate Number',
  //   taxIdPlaceholder: 'XXXX-XX-XXXXXX',
  //   verificationUrl: 'https://www.houjin-bangou.nta.go.jp/en/',
  //   taxIdKey: 'corporate_number',
  // },
}

export const COUNTRY_OPTIONS = [
  ...Object.entries(COUNTRY_TAX_MAP)
    .map(([key, value]) => ({
      value: key,
      label: value.label,
    }))
    .sort((a, b) => a.label.localeCompare(b.label)),
  // {
  //   value: 'others',
  //   label: 'Others',
  // },
]

export function getCountryTaxInfo(countryCode: string): CountryTaxInfo | null {
  return COUNTRY_TAX_MAP[countryCode.toLowerCase()] || null
}

export function validateTaxId(countryCode: string, taxId: string): boolean {
  const trimmedTaxId = taxId.trim()
  if (!trimmedTaxId) return false

  const country = countryCode.toLowerCase()

  if (country === 'others') {
    return trimmedTaxId.length >= 5
  }

  const uppercaseTaxId = trimmedTaxId.toUpperCase()

  switch (country) {
    case 'india':
      // GSTIN format: 2 digits (state) + 5 letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric = 15 chars
      // Example: 27AABCT1234F1Z0
      return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z0-9]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/.test(uppercaseTaxId)

    case 'usa':
      // EIN format: XX-XXXXXXX (2 digits, hyphen, 7 digits)
      // Example: 12-3456789
      return /^\d{2}-\d{7}$/.test(uppercaseTaxId)

    case 'uk':
      // CRN: 8 digits only or 2 letters + 6 digits
      // Example: 12345678 or AB123456
      const cleanedUK = uppercaseTaxId.replace(/\s/g, '')
      return /^([0-9]{8}|[A-Z]{2}[0-9]{6})$/.test(cleanedUK)

    case 'canada':
      // BN: 9 digits only
      // Example: 123456789
      const cleanedCA = uppercaseTaxId.replace(/\s/g, '')
      return /^[0-9]{9}$/.test(cleanedCA)

    case 'australia':
      // ABN: exactly 11 digits (no letters)
      // Example: 12345678901
      const cleanedAU = uppercaseTaxId.replace(/\s/g, '')
      return /^[0-9]{11}$/.test(cleanedAU)

    case 'eu':
      // VAT: 2 letters (country code) + 2-12 alphanumeric digits
      // Example: DE123456789
      const cleanedEU = uppercaseTaxId.replace(/\s/g, '')
      return /^[A-Z]{2}[0-9A-Z]{2,12}$/.test(cleanedEU)

    case 'singapore':
      // UEN: 9-12 characters (alphanumeric or hyphen), must start with digit
      // Example: 123456789 or 123456-789A
      const cleanedSG = uppercaseTaxId.replace(/\s/g, '')
      return /^[0-9][A-Z0-9\-]{8,11}$/.test(cleanedSG)

    case 'uae':
      // VAT: exactly 15 digits
      // Example: 100123456789012
      const cleanedUAE = uppercaseTaxId.replace(/\s/g, '')
      return /^[0-9]{15}$/.test(cleanedUAE)

    case 'new_zealand':
      // NZBN: exactly 13 digits
      // Example: 9876543210123
      const cleanedNZ = uppercaseTaxId.replace(/\s/g, '')
      return /^[0-9]{13}$/.test(cleanedNZ)

    case 'brazil':
      // CNPJ: 14 digits (allows formatting XX.XXX.XXX/XXXX-XX)
      // Example: 12345678901234 or 12.345.678/0001-23
      const cleanedBR = uppercaseTaxId.replace(/[\s.-/]/g, '')
      return /^[0-9]{14}$/.test(cleanedBR)

    case 'japan':
      // Corporate Number: exactly 13 digits
      // Example: 1234567890123
      const cleanedJP = uppercaseTaxId.replace(/\s/g, '')
      return /^[0-9]{13}$/.test(cleanedJP)

    default:
      return false
  }
}

export function getTaxIdErrorMessage(countryCode: string): string {
  const country = countryCode.toLowerCase()

  if (country === 'others') {
    return 'Please enter a valid organization identifier (minimum 5 characters)'
  }

  const countryInfo = COUNTRY_TAX_MAP[country]

  if (!countryInfo) return 'Invalid country'

  const messages: Record<string, string> = {
    india: 'GSTIN must be 15 characters (e.g., 27AABCT1234F1Z0)',
    usa: 'EIN must be in format XX-XXXXXXX',
    uk: 'CRN must be 8 digits or 2 letters followed by 6 digits',
    canada: 'BN must be 9 digits, optionally followed by 2 letters',
    australia: 'ABN must be 11 digits',
    eu: 'VAT number must be 2 letters followed by 2-12 alphanumeric characters',
    singapore: 'UEN must be 9-12 characters',
    uae: 'VAT number must be 15 digits',
    new_zealand: 'NZBN must be 13 digits',
    brazil: 'CNPJ must be 14 digits',
    japan: 'Corporate Number must be 13 digits',
  }

  return messages[country] || `Invalid ${countryInfo.taxIdLabel}`
}
