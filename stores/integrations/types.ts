export interface IntegrationsOverview {
  userCounts: {
    whatsapp: number
    slack: number
    teams: number
    total: number
  }
  integrationStatus: {
    whatsapp: 'connected' | 'disconnected'
    slack: 'connected' | 'disconnected'
    teams: 'connected' | 'disconnected'
  }
  tokenUsage: {
    today: {
      messages: number
      tokens: number
      cost: number
    }
    allTime: {
      messages: number
      tokens: number
      cost: number
    }
  }
  integrationDetails: {
    whatsapp: {
      phoneNumber: string | null
      status: boolean
    }
    slack: {
      teamName: string | null
      status: string
    }
    teams: {
      status: string
      serviceUrl: string | null
    }
  }
}

export interface IntegrationActivity {
  id: string
  type: 'success' | 'info' | 'warning' | 'error'
  message: string
  time: string
  timestamp: Date
}

export interface ApiResponse<T> {
  statusCode: number
  status: 'success' | 'error' | 'partial'
  data: T
  message: string
}

// WhatsApp specific types
export interface BusinessWhatsAppDetails {
  business_whatsapp_number: string
  permanent_access_token: string
  app_id: string
  app_secret_key: string
}

export interface WhatsAppNumber {
  statusCode: number
  status: string
  data: {
    business_whatsapp_number: string
  }
  message: string
}

export interface WhatsAppAccountData {
  business_whatsapp_number: string | null
  whatsapp_status: boolean
  permanent_access_token: string | null
  app_id: string | null
  app_secret_key: string | null
}
