<!-- /layouts/default.vue -->

<template>
  <div class="min-h-screen bg-black h-screen flex flex-col">
    <!-- Header Navigation (fixed height) -->
    <header class="fixed top-0 left-0 right-0 bg-black border-b border-dark-700 h-16 z-50">
      <nav class="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 h-16">
        <div class="flex justify-between items-center h-16">
          <!-- Logo and brand -->
          <NuxtLink to="/" class="flex items-center space-x-2 lg:space-x-3 flex-shrink-0">
            <img src="~/assets/media/logo.svg" alt="Provento Logo" class="w-7 h-7 md:w-8 md:h-8" />
            <span class="text-white text-base sm:text-lg md:text-xl font-semibold"
              >provento.ai</span
            >
          </NuxtLink>

          <!-- Main Navigation -->
          <div
            class="hidden md:flex items-center space-x-3 lg:space-x-8 flex-1 justify-center px-4"
          >
            <NuxtLink
              to="/"
              class="text-gray-300 hover:text-white transition-colors duration-200 text-sm md:text-base whitespace-nowrap"
              :class="{ 'text-primary-400': $route?.name === 'index' }"
            >
              Home
            </NuxtLink>

            <!-- Features with dropdown (Updated to be clickable) -->
            <div
              class="relative"
              @mouseenter="handleFeaturesEnter"
              @mouseleave="handleFeaturesLeave"
            >
              <!-- Clickable button that navigates to default page -->
              <button
                @click="navigateTo('/features/use-cases')"
                class="text-gray-300 hover:text-white transition-colors duration-200 flex items-center text-sm md:text-base whitespace-nowrap"
                :class="{ 'text-primary-400': $route.path.includes('/features') }"
              >
                Features
                <UIcon
                  name="i-heroicons-chevron-down"
                  class="ml-0.5 md:ml-1 w-4 h-4 transition-transform duration-200"
                  :class="{ 'rotate-180': showFeatures }"
                />
              </button>

              <!-- Features dropdown -->
              <div
                v-if="showFeatures"
                class="absolute top-full left-0 mt-2 w-48 md:w-56 lg:w-64 bg-dark-900 border border-dark-700 rounded-lg shadow-xl py-2 animate-fade-in z-50 max-h-96 overflow-y-auto"
                @mouseenter="handleFeaturesEnter"
                @mouseleave="handleFeaturesLeave"
              >
                <div class="px-4 py-2 text-sm text-gray-400 font-medium border-b border-dark-700">
                  Features Overview
                </div>
                <NuxtLink
                  v-for="feature in features"
                  :key="feature.slug"
                  :to="!feature.disabled && `/features/${feature.slug}`"
                  @click="!feature.disabled && closeFeatures()"
                  :class="[
                    'block px-4 py-2 text-gray-300 hover:text-white hover:bg-dark-800 transition-colors duration-200',
                    feature.disabled ? 'text-gray-500 hover:text-gray-500 cursor-not-allowed' : '',
                    { 'text-primary-400': $route.path === `/features/${feature.slug}` },
                  ]"
                >
                  {{ feature.name }}
                </NuxtLink>
              </div>
            </div>

            <!-- Solutions with dropdown -->
            <div
              class="relative"
              @mouseenter="handleSolutionsEnter"
              @mouseleave="handleSolutionsLeave"
            >
              <button
                @click="navigateTo('/solutions/finance-banking')"
                class="text-gray-300 hover:text-white transition-colors duration-200 flex items-center text-sm md:text-base whitespace-nowrap"
                :class="{ 'text-primary-400': $route.path.includes('/solutions') }"
              >
                Solutions
                <UIcon
                  name="i-heroicons-chevron-down"
                  class="ml-0.5 md:ml-1 w-4 h-4 transition-transform duration-200"
                  :class="{ 'rotate-180': showSolutions }"
                />
              </button>

              <!-- Solutions dropdown -->
              <div
                v-show="showSolutions"
                class="absolute top-full left-0 mt-2 w-48 md:w-56 lg:w-64 bg-dark-900 border border-dark-700 rounded-lg shadow-xl py-2 animate-fade-in z-50 max-h-96 overflow-y-auto"
                @mouseenter="handleSolutionsEnter"
                @mouseleave="handleSolutionsLeave"
              >
                <div class="px-4 py-2 text-sm text-gray-400 font-medium border-b border-dark-700">
                  Industries
                </div>
                <NuxtLink
                  v-for="industry in industries"
                  :key="industry.slug"
                  :to="industry.slug ? `/solutions/${industry.slug}` : '/solutions'"
                  :class="[
                    'block px-4 py-2 text-gray-300 hover:text-white hover:bg-dark-800 transition-colors duration-200',
                    { 'text-primary-400': $route.path === `/solutions/${industry.slug}` },
                  ]"
                >
                  {{ industry.name }}
                </NuxtLink>
              </div>
            </div>

            <NuxtLink
              to="/pricing"
              class="text-gray-300 hover:text-white transition-colors duration-200 text-sm md:text-base whitespace-nowrap"
              :class="{ 'text-primary-400': $route?.name === 'pricing' }"
            >
              Pricing
            </NuxtLink>
            <NuxtLink
              to="/faq"
              class="text-gray-300 hover:text-white transition-colors duration-200 text-sm md:text-base whitespace-nowrap"
              :class="{ 'text-primary-400': $route?.name === 'faq' }"
            >
              FAQ
            </NuxtLink>
          </div>

          <!-- Right side buttons (lg screen and up) -->
          <div class="hidden lg:flex items-center space-x-2 lg:space-x-4 flex-shrink-0">
            <NuxtLink
              to="/book-meeting"
              class="btn-outline text-xs md:text-sm py-2 px-2 md:px-3 whitespace-nowrap"
            >
              Book a Demo
            </NuxtLink>

            <template v-if="auth.isAuthenticated">
              <UDropdown :items="profileItems" :popper="{ placement: 'bottom-end' }">
                <UButton
                  variant="ghost"
                  trailing-icon="heroicons:chevron-down"
                  size="sm"
                  class="text-xs md:text-sm"
                >
                  <UAvatar
                    src=""
                    :alt="profileStore.userProfile?.name?.toUpperCase()"
                    size="xs"
                    :ui="{ background: 'bg-primary-500' }"
                  />
                  <span class="hidden lg:block ml-2">
                    {{
                      profileStore.userProfile?.name || profileStore.userProfile?.email || 'User'
                    }}
                  </span>
                </UButton>
              </UDropdown>
            </template>
            <template v-else>
              <NuxtLink
                to="/login"
                class="text-gray-300 hover:text-white px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-colors whitespace-nowrap"
              >
                Login
              </NuxtLink>
              <NuxtLink
                to="/signup"
                class="btn-primary text-xs md:text-sm px-2 md:px-3 py-1.5 md:py-2"
              >
                Sign Up
              </NuxtLink>
            </template>
          </div>

          <!-- Mobile menu button (show on tablet and mobile) -->
          <button
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="lg:hidden text-gray-300 hover:text-white p-2 flex-shrink-0"
            aria-label="Toggle menu"
          >
            <UIcon
              :name="mobileMenuOpen ? 'i-heroicons-x-mark' : 'i-heroicons-bars-3'"
              class="w-6 h-6"
            />
          </button>
        </div>

        <!-- Mobile menu -->
        <div
          v-show="mobileMenuOpen"
          class="fixed lg:hidden left-0 right-0 top-16 bottom-0 bg-black border-t border-dark-700 animate-fade-in overflow-y-auto z-40 w-full"
        >
          <!-- Mobile menu items (visible only on small screens below md) -->
          <div class="md:hidden px-4 py-4 space-y-1">
            <NuxtLink
              to="/"
              @click="mobileMenuOpen = false"
              class="block text-gray-300 hover:text-white hover:bg-dark-800 px-4 py-3 rounded-md text-base font-medium transition-colors"
              >Home</NuxtLink
            >
            <NuxtLink
              to="/features/use-cases"
              @click="mobileMenuOpen = false"
              class="block text-gray-300 hover:text-white hover:bg-dark-800 px-4 py-3 rounded-md text-base font-medium transition-colors"
              >Features</NuxtLink
            >
            <NuxtLink
              to="/solutions/finance-banking"
              @click="mobileMenuOpen = false"
              class="block text-gray-300 hover:text-white hover:bg-dark-800 px-4 py-3 rounded-md text-base font-medium transition-colors"
              >Solutions</NuxtLink
            >
            <NuxtLink
              to="/pricing"
              @click="mobileMenuOpen = false"
              class="block text-gray-300 hover:text-white hover:bg-dark-800 px-4 py-3 rounded-md text-base font-medium transition-colors"
              >Pricing</NuxtLink
            >
            <NuxtLink
              to="/faq"
              @click="mobileMenuOpen = false"
              class="block text-gray-300 hover:text-white hover:bg-dark-800 px-4 py-3 rounded-md text-base font-medium transition-colors"
              >FAQ</NuxtLink
            >
            <div class="border-t border-dark-700 pt-4 mt-4">
              <NuxtLink
                to="/book-meeting"
                @click="mobileMenuOpen = false"
                class="block btn-outline text-center py-3 px-4 rounded-md font-medium transition-colors mb-3"
              >
                Book a Demo
              </NuxtLink>

              <template v-if="auth.isAuthenticated">
                <NuxtLink
                  v-if="isProfileComplete"
                  :to="auth.user?.role_id === 0 ? '/admin/superadmin' : '/admin/dashboard'"
                  @click="mobileMenuOpen = false"
                  class="block text-gray-300 hover:text-white hover:bg-dark-800 px-4 py-3 rounded-md text-base font-medium transition-colors"
                  >Dashboard</NuxtLink
                >
                <NuxtLink
                  to="/change-password"
                  @click="mobileMenuOpen = false"
                  class="block text-gray-300 hover:text-white hover:bg-dark-800 px-4 py-3 rounded-md text-base font-medium transition-colors"
                  >Change Password</NuxtLink
                >
                <button
                  @click="handleLogout"
                  class="block w-full text-left text-gray-300 hover:text-white hover:bg-dark-800 px-4 py-3 rounded-md text-base font-medium transition-colors"
                >
                  Logout
                </button>
              </template>
              <template v-else>
                <NuxtLink
                  to="/login"
                  @click="mobileMenuOpen = false"
                  class="block text-gray-300 hover:text-white hover:bg-dark-800 px-4 py-3 rounded-md text-base font-medium transition-colors"
                  >Login</NuxtLink
                >
                <NuxtLink
                  to="/signup"
                  @click="mobileMenuOpen = false"
                  class="btn-primary block text-center mt-3 w-full"
                  >Sign Up</NuxtLink
                >
              </template>
            </div>
          </div>

          <!-- Tablet menu (CTA buttons only on md and up) -->
          <div class="hidden md:block px-4 py-4">
            <div class="space-y-3">
              <NuxtLink
                to="/book-meeting"
                @click="mobileMenuOpen = false"
                class="block btn-outline text-center py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Book a Demo
              </NuxtLink>
              <template v-if="auth.isAuthenticated">
                <NuxtLink
                  v-if="isProfileComplete"
                  :to="auth.user?.role_id === 0 ? '/admin/superadmin' : '/admin/dashboard'"
                  @click="mobileMenuOpen = false"
                  class="block text-gray-300 hover:text-white hover:bg-dark-800 px-4 py-3 rounded-md text-base font-medium transition-colors"
                  >Dashboard</NuxtLink
                >
                <NuxtLink
                  to="/change-password"
                  @click="mobileMenuOpen = false"
                  class="block text-gray-300 hover:text-white hover:bg-dark-800 px-4 py-3 rounded-md text-base font-medium transition-colors"
                  >Change Password</NuxtLink
                >
                <button
                  @click="handleLogout"
                  class="block w-full text-left text-gray-300 hover:text-white hover:bg-dark-800 px-4 py-3 rounded-md text-base font-medium transition-colors"
                >
                  Logout
                </button>
              </template>
              <template v-else>
                <NuxtLink
                  to="/login"
                  @click="mobileMenuOpen = false"
                  class="block text-center text-gray-300 hover:text-white hover:bg-dark-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Login
                </NuxtLink>
                <NuxtLink
                  to="/signup"
                  @click="mobileMenuOpen = false"
                  class="block btn-primary text-center py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Sign Up
                </NuxtLink>
              </template>
            </div>
          </div>
        </div>
      </nav>
    </header>

    <!-- Profile completion banner for logged in users -->
    <div
      v-if="auth.isAuthenticated && !isProfileComplete && $route.path !== '/admin/profile'"
      class="px-4 sm:px-6 lg:px-8 relative z-30"
    >
      <UAlert
        icon="i-heroicons-exclamation-triangle"
        color="yellow"
        variant="subtle"
        title="Please complete your profile to access the application."
      >
        Please complete your profile to access the application.
      </UAlert>
    </div>

    <!-- Main content (scrollable area only) -->
    <main class="flex-1 overflow-auto flex flex-col mt-16">
      <div class="flex-1">
        <slot />
      </div>
      <FooterComponent />
    </main>

    <ChatWidget v-if="auth && auth.isAuthenticated" />
  </div>
