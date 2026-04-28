<!-- /layouts/admin.vue -->
<template>
  <div class="bg-black flex overflow-hidden h-screen max-md:min-h-[100dvh] max-md:h-auto">
    <!-- Mobile menu overlay -->
    <div
      v-if="sidebarOpen && (isMobile || isTablet)"
      class="fixed inset-0 bg-black/50 z-30 md:hidden pointer-events-auto"
      @click="sidebarOpen = false"
    />

    <!-- Sidebar (fixed on mobile, relative on desktop) -->
    <aside
      @click.stop
      class="fixed left-0 top-16 lg:top-0 lg:h-screen max-md:h-[calc(100dvh-4rem)] bg-dark-900 border-r border-dark-700 flex flex-col z-40 transition-all duration-300 overflow-hidden"
      :class="[
        'transition-all duration-300',
        isMobile || isTablet
          ? sidebarOpen
            ? 'translate-x-0'
            : '-translate-x-full'
          : 'translate-x-0',
        isMobile || isTablet ? 'w-64' : isCollapsed ? 'w-16 lg:w-16' : 'w-64 lg:w-64',
      ]"
    >
      <!-- Logo and Toggle (DESKTOP ONLY) -->
      <div
        v-if="!isMobile && !isTablet"
        class="flex h-16 items-center border-b border-dark-700 flex-none shrink-0 transition-all duration-300"
        :class="isCollapsed ? 'justify-center px-0' : 'justify-between px-4 sm:px-6'"
      >
        <NuxtLink to="/" class="flex items-center space-x-3 min-w-0">
          <img src="~/assets/media/logo.svg" alt="Provento Logo" class="w-8 h-8 flex-shrink-0" />

          <!-- Text ONLY when expanded (desktop) -->
          <span v-if="!isCollapsed" class="ml-3 text-white text-xl font-semibold truncate">
            provento.ai
          </span>
        </NuxtLink>
      </div>

      <!-- Admin Navigation -->
      <nav class="flex-1 p-4 overflow-y-auto overscroll-contain max-md:pb-24">
        <div class="space-y-1">
          <!-- Dashboard menu -->
          <!-- Show superadmin dashboard when user is superadmin AND no organization selected -->
          <template v-if="auth.user?.role_id === 0 && !showOrganizationMenusForSuperAdmin">
            <SidebarButton
              :to="makeOrgLink('/admin/superadmin')"
              :icon="'heroicons:shield-check'"
              :active="$route.name === 'admin-superadmin' || pendingRoute === 'admin-superadmin'"
              :collapsed="isMobile || isTablet ? false : isCollapsed"
              :label="'Dashboard'"
              tooltip="Dashboard"
            />

            <!-- Attendance Report (Superadmin only) -->
            <!-- <SidebarButton
              to="/admin/attendance-report"
              :icon="'heroicons:chart-bar'"
              :active="
                $route.name === 'admin-attendance-report' ||
                pendingRoute === 'admin-attendance-report'
              "
              :collapsed="isMobile || isTablet ? false : isCollapsed"
              :label="'Attendance Report'"
              tooltip="Attendance Report"
            /> -->
          </template>

          <!-- Organization Admin menu -->
          <template v-if="showOrganizationMenusForSuperAdmin">
            <SidebarButton
              :to="makeOrgLink('/admin/dashboard')"
              :icon="'heroicons:squares-2x2'"
              :active="$route.name === 'admin-dashboard' || pendingRoute === 'admin-dashboard'"
              :collapsed="isMobile || isTablet ? false : isCollapsed"
              :disabled="!isProfileComplete"
              :label="'Dashboard'"
              :tooltip="
                isProfileComplete ? 'Dashboard' : 'Complete your profile to access this section'
              "
            />

            <SidebarButton
              :to="makeOrgLink('/admin/departments')"
              :icon="'heroicons:building-office-2'"
              :active="
                ($route.name as string) === 'admin-departments' ||
                pendingRoute === 'admin-departments'
              "
              :collapsed="isMobile || isTablet ? false : isCollapsed"
              :disabled="isDepartmentAdmin || !isProfileComplete"
              :label="'Departments'"
              :tooltip="
                isDepartmentAdmin
                  ? 'Access restricted for Department Admin'
                  : isProfileComplete
                    ? 'Departments'
                    : 'Complete your profile to access this section'
              "
            />

            <SidebarButton
              :to="makeOrgLink('/admin/users')"
              :icon="'heroicons:users'"
              :active="$route.name === 'admin-users' || pendingRoute === 'admin-users'"
              :collapsed="isMobile || isTablet ? false : isCollapsed"
              :disabled="!isProfileComplete"
              :label="'Users'"
              :tooltip="
                isProfileComplete ? 'Users' : 'Complete your profile to access this section'
              "
            />

            <SidebarButton
              :to="makeOrgLink('/admin/artefacts')"
              :icon="'heroicons:document-text'"
              :active="$route.name === 'admin-artefacts' || pendingRoute === 'admin-artefacts'"
              :collapsed="isMobile || isTablet ? false : isCollapsed"
              :disabled="!isProfileComplete"
              :label="'Artifacts'"
              :tooltip="
                isProfileComplete ? 'Artifacts' : 'Complete your profile to access this section'
              "
            />

            <SidebarButton
              :to="makeOrgLink('/admin/analytics')"
              :icon="'heroicons:chart-bar'"
              :active="$route.name === 'admin-analytics' || pendingRoute === 'admin-analytics'"
              :collapsed="isMobile || isTablet ? false : isCollapsed"
              :disabled="!isProfileComplete"
              :label="'Analytics'"
              :tooltip="
                isProfileComplete ? 'Analytics' : 'Complete your profile to access this section'
              "
            />

            <SidebarButton
              :to="makeOrgLink('/admin/plans')"
              :icon="'i-heroicons-currency-dollar'"
              :active="isPlansActive"
              :collapsed="isMobile || isTablet ? false : isCollapsed"
              :disabled="!isProfileComplete"
              :label="'Plans & Billing History'"
              :tooltip="
                isProfileComplete
                  ? 'Plans & Billing History'
                  : 'Complete your profile to access this section'
              "
            />

            <!-- Keka Attendance (Superadmin only) -->
            <SidebarButton
              v-if="auth.user?.role_id === 0"
              :to="makeOrgLink('/admin/attendance-report')"
              :icon="'heroicons:chart-bar'"
              :active="
                $route.name === 'admin-attendance-report' ||
                pendingRoute === 'admin-attendance-report'
              "
              :collapsed="isMobile || isTablet ? false : isCollapsed"
              :label="'Keka Attendance'"
              tooltip="Keka Attendance"
            />

            <!-- Integrations with submenu -->
            <div
              class="relative"
              @mouseenter="handleIntegrationsMouseEnter"
              @mouseleave="handleIntegrationsMouseLeave"
            >
              <button
                ref="integrationsButtonRef"
                @click="
                  !isCollapsed || isMobile || isTablet
                    ? (integrationsOpen = !integrationsOpen)
                    : null
                "
                class="w-full flex items-center rounded-lg text-gray-300 hover:text-white hover:bg-dark-800 transition-colors duration-200 group"
                :class="{
                  'bg-primary-500/20 text-primary-400': $route.path.includes('/admin/integrations'),
                  'opacity-50 cursor-not-allowed pointer-events-none': !isProfileComplete,
                  'justify-center px-3 py-2': isCollapsed && !(isMobile || isTablet),
                  'justify-between px-3 py-2 space-x-3': !isCollapsed || isMobile || isTablet,
                }"
                :disabled="!isProfileComplete"
                @mouseenter="handleIntegrationsMouseEnter"
              >
                <div
                  class="flex items-center"
                  :class="{ 'space-x-3': !isCollapsed || isMobile || isTablet }"
                >
                  <UIcon name="heroicons:link" class="w-5 h-5 flex-shrink-0" />
                  <span
                    v-if="!isCollapsed || isMobile || isTablet"
                    class="transition-opacity duration-300 truncate"
                    :class="{ 'opacity-0': isCollapsed }"
                  >
                    Integrations
                  </span>
                </div>
                <UIcon
                  v-if="!isCollapsed || isMobile || isTablet"
                  name="heroicons:chevron-down"
                  class="w-4 h-4 transition-transform duration-200 flex-shrink-0"
                  :class="{ 'rotate-180': integrationsOpen }"
                />
              </button>

              <!-- Collapsed State: Hover Submenu -->
              <div
                v-if="isCollapsed && integrationsHover"
                class="fixed z-[9999]"
                :style="{
                  left: `${integrationsDropdownLeft}px`,
                  top: `${integrationsDropdownTop}px`,
                }"
                @mouseenter="integrationsHover = true"
                @mouseleave="integrationsHover = false"
              >
                <div
                  class="bg-dark-800 border border-dark-700 rounded-lg shadow-lg py-2 min-w-[200px]"
                >
                  <div class="px-3 py-2 border-b border-dark-700">
                    <span class="text-sm font-medium text-gray-300">Integrations</span>
                  </div>
                  <div class="flex flex-col gap-1 px-1">
                    <SidebarButton
                      :to="makeOrgLink('/admin/integrations')"
                      :icon="'heroicons:eye'"
                      :active="
                        $route.name === 'admin-integrations' ||
                        pendingRoute === 'admin-integrations'
                      "
                      :collapsed="false"
                      size="sm"
                      :label="'Overview'"
                      :tooltip="
                        isDepartmentAdmin
                          ? 'Access restricted for Department Admin'
                          : isProfileComplete
                            ? 'Overview'
                            : 'Complete your profile to access this section'
                      "
                      :disabled="isDepartmentAdmin || !isProfileComplete"
                      class="justify-start w-full"
                      @click="closeMobileSidebar"
                    />
                    <SidebarButton
                      :to="makeOrgLink('/admin/integrations/applications')"
                      :icon="'heroicons:squares-2x2'"
                      :active="
                        $route.name === 'admin-integrations-applications' ||
                        pendingRoute === 'admin-integrations-applications'
                      "
                      :collapsed="false"
                      size="sm"
                      :label="'Applications'"
                      :tooltip="
                        isDepartmentAdmin
                          ? 'Access restricted for Department Admin'
                          : isProfileComplete
                            ? 'Applications'
                            : 'Complete your profile to access this section'
                      "
                      :disabled="isDepartmentAdmin || !isProfileComplete"
                      class="justify-start w-full"
                      @click="closeMobileSidebar"
                    />
                    <SidebarButton
                      :to="makeOrgLink('/admin/integrations/slack')"
                      :icon="'i-mdi:slack'"
                      :active="
                        $route.name === 'admin-integrations-slack' ||
                        pendingRoute === 'admin-integrations-slack'
                      "
                      :collapsed="false"
                      size="sm"
                      :label="'Slack'"
                      :tooltip="
                        isDepartmentAdmin
                          ? 'Access restricted for Department Admin'
                          : isProfileComplete
                            ? 'Slack'
                            : 'Complete your profile to access this section'
                      "
                      :disabled="isDepartmentAdmin || !isProfileComplete"
                      class="justify-start w-full"
                      @click="closeMobileSidebar"
                    />
                    <SidebarButton
                      :to="makeOrgLink('/admin/integrations/teams')"
                      :icon="'i-mdi:microsoft-teams'"
                      :active="
                        $route.name === 'admin-integrations-teams' ||
                        pendingRoute === 'admin-integrations-teams'
                      "
                      :collapsed="false"
                      size="sm"
                      :label="'Teams'"
                      :tooltip="
                        isDepartmentAdmin
                          ? 'Access restricted for Department Admin'
                          : isProfileComplete
                            ? 'Teams'
                            : 'Complete your profile to access this section'
                      "
                      :disabled="isDepartmentAdmin || !isProfileComplete"
                      class="justify-start w-full"
                      @click="closeMobileSidebar"
                    />
                    <SidebarButton
                      :to="makeOrgLink('/admin/integrations/whatsapp')"
                      :icon="'i-mdi:whatsapp'"
                      :active="
                        $route.name === 'admin-integrations-whatsapp' ||
                        pendingRoute === 'admin-integrations-whatsapp'
                      "
                      :collapsed="false"
                      size="sm"
                      :label="'WhatsApp'"
                      :tooltip="
                        isDepartmentAdmin
                          ? 'Access restricted for Department Admin'
                          : isProfileComplete
                            ? 'WhatsApp'
                            : 'Complete your profile to access this section'
                      "
                      :disabled="isDepartmentAdmin || !isProfileComplete"
                      class="justify-start w-full"
                      @click="closeMobileSidebar"
                    />
                    <SidebarButton
                      :to="makeOrgLink('/admin/integrations/i-message')"
                      :icon="'i-heroicons:chat-bubble-left-ellipsis'"
                      :active="
                        $route.name === 'admin-integrations-i-message' ||
                        pendingRoute === 'admin-integrations-i-message'
                      "
                      :collapsed="false"
                      size="sm"
                      :label="'iMessage'"
                      :tooltip="
                        isDepartmentAdmin
                          ? 'Access restricted for Department Admin'
                          : isProfileComplete
                            ? 'iMessage'
                            : 'Complete your profile to access this section'
                      "
                      :disabled="isDepartmentAdmin || !isProfileComplete"
                      class="justify-start w-full"
                      @click="closeMobileSidebar"
                    />
                  </div>
                </div>
              </div>

              <!-- Expanded State: Normal Submenu -->
              <div
                v-show="integrationsOpen && (!isCollapsed || isMobile || isTablet)"
                class="ml-8 mt-2 flex flex-col gap-1"
              >
                <SidebarButton
                  :to="makeOrgLink('/admin/integrations')"
                  :icon="'heroicons:eye'"
                  :active="
                    $route.name === 'admin-integrations' || pendingRoute === 'admin-integrations'
                  "
                  :collapsed="false"
                  size="sm"
                  :label="'Overview'"
                  :tooltip="
                    isDepartmentAdmin
                      ? 'Access restricted for Department Admin'
                      : isProfileComplete
                        ? 'Overview'
                        : 'Complete your profile to access this section'
                  "
                  :disabled="isDepartmentAdmin || !isProfileComplete"
                  @click="closeMobileSidebar"
                />
                <SidebarButton
                  :to="makeOrgLink('/admin/integrations/applications')"
                  :icon="'i-heroicons:cube-transparent-20-solid'"
                  :active="
                    $route.name === 'admin-integrations-applications' ||
                    pendingRoute === 'admin-integrations-applications'
                  "
                  :collapsed="false"
                  size="sm"
                  :label="'Applications'"
                  :tooltip="
                    isDepartmentAdmin
                      ? 'Access restricted for Department Admin'
                      : isProfileComplete
                        ? 'Applications'
                        : 'Complete your profile to access this section'
                  "
                  :disabled="isDepartmentAdmin || !isProfileComplete"
                  @click="closeMobileSidebar"
                />
                <SidebarButton
                  :to="makeOrgLink('/admin/integrations/slack')"
                  :icon="'i-mdi:slack'"
                  :active="
                    $route.name === 'admin-integrations-slack' ||
                    pendingRoute === 'admin-integrations-slack'
                  "
                  :collapsed="false"
                  size="sm"
                  :label="'Slack'"
                  :tooltip="
                    isDepartmentAdmin
                      ? 'Access restricted for Department Admin'
                      : isProfileComplete
                        ? 'Slack'
                        : 'Complete your profile to access this section'
                  "
                  :disabled="isDepartmentAdmin || !isProfileComplete"
                  @click="closeMobileSidebar"
                />
                <SidebarButton
                  :to="makeOrgLink('/admin/integrations/teams')"
                  :icon="'i-mdi:microsoft-teams'"
                  :active="
                    $route.name === 'admin-integrations-teams' ||
                    pendingRoute === 'admin-integrations-teams'
                  "
                  :collapsed="false"
                  size="sm"
                  :label="'Teams'"
                  :tooltip="
                    isDepartmentAdmin
                      ? 'Access restricted for Department Admin'
                      : isProfileComplete
                        ? 'Teams'
                        : 'Complete your profile to access this section'
                  "
                  :disabled="isDepartmentAdmin || !isProfileComplete"
                  @click="closeMobileSidebar"
                />
                <SidebarButton
                  :to="makeOrgLink('/admin/integrations/whatsapp')"
                  :icon="'i-mdi:whatsapp'"
                  :active="
                    $route.name === 'admin-integrations-whatsapp' ||
                    pendingRoute === 'admin-integrations-whatsapp'
                  "
                  :collapsed="false"
                  size="sm"
                  :label="'WhatsApp'"
                  :tooltip="
                    isDepartmentAdmin
                      ? 'Access restricted for Department Admin'
                      : isProfileComplete
                        ? 'WhatsApp'
                        : 'Complete your profile to access this section'
                  "
                  :disabled="isDepartmentAdmin || !isProfileComplete"
                  @click="closeMobileSidebar"
                />
                <SidebarButton
                  :to="makeOrgLink('/admin/integrations/i-message')"
                  :icon="'i-heroicons:chat-bubble-left-ellipsis'"
                  :active="
                    $route.name === 'admin-integrations-i-message' ||
                    pendingRoute === 'admin-integrations-i-message'
                  "
                  :collapsed="false"
                  size="sm"
                  :label="'iMessage'"
                  :tooltip="
                    isDepartmentAdmin
                      ? 'Access restricted for Department Admin'
                      : isProfileComplete
                        ? 'iMessage'
                        : 'Complete your profile to access this section'
                  "
                  :disabled="isDepartmentAdmin || !isProfileComplete"
                  @click="closeMobileSidebar"
                />
              </div>
            </div>
          </template>

          <!-- AI Chat (Only for organization users, NOT for superadmin) -->
          <template v-if="auth.user?.role_id !== 0">
            <SidebarButton
              :to="makeOrgLink('/admin/chat')"
              :icon="'heroicons:chat-bubble-left-ellipsis'"
              :active="$route.name === 'admin-chat' || pendingRoute === 'admin-chat'"
              :collapsed="isMobile || isTablet ? false : isCollapsed"
              :disabled="!isProfileComplete"
              :label="'AI Chat'"
              :tooltip="
                isProfileComplete ? 'AI Chat' : 'Complete your profile to access this section'
              "
            />
          </template>
        </div>
      </nav>

      <!-- Admin Footer (Mobile Only) -->
      <div class="border-t border-dark-700 p-4 flex-none shrink-0 lg:hidden">
        <!-- Logo with text - Clickable -->
        <NuxtLink
          to="/"
          class="flex items-center space-x-2 mb-3 justify-center hover:opacity-80 transition-opacity"
          @click="sidebarOpen = false"
        >
          <img src="~/assets/media/logo.svg" alt="Provento Logo" class="w-5 h-5" />
          <span class="text-gray-300 text-sm font-semibold">provento.ai</span>
        </NuxtLink>
        <!-- Copyright Text -->
        <div class="text-gray-500 text-xs text-center leading-tight">
          © 2026 provento.ai. All rights reserved.
        </div>
      </div>

      <!-- Desktop Sidebar Floating Collapse Toggle -->
      <div
        v-if="!isMobile && !isTablet"
        class="sidebar-edge-toggle"
        :class="{ expanded: !isCollapsed, collapsed: isCollapsed }"
        style="top: 50%; transform: translateY(-50%); z-index: 999"
      >
        <UTooltip
          :text="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          :popper="{
            placement: 'right',
            strategy: 'fixed',
            modifiers: [
              { name: 'offset', options: { offset: [0, 14] } },
              { name: 'flip', options: { fallbackPlacements: [] } },
            ],
          }"
          :ui="{
            container: 'z-[9999]',
            content:
              'bg-dark-800 text-gray-100 text-base font-semibold px-10 py-7 rounded-lg border border-dark-700 shadow-2xl whitespace-nowrap',
          }"
        >
          <button @click="toggleSidebar" class="sidebar-edge-toggle-inner">
            <UIcon
              v-if="isCollapsed"
              name="i-material-symbols:arrow-forward-ios-rounded"
              class="w-4 h-4"
            />
            <UIcon v-else name="i-material-symbols:arrow-back-ios-new-rounded" class="w-4 h-4" />
          </button>
        </UTooltip>
      </div>
    </aside>

    <!-- Main content area (offset for fixed sidebar) -->
    <div
      class="flex-1 flex flex-col min-h-0 w-full relative overflow-hidden transition-all duration-300"
      :class="{
        'lg:ml-64': !isCollapsed && !isMobile && !isTablet,
        'lg:ml-16': isCollapsed && !isMobile && !isTablet,
      }"
    >
      <!-- Top header (fixed height) -->
      <header
        class="bg-dark-900 border-b border-dark-700 px-3 md:px-6 h-16 flex items-center"
        :class="{
          'fixed top-0 left-0 right-0 w-full': isMobile || isTablet,
          'sticky top-0': !isMobile && !isTablet,
        }"
      >
        <div class="items-center w-full flex-1">
          <div class="flex items-center justify-between gap-2 md:gap-4 w-full">
            <!-- Mobile / Tablet -->
            <template v-if="isMobile || isTablet">
              <!-- Hamburger -->
              <button
                @click="sidebarOpen = !sidebarOpen"
                class="text-gray-300 hover:text-white p-2 -ml-2"
                aria-label="Toggle sidebar"
              >
                <UIcon
                  :name="sidebarOpen ? 'i-heroicons-x-mark' : 'i-heroicons-bars-3'"
                  class="w-6 h-6"
                />
              </button>

              <!-- Org + Plan -->
              <NuxtLink to="/" class="flex items-center gap-2 ml-2 min-w-0">
                <div class="flex flex-col min-w-0">
                  <span class="text-sm font-semibold text-white truncate">
                    {{ selectedOrgDisplay }}
                  </span>

                  <UBadge
                    v-if="profileStore.userProfile?.plan_name"
                    :color="isPlanExpired ? 'red' : 'green'"
                    size="xs"
                    variant="subtle"
                    class="w-fit"
                  >
                    {{ profileStore.userProfile.plan_name }}
                  </UBadge>
                </div>
              </NuxtLink>

              <!-- Spacer -->
              <div class="flex-1"></div>

              <UDropdown :items="profileItems" :popper="{ placement: 'bottom-end' }">
                <UButton variant="ghost" trailing-icon="heroicons:chevron-down">
                  <UAvatar
                    src=""
                    :alt="profileStore.userProfile?.name?.toUpperCase()"
                    size="sm"
                    :ui="{ background: 'bg-primary-500' }"
                  />
                </UButton>
              </UDropdown>
            </template>

            <!-- Desktop -->
            <template v-else>
              <div class="flex items-center flex-1 min-w-0">
                <!-- Desktop Breadcrumb Layout (superadmin) -->
                <template v-if="auth.user?.role_id === 0 && selectedOrgName">
                  <nav aria-label="Breadcrumb" class="breadcrumb-container hidden md:block">
                    <ol class="flex items-center space-x-3 text-sm">
                      <li>
                        <button
                          @click="goBackToOrgs"
                          class="breadcrumb-back"
                          aria-label="Back to organizations"
                        >
                          <span class="inline-flex items-center gap-2">
                            <svg
                              class="w-4 h-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M15 18L9 12L15 6"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                            </svg>
                            <span>Back to Organizations</span>
                          </span>
                        </button>
                      </li>

                      <li class="flex items-center text-gray-500">
                        <svg
                          class="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M9 6L15 12L9 18"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </li>

                      <li>
                        <span class="engraved-org breadcrumb-title">{{ selectedOrgName }}</span>
                      </li>
                    </ol>
                  </nav>

                  <!-- Mobile Org Display (superadmin) -->
                  <div class="md:hidden">
                    <button
                      @click="goBackToOrgs"
                      class="text-gray-400 hover:text-gray-300 transition-colors"
                      aria-label="Back to organizations"
                    >
                      <svg
                        class="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M15 18L9 12L15 6"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </button>
                    <div class="mt-0.5">
                      <div class="text-xs text-gray-500">Organization</div>
                      <div class="text-sm font-semibold text-white truncate">
                        {{ selectedOrgName }}
                      </div>
                    </div>
                  </div>
                </template>

                <!-- If superadmin and no org selected, show only the green role tag -->
                <template v-else-if="auth.user?.role_id === 0 && !selectedOrgName">
                  <span class="org-role-tag inline-block">Super Admin</span>
                </template>

                <!-- For non-superadmin users show org/company name and plan (SaaS style) -->
                <template v-else>
                  <!-- Desktop Layout -->
                  <div class="hidden md:flex items-center space-x-3 flex-1">
                    <span class="engraved-org text-lg font-semibold truncate">{{
                      selectedOrgDisplay
                    }}</span>
                    <UBadge
                      v-if="profileStore.userProfile?.plan_name"
                      :color="isPlanExpired ? 'red' : 'green'"
                      :ui="{ rounded: 'rounded-full' }"
                      variant="subtle"
                      class="flex-shrink-0"
                      size="xs"
                      >{{ profileStore.userProfile?.plan_name }}</UBadge
                    >
                  </div>

                  <!-- Mobile Layout (SaaS style 2-line stack) -->
                  <div class="md:hidden flex-1 min-w-0">
                    <div class="text-sm font-semibold text-white truncate">
                      {{ selectedOrgDisplay }}
                    </div>
                    <div v-if="profileStore.userProfile?.plan_name" class="text-xs mt-0.5">
                      <UBadge
                        :color="isPlanExpired ? 'red' : 'green'"
                        :ui="{ rounded: 'rounded-full' }"
                        variant="subtle"
                        size="xs"
                        >{{ profileStore.userProfile?.plan_name }}</UBadge
                      >
                    </div>
                  </div>
                </template>
              </div>

              <UDropdown :items="profileItems" :popper="{ placement: 'bottom-end' }">
                <UButton variant="ghost" trailing-icon="heroicons:chevron-down">
                  <UAvatar
                    src=""
                    :alt="profileStore.userProfile?.name?.toUpperCase()"
                    size="sm"
                    :ui="{ background: 'bg-primary-500' }"
                  />
                  <span class="hidden sm:block ml-2">{{
                    profileStore.userProfile?.name || profileStore.userProfile?.email || 'User'
                  }}</span>
                </UButton>
              </UDropdown>
            </template>
          </div>
        </div>
      </header>

      <!-- Mandatory profile completion banner -->
      <div v-if="!isProfileComplete && $route.path !== '/admin/profile'" class="px-6 pt-4">
        <UAlert
          icon="i-heroicons-exclamation-triangle"
          color="yellow"
          variant="subtle"
          title="Please complete your profile to access the application."
        >
          Please complete your profile to access the application.
        </UAlert>
      </div>

      <!-- Page content (scrollable) -->
      <main
        class="flex-1 overflow-y-auto overflow-x-hidden p-4 bg-black"
        :class="{ 'pt-16': isMobile || isTablet }"
      >
        <slot />
      </main>
    </div>

    <!-- Subscription Required Modal -->
    <SubscriptionRequiredModal
      :open="subscriptionCheck.shouldShowModal.value"
      @upgrade="handleUpgradeClick"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import ChatWidget from '~/components/chat/ChatWidget.vue'
