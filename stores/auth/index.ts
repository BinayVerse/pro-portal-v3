import type { AuthUser, ApiResponse } from "./types";
import { handleAuthError as handleAuthErrorShared, clearAuth } from '~/composables/useAuthError'
import { useErrorStore } from '~/stores/error'
import { useChatStore } from '~/stores/chat'
import { useLogger } from '~/composables/useLogger'

export const useAuthStore = defineStore("authStore", {
  state: () => ({
    user: null as AuthUser | null,
    token: null as string | null,
    loading: false,
    error: null as string | null,
    initialized: false,
  }),

  getters: {
    isLoggedIn: (state) => !!state.user && !!state.token,
    isAuthenticated: (state) => !!state.user && !!state.token,
    isAdmin: (state) => state.user?.role_id === 1,
    isSuperAdmin: (state) => state.user?.role_id === 0,
    getAuthUser(state) {
      return state.user || null
    },
  },

  actions: {
    // Helper methods
    setLoading(status: boolean) {
      this.loading = status;
    },

    setError(error: string | null) {
      this.error = error;
    },

    async handleAuthError(err: any): Promise<boolean> {
      return await handleAuthErrorShared(err)
    },

    privateHandleError(error: any, fallbackMessage: string): string {
      const message =
        error?.response?._data?.message ||
        error?.response?.data?.message ||
        error?.message ||
        fallbackMessage

      this.error = message

      const errorStore = useErrorStore()
      errorStore.showError(message)

      return message
    },



    setAuthUser(user: AuthUser | null, token?: string | null) {
      this.user = user;
      this.token = token || null;

      if (process.client) {
        if (user && token) {
          localStorage.setItem("authUser", JSON.stringify(user));
          localStorage.setItem("authToken", token);
        } else {
          localStorage.removeItem("authUser");
          localStorage.removeItem("authToken");
        }
      }
    },

    // Generic API call handler
    async apiCall<T>(endpoint: string, data?: any): Promise<T> {
      try {
        const response = await $fetch<ApiResponse<T>>(endpoint, {
          method: "POST",
          body: data,
          ignoreResponseError: true,
        });

        if (response?.status === "success") {
          return response as T;   // 🔥 always return full response
        }

        if (response?.status === "error") {
          const errorMessage = response.message || "Operation failed";
          this.setError(errorMessage);
          throw new Error(errorMessage);
        }

        throw new Error("Unexpected response");

      } catch (error: any) {
        const msg = this.privateHandleError(error, 'An unexpected error occurred')
        throw new Error(msg)
      }
    },

    // Initialize store from localStorage or cookies
    async initializeAuth() {
      if (this.initialized) return;

      try {
        let user = null;
        let token = null;

        if (process.client) {
          // Client-side: try localStorage first
          const storedUser = localStorage.getItem("authUser");
          const storedToken = localStorage.getItem("authToken");

          if (storedUser && storedToken) {
            try {
              user = JSON.parse(storedUser);
              token = storedToken;
            } catch (e) {
              localStorage.removeItem("authUser");
              localStorage.removeItem("authToken");
            }
          } else {
            // If localStorage doesn't have auth but a cookie exists (SSR set), try reading cookie on client
            const tokenCookie = useCookie('auth-token');
            if (tokenCookie?.value) {
              token = tokenCookie.value;
              try {
                const response = await $fetch('/api/auth/profile', {
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (response?.status === 'success') {
                  user = response.data;
                  // persist to localStorage for subsequent client loads
                  try {
                    localStorage.setItem('authToken', token);
                    localStorage.setItem('authUser', JSON.stringify(user));
                  } catch (e) {
                    // ignore localStorage errors
                  }
                } else {
                  // invalid token in cookie
                  tokenCookie.value = null;
                }
              } catch (err) {
                tokenCookie.value = null;
              }
            }
          }
        } else {
          // Server-side: try cookies
          const tokenCookie = useCookie('auth-token', {
            secure: true,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
          });

          if (tokenCookie.value) {
            token = tokenCookie.value;
            // Validate token and get user info
            try {
              const response = await $fetch('/api/auth/profile', {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });

              if (response.status === 'success') {
                user = response.data;
              }
            } catch (error) {
              // Token is invalid, clear it
              tokenCookie.value = null;
            }
          }
        }

        if (user && token) {
          // Validate token before setting auth state
          try {
            const response = await $fetch('/api/auth/profile', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            if (response.status === 'success') {
              this.user = user;
              this.token = token;

              // 🔑 Load user departments after auth is set
              if (process.client && user.user_id) {
                try {
                  const usersStore = useUsersStore();
                  const deptIds = await usersStore.fetchUserDepartments(user.user_id);
                  // Add departments to user object
                  this.user = { ...this.user, departments: deptIds };
                } catch (deptError) {
                  // Silently fail if departments can't be loaded
                  // User is still authenticated, just without department info
                  console.warn('Failed to load user departments during auth initialization:', deptError);
                }
              }

              // Sync with cookies for SSR
              if (process.client) {
                const tokenCookie = useCookie('auth-token', {
                  secure: true,
                  sameSite: 'lax',
                  maxAge: 60 * 60 * 24 * 7
                });
                tokenCookie.value = token;
              }
            } else {
              await this.clearAuth();
            }
          } catch (error) {
            // Token validation failed
            await this.clearAuth();
          }
        }
      } finally {
        this.initialized = true;
      }
    },

    async clearAuth() {
      this.user = null;
      this.token = null;

      // Clear chat store when clearing auth
      try {
        const chatStore = useChatStore();
        chatStore.clearChat();
        if (process.client) {
          const router = useRouter()
          router.replace({ query: {} })
        }
      } catch (e) {
        // ignore if chat store not available
      }

      if (process.client) {
        localStorage.removeItem("authUser");
        localStorage.removeItem("authToken");
      }

      const tokenCookie = useCookie('auth-token');
      tokenCookie.value = null;
    },

    // Initialize store from localStorage (legacy support)
    initializeStore() {
      return this.initializeAuth();
    },

    // Auth actions
    async signup(formData: Record<string, any>) {
      this.setLoading(true);
      this.setError(null);

      try {
        await this.apiCall("/api/auth/signup", formData);
        this.setAuthUser(null);
      } finally {
        this.setLoading(false);
      }
    },

    async signIn(credentials: { email: string; password: string }) {
      this.setLoading(true);
      this.setError(null);

      try {
        const response: any = await this.apiCall("/api/auth/signin", credentials);

        // 🔐 CASE 1: FINAL LOGIN (no 2FA - fallback / future)
        if (response.user && response.token) {
          this.setAuthUser(response.user, response.token);

          const tokenCookie = useCookie('auth-token', {
            secure: true,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7
          });
          tokenCookie.value = response.token;

          return response;
        }

        // 🔐 CASE 2: 2FA SETUP REQUIRED
        if (response.requires_2fa_setup) {
          return {
            requires_2fa_setup: true,
            temp_token: response.temp_token,
            email: response.user?.email
          };
        }

        // 🔐 CASE 3: OTP REQUIRED
        if (response.requires_otp) {
          return {
            requires_otp: true,
            temp_token: response.temp_token,
            email: response.user?.email
          };
        }

        throw new Error("Invalid login response");

      } finally {
        this.setLoading(false);
      }
    },

    async googleSignIn(formData: Record<string, any>) {
      this.setLoading(true);
      this.setError(null);

      try {
        const response: any = await this.apiCall("/api/auth/google-signin", formData);

        // ✅ CASE 1: Direct login (profile incomplete)
        if (response.user && response.token) {
          this.setAuthUser(response.user, response.token);

          const tokenCookie = useCookie('auth-token', {
            secure: true,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7
          });
          tokenCookie.value = response.token;
        }

        return response;

      } finally {
        this.setLoading(false);
      }
    },

    async resetPassword(formData: Record<string, any>) {
      this.setLoading(true);
      this.setError(null);

      try {
        const response = await this.apiCall("/api/auth/reset-password", formData);
        return response;
      } finally {
        this.setLoading(false);
      }
    },

    async updatePassword(formData: Record<string, any>) {
      this.setLoading(true);
      this.setError(null);

      try {
        const response = await this.apiCall("/api/auth/update-password", formData);
        await this.clearAuth();
        return response;
      } finally {
        this.setLoading(false);
      }
    },

    async changePassword(formData: Record<string, any>) {
      this.setLoading(true);
      this.setError(null);
      try {
        const token = this.token || useCookie('auth-token')?.value
        const response = await $fetch('/api/auth/change-password', {
          method: 'POST',
          body: formData,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        return response
      } catch (error) {
        // Handle authentication errors first
        if (!await this.handleAuthError(error)) {
          this.privateHandleError(error, 'Failed to change password')
        }
      } finally {
        this.setLoading(false);
      }
    },

    async signOut() {
      try {
        await this.clearAuth();
        await navigateTo("/");
      } catch (error: any) {
        const { error: logError } = useLogger()
        logError("Error during logout", error)
      }
    },

    async fetchCurrentUser() {
      if (!this.token) return null;

      try {
        const response = await $fetch('/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        });

        if (response.status === 'success') {
          this.user = response.data;

          // 🔑 Load user departments after fetching current user
          if (process.client && this.user.user_id) {
            try {
              const usersStore = useUsersStore();
              const deptIds = await usersStore.fetchUserDepartments(this.user.user_id);
              // Add departments to user object
              this.user = { ...this.user, departments: deptIds };
            } catch (deptError) {
              // Silently fail if departments can't be loaded
              const { warn } = useLogger()
              warn('Failed to load user departments in fetchCurrentUser', { error: deptError })
            }
          }

          return this.user;
        } else {
          await this.clearAuth();
          return null;
        }
      } catch (error) {
        await this.clearAuth();
        return null;
      }
    },

    async handlePostLoginRedirect() {
      if (!process.client) return;

      const route = useRoute();
      const queryRedirect = (route.query.redirect as string) || '';

      // Super admin goes to superadmin dashboard regardless of query redirect
      if (this.user?.role_id === 0) {
        await navigateTo('/admin/superadmin');
        return;
      }

      const fallback = '/admin/dashboard';
      await navigateTo(queryRedirect || fallback);
    },

    async setup2FA(tempToken: string) {
      this.setLoading(true);

      try {
        const res: any = await this.apiCall('/api/auth/2fa/setup', {
          temp_token: tempToken
        });

        return res; // { qrCode, manualKey }

      } finally {
        this.setLoading(false);
      }
    },

    async verify2FASetup(tempToken: string, otp: string) {
      this.setLoading(true);

      try {
        const res: any = await this.apiCall('/api/auth/2fa/verify-setup', {
          temp_token: tempToken,
          otp
        });

        // ✅ FINAL LOGIN HERE
        if (res.access_token) {
          const token = res.access_token;

          const tokenCookie = useCookie('auth-token', {
            secure: true,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7
          });

          tokenCookie.value = token;

          // fetch user after login
          await this.fetchCurrentUser();

          return res;
        }

        throw new Error('Invalid verification response');

      } finally {
        this.setLoading(false);
      }
    },

    async verifyOTPLogin(tempToken: string, otp: string) {
      this.setLoading(true);

      try {
        const res: any = await this.apiCall('/api/auth/2fa/verify', {
          temp_token: tempToken,
          otp
        });

        if (res.access_token) {
          const token = res.access_token;

          // ✅ Set auth state
          this.setAuthUser(res.user, token);

          // ✅ Set cookie
          const tokenCookie = useCookie('auth-token', {
            secure: true,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7
          });
          tokenCookie.value = token;

          return res;
        }

        throw new Error('Invalid OTP response');

      } finally {
        this.setLoading(false);
      }
    },
  },
});
