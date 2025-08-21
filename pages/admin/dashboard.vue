<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-white mb-2">Dashboard Overview</h1>
      <p class="text-gray-400">Manage your document chatting platform from here.</p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Total Users -->
      <div class="bg-dark-800 rounded-lg p-6 border border-dark-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm font-medium">Total Users</p>
            <p class="text-3xl font-bold text-white mt-2">
              {{ loading ? '...' : stats.totalUsers.toLocaleString() }}
            </p>
            <p class="text-sm mt-2">
              <span class="text-green-400">+{{ stats.userGrowth }}% from last month</span>
            </p>
          </div>
          <div class="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <svg
              class="w-6 h-6 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              ></path>
            </svg>
          </div>
        </div>
      </div>

      <!-- Documents -->
      <div class="bg-dark-800 rounded-lg p-6 border border-dark-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm font-medium">Documents</p>
            <p class="text-3xl font-bold text-white mt-2">
              {{ loading ? '...' : stats.totalDocuments.toLocaleString() }}
            </p>
            <p class="text-sm mt-2">
              <span class="text-green-400">+{{ stats.documentsToday }} today</span>
            </p>
          </div>
          <div class="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
            <svg
              class="w-6 h-6 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              ></path>
            </svg>
          </div>
        </div>
      </div>

      <!-- Conversations -->
      <div class="bg-dark-800 rounded-lg p-6 border border-dark-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm font-medium">Conversations</p>
            <p class="text-3xl font-bold text-white mt-2">
              {{ loading ? '...' : stats.totalConversations.toLocaleString() }}
            </p>
            <p class="text-sm mt-2">
              <span class="text-green-400">+{{ stats.conversationGrowth }}% from last month</span>
            </p>
          </div>
          <div class="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <svg
              class="w-6 h-6 text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              ></path>
            </svg>
          </div>
        </div>
      </div>

      <!-- Tokens Used -->
      <div class="bg-dark-800 rounded-lg p-6 border border-dark-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm font-medium">Tokens Used</p>
            <p class="text-3xl font-bold text-white mt-2">
              {{ loading ? '...' : formatTokens(stats.tokensUsed) }}
            </p>
            <p class="text-sm mt-2">
              <span class="text-green-400">+{{ stats.tokenGrowth }}% from last month</span>
            </p>
          </div>
          <div class="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
            <svg
              class="w-6 h-6 text-orange-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              ></path>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid lg:grid-cols-2 gap-6">
      <!-- Recent Users -->
      <div class="bg-dark-800 rounded-lg border border-dark-700">
        <div class="flex items-center justify-between p-6 border-b border-dark-700">
          <h2 class="text-lg font-semibold text-white">Recent Users</h2>
          <div class="text-sm text-gray-400">Latest user registrations and activity</div>
          <button
            @click="navigateTo('/admin/users')"
            class="text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center gap-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              ></path>
            </svg>
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
          <div v-else class="space-y-4">
            <div
              v-for="user in recentUsers"
              :key="user.id"
              class="flex items-center justify-between"
            >
              <div class="flex items-center space-x-3">
                <div
                  class="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center"
                >
                  <span class="text-primary-400 font-medium text-sm">{{ user.initials }}</span>
                </div>
                <div>
                  <p class="text-white font-medium">{{ user.name }}</p>
                  <p class="text-gray-400 text-sm">{{ user.email }}</p>
                </div>
              </div>
              <div class="text-right">
                <span
                  :class="getUserStatusClass(user.status)"
                  class="px-2 py-1 text-xs rounded-full font-medium"
                >
                  {{ user.status }}
                </span>
                <p class="text-gray-400 text-xs mt-1">{{ user.role }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Documents -->
      <div class="bg-dark-800 rounded-lg border border-dark-700">
        <div class="flex items-center justify-between p-6 border-b border-dark-700">
          <h2 class="text-lg font-semibold text-white">Recent Documents</h2>
          <div class="text-sm text-gray-400">Latest document uploads and processing status</div>
          <button
            @click="navigateTo('/admin/documents')"
            class="text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center gap-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
              ></path>
            </svg>
            Upload
          </button>
        </div>
        <div class="p-6">
          <div v-if="loading" class="space-y-4">
            <div v-for="i in 4" :key="i" class="flex items-center space-x-3 animate-pulse">
              <div class="w-10 h-10 bg-gray-600 rounded"></div>
              <div class="flex-1">
                <div class="h-4 bg-gray-600 rounded mb-2"></div>
                <div class="h-3 bg-gray-700 rounded w-2/3"></div>
              </div>
              <div class="h-6 w-20 bg-gray-600 rounded"></div>
            </div>
          </div>
          <div v-else class="space-y-4">
            <div
              v-for="doc in recentDocuments"
              :key="doc.id"
              class="flex items-center justify-between"
            >
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-primary-500/20 rounded flex items-center justify-center">
                  <svg
                    class="w-5 h-5 text-primary-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    ></path>
                  </svg>
                </div>
                <div>
                  <p class="text-white font-medium">{{ doc.title }}</p>
                  <p class="text-gray-400 text-sm">
                    {{ doc.fileName }} • {{ formatFileSize(doc.fileSize) }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <span
                  :class="getDocumentStatusClass(doc.status)"
                  class="px-2 py-1 text-xs rounded font-medium"
                >
                  {{ doc.status }}
                </span>
                <p class="text-gray-400 text-xs mt-1">{{ formatTime(doc.createdAt) }}</p>
              </div>
            </div>
          </div>
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
          <div
            v-for="integration in integrations"
            :key="integration.id"
            class="flex items-center justify-between p-4 bg-dark-900 rounded-lg border border-dark-700"
          >
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <img
                  v-if="integration.logo"
                  :src="integration.logo"
                  :alt="integration.name"
                  class="w-6 h-6"
                />
                <svg
                  v-else
                  class="w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  ></path>
                </svg>
              </div>
              <div>
                <p class="text-white font-medium">{{ integration.name }}</p>
                <p class="text-gray-400 text-sm">{{ integration.description }}</p>
              </div>
            </div>
            <button
              @click="toggleIntegration(integration)"
              :class="
                integration.isConnected
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-blue-500 hover:bg-blue-600'
              "
              class="px-3 py-1 text-white text-sm rounded-lg transition-colors"
            >
              {{ integration.isConnected ? 'Connected' : 'Connect' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

const loading = ref(true)

const stats = ref({
  totalUsers: 2847,
  userGrowth: 12,
  totalDocuments: 18432,
  documentsToday: 48,
  totalConversations: 45231,
  conversationGrowth: 24,
  tokensUsed: 1200000,
  tokenGrowth: 18,
})

const recentUsers = ref([
  {
    id: 1,
    name: 'Sarah Johnson',
    email: 'sarah@company.com',
    initials: 'SJ',
    status: 'Active',
    role: 'Admin',
  },
  {
    id: 2,
    name: 'Mike Chen',
    email: 'mike@company.com',
    initials: 'MC',
    status: 'Active',
    role: 'User',
  },
  {
    id: 3,
    name: 'Emily Davis',
    email: 'emily@company.com',
    initials: 'ED',
    status: 'Inactive',
    role: 'Manager',
  },
  {
    id: 4,
    name: 'Alex Rodriguez',
    email: 'alex@company.com',
    initials: 'AR',
    status: 'Active',
    role: 'User',
  },
])

const recentDocuments = ref([
  {
    id: 1,
    title: 'Employee Handbook 2024',
    fileName: 'employee-handbook.pdf',
    fileSize: 2457600,
    status: 'processed',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: 2,
    title: 'Q4 Financial Report',
    fileName: 'q4-report.docx',
    fileSize: 1843200,
    status: 'processing',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
  },
  {
    id: 3,
    title: 'Product Specifications',
    fileName: 'product-specs.pdf',
    fileSize: 3276800,
    status: 'processed',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  },
  {
    id: 4,
    title: 'Marketing Guidelines',
    fileName: 'marketing-guide.pdf',
    fileSize: 1638400,
    status: 'processed',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
])

const integrations = ref([
  {
    id: 1,
    name: 'Slack',
    description: 'Team communication',
    isConnected: true,
    logo: null,
  },
  {
    id: 2,
    name: 'Microsoft Teams',
    description: 'Video conferencing',
    isConnected: true,
    logo: null,
  },
  {
    id: 3,
    name: 'WhatsApp Business',
    description: 'Customer messaging',
    isConnected: false,
    logo: null,
  },
])

const formatTokens = (tokens: number) => {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`
  } else if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`
  }
  return tokens.toString()
}

const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

const formatTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else {
    return 'Just now'
  }
}

const getUserStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    Active: 'bg-green-500/20 text-green-400',
    Inactive: 'bg-red-500/20 text-red-400',
    Pending: 'bg-yellow-500/20 text-yellow-400',
  }
  return classes[status] || 'bg-gray-500/20 text-gray-400'
}

const getDocumentStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    processed: 'bg-green-500/20 text-green-400',
    processing: 'bg-yellow-500/20 text-yellow-400',
    failed: 'bg-red-500/20 text-red-400',
  }
  return classes[status] || 'bg-gray-500/20 text-gray-400'
}

const toggleIntegration = async (integration: any) => {
  try {
    integration.isConnected = !integration.isConnected
    // In a real app, you would call an API here
  } catch (error) {
    console.error('Failed to update integration:', error)
  }
}

onMounted(async () => {
  // Simulate loading
  setTimeout(() => {
    loading.value = false
  }, 1000)
})
</script>