import SidebarButton from './SidebarButton.vue'
import { useAuthStore } from '~/stores/auth/index'
import { useProfileStore } from '~/stores/profile/index'
import { useSuperAdminStore } from '~/stores/superadmin/index'
import { useSubscriptionCheck } from '~/composables/useSubscriptionCheck'
import SubscriptionRequiredModal from '~/components/ui/SubscriptionRequiredModal.vue'

const route = useRoute()
const router = useRouter()
const integrationsOpen = ref(true)
const integrationsHover = ref(false)
const sidebarOpen = ref(false)
const isMobile = ref(false)
const isTablet = ref(false)
const isCollapsed = ref(false)
const auth = useAuthStore()
const profileStore = useProfileStore()
const superAdminStore = useSuperAdminStore()
const subscriptionCheck = useSubscriptionCheck()
const integrationsDropdownLeft = ref(0)
const integrationsDropdownTop = ref(0)
const integrationsButtonRef = ref<HTMLElement | null>(null)
const pendingRoute = ref<string | null>(null)

const isDepartmentAdmin = computed(() => auth.user?.role_id === 3)

const isPlanExpired = computed(() => {
  const expiry = profileStore.userProfile?.plan_expiry
  if (!expiry) return false

  const expiryDate = new Date(expiry)
  if (Number.isNaN(expiryDate.getTime())) return false

  return expiryDate.getTime() < Date.now()
})

