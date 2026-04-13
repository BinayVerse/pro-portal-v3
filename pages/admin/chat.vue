<template>
  <div class="flex h-[calc(100%+2rem)] -m-4 -ml-2 bg-dark-900 text-gray-100 overflow-hidden">
    <!-- Left Sidebar -->
    <div class="w-64 bg-black border-r border-dark-700 flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="px-6 py-4 h-[72px] flex items-center border-b border-dark-700">
        <button
          @click="startNewConversation"
          class="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-white font-medium transition-colors"
        >
          <UIcon name="heroicons:plus" class="w-5 h-5" />
          <span>New Chat</span>
        </button>
      </div>

      <!-- Conversations List -->
      <div class="flex-1 overflow-y-auto p-3 space-y-2">
        <!-- Initial Page Loading State -->
        <div v-if="isInitializing" class="flex items-center justify-center h-full min-h-[300px]">
          <div class="text-center text-gray-400 space-y-4">
            <div class="">
              <UIcon name="heroicons:arrow-path" class="w-8 h-8 animate-spin text-primary-500" />
            </div>
            <p class="text-lg">Loading history...</p>
          </div>
        </div>

        <div v-else-if="conversations.length === 0" class="text-center text-gray-400 text-sm py-8">
          No conversations yet
        </div>

        <div
          v-for="conv in conversations"
          :key="conv.chat_id"
          @click="loadConversation(conv.chat_id)"
          :class="[
            'p-3 rounded-lg cursor-pointer transition-all group relative',
            currentChatId === conv.chat_id
              ? 'bg-dark-700 border-l-2 border-primary-500'
              : 'bg-dark-800 hover:bg-dark-700 border-l-2 border-transparent',
          ]"
        >
          <div class="flex items-center justify-between">
            <div class="min-w-0">
              <div class="text-sm font-medium text-gray-200 truncate">
                {{ conv.header }}
              </div>
              <div class="text-xs text-gray-400 mt-1">
                {{ conv.last_at_formatted }}
              </div>
            </div>

            <div class="opacity-0 group-hover:opacity-100 transition-opacity">
              <AppTooltip text="Delete conversation">
                <button
                  @click.stop="deleteConversation(conv.chat_id)"
                  class="p-2 hover:bg-red-900/30 rounded"
                >
                  <UIcon name="heroicons:trash" class="w-4 h-4 text-red-400" />
                </button>
              </AppTooltip>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-dark-700 text-xs text-gray-400 space-y-2">
        <p>{{ conversations.length }} conversation{{ conversations.length !== 1 ? 's' : '' }}</p>
      </div>
    </div>

    <!-- Main Chat Area -->
    <div class="flex-1 flex flex-col min-h-0 overflow-hidden">
      <!-- Header Bar -->
      <div
        class="h-[72px] border-b border-dark-700 px-6 flex items-center justify-between bg-dark-900 shadow-sm"
      >
        <div class="flex items-center gap-3 min-w-0">
          <h1 class="text-xl font-semibold text-white truncate">
            {{ currentConversationTitle || 'New Chat' }}
          </h1>

          <span
            v-if="currentChatId && messages.length > 0"
            class="text-sm text-gray-400 whitespace-nowrap"
          >
            • {{ messages.length }} message{{ messages.length !== 1 ? 's' : '' }}
          </span>
        </div>

        <div class="flex items-center space-x-2">
          <AppTooltip v-if="currentChatId && messages.length > 0" text="Close conversation">
            <button
              @click="startNewConversation"
              class="p-2 hover:bg-dark-800 rounded-lg text-gray-400 hover:text-gray-200 transition-colors"
            >
              <UIcon name="heroicons:x-mark" class="w-5 h-5" />
            </button>
          </AppTooltip>
        </div>
      </div>

      <!-- Messages Area -->
      <div ref="messagesContainer" class="flex-1 overflow-y-auto bg-dark-900 min-h-0">
        <div class="max-w-6xl mx-auto p-6 space-y-4">
          <!-- Initial Page Loading State -->
          <div v-if="isInitializing" class="flex items-center justify-center h-full min-h-[300px]">
            <div class="text-center text-gray-400 space-y-4">
              <div class="">
                <UIcon name="heroicons:arrow-path" class="w-8 h-8 animate-spin text-primary-500" />
              </div>
              <p class="text-lg">Loading chat...</p>
            </div>
          </div>

          <!-- Loading Conversation State -->
          <div
            v-else-if="isLoadingConversation"
            class="flex items-center justify-center h-full min-h-[300px]"
          >
            <div class="text-center text-gray-400 space-y-4">
              <div class="">
                <UIcon name="heroicons:arrow-path" class="w-8 h-8 animate-spin text-primary-500" />
              </div>
              <p class="text-lg">Loading conversation...</p>
            </div>
          </div>

          <!-- Empty State -->
          <div
            v-else-if="messages.length === 0"
            class="flex items-center justify-center h-full min-h-[300px]"
          >
            <div class="text-center text-gray-400 space-y-4">
              <div class="text-4xl">💬</div>
              <p class="text-lg">Start a conversation</p>
              <p class="text-sm">Ask anything about your artifacts</p>
            </div>
          </div>

          <div v-for="(message, idx) in messages" :key="idx" class="w-full">
            <!-- User Message -->
            <div v-if="message.from === 'user'" class="flex justify-end mb-4">
              <div class="max-w-2xl">
                <div class="bg-primary-600 text-white px-4 py-3 rounded-lg break-words">
                  {{ message.content }}
                </div>

                <!-- User Actions -->
                <div class="flex justify-end gap-3 mt-2 text-gray-400">
                  <!-- Copy (ALL user messages) -->
                  <button
                    @click="copyToClipboard(message.content, idx)"
                    class="flex items-center gap-1 text-xs hover:text-white transition-all duration-200"
                  >
                    <transition name="fade" mode="out-in">
                      <span :key="idx">
                        <UIcon
                          :name="
                            copiedIndex === idx ? 'heroicons:check' : 'heroicons:document-duplicate'
                          "
                          class="w-4 h-4"
                        />
                      </span>
                    </transition>

                    <transition name="fade" mode="out-in">
                      <span :key="'text-' + (copiedIndex === idx)">
                        {{ copiedIndex === idx ? 'Copied' : 'Copy' }}
                      </span>
                    </transition>
                  </button>

                  <!-- Retry (ONLY last user message) -->
                  <button
                    v-if="idx === lastUserMessageIndex"
                    @click="retryUserMessage(message.content)"
                    :disabled="loading"
                    class="flex items-center gap-1 text-xs hover:text-white transition-colors disabled:opacity-50"
                  >
                    <UIcon name="heroicons:arrow-path" class="w-4 h-4" />
                    <span>Retry</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Bot Message -->
            <div v-else class="flex justify-start mb-4">
              <div class="max-w-2xl">
                <!-- Usage Limit Message -->
                <div
                  v-if="isUsageLimitMessage(message.content)"
                  class="bg-yellow-900/30 border border-yellow-700 text-yellow-300 px-4 py-3 rounded-lg"
                >
                  {{ message.content }}
                </div>

                <!-- Agent List -->
                <div v-else-if="message.meta && message.meta.type === 'agent_list'">
                  <div class="bg-dark-800 text-gray-200 px-4 py-3 rounded-lg mb-3">
                    <div class="font-medium mb-3">Which AI Agent would you like to start with?</div>
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-for="cat in message.meta.categories"
                        :key="cat.id"
                        @click="onSelectCategory(cat, message)"
                        :disabled="message.meta.disabled"
                        :class="[
                          'px-3 py-2 rounded-lg text-sm border transition-all',
                          message.meta.disabled
                            ? 'bg-dark-700 text-gray-500 border-dark-600 cursor-not-allowed'
                            : 'bg-dark-700 hover:bg-dark-600 border-dark-600',
                          cat.selected === true || cat.selected === 'true'
                            ? 'ring-2 ring-primary-500 bg-primary-700 text-white'
                            : '',
                        ]"
                      >
                        {{ decodeHtml(cat.name) }}
                      </button>
                      <button
                        v-if="message.meta.hasMore"
                        @click="onShowMoreAgents(message)"
                        :disabled="message.meta.moreDisabled"
                        :class="[
                          'px-3 py-2 rounded-lg text-sm border transition-all',
                          message.meta.moreDisabled
                            ? 'bg-dark-700 text-gray-500 cursor-not-allowed'
                            : 'bg-dark-700 hover:bg-dark-600 border-dark-600',
                        ]"
                      >
                        More
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Document List -->
                <div v-else-if="message.meta && message.meta.type === 'document_list'">
                  <div class="bg-dark-800 text-gray-200 px-4 py-3 rounded-lg">
                    <div class="font-medium mb-3">
                      {{ getDocumentListPrompt(message) }}
                    </div>
                  </div>
                </div>

                <!-- Regular Bot Message -->
                <div v-else class="bg-dark-800 text-gray-200 px-4 py-3 rounded-lg">
                  <div class="break-words" v-html="formatResponseToHtml(message.content)"></div>

                  <!-- Citations -->
                  <div
                    v-if="message.citations && message.citations.length"
                    class="mt-3 pt-3 border-t border-dark-700 text-xs text-gray-400"
                  >
                    <div class="font-semibold text-gray-300 mb-1">Sources:</div>
                    <div v-for="(citation, i) in message.citations" :key="i" class="truncate">
                      {{ citation }}
                    </div>
                  </div>

                  <!-- Message Actions -->
                  <div
                    class="flex items-center gap-3 mt-3 pt-3 border-t border-dark-700 text-gray-400"
                  >
                    <!-- Copy (ALL bot messages) -->
                    <button
                      @click="copyToClipboard(message.content, idx)"
                      class="flex items-center gap-1 text-xs hover:text-white transition-all duration-200"
                    >
                      <transition name="fade" mode="out-in">
                        <span :key="'bot-icon-' + (copiedIndex === idx)">
                          <UIcon
                            :name="
                              copiedIndex === idx
                                ? 'heroicons:check'
                                : 'heroicons:document-duplicate'
                            "
                            class="w-4 h-4"
                          />
                        </span>
                      </transition>

                      <transition name="fade" mode="out-in">
                        <span :key="'bot-text-' + (copiedIndex === idx)">
                          {{ copiedIndex === idx ? 'Copied' : 'Copy' }}
                        </span>
                      </transition>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Loading Indicator (only show when actually waiting for bot response, not during conversation loading) -->
          <div
            v-if="loading && !isLoadingConversation && !isInitializing"
            class="flex justify-start"
          >
            <div class="bg-dark-800 text-gray-400 px-4 py-3 rounded-lg">
              <div class="flex items-center space-x-2">
                <!-- <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div> -->
                <span class="text-sm">thinking...</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="border-t border-dark-700 px-6 py-4 bg-dark-900 flex-shrink-0">
        <form @submit.prevent="sendMessage" class="max-w-4xl mx-auto">
          <div class="flex items-stretch gap-3">
            <div class="flex-1">
              <textarea
                v-model="inputMessage"
                @keydown.enter.prevent="handleEnter"
                placeholder="Ask me anything about your artifacts..."
                class="w-full bg-dark-800 text-gray-200 px-4 py-[10px] rounded-lg outline-none focus:ring-2 focus:ring-primary-500 resize-none max-h-32 leading-5"
                rows="1"
              />
            </div>
            <button
              type="submit"
              :disabled="!inputMessage.trim() || loading"
              class="h-[42px] px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 flex items-center justify-center"
            >
              <UIcon name="heroicons:paper-airplane" class="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { useAuthStore } from '~/stores/auth/index'
