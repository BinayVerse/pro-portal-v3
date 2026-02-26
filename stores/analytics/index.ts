import type {
  AnalyticsState,
  TokenUsageData,
  AppTokenUsage,
  ApiResponse,
  DocumentAnalysis,
} from './types';
import { handleError, handleSuccess, extractErrors } from '../../utils/apiHandler'
import { handleAuthError as handleAuthErrorShared } from '~/composables/useAuthError'

export const useAnalyticsStore = defineStore('analyticsStore', {
  state: (): AnalyticsState => ({
    loading: false,
    error: null,
    tokenDetails: [],
    appTokenDetails: [],
    orgDocList: [],
    organizationDetails: null,
    orgUserList: [],
    userAppWiseTokenDetail: [] as AppTokenUsage[],
    activeUsersCount: 0,
    totalQueriesCount: 0,
    departmentBarChartData: [],
    departmentPieChartData: [],
    departmentAnalyticsLoading: false,
  }),

  getters: {
    isLoading: (state): boolean => state.loading,
    getError: (state): string | null => state.error,
    getTokenDetails: (state): TokenUsageData[] => state.tokenDetails,
    getAppTokenDetails: (state): AppTokenUsage[] => state.appTokenDetails,
    getOrgDocList: (state): DocumentAnalysis[] => state.orgDocList,
    getOrganizationDetails: (state): any | null => state.organizationDetails,
    getOrganizationUsers: (state): any[] => state.orgUserList,
    getUserAppWiseTokenDetail: (state): AppTokenUsage[] => state.userAppWiseTokenDetail,
    
  // For Bar Chart: Users vs Artifacts by Department - HORIZONTAL layout
  // X-axis: Count, Y-axis: Departments
  getDepartmentBarChartData: (state): any => {    
    if (!state.departmentBarChartData || state.departmentBarChartData.length === 0) {
      return {
        departments: [],
        userCounts: [],
        artifactCounts: []
      };
    }
    
    // Sort departments by total count (users + artifacts) descending
    const sortedData = [...state.departmentBarChartData].sort((a, b) => {
      const aTotal = (Number(a.user_count) || 0) + (Number(a.artifact_count) || 0);
      const bTotal = (Number(b.user_count) || 0) + (Number(b.artifact_count) || 0);
      return bTotal - aTotal;
    });
    
    const departments = sortedData.map(d => d.department_name);
    const userCounts = sortedData.map(d => Number(d.user_count) || 0);
    const artifactCounts = sortedData.map(d => Number(d.artifact_count) || 0);
    
    const result = {
      departments,
      userCounts,
      artifactCounts
    };
    
    return result;
  },
  
  // For Pie Chart: User Distribution by Department
  getDepartmentPieChartData: (state): any[] => {    
    if (!state.departmentPieChartData || state.departmentPieChartData.length === 0) {
      return [];
    }
    
    // Include ALL departments, even those with 0 users
    const result = state.departmentPieChartData
      .map((item: any) => {
        // Handle both possible response formats
        const name = item.name || item.department_name || 'Unknown';
        const value = Number(item.users || item.user_count || 0);
        const percentage = Number(item.percentage || 0);
        
        return {
          name,
          value,
          percentage
        };
      })
      .sort((a, b) => b.value - a.value);
      return result;
  },
},

  actions: {
    handleError(error: any, defaultMessage: string, silent: boolean = false): string {
      const msg = handleError(error, defaultMessage, silent)
      this.error = msg
      return msg
    },

    handleSuccess(message: string): void {
      this.error = null
      handleSuccess(message)
    },

    getAuthHeaders(): Record<string, string> {
      const token = localStorage.getItem('authToken');
      return {
        Authorization: `Bearer ${token}`,
      };
    },

    async fetchTokenWiseDetail(orgId: string, startDate: string, endDate: string, timezone: string) {
      try {
        this.loading = true;
        // build query string only for provided params
        const qs = new URLSearchParams();
        if (startDate) qs.append('startDate', startDate);
        if (endDate) qs.append('endDate', endDate);
        if (timezone) qs.append('timezone', timezone);
        const url = `/api/analytics/${orgId}/tokenData${qs.toString() ? `?${qs.toString()}` : ''}`;
        const response = await $fetch<{ data: TokenUsageData[] }>(url, { headers: this.getAuthHeaders() });
        this.tokenDetails = response.data || [];
      } catch (error) {
        if (await handleAuthErrorShared(error)) return;
        this.handleError(error, 'Failed to fetch token details');
      } finally {
        this.loading = false;
      }
    },

    async fetchAppWiseTokenDetail(orgId: string, startDate: string, endDate: string, timezone: string) {
      try {
        this.loading = true;
        const qs2 = new URLSearchParams();
        if (startDate) qs2.append('startDate', startDate);
        if (endDate) qs2.append('endDate', endDate);
        if (timezone) qs2.append('timezone', timezone);
        const url2 = `/api/analytics/${orgId}/appwiseTokenUsage${qs2.toString() ? `?${qs2.toString()}` : ''}`;
        const response = await $fetch<{ data: AppTokenUsage[] }>(url2, { headers: this.getAuthHeaders() });
        this.appTokenDetails = response.data || [];
      } catch (error) {
        if (await handleAuthErrorShared(error)) return;
        this.handleError(error, 'Failed to fetch app token usage');
      } finally {
        this.loading = false;
      }
    },

    async fetchUserAppWiseTokenDetail(orgId: string, startDate: string, endDate: string, timezone: string) {
      try {
        this.loading = true;

        const qs3 = new URLSearchParams();
        if (startDate) qs3.append('startDate', startDate);
        if (endDate) qs3.append('endDate', endDate);
        if (timezone) qs3.append('timezone', timezone);
        const url3 = `/api/analytics/${orgId}/userAppwiseTokenUsage${qs3.toString() ? `?${qs3.toString()}` : ''}`;

        const response = await $fetch<ApiResponse<AppTokenUsage[]>>(url3, { headers: this.getAuthHeaders() });

        this.userAppWiseTokenDetail = response.data;

        // Parse the counts to numbers
        this.activeUsersCount = Number(response.meta.active_users_count) || 0;
        // this.totalQueriesCount = Number(response.meta.total_queries_count) || 0;

      } catch (error) {
        if (await handleAuthErrorShared(error)) return;
        this.handleError(error, 'Failed to fetch app token usage');
      } finally {
        this.loading = false;
      }
    },
    async fetchOrganizationDetail(id: string, startDate?: string, endDate?: string, timezone?: string) {
      try {
        this.loading = true;

        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
        if (timezone) params.append("timezone", timezone);

        const response = await $fetch<{ data: any }>(
          `/api/analytics/${id}${params.toString() ? `?${params.toString()}` : ""}`,
          { headers: this.getAuthHeaders() }
        );

        this.organizationDetails = response.data || null;

        // Extract total_queries from the organization details
        if (response.data?.total_queries !== undefined) {
          this.totalQueriesCount = Number(response.data.total_queries) || 0;
        }
      } catch (error) {
        if (await handleAuthErrorShared(error)) return;
        this.handleError(error, 'Failed to fetch organization details');
      } finally {
        this.loading = false;
      }
    },

    async fetchOrganizationDocuments(id: string) {
      try {
        this.loading = true;
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        const response = await $fetch<{ data: DocumentAnalysis[] }>(
          `/api/analytics/${id}/documents`,
          {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: { timezone: userTimezone },
          }
        );

        this.orgDocList = response.data || [];
      } catch (error) {
        if (await handleAuthErrorShared(error)) return;
        this.handleError(error, 'Failed to fetch documents');
      } finally {
        this.loading = false;
      }
    },

    async fetchOrganizationUsers(id: string) {
      try {
        this.loading = true;
        const response = await $fetch<{ data: any[] }>(
          `/api/analytics/${id}/users`,
          { headers: this.getAuthHeaders() }
        );
        this.orgUserList = response.data || [];
      } catch (error) {
        if (await handleAuthErrorShared(error)) return;
        this.handleError(error, 'Failed to fetch users');
      } finally {
        this.loading = false;
      }
    },

    async fetchOrgDatas(id: string, startDate: string, endDate: string, timezone: string) {
      try {
        this.loading = true;
        await Promise.all([
          this.fetchTokenWiseDetail(id, startDate, endDate, timezone),
          this.fetchAppWiseTokenDetail(id, startDate, endDate, timezone),
          this.fetchUserAppWiseTokenDetail(id, startDate, endDate, timezone),
          this.fetchOrganizationDocuments(id),
        ]);
      } catch (error) {
        if (await handleAuthErrorShared(error)) return;
        this.handleError(error, 'Failed to fetch organization-related data');
      } finally {
        this.loading = false;
      }
    },

async fetchDepartmentAnalytics(orgId: string, timezone?: string) {
    try {
      this.departmentAnalyticsLoading = true;
      
      const params = new URLSearchParams();
      if (timezone) params.append('timezone', timezone);
      
      const url = `/api/analytics/${orgId}/department-analytics${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await $fetch<{ data: any }>(url, { 
        headers: this.getAuthHeaders() 
      });
      
      // FIX: Check the structure - the response.data contains bar_chart_data and pie_chart_data
      if (response.data) {
        // Reset arrays first to trigger reactivity
        this.departmentBarChartData = [];
        this.departmentPieChartData = [];
        
        // Then assign new data
        this.departmentBarChartData = response.data.bar_chart_data || [];
        this.departmentPieChartData = response.data.pie_chart_data || [];

      }
      
      return response;
    } catch (error) {
      if (await handleAuthErrorShared(error)) return;
      this.handleError(error, 'Failed to fetch department analytics');
    } finally {
      this.departmentAnalyticsLoading = false;
    }
  },
  }
});
