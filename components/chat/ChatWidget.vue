<template>
  <teleport to="body">
    <div
      ref="container"
      class="fixed right-3 sm:right-6 bottom-20 sm:bottom-6 pointer-events-auto"
      style="z-index: 999999"
    >
      <div v-if="!open" class="flex flex-col items-end space-y-3 relative pointer-events-auto">
        <!-- bubble above the button, appears with animation -->
        <transition name="bubble" appear v-if="!hasArtefacts">
          <div
            v-if="showHint"
            class="hidden sm:block bg-dark-800 text-gray-100 px-3 sm:px-4 py-2 rounded-full border border-primary-600 shadow-lg max-w-xs sm:max-w-sm relative text-xs sm:text-sm"
            key="hint"
          >
            <button
              @click.stop="hideHint"
              aria-label="Dismiss hint"
              class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-dark-900 border border-dark-700 flex items-center justify-center text-gray-300 hover:bg-dark-800"
            >
              <UIcon name="heroicons:x-mark" class="w-3 h-3" />
            </button>
            <div class="flex items-center space-x-3">
              <div class="flex -space-x-2">
                <div class="w-7 h-7 rounded-full bg-primary-400 ring-2 ring-dark-900"></div>
              </div>
              <div class="text-sm">
                {{
                  hasArtefacts
                    ? 'Start chatting with your artifacts'
                    : 'Upload your artifacts to get started with smart conversations.'
                }}
              </div>
            </div>
          </div>
        </transition>

        <AppTooltip :text="!hasArtefacts ? 'Upload artifacts to enable chat' : 'Open chat'">
          <button
            @click.stop="open = true"
            aria-label="Open chat"
            :disabled="!hasArtefacts"
            :class="[
              'w-14 h-14 rounded-full shadow-lg flex items-center justify-center',
              !hasArtefacts
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-primary-600 text-white',
            ]"
          >
            <UIcon name="heroicons:chat-bubble-left-ellipsis" class="w-6 h-6" />
          </button>
        </AppTooltip>
      </div>
    </div>
    <div
      v-if="open"
      ref="chatWindowRef"
      class="absolute sm:fixed left-0 right-0 bottom-0 sm:left-auto sm:top-auto sm:bottom-auto sm:right-0 w-full sm:w-96 sm:h-[520px] bg-dark-900 border border-dark-700 rounded-none sm:rounded-xl shadow-xl flex flex-col"
      :style="chatWindowStyle"
      style="z-index: 1000000"
    >
      <div
        class="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-dark-700"
      >
        <div class="flex items-center space-x-2 sm:space-x-3">
          <UIcon
            name="heroicons:chat-bubble-left-ellipsis"
            class="w-4 sm:w-5 md:w-6 h-4 sm:h-5 md:h-6 text-white flex-shrink-0"
          />
          <div class="text-white font-medium text-base sm:text-lg truncate">provento.ai</div>
        </div>

        <div class="flex items-center space-x-1 sm:space-x-2">
          <AppTooltip :text="historyLabel">
            <button
              @click="onToggleHistory"
              :aria-pressed="showHistory"
              class="flex items-center gap-2 px-2 sm:px-3 md:px-4 py-1 md:py-2 rounded-md bg-dark-800 hover:bg-dark-700 text-xs sm:text-sm md:text-base text-gray-200 border border-transparent focus:outline-none"
            >
              <UIcon
                :name="historyIcon"
                class="w-3.5 sm:w-4 md:w-5 h-3.5 sm:h-4 md:h-5 text-primary-400 flex-shrink-0"
              />
              <span class="hidden sm:inline">{{ historyLabel }}</span>
            </button>
          </AppTooltip>

          <AppTooltip v-if="!showHistory" text="Clear conversation">
            <button
              @click="clearConversation"
              class="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-md text-gray-300 hover:bg-dark-800 border border-dark-700"
              aria-label="Clear conversation"
            >
              <UIcon name="heroicons:trash" class="w-3.5 sm:w-4 md:w-5 h-3.5 sm:h-4 md:h-5" />
            </button>
          </AppTooltip>

          <button
            @click="close"
            aria-label="Close chat"
            class="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-md text-gray-300 hover:text-white flex items-center justify-center"
          >
            <UIcon name="heroicons:x-mark" class="w-3.5 sm:w-4 md:w-5 h-3.5 sm:h-4 md:h-5" />
          </button>
        </div>
      </div>

      <div class="flex-1 bg-black flex flex-col min-h-0">
        <div v-if="showHistory" class="flex-1 p-2 sm:p-4 flex flex-col min-h-0">
          <div class="flex items-center justify-between mb-2 sm:mb-3">
            <div class="text-xs sm:text-sm md:text-base text-gray-300 font-semibold">Recent</div>
            <div class="text-sm sm:text-base text-gray-400">
              {{ (conversations || []).length }}
            </div>
          </div>

          <div v-if="historyLoading" class="text-sm sm:text-base text-gray-400">Loading...</div>

          <div v-else class="flex-1 overflow-auto min-h-0">
            <div
              v-if="conversations.length === 0"
              class="text-xs sm:text-sm md:text-base text-gray-500"
            >
              No conversations found
            </div>

            <div class="space-y-2 pr-1 sm:pr-2">
              <div
                v-for="(c, i) in conversations"
                :key="c.chat_id || i"
                @click="openConversation(c.chat_id)"
                role="button"
                tabindex="0"
                @keyup.enter="openConversation(c.chat_id)"
                class="relative bg-dark-800 rounded-md p-2 sm:p-3 md:p-4 hover:bg-dark-700 transition-colors cursor-pointer"
              >
                <div class="flex items-start space-x-2 sm:space-x-3">
                  <div
                    class="flex-shrink-0 w-6 sm:w-8 md:w-10 h-6 sm:h-8 md:h-10 rounded-full bg-primary-700 flex items-center justify-center text-white font-bold"
                  >
                    <UIcon
                      name="heroicons:document-text"
                      class="w-3 sm:w-4 md:w-5 h-3 sm:h-4 md:h-5"
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <AppTooltip :text="c.header">
                      <div
                        class="text-sm sm:text-base text-gray-200 font-medium truncate"
                      >
                        {{ c.header }}
                      </div>
                    </AppTooltip>
                    <AppTooltip :text="formatPreview(c.body, 200, true)">
                      <div
                        class="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base text-gray-400"
                        style="
                          display: -webkit-box;
                          -webkit-line-clamp: 2;
                          line-clamp: 2;
                          -webkit-box-orient: vertical;
                          overflow: hidden;
                          text-overflow: ellipsis;
                        "
                      >
                        {{ formatPreview(c.body) }}
                      </div>
                    </AppTooltip>
                    <div
                      class="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base text-gray-400 text-right"
                    >
                      {{ c.last_at_formatted || c.last_at }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-else
          ref="scrollArea"
          class="flex-1 overflow-auto p-2 sm:p-4 space-y-3 sm:space-y-4 bg-black min-h-0"
        >
          <div
            v-if="messages.length === 0 && !loading"
            class="w-full text-center text-xs sm:text-sm md:text-base text-gray-400"
          >
            Feel free to ask anything about the artifacts you’ve uploaded.
          </div>
          <div v-for="(m, idx) in messages" :key="idx" class="w-full">
            <div v-if="m.from === 'user'" class="text-right flex justify-end">
              <div
                class="bg-primary-600 text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3 rounded-lg text-xs sm:text-sm md:text-base max-w-[80%]"
              >
                {{ m.content }}
              </div>
            </div>

            <div
              v-else-if="isUsageLimitMessage(m.content)"
              class="bg-dark-800 border border-yellow-500 text-yellow-300 px-3 sm:px-4 md:px-5 py-2 sm:py-3 md:py-4 rounded-md text-xs sm:text-sm md:text-base"
            >
              {{ m.content }}
            </div>

            <div v-else class="text-left flex justify-start">
              <div
                class="bg-dark-800 text-gray-200 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3 rounded-lg text-sm sm:text-base max-w-[80%]"
              >
                <!-- Agent / Category List -->
                <div v-if="m.meta && m.meta.type === 'agent_list'">
                  <div class="font-medium mb-2 text-xs sm:text-sm md:text-base">
                    Which AI Agent would you like to start with?
                  </div>
                  <div class="flex flex-wrap gap-1.5 sm:gap-2">
                    <button
                      v-for="cat in m.meta.categories"
                      :key="cat.id"
                      @click="onSelectCategory(cat, m)"
                      :disabled="m.meta.disabled"
                      :class="[
                        'px-2 sm:px-3 md:px-4 py-1 md:py-2 text-xs sm:text-sm md:text-base rounded-md border flex items-center',
                        m.meta.disabled
                          ? 'bg-dark-900 text-gray-500 border-dark-700 cursor-not-allowed'
                          : 'bg-dark-700 hover:bg-dark-600 border-dark-600',
                        cat && (cat.selected === true || cat.selected === 'true')
                          ? 'ring-2 ring-primary-500 bg-primary-700 text-white'
                          : '',
                      ]"
                    >
                      <span class="block w-full truncate max-w-[140px] sm:max-w-[220px]">{{
                        decodeHtml(cat.name)
                      }}</span>
                    </button>
                    <button
                      v-if="m.meta.hasMore"
                      @click="onShowMoreAgents(m)"
                      :disabled="m.meta.moreDisabled"
                      :class="[
                        'px-2 sm:px-3 md:px-4 py-1 md:py-2 text-xs sm:text-sm md:text-base rounded-md border',
                        m.meta.moreDisabled
                          ? 'bg-dark-900 text-gray-500 cursor-not-allowed'
                          : 'bg-dark-700 hover:bg-dark-600 border-dark-600',
                      ]"
                    >
                      More
                    </button>
                  </div>
                </div>

                <!-- Document List -->
                <div v-else-if="m.meta && m.meta.type === 'document_list'">
                  <div class="font-medium mb-2">
                    {{ getDocumentListPrompt(m) }}
                  </div>
                  <!-- Commented document listing as per category -->
                  <!-- <div class="flex flex-col gap-2">
                    <div v-if="m.meta.noDocuments" class="text-sm text-gray-400">
                      No knowledge base found for this AI agent.
                    </div>

                    <button
                      v-for="doc in m.meta.documents"
                      :key="doc.id"
                      @click="onSelectDocument(doc)"
                      :disabled="m.meta.disabled"
                      :class="[
                        'text-left px-3 py-2 rounded-md border flex flex-col items-start',
                        m.meta.disabled
                          ? 'bg-dark-900 text-gray-500 border-dark-700 cursor-not-allowed'
                          : 'bg-dark-700 hover:bg-dark-600 border-dark-600',
                        doc && (doc.selected === true || doc.selected === 'true')
                          ? 'ring-2 ring-primary-500 bg-primary-700 text-white'
                          : '',
                      ]"
                    >
                      <div
                        class="font-medium text-sm w-full truncate max-w-[240px] sm:max-w-[360px]"
                      >
                        {{ decodeHtml(doc.name) }}
                      </div>
                    </button>

                    <button
                      v-if="m.meta.hasMore"
                      @click="onShowMoreDocuments(m)"
                      :disabled="m.meta.moreDisabled"
                      :class="[
                        'px-3 py-1 text-sm rounded-md border',
                        m.meta.moreDisabled
                          ? 'bg-dark-900 text-gray-500 cursor-not-allowed'
                          : 'bg-dark-700 hover:bg-dark-600 border-dark-600',
                      ]"
                    >
                      More
                    </button>

                    <div
                      v-if="
                        m.meta.actions && m.meta.actions.length && idx === messages.length - 1
                      "
                      class="flex flex-wrap gap-1.5 sm:gap-2 mt-2"
                    >
                      <button
                        v-for="a in m.meta.actions"
                        :key="a.id"
                        @click.prevent="onActionClick(a.id)"
                        class="px-2 sm:px-3 md:px-4 py-1 md:py-2 bg-dark-700 hover:bg-dark-600 text-xs sm:text-sm md:text-base rounded-md border border-dark-600"
                      >
                        {{ a.label }}
                      </button>
                    </div>
                  </div> -->
                </div>

                <!-- Document summary or default bot message -->
                <div v-else>
                  <div
                    v-html="
                      isUsageLimitMessage(m.content)
                        ? m.content
                        : m.contentHtml || formatResponseToHtml(m.content)
                    "
                  ></div>

                  <!-- Actions for summaries (only on last message) -->
                  <div
                    v-if="
                      m.meta &&
                      m.meta.type === 'document_summary' &&
                      m.meta.actions &&
                      m.meta.actions.length &&
                      idx === messages.length - 1
                    "
                    class="flex flex-wrap gap-1.5 sm:gap-2 mt-2"
                  >
                    <button
                      v-for="a in m.meta.actions"
                      :key="a.id"
                      @click.prevent="onActionClick(a.id)"
                      class="px-2 sm:px-3 md:px-4 py-1 md:py-2 bg-dark-700 hover:bg-dark-600 text-xs sm:text-sm md:text-base rounded-md border border-dark-600"
                    >
                      {{ a.label }}
                    </button>
                  </div>

                  <div
                    v-if="m.links && m.links.length"
                    class="mt-2 text-xs sm:text-sm md:text-base"
                  >
                    <div v-for="(l, i) in m.links" :key="i">
                      <a
                        :href="l.url"
                        target="_blank"
                        class="text-primary-400 underline break-words"
                        >{{ l.text || l.url }}</a
                      >
                    </div>
                  </div>
                  <div
                    v-if="m.citations && m.citations.length"
                    class="mt-2 text-xs sm:text-sm md:text-base text-gray-400"
                  >
                    <div class="font-semibold text-gray-300 text-xs sm:text-sm md:text-base">
                      Source:
                    </div>
                    <div
                      v-for="(c, i) in m.citations"
                      :key="i"
                      class="text-xs sm:text-sm md:text-base truncate"
                    >
                      {{ c }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="loading" class="text-left text-xs sm:text-sm md:text-base text-gray-400">
            thinking...
          </div>
        </div>
      </div>

      <form
        v-if="!showHistory"
        @submit.prevent="sendMessageLocal"
        class="px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 border-t border-dark-700 bg-dark-900"
      >
        <div class="flex items-center space-x-1.5 sm:space-x-2">
          <input
            v-model="input"
            @input="onUserTyping"
            placeholder="Ask me..."
            class="flex-1 bg-dark-800 text-gray-200 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3 rounded-md text-sm sm:text-base outline-none focus:ring-2 focus:ring-primary-500"
          />
          <AppTooltip v-if="usageLimitReached" text="Plan usage limit reached — upgrade required">
            <button
              :disabled="!canSend || loading || usageLimitReached"
              type="submit"
              :class="[
                'btn-primary px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3 text-xs sm:text-sm md:text-base flex-shrink-0 whitespace-nowrap',
                !canSend || loading ? 'opacity-50 cursor-not-allowed' : '',
              ]"
            >
              {{ loading ? '...' : 'Send' }}
            </button>
          </AppTooltip>
          <button v-else
            :disabled="!canSend || loading || usageLimitReached"
            type="submit"
            :class="[
              'btn-primary px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3 text-xs sm:text-sm md:text-base flex-shrink-0 whitespace-nowrap',
              !canSend || loading ? 'opacity-50 cursor-not-allowed' : '',
            ]"
          >
            {{ loading ? '...' : 'Send' }}
          </button>
        </div>
      </form>

      <!-- Resize handles (only visible on sm and above) - left, top, and top-left only -->
      <div v-if="isResizeEnabled" class="hidden sm:block">
        <!-- Top-left corner -->
        <div
          @mousedown="startResize($event, 'nw')"
          class="absolute top-0 left-0 w-3 h-3 cursor-nwse-resize hover:bg-primary-500 hover:opacity-75 z-10"
        />
        <!-- Top edge -->
        <div
          @mousedown="startResize($event, 'n')"
          class="absolute top-0 left-3 right-0 h-1 cursor-ns-resize hover:bg-primary-500 hover:opacity-75 z-10"
        />
        <!-- Left edge -->
        <div
          @mousedown="startResize($event, 'w')"
          class="absolute top-3 bottom-0 left-0 w-1 cursor-ew-resize hover:bg-primary-500 hover:opacity-75 z-10"
        />
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'
import dayjs from 'dayjs'
import { useAuthStore } from '~/stores/auth/index'
import { useNotification } from '~/composables/useNotification'
import { useChatStore } from '~/stores/chat/index'
import { useArtefactsStore } from '~/stores/artefacts'
import { useProfileStore } from '~/stores/profile/index'
import { formatResponseToHtml } from '~/utils/formatResponse'

