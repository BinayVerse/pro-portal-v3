<script setup lang="ts">
import { ref, computed } from 'vue'

interface HelpSection {
  label: string
  steps: string[]
}

interface ProviderHelp {
  title: string
  sections: HelpSection[]
}

const props = defineProps<{
  provider?: string
}>()

const showHelp = ref(false)

/**
 * 🔥 Centralized provider credential documentation
 * Add new providers here only.
 */
const providerCredentialHelp: Record<string, ProviderHelp> = {
  Keka: {
    title: 'How to get your Keka API Credentials',
    sections: [
      {
        label: 'Client ID',
        steps: [
          'Log in to https://app.keka.com',
          'Go to Settings > Integrations > API Tokens',
          'Create a new integration',
          'Note the Client ID / Integration ID',
        ],
      },
      {
        label: 'Client Secret',
        steps: [
          'Go to Settings > Integrations > API Tokens',
          'Create a new token',
          'Copy the Secret Key immediately (shown only once)',
          'Store securely',
        ],
      },
      {
        label: 'API Key',
        steps: [
          'Go to Settings > Integrations > API',
          'Generate an API Key',
          "This key grants access to Keka's API endpoints",
        ],
      },
      {
        label: 'Access Token',
        steps: [
          'Some integrations use API Key directly',
          'For OAuth flows use Client ID + Secret',
          'Tokens do not expire unless revoked',
        ],
      },
      {
        label: 'Login URL',
        steps: ['Use: https://app.keka.com/'],
      },
    ],
  },

  ADP: {
    title: 'How to get your ADP API Credentials',
    sections: [
      {
        label: 'Client ID',
        steps: [
          'Log in to https://developer.adp.com',
          'Go to Applications > Your App',
          'Under Credentials find Client ID',
        ],
      },
      {
        label: 'Client Secret',
        steps: [
          'Go to Applications > Your App > Credentials',
          'Copy the Client Secret',
          'Rotate regularly for security',
        ],
      },
      {
        label: 'API Key',
        steps: [
          'Some ADP integrations use API Key',
          'Find under Credentials > API Keys',
          'Generate if required',
        ],
      },
      {
        label: 'Access Token',
        steps: [
          'Use Client ID + Secret for OAuth',
          'Exchange credentials via ADP OAuth endpoint',
          'Token is time limited',
        ],
      },
      {
        label: 'Login URL',
        steps: ['Use: https://api.adp.com/'],
      },
    ],
  },
}

const selectedHelp = computed(() => {
  if (!props.provider) return null
  console.log('Selected provider for help:', props.provider)
  return providerCredentialHelp[props.provider] || null
})

const formatStep = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g

  return text.replace(
    urlRegex,
    (url) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer"
        class="text-primary-400 hover:text-primary-300 underline underline-offset-4">
        ${url}
      </a>`,
  )
}
</script>

<template>
  <div v-if="provider && selectedHelp" class="w-full">
    <!-- Right aligned help text -->
    <div class="text-right">
      <button
        type="button"
        class="text-xs text-primary-400 hover:text-primary-300 transition-colors font-medium underline underline-offset-4 whitespace-nowrap"
        @click="showHelp = true"
        size="xs"
      >
        How to get API credentials?
      </button>
    </div>

    <!-- Help Modal -->
    <UModal v-model="showHelp" size="lg">
      <div class="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-white">
            {{ selectedHelp.title }}
          </h2>

          <UButton
            color="gray"
            variant="ghost"
            icon="heroicons:x-mark"
            size="sm"
            @click="showHelp = false"
          />
        </div>

        <div v-for="section in selectedHelp.sections" :key="section.label" class="space-y-2">
          <h4 class="text-sm font-semibold text-primary-400">
            {{ section.label }}
          </h4>

          <ul class="list-disc list-inside text-sm text-gray-300 space-y-1">
            <li v-for="(step, index) in section.steps" :key="index">
              <span v-html="formatStep(step)" class="text-sm" />
            </li>
          </ul>
        </div>
      </div>
    </UModal>
  </div>
</template>
