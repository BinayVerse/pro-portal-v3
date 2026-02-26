<template>
  <div class="space-y-4 sm:space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
      <div>
        <h1 class="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1 sm:mb-2">
          Applications
        </h1>
        <p class="text-xs sm:text-sm lg:text-base text-gray-400">
          Manage and configure third-party application integrations
        </p>
      </div>
      <UButton
        @click="openAddApplicationModal"
        icon="heroicons:plus"
        color="primary"
        class="w-full sm:w-auto flex-shrink-0"
        :disabled="loadingIntegrations"
      >
        Add Application
      </UButton>
    </div>

    <!-- Tabs for filtering -->
    <div
      v-if="!loadingIntegrations"
      class="flex gap-2 border-b border-dark-700 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0"
    >
      <button
        v-for="tab in tabs"
        :key="tab.value"
        @click="selectedTab = tab.value"
        :class="[
          'px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors',
          selectedTab === tab.value
            ? 'text-primary-400 border-b-2 border-primary-400'
            : 'text-gray-400 hover:text-gray-300 border-b-2 border-transparent',
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tabs Loading Skeleton -->
    <div v-else class="border-b border-dark-700 pb-3">
      <div class="flex gap-3 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto">
        <div
          v-for="i in 5"
          :key="i"
          class="h-10 bg-dark-800 rounded animate-pulse flex-shrink-0"
          :style="{ width: Math.random() * 60 + 50 + 'px' }"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loadingIntegrations" class="flex items-center justify-center py-12">
      <UIcon name="i-heroicons:arrow-path-20-solid" class="w-8 h-8 text-primary-400 animate-spin" />
      <p class="ml-3 text-gray-400">Loading integrations...</p>
    </div>

    <!-- Grouped Applications List -->
    <div
      v-else-if="filteredApplications.length > 0"
      class="space-y-4"
      @click="
        () => {
          activeAppStatusMenu = null
        }
      "
    >
      <!-- Integration Parent Card -->
      <div
        v-for="group in filteredApplications"
        :key="group.id"
        class="bg-dark-800 border border-dark-700 rounded-lg"
      >
        <!-- Integration Header -->
        <div
          class="px-4 sm:px-6 py-4 flex items-center justify-between bg-dark-800 hover:bg-dark-700/30 transition-colors border-dark-700 cursor-pointer"
          @click="toggleExpandedRow(group.id)"
        >
          <!-- Left: Icon + Integration Info -->
          <div class="flex items-center gap-4 flex-1 min-w-0">
            <!-- Provider Icon -->
            <div
              class="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center"
              :class="getIconBackground({ provider: group.provider })"
            >
              <AppTooltip :text="group.provider">
                <UIcon
                  :name="getAppIcon({ provider: group.provider })"
                  class="w-6 h-6 text-white"
                />
              </AppTooltip>
            </div>

            <!-- Integration Details -->
            <div class="min-w-0 flex-1">
              <h3 class="text-base sm:text-lg font-semibold text-white break-words hover:text-primary-400 transition-colors">
                {{ group.provider }} Integration
              </h3>
              <div class="flex flex-wrap gap-2 items-center text-xs sm:text-sm text-gray-400 mt-1">
                <span v-if="group.agent">{{ group.agent }}</span>
                <span v-if="group.module" class="hidden sm:inline">•</span>
                <span v-if="group.module" class="hidden sm:inline text-gray-500">{{
                  group.module
                }}</span>
              </div>
            </div>
          </div>

          <!-- Right: Status Badge + Actions -->
          <div class="flex items-center gap-2 flex-shrink-0 ml-4">
            <!-- Status Badge -->
            <span
              :class="[
                'px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 whitespace-nowrap',
                getAggregateStatus(group.connections) === 'Active'
                  ? 'bg-green-500/20 text-green-400'
                  : getAggregateStatus(group.connections) === 'Inactive'
                    ? 'bg-gray-500/20 text-gray-400'
                    : getAggregateStatus(group.connections) === 'Expired'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/20 text-red-400',
              ]"
            >
              <span
                class="w-2 h-2 rounded-full"
                :class="
                  getAggregateStatus(group.connections) === 'Active'
                    ? 'bg-green-400'
                    : getAggregateStatus(group.connections) === 'Inactive'
                      ? 'bg-gray-400'
                      : getAggregateStatus(group.connections) === 'Expired'
                        ? 'bg-yellow-400'
                        : 'bg-red-400'
                "
              />
              {{ getAggregateStatus(group.connections) }}
            </span>

            <!-- Status Change Dropdown -->
            <div class="relative" @click.stop>
              <AppTooltip text="Change status">
                <UButton
                  color="gray"
                  variant="ghost"
                  icon="heroicons:cog-6-tooth"
                  size="sm"
                  data-menu-trigger
                  :data-group-id="group.id"
                  @click.stop="toggleAppStatusMenu(group.id)"
                />
              </AppTooltip>
              <Teleport to="body">
                <div
                  v-if="activeAppStatusMenu === group.id"
                  class="fixed w-48 bg-dark-800 border border-dark-700 rounded-lg shadow-lg py-1 z-50"
                  :style="getDropdownPosition(group.id)"
                  data-menu-dropdown
                  @click.stop
                >
                  <button
                    @click="
                      () => {
                        updateGroupStatus(group, 'Active')
                      }
                    "
                    :class="[
                      'w-full px-4 py-2 text-sm text-left flex items-center gap-2 hover:bg-dark-700 transition-colors',
                      getAggregateStatus(group.connections) === 'Active'
                        ? 'text-primary-400'
                        : 'text-gray-300',
                    ]"
                  >
                    <UIcon name="heroicons:check-circle" class="w-4 h-4" />
                    Active
                  </button>
                  <button
                    @click="
                      () => {
                        updateGroupStatus(group, 'Inactive')
                      }
                    "
                    :class="[
                      'w-full px-4 py-2 text-sm text-left flex items-center gap-2 hover:bg-dark-700 transition-colors',
                      getAggregateStatus(group.connections) === 'Inactive'
                        ? 'text-primary-400'
                        : 'text-gray-300',
                    ]"
                  >
                    <UIcon name="heroicons:minus-circle" class="w-4 h-4" />
                    Inactive
                  </button>
                </div>
              </Teleport>
            </div>

            <!-- Eye Icon Toggle -->
            <AppTooltip
              :text="
                expandedRows.includes(group.id) ? 'Collapse connections' : 'Expand connections'
              "
            >
              <UButton
                @click="toggleExpandedRow(group.id)"
                variant="ghost"
                :color="expandedRows.includes(group.id) ? 'primary' : 'gray'"
                :icon="expandedRows.includes(group.id) ? 'heroicons:eye-slash' : 'heroicons:eye'"
                size="sm"
              />
            </AppTooltip>

            <!-- Delete Icon -->
            <AppTooltip text="Delete integration">
              <UButton
                @click="deleteGroup(group)"
                variant="ghost"
                color="red"
                icon="heroicons:trash-20-solid"
                size="sm"
              />
            </AppTooltip>
          </div>
        </div>

        <!-- Connections List -->
        <div
          v-if="expandedRows.includes(group.id)"
          class="border-t border-dark-700 bg-dark-900/50 px-4 sm:px-6 py-4"
        >
          <!-- Connections Header with Count -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <UIcon name="heroicons:link" class="w-4 h-4 text-gray-400" />
              <h4 class="text-sm font-semibold text-gray-300">
                Connection ({{ group.connections.length }})
              </h4>
            </div>
          </div>

          <!-- Connection Cards -->
          <div class="space-y-3">
            <div
              v-for="connection in group.connections"
              :key="connection.id"
              class="bg-dark-800 border border-dark-700 rounded-lg p-4 space-y-3"
            >
              <!-- Connection Header -->
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <h4 class="text-sm font-semibold text-white">{{ connection.connection_name }}</h4>
                  <p class="text-xs text-gray-400 mt-1">
                    Created {{ formatDate(connection.created_at) }}
                  </p>
                </div>

                <!-- Status Badge + Actions -->
                <div class="flex items-center gap-2 flex-shrink-0 ml-4">
                  <!-- Status Badge -->
                  <span
                    :class="[
                      'px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 whitespace-nowrap',
                      connection.status === 'Active'
                        ? 'bg-green-500/20 text-green-400'
                        : connection.status === 'Inactive'
                          ? 'bg-gray-500/20 text-gray-400'
                          : connection.status === 'Expired'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400',
                    ]"
                  >
                    <span
                      class="w-2 h-2 rounded-full"
                      :class="
                        connection.status === 'Active'
                          ? 'bg-green-400'
                          : connection.status === 'Inactive'
                            ? 'bg-gray-400'
                            : connection.status === 'Expired'
                              ? 'bg-yellow-400'
                              : 'bg-red-400'
                      "
                    />
                    {{ connection.status }}
                  </span>

                  <!-- Status Change Dropdown -->
                  <div class="relative" @click.stop>
                    <AppTooltip text="Change status">
                      <UButton
                        color="gray"
                        variant="ghost"
                        icon="heroicons:cog-6-tooth"
                        size="sm"
                        data-menu-trigger
                        @click.stop="toggleAppStatusMenu(connection.id)"
                      />
                    </AppTooltip>
                    <div
                      v-if="activeAppStatusMenu === connection.id"
                      class="absolute right-0 mt-1 w-48 bg-dark-800 border border-dark-700 rounded-lg shadow-lg py-1 z-50 top-full"
                      data-menu-dropdown
                      @click.stop
                    >
                      <button
                        @click="
                          () => {
                            updateStatus(connection.id, 'Active')
                            activeAppStatusMenu = null
                          }
                        "
                        :class="[
                          'w-full px-4 py-2 text-sm text-left flex items-center gap-2 hover:bg-dark-700 transition-colors',
                          connection.status === 'Active' ? 'text-primary-400' : 'text-gray-300',
                        ]"
                      >
                        <UIcon name="heroicons:check-circle" class="w-4 h-4" />
                        Active
                      </button>
                      <button
                        @click="
                          () => {
                            updateStatus(connection.id, 'Inactive')
                            activeAppStatusMenu = null
                          }
                        "
                        :class="[
                          'w-full px-4 py-2 text-sm text-left flex items-center gap-2 hover:bg-dark-700 transition-colors',
                          connection.status === 'Inactive' ? 'text-primary-400' : 'text-gray-300',
                        ]"
                      >
                        <UIcon name="heroicons:minus-circle" class="w-4 h-4" />
                        Inactive
                      </button>
                    </div>
                  </div>

                  <!-- Edit Icon -->
                  <AppTooltip text="Edit connection">
                    <UButton
                      @click="editConnection(connection)"
                      variant="ghost"
                      color="gray"
                      icon="heroicons:pencil-square"
                      size="sm"
                    />
                  </AppTooltip>

                  <!-- Delete Icon -->
                  <AppTooltip text="Delete connection">
                    <UButton
                      @click="deleteApplication(connection.id)"
                      variant="ghost"
                      color="red"
                      icon="heroicons:trash-20-solid"
                      size="sm"
                    />
                  </AppTooltip>
                </div>
              </div>

              <!-- Connection Details -->
              <div class="text-xs text-gray-400 space-y-2 bg-dark-700/50 rounded-lg p-3">
                <div class="flex justify-between items-start">
                  <span class="text-gray-500 font-medium">Client ID:</span>
                  <span class="font-mono text-gray-300 break-all text-right ml-4">{{
                    maskSensitiveData(connection.client_id)
                  }}</span>
                </div>
                <div class="flex justify-between items-start">
                  <span class="text-gray-500 font-medium">Client Secret:</span>
                  <span class="font-mono text-gray-300 break-all text-right ml-4">{{
                    maskSensitiveData(connection.client_secret)
                  }}</span>
                </div>
                <div v-if="connection.api_key" class="flex justify-between items-start">
                  <span class="text-gray-500 font-medium">API Key:</span>
                  <span class="font-mono text-gray-300 break-all text-right ml-4">{{
                    maskSensitiveData(connection.api_key)
                  }}</span>
                </div>
                <div v-if="connection.login_url" class="flex justify-between items-start">
                  <span class="text-gray-500 font-medium">Login URL:</span>
                  <span class="font-mono text-gray-300 break-all text-right ml-4">{{
                    connection.login_url
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="flex flex-col items-center justify-center py-12 px-4 bg-dark-800 rounded-lg border border-dark-700"
    >
      <UIcon name="heroicons:briefcase" class="w-12 h-12 text-gray-500 mb-4" />
      <h3 class="text-lg font-semibold text-gray-300 mb-2">No applications yet</h3>
      <p class="text-sm text-gray-400 mb-4 text-center">
        Create your first application integration to get started
      </p>
      <UButton @click="openAddApplicationModal" icon="heroicons:plus"> Add Application </UButton>
    </div>

    <!-- Add/Edit Application Modal -->
    <UModal v-model="showApplicationModal" size="lg" prevent-close>
      <div class="p-6 space-y-4">
        <!-- Close Button -->
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-white">
            {{
              editingAppId
                ? isAddingConnectionMode
                  ? 'Edit Connection'
                  : 'Edit Application'
                : isAddingConnectionMode
                  ? 'Add Connection'
                  : 'Add New Application'
            }}
          </h2>
          <UButton
            color="gray"
            variant="ghost"
            icon="heroicons:x-mark"
            size="sm"
            @click="closeApplicationModal"
            aria-label="Close modal"
          />
        </div>
        <!-- Select Agent -->
        <div>
          <div class="flex items-center gap-2 mb-2">
            <label class="block text-sm font-medium text-white">Select Agent <span class="text-red-500">*</span></label>
            <AppTooltip v-if="areFieldsLocked" text="Agent is locked to this integration group">
              <UIcon name="heroicons:information-circle" class="w-4 h-4 text-gray-400" />
            </AppTooltip>
          </div>
          <USelect
            v-model="applicationForm.agent_id"
            :options="agents.map((a) => ({ value: a.id, label: a.name }))"
            placeholder="Select an agent"
            value-attribute="value"
            option-attribute="label"
            :disabled="areFieldsLocked"
            class="w-full"
          />
        </div>

        <!-- Select Module -->
        <div>
          <div class="flex items-center gap-2 mb-2">
            <label class="block text-sm font-medium text-white">Select Module <span class="text-red-500">*</span></label>
            <AppTooltip v-if="areFieldsLocked" text="Module is locked to this integration group">
              <UIcon name="heroicons:information-circle" class="w-4 h-4 text-gray-400" />
            </AppTooltip>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              v-for="module in filteredModules"
              :key="module.id"
              @click="
                () => {
                  if (!areFieldsLocked) {
                    applicationForm.module_id = module.id
                    applicationForm.module = module.name
                  }
                }
              "
              :disabled="areFieldsLocked"
              :class="[
                'p-3 rounded-lg border transition-all text-sm font-medium flex flex-col items-center justify-center gap-2',
                areFieldsLocked ? 'opacity-50 cursor-not-allowed' : '',
                applicationForm.module_id === module.id
                  ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                  : 'border-dark-700 bg-dark-900 text-gray-400 hover:border-dark-600',
              ]"
            >
              <UIcon :name="getModuleIcon(module.name)" class="w-5 h-5" />
              {{ module.name }}
            </button>
          </div>
        </div>

        <!-- Select Provider -->
        <div>
          <div class="flex items-center gap-2 mb-2">
            <label class="block text-sm font-medium text-white">Select Provider <span class="text-red-500">*</span></label>
            <AppTooltip v-if="areFieldsLocked" text="Provider is locked to this integration group">
              <UIcon name="heroicons:information-circle" class="w-4 h-4 text-gray-400" />
            </AppTooltip>
          </div>
          <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
            <button
              v-for="provider in filteredProviders"
              :key="provider.id"
              @click="
                () => {
                  if (!areFieldsLocked) {
                    applicationForm.provider_id = provider.id
                    applicationForm.provider = provider.name
                  }
                }
              "
              :disabled="areFieldsLocked"
              :class="[
                'p-3 rounded-lg border transition-all flex flex-col items-center justify-center gap-2',
                areFieldsLocked ? 'opacity-50 cursor-not-allowed' : '',
                applicationForm.provider_id === provider.id
                  ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                  : 'border-dark-700 bg-dark-900 hover:border-dark-600 text-gray-400',
              ]"
            >
              <UIcon :name="getProviderIcon(provider.name)" class="w-6 h-6 text-white" />
              <span class="text-xs text-center">{{ provider.name }}</span>
            </button>
          </div>
        </div>

        <!-- Connection Name -->
        <div>
          <div class="flex items-center gap-2 mb-2">
            <label class="block text-sm font-medium text-white">Connection Name <span class="text-red-500">*</span></label>
            <AppTooltip text="A unique name to identify this connection for this integration">
              <UIcon name="heroicons:information-circle" class="w-4 h-4 text-gray-400" />
            </AppTooltip>
          </div>
          <input
            v-model="applicationForm.connection_name"
            placeholder="e.g., Main Payroll"
            class="input-field w-full"
            autocomplete="new-password"
          />
        </div>

        <!-- API Credentials -->
        <div class="space-y-4 p-4 bg-dark-900 rounded-lg border border-dark-700">
          <h3 class="text-sm font-semibold text-white">API Credentials <span class="text-red-500">*</span></h3>

          <div>
            <label class="block text-xs text-gray-400 mb-1">Client ID <span class="text-red-500">*</span></label>
            <input
              v-model="applicationForm.client_id"
              placeholder="Enter client ID"
              class="input-field w-full"
              autocomplete="new-password"
            />
          </div>

          <div>
            <label class="block text-xs text-gray-400 mb-1">Client Secret <span class="text-red-500">*</span></label>
            <div class="relative">
              <input
                v-model="applicationForm.client_secret"
                :type="showApplicationClientSecret ? 'text' : 'password'"
                placeholder="Enter client secret"
                class="input-field w-full pr-10"
                autocomplete="new-password"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-300 transition-colors"
                @click="showApplicationClientSecret = !showApplicationClientSecret"
              >
                <UIcon
                  :name="showApplicationClientSecret ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                  class="h-5 w-5"
                />
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs text-gray-400 mb-1">API Key <span class="text-red-500">*</span></label>
            <div class="relative">
              <input
                v-model="applicationForm.api_key"
                :type="showApplicationApiKey ? 'text' : 'password'"
                placeholder="Enter API key"
                class="input-field w-full pr-10"
                autocomplete="new-password"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-300 transition-colors"
                @click="showApplicationApiKey = !showApplicationApiKey"
              >
                <UIcon
                  :name="showApplicationApiKey ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                  class="h-5 w-5"
                />
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs text-gray-400 mb-1">Access Token <span class="text-red-500">*</span></label>
            <input
              v-model="applicationForm.access_token"
              placeholder="Enter access token"
              class="input-field w-full"
              autocomplete="new-password"
            />
          </div>

          <div>
            <label class="block text-xs text-gray-400 mb-1">Login URL <span class="text-red-500">*</span></label>
            <input
              v-model="applicationForm.login_url"
              placeholder="https://example.com/login"
              class="input-field w-full"
              autocomplete="off"
            />
          </div>
        </div>

        <!-- Modal Actions -->
        <div class="flex gap-2 justify-end pt-4 border-t border-dark-700">
          <UButton
            variant="outline"
            color="gray"
            @click="closeApplicationModal"
            :disabled="isSavingApplication"
          >
            Cancel
          </UButton>
          <UButton @click="saveApplication" :loading="isSavingApplication">
            {{ editingAppId ? 'Update' : isAddingConnectionMode ? 'Add' : 'Add' }}
            {{ isAddingConnectionMode ? 'Connection' : 'Application' }}
          </UButton>
        </div>
      </div>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useOrganizationIntegrations } from '~/composables/useOrganizationIntegrations'