const auth = useAuthStore()
const notify = useNotification()
const chat = useChatStore()
const artefactsStore = useArtefactsStore()
const hasArtefacts = computed(
  () => Array.isArray(artefactsStore.artefacts) && artefactsStore.artefacts.length > 0,
)
const usageLimitReached = ref(false)

const open = ref(false)
const input = ref('')
const scrollArea = ref<HTMLElement | null>(null)
const container = ref<HTMLElement | null>(null)
const chatWindowRef = ref<HTMLElement | null>(null)

// Resize state variables
const windowWidth = ref(384) // sm:w-96 = 24rem = 384px
const windowHeight = ref(520) // sm:h-[520px]
const windowTop = ref(0) // Track top position for top/corner resizing
const windowLeft = ref(0) // Track left position for left/corner resizing
const hasBeenResized = ref(false) // Track if user has resized the window
const isResizing = ref(false)
const resizeDirection = ref<'n' | 'w' | 'nw' | null>(null)
const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0, top: 0, left: 0 })
const viewportWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)
const NAVBAR_HEIGHT = 64

// Use CSS overscroll-behavior to contain scroll within chat/history areas and avoid page scroll
const showHint = ref(true)
onMounted(async () => {
  // nothing to attach; scrolling is handled natively and contained via CSS on elements
  nextTick(() => {})
  // Ensure profile and artifacts are loaded so hasArtefacts is accurate across pages
  try {
    const profileStore = useProfileStore()
    // If profile not loaded yet, fetch it
    if (!profileStore.userProfile || !profileStore.userProfile.user_id) {
      await profileStore.fetchUserProfile()
    }
  } catch (e) {
    // ignore profile fetch errors
  }

  try {
    // fetch artifacts to ensure artifactsStore is populated on non-artifacts pages
    await artefactsStore.fetchArtefacts()
  } catch (e) {
    // ignore artifacts fetch errors
  }

  const onResize = () => {
    viewportWidth.value = window.innerWidth

    if (!hasBeenResized.value) return

    const maxLeft = window.innerWidth - windowWidth.value - VIEWPORT_PADDING
    const maxTop = window.innerHeight - windowHeight.value - VIEWPORT_PADDING

    windowLeft.value = Math.max(VIEWPORT_PADDING, Math.min(windowLeft.value, maxLeft))
    // ensure header (close button) stays visible
    windowTop.value = Math.max(HEADER_HEIGHT, windowTop.value)

    windowTop.value = Math.max(HEADER_HEIGHT, Math.min(windowTop.value, maxTop))
  }

  window.addEventListener('resize', onResize)

  onBeforeUnmount(() => {
    window.removeEventListener('resize', onResize)
  })

  // hint state is managed in-memory only (resets on full page reload)
})