const isPlansActive = computed(() => route.path.startsWith('/admin/plans'))

const updateIntegrationsDropdownPosition = () => {
  if (integrationsButtonRef.value && isCollapsed.value) {
    const rect = integrationsButtonRef.value.getBoundingClientRect()
    integrationsDropdownLeft.value = rect.right + 8 // 8px = 0.5rem
    integrationsDropdownTop.value = rect.top
  }
}

// Update the handleMouseEnter for integrations
const handleIntegrationsMouseEnter = () => {
  if (isCollapsed.value) {
    updateIntegrationsDropdownPosition()
    integrationsHover.value = true
  }
}

const handleIntegrationsMouseLeave = () => {
  // Add a small delay to prevent immediate hiding when moving to dropdown
  setTimeout(() => {
    if (!integrationsHover.value) {
      integrationsHover.value = false
    }
  }, 100)
}

const checkAndShowSubscriptionModal = async () => {
  // Skip subscription check while profile is incomplete (user is still setting up org_id)
  if (!isProfileComplete.value) {
    subscriptionCheck.closeModal()
    return
  }

  // Fetch org plan if user is authenticated
  if (auth.user) {
    try {
      // Get org ID from query params (for superadmin) or use default
      const orgId = (route.query?.org || route.query?.org_id) as string | undefined
      await subscriptionCheck.checkSubscription(orgId)

      // Check subscription status only for non-superadmin users on non-plans pages
      if (auth.user?.role_id !== 0 && route.name !== 'admin-plans') {
        if (!subscriptionCheck.hasPlan.value) {
          subscriptionCheck.showModal()
        } else {
          subscriptionCheck.closeModal()
        }
      } else {
        subscriptionCheck.closeModal()
      }
    } catch (error) {
      console.error('Error checking subscription:', error)
    }
  }
}

