<!-- pages/admin/dashboard.vue -->
<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="space-y-1 sm:space-y-2">
      <h1 class="text-lg sm:text-xl lg:text-2xl font-bold text-white">Dashboard Overview</h1>
      <p class="text-xs sm:text-sm lg:text-base text-gray-400">
        Manage your artifact chatting platform from here.
      </p>
    </div>

    <!-- PLAN UPGRADE ALERT -->
    <PlanUpgradeAlert :data="usageAlertData" @upgrade="goToPlans" />

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 xl:gap-6">
      <!-- Total Users -->
      <div class="bg-dark-800 rounded-lg p-4 sm:p-6 border border-dark-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm font-medium">Total Users</p>

            <p :class="`text-lg font-bold mt-2 ${usersTextColor}`">
              {{
                loading
                  ? '...'
                  : `${stats.totalUsers} / ${profileStore.getUserProfile?.plan_details && (usersLimit === 0 || usersLimit === -1) ? 'Unlimited' : usersLimit || 0}`
              }}
            </p>
          </div>

          <div class="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <UIcon name="heroicons:users" class="w-6 h-6 text-blue-400" />
          </div>
        </div>
      </div>

      <!-- Artifacts -->
      <div class="bg-dark-800 rounded-lg p-6 border border-dark-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm font-medium">Artifacts</p>

            <p :class="`text-lg font-bold mt-2 ${artefactsTextColor}`">
              {{
                loading
                  ? '...'
                  : `${stats.totalArtefacts} / ${profileStore.getUserProfile?.plan_details && (artefactsLimit === 0 || artefactsLimit === -1) ? 'Unlimited' : artefactsLimit || 0}`
              }}
            </p>
          </div>

          <div class="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
            <UIcon name="heroicons:document-text" class="w-6 h-6 text-green-400" />
          </div>
        </div>
      </div>

      <!-- Conversations -->
      <div class="bg-dark-800 rounded-lg p-6 border border-dark-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm font-medium">Total Queries</p>

            <p :class="`text-lg font-bold mt-2 ${conversationsTextColor}`">
              {{
                loading
                  ? '...'
                  : `${stats.totalConversations} / ${profileStore.getUserProfile?.plan_details && (conversationsLimit === 0 || conversationsLimit === -1) ? 'Unlimited' : formatCompactNumber(conversationsLimit || 0)}`
              }}
            </p>
          </div>

          <div class="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <UIcon name="heroicons:chat-bubble-left-right" class="w-6 h-6 text-purple-400" />
          </div>
        </div>
      </div>

      <!-- Tokens Used -->
      <div class="bg-dark-800 rounded-lg p-6 border border-dark-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm font-medium">Tokens Used</p>

            <p class="text-lg font-bold mt-2">
              {{ loading ? '...' : `${formatCompactNumber(stats.tokensUsed)}` }}
            </p>
          </div>

          <div class="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
            <UIcon name="heroicons:bolt" class="w-6 h-6 text-orange-400" />
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 xl:gap-6">
      <!-- Recent Users -->
      <div class="bg-dark-800 rounded-lg border border-dark-700">
        <div
          class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border-b border-dark-700 gap-3 sm:gap-0"
        >
          <h2 class="text-base sm:text-lg font-semibold text-white">Recent Users</h2>
          <div class="text-sm text-gray-400">Latest user registrations and activity</div>
          <!-- :disabled="disableAddUser" -->
          <!-- :title="
              disableAddUser
                ? 'Please complete the Meta account integration to enable Add User and Bulk Upload features.'
                : ''
            " -->
          <button
            @click="navigateToUsers"
            :class="[
              'text-primary-400 hover:text-primary-300',
              'text-sm font-medium flex items-center gap-1',
            ]"
          >
            <UIcon name="heroicons:plus" class="w-4 h-4" />
            Add User
          </button>
        </div>
        <div class="p-4 sm:p-6">
          <div v-if="loading" class="space-y-4">
            <div v-for="i in 4" :key="i" class="flex items-center space-x-3 animate-pulse">
              <div class="w-10 h-10 bg-gray-600 rounded-full"></div>
              <div class="flex-1">
                <div class="h-4 bg-gray-600 rounded mb-2"></div>
                <div class="h-3 bg-gray-700 rounded w-2/3"></div>
              </div>
              <div class="h-6 w-16 bg-gray-600 rounded-full"></div>
            </div>
          </div>
          <UTable v-else :rows="recentUsers" :columns="userColumns">
            <template #name-data="{ row }">
              <div class="flex flex-col">
                <span class="text-white font-medium text-sm truncate">
                  {{ row.name }}
                </span>
              </div>
            </template>
            <template #email-data="{ row }">
              <div class="flex flex-col">
                <span class="text-white truncate">
                  {{ row.email }}
                </span>
              </div>
            </template>

            <template #status-data="{ row }">
              <UBadge :color="getStatusColor(row.status)" variant="soft" size="xs">
                {{ row.status }}
              </UBadge>
            </template>
          </UTable>
        </div>
      </div>

      <!-- Recent Documents -->
      <div class="bg-dark-800 rounded-lg border border-dark-700">
        <div
          class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border-b border-dark-700 gap-3 sm:gap-0"
        >
          <h2 class="text-base sm:text-lg font-semibold text-white">Recent Artifacts</h2>
          <div class="text-sm text-gray-400">Latest artifact uploads and processing status</div>
          <button
            @click="navigateToArtefacts"
            class="text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center gap-1"
          >
            <UIcon name="heroicons:cloud-arrow-up" class="w-4 h-4" />
            Upload
          </button>
        </div>
        <div class="p-4 sm:p-6">
          <div v-if="loading" class="space-y-4">
            <div v-for="i in 4" :key="i" class="flex items-center space-x-3 animate-pulse">
              <div class="flex-1">
                <div class="h-4 bg-gray-600 rounded mb-2"></div>
                <div class="h-3 bg-gray-700 rounded w-2/3"></div>
              </div>
              <div class="h-6 w-20 bg-gray-600 rounded"></div>
            </div>
          </div>
          <UTable v-else :rows="sortedArtefacts" :columns="artefactColumns">
            <template #fileInfo-data="{ row }">
              <div>
                <p class="text-white font-medium text-sm max-w-[24rem] truncate">{{ row.title }}</p>
                <!-- <p class="text-gray-400 text-xs max-w-[24rem] truncate">
                  {{ row.fileName }} • {{ formatFileSize(row.fileSize) }}
                </p> -->
              </div>
            </template>
            <template #status-data="{ row }">
              <UBadge :color="getArtefactStatusColor(row.status)" variant="soft" size="xs">
                {{ row.status }}
              </UBadge>
            </template>
            <template #updatedAt-data="{ row }">
              <span class="text-gray-400 text-xs">{{ row.updatedAt }}</span>
            </template>
          </UTable>
        </div>
      </div>
    </div>

    <!-- Platform Integrations -->
    <div class="bg-dark-800 rounded-lg border border-dark-700">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-b border-dark-700 gap-2 sm:gap-0">
        <h2 class="text-base sm:text-lg font-semibold text-white">Platform Integrations</h2>
        <div class="text-xs sm:text-sm text-gray-400">Manage connections to external platforms</div>
      </div>
      <div class="p-4 sm:p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
          <div
            v-for="integration in integrations"
            :key="integration.id"
            class="flex items-center justify-between p-4 bg-dark-900 rounded-lg border border-dark-700"
          >
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <UIcon
                  :name="getIntegrationIcon(integration.name)"
                  class="w-6 h-6"
                  :class="getIntegrationIconColor(integration.name)"
                />
              </div>
              <div>
                <p class="text-white font-medium">{{ integration.name }}</p>
                <p class="text-gray-400 text-sm">{{ integration.description }}</p>
              </div>
            </div>
            <UButton
              @click="navigateToIntegration(integration.path)"
              :color="integration.isConnected ? 'green' : 'blue'"
              size="xs"
              :icon="integration.isConnected ? 'heroicons:check' : 'heroicons:link'"
            >
              {{ integration.isConnected ? 'Manage' : 'Manage' }}
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Dashboard - Admin Dashboard - provento.ai' })
import { handleAuthError as handleAuthErrorShared } from '~/composables/useAuthError'
import PlanUpgradeAlert from '@/components/ui/PlanUpgradeAlert.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