const showHistory = ref(false)
const conversations = computed(() => (chat.conversations as any) || [])
const historyLoading = computed(() => (chat.historyLoading as any) || false)

const historyLabel = computed(() => (showHistory.value ? 'Live chat' : 'History'))
const historyIcon = computed(() =>
  showHistory.value ? 'heroicons:chat-bubble-left-ellipsis' : 'heroicons:clock',
)

function hideHint() {
  showHint.value = false
}

function getDocumentListPrompt(message: any) {
  try {
    if (!message || !message.meta)
      return 'The provento assistant is now active. Please submit your inquiry.'
    const meta = message.meta
    // priority: explicit categoryName from meta
    if (meta.categoryName)
      return `The ${meta.categoryName} assistant is now active. Please submit your inquiry..`
    // next: selectedCategoryId on meta
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
    // next: look for a single selected category in categories
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

const messages = computed(() => (chat.messages as any) || [])
const loading = computed(() => (chat.loading as any) || false)
const canSend = computed(() => !!input.value.trim())

// Computed property to check if resizing is enabled (sm and above only)
const isResizeEnabled = computed(() => viewportWidth.value >= 640)

const chatWindowStyle = computed(() => {
  // 📱 Mobile → full screen, no resize
  if (!isResizeEnabled.value) {
    return {
      position: 'absolute',
      top: `${NAVBAR_HEIGHT}px`,
      left: '0',
      right: '0',
      bottom: '0',
      width: '100%',
      height: 'auto',
    }
  }

  // 🖥 Desktop → default open (bottom-right)
  if (!hasBeenResized.value) {
    return {
      width: '384px',
      height: '520px',
      right: '24px',
      bottom: '24px',
      cursor: isResizing.value ? 'grabbing' : 'default',
    }
  }

  // 🖥 Desktop → resized
  return {
    width: `${windowWidth.value}px`,
    height: `${windowHeight.value}px`,
    top: `${windowTop.value}px`,
    left: `${windowLeft.value}px`,
    right: 'auto',
    bottom: 'auto',
    cursor: isResizing.value ? 'grabbing' : 'default',
  }
})

// Computed property to get max height based on window position

const HEADER_HEIGHT = 64
const VIEWPORT_PADDING = 8
const getMaxHeight = () => {
  if (typeof window === 'undefined') return 800

  if (!hasBeenResized.value && isResizeEnabled.value) {
    // Before first resize, assume header height (64px)
    return window.innerHeight - 64 - 20
  }

  const topPosition = hasBeenResized.value ? windowTop.value : 64
  // Max height = viewport height - top position - small buffer for bottom margin
  return window.innerHeight - topPosition - 20
}

function onUserTyping() {
  try {
    const text = input.value?.trim() || ''
    // Find latest active (non-disabled) agent_list message; if none, pick the latest agent_list
    let lastAgentMsg = [...(messages.value || [])]
      .reverse()
      .find((m: any) => m && m.meta && m.meta.type === 'agent_list' && !m.meta.disabled)
    if (!lastAgentMsg)
      lastAgentMsg = [...(messages.value || [])]
        .reverse()
        .find((m: any) => m && m.meta && m.meta.type === 'agent_list')

    if (lastAgentMsg && Array.isArray(lastAgentMsg.meta.categories)) {
      // normalize comparator
      const normalize = (s: any) =>
        String(s || '')
          .toLowerCase()
          .replace(/&amp;|&/g, '&')
          .replace(/[^a-z0-9\s&]/gi, '')
          .replace(/\s+/g, ' ')
          .trim()
      const tnorm = normalize(text)
      let matchedId: string | null = null
      if (tnorm) {
        for (const c of lastAgentMsg.meta.categories) {
          if (!c) continue
          const nameNorm = normalize(c.name)
          const idNorm = normalize(c.id)
          if (
            nameNorm === tnorm ||
            idNorm === tnorm ||
            nameNorm.startsWith(tnorm) ||
            nameNorm.includes(tnorm)
          ) {
            matchedId = c.id
            break
          }
        }
      }

      // Update meta.selected flags and store selectedCategoryId accordingly
      lastAgentMsg.meta.categories = lastAgentMsg.meta.categories.map((c: any) => ({
        ...c,
        selected: matchedId ? String(c.id) === String(matchedId) : false,
      }))
      if (matchedId) chat.selectedCategoryId = String(matchedId)
      else chat.selectedCategoryId = null
    } else {
      // No agent list present - fall back to disabling interactive messages to prepare for free text
      try {
        chat.disableInteractiveMessages()
      } catch (e) {}
    }
  } catch (e) {
    // ignore
  }
}

onBeforeUnmount(() => {
  // no local timers
})

async function onToggleHistory() {
  showHistory.value = !showHistory.value
  if (showHistory.value) {
    try {
      await chat.fetchConversations()
    } catch (err: any) {
      notify.showError(err?.message || 'Failed to load conversations')
    }
  }
}

async function openConversation(chatId: string) {
  if (!chatId) return
  try {
    await chat.loadConversation(chatId)
    showHistory.value = false
    open.value = true
    scrollToBottom()
  } catch (err: any) {
    notify.showError(err?.message || 'Failed to load conversation')
  }
}

const USAGE_LIMIT_TEXT = 'usage limit for your plan has been reached'

function isUsageLimitMessage(text?: string) {
  return typeof text === 'string' && text.toLowerCase().includes(USAGE_LIMIT_TEXT)
}

async function sendMessageLocal() {
  const text = input.value.trim()
  if (!text) return

  input.value = ''
  scrollToBottom()

  const payload = {
    question: text,
    wa_id: auth.user?.user_id || undefined,
    org_id: auth.user?.org_id || undefined,
    request_source: 'admin',
    history: (chat.messages || []).map((m: any) => ({
      role: m.from === 'user' ? 'user' : 'assistant',
      content: m.content,
    })),
  }

  try {
    // ensure interactive messages are disabled when sending a new message
    try {
      chat.disableInteractiveMessages()
    } catch (e) {}
    // immediately mark loading to disable the send button while awaiting server response
    try {
      chat.setLoading(true)
    } catch (e) {}
    // Send message immediately so user sees their message without waiting for history persistence
    const sendPromise = chat.sendMessage(payload)
    // Wait for send to complete (server will persist interaction) and avoid duplicating persistence calls
    await sendPromise

    chat.setLoading(false)
    scrollToBottom()

    // Detect usage-limit response in last assistant message
    const lastMsg = chat.messages[chat.messages.length - 1]

    if (isUsageLimitMessage(lastMsg?.content)) {
      usageLimitReached.value = true

      chat.disableInteractiveMessages?.()
      notify.showError(lastMsg.content)

      scrollToBottom()
      return
    }
  } catch (err: any) {
    notify.showError(err?.message || 'Failed to send message')
    if (err?.status === 401 || /unauthoriz/i.test(err?.message || '')) {
      await auth.clearAuth()
      navigateTo('/login')
    }
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (scrollArea.value) {
      scrollArea.value.scrollTop = scrollArea.value.scrollHeight
    }
  })
}

function close() {
  open.value = false
  showHistory.value = false

  // 🔄 FULL reset (prevents down-right jump)
  hasBeenResized.value = false
  isResizing.value = false
  resizeDirection.value = null

  // reset geometry to defaults
  windowWidth.value = 384
  windowHeight.value = 520
  windowTop.value = 0
  windowLeft.value = 0
}

async function clearConversation() {
  try {
    // delegate to store to reset conversation state and create a new chat id
    if (chat && chat.startOver) {
      await chat.startOver(false)
    } else {
      if (chat && chat.messages) chat.messages.length = 0
      if (chat && chat.setLoading) chat.setLoading(false)
    }
    // clear input and ensure UI resets
    input.value = ''
    nextTick(() => scrollToBottom())
  } catch (e) {
    // fallback: clear client-side messages
    if (chat && chat.messages) chat.messages.length = 0
    input.value = ''
  }
}

function onOutsideClick(e: MouseEvent) {
  const target = e.target as Node

  const buttonEl = container.value
  const chatEl = chatWindowRef.value

  // If click is inside chat OR inside button → do nothing
  if ((chatEl && chatEl.contains(target)) || (buttonEl && buttonEl.contains(target))) {
    return
  }

  // Desktop only: outside click closes chat
  if (isResizeEnabled.value) {
    open.value = false
    showHistory.value = false
  }
}

// Handlers for interactive agent/document buttons
async function onSelectCategory(cat: any, originMsg: any) {
  try {
    // disable interactive UI immediately
    try {
      chat.disableInteractiveMessages()
    } catch (e) {}
    // reflect the user's choice in chat
    chat.messages.push({ from: 'user', content: cat.name })
    // call store to load documents for category (this will mark selection on the specific agent_list)
    await chat.selectCategory(cat.id, originMsg)
    // persist once after the selection (ensure history reflects user's action)
    try {
      await chat.persistInteraction()
    } catch (e) {}
    scrollToBottom()
  } catch (err: any) {
    notify.showError('Failed to load category documents')
  }
}

async function onShowMoreAgents(msg: any) {
  try {
    if (!msg || !msg.meta) return
    // prevent double clicks
    msg.meta.moreDisabled = true
    const orgId = auth.user?.org_id || undefined
    if (!orgId) return
    // ensure categories are loaded
    await artefactsStore.fetchCategories(orgId)
    const allCats = artefactsStore.categories || []
    const already = (msg.meta.categories || []).length || 0
    const next = (allCats || [])
      .slice(already, already + 5)
      .map((c: any) => ({ id: c.id, name: c.name }))
    msg.meta.categories = (msg.meta.categories || []).concat(next)
    msg.meta.hasMore = (allCats || []).length > (msg.meta.categories || []).length
    msg.meta.moreDisabled = false
    scrollToBottom()
  } catch (err: any) {
    notify.showError('Failed to load more agents')
  }
}

async function onSelectDocument(doc: any) {
  try {
    try {
      chat.disableInteractiveMessages()
    } catch (e) {}
    chat.messages.push({ from: 'user', content: doc.name })
    await chat.selectDocument(doc.id)
    try {
      await chat.persistInteraction()
    } catch (e) {}
    scrollToBottom()
  } catch (err: any) {
    notify.showError('Failed to load document summary')
  }
}

async function onShowMoreDocuments(msg: any) {
  try {
    if (!msg || !msg.meta) return
    msg.meta.moreDisabled = true
    await artefactsStore.fetchArtefacts()
    const categoryId = msg.meta.categoryId
    const categoryName = artefactsStore.categories.find((c: any) => c.id === categoryId)?.name
    const docs = (artefactsStore.artefacts || []).filter((d: any) => {
      const catVal = (
        d.category ||
        d.fileCategory ||
        d.file_category ||
        d.category_name ||
        ''
      ).toString()
      return catVal === categoryName?.toString()
    })
    const already = (msg.meta.documents || []).length || 0
    const next = (docs || [])
      .slice(already, already + 5)
      .map((d: any) => ({ id: d.id, name: d.name, summarized: d.summarized }))
    msg.meta.documents = (msg.meta.documents || []).concat(next)
    msg.meta.hasMore = (docs || []).length > (msg.meta.documents || []).length
    msg.meta.moreDisabled = false
    scrollToBottom()
  } catch (err: any) {
    notify.showError('Failed to load more documents')
  }
}

function onActionClick(actionId: string) {
  if (actionId === 'back') {
    void chat.goBack()
    scrollToBottom()
    return
  }

  if (actionId === 'start_over') {
    void chat.startOver()
    scrollToBottom()
    return
  }
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

// Resize handle methods
function startResize(event: MouseEvent, direction: 'n' | 'w' | 'nw') {
  if (!isResizeEnabled.value) return

  event.preventDefault()
  isResizing.value = true
  resizeDirection.value = direction

  // Initialize window position on first resize
  if (!hasBeenResized.value) {
    const chatWindow = chatWindowRef.value
    if (chatWindow) {
      const rect = chatWindow.getBoundingClientRect()

      windowTop.value = rect.top
      windowLeft.value = rect.left

      // 🔒 lock to left/top coordinate system forever
      hasBeenResized.value = true
    }
  }

  resizeStart.value = {
    x: event.clientX,
    y: event.clientY,
    width: windowWidth.value,
    height: windowHeight.value,
    top: windowTop.value,
    left: windowLeft.value,
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', stopResize)
}

function handleMouseMove(event: MouseEvent) {
  if (!isResizing.value || !isResizeEnabled.value || !resizeDirection.value) return

  const deltaX = event.clientX - resizeStart.value.x
  const deltaY = event.clientY - resizeStart.value.y

  const minWidth = 360
  const minHeight = 384

  const maxLeft = window.innerWidth - resizeStart.value.width - VIEWPORT_PADDING
  const maxTop = window.innerHeight - resizeStart.value.height - VIEWPORT_PADDING

  const direction = resizeDirection.value

  // LEFT resize (w / nw)
  if (direction.includes('w')) {
    let newWidth = resizeStart.value.width - deltaX

    // clamp width
    newWidth = Math.max(newWidth, minWidth)

    // 🔒 lock RIGHT edge, not left
    // 🔒 lock ORIGINAL right edge (stable, no drift)
    const rightEdge = resizeStart.value.left + resizeStart.value.width

    let newLeft = rightEdge - newWidth

    // clamp left inside viewport
    newLeft = Math.max(VIEWPORT_PADDING, newLeft)

    windowWidth.value = newWidth
    windowLeft.value = newLeft
  }

  // TOP resize (n / nw)
  if (direction.includes('n')) {
    const bottom = resizeStart.value.top + resizeStart.value.height

    let newTop = resizeStart.value.top + deltaY

    // clamp top
    newTop = Math.max(HEADER_HEIGHT, Math.min(newTop, bottom - minHeight))

    const newHeight = bottom - newTop

    windowTop.value = newTop
    windowHeight.value = newHeight
  }

  // 🔒 FINAL HARD CLAMP — keeps window fully visible
  windowLeft.value = Math.max(
    VIEWPORT_PADDING,
    Math.min(windowLeft.value, window.innerWidth - windowWidth.value - VIEWPORT_PADDING),
  )

  windowTop.value = Math.max(
    HEADER_HEIGHT,
    Math.min(windowTop.value, window.innerHeight - windowHeight.value - VIEWPORT_PADDING),
  )
}

function stopResize() {
  isResizing.value = false
  resizeDirection.value = null
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', stopResize)
}

watch(open, async (val) => {
  if (val) {
    window.addEventListener('mousedown', onOutsideClick)
  } else {
    window.removeEventListener('mousedown', onOutsideClick)
    return
  }

  if (!isResizeEnabled.value) return

  await nextTick()

  // 🔒 FORCE DEFAULT STATE ON EVERY OPEN
  hasBeenResized.value = false
  isResizing.value = false
  resizeDirection.value = null

  windowWidth.value = 384
  windowHeight.value = 520
  windowTop.value = 0
  windowLeft.value = 0
})

watch(isResizeEnabled, async (isDesktop) => {
  if (!open.value) return

  await nextTick()

  // Switching to mobile → reset resize state
  if (!isDesktop) {
    hasBeenResized.value = false
    isResizing.value = false
    resizeDirection.value = null
    return
  }

  // Switching to desktop → reinitialize position
  const el = chatWindowRef.value
  if (!el) return

  const rect = el.getBoundingClientRect()

  windowWidth.value = rect.width
  windowHeight.value = rect.height
  windowTop.value = rect.top
  windowLeft.value = rect.left
})

watch(open, (val) => {
  if (!isResizeEnabled.value) {
    document.body.style.overflow = val ? 'hidden' : ''
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('mousedown', onOutsideClick)
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.btn-primary {
  background-color: #2563eb;
  color: white;
  border-radius: 0.375rem;
}

/* bubble slide-up-fade transition */
.bubble-enter-from,
.bubble-appear-from {
  transform: translateY(8px);
  opacity: 0;
}
.bubble-enter-to,
.bubble-appear-to {
  transform: translateY(0);
  opacity: 1;
}
.bubble-enter-active,
.bubble-appear-active {
  transition: all 260ms cubic-bezier(0.2, 0.9, 0.2, 1);
}
.bubble-leave-from {
  transform: translateY(0);
  opacity: 1;
}
.bubble-leave-to {
  transform: translateY(8px);
  opacity: 0;
}
.bubble-leave-active {
  transition: all 200ms ease;
}
</style>
