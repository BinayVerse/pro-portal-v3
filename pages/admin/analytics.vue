<template>
  <AdminLayout>
    <div class="space-y-6">
      <!-- Header with Date Range -->
      <div
        class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6"
        style="margin-top: 0"
      >
        <div>
          <h1 class="text-lg sm:text-xl lg:text-2xl font-bold text-white">Analytics & Reports</h1>
          <p class="text-xs sm:text-sm lg:text-base text-gray-400">Comprehensive usage reports</p>
        </div>
        <div
          class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 flex-shrink-0"
        >
          <!-- AI Knowledge Gap Button -->
          <button
            @click="openKnowledgeGap"
            :disabled="knowledgeGapLoading"
            class="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-4 py-2 rounded-lg transition-all flex items-center justify-center sm:justify-start space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UIcon
              name="heroicons:chart-bar"
              class="w-5 h-5"
              :class="{ 'animate-pulse': knowledgeGapLoading }"
            />
            <span class="hidden sm:inline">Knowledge Enhancement Opportunities</span>
            <span class="sm:hidden">Knowledge</span>
          </button>

          <!-- AI Actionable Button with Badge -->
          <button
            @click="openAIInsights"
            :disabled="aiInsightsLoading"
            class="relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all flex items-center justify-center sm:justify-start space-x-2 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <UIcon
              name="heroicons:light-bulb"
              class="w-5 h-5"
              :class="{ 'animate-pulse': aiInsightsLoading }"
            />
            <span class="hidden sm:inline">AI Signals</span>
            <span class="sm:hidden">AI</span>
          </button>

          <select v-model="selectedTimeRange" class="input-field">
            <option v-for="option in timeRangeOptions" :key="option.value" :value="option.value">
              {{ option.rangeLabel }}
            </option>
          </select>
          <button
            @click="exportReport"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center sm:justify-start space-x-2"
          >
            <UIcon name="heroicons:arrow-down-tray" class="w-4 h-4" />
            <span class="hidden sm:inline">Export Report</span>
            <span class="sm:hidden">Export</span>
          </button>
        </div>
      </div>

      <!-- Plan Upgrade Alert (aggregated, single modal) -->
      <PlanUpgradeAlert :data="usageAlertData" @upgrade="navigateToPlans" />

      <!-- Top Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 xl:gap-6 mt-4">
        <!-- Total Queries -->
        <div class="bg-dark-800 rounded-lg p-3 sm:p-4 xl:p-6 border border-dark-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-400 text-sm font-medium">Total Queries</p>
              <p :class="`text-lg font-bold mt-2 ${queriesTextColor}`">
                {{ loadingStates.metrics ? '...' : queriesUsageValue.display }}
              </p>
            </div>
            <div v-if="loadingStates.metrics" class="w-12 h-12 flex items-center justify-center">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
            <div
              v-else
              :class="`w-12 h-12 ${queriesUsageColor} rounded-lg flex items-center justify-center`"
            >
              <UIcon name="heroicons:chart-bar" :class="`w-6 h-6 ${queriesIconColor}`" />
            </div>
          </div>
        </div>

        <!-- Total Users -->
        <div class="bg-dark-800 rounded-lg p-3 sm:p-4 xl:p-6 border border-dark-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-400 text-sm font-medium">Total Users</p>
              <p
                :class="`text-lg font-bold mt-2 cursor-pointer ${usersTextColor}`"
                @click="showOrganizationUsers"
              >
                {{ loadingStates.metrics ? '...' : usersUsageValue.display }}
              </p>
            </div>
            <div v-if="loadingStates.metrics" class="w-12 h-12 flex items-center justify-center">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
            <div
              v-else
              :class="`w-12 h-12 ${usersUsageColor} rounded-lg flex items-center justify-center`"
            >
              <UIcon name="heroicons:users" :class="`w-6 h-6 ${usersIconColor}`" />
            </div>
          </div>
        </div>

        <!-- Artifacts Created -->
        <div class="bg-dark-800 rounded-lg p-3 sm:p-4 xl:p-6 border border-dark-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-400 text-sm font-medium">Artifacts Created</p>
              <p
                :class="`text-lg font-bold mt-2 cursor-pointer ${artefactsTextColor}`"
                @click="showOrganizationDocuments"
              >
                {{ loadingStates.metrics ? '...' : artefactsUsageValue.display }}
              </p>
            </div>
            <div v-if="loadingStates.metrics" class="w-12 h-12 flex items-center justify-center">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
            <div
              v-else
              :class="`w-12 h-12 ${artefactsUsageColor} rounded-lg flex items-center justify-center`"
            >
              <UIcon name="heroicons:document-text" :class="`w-6 h-6 ${artefactsIconColor}`" />
            </div>
          </div>
        </div>

        <!-- Token Usage -->
        <div class="bg-dark-800 rounded-lg p-3 sm:p-4 xl:p-6 border border-dark-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-400 text-sm font-medium">Token Usage</p>
              <p
                :class="`text-lg font-bold mt-2 cursor-pointer ${tokensTextColor}`"
                @click="showOrganizationTokenUsage"
              >
                {{ loadingStates.metrics ? '...' : tokensUsageValue.display }}
              </p>
            </div>
            <div v-if="loadingStates.metrics" class="w-12 h-12 flex items-center justify-center">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
            <div
              v-else
              :class="`w-12 h-12 ${tokensUsageColor} rounded-lg flex items-center justify-center`"
            >
              <UIcon name="heroicons:bolt" :class="`w-6 h-6 ${tokensIconColor}`" />
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 xl:gap-6">
        <!-- User-wise Token Usage by Channel -->
        <div class="bg-dark-800 rounded-lg border border-dark-700 flex flex-col">
          <div class="p-6 border-b border-dark-700">
            <h2 class="text-lg font-semibold text-white">User-wise Token Usage by Channel</h2>
            <p class="text-gray-400 text-sm">Token consumption across different channels</p>
          </div>
          <div class="flex-1 p-6 relative min-h-80">
            <div
              v-if="loadingStates.stackedBar"
              class="absolute inset-0 flex items-center justify-center"
            >
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
            <StackedBarChart v-else :chartData="stackedChartData" />
          </div>
        </div>

        <!-- App-wise Token Usage -->
        <div class="bg-dark-800 rounded-lg border border-dark-700 flex flex-col">
          <div class="p-6 border-b border-dark-700">
            <h2 class="text-lg font-semibold text-white">App-wise Token Usage</h2>
            <p class="text-gray-400 text-sm">Token distribution across different applications</p>
          </div>
          <div class="flex-1 flex items-center justify-center p-6 relative min-h-80">
            <div
              v-if="loadingStates.pieChart"
              class="absolute inset-0 flex items-center justify-center"
            >
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
            <div v-else class="max-w-md w-full flex justify-center">
              <PieChart
                :data="pieChartData"
                :labels="pieChartLabelsOrdered"
                :colors="pieChartColors"
                class="max-h-80"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Daily User-wise Token Usage -->
      <div class="bg-dark-800 rounded-lg border border-dark-700">
        <div class="p-6 border-b border-dark-700">
          <h2 class="text-lg font-semibold text-white">Daily Top 5 Users by Token Usage</h2>
          <p class="text-gray-400 text-sm">Daily top 5 token consumption patterns by application</p>
        </div>
        <div class="p-6 relative min-h-80">
          <div
            v-if="loadingStates.areaChart"
            class="absolute inset-0 flex items-center justify-center"
          >
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
          <StackedAreaChart
            v-else
            :data="stackedAreaChartData"
            :categories="stackedAreaChartCategories"
            :time-range="selectedTimeRange"
          />
        </div>
      </div>

      <!-- Department Analytics Section -->
      <div class="grid xl:grid-cols-2 gap-6">
        <!-- Chart 1: Users vs Artifacts by Department (Bar Chart) -->
        <div class="bg-dark-800 rounded-lg border border-dark-700 flex flex-col">
          <div class="p-6 border-b border-dark-700">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-lg font-semibold text-white">Users vs Artifacts by Department</h2>
                <p class="text-gray-400 text-sm">Department-wise user adoption and content usage</p>
              </div>
              <!-- In future will uncomment this for Department admin role -->
              <!-- <div v-if="authUser?.role_id === 3" class="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs">
                Department Admin View
              </div> -->
            </div>
          </div>
          <div class="flex-1 p-6 relative min-h-[450px]">
            <DepartmentBarChart
              :chart-data="analyticsStore.getDepartmentBarChartData"
              :loading="loadingStates.departmentBarChart"
            />
          </div>
        </div>

        <!-- Chart 2: Department Distribution (Pie Chart - User Percentage) -->
        <div class="bg-dark-800 rounded-lg border border-dark-700 flex flex-col">
          <div class="p-6 border-b border-dark-700">
            <h2 class="text-lg font-semibold text-white">Department Distribution</h2>
            <p class="text-gray-400 text-sm">User percentage distribution across departments</p>
          </div>
          <div class="flex-1 flex items-center justify-center p-6 relative min-h-80">
            <DepartmentPieChart
              :data="analyticsStore.getDepartmentPieChartData"
              :loading="loadingStates.departmentPieChart"
            />
          </div>
        </div>
      </div>

      <!-- Bottom Grid -->
      <div class="grid xl:grid-cols-2 gap-6">
        <!-- Category-wise Artifacts Distribution -->
        <div class="bg-dark-800 rounded-lg border border-dark-700 flex flex-col">
          <div class="p-6 border-b border-dark-700">
            <h2 class="text-lg font-semibold text-white">Category-wise Artifacts Distribution</h2>
            <p class="text-gray-400 text-sm">Artifacts usage distribution by category</p>
          </div>
          <div class="flex-1 flex items-center justify-center p-6 relative min-h-80">
            <div
              v-if="loadingStates.donutChart"
              class="absolute inset-0 flex items-center justify-center"
            >
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
            <div v-else class="max-w-md w-full flex justify-center">
              <DonutChart
                :data="donutChartData"
                :labels="donutChartLabels"
                :colors="pieChartColors"
              />
            </div>
          </div>
        </div>

        <!-- Top 5 Queried Artifacts -->
        <div class="bg-dark-800 rounded-lg border border-dark-700 flex flex-col">
          <div class="p-6 border-b border-dark-700">
            <h2 class="text-lg font-semibold text-white">Top 5 Queried Artifacts</h2>
            <p class="text-gray-400 text-sm">Most frequently accessed artifacts</p>
          </div>
          <div class="p-6 relative min-h-60">
            <div
              v-if="loadingStates.topDocuments"
              class="absolute inset-0 flex items-center justify-center"
            >
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
            <template v-else>
              <div class="space-y-4">
                <div
                  v-for="(doc, index) in topDocuments"
                  :key="index"
                  class="flex items-center justify-between p-3 bg-dark-900 rounded-lg"
                >
                  <div class="flex items-center space-x-3">
                    <div>
                      <p class="text-white font-medium text-sm">{{ doc.name }}</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-white font-medium">{{ doc.usage }}</p>
                    <p class="text-gray-400 text-xs">usage</p>
                  </div>
                </div>
              </div>
              <div v-if="topDocuments.length === 0" class="text-center text-gray-400 py-4">
                No artifacts data available
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Frequently Asked Questions -->
      <div class="bg-dark-800 rounded-lg border border-dark-700">
        <div class="p-6 border-b border-dark-700">
          <h2 class="text-lg font-semibold text-white">Top 10 Frequently Asked Questions</h2>
          <p class="text-gray-400 text-sm">Most common questions and query patterns</p>
        </div>
        <div class="p-6 relative min-h-60">
          <div
            v-if="loadingStates.frequentQuestions"
            class="absolute inset-0 flex items-center justify-center"
          >
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
          <template v-else>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                v-for="(column, columnIndex) in splitFrequentQuestions"
                :key="columnIndex"
                class="space-y-4"
              >
                <div v-for="(faq, index) in column" :key="index" class="p-4 bg-dark-900 rounded-lg">
                  <div class="flex items-start justify-between mb-3">
                    <h3 class="text-white font-medium text-sm pr-4">{{ faq.question }}</h3>
                    <div class="text-right flex-shrink-0">
                      <div class="text-xl font-bold text-white">{{ faq.count }}</div>
                    </div>
                  </div>
                  <div class="flex items-center justify-end">
                    <div class="text-xs text-gray-400">times</div>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="frequentQuestions.length === 0" class="text-center text-gray-400 py-4">
              No frequently asked questions available
            </div>
          </template>
        </div>
      </div>

      <!-- User Modal -->
      <UModal
        key="analytics-user-table"
        v-model="userModalIsOpen"
        prevent-close
        :ui="{ width: 'custom-width' }"
      >
        <UCard
          :ui="{
            ring: '',
            divide: 'divide-y divide-gray-100 dark:divide-gray-800',
          }"
        >
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                User List
              </h3>
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-x-mark-20-solid"
                class="-my-1"
                @click="userModalIsOpen = false"
              />
            </div>
          </template>

          <CustomTable
            key="analytics-user-table"
            :columns="userColumns"
            :rows="analyticsStore.orgUserList"
            :loading="userLoading"
            :showActionButton="false"
          />
        </UCard>
      </UModal>

      <!-- Document Modal -->
      <UModal
        key="analytics-artifacts-table"
        v-model="documentModalIsOpen"
        prevent-close
        :ui="{ width: 'custom-width' }"
      >
        <UCard
          :ui="{
            ring: '',
            divide: 'divide-y divide-gray-100 dark:divide-gray-800',
          }"
        >
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                Artifacts List
              </h3>
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-x-mark-20-solid"
                class="-my-1"
                @click="documentModalIsOpen = false"
              />
            </div>
          </template>

          <CustomTable
            key="analytics-artifacts-table"
            :columns="docColumns"
            :rows="analyticsStore.orgDocList"
            :loading="documentLoading"
            :showActionButton="false"
          />
        </UCard>
      </UModal>

      <!-- Token Usage Modal -->
      <UModal
        key="analytics-token-usage-table"
        v-model="tokenUsageModalIsOpen"
        prevent-close
        :ui="{ width: 'custom-width' }"
      >
        <UCard
          :ui="{
            ring: '',
            divide: 'divide-y divide-gray-100 dark:divide-gray-800',
          }"
        >
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                Token Usage Details
              </h3>
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-x-mark-20-solid"
                class="-my-1"
                @click="tokenUsageModalIsOpen = false"
              />
            </div>
          </template>

          <CustomTable
            key="analytics-token-usage-table"
            :columns="tokenUsageColumns"
            :rows="analyticsStore.tokenDetails"
            :showActionButton="false"
          />
        </UCard>
      </UModal>
      <!-- AI Knowledge Gap Modal -->
      <KnowledgeGapModal
        v-model="knowledgeGapModalOpen"
        :knowledge-gap-data="knowledgeGapData?.data"
        :loading="knowledgeGapLoading"
        :sending-email="knowledgeGapEmailSending"
        :error="knowledgeGapError"
        @close="knowledgeGapModalOpen = false"
        @export="handleExportKnowledgeGap"
        @send-email="handleSendKnowledgeGapEmail"
        @retry="openKnowledgeGap"
      />

      <!-- AI Signals Modal -->
      <AIInsightsModal
        v-model="aiInsightsModalOpen"
        :insights-data="aiInsightsData?.data"
        :loading="aiInsightsLoading"
        :sending-email="aiEmailSending"
        :error="aiInsightsError"
        @close="aiInsightsModalOpen = false"
        @export="handleExportInsights"
        @send-email="handleSendInsightsEmail"
        @retry="openAIInsights"
      />
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
useHead({ title: 'Analytics & Reports - Admin Dashboard - provento.ai' })
definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useNotification } from '@/composables/useNotification'
import { useAnalyticsStore } from '@/stores/analytics'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import { useErrorStore } from '@/stores/error'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import StackedBarChart from '@/components/charts/StackedBarChart.vue'
import PieChart from '@/components/charts/PieChart.vue'
import StackedAreaChart from '@/components/charts/StackedAreaChart.vue'
import DonutChart from '@/components/charts/DonutChart.vue'
import PlanUpgradeAlert from '@/components/ui/PlanUpgradeAlert.vue'
import DepartmentBarChart from '@/components/charts/DepartmentBarChart.vue'
import DepartmentPieChart from '@/components/charts/DepartmentPieChart.vue'
import { getColorsForLabels, orderLabels } from '@/utils/chartColors'
import AIInsightsModal from '@/components/analytics/AIInsightsModal.vue'
import KnowledgeGapModal from '@/components/analytics/KnowledgeGapModal.vue'
import { useRoute } from 'vue-router'

