import { useAuthStore } from '~/stores/auth/index'

export default defineNuxtRouteMiddleware(async (to, from) => {
  const authStore = useAuthStore()

  // Initialize auth store and wait for completion
  await authStore.initializeAuth()

  // Check if user is authenticated
  if (!authStore.isLoggedIn) {
    // Store the intended destination
    const redirectTo = to.fullPath

    // Redirect to login with return URL
    return navigateTo({
      path: '/login',
      query: { redirect: redirectTo },
    })
  }

  // If logged in user is a super admin, prevent access to regular admin pages
  // unless an organization has been selected (via query/params) — allow access to org-specific admin pages
  if (authStore.user?.role_id === 0) {
    // allow access to the superadmin page itself
    if (to.path.startsWith('/admin/superadmin')) return

    // If route contains organization identifier in query or params, allow access to organization admin pages
    const hasOrgInQuery = !!(to.query && (to.query.org || to.query.org_id))
    const hasOrgInParams = !!(to.params && (to.params.org || to.params.org_id))
    const allowOrgRoutes = hasOrgInQuery || hasOrgInParams || to.path.includes('/admin/superadmin-analytics')

    if (!allowOrgRoutes) {
      return navigateTo('/admin/superadmin')
    }
  }
})
