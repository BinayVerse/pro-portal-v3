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
      <AppTooltip
        v-for="tab in tabs"
        :key="tab.value"
        :text="!tab.isActive && tab.value !== 'all' ? 'Coming Soon' : ''"
      >
        <button
          @click="selectedTab = tab.value"
          :disabled="!tab.isActive && tab.value !== 'all'"
          :class="[
            'px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2',
            !tab.isActive && tab.value !== 'all'
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer',
            selectedTab === tab.value
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-gray-400 hover:text-gray-300 border-b-2 border-transparent',
          ]"
        >
          <span>{{ tab.label }}</span>
        </button>
      </AppTooltip>
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
              <h3
                class="text-base sm:text-lg font-semibold text-white break-words hover:text-primary-400 transition-colors"
              >
                {{ group.provider }} Integration
              </h3>
              <div class="flex flex-wrap gap-2 items-center text-xs sm:text-sm text-gray-400 mt-1">
                <span v-if="group.agent">{{ group.agent }}</span>
                <span v-if="group.connections?.length" class="hidden sm:inline">•</span>

                <div class="flex flex-wrap items-center">
                  <template
                    v-for="(conn, index) in getSortedConnections(group.connections)"
                    :key="conn.id"
                  >
                    <span class="sm:inline text-gray-500">
                      {{ conn.module_name }}
                    </span>

                    <span
                      v-if="index !== getSortedConnections(group.connections).length - 1"
                      class="hidden sm:inline mx-2"
                    >
                      •
                    </span>
                  </template>
                </div>
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

            <!-- Edit Icon -->
            <AppTooltip text="Edit integration">
              <UButton
                @click.stop="editGroup(group)"
                variant="ghost"
                color="gray"
                icon="heroicons:pencil-square"
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
          <!-- <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <UIcon name="heroicons:link" class="w-4 h-4 text-gray-400" />
              <h4 class="text-sm font-semibold text-gray-300">
                Connection ({{ group.connections.length }})
              </h4>
            </div>
          </div> -->

          <!-- Connection Cards -->
          <div class="space-y-4">
            <!-- Created Info -->
            <div>
              <h4 class="text-sm font-semibold text-white mb-1.5">API Credentials</h4>
              <div class="text-xs text-gray-400">
                Connected on
                {{ formatDate(group.connections[0]?.created_at) }}
              </div>
            </div>

            <!-- API Credentials -->
            <div
              class="text-xs text-gray-400 space-y-2 bg-dark-800 rounded-lg p-4 border border-dark-700"
            >
              <div class="flex justify-between items-start">
                <span class="text-gray-500 font-medium">Client ID:</span>
                <span class="font-mono text-gray-300 break-all text-right ml-4">
                  {{ maskSensitiveData(group.connections[0]?.client_id) }}
                </span>
              </div>

              <div class="flex justify-between items-start">
                <span class="text-gray-500 font-medium">Client Secret:</span>
                <span class="font-mono text-gray-300 break-all text-right ml-4">
                  {{ maskSensitiveData(group.connections[0]?.client_secret) }}
                </span>
              </div>

              <div v-if="group.connections[0]?.api_key" class="flex justify-between items-start">
                <span class="text-gray-500 font-medium">API Key:</span>
                <span class="font-mono text-gray-300 break-all text-right ml-4">
                  {{ maskSensitiveData(group.connections[0]?.api_key) }}
                </span>
              </div>

              <div v-if="group.connections[0]?.login_url" class="flex justify-between items-start">
                <span class="text-gray-500 font-medium">Login URL:</span>
                <span class="font-mono text-gray-300 break-all text-right ml-4">
                  {{ group.connections[0]?.login_url }}
                </span>
              </div>

              <div v-if="group.connections[0]?.base_url" class="flex justify-between items-start">
                <span class="text-gray-500 font-medium">Base URL:</span>
                <span class="font-mono text-gray-300 break-all text-right ml-4">
                  {{ group.connections[0]?.base_url }}
                </span>
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

    <!-- Delete Confirmation Modal -->
    <ConfirmPopup
      :is-open="showDeleteConfirmModal"
      type="danger"
      title="Delete Integration"
      :message="`Are you sure you want to delete this integration and all its ${groupToDelete?.connections?.length || 0} connection(s)?`"
      :details="`${groupToDelete?.provider} - ${groupToDelete?.agent}`"
      :confirm-text="isDeletingGroup ? 'Deleting...' : 'Delete'"
      cancel-text="Cancel"
      :loading="isDeletingGroup"
      @confirm="confirmDeleteGroup"
      @update:isOpen="
        (value) => {
          if (!value) {
            showDeleteConfirmModal = false
            groupToDelete = null
          }
        }
      "
    />

    <!-- Add/Edit Application Modal -->
    <UModal v-model="showApplicationModal" size="lg" prevent-close>
      <div class="p-6 space-y-4">
        <!-- Close Button -->
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-white">
            {{ editingAppId ? 'Edit Application' : 'Add New Application' }}
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
            <label class="block text-sm font-medium text-white leading-none"
              >Select Agent <span class="text-red-500">*</span></label
            >
            <AppTooltip v-if="areFieldsLocked" text="Agent is locked to this integration group">
              <UIcon
                name="heroicons:information-circle"
                class="w-4 h-4 text-gray-400 flex-shrink-0"
              />
            </AppTooltip>
          </div>
          <div class="relative">
            <select
              v-model="applicationForm.agent_id"
              :disabled="areFieldsLocked"
              class="w-full appearance-none bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-30 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              <option disabled value="">Select an agent</option>

              <option
                v-for="agent in agentOptions"
                :key="agent.value"
                :value="agent.value"
                :disabled="agent.disabled"
                class="bg-dark-900 text-white"
              >
                {{ agent.label }}{{ agent.disabled ? ' (Coming Soon)' : '' }}
              </option>
            </select>

            <!-- Dropdown Icon -->
            <div
              class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400"
            >
              <UIcon name="heroicons:chevron-down" class="w-4 h-4" />
            </div>
          </div>
        </div>

        <!-- Select Provider -->
        <div>
          <div class="flex items-center gap-2 mb-2">
            <label class="block text-sm font-medium text-white leading-none">
              Select Provider <span class="text-red-500">*</span>
            </label>

            <AppTooltip v-if="areFieldsLocked" text="Provider is locked to this integration group">
              <UIcon
                name="heroicons:information-circle"
                class="w-4 h-4 text-gray-400 flex-shrink-0"
              />
            </AppTooltip>

            <AppTooltip v-if="!applicationForm.agent_id" text="Please select an Agent first">
              <UIcon
                name="heroicons:information-circle"
                class="w-4 h-4 text-gray-400 flex-shrink-0"
              />
            </AppTooltip>
          </div>

          <div
            :class="[
              'grid grid-cols-3 gap-4 auto-rows-fr',
              !applicationForm.agent_id ? 'opacity-50 pointer-events-none' : '',
            ]"
          >
            <div v-for="provider in filteredProviders" :key="provider.id">
              <AppTooltip
                :text="!provider.is_active ? provider.name + ' (Coming Soon) ' : provider.name"
              >
                <button
                  @click="toggleProvider(provider)"
                  :disabled="areFieldsLocked || !applicationForm.agent_id || !provider.is_active"
                  :class="[
                    'w-full h-24 rounded-lg border transition-all flex items-center justify-center',
                    areFieldsLocked || !applicationForm.agent_id
                      ? 'opacity-50 cursor-not-allowed'
                      : '',
                    !provider.is_active ? 'opacity-30 cursor-not-allowed' : '',
                    applicationForm.provider_id === provider.id && provider.is_active
                      ? 'border-primary-500 bg-primary-500/20'
                      : provider.is_active
                        ? 'border-dark-700 bg-dark-900 hover:border-dark-600'
                        : 'border-dark-700 bg-black',
                  ]"
                >
                  <img
                    v-if="provider.logo_url"
                    :src="provider.logo_url"
                    alt="provider logo"
                    class="w-16 h-16 object-contain"
                  />

                  <UIcon v-else :name="getProviderIcon(provider.name)" class="w-6 h-6 text-white" />
                </button>
              </AppTooltip>
            </div>
          </div>
        </div>
        <!-- Request Provider CTA -->
        <div class="mt-3 text-left">
          <button
            type="button"
            class="text-sm text-primary-400 hover:text-primary-300 underline"
            @click="openRequestProviderModal"
          >
            Don’t see your provider?
          </button>
        </div>

        <!-- Select Module (Multi-select) -->
        <div>
          <div class="flex items-center gap-2 mb-2">
            <label class="block text-sm font-medium text-white leading-none"
              >Select Modules <span class="text-red-500">*</span></label
            >
            <!-- <span v-if="applicationForm.module_ids.length > 0" class="text-xs text-gray-400">
              ({{ applicationForm.module_ids.length }} selected)
            </span> -->
            <!-- <AppTooltip v-if="areFieldsLocked" text="Modules are locked to this integration group">
              <UIcon
                name="heroicons:information-circle"
                class="w-4 h-4 text-gray-400 flex-shrink-0"
              />
            </AppTooltip> -->
            <AppTooltip v-if="!applicationForm.agent_id" text="Please select an Agent first">
              <UIcon
                name="heroicons:information-circle"
                class="w-4 h-4 text-gray-400 flex-shrink-0"
              />
            </AppTooltip>

            <AppTooltip
              v-if="applicationForm.agent_id && !applicationForm.provider_id"
              text="Please select a Provider first"
            >
              <UIcon
                name="heroicons:information-circle"
                class="w-4 h-4 text-gray-400 flex-shrink-0"
              />
            </AppTooltip>
          </div>
          <div
            :class="[
              'grid grid-cols-2 sm:grid-cols-3 gap-2',
              !applicationForm.agent_id || !applicationForm.provider_id
                ? 'opacity-50 pointer-events-none'
                : '',
            ]"
          >
            <button
              v-for="module in filteredModules"
              :key="module.id"
              @click="toggleModule(module)"
              :disabled="!applicationForm.agent_id || !applicationForm.provider_id"
              :class="[
                'p-3 rounded-lg border transition-all text-sm font-medium flex flex-col items-center justify-center gap-2',
                !applicationForm.agent_id || !applicationForm.provider_id
                  ? 'opacity-50 cursor-not-allowed'
                  : '',
                applicationForm.module_ids.includes(module.id)
                  ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                  : 'border-dark-700 bg-dark-900 text-gray-400 hover:border-dark-600',
              ]"
            >
              <UIcon :name="getModuleIcon(module.name)" class="w-5 h-5" />
              {{ module.name }}
            </button>
          </div>
        </div>

        <!-- API Credentials -->
        <div class="space-y-4 p-4 bg-dark-900 rounded-lg border border-dark-700">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-white whitespace-nowrap">
              API Credentials <span class="text-red-500">*</span>
            </h3>

            <ProviderCredentialHelp :provider="applicationForm.provider" />
          </div>

          <div>
            <label class="block text-xs text-gray-400 mb-1"
              >Client ID <span class="text-red-500">*</span></label
            >
            <input
              v-model="applicationForm.client_id"
              placeholder="Enter client ID"
              class="input-field w-full"
              autocomplete="new-password"
            />
          </div>

          <div>
            <label class="block text-xs text-gray-400 mb-1"
              >Client Secret <span class="text-red-500">*</span></label
            >
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
            <label class="block text-xs text-gray-400 mb-1"
              >API Key <span class="text-red-500">*</span></label
            >
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
            <label class="block text-xs text-gray-400 mb-1"
              >Access Token <span class="text-red-500">*</span></label
            >
            <input
              v-model="applicationForm.access_token"
              placeholder="Enter access token"
              class="input-field w-full"
              autocomplete="new-password"
            />
          </div>

          <div>
            <label class="block text-xs text-gray-400 mb-1"
              >Login URL <span class="text-red-500">*</span></label
            >
            <input
              v-model="applicationForm.login_url"
              placeholder="https://example.com/login"
              class="input-field w-full"
              autocomplete="off"
            />
          </div>

          <div>
            <label class="block text-xs text-gray-400 mb-1"
              >Base URL <span class="text-red-500">*</span></label
            >
            <input
              v-model="applicationForm.base_url"
              placeholder="https://example.com"
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
            {{ editingAppId ? 'Update' : 'Add' }}
            {{ 'Application' }}
          </UButton>
        </div>
      </div>
    </UModal>
    <UModal v-model="showRequestProviderModal" size="md" prevent-close>
      <div class="p-6 space-y-4">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-white">Request New Application</h2>
          <button
            @click="closeRequestProviderModal"
            class="text-gray-400 hover:text-white transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        <!-- Application Name -->
        <div>
          <label class="text-sm text-gray-400">
            Application Name <span class="text-red-500">*</span>
          </label>
          <input
            v-model="requestProviderForm.provider_name"
            placeholder="e.g. BambooHR"
            class="input-field w-full"
          />
        </div>

        <!-- Website -->
        <div>
          <label class="text-sm text-gray-400">
            Application Website URL <span class="text-red-500">*</span>
          </label>
          <input
            v-model="requestProviderForm.website_url"
            placeholder="https://example.com"
            class="input-field w-full"
          />
        </div>

        <!-- Notes -->
        <div>
          <label class="text-sm text-gray-400">Additional Notes</label>
          <textarea
            v-model="requestProviderForm.notes"
            placeholder="Any specific requirement..."
            class="input-field w-full"
          />
        </div>

        <!-- Email -->
        <div>
          <label class="text-sm text-gray-400">Contact Email</label>
          <input
            v-model="requestProviderForm.contact_email"
            disabled
            class="input-field w-full opacity-70"
          />
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-2 pt-4 border-t border-dark-700">
          <UButton variant="outline" color="gray" @click="closeRequestProviderModal">
            Cancel
          </UButton>

          <UButton
            @click="submitProviderRequest"
            :loading="integrationsStore.loadingProviderRequest"
            :disabled="!requestProviderForm.provider_name || !requestProviderForm.website_url"
          >
            Submit Request
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
import ConfirmPopup from '~/components/ui/ConfirmPopup.vue'
import ProviderCredentialHelp from '~/components/integrations/ProviderCredentialHelp.vue'
import { useOrganizationIntegrationsStore } from '~/stores/organization-integrations'
import { useErrorStore } from '~/stores/error'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