dayjs.extend(utc)
dayjs.extend(timezone)

type MetricUsage = {
  name: string
  current: number
  limit: number
  percentage: number
}

const { showNotification } = useNotification()
const analyticsStore = useAnalyticsStore()
const authStore = useAuthStore()
const profileStore = useProfileStore()
const errorStore = useErrorStore()

const authUser = computed(() => authStore.getAuthUser)
const route = useRoute()

// SSR-safe flags
const isMounted = ref(false)

const aiInsightsModalOpen = ref(false)
const aiInsightsLoading = ref(false)
const aiInsightsError = ref<string | null>(null)
const aiInsightsData = ref<any>(null)
const aiEmailSending = ref(false)

const knowledgeGapModalOpen = ref(false)
const knowledgeGapLoading = ref(false)
const knowledgeGapError = ref<string | null>(null)
const knowledgeGapData = ref<any>(null)
const knowledgeGapEmailSending = ref(false)

// Computed organization ID (use route query for superadmin)
const organizationId = computed(() => {
  const qOrg = (route.query?.org || route.query?.org_id || null) as string | null
  if (authUser.value?.role_id === 0 && qOrg) return String(qOrg)
  return authUser.value?.org_id
})

// Get plan details from profile
const planDetails = computed(() => {
  return profileStore.getUserProfile?.plan_details || null
})

