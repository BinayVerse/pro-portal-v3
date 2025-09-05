// stores/analytics/types.ts
export interface AnalyticsState {
  loading: boolean;
  error: string | null;
  tokenDetails: any[];
  appTokenDetails: any[];
  orgDocList: any[];
  organizationDetails: any[];
  orgUserList: any[];
  userAppWiseTokenDetail: any[];
  activeUsersCount: number;
  totalQueriesCount: number;
}


export interface TokenUsageData {
  name: string;
  token_usage_details: TokenDetail[];
}

export interface TokenDetail {
  date: string;
  total_tokens: number;
  created_at: string;
}

export interface AppTokenUsage {
  name: string;
  total_tokens: number;
}

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  meta: {
    startDate: string;
    endDate: string;
    timezone: string;
    org_id: string;
    active_users_count: number;
    total_queries_count: number;
  };
}


export interface DocumentAnalysis {
  document_source: string;
  reference_count: number;
  questions?: any[];
}
