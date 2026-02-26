import { ref, computed, watch } from 'vue'
import { useOrganizationStore } from '~/stores/organization'
import { useAuthStore } from '~/stores/auth'

export function useSubscriptionCheck() {
  const orgStore = useOrganizationStore()
  const authStore = useAuthStore()
  const showSubscriptionModal = ref(false)
  const route = useRoute()

  const hasActiveSubscription = computed(() => {
    return orgStore.currentPlan?.plan !== null && orgStore.currentPlan?.plan !== undefined
  })

  const hasPlan = computed(() => {
    return !!orgStore.currentPlan?.plan
  })

  const shouldShowModal = computed(() => {
    // Don't show modal on plans page or when user is superadmin
    const isPlansPage = route.name === 'admin-plans'
    const isSuperAdmin = authStore.user?.role_id === 0

    return showSubscriptionModal.value && !isPlansPage && !isSuperAdmin
  })

  const checkSubscription = async (orgId?: string) => {
    try {
      const result = await orgStore.fetchOrgPlan(orgId)
      return result.success && !!orgStore.currentPlan?.plan
    } catch (error) {
      console.error('Failed to check subscription:', error)
      return false
    }
  }

  const showModal = () => {
    showSubscriptionModal.value = true
  }

  const closeModal = () => {
    showSubscriptionModal.value = false
  }

  const redirectToPlans = () => {
    navigateTo('/admin/plans')
  }

  // Watch route changes to update modal visibility
  watch(
    () => route.name,
    (newRouteName) => {
      if (newRouteName === 'admin-plans') {
        closeModal()
      }
    },
  )

  return {
    hasActiveSubscription,
    hasPlan,
    checkSubscription,
    showModal,
    closeModal,
    redirectToPlans,
    showSubscriptionModal,
    shouldShowModal,
  }
}