// Computed properties for metric colors
const queriesUsageColor = computed(() => {
  return getUsageColorClass(totalQueriesCount.value, planDetails.value?.limit_requests)
})

const queriesIconColor = computed(() => {
  return getUsageIconColorClass(totalQueriesCount.value, planDetails.value?.limit_requests)
})

const queriesTextColor = computed(() => {
  return getUsageTextColorClass(totalQueriesCount.value, planDetails.value?.limit_requests)
})

const usersUsageColor = computed(() => {
  const currentUsers = Number((analyticsStore.organizationDetails as any)?.total_users || 0)
  return getUsageColorClass(currentUsers, planDetails.value?.users)
})

const usersIconColor = computed(() => {
  const currentUsers = Number((analyticsStore.organizationDetails as any)?.total_users || 0)
  return getUsageIconColorClass(currentUsers, planDetails.value?.users)
})

const usersTextColor = computed(() => {
  const currentUsers = Number((analyticsStore.organizationDetails as any)?.total_users || 0)
  return getUsageTextColorClass(currentUsers, planDetails.value?.users)
})

const artefactsUsageColor = computed(() => {
  const currentArtefacts = Number((analyticsStore.organizationDetails as any)?.docs_uploaded || 0)
  return getUsageColorClass(currentArtefacts, planDetails.value?.artefacts)
})

const artefactsIconColor = computed(() => {
  const currentArtefacts = Number((analyticsStore.organizationDetails as any)?.docs_uploaded || 0)
  return getUsageIconColorClass(currentArtefacts, planDetails.value?.artefacts)
})

const artefactsTextColor = computed(() => {
  const currentArtefacts = Number((analyticsStore.organizationDetails as any)?.docs_uploaded || 0)
  return getUsageTextColorClass(currentArtefacts, planDetails.value?.artefacts)
})

const tokensUsageColor = computed(() => {
  return getUsageColorClass(
    totalTokens.value,
    planDetails.value?.metadata?.total_tokens as number | undefined,
  )
})

const tokensIconColor = computed(() => {
  return getUsageIconColorClass(
    totalTokens.value,
    planDetails.value?.metadata?.total_tokens as number | undefined,
  )
})

const tokensTextColor = computed(() => {
  return getUsageTextColorClass(
    totalTokens.value,
    planDetails.value?.metadata?.total_tokens as number | undefined,
  )
})

// Usage metrics computed properties
const usersUsageValue = computed(() => {
  const currentUsers = Number((analyticsStore.organizationDetails as any)?.total_users || 0)
  const limit = planDetails.value?.users ?? null
  const hasPlan = planDetails.value !== null
  const percentage = limit && limit > 0 ? (currentUsers / limit) * 100 : 0

  const result = {
    current: currentUsers,
    limit: limit ?? 0,
    percentage: percentage,
    display:
      hasPlan && (limit === 0 || limit === -1)
        ? `${currentUsers.toLocaleString()} / Unlimited`
        : `${currentUsers.toLocaleString()} / ${limit ?? 0}`,
  }

  return result
})

