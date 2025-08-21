<template>
  <AdminLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
            <div class="w-8 h-8 bg-blue-400 rounded"></div>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-white">iMessage Integration</h1>
            <p class="text-gray-400">Connect to iMessage services</p>
          </div>
        </div>
        <div class="flex items-center space-x-4">
          <span
            class="bg-green-500/20 text-green-400 px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
          >
            <div class="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Disconnect</span>
          </span>
          <button
            disabled
            class="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 disabled:cursor-not-allowed"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              ></path>
            </svg>
            <span>Disconnect</span>
          </button>
        </div>
      </div>

      <!-- Setup Required State -->
      <div class="bg-dark-800 rounded-lg p-8 border border-dark-700 text-center">
        <div
          class="w-16 h-16 bg-blue-400/20 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <div class="w-8 h-8 bg-blue-400 rounded"></div>
        </div>
        <h3 class="text-xl font-semibold text-white mb-2">iMessage Setup Required</h3>
        <p class="text-gray-400 mb-6">
          iMessage integration requires additional setup and configuration. This feature is
          currently in development.
        </p>

        <!-- Feature Status -->
        <div class="bg-dark-900 rounded-lg p-6 mb-6 text-left">
          <h4 class="text-lg font-medium text-white mb-4">Integration Status:</h4>
          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
              <span class="text-gray-300">Apple Business Chat API</span>
              <span class="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                In Development
              </span>
            </div>
            <div class="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
              <span class="text-gray-300">Message Routing</span>
              <span class="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                Planned
              </span>
            </div>
            <div class="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
              <span class="text-gray-300">Webhook Integration</span>
              <span class="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                Planned
              </span>
            </div>
          </div>
        </div>

        <!-- Coming Soon Notice -->
        <div class="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
          <div class="flex items-center justify-center mb-2">
            <svg
              class="w-5 h-5 text-amber-400 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L3.18 16.5c-.77.833.192 2.5 1.732 2.5z"
              ></path>
            </svg>
            <span class="text-amber-400 font-medium">Coming Soon</span>
          </div>
          <p class="text-amber-200 text-sm">
            iMessage integration is currently under development. We're working on Apple Business
            Chat API integration to enable seamless messaging through iMessage.
          </p>
        </div>

        <!-- Interest Form -->
        <div class="text-left">
          <h4 class="text-lg font-medium text-white mb-4">Get Notified When Available</h4>
          <div class="flex gap-3">
            <input
              v-model="notificationEmail"
              type="email"
              placeholder="Enter your email for updates..."
              class="input-field flex-1"
            />
            <button
              @click="subscribeToUpdates"
              :disabled="!notificationEmail"
              class="btn-primary whitespace-nowrap"
            >
              Notify Me
            </button>
          </div>
        </div>
      </div>

      <!-- Roadmap Information -->
      <div class="bg-dark-800 rounded-lg p-6 border border-dark-700">
        <h3 class="text-lg font-semibold text-white mb-4">Development Roadmap</h3>
        <div class="space-y-4">
          <div class="flex items-start space-x-3">
            <div class="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <h4 class="text-white font-medium">Phase 1: Apple Business Chat Registration</h4>
              <p class="text-gray-400 text-sm">
                Complete Apple Business Chat API registration and certification process
              </p>
            </div>
          </div>

          <div class="flex items-start space-x-3">
            <div class="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <h4 class="text-white font-medium">Phase 2: Message Handling</h4>
              <p class="text-gray-400 text-sm">
                Implement message routing and processing for iMessage conversations
              </p>
            </div>
          </div>

          <div class="flex items-start space-x-3">
            <div class="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <h4 class="text-white font-medium">Phase 3: Rich Messaging</h4>
              <p class="text-gray-400 text-sm">
                Support for interactive messages, quick replies, and rich media
              </p>
            </div>
          </div>

          <div class="flex items-start space-x-3">
            <div class="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <h4 class="text-white font-medium">Phase 4: Integration Dashboard</h4>
              <p class="text-gray-400 text-sm">
                Full configuration interface and analytics for iMessage integration
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
})
import { ref } from 'vue'
import { useNotification } from '@/composables/useNotification'

const { showNotification } = useNotification()

const notificationEmail = ref('')

const subscribeToUpdates = () => {
  if (!notificationEmail.value) return

  showNotification('Subscribing to iMessage integration updates...', 'info')

  // Simulate subscription
  setTimeout(() => {
    showNotification(
      `You'll be notified at ${notificationEmail.value} when iMessage integration is available!`,
      'success',
    )
    notificationEmail.value = ''
  }, 1500)
}
</script>