// Import stores - keep only necessary ones
import { useAuthStore } from '~/stores'
import { useDashboardStore } from '~/stores/dashboard'
import { useProfileStore } from '~/stores/profile'

const profileStore = useProfileStore()

const planDetails = computed(() => profileStore.getUserProfile?.plan_details || {})

const loading = ref(true)
const authStore = useAuthStore()
const dashboardStore = useDashboardStore()

const authUser = computed(() => authStore.getAuthUser)

// Table columns
const userColumns = [
  { key: 'name', label: 'Name', sortable: false },
  { key: 'email', label: 'Email', sortable: false },
  { key: 'role', label: 'Role', sortable: false },
  { key: 'status', label: 'Status', sortable: false },
]

const artefactColumns = [
  { key: 'fileInfo', label: 'Artifact', sortable: false },
  { key: 'status', label: 'Status', sortable: false },
  { key: 'updatedAt', label: 'Updated At', sortable: false },
]

// Reactive data
const stats = ref({
  totalUsers: 0,
  userGrowth: 0,
  totalArtefacts: 0,
  artefactsToday: 0,
  totalConversations: 0,
  conversationGrowth: 0,
  tokensUsed: 0,
  tokenGrowth: 0,
  processedArtefacts: 0,
})

// ---- PLAN USAGE METRICS ----