const queriesUsageValue = computed(() => {
  const current = totalQueriesCount.value || 0
  const limit = planDetails.value?.limit_requests ?? null
  const hasPlan = planDetails.value !== null
  const percentage = limit && limit > 0 ? (current / limit) * 100 : 0

  return {
    current,
    limit: limit ?? 0,
    percentage: percentage,
    display:
      hasPlan && (limit === 0 || limit === -1)
        ? `${formatCompactNumber(current)} / Unlimited`
        : `${formatCompactNumber(current)} / ${formatCompactNumber(limit ?? 0)}`,
  }
})

const artefactsUsageValue = computed(() => {
  const current = Number((analyticsStore.organizationDetails as any)?.docs_uploaded || 0)
  const limit = planDetails.value?.artefacts ?? null
  const hasPlan = planDetails.value !== null
  const percentage = limit && limit > 0 ? (current / limit) * 100 : 0

  return {
    current,
    limit: limit ?? 0,
    percentage: percentage,
    display:
      hasPlan && (limit === 0 || limit === -1)
        ? `${current.toLocaleString()} / Unlimited`
        : `${current.toLocaleString()} / ${limit ?? 0}`,
  }
})

const tokensUsageValue = computed(() => {
  const current = totalTokens.value || 0
  const hasPlan = planDetails.value !== null
  const limit = hasPlan ? ((planDetails.value?.metadata?.total_tokens as number) ?? null) : null
  const percentage = limit && limit > 0 ? (current / limit) * 100 : 0

  return {
    current,
    limit: limit ?? 0,
    percentage: percentage,
    display: `${formatCompactNumber(current)}`,
  }
})

// Aggregated data for PlanUpgradeAlert
const usageAlertData = computed(() => {
  const metrics: MetricUsage[] = []

  if (usersUsageValue.value.limit > 0) {
    metrics.push({
      name: 'Users',
      current: usersUsageValue.value.current,
      limit: usersUsageValue.value.limit,
      percentage: usersUsageValue.value.percentage,
    })
  }

  if (queriesUsageValue.value.limit > 0) {
    metrics.push({
      name: 'Total Queries',
      current: queriesUsageValue.value.current,
      limit: queriesUsageValue.value.limit,
      percentage: queriesUsageValue.value.percentage,
    })
  }

  if (artefactsUsageValue.value.limit > 0) {
    metrics.push({
      name: 'Artifacts',
      current: artefactsUsageValue.value.current,
      limit: artefactsUsageValue.value.limit,
      percentage: artefactsUsageValue.value.percentage,
    })
  }

  if (tokensUsageValue.value.limit > 0) {
    metrics.push({
      name: 'Tokens',
      current: tokensUsageValue.value.current,
      limit: tokensUsageValue.value.limit,
      percentage: tokensUsageValue.value.percentage,
    })
  }

  const exceededMetrics = metrics.filter((m) => m.percentage >= 100)
  const highMetrics = metrics.filter((m) => m.percentage >= 80 && m.percentage < 100)

  return {
    metrics,
    exceededMetrics,
    highMetrics,
    hasExceeded: exceededMetrics.length > 0,
    hasHigh: highMetrics.length > 0,
  }
})