import { useNotification } from '~/composables/useNotification'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

useHead({
  title: 'Applications - Admin',
})

const { showSuccess, showError } = useNotification()

// Use the organization integrations composable
const {
  integrations,
  providers,
  modules,
  agents,
  loadingIntegrations,
  error,
  successMessage,
  fetchIntegrations,
  fetchMasterData,
  createIntegration,
  updateIntegration,
  updateIntegrationStatus,
  deleteIntegration,
  clearMessages,
  getModulesForAgent,
  getProvidersForAgent,
  getProvidersForAgentAndModule,
  decryptIntegrationForDisplay,
} = useOrganizationIntegrations()

// Form state
const showApplicationModal = ref(false)
const isSavingApplication = ref(false)
const selectedTab = ref('all')
const editingAppId = ref<string | null>(null)
const expandedRows = ref<string[]>([])
const activeAppStatusMenu = ref<string | null>(null)
const showApplicationClientSecret = ref(false)
const showApplicationApiKey = ref(false)
const isAddingConnectionMode = ref(false)

// Form data
const applicationForm = ref({
  agent: '',
  agent_id: '',
  module: '',
  module_id: '',
  provider: '',
  provider_id: '',
  name: '',
  connection_name: '',
  client_id: '',
  client_secret: '',
  api_key: '',
  access_token: '',
  login_url: '',
})