const checkScreen = () => {
  if (typeof window === 'undefined') return

  const width = window.innerWidth

  // Align with Tailwind breakpoints: lg breakpoint is at 1024px
  isMobile.value = width < 768
  isTablet.value = width >= 768 && width < 1024

  // Show sidebar from 1024px and above (matching Tailwind's lg: breakpoint)
  if (width >= 1024) {
    sidebarOpen.value = true
  } else {
    sidebarOpen.value = false
  }

  // CHANGED: Always expanded on mobile/tablet
  if (isMobile.value || isTablet.value) {
    isCollapsed.value = false
  } else {
    isCollapsed.value = false // Always expanded after login
  }
}

onMounted(async () => {
  checkScreen()

  // Add resize listener for mobile detection
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', checkScreen)
    // Also add resize listener for updating dropdown position
    window.addEventListener('resize', updateIntegrationsDropdownPosition)
  }

  await checkAndShowSubscriptionModal()
})

const setupRouterGuards = () => {
  router.beforeEach((to, from, next) => {
    pendingRoute.value = to.name as string
    next()
  })

  router.afterEach(() => {
    pendingRoute.value = null

    // ✅ CLOSE SIDEBAR ONLY AFTER NAVIGATION FINISHES
    if (isMobile.value || isTablet.value) {
      sidebarOpen.value = false
    }
  })
}

