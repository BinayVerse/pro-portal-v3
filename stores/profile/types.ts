export interface PlanDetails {
  id: string
  title: string
  price_currency: string
  price_amount: string
  duration: string
  users: number
  limit_requests: number
  // add_ons_unlimited_requests: boolean
  // add_ons_price: string
  features: string[]
  trial_period_days: number
  storage_limit_gb: number
  support_level: string
  artefacts: number
  metadata: Record<string, any>
}

export interface BillingAddress {
  id?: string
  name?: string
  contact_number?: string
  email?: string
  address_line1?: string
  address_line2?: string
  address_city?: string
  address_state?: string
  address_zip?: string
  address_country?: string
  address_phone?: string
}

export interface UserProfile {
  user_id: string | number
  name: string
  email: string
  company: string
  contact_number?: string
  whatsappNumber?: string
  primary_contact: boolean
  org_id?: string
  role_id?: number
  plan_id?: string
  plan_name?: string
  plan_details?: PlanDetails | null
  subscription_status?: any
  isCompanyRegistered?: boolean
  org_country?: string
  org_tax_id?: string
  billing_address?: BillingAddress
  plan_expiry?: string | null
  has_availed_free_plan?: boolean
  has_availed_paid_plan?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface UserProfileState {
  userProfile: UserProfile | null
  profileStatus: string // 'complete' or 'incomplete'
  profileMessage: string | null
  loading: boolean
}