// Transform grouped integrations for UI display
const applicationsList = computed(() => {
  const store = useOrganizationIntegrationsStore()
  const grouped = store.getGroupedIntegrations

  return grouped.map((group) => ({
    id: `${group.provider_id}-${group.agent_id}-${group.module_id}`,
    provider: group.provider_name,
    agent: group.agent_name,
    module: group.module_name,
    provider_id: group.provider_id,
    agent_id: group.agent_id,
    module_id: group.module_id,
    connections: group.connections.map((conn) => ({
      ...conn,
      status:
        conn.status === 'active'
          ? 'Active'
          : conn.status === 'inactive'
            ? 'Inactive'
            : conn.status === 'expired'
              ? 'Expired'
              : 'Failed',
    })),
  }))
})

// Dynamic tabs based on available agents (already sorted with HRMS first in store)
const tabs = computed(() => {
  const baseTabs = [{ label: 'All', value: 'all' }]

  // Agents are already sorted in the store with HRMS first
  agents.value.forEach((agent) => {
    baseTabs.push({ label: agent.name, value: agent.id })
  })
  return baseTabs
})

// Computed
const filteredApplications = computed(() => {
  if (selectedTab.value === 'all') {
    return applicationsList.value
  }

  // Filter by agent_id based on selected tab
  return applicationsList.value.filter((group) => group.agent_id === selectedTab.value)
})