// Set up router guards
setupRouterGuards()

// Cleanup resize listener on unmount
onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', checkScreen)
    window.removeEventListener('resize', updateIntegrationsDropdownPosition)
  }
})

// Watch route changes to check subscription on every page navigation
watch(
  () => route.name,
  async () => {
    await checkAndShowSubscriptionModal()
  },
)

watch(sidebarOpen, (open) => {
  if (!process.client) return

  // Only prevent body scrolling on mobile/tablet when sidebar is open
  // But allow the page content to scroll
  if (isMobile.value || isTablet.value) {
    if (open) {
      // Optional: Add a class to body for better control
      document.body.classList.add('sidebar-open-mobile')
    } else {
      document.body.classList.remove('sidebar-open-mobile')
    }
  }
})

// Ensure profile/org data is loaded on client for header display
if (process.client) {
  void profileStore.fetchUserProfile().catch(() => {})
  // If superadmin and an org is selected via query, prefetch organizations list so we can show org name
  try {
    if (auth.user?.role_id === 0 && (route.query.org || route.query.org_id)) {
      void superAdminStore.fetchOrganizations().catch(() => {})
    }
  } catch (e) {}
}

const selectedOrgDisplay = computed(() => {
  // Backwards-compatible string for any places using this previously
  if (auth.user?.role_id === 0) {
    const q = route && route.query ? route.query.org || route.query.org_id : null
    if (q) {
      const id = String(q)
      const found = (superAdminStore.organizations || []).find((o: any) => String(o.org_id) === id)
      return found && found.org_name ? `${found.org_name} Super Admin` : 'Super Admin'
    }
    return 'Super Admin'
  }
  return profileStore.userProfile?.company || '...'
})