</template>

<script setup lang="ts">
import { industries } from '~/utils/index'

const showFeatures = ref(false)
const showSolutions = ref(false)
const mobileMenuOpen = ref(false)

let featuresHoverTimeout: NodeJS.Timeout | null = null
let solutionsHoverTimeout: NodeJS.Timeout | null = null

const handleFeaturesLeave = () => {
  featuresHoverTimeout = setTimeout(() => {
    showFeatures.value = false
  }, 300)
}

const handleFeaturesEnter = () => {
  if (featuresHoverTimeout) {
    clearTimeout(featuresHoverTimeout)
  }
  showFeatures.value = true
}

const handleSolutionsLeave = () => {
  solutionsHoverTimeout = setTimeout(() => {
    showSolutions.value = false
  }, 300)
}

const handleSolutionsEnter = () => {
  if (solutionsHoverTimeout) {
    clearTimeout(solutionsHoverTimeout)
    solutionsHoverTimeout = null
  }
  showSolutions.value = true
}

const closeFeatures = () => {
  showFeatures.value = false
}

const handleLogout = async () => {
  mobileMenuOpen.value = false
  await auth.signOut()
}

// Auth and profile stores
import ChatWidget from '~/components/chat/ChatWidget.vue'
import { useAuthStore } from '~/stores/auth/index'
import { useProfileStore } from '~/stores/profile/index'
const auth = useAuthStore()
const profileStore = useProfileStore()