// Check if we're adding a new connection (as opposed to editing)
const isAddingConnection = computed(() => !editingAppId.value)

// Check if fields should be disabled (locked to integration group)
const areFieldsLocked = computed(() => isAddingConnectionMode.value && isAddingConnection.value)

// Filter modules based on selected agent
const filteredModules = computed(() => {
  if (!applicationForm.value.agent_id) {
    return modules.value
  }

  // Use store getter for client-side filtering
  return getModulesForAgent(applicationForm.value.agent_id)
})

// Filter providers based on selected agent and optionally module
const filteredProviders = computed(() => {
  if (!applicationForm.value.agent_id) {
    return providers.value
  }

  // If module is selected, filter providers for both agent and module
  if (applicationForm.value.module_id) {
    return getProvidersForAgentAndModule(
      applicationForm.value.agent_id,
      applicationForm.value.module_id,
    )
  }

  // Otherwise, just filter for agent
  return getProvidersForAgent(applicationForm.value.agent_id)
})

// Functions
const toggleExpandedRow = (appId: string) => {
  const idx = expandedRows.value.indexOf(appId)
  if (idx >= 0) {
    // If clicking the same row, collapse it
    expandedRows.value.splice(idx, 1)
  } else {
    // Clear all other expanded rows and open the clicked one (accordion behavior)
    expandedRows.value = [appId]
  }
  // Close any open menus when toggling expanded row
  activeAppStatusMenu.value = null
}