// Provide a computed just for the title (org name) to render separately
const selectedOrgName = computed(() => {
  // For superadmin, only show actual selected organization (from query/params or analytics route)
  if (auth.user?.role_id === 0) {
    // Cast to any to avoid TypeScript errors
    const query = route && (route.query as any)
    const params = route && (route.params as any)

    const hasOrgInQuery = !!(query?.org || query?.org_id)
    const hasOrgInParams = !!(params?.org || params?.org_id)
    const onSuperadminAnalytics = route.path.includes('/admin/superadmin-analytics')

    if (hasOrgInQuery || hasOrgInParams || onSuperadminAnalytics) {
      const q = query?.org || query?.org_id || params?.org || params?.org_id
      if (q) {
        const id = String(q)
        const found = (superAdminStore.organizations || []).find(
          (o: any) => String(o.org_id) === id,
        )
        return found?.org_name || ''
      }
    }
    return ''
  }
  // For non-superadmin users, show company from profile
  return profileStore.userProfile?.company || ''
})

function goBackToOrgs() {
  try {
    // Navigate to the organizations list view for superadmins
    navigateTo('/admin/superadmin')
  } catch (e) {
    // ignore navigation errors
  }
}

// Ensure profile is loaded
if (process.client) {
  void profileStore.fetchUserProfile().catch(() => {})
}

