<template>
  <div class="space-y-4 sm:space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 bg-blue-500 rounded-lg flex-shrink-0 flex items-center justify-center">
          <UIcon name="mdi:microsoft-teams" class="w-6 h-6 text-white" />
        </div>
        <div class="min-w-0">
          <h1 class="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">Microsoft Teams Integration</h1>
          <p class="text-xs sm:text-sm text-gray-400 truncate">Connect your Teams workspace to provento</p>
        </div>
      </div>
      <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-shrink-0">
        <!-- Status Badge -->
        <span
          v-if="connectionStatus.isConnected"
          class="bg-green-500/20 text-green-400 px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
        >
          <UIcon name="heroicons:check-circle" class="w-4 h-4" />
          <span>Connected</span>
        </span>
        <span
          v-else-if="connectionStatus.hasBeenConnected"
          class="bg-yellow-500/20 text-yellow-400 px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
        >
          <UIcon name="heroicons:exclamation-circle" class="w-4 h-4" />
          <span>Disconnected</span>
        </span>
        <span
          v-else
          class="bg-gray-500/20 text-gray-400 px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
        >
          <UIcon name="heroicons:minus-circle" class="w-4 h-4" />
          <span>Not configured</span>
        </span>

        <!-- Action Button -->
        <UButton
          v-if="connectionStatus.isConnected"
          @click="showDisconnectModal = true"
          :loading="integrationsStore.loading"
          color="red"
          icon="heroicons:link-slash"
        >
          Disconnect
        </UButton>

        <template v-else-if="connectionStatus.hasBeenConnected">
          <UButton
            v-if="!isSuperAdmin"
            @click="launchTeamsOAuthRedirect"
            color="blue"
            icon="heroicons:arrow-path"
          >
            Reconnect
          </UButton>
          <UButton v-else disabled color="gray" icon="heroicons:arrow-path" title="Super admin cannot connect integrations">
            Reconnect
          </UButton>
        </template>

        <template v-else>
          <UButton v-if="!isSuperAdmin" @click="launchTeamsOAuthRedirect" color="blue" icon="heroicons:plus">
            Connect
          </UButton>
          <UButton v-else disabled color="gray" icon="heroicons:plus" title="Super admin cannot connect integrations">
            Connect
          </UButton>
        </template>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid xl:grid-cols-2 gap-6">
      <!-- Teams Configuration -->
      <UCard>
        <template #header>
          <div class="flex items-center space-x-2">
            <UIcon name="heroicons:cog-6-tooth" class="w-5 h-5 text-gray-400" />
            <h2 class="text-lg font-semibold text-white">Teams Configuration</h2>
          </div>
        </template>

        <div class="space-y-4">
          <!-- Loading State -->
          <div v-if="integrationsStore.loading" class="space-y-4">
            <div class="animate-pulse">
              <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-2"></div>
              <div class="h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
            <div class="animate-pulse">
              <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-2"></div>
              <div class="h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
            <div class="animate-pulse">
              <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-2"></div>
              <div class="h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          </div>

          <!-- Content -->
          <div v-else class="space-y-4">
            <!-- Tenant ID -->
            <UFormGroup label="Tenant ID">
              <UInput
                :model-value="teamsConfig.tenantId || 'Not configured'"
                readonly
                icon="heroicons:building-office"
              />
            </UFormGroup>

            <!-- Application ID -->
            <UFormGroup label="Application ID">
              <UInput
                :model-value="teamsConfig.applicationId || 'Not configured'"
                readonly
                icon="heroicons:identification"
              />
            </UFormGroup>

            <!-- Consent Status -->
            <UFormGroup label="Admin Consent">
              <div class="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <UIcon :name="consentStatus.icon" :class="consentStatus.color" class="w-5 h-5" />
                <span :class="consentStatus.color" class="font-medium">
                  {{ consentStatus.text }}
                </span>
              </div>
            </UFormGroup>
          </div>
        </div>
      </UCard>

      <!-- Connection Status -->
      <UCard>
        <template #header>
          <div class="flex items-center space-x-2">
            <UIcon name="heroicons:signal" class="w-5 h-5 text-gray-400" />
            <h2 class="text-lg font-semibold text-white">Connection Status</h2>
          </div>
        </template>

        <div class="space-y-4">
          <!-- Status -->
          <div
            class="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700"
          >
            <span class="text-gray-600 dark:text-gray-300">Status:</span>
            <span
              v-if="connectionStatus.isConnected"
              class="bg-green-500/20 text-green-400 px-2 py-1 rounded text-sm font-medium flex items-center space-x-1"
            >
              <UIcon name="heroicons:check-circle" class="w-3 h-3" />
              <span>Connected</span>
            </span>
            <span
              v-else-if="connectionStatus.hasBeenConnected"
              class="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-sm font-medium flex items-center space-x-1"
            >
              <UIcon name="heroicons:exclamation-circle" class="w-3 h-3" />
              <span>Disconnected</span>
            </span>
            <span
              v-else
              class="bg-gray-500/20 text-gray-400 px-2 py-1 rounded text-sm font-medium flex items-center space-x-1"
            >
              <UIcon name="heroicons:minus-circle" class="w-3 h-3" />
              <span>Not configured</span>
            </span>
          </div>


          <!-- Integration Status -->
          <div class="flex items-center justify-between py-3">
            <span class="text-gray-600 dark:text-gray-300">Integration:</span>
            <span class="text-gray-900 dark:text-white font-medium">
              {{
                connectionStatus.isConnected
                  ? 'Active'
                  : connectionStatus.hasBeenConnected
                    ? 'Inactive'
                    : 'Not setup'
              }}
            </span>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Download Section -->
    <UCard v-if="connectionStatus.isConnected || connectionStatus.hasBeenConnected">
      <template #header>
        <div class="flex items-center space-x-2">
          <UIcon name="heroicons:arrow-down-tray" class="w-5 h-5 text-blue-400" />
          <h3 class="text-lg font-semibold text-white">Teams App Package</h3>
        </div>
      </template>

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="font-medium text-gray-900 dark:text-white">Download Teams App Package</h4>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              After giving consent, download and upload our Teams app package to your Microsoft
              Teams admin portal.
            </p>
          </div>
          <div class="relative">
            <UButton
              @click="downloadTeamsApp"
              :disabled="!connectionStatus.isConnected"
              :loading="integrationsStore.manifestDownloading"
              color="blue"
              icon="heroicons:arrow-down-tray"
              v-if="connectionStatus.isConnected"
            >
              Download Package
            </UButton>
            <AppTooltip
              v-else
              text="After giving consent, the Teams app package will be available for download."
            >
              <UButton disabled color="gray" icon="heroicons:arrow-down-tray">
                Download Package
              </UButton>
            </AppTooltip>
          </div>
        </div>

        <div
          class="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
        >
          <UIcon name="heroicons:information-circle" class="w-5 h-5 text-blue-500" />
          <div class="text-sm text-blue-700 dark:text-blue-300">
            <strong>Note:</strong> Upload the downloaded package to your Microsoft Teams admin
            center to complete the integration.
          </div>
        </div>
      </div>
    </UCard>

    <!-- Disconnect Confirmation Modal -->
    <UModal v-model="showDisconnectModal">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="flex items-center space-x-3">
            <UIcon name="heroicons:exclamation-triangle" class="w-6 h-6 text-red-500" />
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Disconnect Teams Integration
            </h3>
          </div>
        </template>

        <div class="space-y-3">
          <p class="text-gray-600 dark:text-gray-300">
            Are you sure you want to disconnect your Microsoft Teams workspace? This action will:
          </p>
          <ul class="text-sm text-gray-500 dark:text-gray-400 space-y-1 ml-4">
            <li>• Stop all message processing</li>
            <li>• Disable bot notifications</li>
            <li>• Require re-authentication to reconnect</li>
            <li>• Remove admin consent</li>
          </ul>
          <p class="text-sm text-red-600 dark:text-red-400 font-medium">
            This action cannot be undone.
          </p>
        </div>

        <template #footer>
          <div class="flex justify-end space-x-3">
            <UButton
              @click="showDisconnectModal = false"
              :disabled="integrationsStore.loading"
              color="gray"
              variant="ghost"
            >
              Cancel
            </UButton>
            <UButton
              @click="disconnectTeams"
              :loading="integrationsStore.loading"
              color="red"
              icon="heroicons:link-slash"
            >
              Disconnect
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
// Using admin layout
definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const config = useRuntimeConfig()
const route = useRoute()
const router = useRouter()
const integrationsStore = useIntegrationsStore()
const authStore = useAuthStore()
const isSuperAdmin = computed(() => authStore.isSuperAdmin)