useHead({
  title: 'Applications - Admin Dashboard - provento.ai',
})

const { showSuccess, showInfo } = useNotification()
const errorStore = useErrorStore()
const authStore = useAuthStore()
const integrationsStore = useOrganizationIntegrationsStore()

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
  createIntegrationsBatch,
  updateIntegration,
  updateIntegrationStatus,
  deleteIntegration,
  syncIntegrationModules,
  clearMessages,
  getModulesForAgent,
  getProvidersForAgent,
  getProvidersForAgentAndModule,
  getModulesForAgentAndProvider,
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
const originalEditSnapshot = ref<any>(null)
const showDeleteConfirmModal = ref(false)
const groupToDelete = ref<any>(null)
const isDeletingGroup = ref(false)
const showRequestProviderModal = ref(false)

// Form data
const applicationForm = ref({
  agent: '',
  agent_id: '',
  module_ids: [] as string[],
  modules: [] as any[],
  moduleConnectionNames: {} as Record<string, string>,
  provider: '',
  provider_id: '',
  name: '',
  client_id: '',
  client_secret: '',
  api_key: '',
  access_token: '',
  login_url: '',
  base_url: '',
})

const agentOptions = computed(() =>
  agents.value.map((a) => ({
    label: a.name,
    value: a.id,
    disabled: !a.is_active,
  })),
)

