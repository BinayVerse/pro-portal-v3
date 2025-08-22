import { z } from 'zod'

const requestForOptions = ['legal', 'hr', 'finance', 'research', 'customer-support', 'other'] as const
const companySizeOptions = ['1-10', '11-50', '51-200', '201-1000', '1000+'] as const

export const ContactUsValidation = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  lastname: z.string().min(1, 'Last name is required').max(255, 'Last name too long'),
  email: z.string().email('Invalid email format').max(255, 'Email too long'),
  phone: z.string().max(20, 'Phone number too long').optional(),
  message: z.string().max(1000, 'Message too long').optional(),
  requestFor: z.enum(requestForOptions, {
    errorMap: () => ({ message: 'Request type must be one of: legal, hr, finance, research, customer-support, other' })
  }).optional(),
  company: z.string().max(255, 'Company name too long').optional(),
  jobTitle: z.string().max(255, 'Job title too long').optional(),
  companySize: z.enum(companySizeOptions, {
    errorMap: () => ({ message: 'Company size must be one of: 1-10, 11-50, 51-200, 201-1000, 1000+' })
  }).optional(),
  token: z.string().min(1, 'reCAPTCHA token is required'),
  domain: z.string().optional()
})

export type ContactUsData = z.infer<typeof ContactUsValidation>