// Format number in compact form (e.g., 1000 -> 1K)
const formatCompactNumber = (value: number) => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`
  }
  return value.toLocaleString()
}

// Helper function to calculate usage percentage and determine color
const getUsageColorClass = (current: number, limit: number | undefined) => {
  if (!limit) return 'bg-green-500/20'
  const percentage = (current / limit) * 100
  if (percentage >= 100) return 'bg-red-500/20'
  if (percentage >= 80) return 'bg-orange-500/20'
  return 'bg-green-500/20'
}

const getUsageIconColorClass = (current: number, limit: number | undefined) => {
  if (!limit) return 'text-green-400'
  const percentage = (current / limit) * 100
  if (percentage >= 100) return 'text-red-400'
  if (percentage >= 80) return 'text-orange-400'
  return 'text-green-400'
}

const getUsageTextColorClass = (current: number, limit: number | undefined) => {
  if (!limit) return 'text-white'
  const percentage = (current / limit) * 100
  if (percentage >= 100) return 'text-red-400'
  if (percentage >= 80) return 'text-orange-400'
  return 'text-white'
}

const loading = ref(true)
const selectedTimeRange = ref('7')
const timeZone = ref(dayjs.tz.guess())

// Modal states
const userModalIsOpen = ref(false)
const documentModalIsOpen = ref(false)
const tokenUsageModalIsOpen = ref(false)
const userLoading = ref(false)
const documentLoading = ref(false)

// Individual loading states
const loadingStates = ref({
  metrics: true,
  stackedBar: true,
  pieChart: true,
  areaChart: true,
  donutChart: true,
  topDocuments: true,
  frequentQuestions: true,
  departmentBarChart: true,
  departmentPieChart: true,
})

// Time range options
const timeRangeOptions = [
  { value: '7', rangeLabel: 'Last 7 Days' },
  { value: '30', rangeLabel: 'Last 1 Month' },
  { value: '90', rangeLabel: 'Last 3 Months' },
  { value: '180', rangeLabel: 'Last 6 Months' },
  { value: '365', rangeLabel: 'Last 12 Months' },
]

// Table columns
const userColumns = [
  { key: 'sl_no', label: 'Sl No.' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'contact_number', label: 'Mobile' },
  { key: 'source', label: 'Source' },
]

const docColumns = [
  { key: 'sl_no', label: 'Sl No.' },
  { key: 'name', label: 'File Name' },
  { key: 'formattedUpdatedAt', label: 'Last Updated' },
]

const tokenUsageColumns = [
  { key: 'sl_no', label: 'Sl No.' },
  { key: 'name', label: 'Name' },
  { key: 'total_tokens_sum', label: 'Tokens Consumed' },
]

// Helper functions
const getLocalDateString = (date: dayjs.Dayjs, timeZone: string) => {
  return date.tz(timeZone).startOf('day').format('YYYY-MM-DD')
}

const setAllLoadingStates = (value: boolean) => {
  Object.keys(loadingStates.value).forEach((key) => {
    // @ts-ignore
    loadingStates.value[key] = value
  })
  loading.value = value
}

// Date range computation
const dateRange = computed(() => {
  const userTimeZone = timeZone.value
  const endDate = getLocalDateString(dayjs(), userTimeZone)
  let startDate

  switch (selectedTimeRange.value) {
    case '7':
      startDate = getLocalDateString(dayjs().subtract(6, 'days'), userTimeZone)
      break
    case '30':
      startDate = getLocalDateString(dayjs().subtract(1, 'months'), userTimeZone)
      break
    case '90':
      startDate = getLocalDateString(dayjs().subtract(3, 'months'), userTimeZone)
      break
    case '180':
      startDate = getLocalDateString(dayjs().subtract(6, 'months'), userTimeZone)
      break
    case '365':
      startDate = getLocalDateString(dayjs().subtract(1, 'year'), userTimeZone)
      break
    default:
      startDate = getLocalDateString(dayjs().subtract(6, 'days'), userTimeZone)
  }

  return { startDate, endDate, timeZone: userTimeZone }
})

// Data transformation functions
function transformUserAppWiseData(result: any) {
  if (!result) return []

  const plainData = JSON.parse(JSON.stringify(result))
  if (!Array.isArray(plainData)) return []

  const allApps = new Set<string>()
  plainData.forEach((user: any) => {
    if (Array.isArray(user.app_wise_usage)) {
      user.app_wise_usage.forEach((app: any) => {
        allApps.add(app.request_type)
      })
    }
  })

  const allAppsOrdered = orderLabels(Array.from(allApps))

  return plainData.map((user: any) => {
    const usage: Record<string, number> = {}
    allAppsOrdered.forEach((app) => (usage[app] = 0))

    if (Array.isArray(user.app_wise_usage)) {
      user.app_wise_usage.forEach((app: any) => {
        usage[app.request_type] = parseInt(app.total_tokens) || 0
      })
    }

    return {
      name: user.name || 'Unknown User',
      ...usage,
    }
  })
}

// Computed data properties
const totalTokens = computed(() => {
  return analyticsStore.tokenDetails.reduce((acc, user) => {
    return acc + Number(user.total_tokens_sum || 0)
  }, 0)
})

const activeUsersCount = computed(() => analyticsStore.activeUsersCount)
const totalQueriesCount = computed(() => analyticsStore.totalQueriesCount)

const stackedChartData = computed(() => {
  return transformUserAppWiseData(analyticsStore.userAppWiseTokenDetail)
})

const pieChartData = computed(() => {
  if (!analyticsStore.appTokenDetails?.length) return []
  const map: Record<string, number> = {}
  analyticsStore.appTokenDetails.forEach((app: any) => {
    map[app.name || 'Unknown App'] = parseInt(app.total_tokens) || 0
  })
  return pieChartLabelsOrdered.value.map((label) => map[label] ?? 0)
})

const pieChartLabels = computed(() => {
  if (!analyticsStore.appTokenDetails?.length) return []
  return analyticsStore.appTokenDetails.map((app: any) => app.name || 'Unknown App')
})

const pieChartLabelsOrdered = computed(() => orderLabels(pieChartLabels.value))
const pieChartColors = computed(() => getColorsForLabels(pieChartLabelsOrdered.value))

const stackedAreaChartData = computed(() => {
  if (!analyticsStore.tokenDetails?.length) return []

  const topUsers = [...analyticsStore.tokenDetails]
    .sort((a: any, b: any) => {
      const aTotal = parseInt(a.total_tokens_sum) || 0
      const bTotal = parseInt(b.total_tokens_sum) || 0
      return bTotal - aTotal
    })
    .slice(0, 5)

  const allDates = new Set<string>()
  topUsers.forEach((user: any) => {
    user.token_usage_details?.forEach((detail: any) => {
      allDates.add(detail.date)
    })
  })

  const { startDate, endDate } = dateRange.value
  let currentDate = dayjs(startDate)
  const endDateObj = dayjs(endDate)

  while (currentDate.isBefore(endDateObj) || currentDate.isSame(endDateObj)) {
    allDates.add(currentDate.format('YYYY-MM-DD'))
    currentDate = currentDate.add(1, 'day')
  }

  const sortedDates = Array.from(allDates).sort()

  return topUsers.map((user: any) => {
    const dateMap = new Map<string, number>()
    user.token_usage_details?.forEach((detail: any) => {
      dateMap.set(detail.date, parseInt(detail.total_tokens) || 0)
    })

    const data = sortedDates.map((date) => ({
      x: date,
      y: dateMap.get(date) || 0,
    }))

    return {
      name: user.name || 'Unknown User',
      data,
    }
  })
})

const stackedAreaChartCategories = computed(() => {
  if (stackedAreaChartData.value.length === 0) return []

  const allDates = new Set<string>()
  stackedAreaChartData.value.forEach((userData: any) => {
    userData.data.forEach((point: any) => {
      allDates.add(point.x)
    })
  })

  const sortedDates = Array.from(allDates).sort()
  const range = parseInt(selectedTimeRange.value) || 7
  const density = range <= 7 ? 1 : range <= 30 ? 2 : range <= 90 ? 7 : 15

  return sortedDates.map((date, index) => {
    if (range <= 7 || index % density === 0 || index === sortedDates.length - 1) {
      return dayjs(date).format('MMM DD')
    }
    return ''
  })
})

const donutChartData = computed(() => {
  if (!analyticsStore.orgDocList?.length) return []

  const categoryCounts: Record<string, number> = {}
  analyticsStore.orgDocList.forEach((doc: any) => {
    const category = doc.fileCategory?.trim() || 'Uncategorized'
    categoryCounts[category] = (categoryCounts[category] || 0) + 1
  })

  return Object.values(categoryCounts)
})

const donutChartLabels = computed(() => {
  if (!analyticsStore.orgDocList?.length) return []

  const categoryCounts: Record<string, number> = {}
  analyticsStore.orgDocList.forEach((doc: any) => {
    const category = doc.fileCategory?.trim() || 'Uncategorized'
    categoryCounts[category] = (categoryCounts[category] || 0) + 1
  })

  return Object.keys(categoryCounts).map((category) => {
    return category
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  })
})

const topDocuments = computed(() => {
  const orgDetails = analyticsStore.organizationDetails as any
  const docs = orgDetails?.documents_analysis || []

  return docs
    .sort((a: any, b: any) => b.reference_count - a.reference_count)
    .slice(0, 5)
    .map((doc: any) => ({
      name: doc.document_source.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
      queries: doc.reference_count,
      usage:
        doc.reference_count >= 1000
          ? `${(doc.reference_count / 1000).toFixed(1)}k`
          : doc.reference_count.toString(),
    }))
})

const frequentQuestions = computed(() => {
  const orgDetails = analyticsStore.organizationDetails as any
  const questions = orgDetails?.questions || []

  return questions
    .map((q: any, index: number) => ({
      id: index + 1,
      question: q.representative,
      count: Number(q.total_count ?? q.similar_questions?.length ?? 1),
      category: 'General',
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
})

const splitFrequentQuestions = computed(() => {
  const items = frequentQuestions.value
  const firstColumn: any[] = []
  const secondColumn: any[] = []

  for (let i = 0; i < items.length; i++) {
    if (i % 2 === 0) firstColumn.push(items[i])
    else secondColumn.push(items[i])
  }

  return [firstColumn, secondColumn]
})

const forceFetchDepartmentData = async () => {
  if (organizationId.value) {
    const { startDate, endDate, timeZone: userTimeZone } = dateRange.value
    console.log('Force fetching department data with:', { startDate, endDate, userTimeZone })
    await analyticsStore.fetchDepartmentAnalytics(organizationId.value, userTimeZone)
  }
}

// Call this in onMounted after the main fetch
onMounted(async () => {
  isMounted.value = true
  await nextTick()

  await fetchUserProfile()
  await fetchData()

  // Double-check department data is loaded
  setTimeout(() => {
    if (analyticsStore.departmentBarChartData.length === 0) {
      console.log('Department data still empty, forcing refetch...')
      forceFetchDepartmentData()
    }
  }, 1000)
})

// Actions
const showOrganizationUsers = async () => {
  try {
    userLoading.value = true
    userModalIsOpen.value = true
    await analyticsStore.fetchOrganizationUsers(organizationId.value!)
  } catch (error) {
    console.error('Error fetching organization users:', error)
    showNotification('Failed to load users', 'error')
  } finally {
    userLoading.value = false
  }
}

const showOrganizationDocuments = async () => {
  try {
    documentLoading.value = true
    documentModalIsOpen.value = true
    await analyticsStore.fetchOrganizationDocuments(organizationId.value!)
  } catch (error) {
    console.error('Error fetching organization artifacts:', error)
    showNotification('Failed to load artifacts', 'error')
  } finally {
    documentLoading.value = false
  }
}

const showOrganizationTokenUsage = () => {
  tokenUsageModalIsOpen.value = true
}

const fetchData = async () => {
  if (!organizationId.value) {
    showNotification('Organization ID not found', 'error')
    setAllLoadingStates(false)
    return
  }

  setAllLoadingStates(true)

  try {
    const { startDate, endDate, timeZone: userTimeZone } = dateRange.value

    await Promise.allSettled([
      analyticsStore
        .fetchTokenWiseDetail(organizationId.value, startDate, endDate, userTimeZone)
        .finally(() => {
          loadingStates.value.metrics = false
          loadingStates.value.areaChart = false
        }),

      analyticsStore.fetchOrganizationDocuments(organizationId.value).finally(() => {
        loadingStates.value.donutChart = false
      }),

      analyticsStore
        .fetchUserAppWiseTokenDetail(organizationId.value, startDate, endDate, userTimeZone)
        .finally(() => {
          loadingStates.value.stackedBar = false
        }),

      analyticsStore
        .fetchAppWiseTokenDetail(organizationId.value, startDate, endDate, userTimeZone)
        .finally(() => {
          loadingStates.value.pieChart = false
        }),

      analyticsStore
        .fetchOrganizationDetail(organizationId.value, startDate, endDate, userTimeZone)
        .finally(() => {
          loadingStates.value.topDocuments = false
          loadingStates.value.frequentQuestions = false
        }),
      // Add department analytics fetch
      analyticsStore.fetchDepartmentAnalytics(organizationId.value, userTimeZone).finally(() => {
        loadingStates.value.departmentBarChart = false
        loadingStates.value.departmentPieChart = false
      }),
    ]).finally(() => {
      loading.value = false
    })
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    showNotification('Failed to load analytics data', 'error')
    setAllLoadingStates(false)
    loading.value = false
  }
}

const exportReport = () => {
  try {
    if (!analyticsStore.organizationDetails) {
      showNotification('No data available to export', 'error')
      return
    }

    const rows: string[][] = []
    const orgDetails = analyticsStore.organizationDetails as any

    // Organization Summary
    rows.push(['--- Organization Summary ---'])
    rows.push(['Active Users', String(orgDetails?.total_users || 0)])
    rows.push(['Artifacts Created', String(orgDetails?.docs_uploaded || 0)])
    rows.push(['Total Tokens', String(totalTokens.value || 0)])
    rows.push(['Total Queries', String(totalQueriesCount.value || 0)])

    // App-wise Token Usage
    rows.push([], ['--- App-wise Token Usage ---'], ['App', 'Tokens'])
    analyticsStore.appTokenDetails?.forEach((app: any) => {
      rows.push([app.name, String(app.total_tokens || 0)])
    })

    // User-wise Token Usage
    rows.push([], ['--- User-wise Token Usage ---'], ['User', 'Tokens'])
    analyticsStore.tokenDetails?.forEach((user: any) => {
      const total =
        user.token_usage_details?.reduce(
          (sum: number, detail: any) => sum + (parseInt(detail.total_tokens) || 0),
          0,
        ) || 0
      rows.push([user.name || 'Unknown', String(total)])
    })

    // Daily-wise User-wise Token Usage
    rows.push([], ['--- Daily-wise User-wise Token Usage ---'], ['Date', 'User', 'Tokens'])
    const aggregated: Record<string, number> = {}
    analyticsStore.tokenDetails?.forEach((user: any) => {
      user.token_usage_details?.forEach((detail: any) => {
        const key = `${detail.date}|${user.name || 'Unknown'}`
        aggregated[key] = (aggregated[key] || 0) + (parseInt(detail.total_tokens) || 0)
      })
    })
    Object.entries(aggregated).forEach(([key, tokens]) => {
      const [date, user] = key.split('|')
      rows.push([date, user, String(tokens)])
    })

    // Add Department Analytics section
    rows.push([], ['--- Department Analytics ---'])

    // Users & Artifacts by Department
    rows.push([], ['--- Users & Artifacts by Department ---'])
    rows.push(['Department', 'Users', 'Artifacts'])

    analyticsStore.departmentBarChartData.forEach((dept: any) => {
      rows.push([
        dept.department_name,
        String(dept.user_count || 0),
        String(dept.artifact_count || 0),
      ])
    })

    // Department Distribution (User Percentage)
    rows.push([], ['--- Department Distribution (User %) ---'])
    rows.push(['Department', 'Users', 'Percentage'])

    analyticsStore.departmentPieChartData.forEach((dept: any) => {
      rows.push([
        dept.name || dept.department_name || 'Unknown',
        String(dept.users || dept.value || 0),
        `${dept.percentage || 0}%`,
      ])
    })

    // Category-wise Artifacts Distribution
    rows.push([], ['--- Category-wise Artifacts Distribution ---'], ['Category', 'Count'])
    donutChartLabels.value.forEach((label, index) => {
      rows.push([label, String(donutChartData.value[index] || 0)])
    })

    // Top Artifacts by Queries
    rows.push([], ['--- Top Artifacts ---'], ['Name', 'Queries'])
    topDocuments.value.forEach((doc: any) => {
      rows.push([doc.name, String(doc.queries || 0)])
    })

    // Top 10 Frequently Asked Questions
    rows.push([], ['--- Top 10 Frequently Asked Questions ---'], ['Question', 'Count'])
    frequentQuestions.value.slice(0, 10).forEach((faq: any) => {
      rows.push([`"${faq.question.replace(/"/g, '""')}"`, String(faq.count || 0)])
    })

    const csvContent = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `analytics_report_${dayjs().format('YYYYMMDD')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    showNotification('Report exported successfully', 'success')
  } catch (error) {
    console.error('Error exporting report:', error)
    showNotification('Failed to export report', 'error')
  }
}

// Fetch user profile to get plan details
const fetchUserProfile = async () => {
  try {
    await profileStore.fetchUserProfile()
  } catch (error) {
    console.error('Error fetching user profile:', error)
  }
}

const navigateToPlans = () => {
  // Change this route if your plans page URL is different
  navigateTo('/admin/plans')
}

// Watch for time range changes
watch(selectedTimeRange, () => {
  if (!isMounted.value) return
  fetchData()
})

// Lifecycle
onMounted(async () => {
  isMounted.value = true
  await nextTick()

  await fetchUserProfile()

  await fetchData()
})

// AI Signals methods

const openAIInsights = async () => {
  if (!organizationId.value) {
    errorStore.showError('Organization ID not found')
    return
  }

  aiInsightsModalOpen.value = true
  aiInsightsLoading.value = true
  aiInsightsError.value = null
  aiInsightsData.value = null

  const { startDate, endDate } = dateRange.value

  try {
    const response = await analyticsStore.fetchActionableInsights(
      organizationId.value,
      startDate,
      endDate,
    )

    // Validate response structure
    if (!response?.data || !response?.success) {
      aiInsightsError.value = 'No insights data available for the selected period.'
      return
    }

    aiInsightsData.value = response

    // If API returns empty insights object
    if (!response.data?.insights || Object.keys(response.data.insights).length === 0) {
      aiInsightsError.value = 'No insights available for the selected period.'
    }
  } catch (error: any) {
    console.error('AI Signals API failed:', error)

    let message = 'Unable to connect to Insights service.'

    // CORS error detection
    if (error?.message?.includes('Failed to fetch') && error?.stack?.includes('TypeError')) {
      message = 'Request blocked by server security policy (CORS). Please contact administrator.'
    }

    // Network offline
    if (!navigator.onLine) {
      message = 'You are offline. Please check your internet connection.'
    }

    aiInsightsError.value = message
    errorStore.showError(message)
  } finally {
    aiInsightsLoading.value = false
  }
}

// Update the export function to handle the new data structure
const handleExportInsights = async () => {
  const XLSX = await import('xlsx')
  if (!aiInsightsData.value?.data) {
    errorStore.showError('No insights data available to export')
    return
  }

  try {
    const wb = XLSX.utils.book_new()
    const rows: any[] = []

    const insightsRoot = aiInsightsData.value.data || {}
    const summary = insightsRoot.analytics_summary || {}
    const insightsContent = insightsRoot.insights || {}
    const period = insightsRoot.period || {}

    const safeNumber = (val: any) => Number(val ?? 0)
    const safeString = (val: any) => val ?? 'N/A'

    // ----------------------------
    // Header Section
    // ----------------------------
    rows.push(['AI Signals & RECOMMENDATIONS'])
    rows.push([`Generated: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`])

    if (period.start_date && period.end_date) {
      rows.push([`Period: ${formatDateRange(period.start_date, period.end_date)}`])
    } else {
      rows.push(['Period: N/A'])
    }

    rows.push([])

    // ----------------------------
    // Analytics Summary
    // ----------------------------
    rows.push(['ANALYTICS SUMMARY'])
    rows.push(['Metric', 'Value'])

    rows.push(['Total Queries', safeNumber(summary.total_queries)])
    rows.push(['Active Users', safeNumber(summary.active_users)])
    rows.push(['Unique Artifacts', safeNumber(summary.unique_artifacts)])
    rows.push(['Total Tokens', safeNumber(summary.total_tokens)])

    const totalCost = safeNumber(summary.total_cost)
    // rows.push(['Total Cost ($)', totalCost.toFixed(6)])

    rows.push([])

    // ----------------------------
    // Critical Alerts
    // ----------------------------
    if (Array.isArray(insightsContent.critical_alerts) && insightsContent.critical_alerts.length) {
      rows.push(['CRITICAL ALERTS'])

      insightsContent.critical_alerts.forEach((alert: any) => {
        rows.push([`[${safeString(alert.severity).toUpperCase()}] ${safeString(alert.title)}`])
        rows.push([safeString(alert.description)])
        rows.push([`Action: ${safeString(alert.recommended_action)}`])
        rows.push([])
      })
    }

    // ----------------------------
    // Content Policy Gaps
    // ----------------------------
    if (
      Array.isArray(insightsContent.content_policy_gaps) &&
      insightsContent.content_policy_gaps.length
    ) {
      rows.push(['CONTENT POLICY GAPS'])

      insightsContent.content_policy_gaps.forEach((gap: any) => {
        rows.push([safeString(gap.gap_title)])
        rows.push([`Evidence: ${safeString(gap.evidence)}`])
        rows.push([`Recommendation: ${safeString(gap.recommendation)}`])
        rows.push([])
      })
    }

    // ----------------------------
    // Engagement Opportunities
    // ----------------------------
    if (
      Array.isArray(insightsContent.engagement_opportunities) &&
      insightsContent.engagement_opportunities.length
    ) {
      rows.push(['ENGAGEMENT OPPORTUNITIES'])

      insightsContent.engagement_opportunities.forEach((opp: any) => {
        rows.push([safeString(opp.opportunity)])
        rows.push([`Target: ${safeString(opp.target_audience)}`])
        rows.push([`Impact: ${safeString(opp.expected_impact)}`])
        rows.push([])
      })
    }

    // ----------------------------
    // Recommended Actions
    // ----------------------------
    if (
      Array.isArray(insightsContent.recommended_actions) &&
      insightsContent.recommended_actions.length
    ) {
      rows.push(['RECOMMENDED ACTIONS (By Priority)'])
      rows.push(['Priority', 'Area', 'Observation', 'Action', 'Owner'])

      insightsContent.recommended_actions.forEach((action: any) => {
        rows.push([
          `P${safeNumber(action.priority)}`,
          safeString(action.area),
          safeString(action.observation),
          safeString(action.recommended_action),
          safeString(action.owner),
        ])
      })

      rows.push([])
    }

    // ----------------------------
    // Executive Narrative
    // ----------------------------
    if (insightsContent.chro_executive_narrative) {
      rows.push(['SUMMARY'])
      rows.push([safeString(insightsContent.chro_executive_narrative)])
      rows.push([])
    }

    // If everything is empty
    if (rows.length <= 5) {
      rows.push(['No insights data available for this period.'])
    }

    // ----------------------------
    // Create Sheet
    // ----------------------------
    const ws = XLSX.utils.aoa_to_sheet(rows)

    ws['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 40 }, { wch: 40 }, { wch: 25 }]

    XLSX.utils.book_append_sheet(wb, ws, 'AI Signals')
    XLSX.writeFile(wb, `ai_signals_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`)

    showNotification('Insights exported successfully', 'success')
  } catch (error) {
    console.error('Error exporting insights:', error)
    errorStore.showError('Failed to export insights')
  }
}

// Helper function for date formatting
const formatDateRange = (startDate: string, endDate: string) => {
  return `${dayjs(startDate).format('MMM D, YYYY')} - ${dayjs(endDate).format('MMM D, YYYY')}`
}

const handleSendInsightsEmail = async () => {
  if (!organizationId.value || !aiInsightsData.value) {
    showNotification('Organization ID or insights data missing', 'error')
    return
  }

  try {
    aiEmailSending.value = true

    const payload = {
      orgId: organizationId.value,
      org_id: organizationId.value,
      insights: aiInsightsData.value,
      period: {
        start_date: dateRange.value.startDate,
        end_date: dateRange.value.endDate,
        timeZone: dateRange.value.timeZone,
        org_id: organizationId.value,
      },
    }

    await analyticsStore.sendInsightsEmail(organizationId.value, payload)

    showNotification('Insights email sent successfully', 'success')
  } catch (error) {
    console.error(error)
    showNotification('Failed to send insights email', 'error')
  } finally {
    aiEmailSending.value = false
  }
}

const handleSendKnowledgeGapEmail = async () => {
  if (!organizationId.value || !knowledgeGapData.value) {
    showNotification('Organization ID or knowledge gap data missing', 'error')
    return
  }

  try {
    knowledgeGapEmailSending.value = true

    const payload = {
      orgId: organizationId.value,
      org_id: organizationId.value,
      knowledgeGap: knowledgeGapData.value,
      period: {
        start_date: dateRange.value.startDate,
        end_date: dateRange.value.endDate,
        timeZone: dateRange.value.timeZone,
        org_id: organizationId.value,
      },
    }

    await analyticsStore.sendKnowledgeGapEmail(organizationId.value, payload)

    showNotification('Knowledge Gap email sent successfully', 'success')
  } catch (error) {
    console.error(error)
    showNotification('Failed to send knowledge gap email', 'error')
  } finally {
    knowledgeGapEmailSending.value = false
  }
}

// Knowledge Gap methods
const openKnowledgeGap = async () => {
  if (!organizationId.value) {
    errorStore.showError('Organization ID not found')
    return
  }

  knowledgeGapModalOpen.value = true
  knowledgeGapLoading.value = true
  knowledgeGapError.value = null
  knowledgeGapData.value = null

  const { startDate, endDate } = dateRange.value

  try {
    const response = await analyticsStore.fetchKnowledgeGap(
      organizationId.value,
      startDate,
      endDate,
    )

    // Validate response structure
    if (!response?.data || !response?.success) {
      knowledgeGapError.value = 'No knowledge gap data available for the selected period.'
      return
    }

    knowledgeGapData.value = response

    // If API returns empty data
    if (!response.data?.quality_summary) {
      knowledgeGapError.value = 'No knowledge gap data available for the selected period.'
    }
  } catch (error: any) {
    console.error('Knowledge Gap API failed:', error)

    let message = 'Unable to connect to Knowledge Gap service.'

    // CORS error detection
    if (error?.message?.includes('Failed to fetch') && error?.stack?.includes('TypeError')) {
      message = 'Request blocked by server security policy (CORS). Please contact administrator.'
    }

    // Network offline
    if (!navigator.onLine) {
      message = 'You are offline. Please check your internet connection.'
    }

    knowledgeGapError.value = message
    errorStore.showError(message)
  } finally {
    knowledgeGapLoading.value = false
  }
}

const handleExportKnowledgeGap = async () => {
  const XLSX = await import('xlsx')
  if (!knowledgeGapData.value?.data) {
    errorStore.showError('No knowledge gap data available to export')
    return
  }

  try {
    const wb = XLSX.utils.book_new()
    const rows: any[] = []

    const data = knowledgeGapData.value.data || {}
    const period = data.period || {}
    const qualitySummary = data.quality_summary || {}
    const topUnanswered = data.top_unanswered_questions || []
    const coverageTrend = data.coverage_trend || { bucket: '', data: [] }
    const byDepartment = data.by_department || []
    const gapAnalysis = data.gap_analysis || {}

    const safeNumber = (val: any) => Number(val ?? 0)
    const safeString = (val: any) => val ?? 'N/A'

    // Header
    rows.push(['Knowledge Enhancement Opportunities Report'])
    rows.push([`Generated: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`])
    if (period.start_date && period.end_date) {
      rows.push([`Period: ${formatDateRange(period.start_date, period.end_date)}`])
    }
    rows.push([])

    // Quality Summary
    rows.push(['COVERAGE SUMMARY'])
    rows.push(['Metric', 'Value'])
    rows.push(['Total Queries', safeNumber(qualitySummary.total_queries)])
    rows.push(['Answered', safeNumber(qualitySummary.answered)])
    rows.push(['Unanswered', safeNumber(qualitySummary.unanswered)])
    rows.push(['Coverage Rate (%)', safeNumber(qualitySummary.coverage_rate_pct)])
    rows.push(['Gap Rate (%)', safeNumber(qualitySummary.gap_rate_pct)])
    rows.push(['Trend', safeString(qualitySummary.trend_signal)])
    rows.push([])

    // Top Unanswered Questions
    if (topUnanswered.length) {
      rows.push(['TOP UNANSWERED QUESTIONS'])
      rows.push(['Intent', 'Frequency', 'Unique Users', 'Last Asked'])
      topUnanswered.forEach((q: any) => {
        rows.push([
          safeString(q.intent),
          safeNumber(q.combined_frequency),
          safeNumber(q.unique_askers),
          safeString(q.last_asked),
        ])
      })
      rows.push([])
    }

    // Coverage Trend
    if (coverageTrend.data?.length) {
      rows.push([`COVERAGE TREND (${coverageTrend.bucket})`])
      rows.push(['Period', 'Total Queries', 'Answered', 'Unanswered'])
      coverageTrend.data.forEach((trend: any) => {
        rows.push([
          safeString(trend.period),
          safeNumber(trend.total),
          safeNumber(trend.answered),
          safeNumber(trend.unanswered),
        ])
      })
      rows.push([])
    }

    // By Department
    if (byDepartment.length) {
      rows.push(['COVERAGE BY DEPARTMENT'])
      rows.push(['Department', 'Total Queries', 'Unanswered', 'Coverage Rate (%)'])
      byDepartment.forEach((d: any) => {
        rows.push([
          safeString(d.department),
          safeNumber(d.total_queries),
          safeNumber(d.unanswered),
          safeNumber(d.coverage_rate_pct),
        ])
      })
      rows.push([])
    }

    // Gap Analysis
    if (gapAnalysis.gap_clusters?.length) {
      rows.push(['GAP ANALYSIS & RECOMMENDATIONS'])
      gapAnalysis.gap_clusters.forEach((cluster: any) => {
        rows.push([cluster.cluster_title])
        rows.push([`Times Asked: ${safeNumber(cluster.total_times_asked)}`])
        rows.push([`Employees Affected: ${safeNumber(cluster.unique_employees_affected)}`])
        if (cluster.recommended_documents?.length) {
          rows.push(['Recommended Documents:'])
          cluster.recommended_documents.forEach((doc: any) => {
            rows.push([`- ${safeString(doc.document_title)}`])
            rows.push([`  ${safeString(doc.reason)}`])
          })
        }
        rows.push([])
      })
    }

    // Executive Summary
    if (gapAnalysis.executive_summary) {
      rows.push(['SUMMARY'])
      rows.push([safeString(gapAnalysis.executive_summary)])
      rows.push([])
    }

    const ws = XLSX.utils.aoa_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, 'Knowledge Gap')
    XLSX.writeFile(wb, `knowledge_gap_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`)

    showNotification('Knowledge gap report exported successfully', 'success')
  } catch (error) {
    console.error('Error exporting knowledge gap report:', error)
    errorStore.showError('Failed to export knowledge gap report')
  }
}
</script>

<style scoped>
.input-field {
  @apply bg-dark-700 border border-dark-600 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none;
}
</style>