const getAggregateStatus = (connections: any[]) => {
  if (!connections || connections.length === 0) return 'Unknown'

  const statuses = connections.map((c) => c.status)

  // If all same status, return that status
  if (statuses.every((s) => s === statuses[0])) {
    return statuses[0]
  }

  // If mixed, return the first one
  return statuses[0]
}

const getAppIcon = (app: any) => {
  const icons: Record<string, string> = {
    Zoho: 'heroicons:cog-6-tooth',
    Keka: 'heroicons:briefcase',
    ADP: 'heroicons:briefcase',
    QuickBooks: 'heroicons:calculator',
    Workday: 'heroicons:briefcase',
    SAP: 'heroicons:briefcase',
  }
  return icons[app.provider] || 'heroicons:briefcase'
}

const getIconBackground = (app: any) => {
  const colors: Record<string, string> = {
    Zoho: 'bg-blue-500',
    Keka: 'bg-purple-500',
    ADP: 'bg-red-500',
    QuickBooks: 'bg-green-500',
    Workday: 'bg-orange-500',
    SAP: 'bg-indigo-500',
  }
  return colors[app.provider] || 'bg-gray-500'
}

const getProviderIcon = (provider: string) => {
  const icons: Record<string, string> = {
    Zoho: 'heroicons:cog-6-tooth',
    Keka: 'heroicons:briefcase',
    ADP: 'heroicons:briefcase',
    QuickBooks: 'heroicons:calculator',
    Workday: 'heroicons:briefcase',
    SAP: 'heroicons:briefcase',
  }
  return icons[provider] || 'heroicons:briefcase'
}