// 1. Users usage
const usersLimit = computed(() => (planDetails.value as any)?.users || 0)
const usersUsage = computed(() => {
  const current = stats.value.totalUsers
  const limit = usersLimit.value
  const percentage = limit > 0 ? (current / limit) * 100 : 0
  return { name: 'Users', current, limit, percentage }
})

// 2. Artifacts usage
const artefactsLimit = computed(() => (planDetails.value as any)?.artefacts || 0)
const artefactsUsage = computed(() => {
  const current = stats.value.totalArtefacts
  const limit = artefactsLimit.value
  const percentage = limit > 0 ? (current / limit) * 100 : 0
  return { name: 'Artifacts', current, limit, percentage }
})

// 3. Conversations usage (Query Limit)
const conversationsLimit = computed(() => (planDetails.value as any)?.limit_requests || 0)
const conversationsUsage = computed(() => {
  const current = stats.value.totalConversations
  const limit = conversationsLimit.value
  const percentage = limit > 0 ? (current / limit) * 100 : 0
  return { name: 'Total Queries', current, limit, percentage }
})

// 4. Tokens usage (Token Limit)
const tokensLimit = computed(() => (planDetails.value as any)?.tokens || 0)
const tokensUsage = computed(() => {
  const current = stats.value.tokensUsed
  const limit = tokensLimit.value
  const percentage = limit > 0 ? (current / limit) * 100 : 0
  return { name: 'Tokens', current, limit, percentage }
})

const usageMetrics = computed(() => [
  usersUsage.value,
  artefactsUsage.value,
  conversationsUsage.value,
  tokensUsage.value,
])

const usageAlertData = computed(() => {
  const metrics = usageMetrics.value
  return {
    metrics,
    exceededMetrics: metrics.filter((m) => m.percentage >= 100),
    highMetrics: metrics.filter((m) => m.percentage >= 80 && m.percentage < 100),
    hasExceeded: metrics.some((m) => m.percentage >= 100),
    hasHigh: metrics.some((m) => m.percentage >= 80 && m.percentage < 100),
  }
})

const goToPlans = () => {
  navigateTo('/admin/plans')
}

const getUsageColor = (current: number, limit?: number) => {
  if (!limit) return 'text-white'
  const percent = (current / limit) * 100
  if (percent >= 100) return 'text-red-400'
  if (percent >= 80) return 'text-orange-400'
  return 'text-white'
}

// ---- COLOR CLASSES FOR DASHBOARD CARDS ----

// Users
const usersTextColor = computed(() => getUsageColor(stats.value.totalUsers, usersLimit.value))

// Artifacts
const artefactsTextColor = computed(() =>
  getUsageColor(stats.value.totalArtefacts, artefactsLimit.value),
)

// Conversations (queries)
const conversationsTextColor = computed(() =>
  getUsageColor(stats.value.totalConversations, conversationsLimit.value),
)

const recentUsers = ref([])
const recentArtefacts = ref([])
const integrations = ref([])

const isWhatsAppConnected = computed(() => {
  return integrations.value.some((i: any) => i.name === 'WhatsApp Business' && i.isConnected)
})

const formatTokens = (tokens: number) => {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`
  } else if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`
  }
  return tokens.toString()
}

const sortedArtefacts = computed(() => {
  const docs = [...recentArtefacts.value]

  docs.sort((a, b) => {
    const aTime = new Date(a.updated_at).getTime()
    const bTime = new Date(b.updated_at).getTime()
    return bTime - aTime // newest first
  })

  return docs
})

type BadgeColor = 'green' | 'red' | 'yellow' | 'gray'