import { useChatStore } from '~/stores/chat/index'
import { useArtefactsStore } from '~/stores/artefacts'
import { useErrorStore } from '~/stores/error'
import { formatResponseToHtml } from '~/utils/formatResponse'

definePageMeta({
  layout: 'admin',
})

useHead({
  title: 'AI Chat - Admin Dashboard - provento.ai',
})

const lastUserMessageIndex = computed(() => {
  for (let i = messages.value.length - 1; i >= 0; i--) {
    if (messages.value[i].from === 'user') {
      return i
    }
  }
  return -1
})

const auth = useAuthStore()
const chatStore = useChatStore()
const artefactsStore = useArtefactsStore()
const errorStore = useErrorStore()
const route = useRoute()
const router = useRouter()

const inputMessage = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const currentChatId = ref<string | null>(null)
const isLoadingConversation = ref(false)
const isUpdatingUrl = ref(false)
const isInitializing = ref(true)

const messages = computed(() => chatStore.messages || [])
const loading = computed(() => chatStore.loading || false)
const conversations = computed(() => chatStore.conversations || [])
const historyLoading = computed(() => chatStore.historyLoading || false)
const copiedIndex = ref<number | null>(null)
const isLoading = computed(() => loading.value || isLoadingConversation.value)

async function copyToClipboard(text: string, index?: number) {
  try {
    await navigator.clipboard.writeText(text)

    if (typeof index === 'number') {
      copiedIndex.value = index

      setTimeout(() => {
        copiedIndex.value = null
      }, 1200)
    }
  } catch (err) {
    errorStore.showError('Failed to copy to clipboard')
  }
}

