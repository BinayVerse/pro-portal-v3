export interface IntegrationProvider {
  id: string
  name: string
  code: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface IntegrationModule {
  id: string
  name: string
  code: string
  created_at: string
}

export interface IntegrationAgent {
  id: string
  name: string
  code: string
  created_at: string
}

export interface OrganizationIntegration {
  id: string
  organization_id: string
  provider_id: string
  agent_id: string
  module_id: string
  connection_name: string
  client_id: string
  /** @encrypted - Client secret is encrypted at rest and in transit */
  client_secret?: string
  /** @encrypted - API key is encrypted at rest and in transit */
  api_key?: string
  /** @encrypted - Access token is encrypted at rest and in transit */
  access_token?: string
  /** @encrypted - Refresh token is encrypted at rest and in transit */
  refresh_token?: string
  token_expiry?: string
  base_url?: string
  login_url?: string
  metadata_json?: Record<string, any>
  status: 'active' | 'inactive' | 'expired' | 'failed'
  created_at: string
  updated_at: string
  // Join fields from API response
  provider_name?: string
  provider_code?: string
  agent_name?: string
  agent_code?: string
  module_name?: string
  module_code?: string
}

/**
 * CreateIntegrationPayload
 * Note: Sensitive fields (client_secret, api_key, access_token, refresh_token) are encrypted
 * before being sent to the server. The store will handle the encryption automatically.
 */
export interface CreateIntegrationPayload {
  provider_id: string
  agent_id: string
  module_id: string
  connection_name: string
  client_id: string
  /** @encrypted - Will be encrypted before sending to server */
  client_secret: string
  /** @encrypted - Will be encrypted before sending to server */
  api_key: string
  /** @encrypted - Will be encrypted before sending to server */
  access_token: string
  /** @encrypted - Will be encrypted before sending to server */
  refresh_token?: string
  token_expiry?: string
  base_url?: string
  login_url?: string
  metadata_json?: Record<string, any>
  status?: 'active' | 'inactive' | 'expired' | 'failed'
  hrms_system?: string
  is_hrms?: boolean
}

/**
 * UpdateIntegrationPayload
 * Note: Sensitive fields (client_secret, api_key, access_token, refresh_token) are encrypted
 * before being sent to the server. The store will handle the encryption automatically.
 */
export interface UpdateIntegrationPayload {
  connection_name?: string
  client_id?: string
  /** @encrypted - Will be encrypted before sending to server */
  client_secret?: string
  /** @encrypted - Will be encrypted before sending to server */
  api_key?: string
  /** @encrypted - Will be encrypted before sending to server */
  access_token?: string
  /** @encrypted - Will be encrypted before sending to server */
  refresh_token?: string
  token_expiry?: string
  base_url?: string
  login_url?: string
  metadata_json?: Record<string, any>
  status?: 'active' | 'inactive' | 'expired' | 'failed'
  hrms_system?: string
  is_hrms?: boolean
}

export interface IntegrationRelationships {
  agentModules: Array<{ agent_id: string; module_id: string }>
  agentProviders: Array<{ agent_id: string; provider_id: string }>
  providerModules: Array<{ provider_id: string; module_id: string }>
}

export interface GroupedIntegration {
  provider_id: string
  agent_id: string
  module_id: string
  provider_name: string
  provider_code: string
  agent_name: string
  agent_code: string
  module_name: string
  module_code: string
  connections: OrganizationIntegration[]
}

export interface ApiResponse<T> {
  statusCode: number
  status: 'success' | 'error'
  data?: T
  message: string
}
