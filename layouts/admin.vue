<template>
  <div class="min-h-screen bg-black flex">
    <!-- Sidebar -->
    <aside class="w-64 bg-dark-900 border-r border-dark-700 flex flex-col">
      <!-- Logo -->
      <div class="px-6 py-4 border-b border-dark-700">
        <NuxtLink to="/" class="flex items-center space-x-3">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2Fb2a7382a9c9146babd538ccc60e9d0b5%2Fbddd43caf4614f99a3fbff498927abcc?format=webp&width=800"
            alt="Provento Logo"
            class="w-8 h-8"
          />
          <span class="text-white text-xl font-semibold">provento.ai</span>
        </NuxtLink>
      </div>

      <!-- Admin Navigation -->
      <nav class="flex-1 p-6">
        <div class="space-y-2">
          <NuxtLink
            to="/admin/dashboard"
            class="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-dark-800 transition-colors duration-200"
            :class="{ 'bg-primary-500/20 text-primary-400': $route.name === 'admin-dashboard' }"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
            </svg>
            <span>Dashboard</span>
          </NuxtLink>

          <NuxtLink
            to="/admin/users"
            class="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-dark-800 transition-colors duration-200"
            :class="{ 'bg-primary-500/20 text-primary-400': $route.name === 'admin-users' }"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
            </svg>
            <span>Users</span>
          </NuxtLink>

          <NuxtLink
            to="/admin/documents"
            class="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-dark-800 transition-colors duration-200"
            :class="{ 'bg-primary-500/20 text-primary-400': $route.name === 'admin-documents' }"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <span>Documents</span>
          </NuxtLink>

          <NuxtLink
            to="/admin/analytics"
            class="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-dark-800 transition-colors duration-200"
            :class="{ 'bg-primary-500/20 text-primary-400': $route.name === 'admin-analytics' }"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            <span>Analytics</span>
          </NuxtLink>

          <!-- Integrations with submenu -->
          <div>
            <button
              @click="integrationsOpen = !integrationsOpen"
              class="w-full flex items-center justify-between space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-dark-800 transition-colors duration-200"
              :class="{ 'bg-primary-500/20 text-primary-400': $route.path.includes('/admin/integrations') }"
            >
              <div class="flex items-center space-x-3">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                </svg>
                <span>Integrations</span>
              </div>
              <svg
                class="w-4 h-4 transition-transform duration-200"
                :class="{ 'rotate-180': integrationsOpen }"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            <div v-show="integrationsOpen" class="ml-8 mt-2 space-y-1">
              <NuxtLink
                to="/admin/integrations"
                class="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
                :class="{ 'bg-primary-500/20 text-primary-400': $route.name === 'admin-integrations' }"
              >
                Overview
              </NuxtLink>
              <NuxtLink
                to="/admin/integrations/slack"
                class="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
                :class="{ 'bg-primary-500/20 text-primary-400': $route.name === 'admin-integrations-slack' }"
              >
                Slack
              </NuxtLink>
              <NuxtLink
                to="/admin/integrations/teams"
                class="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
                :class="{ 'bg-primary-500/20 text-primary-400': $route.name === 'admin-integrations-teams' }"
              >
                Teams
              </NuxtLink>
              <NuxtLink
                to="/admin/integrations/whatsapp"
                class="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
                :class="{ 'bg-primary-500/20 text-primary-400': $route.name === 'admin-integrations-whatsapp' }"
              >
                WhatsApp
              </NuxtLink>
              <NuxtLink
                to="/admin/integrations/imessage"
                class="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
                :class="{ 'bg-primary-500/20 text-primary-400': $route.name === 'admin-integrations-imessage' }"
              >
                iMessage
              </NuxtLink>
            </div>
          </div>
        </div>
      </nav>
    </aside>

    <!-- Main content area -->
    <div class="flex-1 flex flex-col">
      <!-- Top header -->
      <header class="bg-dark-900 border-b border-dark-700 px-6 py-4">
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-semibold text-white">{{ pageTitle }}</h1>

          <!-- Profile dropdown -->
          <div class="relative" @mouseenter="profileOpen = true" @mouseleave="profileOpen = false">
            <button class="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
              <div class="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                <span class="text-white text-sm font-medium">A</span>
              </div>
              <span class="hidden sm:block">Admin</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>

            <div v-show="profileOpen" class="absolute right-0 top-full mt-2 w-48 bg-dark-900 border border-dark-700 rounded-lg shadow-xl py-2 animate-fade-in">
              <a href="#" class="block px-4 py-2 text-gray-300 hover:text-white hover:bg-dark-800 transition-colors">My Account</a>
              <a href="#" class="block px-4 py-2 text-gray-300 hover:text-white hover:bg-dark-800 transition-colors">Change Password</a>
              <hr class="border-dark-700 my-2">
              <NuxtLink to="/login" class="block px-4 py-2 text-gray-300 hover:text-white hover:bg-dark-800 transition-colors">Logout</NuxtLink>
            </div>
          </div>
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 p-6 bg-black">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const integrationsOpen = ref(true)
const profileOpen = ref(false)

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    'admin-dashboard': 'Dashboard',
    'admin-users': 'Users',
    'admin-documents': 'Documents',
    'admin-analytics': 'Analytics',
    'admin-integrations': 'Integrations Overview',
    'admin-integrations-teams': 'Teams Integration',
    'admin-integrations-slack': 'Slack Integration',
    'admin-integrations-whatsapp': 'WhatsApp Integration',
    'admin-integrations-imessage': 'iMessage Integration'
  }
  return titles[route.name as string] || 'Admin'
})
</script>
