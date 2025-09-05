<!-- pages/admin/dashboard.vue -->
<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-white mb-2">Dashboard Overview</h1>
      <p class="text-gray-400">Manage your artefact chatting platform from here.</p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Total Users -->
      <UCard class="bg-dark-800 border-dark-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm font-medium">Total Users</p>
            <p class="text-3xl font-bold text-white mt-2">
              {{ loading ? '...' : stats.totalUsers.toLocaleString() }}
            </p>
            <!-- <p class="text-sm mt-2">
              <span :class="stats.userGrowth >= 0 ? 'text-green-400' : 'text-red-400'">
                {{ stats.userGrowth >= 0 ? '+' : '' }}{{ stats.userGrowth }}% from last month
              </span>
            </p> -->
          </div>
          <div class="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <UIcon name="heroicons:users" class="w-6 h-6 text-blue-400" />
          </div>
        </div>
      </UCard>

      <!-- Documents -->
      <UCard class="bg-dark-800 border-dark-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm font-medium">Artefacts</p>
            <p class="text-3xl font-bold text-white mt-2">
              {{ loading ? '...' : stats.totalArtefacts.toLocaleString() }}
            </p>
            <!-- <p class="text-sm mt-2">
              <span class="text-green-400">+{{ stats.artefactsToday }} today</span>
            </p> -->
          </div>
          <div class="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
            <UIcon name="heroicons:document-text" class="w-6 h-6 text-green-400" />
          </div>
        </div>
      </UCard>

      <!-- Conversations -->
      <UCard class="bg-dark-800 border-dark-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm font-medium">Conversations</p>
            <p class="text-3xl font-bold text-white mt-2">
              {{ loading ? '...' : stats.totalConversations.toLocaleString() }}
            </p>
            <!-- <p class="text-sm mt-2">
              <span :class="stats.conversationGrowth >= 0 ? 'text-green-400' : 'text-red-400'">
                {{ stats.conversationGrowth >= 0 ? '+' : '' }}{{ stats.conversationGrowth }}% from last month
              </span>
            </p> -->
          </div>
          <div class="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <UIcon name="heroicons:chat-bubble-left-right" class="w-6 h-6 text-purple-400" />
          </div>
        </div>
      </UCard>

      <!-- Tokens Used -->
      <UCard class="bg-dark-800 border-dark-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm font-medium">Tokens Used</p>
            <p class="text-3xl font-bold text-white mt-2">
              {{ loading ? '...' : formatTokens(stats.tokensUsed) }}
            </p>
            <!-- <p class="text-sm mt-2">
              <span :class="stats.tokenGrowth >= 0 ? 'text-green-400' : 'text-red-400'">
                {{ stats.tokenGrowth >= 0 ? '+' : '' }}{{ stats.tokenGrowth }}% from last month
              </span>
            </p> -->
          </div>
          <div class="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
            <UIcon name="heroicons:bolt" class="w-6 h-6 text-orange-400" />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Main Content Grid -->
    <div class="grid lg:grid-cols-2 gap-6">
      <!-- Recent Users -->
      <div class="bg-dark-800 rounded-lg border border-dark-700">
        <div class="flex items-center justify-between p-6 border-b border-dark-700">
          <h2 class="text-lg font-semibold text-white">Recent Users</h2>
          <div class="text-sm text-gray-400">Latest user registrations and activity</div>
          <button @click="navigateTo('/admin/users')"
            class="text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center gap-1">
            <UIcon name="heroicons:plus" class="w-4 h-4" />
            Add User
          </button>
        </div>
        <div class="p-6">
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
        <div class="flex items-center justify-between p-6 border-b border-dark-700">
          <h2 class="text-lg font-semibold text-white">Recent Artefacts</h2>
          <div class="text-sm text-gray-400">Latest artefact uploads and processing status</div>
          <button @click="navigateTo('/admin/artefacts')"
            class="text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center gap-1">
            <UIcon name="heroicons:cloud-arrow-up" class="w-4 h-4" />
            Upload
          </button>
        </div>
        <div class="p-6">
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
            <template #createdAt-data="{ row }">
              <span class="text-gray-400 text-xs">{{ formatTime(row.createdAt) }}</span>
            </template>
          </UTable>
        </div>
      </div>
    </div>

    <!-- Platform Integrations -->
    <div class="bg-dark-800 rounded-lg border border-dark-700">
      <div class="flex items-center justify-between p-6 border-b border-dark-700">
        <h2 class="text-lg font-semibold text-white">Platform Integrations</h2>
        <div class="text-sm text-gray-400">Manage connections to external platforms</div>
      </div>
      <div class="p-6">
        <div class="grid md:grid-cols-3 gap-6">
          <div v-for="integration in integrations" :key="integration.id"
            class="flex items-center justify-between p-4 bg-dark-900 rounded-lg border border-dark-700">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <UIcon :name="getIntegrationIcon(integration.name)" class="w-6 h-6"
                  :class="getIntegrationIconColor(integration.name)" />
              </div>
              <div>
                <p class="text-white font-medium">{{ integration.name }}</p>
                <p class="text-gray-400 text-sm">{{ integration.description }}</p>
              </div>
            </div>
            <UButton @click="navigateTo(integration.path)" :color="integration.isConnected ? 'green' : 'blue'" size="xs"
              :icon="integration.isConnected ? 'heroicons:check' : 'heroicons:link'">
              {{ integration.isConnected ? 'Connected' : 'Connect' }}
            </UButton>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDateTime } from '~/utils'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