const getStatusColor = (status: string): BadgeColor => {
  const colors: Record<string, BadgeColor> = {
    Active: 'green',
    Inactive: 'red',
    Pending: 'yellow',
  }
  return colors[status] || 'gray'
}

const getArtefactStatusColor = (status: string): BadgeColor => {
  const colors: Record<string, BadgeColor> = {
    processed: 'green',
    processing: 'yellow',
    failed: 'red',
  }
  return colors[status] || 'gray'
}

const getIntegrationIcon = (name: string) => {
  const iconMap: Record<string, string> = {
    Slack: 'mdi:slack',
    'Microsoft Teams': 'mdi:microsoft-teams',
    'WhatsApp Business': 'mdi:whatsapp',
  }
  return iconMap[name] || 'mdi:link'
}

const getIntegrationIconColor = (name: string) => {
  const colorMap: Record<string, string> = {
    Slack: 'text-purple-400',
    'Microsoft Teams': 'text-blue-400',
    'WhatsApp Business': 'text-green-400',
  }
  return colorMap[name] || 'text-gray-400'
}

// Fetch dashboard data (single API call)
const fetchDashboardData = async (orgId?: string | null) => {
  loading.value = true
  try {
    await dashboardStore.fetchDashboard(orgId)

    // Map recent users
    recentUsers.value = dashboardStore.recentUsers.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      status: u.status,
      role: u.role,
      updated_at: u.updated_at,
    }))

    // Map recent artifacts
    recentArtefacts.value = dashboardStore.recentArtefacts.map((d: any) => ({
      id: d.id,
      title: d.title,
      fileName: d.fileName,
      fileSize: d.fileSize,
      status: d.status,
      updatedAt: d.updatedAt,
    }))

    // Map integrations overview into UI integrations list
    if (dashboardStore.overview) {
      const overview = dashboardStore.overview
      integrations.value = [
        {
          id: 1,
          name: 'Slack',
          description: 'Team communication',
          isConnected: overview.integrationStatus?.slack === 'connected',
          path: '/admin/integrations/slack',
        },
        {
          id: 2,
          name: 'Microsoft Teams',
          description: 'Video conferencing',
          isConnected: overview.integrationStatus?.teams === 'connected',
          path: '/admin/integrations/teams',
        },
        {
          id: 3,
          name: 'WhatsApp Business',
          description: 'Customer messaging',
          isConnected: overview.integrationStatus?.whatsapp === 'connected',
          path: '/admin/integrations/whatsapp',
        },
      ]

      // Populate stats
      stats.value.totalUsers = overview.userCounts?.total || stats.value.totalUsers
      stats.value.totalArtefacts =
        overview.artefactsStats?.totalArtefacts || stats.value.totalArtefacts
      stats.value.processedArtefacts =
        overview.artefactsStats?.processedArtefacts || stats.value.processedArtefacts
      stats.value.tokensUsed = overview.tokenUsage?.allTime?.tokens || stats.value.tokensUsed
      // Map conversations count
      stats.value.totalConversations =
        overview.conversations?.total || stats.value.totalConversations
    }
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
    if (await handleAuthErrorShared(error)) return
    const { showError } = useNotification()
    showError('Failed to load dashboard data. Please try again.')
  } finally {
    loading.value = false
  }
}

import { useRoute } from 'vue-router'
const route = useRoute()

const getOrgQuery = () => {
  return route.query?.org || route.query?.org_id
    ? String(route.query?.org || route.query?.org_id)
    : null
}

const navigateToUsers = () => {
  const orgId = getOrgQuery()
  navigateTo(orgId ? { path: '/admin/users', query: { org: orgId } } : '/admin/users')
}

const navigateToArtefacts = () => {
  const orgId = getOrgQuery()
  navigateTo(orgId ? { path: '/admin/artefacts', query: { org: orgId } } : '/admin/artefacts')
}

// Navigate to integration path while preserving org query for superadmin
const navigateToIntegration = (path: string) => {
  const orgId = getOrgQuery()
  navigateTo(orgId ? { path, query: { org: orgId } } : path)
}

// Allow Add User for admin or superadmin regardless of WhatsApp connection
const isAdminOrSuperAdmin = computed(() => authStore.isAdmin || authStore.isSuperAdmin)
const disableAddUser = computed(() => !(isWhatsAppConnected.value || isAdminOrSuperAdmin.value))

onMounted(async () => {
  const orgId = getOrgQuery()
  await fetchDashboardData(orgId)
})
</script>