const isProfileComplete = computed(() => {
  const up: any = profileStore.userProfile || {}
  return !!(up && up.name && up.contact_number && up.company)
})

// For superadmin users, only show organization admin menus when an organization is selected
const showOrganizationMenusForSuperAdmin = computed(() => {
  // Non-superadmin users always see organization menus
  if (auth.user?.role_id !== 0) return true

  // Cast to any to avoid TypeScript errors
  const query = route && (route.query as any)
  const params = route && (route.params as any)

  // For superadmin, detect selected org via route query or params
  const hasOrgInQuery = !!(query?.org || query?.org_id)
  const hasOrgInParams = !!(params?.org || params?.org_id)
  // Also consider analytics page where org query is used
  const onSuperadminAnalytics = route.path.includes('/admin/superadmin-analytics')
  return hasOrgInQuery || hasOrgInParams || onSuperadminAnalytics
})

const getInitials = (name?: string, email?: string) => {
  if (!name && email) return (email[0] || '').toUpperCase()
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const profileItems = computed(() => {
  const first: any[] = []
  if (auth.user?.role_id !== 0) {
    first.push({
      label: 'My Account',
      icon: 'heroicons:user',
      click: () => navigateTo('/admin/profile'),
    })
  }
  first.push({
    label: 'Change Password',
    icon: 'heroicons:key',
    click: () => navigateTo('/change-password'),
  })

  const second = [
    {
      label: 'Logout',
      icon: 'heroicons:arrow-right-on-rectangle',
      click: async () => {
        try {
          await auth.signOut()
        } catch (e) {
          console.error('Logout failed from profile dropdown', e)
          // Fallback navigation
          navigateTo('/login')
        }
      },
    },
  ]

  return [first, second]
})

// Helper to construct route objects that include org query for superadmins
function makeOrgLink(path: string) {
  try {
    // Cast route.query to any to avoid TypeScript errors
    const query = route && (route.query as any)
    const q = query?.org || query?.org_id ? { org: String(query.org || query.org_id) } : {}

    if (auth.user?.role_id === 0 && q && Object.keys(q).length) {
      return { path, query: q }
    }
    return { path }
  } catch (e) {
    return { path }
  }
}

// Handle upgrade button click in subscription modal
async function handleUpgradeClick() {
  subscriptionCheck.closeModal()
  subscriptionCheck.redirectToPlans()
}

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

const closeMobileSidebar = () => {
  if (isMobile.value || isTablet.value) {
    sidebarOpen.value = false
  }
}

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    'admin-dashboard': 'Dashboard',
    'admin-users': 'Users',
    'admin-artefacts': 'Artifacts',
    'admin-analytics': 'Analytics',
    'admin-integrations': 'Integrations Overview',
    'admin-integrations-teams': 'Teams Integration',
    'admin-integrations-slack': 'Slack Integration',
    'admin-integrations-whatsapp': 'WhatsApp Integration',
    'admin-integrations-i-message': 'iMessage Integration',
    'admin-superadmin': 'Dashboard',
    'admin-plans': 'Plans',
  }
  return titles[route.name as string] || 'Admin'
})
</script>