// Import stores - UPDATED PATHS
import { useArtefactsStore } from '~/stores/artefacts'
import { useUsersStore, useIntegrationsStore, useAuthStore, useAnalyticsStore } from '~/stores'

const loading = ref(true)
const usersStore = useUsersStore()
const artefactsStore = useArtefactsStore()
const integrationsStore = useIntegrationsStore()
const authStore = useAuthStore()
const analyticsStore = useAnalyticsStore()

const authUser = computed(() => authStore.getAuthUser)

// Table columns
const userColumns = [
  { key: 'name', label: 'Name', sortable: false },
  { key: 'email', label: 'Email', sortable: false },
  { key: 'role', label: 'Role', sortable: false },
  { key: 'status', label: 'Status', sortable: false },
]

const artefactColumns = [
  { key: 'fileInfo', label: 'Artefact', sortable: false },
  { key: 'status', label: 'Status', sortable: false },
  { key: 'createdAt', label: 'Created', sortable: false },
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
})

const recentUsers = ref([])
const recentArtefacts = ref([])
const integrations = ref([])

// Get organization ID from auth user
const organizationId = computed(() => authUser.value?.org_id)

const formatTokens = (tokens: number) => {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`
  } else if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`
  }
  return tokens.toString()
}

const formatTime = (date: Date) => {
  return formatDateTime(date)
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
    Pending: 'yellow'
  }
  return colors[status] || 'gray'
}

const getArtefactStatusColor = (status: string): BadgeColor => {
  const colors: Record<string, BadgeColor> = {
    processed: 'green',
    processing: 'yellow',
    failed: 'red'
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

// Fetch dashboard data
const fetchDashboardData = async () => {
  loading.value = true
  try {
    await fetchUsersData()
    await fetchArtefactsData()
    await fetchIntegrationsData()
    await fetchStatsData()

  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
    const { showError } = useNotification()
    showError('Failed to load dashboard data. Please try again.')
  } finally {
    loading.value = false
  }
}

// Fetch users data
const fetchUsersData = async () => {
  try {
    await usersStore.fetchUsers()

    // First sort by updated_at, then take top 5
    const sortedUsers = [...usersStore.users].sort((a, b) => {
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })

    // Update recent users with sorted data INCLUDING updated_at
    recentUsers.value = sortedUsers.slice(0, 5).map(user => ({
      id: user.user_id,
      name: user.name,
      email: user.email,
      status: user.status || 'Active',
      role: user.role,
      updated_at: user.updated_at // Add this line
    }))
    stats.value.totalUsers = usersStore.users.length
  } catch (error) {
    console.error('Failed to fetch users data:', error)
    throw error
  }
}
// Fetch artefacts data
const fetchArtefactsData = async () => {
  try {
    await artefactsStore.fetchArtefacts()

    // Update recent artefacts with proper date handling
    recentArtefacts.value = artefactsStore.artefacts.slice(0, 5).map(artefact => ({
      id: artefact.id,
      title: artefact.name,
      fileName: artefact.name,
      fileSize: artefact.file_size || 0,
      status: artefact.status,
      createdAt: artefact.created_at
        ? formatDateTime(artefact.created_at)
        : formatDateTime(artefact.updatedAt)
    }))


    stats.value.totalArtefacts = artefactsStore.stats.totalArtefacts
  } catch (error) {
    console.error('Failed to fetch artefacts data:', error)
    throw error
  }
}
// Fetch integrations data
const fetchIntegrationsData = async () => {
  try {

    const response = await integrationsStore.fetchOverview(true)

    if (response.success) {

      integrations.value = [
        {
          id: 1,
          name: 'Slack',
          description: 'Team communication',
          isConnected: integrationsStore.getIntegrationStatus('slack') === 'connected',
          path: '/admin/integrations/slack',
        },
        {
          id: 2,
          name: 'Microsoft Teams',
          description: 'Video conferencing',
          isConnected: integrationsStore.getIntegrationStatus('teams') === 'connected',
          path: '/admin/integrations/teams',
        },
        {
          id: 3,
          name: 'WhatsApp Business',
          description: 'Customer messaging',
          isConnected: integrationsStore.getIntegrationStatus('whatsapp') === 'connected',
          path: '/admin/integrations/whatsapp',
        },
      ]
    } else {
      console.error('fetchOverview failed:', response.message)
    }
  } catch (error) {
    console.error('Failed to fetch integrations data:', error)
    throw error
  }
}


const fetchStatsData = async () => {
  try {
    const tokenUsage = integrationsStore.getTokenUsageAllTime
    stats.value.totalConversations = tokenUsage.messages
    stats.value.tokensUsed = tokenUsage.tokens

  } catch (error) {
    console.error('Failed to fetch stats data:', error)
  }
}

onMounted(async () => {
  await fetchDashboardData()
  await analyticsStore.fetchOrganizationDetail(organizationId.value)
})
</script>