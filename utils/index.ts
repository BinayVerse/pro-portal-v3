import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const PAYMENT_ONLY_FIELDS = [
  'gwToken',
  'paidAmount',
  'amount',
  'couponCode',
  'couponDurationType',
]
interface Industry {
  name: string
  slug: string
  description: string
  icon: string
  useCases: string[]
  disabled?: boolean
}

// Personal email domains list
export const personalEmailDomains = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'ymail.com',
  'rocketmail.com',
  'protonmail.com',
  'tutanota.com',
  'gmx.com',
  'mail.com',
  'zoho.com',
  'fastmail.com',
  'mailinator.com',
  '10minutemail.com',
  'guerrillamail.com',
  'tempmail.org',
];

/**
 * Check if an email address is from a personal email provider
 * @param email - The email address to check
 * @param domains - Array of personal email domains
 * @returns true if the email is from a personal provider
 */
export function isPersonalEmail(email: string, domains: string[]): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailDomain = email.toLowerCase().split('@')[1];
  if (!emailDomain) {
    return false;
  }

  return domains.includes(emailDomain);
}

/**
 * Format date in MM/DD/YYYY HH:MM AM/PM format
 * @param date - Date to format (can be Date object, string, or timestamp)
 * @returns Formatted date string in MM/DD/YYYY HH:MM AM/PM format
 * MM/DD/YYYY, hh:mm A
 */
export function formatDateTime(date: Date | string | number, userTimezone?: string, format = 'MM/DD/YYYY') {
  if (!date) return 'Unknown';

  const dateObj = dayjs.utc(date).tz(userTimezone);

  if (!dateObj.isValid()) return 'Unknown';

  return dateObj.format(format);
}

/**
 * Format date only in MM/DD/YYYY format
 * @param date - Date to format (can be Date object, string, or timestamp)
 * @returns Formatted date string in MM/DD/YYYY format
 */
export function formatDate(date: Date | string | number): string {
  if (!date) return '';

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';

  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  };

  return dateObj.toLocaleDateString('en-US', options);
}

/**
 * Format time only in HH:MM AM/PM format
 * @param date - Date to format (can be Date object, string, or timestamp)
 * @returns Formatted time string in HH:MM AM/PM format
 */
export function formatTime(date: Date | string | number): string {
  if (!date) return '';

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';

  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };

  return dateObj.toLocaleTimeString('en-US', options);
}

export function getCvvMask(cardType?: string) {
  const normalizedCardType = cardType?.toLowerCase()

  if (normalizedCardType === 'american express')
    return '****' // Amex cards have 4-digit CVV
  return '***' // Default for Visa, Mastercard, and other cards
}

export function buildSubscriptionMetadata(
  payload: any,
  userEmail: string,
  options: {
    isFree: boolean
  },
) {
  const { isFree } = options

  // 1️⃣ Clone payload safely
  const cleanPayload = { ...payload }

  // 2️⃣ Remove payment-only fields ALWAYS
  PAYMENT_ONLY_FIELDS.forEach((key) => {
    delete cleanPayload[key]
  })

  // 3️⃣ Build unified metadata
  return {
    type: isFree ? 'free' : 'paid',
    source: 'checkout',
    activated_by: userEmail,

    customer: {
      firstName: cleanPayload.firstName,
      lastName: cleanPayload.lastName,
      email: cleanPayload.email,
      phoneNumber: cleanPayload.phoneNumber,
    },

    organization: {
      name: cleanPayload.orgName,
      country: cleanPayload.country,
      region: cleanPayload.region,
      city: cleanPayload.city,
      zipcode: cleanPayload.zipcode,
      addressLine1: cleanPayload.addressLine1,
      addressLine2: cleanPayload.addressLine2,
    },

    plan: {
      id: cleanPayload.subscriptionTypeId,
      purchaseType: cleanPayload.purchaseType,
      planType: cleanPayload.planType,
      quantity: cleanPayload.quantity,
      currency: cleanPayload.currencyCode,
    },

    billing: {
      period: cleanPayload.planType,
      price: isFree ? 0 : payload.amount,
      currency: cleanPayload.currencyCode,
    },

    flags: {
      free: isFree,
      trial: isFree,
      auto_renew: !isFree,
    },
  }
}

export const industries: Industry[] = [
  {
    name: 'Finance & Banking',
    slug: 'finance-banking',
    description: 'Accelerate financial artifact processing and analysis.',
    icon: 'i-heroicons-currency-dollar',
    useCases: [
      'Risk assessment',
      'Compliance reports',
      'Financial analysis',
      'Audit documentation',
    ],
  },
  {
    name: 'Healthcare',
    slug: 'healthcare',
    description: 'Improve patient care with intelligent medical artifact analysis.',
    icon: 'i-heroicons-heart',
    useCases: [
      'Medical records',
      'Research studies',
      'Treatment protocols',
      'Patient documentation',
    ],
  },
  {
    name: 'Real Estate',
    slug: 'real-estate',
    description: 'Simplify property documentation and transaction management.',
    icon: 'i-heroicons-home',
    useCases: ['Property artifacts', 'Contracts & leases', 'Market analysis', 'Due diligence'],
  },
  {
    name: 'Insurance',
    slug: 'insurance',
    description: 'Streamline claims processing and risk assessment workflows.',
    icon: 'i-heroicons-shield-check',
    useCases: ['Claims processing', 'Policy analysis', 'Risk assessment', 'Underwriting'],
  },
  {
    name: 'Legal',
    slug: 'legal',
    description: 'Streamline legal artifact analysis and contract review processes.',
    icon: 'i-heroicons-scale',
    useCases: ['Contract analysis', 'Due diligence', 'Case research', 'Compliance review'],
  },
  {
    name: 'Manufacturing',
    slug: 'manufacturing',
    description: 'Optimize technical documentation and quality processes.',
    icon: 'i-heroicons-cog-6-tooth',
    useCases: [
      'Technical specifications',
      'Quality documentation',
      'Process manuals',
      'Compliance records',
    ],
  },
  {
    name: 'Education',
    slug: 'education',
    description: 'Enhance learning experiences with intelligent artifact interaction.',
    icon: 'i-heroicons-academic-cap',
    useCases: ['Research assistance', 'Study materials', 'Academic papers', 'Student support'],
  },
  {
    name: 'Government',
    slug: 'government',
    description: 'Modernize public sector artifact management and citizen services.',
    icon: 'i-heroicons-building-office',
    useCases: ['Policy artifacts', 'Public records', 'Regulatory compliance', 'Citizen services'],
  },
]