<style scoped>
.engraved-org {
  color: #d1d5db; /* light gray */
  font-weight: 600;
  letter-spacing: 0.2px;
  /* engraved effect: subtle highlight and deep shadow */
  text-shadow:
    0 1px 0 rgba(255, 255, 255, 0.03),
    0 -1px 0 rgba(0, 0, 0, 0.6);
  opacity: 0.95;
}

.org-role-tag {
  display: inline-block;
  background: #10b981; /* green-500 */
  color: white;
  border: 1px solid rgba(16, 185, 129, 0.2);
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 12px;
  line-height: 1;
  margin-top: 4px;
  font-weight: 600;
}

.plan-active {
  background: #10b981; /* green-500 */
  border-color: rgba(16, 185, 129, 0.25);
}

.plan-expired {
  background: #ef4444; /* red-500 */
  border-color: rgba(239, 68, 68, 0.35);
}

/* Breadcrumb styles */
.breadcrumb-container {
  padding: 6px 8px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  min-width: 0;
  max-width: 100%;
}

.breadcrumb-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #cbd5e1;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.03);
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  min-width: 0;
}

.breadcrumb-back:hover {
  color: white;
  background: rgba(255, 255, 255, 0.02);
}

.breadcrumb-title {
  font-size: 16px;
  font-weight: 700;
  color: #f8fafc;
  margin-left: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

@media (max-width: 768px) {
  .breadcrumb-title {
    font-size: 14px;
    max-width: 120px;
  }

  .breadcrumb-back {
    padding: 4px 6px;
    font-size: 11px;
  }
}

/* Small spacing for breadcrumb items */
.breadcrumb-container ol > li {
  display: inline-flex;
  align-items: center;
  min-width: 0;
}

/* Mobile workspace info styling */
@media (max-width: 768px) {
  .engraved-org {
    font-size: 0.95rem;
  }
}

/* Ensure smooth transitions for sidebar */
aside {
  transition: all 0.3s ease;
}

.w-16 {
  width: 4rem !important;
}

.w-64 {
  width: 16rem !important;
}

/* Ensure tooltips stay within viewport */
:deep(.group) {
  position: relative;
}

:deep(.u-tooltip) {
  max-width: none;
}

/* Prevent tooltip cutoff */
aside {
  overflow: visible !important;
}

/* Ensure dropdowns are visible */
.z-50 {
  z-index: 50;
}

/* Make sure sidebar doesn't hide tooltips */
aside {
  isolation: isolate;
}

/* Floating sidebar edge toggle (Chargebee-style) */
.sidebar-edge-toggle {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 48px;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 999;
  transition: left 0.3s ease;
  pointer-events: auto; /* Keep button clickable */
}

.sidebar-edge-toggle-inner {
  width: 28px;
  height: 50px;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sidebar-edge-toggle-inner:hover {
  background: #020617;
}

.sidebar-edge-toggle.expanded {
  left: 15rem; /* w-64 = 16rem */
}

.sidebar-edge-toggle.collapsed {
  left: 3rem; /* w-16 = 4rem */
}

.sidebar-edge-toggle:hover {
  background: #020617;
}

.sidebar-edge-icon {
  width: 16px;
  height: 16px;
  color: #cbd5e1;
  stroke-width: 2.5;
}

header {
  z-index: 50;
}
</style>