const getDefaultRequestProviderForm = () => ({
  provider_name: '',
  website_url: '',
  notes: '',
  contact_email: authStore.user?.email || '',
})

const requestProviderForm = ref(getDefaultRequestProviderForm())

// Transform grouped integrations for UI display
const applicationsList = computed(() => {
  const store = useOrganizationIntegrationsStore()
  const grouped = store.getGroupedIntegrations

  return grouped.map((group) => ({
    id: `${group.provider_id}-${group.agent_id}`,
    provider: group.provider_name,
    agent: group.agent_name,
    module: group.modules?.[0]?.name, // For backward compatibility, show first module
    modules: group.modules || [], // All modules for this provider-agent combo
    provider_id: group.provider_id,
    agent_id: group.agent_id,
    module_id: group.modules?.[0]?.id, // For backward compatibility
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

const getSortedConnections = (connections: any[]) => {
  return [...connections].sort((a, b) => a.module_name.localeCompare(b.module_name))
}

// Dynamic tabs based on available agents (already sorted with HRMS first in store)
const tabs = computed(() => {
  const baseTabs = [{ label: 'All', value: 'all', isActive: true }]

  // Agents are already sorted in the store with HRMS first
  agents.value.forEach((agent) => {
    baseTabs.push({ label: agent.name, value: agent.id, isActive: agent.is_active })
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

// Check if fields should be disabled (locked to integration group)
const areFieldsLocked = computed(() => !!editingAppId.value)

// Filter providers based on selected agent only
const filteredProviders = computed(() => {
  if (!applicationForm.value.agent_id) {
    return providers.value
  }

  // Providers depend only on agent (no module dependency)
  return getProvidersForAgent(applicationForm.value.agent_id)
})

// Filter modules based on selected agent and optionally provider
const filteredModules = computed(() => {
  if (!applicationForm.value.agent_id) {
    return modules.value
  }

  // If provider is selected, filter modules for both agent and provider
  if (applicationForm.value.provider_id) {
    return getModulesForAgentAndProvider(
      applicationForm.value.agent_id,
      applicationForm.value.provider_id,
    )
  }

  // Otherwise, just filter for agent
  return getModulesForAgent(applicationForm.value.agent_id)
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

const editGroup = async (group: any) => {
  editingAppId.value = group.id

  const firstConnection = group.connections[0]
  const decrypted = await decryptIntegrationForDisplay(firstConnection)

  const moduleIds = group.connections.map((c: any) => c.module_id)

  applicationForm.value = {
    agent: group.agent,
    agent_id: group.agent_id,
    provider: group.provider,
    provider_id: group.provider_id,
    module_ids: [...moduleIds],
    modules: group.connections.map((c: any) => ({
      id: c.module_id,
      name: c.module_name,
    })),
    moduleConnectionNames: {},
    name: '',
    client_id: decrypted.client_id || '',
    client_secret: decrypted.client_secret || '',
    api_key: decrypted.api_key || '',
    access_token: decrypted.access_token || '',
    login_url: decrypted.login_url || '',
    base_url: decrypted.base_url || '',
  }

  // 🔥 Save original snapshot
  originalEditSnapshot.value = {
    module_ids: [...moduleIds].sort(),
    client_id: decrypted.client_id || '',
    client_secret: decrypted.client_secret || '',
    api_key: decrypted.api_key || '',
    access_token: decrypted.access_token || '',
    login_url: decrypted.login_url || '',
    base_url: decrypted.base_url || '',
  }

  showApplicationModal.value = true
}

const hasChanges = () => {
  if (!originalEditSnapshot.value) return true

  const currentModules = [...applicationForm.value.module_ids].sort()

  const sameModules =
    JSON.stringify(currentModules) === JSON.stringify(originalEditSnapshot.value.module_ids)

  const sameCredentials =
    applicationForm.value.client_id === originalEditSnapshot.value.client_id &&
    applicationForm.value.client_secret === originalEditSnapshot.value.client_secret &&
    applicationForm.value.api_key === originalEditSnapshot.value.api_key &&
    applicationForm.value.access_token === originalEditSnapshot.value.access_token &&
    applicationForm.value.login_url === originalEditSnapshot.value.login_url &&
    applicationForm.value.base_url === originalEditSnapshot.value.base_url

  return !(sameModules && sameCredentials)
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

const toggleProvider = (provider: any) => {
  if (areFieldsLocked.value || !applicationForm.value.agent_id || !provider.is_active) {
    return
  }

  // If clicking the same provider → unselect
  if (applicationForm.value.provider_id === provider.id) {
    applicationForm.value.provider_id = ''
    applicationForm.value.provider = ''

    // Reset dependent selections
    applicationForm.value.module_ids = []
    applicationForm.value.modules = []
    applicationForm.value.moduleConnectionNames = {}
  } else {
    // Select new provider
    applicationForm.value.provider_id = provider.id
    applicationForm.value.provider = provider.name
  }
}

const toggleModule = (module: any) => {
  if (!applicationForm.value.agent_id) return

  const exists = applicationForm.value.module_ids.includes(module.id)

  if (exists) {
    // 🔴 REMOVE
    applicationForm.value.module_ids = applicationForm.value.module_ids.filter(
      (id) => id !== module.id,
    )

    applicationForm.value.modules = applicationForm.value.modules.filter((m) => m.id !== module.id)

    const { [module.id]: _, ...rest } = applicationForm.value.moduleConnectionNames

    applicationForm.value.moduleConnectionNames = rest
  } else {
    // 🟢 ADD
    applicationForm.value.module_ids = [...applicationForm.value.module_ids, module.id]

    applicationForm.value.modules = [...applicationForm.value.modules, module]

    applicationForm.value.moduleConnectionNames = {
      ...applicationForm.value.moduleConnectionNames,
      [module.id]: '',
    }
  }
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
  applicationForm.value = {
    agent: '',
    agent_id: '',
    module_ids: [],
    modules: [],
    moduleConnectionNames: {},
    provider: '',
    provider_id: '',
    name: '',
    client_id: '',
    client_secret: '',
    api_key: '',
    access_token: '',
    login_url: '',
    base_url: '',
  }
  showApplicationModal.value = true
}

const closeApplicationModal = () => {
  showApplicationModal.value = false
  editingAppId.value = null
  showApplicationClientSecret.value = false
  showApplicationApiKey.value = false
}

const isProviderAlreadyAdded = (): boolean => {
  // Only check for duplicates when creating new (not editing)
  if (editingAppId.value) {
    return false
  }

  // Check if this provider + agent combination already exists
  const existingGroup = applicationsList.value.find(
    (group) =>
      group.provider_id === applicationForm.value.provider_id &&
      group.agent_id === applicationForm.value.agent_id,
  )

  return !!existingGroup
}

const saveApplication = async () => {
  isSavingApplication.value = true
  clearMessages()

  try {
    // Validate required fields
    if (
      !applicationForm.value.agent_id ||
      applicationForm.value.module_ids.length === 0 ||
      !applicationForm.value.provider_id
    ) {
      errorStore.showError('Please select Agent, at least one Module, and Provider')
      return
    }

    // Check for duplicate provider
    if (isProviderAlreadyAdded()) {
      errorStore.showError(
        'This provider is already added for this agent. You can edit the existing integration instead.',
      )
      return
    }

    if (!applicationForm.value.client_id) {
      errorStore.showError('Please fill in all required credential fields')
      return
    }

    // Get provider name for hrms_system
    const selectedProvider = providers.value.find((p) => p.id === applicationForm.value.provider_id)
    const hrmsSystem = selectedProvider?.name || applicationForm.value.provider_id

    // Common credentials and data for batch operations
    const batchPayload = {
      provider_id: applicationForm.value.provider_id,
      agent_id: applicationForm.value.agent_id,
      client_id: applicationForm.value.client_id,
      client_secret: applicationForm.value.client_secret,
      api_key: applicationForm.value.api_key,
      access_token: applicationForm.value.access_token,
      login_url: applicationForm.value.login_url,
      base_url: applicationForm.value.base_url,
      status: 'active' as const,
      hrms_system: hrmsSystem,
      is_hrms: true,
    }

    if (editingAppId.value) {
      // EDIT MODE: Sync modules (handles add/update/delete in one call)
      if (!hasChanges()) {
        showInfo('Nothing to update')
        return
      }

      const group = filteredApplications.value.find((g) => g.id === editingAppId.value)
      if (!group) return

      const existingModuleIds = group.connections.map((c: any) => c.module_id)

      // Use batch sync to handle all changes in one API call
      const result = await syncIntegrationModules({
        ...batchPayload,
        module_ids: applicationForm.value.module_ids,
        existing_module_ids: existingModuleIds,
      })

      if (!result.success && !result.partial) {
        // Error will be shown through store watcher
        return
      }
    } else {
      // CREATE MODE: Batch create all modules in one API call
      const result = await createIntegrationsBatch({
        ...batchPayload,
        modules: applicationForm.value.module_ids,
      })

      if (!result.success && !result.partial) {
        // Error will be shown through store watcher
        return
      }
    }

    // Close modal after successful operation
    closeApplicationModal()
  } finally {
    isSavingApplication.value = false
  }
}

const deleteGroup = (group: any) => {
  groupToDelete.value = group
  showDeleteConfirmModal.value = true
}

const confirmDeleteGroup = async () => {
  if (!groupToDelete.value) return

  isDeletingGroup.value = true
  try {
    const connections = groupToDelete.value.connections
    const store = useOrganizationIntegrationsStore()

    // Get all integration IDs from connections
    const integrationIds = connections.map((connection: any) => connection.id)

    // Use batch delete API for single call
    const result = await store.batchDeleteIntegrations(integrationIds)

    if (!result.success && !result.partial) {
      // Error will be shown through store watcher
      return
    }

    // Success/error messages will be displayed through store watchers
    showDeleteConfirmModal.value = false
    groupToDelete.value = null
  } catch (err) {
    // Unexpected errors from catch block
    errorStore.showError('Unexpected error occurred during deletion')
  } finally {
    isDeletingGroup.value = false
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
    errorStore.showError('Failed to update status')
  }
}

const updateGroupStatus = async (group: any, status: string) => {
  try {
    const connections = group.connections
    const statusLower = status.toLowerCase() as 'active' | 'inactive' | 'expired' | 'failed'
    const store = useOrganizationIntegrationsStore()

    // Get all integration IDs from connections
    const integrationIds = connections.map((connection: any) => connection.id)

    // Use batch status update API for single call
    const result = await store.batchUpdateIntegrationStatus(integrationIds, statusLower)

    if (!result.success && !result.partial) {
      // Error will be shown through store watcher
      return
    }

    // Message will be displayed through store watchers
    activeAppStatusMenu.value = null
  } catch (err) {
    // Unexpected errors from catch block
    errorStore.showError('Failed to update group status')
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

const openRequestProviderModal = () => {
  requestProviderForm.value = getDefaultRequestProviderForm()
  showApplicationModal.value = false
  showRequestProviderModal.value = true
}

const closeRequestProviderModal = () => {
  showRequestProviderModal.value = false
  requestProviderForm.value = getDefaultRequestProviderForm()
}

const submitProviderRequest = async () => {
  if (!requestProviderForm.value.provider_name || !requestProviderForm.value.website_url) {
    errorStore.showError('Please fill all required fields')
    return
  }

  const result = await integrationsStore.submitProviderRequest(requestProviderForm.value)

  if (!result.success) return

  closeRequestProviderModal()
}

const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && showRequestProviderModal.value) {
    closeRequestProviderModal()
  }
}

onMounted(async () => {
  requestProviderForm.value.contact_email = authStore.user?.email || ''
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleEscapeKey)
  window.addEventListener('scroll', handleScrollOrResize)
  window.addEventListener('resize', handleScrollOrResize)

  // Fetch all necessary data
  try {
    await fetchMasterData() // Fetch providers, modules, agents
    await fetchIntegrations() // Fetch integrations for the organization
  } catch (err) {
    console.error('Failed to load integrations:', err)
    errorStore.showError('Failed to load integrations')
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscapeKey)
  window.removeEventListener('scroll', handleScrollOrResize)
  window.removeEventListener('resize', handleScrollOrResize)
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

// Watch for agent selection changes - reset provider and module selections (only when adding new application, not adding connection or editing)
watch(
  () => applicationForm.value.agent_id,
  () => {
    // Only reset if we're adding a new application (not in connection mode and not editing)
    if (!editingAppId.value) {
      applicationForm.value.provider_id = ''
      applicationForm.value.provider = ''
      applicationForm.value.module_ids = []
      applicationForm.value.modules = []
      applicationForm.value.moduleConnectionNames = {}
    }
  },
)

// Watch for provider selection changes - reset module selection (only when adding new application, not adding connection or editing)
watch(
  () => applicationForm.value.provider_id,
  () => {
    // Only reset if we're adding a new application (not in connection mode and not editing)
    if (!editingAppId.value) {
      applicationForm.value.module_ids = []
      applicationForm.value.modules = []
      applicationForm.value.moduleConnectionNames = {}
    }
  },
)

// Watch for module selection changes - reset module connection names for unselected modules
watch(
  () => applicationForm.value.module_ids,
  (newModuleIds) => {
    // Clear connection names for modules that are no longer selected
    const currentConnectionNames = { ...applicationForm.value.moduleConnectionNames }
    Object.keys(currentConnectionNames).forEach((moduleId) => {
      if (!newModuleIds.includes(moduleId)) {
        delete currentConnectionNames[moduleId]
      }
    })
    applicationForm.value.moduleConnectionNames = currentConnectionNames
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