async function retryUserMessage(content: string) {
  if (loading.value) return

  // Remove last bot response
  const lastIndex = messages.value.length - 1
  if (messages.value[lastIndex]?.from === 'assistant') {
    chatStore.messages.pop()
  }

  inputMessage.value = content
  await sendMessage()
}

function handleEnter(e: KeyboardEvent) {
  if (e.shiftKey) return // allow Shift+Enter for new line
  e.preventDefault()
  sendMessage()
}

const currentConversationTitle = computed(() => {
  if (!currentChatId.value) return 'New Chat'
  const conv = conversations.value.find((c) => c.chat_id === currentChatId.value)
  return conv?.header || 'New Chat'
})

const USAGE_LIMIT_TEXT = 'usage limit for your plan has been reached'

function isUsageLimitMessage(text?: string) {
  return typeof text === 'string' && text.toLowerCase().includes(USAGE_LIMIT_TEXT)
}

function decodeHtml(str: string) {
  if (!str) return ''
  return String(str)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function getDocumentListPrompt(message: any) {
  try {
    if (!message || !message.meta)
      return 'The provento assistant is now active. Please submit your inquiry.'
    const meta = message.meta
    if (meta.categoryName)
      return `The ${meta.categoryName} assistant is now active. Please submit your inquiry.`
    if (meta.selectedCategoryId) {
      const matched = (meta.categories || []).find(
        (c: any) =>
          String(c.id) === String(meta.selectedCategoryId) ||
          c.selected === true ||
          c.selected === 'true',
      )
      if (matched && matched.name)
        return `The ${decodeHtml(matched.name)} assistant is now active. Please submit your inquiry.`
    }
    if (Array.isArray(meta.categories)) {
      const sel = meta.categories.find(
        (c: any) =>
          c &&
          (c.selected === true || c.selected === 'true' || String(c.selected) === String(c.id)),
      )
      if (sel && sel.name)
        return `The ${decodeHtml(sel.name)} assistant is now active. Please submit your inquiry.`
    }
    return 'The provento assistant is now active. Please submit your inquiry.'
  } catch (e) {
    return 'The provento assistant is now active. Please submit your inquiry.'
  }
}

async function scrollToBottom() {
  await nextTick()

  if (messagesContainer.value) {
    messagesContainer.value.scrollTo({
      top: messagesContainer.value.scrollHeight,
      behavior: 'smooth',
    })
  }
}

async function sendMessage() {
  const text = inputMessage.value.trim()
  if (!text || isLoading.value) return

  inputMessage.value = ''
  await scrollToBottom()

  const payload = {
    question: text,
    wa_id: auth.user?.user_id,
    org_id: auth.user?.org_id,
    request_source: 'admin',
    history: messages.value.map((m: any) => ({
      role: m.from === 'user' ? 'user' : 'assistant',
      content: m.content,
    })),
  }

  try {
    await chatStore.sendMessage(payload)

    // 🔥 Force sync
    currentChatId.value = chatStore.currentChatId

    // Update URL with the chat ID first
    if (chatStore.currentChatId) {
      updateUrlWithChatId(chatStore.currentChatId)
    }

    await chatStore.fetchConversations()

    await scrollToBottom()
  } catch (err: any) {
    errorStore.showError(err?.message || 'Failed to send message')
  }
}

async function onSelectCategory(cat: any, originMsg: any) {
  try {
    chatStore.disableInteractiveMessages()
    chatStore.messages.push({ from: 'user', content: cat.name })

    // Update URL first if we have a chat ID
    if (chatStore.currentChatId) {
      updateUrlWithChatId(chatStore.currentChatId)
    }

    isLoadingConversation.value = true
    await chatStore.selectCategory(cat.id, originMsg)
    await chatStore.persistInteraction()
    currentChatId.value = chatStore.currentChatId

    // Update URL with the chat ID
    if (chatStore.currentChatId) {
      updateUrlWithChatId(chatStore.currentChatId)
    }
    await scrollToBottom()
  } catch (err: any) {
    errorStore.showError('Failed to load category documents')
  } finally {
    isLoadingConversation.value = false
  }
}

async function onShowMoreAgents(msg: any) {
  try {
    if (!msg || !msg.meta) return
    msg.meta.moreDisabled = true
    const orgId = auth.user?.org_id || undefined
    if (!orgId) return
    await artefactsStore.fetchCategories(orgId)
    const allCats = artefactsStore.categories || []
    const already = (msg.meta.categories || []).length || 0
    const next = (allCats || [])
      .slice(already, already + 5)
      .map((c: any) => ({ id: c.id, name: c.name }))
    msg.meta.categories = (msg.meta.categories || []).concat(next)
    msg.meta.hasMore = (allCats || []).length > (msg.meta.categories || []).length
    msg.meta.moreDisabled = false
    await scrollToBottom()
  } catch (err: any) {
    errorStore.showError('Failed to load more agents')
  }
}

async function updateUrlWithChatId(chatId: string | null) {
  isUpdatingUrl.value = true
  try {
    if (chatId) {
      await router.push({ query: { id: chatId } })
    } else {
      await router.push({ query: {} })
    }
  } finally {
    // Give router time to update before allowing watchers to react
    await nextTick()
    isUpdatingUrl.value = false
  }
}

async function startNewConversation() {
  try {
    currentChatId.value = null
    await chatStore.startOver(false)
    inputMessage.value = ''
    updateUrlWithChatId(null)
    await scrollToBottom()
  } catch (err: any) {
    errorStore.showError('Failed to start new conversation')
  }
}

async function loadConversationInternal(chatId: string) {
  try {
    // Show loading indicator
    isLoadingConversation.value = true
    currentChatId.value = chatId

    // Load the conversation
    await chatStore.loadConversation(chatId)
    inputMessage.value = ''
    await scrollToBottom()
  } catch (err: any) {
    errorStore.showError('Failed to load conversation')
  } finally {
    isLoadingConversation.value = false
  }
}

async function loadConversation(chatId: string) {
  try {
    // Update URL first
    await updateUrlWithChatId(chatId)

    // Then load the conversation (this won't trigger watcher because we set isUpdatingUrl flag)
    await loadConversationInternal(chatId)
  } catch (err: any) {
    errorStore.showError('Failed to load conversation')
  }
}

async function clearConversation() {
  try {
    await chatStore.startOver(false)
    currentChatId.value = null
    inputMessage.value = ''
    await scrollToBottom()
  } catch (err: any) {
    errorStore.showError('Failed to clear conversation')
  }
}

async function deleteConversation(chatId: string) {
  try {
    // Call store method to delete conversation
    await chatStore.deleteConversation(chatId)

    // If we were viewing the deleted conversation, start a new one
    if (currentChatId.value === chatId) {
      currentChatId.value = null
      await chatStore.startOver(false)
      updateUrlWithChatId(null)
    }
  } catch (err: any) {
    errorStore.showError(err?.message || 'Failed to delete conversation')
  }
}

async function fetchConversations() {
  try {
    await chatStore.fetchConversations()
  } catch (err: any) {
    errorStore.showError(err?.message || 'Failed to load conversations')
  }
}

async function loadConversationFromUrl() {
  try {
    const chatIdFromUrl = route.query.id as string | undefined
    if (chatIdFromUrl) {
      // Check if this conversation exists in our list
      const conversationExists = conversations.value.some((c) => c.chat_id === chatIdFromUrl)
      if (conversationExists) {
        // Load the conversation directly (URL is already set in the query param)
        await loadConversationInternal(chatIdFromUrl)
        currentChatId.value = chatIdFromUrl
        return true
      }
    }
    return false
  } catch (err: any) {
    console.warn('Failed to load conversation from URL:', err)
    isLoadingConversation.value = false
    return false
  }
}

watch(
  () => chatStore.currentChatId,
  (newId) => {
    if (newId) {
      currentChatId.value = newId
    }
  },
  { immediate: true },
)

// Clear chat when user changes (logout/login)
watch(
  () => auth.user?.user_id,
  (newUserId, oldUserId) => {
    if (oldUserId && newUserId && oldUserId !== newUserId) {
      // User changed - clear chat and reload conversations
      chatStore.clearChat()
    } else if (!newUserId && oldUserId) {
      // User logged out - clear chat
      chatStore.clearChat()
    }
  },
)

// Watch for URL changes (browser back/forward or manual URL edits)
watch(
  () => route.query.id,
  async (newChatId) => {
    // Skip if we just updated the URL ourselves
    if (isUpdatingUrl.value) return

    if (newChatId && newChatId !== currentChatId.value) {
      // URL changed to a different chat ID - load it directly (URL already updated)
      await loadConversationInternal(newChatId as string)
    } else if (!newChatId && currentChatId.value) {
      // URL cleared - start new conversation
      currentChatId.value = null
      await chatStore.startOver(false)
    }
  },
)

watch(
  () => messages.value.length,
  async () => {
    await scrollToBottom()
  },
)

onMounted(async () => {
  try {
    isInitializing.value = true

    // Load artifacts to ensure hasArtefacts is accurate
    await artefactsStore.fetchArtefacts()
    // Load initial conversations
    await fetchConversations()

    // Try to load conversation from URL if present
    const loaded = await loadConversationFromUrl()

    // If no conversation was loaded from URL and conversations exist, start fresh
    if (!loaded) {
      currentChatId.value = null
    }
  } catch (err: any) {
    errorStore.showError(err?.message || 'Failed to load chat data')
  } finally {
    isInitializing.value = false
  }
})
</script>

<style scoped>
/* Custom scrollbar styles */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #374151;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #4b5563;
}
button {
  transition: all 200ms ease;
}
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(2px);
}
</style>