const getModuleIcon = (module: string) => {
  const icons: Record<string, string> = {
    Payroll: 'heroicons:calculator',
    Recruitment: 'heroicons:briefcase',
    Benefits: 'heroicons:cog-6-tooth',
    Performance: 'heroicons:check-circle',
  }
  return icons[module] || 'heroicons:briefcase'
}

const maskSensitiveData = (data: string) => {
  if (!data) return '••••••••'
  return '••••••••'
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const openAddApplicationModal = () => {
  editingAppId.value = null
  isAddingConnectionMode.value = false
  applicationForm.value = {
    agent: '',
    agent_id: '',
    module: '',
    module_id: '',
    provider: '',
    provider_id: '',
    name: '',
    connection_name: '',
    client_id: '',
    client_secret: '',
    api_key: '',
    access_token: '',
    login_url: '',
  }
  showApplicationModal.value = true
}

const closeApplicationModal = () => {
  showApplicationModal.value = false
  editingAppId.value = null
  isAddingConnectionMode.value = false
  showApplicationClientSecret.value = false
  showApplicationApiKey.value = false
}

const saveApplication = async () => {
  isSavingApplication.value = true
  clearMessages()

  try {
    // Validate required fields
    if (
      !applicationForm.value.agent_id ||
      !applicationForm.value.module_id ||
      !applicationForm.value.provider_id
    ) {
      showError('Please select Agent, Module, and Provider')
      return
    }

    if (!applicationForm.value.connection_name || !applicationForm.value.client_id) {
      showError('Please fill in all required fields')
      return
    }

    const payload = {
      provider_id: applicationForm.value.provider_id,
      agent_id: applicationForm.value.agent_id,
      module_id: applicationForm.value.module_id,
      connection_name: applicationForm.value.connection_name,
      client_id: applicationForm.value.client_id,
      client_secret: applicationForm.value.client_secret,
      api_key: applicationForm.value.api_key,
      access_token: applicationForm.value.access_token,
      login_url: applicationForm.value.login_url,
      status: 'active' as const,
    }

    let result
    if (editingAppId.value) {
      // Update existing
      result = await updateIntegration(editingAppId.value, payload)
    } else {
      // Create new
      result = await createIntegration(payload)
    }

    if (result.success) {
      // Message will be displayed through store watchers
      closeApplicationModal()
    }
    // Error will be displayed through store watchers (no direct showError call)
  } finally {
    isSavingApplication.value = false
  }
}

const editApplication = (app: any) => {
  editingAppId.value = app.integrationData?.id || app.id
  applicationForm.value = {
    agent: app.integrationData?.agent_name || '',
    agent_id: app.integrationData?.agent_id || '',
    module: app.integrationData?.module_name || '',
    module_id: app.integrationData?.module_id || '',
    provider: app.integrationData?.provider_name || '',
    provider_id: app.integrationData?.provider_id || '',
    name: app.name || '',
    connection_name: app.integrationData?.connection_name || '',
    client_id: app.integrationData?.client_id || '',
    client_secret: '',
    api_key: app.integrationData?.api_key || '',
    access_token: app.integrationData?.access_token || '',
    login_url: app.integrationData?.login_url || '',
  }
  showApplicationModal.value = true
}

const openAddConnectionModal = (group: any) => {
  // Set to a temporary value to prevent watchers from resetting pre-filled values
  editingAppId.value = '__initializing__'
  isAddingConnectionMode.value = true

  // Pre-fill with the integration's provider/agent/module
  applicationForm.value = {
    agent: group.agent_name || group.agent,
    agent_id: group.agent_id,
    module: group.module_name || group.module,
    module_id: group.module_id,
    provider: group.provider_name || group.provider,
    provider_id: group.provider_id,
    name: '',
    connection_name: '',
    client_id: '',
    client_secret: '',
    api_key: '',
    access_token: '',
    login_url: '',
  }

  // Reset editingAppId after initialization to mark it as "adding new"
  nextTick(() => {
    editingAppId.value = null
  })

  showApplicationModal.value = true
}

const editConnection = async (connection: any) => {
  editingAppId.value = connection.id

  // Decrypt sensitive fields for display
  const decrypted = await decryptIntegrationForDisplay(connection)

  applicationForm.value = {
    agent: decrypted.agent_name || '',
    agent_id: decrypted.agent_id || '',
    module: decrypted.module_name || '',
    module_id: decrypted.module_id || '',
    provider: decrypted.provider_name || '',
    provider_id: decrypted.provider_id || '',
    name: decrypted.connection_name || '',
    connection_name: decrypted.connection_name || '',
    client_id: decrypted.client_id || '',
    client_secret: decrypted.client_secret || '',
    api_key: decrypted.api_key || '',
    access_token: decrypted.access_token || '',
    login_url: decrypted.login_url || '',
  }
  showApplicationModal.value = true
}

const deleteApplication = async (id: string) => {
  if (!confirm('Are you sure you want to delete this connection?')) {
    return
  }

  try {
    await deleteIntegration(id)
    // Success/error messages will be displayed through store watchers
  } catch (err) {
    showError('Unexpected error occurred during deletion')
  }
}

const deleteGroup = async (group: any) => {
  if (!confirm('Are you sure you want to delete this integration and all its connections?')) {
    return
  }

  try {
    const connections = group.connections

    // Delete all connections in the group
    const deletePromises = connections.map((connection) => deleteIntegration(connection.id))

    await Promise.all(deletePromises)
    // Success/error messages will be displayed through store watchers
  } catch (err) {
    showError('Unexpected error occurred during deletion')
  }
}

const updateStatus = async (appId: string, status: string) => {
  try {
    await updateIntegrationStatus(
      appId,
      status.toLowerCase() as 'active' | 'inactive' | 'expired' | 'failed',
    )
    // Message will be displayed through store watchers
  } catch (err) {
    showError('Failed to update status')
  }
}

const updateGroupStatus = async (group: any, status: string) => {
  try {
    const connections = group.connections
    const statusLower = status.toLowerCase() as 'active' | 'inactive' | 'expired' | 'failed'

    // Update all connections in the group
    const updatePromises = connections.map((connection) =>
      updateIntegrationStatus(connection.id, statusLower),
    )

    await Promise.all(updatePromises)
    // Message will be displayed through store watchers
    activeAppStatusMenu.value = null
  } catch (err) {
    showError('Failed to update group status')
  }
}

const toggleAppStatusMenu = (appId: string) => {
  activeAppStatusMenu.value = activeAppStatusMenu.value === appId ? null : appId
}

const getDropdownPosition = (groupId: string) => {
  // Use nextTick to ensure DOM is updated
  if (typeof window === 'undefined') return { top: '0', left: '0' }

  // Find the button element and get its position
  const button = document.querySelector(`[data-menu-trigger][data-group-id="${groupId}"]`)
  if (!button) return { top: '0', left: '0' }

  const rect = button.getBoundingClientRect()
  return {
    top: `${rect.bottom + 8}px`,
    right: `${window.innerWidth - rect.right}px`,
  }
}

// Global click listener to close menus
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement

  // Check if click is on a menu trigger button
  const isOnMenuTrigger = target.closest('[data-menu-trigger]')

  // If not on trigger, close all menus
  if (!isOnMenuTrigger) {
    activeAppStatusMenu.value = null
  }
}

