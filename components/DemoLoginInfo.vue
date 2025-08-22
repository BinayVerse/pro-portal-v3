<template>
  <div class="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 mb-6">
    <div class="flex items-start space-x-3">
      <div class="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center mt-0.5">
        <UIcon name="i-heroicons-information-circle" class="w-3 h-3 text-blue-400" />
      </div>
      <div class="flex-1">
        <h3 class="text-blue-100 font-semibold text-sm mb-2">Demo Login Credentials</h3>
        <div class="space-y-2 text-sm">
          <div class="flex items-center space-x-2">
            <span class="text-blue-200">Email:</span>
            <code class="bg-blue-800/30 px-2 py-1 rounded text-blue-100 font-mono text-xs"
              >demo@example.com</code
            >
            <button
              @click="copyToClipboard('demo@example.com')"
              class="text-blue-300 hover:text-blue-200 transition-colors"
              title="Copy email"
            >
              <UIcon name="i-heroicons-clipboard" class="w-4 h-4" />
            </button>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-blue-200">Password:</span>
            <code class="bg-blue-800/30 px-2 py-1 rounded text-blue-100 font-mono text-xs"
              >password</code
            >
            <button
              @click="copyToClipboard('password')"
              class="text-blue-300 hover:text-blue-200 transition-colors"
              title="Copy password"
            >
              <UIcon name="i-heroicons-clipboard" class="w-4 h-4" />
            </button>
          </div>
        </div>
        <p class="text-blue-200/80 text-xs mt-2">
          Use these credentials to access the demo admin dashboard with full features.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { showNotification } = useNotification()

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    showNotification(`Copied "${text}" to clipboard`, 'success', { duration: 2000 })
  } catch (err) {
    showNotification('Failed to copy to clipboard', 'error')
  }
}
</script>
