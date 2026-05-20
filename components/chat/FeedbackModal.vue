<template>
  <UModal :model-value="isOpen" @update:model-value="(val) => !val && close()">
    <div class="bg-dark-800 rounded-lg border border-dark-700">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-dark-700 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-white">Help us improve</h3>
        <button @click="close" class="text-gray-400 hover:text-gray-200">
          <UIcon name="heroicons:x-mark" class="w-5 h-5" />
        </button>
      </div>

      <!-- Content -->
      <div class="px-6 py-5 space-y-4">
        <!-- Reason -->
        <div>
          <label class="block text-sm text-gray-300 mb-2">
            What was wrong with this response?
          </label>

          <select
            v-model="selectedReason"
            :disabled="isSubmitting"
            class="w-full bg-dark-700 border border-dark-600 text-gray-200 px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Select a reason...</option>
            <option value="incorrect_answer">Incorrect Answer</option>
            <option value="irrelevant_answer">Irrelevant Answer</option>
            <option value="incomplete">Incomplete</option>
          </select>
        </div>

        <!-- Comment -->
        <div>
          <label class="block text-sm text-gray-300 mb-2"> Additional comments (optional) </label>

          <textarea
            v-model="comment"
            :disabled="isSubmitting"
            rows="3"
            placeholder="Tell us more..."
            class="w-full bg-dark-700 border border-dark-600 text-gray-200 px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-dark-700 flex justify-end gap-3">
        <button @click="close" :disabled="isSubmitting" class="text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button>

        <button
          @click="submit"
          :disabled="isSubmitting || !selectedReason"
          class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isSubmitting ? 'Submitting...' : 'Submit' }}
        </button>
      </div>
    </div>
  </UModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useChatStore } from '~/stores/chat/index'

const { isOpen } = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  submit: [data: { reason: string; comment: string }]
}>()

const chatStore = useChatStore()
const selectedReason = ref('')
const comment = ref('')
const isSubmitting = computed(() => chatStore.feedbackLoading)

const close = () => {
  emit('close')
}

const submit = async () => {
  if (!selectedReason.value) return

  try {
    emit('submit', {
      reason: selectedReason.value,
      comment: comment.value,
    })
    // Only clear fields after successful submission
    selectedReason.value = ''
    comment.value = ''
  } catch (error) {
    // Don't clear fields on error, let parent handle it
  }
}
</script>