// Handler for scroll/resize to update dropdown position
const handleScrollOrResize = () => {
  // Force Vue to recalculate dropdown position by triggering reactivity
  if (activeAppStatusMenu.value) {
    // This will trigger the getDropdownPosition function to recalculate
    activeAppStatusMenu.value = activeAppStatusMenu.value
  }
}

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('scroll', handleScrollOrResize)
  window.addEventListener('resize', handleScrollOrResize)

  // Fetch all necessary data
  try {
    await fetchMasterData() // Fetch providers, modules, agents
    await fetchIntegrations() // Fetch integrations for the organization
  } catch (err) {
    console.error('Failed to load integrations:', err)
    showError('Failed to load integrations')
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', handleScrollOrResize)
  window.removeEventListener('resize', handleScrollOrResize)
})

// Watch for error changes and show notification
watch(error, (newError) => {
  if (newError) {
    showError(newError)
    // Clear error message after displaying
    nextTick(() => {
      setTimeout(() => clearMessages(), 100)
    })
  }
})

// Watch for success messages and show notification
watch(successMessage, (newSuccess) => {
  if (newSuccess) {
    showSuccess(newSuccess)
    // Clear success message after displaying
    nextTick(() => {
      setTimeout(() => clearMessages(), 100)
    })
  }
})

// Watch for agent selection changes - reset module and provider selections (only when adding new application, not adding connection or editing)
watch(
  () => applicationForm.value.agent_id,
  () => {
    // Only reset if we're adding a new application (not in connection mode and not editing)
    if (!editingAppId.value && !isAddingConnectionMode.value) {
      applicationForm.value.module_id = ''
      applicationForm.value.module = ''
      applicationForm.value.provider_id = ''
      applicationForm.value.provider = ''
    }
  },
)

// Watch for module selection changes - reset provider selection (only when adding new application, not adding connection or editing)
watch(
  () => applicationForm.value.module_id,
  () => {
    // Only reset if we're adding a new application (not in connection mode and not editing)
    if (!editingAppId.value && !isAddingConnectionMode.value) {
      applicationForm.value.provider_id = ''
      applicationForm.value.provider = ''
    }
  },
)

// Watch for dropdown open/close and recalculate position
watch(
  () => activeAppStatusMenu.value,
  () => {
    // Force re-render to update dropdown position
    if (activeAppStatusMenu.value) {
      nextTick(() => {
        // Position will be recalculated on next render
      })
    }
  },
)
</script>