// Reactive data
const showDisconnectModal = ref(false)
const token = ref('')

// Computed properties for Teams configuration
const teamsConfig = computed(() => {
  const details = integrationsStore.teamsAppDetails
  return {
    tenantId: details?.tenant_id || null,
    applicationId: details?.app_id || null,
  }
})

// Computed properties for connection status
const connectionStatus = computed(() => {
  const details = integrationsStore.teamsAppDetails
  const isConnected = details?.status === 'active'
  const hasBeenConnected =
    details && details.tenant_id && details.app_id && details.status !== 'active'

  return {
    isConnected,
    hasBeenConnected: Boolean(hasBeenConnected),
    neverConnected: !details || (!details.tenant_id && !details.app_id),
  }
})

// Computed property for consent status
const consentStatus = computed(() => {
  if (connectionStatus.value.isConnected) {
    return {
      text: 'Consent Given',
      icon: 'heroicons:check-circle',
      color: 'text-green-600',
    }
  } else if (connectionStatus.value.hasBeenConnected) {
    return {
      text: 'Consent Revoked',
      icon: 'heroicons:x-circle',
      color: 'text-red-600',
    }
  } else {
    return {
      text: 'Consent Not Given',
      icon: 'heroicons:x-circle',
      color: 'text-gray-600',
    }
  }
})