onMounted(() => {
  if (auth.isAuthenticated) {
    profileStore.fetchUserProfile().catch(() => {})
  }
})

const isProfileComplete = computed(() => {
  const up: any = profileStore.userProfile || {}
  return !!(up && up.name && up.contact_number && up.company)
})

const profileItems = computed(() => {
  const base: any[] = []
  // Hide 'My Account' for super-admin (role_id === 0)
  if (auth.user?.role_id !== 0) {
    base.push({
      label: 'My Account',
      icon: 'heroicons:user',
      click: () => navigateTo('/admin/profile'),
    })
  }
  base.push({
    label: 'Change Password',
    icon: 'heroicons:key',
    click: () => navigateTo('/change-password'),
  })

  const dashboard = {
    label: 'Dashboard',
    icon: 'heroicons:squares-2x2',
    click: () => navigateTo(auth.user?.role_id === 0 ? '/admin/superadmin' : '/admin/dashboard'),
  }
  const logout = {
    label: 'Logout',
    icon: 'heroicons:arrow-right-on-rectangle',
    click: async () => {
      await auth.signOut()
    },
  }
  const items: any[] = []
  items.push(isProfileComplete.value ? [dashboard, ...base] : base)
  items.push([logout])
  return items
})

// Reactive features array
const features = ref(
  [
    { name: 'Use Cases', slug: 'use-cases', disabled: false },
    { name: 'How It Works', slug: 'how-it-works', disabled: false },
    { name: 'Data Privacy', slug: 'data-privacy', disabled: false },
  ].filter((feature) => feature.slug && feature.name),
)
</script>
