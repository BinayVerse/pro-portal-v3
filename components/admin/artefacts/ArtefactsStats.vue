<template>
  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 xl:gap-6">
    <!-- Total Documents -->
    <div class="bg-dark-800 rounded-lg p-3 sm:p-4 lg:p-6 border border-dark-700">
      <div v-if="props.loading" class="animate-pulse">
        <div class="flex items-center justify-between">
          <div>
            <div class="h-4 bg-gray-600 rounded w-24 mb-2"></div>
            <div class="h-8 bg-gray-600 rounded w-16"></div>
          </div>
          <div class="w-12 h-12 bg-gray-600 rounded-lg"></div>
        </div>
      </div>

      <div v-else class="flex items-center justify-between">
        <div>
          <p class="text-gray-400 text-sm font-medium">Total Artifacts</p>
          <p :class="`text-lg font-bold mt-2 ${artefactsTextColor}`">
            {{ props.totalArtefacts }} /
            {{ props.artefactsLimit === -1 ? 'Unlimited' : (props.artefactsLimit ?? 0) }}
          </p>
        </div>

        <div class="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
          <UIcon name="heroicons:document-text" class="w-6 h-6 text-blue-400" />
        </div>
      </div>
    </div>

    <!-- Processed -->
    <div class="bg-dark-800 rounded-lg p-6 border border-dark-700">
      <div v-if="props.loading" class="animate-pulse">
        <div class="flex items-center justify-between">
          <div>
            <div class="h-4 bg-gray-600 rounded w-20 mb-2"></div>
            <div class="h-8 bg-gray-600 rounded w-16"></div>
          </div>
          <div class="w-12 h-12 bg-gray-600 rounded-lg"></div>
        </div>
      </div>

      <div v-else class="flex items-center justify-between">
        <div>
          <p class="text-gray-400 text-sm font-medium">Processed</p>
          <p class="text-lg font-bold text-white mt-2">
            {{ props.processedArtefacts }}
          </p>
        </div>

        <div class="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
          <UIcon name="heroicons:check-circle" class="w-6 h-6 text-green-400" />
        </div>
      </div>
    </div>

    <!-- Categories -->
    <div class="bg-dark-800 rounded-lg p-6 border border-dark-700">
      <div v-if="props.loading" class="animate-pulse">
        <div class="flex items-center justify-between">
          <div>
            <div class="h-4 bg-gray-600 rounded w-20 mb-2"></div>
            <div class="h-8 bg-gray-600 rounded w-16"></div>
          </div>
          <div class="w-12 h-12 bg-gray-600 rounded-lg"></div>
        </div>
      </div>

      <div v-else class="flex items-center justify-between">
        <div>
          <p class="text-gray-400 text-sm font-medium">Categories</p>
          <p class="text-lg font-bold text-white mt-2">{{ props.totalCategories }}</p>
        </div>

        <div class="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
          <UIcon name="heroicons:funnel" class="w-6 h-6 text-purple-400" />
        </div>
      </div>
    </div>

    <!-- Total Size -->
    <div class="bg-dark-800 rounded-lg p-6 border border-dark-700">
      <div v-if="props.loading" class="animate-pulse">
        <div class="flex items-center justify-between">
          <div>
            <div class="h-4 bg-gray-600 rounded w-20 mb-2"></div>
            <div class="h-8 bg-gray-600 rounded w-16"></div>
          </div>
          <div class="w-12 h-12 bg-gray-600 rounded-lg"></div>
        </div>
      </div>

      <div v-else class="flex items-center justify-between">
        <div>
          <p class="text-gray-400 text-sm font-medium">Total Size</p>
          <p :class="`text-lg font-bold mt-2 ${storageTextColor}`">
            {{ props.totalSize }} /
            {{
              props.storageLimit === -1
                ? 'Unlimited'
                : props.storageLimit
                  ? props.storageLimit + ' GB'
                  : '0 GB'
            }}
          </p>
        </div>

        <div class="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
          <UIcon name="heroicons:circle-stack" class="w-6 h-6 text-orange-400" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  totalArtefacts: number
  processedArtefacts: number
  totalCategories: number
  totalSize: string // e.g., "1.25 GB"
  storageLimit?: number
  artefactsLimit?: number
  loading?: boolean
}>()

// Parse size "1.45 GB" or "512 MB"
const toGB = (value: string) => {
  if (value.toLowerCase().includes('gb')) return parseFloat(value)
  if (value.toLowerCase().includes('mb')) return parseFloat(value) / 1024
  if (value.toLowerCase().includes('kb')) return parseFloat(value) / (1024 * 1024)
  return parseFloat(value) // fallback
}

const getUsageColor = (current: number, limit?: number) => {
  // For unlimited or null limits (0, -1, undefined, null), show normal white text
  if (!limit || limit === 0 || limit === -1) return 'text-white'
  const percent = (current / limit) * 100
  if (percent >= 100) return 'text-red-400'
  if (percent >= 80) return 'text-orange-400'
  return 'text-white'
}

const artefactsTextColor = computed(() => getUsageColor(props.totalArtefacts, props.artefactsLimit))

const storageTextColor = computed(() => getUsageColor(toGB(props.totalSize), props.storageLimit))
</script>