// Methods
const launchTeamsOAuthRedirect = async () => {
  token.value = localStorage.getItem('authToken') || ''

  if (!token.value) {
    const { showError } = useNotification()
    showError('User token missing.')
    return
  }

  try {
    // Simple base64 decode to get org_id (similar to jwtDecode)
    const payload = JSON.parse(atob(token.value.split('.')[1]))
    const orgId = payload.org_id

    if (!orgId) {
      const { showError } = useNotification()
      showError('Organization ID missing in token.')
      return
    }

    const redirectUri = config.public.microsoftRedirectUri
    const clientId = config.public.microsoftAppId
    const query = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      state: orgId,
      response_type: 'code',
    })

    window.location.href = `https://login.microsoftonline.com/common/adminconsent?${query.toString()}`
  } catch (e) {
    console.error('JWT decode or OAuth redirect failed:', e)
    const { showError } = useNotification()
    showError('Something went wrong. Please try again.')
  }
}

const disconnectTeams = async () => {
  const orgQuery = route?.query?.org || route?.query?.org_id || null
  await integrationsStore.disconnectTeamsApp(orgQuery ? String(orgQuery) : null)
  showDisconnectModal.value = false
}

const downloadTeamsApp = async () => {
  await integrationsStore.downloadManifest()
}

// Lifecycle
onMounted(async () => {
  // Handle OAuth redirect if present
  const { code, state } = route.query
  if (code && state) {
    const { showInfo } = useNotification()
    showInfo('Teams authorization received. Processing...')

    // Clear query parameters
    setTimeout(() => {
      router?.replace({ path: router.currentRoute.value.path, query: {} })
    }, 3000)
  }

  // Fetch current Teams details (pass selected org for superadmin)
  const orgQuery = route?.query?.org || route?.query?.org_id || null
  await integrationsStore.fetchTeamsAppDetails(orgQuery ? String(orgQuery) : null)
})

useHead({
  title: 'Microsoft Teams Integration - Admin Dashboard - provento.ai',
})
</script>
