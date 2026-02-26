<template>
  <div class="space-y-6">
    <!-- Header -->
    <div
      class="space-y-4 sm:space-y-0 sm:flex sm:flex-row sm:items-start sm:justify-between"
      style="margin-top: 0"
    >
      <div class="w-full sm:w-auto">
        <h1 class="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1 sm:mb-2">
          User Management
        </h1>
        <p class="text-xs sm:text-sm lg:text-base text-gray-400">
          Manage user accounts, roles, and permissions across your organization.
        </p>
      </div>
      <div
        class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto flex-shrink-0"
      >
        <AppTooltip
          :text="
            isDepartmentAdmin
              ? 'You don’t have permission to bulk upload. This action is limited to Company Admins.'
              : availableDepartmentsForForm.length === 0
                ? 'No departments available'
                : ''
          "
        >
          <button
            @click="!disableUserActions && !isDepartmentAdmin && openBulkUplaod()"
            :disabled="disableUserActions || isDepartmentAdmin"
            :class="[
              baseButtonClass,
              'bg-dark-800 text-white hover:bg-dark-700',
              'flex items-center justify-center sm:justify-start space-x-2',
              disableUserActions || isDepartmentAdmin ? 'opacity-50 cursor-not-allowed' : '',
              'flex-1 sm:flex-auto',
            ]"
          >
            <UIcon name="i-heroicons-cloud-arrow-up" class="w-4 h-4" />
            <span>Bulk Upload</span>
          </button>
        </AppTooltip>
        <AppTooltip
          :text="
            isDepartmentAdmin
              ? 'You don’t have permission to add users. This action is limited to Company Admins.'
              : availableDepartmentsForForm.length === 0
                ? 'No departments available'
                : ''
          "
        >
          <button
            @click="
              !disableUserActions &&
              availableDepartmentsForForm.length > 0 &&
              !isDepartmentAdmin &&
              openAddUserModal()
            "
            :disabled="
              disableUserActions || isDepartmentAdmin || availableDepartmentsForForm.length === 0
            "
            :class="[
              baseButtonClass,
              'bg-blue-600 hover:bg-blue-700 text-white',
              'flex items-center justify-center sm:justify-start space-x-2',
              disableUserActions || isDepartmentAdmin || availableDepartmentsForForm.length === 0
                ? 'opacity-50 cursor-not-allowed'
                : '',
              'flex-1 sm:flex-auto',
            ]"
          >
            <UIcon name="i-heroicons-plus" class="w-4 h-4" />
            <span class="truncate">Add User</span>
          </button>
        </AppTooltip>
      </div>
    </div>

    <PlanUpgradeAlert :data="usageAlertData" @upgrade="goToPlans" />

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 xl:gap-6">
      <!-- Total Users -->
      <div class="bg-dark-800 rounded-lg p-3 sm:p-4 xl:p-6 border border-dark-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm font-medium">Total Users</p>
            <p :class="`text-lg font-bold mt-2 ${usersTextColor}`">
              {{ stats.totalUsers }} /
              {{
                profileStore.getUserProfile?.plan_details && (usersLimit === 0 || usersLimit === -1)
                  ? 'Unlimited'
                  : usersLimit || 0
              }}
            </p>
          </div>
          <div class="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <UIcon name="i-heroicons-users" class="w-6 h-6 text-blue-400" />
          </div>
        </div>
      </div>

      <!-- Active Users -->
      <div class="bg-dark-800 rounded-lg p-4 sm:p-6 border border-dark-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm font-medium">Active Users</p>
            <p class="text-lg font-bold text-white mt-2">{{ stats.activeUsers }}</p>
          </div>
          <div class="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
            <UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-green-400" />
          </div>
        </div>
      </div>

      <!-- Admins -->
      <div class="bg-dark-800 rounded-lg p-4 sm:p-6 border border-dark-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm font-medium">Admins</p>
            <p class="text-lg font-bold text-white mt-2">{{ stats.adminUsers }}</p>
          </div>
          <div class="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <UIcon name="i-heroicons-shield-check" class="w-6 h-6 text-purple-400" />
          </div>
        </div>
      </div>

      <!-- New This Month -->
      <div class="bg-dark-800 rounded-lg p-4 sm:p-6 border border-dark-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm font-medium">New This Month</p>
            <p class="text-lg font-bold text-white mt-2">{{ stats.newThisMonth }}</p>
          </div>
          <div class="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
            <UIcon name="i-heroicons-user-plus" class="w-6 h-6 text-orange-400" />
          </div>
        </div>
      </div>
    </div>

    <!-- Search, Filters and Sort -->
    <div class="bg-dark-800 rounded-lg p-4 sm:p-6 border border-dark-700">
      <div class="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
        <!-- Search -->
        <div class="w-full">
          <UInput
            :model-value="searchQuery"
            @update:model-value="searchQuery = $event"
            placeholder="Search users..."
            size="md"
            icon="i-heroicons-magnifying-glass"
          />
        </div>

        <!-- Role -->
        <div class="w-full">
          <USelect
            v-model="selectedRole"
            :options="[{ label: 'All Roles', value: '' }, ...roleOptions]"
            option-attribute="label"
            value-attribute="value"
            size="md"
          />
        </div>

        <!-- Status -->
        <div class="w-full">
          <USelect
            v-model="selectedStatus"
            :options="[
              { label: 'All Status', value: '' },
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ]"
            size="md"
          />
        </div>

        <!-- Department -->
        <div class="w-full">
          <USelect
            v-model="selectedDepartment"
            :options="departmentFilterOptions"
            option-attribute="label"
            value-attribute="value"
            size="md"
          />
        </div>
      </div>
    </div>

    <!-- Users Table -->
    <div class="bg-dark-800 rounded-lg border border-dark-700 overflow-hidden">
      <!-- Table Header -->
      <div class="px-4 sm:px-6 py-4 border-b border-dark-700">
        <h2 class="text-base sm:text-lg font-semibold text-white">All Users</h2>
        <p class="text-gray-400 text-xs sm:text-sm mt-1">
          A list of all users in your organization including their contact information and roles.
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p class="text-gray-400 mt-2">Loading users...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="p-8 text-center">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 text-red-400 mx-auto" />
        <p class="text-red-400 mt-2">Failed to load users</p>
        <button
          @click="() => loadUsers()"
          class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>

      <div v-else>
        <!-- Bulk Actions Bar -->
        <div
          v-if="selectedUsers.size > 0"
          class="mb-4 p-4 bg-blue-900/20 border border-blue-800 rounded-lg flex items-center justify-between"
        >
          <div class="flex items-center space-x-3">
            <input
              type="checkbox"
              :checked="
                paginatedUsers.filter(canBulkAssignUser).every((u) => selectedUsers.has(u.id))
              "
              @change="selectAllUsers"
              class="w-4 h-4 rounded cursor-pointer"
            />
            <span class="text-sm text-gray-300">
              {{ selectedUsers.size }} user{{ selectedUsers.size !== 1 ? 's' : '' }} selected
            </span>
          </div>
          <div class="flex items-center space-x-2">
            <button
              @click="openBulkAssignmentModal('assign')"
              class="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm transition-colors flex items-center gap-2"
            >
              <UIcon name="heroicons:plus" class="w-4 h-4" />
              Assign Department
            </button>
            <button
              @click="openBulkAssignmentModal('unassign')"
              class="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded text-sm transition-colors flex items-center gap-2"
            >
              <UIcon name="heroicons:minus" class="w-4 h-4" />
              Unassign Department
            </button>
          </div>
        </div>

        <!-- Table Content -->
        <div>
          <UTable
            :columns="columns"
            :rows="paginatedUsers"
            v-model:sort="sort"
            sort-mode="manual"
            class="text-white"
          >
            <!-- Checkbox column -->
            <template #select-data="{ row }">
              <AppTooltip v-if="!canBulkAssignUser(row)" :text="getBulkAssignDisabledReason(row)">
                <input
                  type="checkbox"
                  disabled
                  class="w-4 h-4 rounded opacity-40 cursor-not-allowed"
                />
              </AppTooltip>

              <input
                v-else
                type="checkbox"
                :checked="selectedUsers.has(row.id)"
                @change="toggleUserSelection(row.id)"
                class="w-4 h-4 rounded cursor-pointer"
              />
            </template>

            <!-- Custom cells -->
            <template #name-data="{ row }">
              <div class="flex items-center">
                <div class="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <span class="text-blue-400 font-medium text-sm">{{ row.initials }}</span>
                </div>
                <div class="ml-3">
                  <div class="text-sm font-medium text-white flex items-center gap-2">
                    {{ row.name }}
                    <UBadge
                      v-if="row.id === authUser?.user_id"
                      size="xs"
                      class="bg-custom1-300 text-[10px]"
                      :ui="{ rounded: 'rounded-full' }"
                    >
                      Self
                    </UBadge>

                    <!-- Primary badge -->
                    <UBadge
                      v-if="row.primaryContact"
                      size="xs"
                      class="bg-custom1-300 text-[10px]"
                      :ui="{ rounded: 'rounded-full' }"
                    >
                      Primary
                    </UBadge>
                  </div>
                  <!-- <div class="text-sm text-gray-400">{{ row.username }}</div> -->
                </div>
              </div>
            </template>

            <template #contact-data="{ row }">
              <div class="text-sm text-white">{{ row.email }}</div>
              <div class="text-sm text-gray-400">{{ row.phone || '-' }}</div>
            </template>

            <template #role-data="{ row }">
              <span
                class="inline-flex px-2 py-1 text-xs font-medium rounded-full"
                :class="{
                  'bg-red-500/20 text-red-400': row.role === 'super admin',
                  'bg-purple-500/20 text-purple-400': row.role === 'admin',
                  'bg-emerald-500/20 text-emerald-400': row.role === 'department admin',
                  'bg-gray-500/20 text-gray-400': row.role === 'user',
                }"
              >
                {{ row.role }}
              </span>
            </template>

            <template #departments-data="{ row }">
              <!-- Admin: All departments -->
              <AppTooltip v-if="row.role_id === 1" text="Access to all departments">
                <UBadge
                  size="xs"
                  color="emerald"
                  class="font-medium"
                  :ui="{ rounded: 'rounded-full' }"
                >
                  All
                </UBadge>
              </AppTooltip>

              <!-- Scoped departments -->
              <div
                v-else-if="row.departments && row.departments.length > 0"
                class="flex flex-wrap gap-1"
              >
                <UBadge
                  v-for="dept in row.departments"
                  :key="dept"
                  size="xs"
                  variant="solid"
                  color="blue"
                  class="font-medium"
                  :ui="{ rounded: 'rounded-full' }"
                >
                  {{ dept }}
                </UBadge>
              </div>

              <!-- Unassigned -->
              <span v-else class="text-gray-400 text-xs">—</span>
            </template>

            <template #status-data="{ row }">
              <span
                class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full"
                :class="{
                  'bg-green-500/20 text-green-400': row.status === 'active',
                  'bg-red-500/20 text-red-400': row.status === 'inactive',
                }"
              >
                <div
                  class="w-1.5 h-1.5 rounded-full mr-1"
                  :class="{
                    'bg-green-400': row.status === 'active',
                    'bg-red-400': row.status === 'inactive',
                  }"
                ></div>
                {{ row.status }}
              </span>
            </template>

            <template #tokensUsed-data="{ row }">
              {{ formatTokenCount(row.tokensUsed) }}
            </template>

            <template #actions-data="{ row }">
              <div class="flex items-center space-x-2">
                <AppTooltip
                  v-if="!canEditUser(row)"
                  text="You can only edit users in your departments"
                >
                  <button
                    @click="editUser(row)"
                    :disabled="!canEditUser(row)"
                    :class="`transition-colors ${
                      canEditUser(row)
                        ? 'text-blue-400 hover:text-blue-300'
                        : 'text-gray-500 cursor-not-allowed opacity-50'
                    }`"
                  >
                    <UIcon name="i-heroicons-pencil" class="w-4 h-4" />
                  </button>
                </AppTooltip>
                <button
                  v-else
                  @click="editUser(row)"
                  :disabled="!canEditUser(row)"
                  :class="`transition-colors ${
                    canEditUser(row)
                      ? 'text-blue-400 hover:text-blue-300'
                      : 'text-gray-500 cursor-not-allowed opacity-50'
                  }`"
                >
                  <UIcon name="i-heroicons-pencil" class="w-4 h-4" />
                </button>
                <AppTooltip :text="row.isActive ? 'Deactivate user' : 'Activate user'">
                  <button
                    :disabled="row.id === authUser?.user_id || row.primaryContact"
                    @click="
                      (row.id !== authUser?.user_id || !row.primaryContact) &&
                      showToggleConfirm(row)
                    "
                    :class="`transition-colors ${
                      row.id === authUser?.user_id || row.primaryContact
                        ? 'cursor-not-allowed disabled:opacity-50 text-gray-500'
                        : row.isActive
                          ? 'text-red-400 hover:text-red-300'
                          : 'text-green-400 hover:text-green-300'
                    }`"
                    :aria-label="row.isActive ? 'Deactivate user' : 'Activate user'"
                  >
                    <UIcon
                      :name="row.isActive ? 'heroicons:no-symbol' : 'heroicons:bolt'"
                      class="w-4 h-4"
                    />
                  </button>
                </AppTooltip>
                <!-- <button
                  @click="deleteUser(row)"
                  class="text-red-400 hover:text-red-300 transition-colors"
                  title="Delete user"
                >
                  <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                </button> -->
              </div>
            </template>
          </UTable>
          <div
            class="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-dark-700 gap-4 sm:gap-0"
          >
            <div class="flex items-center space-x-3 text-xs sm:text-sm">
              <div class="text-gray-400 hidden sm:block">Rows per page</div>
              <div class="w-20 sm:w-24">
                <USelect v-model="perPage" :options="perPageOptions" size="sm" />
              </div>
            </div>

            <div class="overflow-x-auto">
              <UPagination
                v-model="page"
                :total="sortedRows.length"
                :page-count="computedPageCount"
                :show-first="false"
                :show-last="false"
                :show-edges="false"
                size="sm"
                color="blue"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- User Modal (Add/Edit) -->
    <UModal v-model="showUserModal" prevent-close>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-white">
              {{ isEditMode ? 'Edit User' : 'Add New User' }}
            </h3>
            <button @click="closeUserModal" class="text-gray-400 hover:text-white">
              <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
            </button>
          </div>
        </template>

        <UForm :state="userForm" :schema="userSchema" @submit="saveUser" class="space-y-4">
          <!-- Name -->
          <UFormGroup label="Name" name="name" required>
            <UInput
              v-model="userForm.name"
              type="text"
              placeholder="Enter full name"
              inputClass="custom-input"
              :ui="{
                base: 'w-full px-3 py-3 border border-dark-700 rounded-lg bg-dark-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500',
                padding: { sm: 'p-3' },
              }"
              icon="i-heroicons-user"
            />
          </UFormGroup>

          <!-- Email -->
          <UFormGroup label="Email" name="email" required>
            <UInput
              v-model="userForm.email"
              type="email"
              placeholder="Enter email address"
              inputClass="custom-input"
              :ui="{
                base: 'w-full px-3 py-3 border border-dark-700 rounded-lg bg-dark-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500',
                padding: { sm: 'p-3' },
              }"
              icon="i-heroicons-envelope"
            />
          </UFormGroup>

          <!-- Phone -->
          <UFormGroup name="phone" label="Phone Number" required>
            <LibVueTelInput
              ref="phoneRef"
              :prop-phone="userForm.phone"
              placeholder="Your phone number"
              defaultCountry="us"
            />
          </UFormGroup>

          <!-- Role -->
          <UFormGroup
            label="Role"
            name="role_id"
            required
            :area-disabled="
              usersStore.users.find((u) => u.user_id === userForm.user_id)?.primary_contact ||
              isDepartmentAdmin
            "
          >
            <USelect
              v-model="userForm.role_id"
              :options="roleOptionsForForm"
              option-attribute="label"
              value-attribute="value"
              placeholder="Select Role"
              selectClass="custom-select"
              :disabled="
                usersStore.users.find((u) => u.user_id === userForm.user_id)?.primary_contact ||
                isDepartmentAdmin
              "
              :ui="{
                base: 'w-full px-3 py-3 border border-dark-700 rounded-lg bg-dark-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500',
                padding: { sm: 'p-3' },
              }"
              icon="i-heroicons-cursor-arrow-ripple"
            />
            <p v-if="isDepartmentAdmin" class="text-xs text-gray-400 mt-2">
              {{
                isEditMode
                  ? 'Department Admins cannot change user roles'
                  : 'Department Admins can only create users with USER role'
              }}
            </p>
          </UFormGroup>

          <!-- Departments (Required for USER and DEPARTMENT ADMIN) -->
          <UFormGroup
            v-if="
              userForm.role_id === 2 ||
              userForm.role_id === 3 ||
              String(userForm.role_id) === '2' ||
              String(userForm.role_id) === '3'
            "
            label="Departments"
            name="departments"
            required
          >
            <USelectMenu
              v-model="userForm.departments"
              :options="availableDepartmentsForForm"
              option-attribute="name"
              value-attribute="dept_id"
              multiple
              searchable
              placeholder="Select departments"
              icon="i-heroicons-building-office"
              class="w-full"
              selectClass="custom-select"
              :disabled="isUserOutsideDepartmentAdminScope"
            >
              <!-- Custom selected value display -->
              <template #label>
                <span v-if="!userForm.departments.length" class="text-gray-400">
                  Select departments
                </span>

                <span v-else>
                  {{ selectedDepartmentsLabel }}
                </span>
              </template>
            </USelectMenu>
            <p
              v-if="isDepartmentAdmin && availableDepartmentsForForm.length > 0"
              class="text-xs text-gray-400 mt-2"
            >
              <template v-if="isEditMode && isUserOutsideDepartmentAdminScope">
                You can only edit users in your department(s)
              </template>
              <template v-else>
                {{
                  isEditMode
                    ? 'Limited to your department(s)'
                    : 'You can only assign from your department(s)'
                }}
              </template>
            </p>
          </UFormGroup>

          <!-- Primary Contact -->
          <UFormGroup name="primaryContact">
            <UCheckbox
              v-model="userForm.primaryContact"
              label="Make Primary Contact"
              :disabled="isDepartmentAdmin"
              :ui="{ base: 'rounded bg-dark-900 border-dark-700' }"
              @click="handlePrimaryContactToggle"
            />
            <p v-if="isDepartmentAdmin" class="text-xs text-gray-400 mt-2">
              Department Admins cannot change the primary contact
            </p>
          </UFormGroup>

          <!-- Active Status -->
          <!-- <UFormGroup name="isActive">
            <UCheckbox
              v-model="userForm.isActive"
              label="Active User"
              :ui="{ base: 'rounded bg-dark-900 border-dark-700' }"
            />
          </UFormGroup> -->

          <!-- Buttons -->
          <div class="flex space-x-3 pt-4">
            <UButton
              type="button"
              @click="closeUserModal"
              label="Cancel"
              color="gray"
              class="flex-1 px-3 py-3 justify-center"
            />
            <UButton
              type="submit"
              :loading="isEditMode ? updatingUser : addingUser"
              :label="
                isEditMode
                  ? updatingUser
                    ? 'Saving...'
                    : 'Save Changes'
                  : addingUser
                    ? 'Adding...'
                    : 'Add User'
              "
              class="flex-1 px-3 py-3 justify-center"
            />
          </div>
        </UForm>
      </UCard>
    </UModal>

    <!-- Delete User Modal -->
    <UModal v-model="showDeleteUserModal" prevent-close>
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-white">Delete User</h3>
        </template>

        <p class="text-gray-300 mb-6">
          Are you sure you want to delete
          <span class="font-semibold">{{ selectedUser?.name }}</span
          >?<br />
          They will no longer have access but their data will remain in the system.
        </p>

        <div class="flex space-x-3">
          <UButton
            @click="showDeleteUserModal = false"
            label="Cancel"
            color="gray"
            class="flex-1 px-3 py-3 justify-center"
          />
          <UButton
            @click="confirmDelete"
            :loading="deletingUser"
            label="Delete"
            color="red"
            class="flex-1 px-3 py-3 justify-center"
          />
        </div>
      </UCard>
    </UModal>

    <!-- Confirm Activate/Deactivate Modal -->
    <UModal v-model="showToggleConfirmModal" prevent-close>
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-white">Confirm Action</h3>
        </template>

        <p class="text-gray-300 mb-2">
          Are you sure you want to
          <span class="font-semibold">{{
            selectedUser?.isActive ? 'deactivate' : 'activate'
          }}</span>
          user <span class="font-semibold">{{ selectedUser?.name }}</span
          >?
        </p>
        <p class="text-sm text-gray-400 mb-6">
          <!-- Role-aware message: only mention sign-in restriction for admin/super admin -->
          <template v-if="selectedUser?.isActive">
            <template v-if="selectedUser?.role_id === 0 || selectedUser?.role_id === 1">
              Deactivating will immediately revoke this user's access, prevent them from signing in,
              and they will lose bot access.
            </template>
            <template v-else>
              Deactivating will remove this user's access within the organization and they'll lose
              bot access.
            </template>
          </template>

          <template v-else>
            <template v-if="selectedUser?.role_id === 0 || selectedUser?.role_id === 1">
              Activating will restore this user's access, allow them to sign in, and restore their
              bot access.
            </template>
            <template v-else>
              Activating will restore this user's access within the organization.
            </template>
          </template>
        </p>

        <div class="flex space-x-3">
          <UButton
            @click="showToggleConfirmModal = false"
            label="Cancel"
            color="gray"
            class="flex-1 px-3 py-3 justify-center"
          />
          <UButton
            @click="confirmToggleActive"
            :loading="togglingUser"
            label="Confirm"
            color="blue"
            class="flex-1 px-3 py-3 justify-center"
          />
        </div>
      </UCard>
    </UModal>

    <!-- Confirm Primary COntact -->
    <UModal v-model="showPrimaryContactConfirm" prevent-close>
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-white">Confirm Primary Contact</h3>
        </template>
        <p class="text-gray-300 mb-6">{{ primaryContactConfirmMessage }}</p>
        <div class="flex space-x-3">
          <UButton
            @click="
              () => {
                showPrimaryContactConfirm = false
                pendingPrimaryContactChange = false
              }
            "
            label="Cancel"
            color="gray"
            class="flex-1 px-3 py-3 justify-center"
          />
          <UButton
            @click="confirmPrimaryContactChange"
            label="Confirm"
            color="blue"
            class="flex-1 px-3 py-3 justify-center"
          />
        </div>
      </UCard>
    </UModal>

    <!-- Bulk Upload Modal -->

    <UModal
      v-model="showForm2"
      prevent-close
      class="custom-modal"
      :ui="{
        width: 'sm:max-w-3xl xl:max-w-4xl',
        base: 'max-h-[90vh] overflow-y-auto',
      }"
    >
      <UCard
        :ui="{
          base: 'h-full flex flex-col',
          rounded: '',
          divide: 'divide-y divide-gray-100 dark:divide-gray-800',
          body: { base: 'grow' },
        }"
      >
        <!-- Modal Header -->
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
              Upload Bulk Users
            </h3>
            <div class="flex items-center space-x-2">
              <UButton
                @click="downloadCsv"
                icon="i-heroicons:cloud-arrow-down-16-solid"
                class="download-csv-template-btn text-white bg-custom1-400 hover:bg-custom1-500 focus:outline-none"
              >
                Download CSV Template
              </UButton>
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-x-mark-20-solid"
                class="-my-1"
                @click="closePreviewForm"
              />
            </div>
          </div>
        </template>

        <!-- Modal Body -->
        <div class="upload-area space-y-4">
          <!-- File Upload Section -->

          <div
            class="drag-area border-dashed border-2 border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer"
            @dragover.prevent
            @dragenter.prevent
            @drop="handleFileDrop"
            @click="triggerFileInput"
          >
            <p class="text-gray-500">Drag and drop a file here or Click to select a file</p>
            <p class="text-sm text-gray-400 mt-2">Supported file types: CSV files only</p>
            <p class="text-sm text-gray-400 mt-2">
              Note: The WhatsApp number should start with the country code, followed by a valid
              number without any spaces.
            </p>
            <input
              type="file"
              ref="fileInput"
              class="hidden"
              @change="handleFileInput"
              accept=".csv"
            />
          </div>

          <!-- File Preview Section -->
          <div v-if="selectedFile" class="file-preview border border-gray-300 rounded-md p-4">
            <h4 class="font-semibold mb-2">Users Preview</h4>
            <div v-html="viewContent" class="users-preview"></div>
          </div>

          <!-- Inline error summary when validation fails -->
          <div
            v-if="errors.length && !hideInline"
            class="p-4 bg-red-800/10 text-red-800 rounded border border-red-200"
          >
            <div class="flex items-start justify-between">
              <div>
                <strong class="block">Invalid or missing user details</strong>
                <p class="text-sm">Please correct the highlighted fields and try again.</p>
              </div>
            </div>

            <ul class="mt-3 list-disc pl-5 text-sm max-h-40 overflow-auto">
              <li v-for="(err, idx) in errors" :key="idx" class="mb-1">
                {{ err.errorMessage }}
              </li>
            </ul>
          </div>
        </div>

        <!-- Modal Footer -->
        <template #footer>
          <div class="flex justify-end space-x-4">
            <UButton @click="closePreviewForm" class="bg-gray-300 hover:bg-gray-400 rounded">
              Cancel
            </UButton>
            <UButton
              type="button"
              :disabled="errors.length > 0 || !selectedFile || validating"
              @click="handleUpload"
              class="bg-custom1-400 text-white hover:bg-custom1-500 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Upload
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Bulk Assignment Modal -->
    <UModal v-model="showBulkAssignmentModal" prevent-close>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ bulkActionMode === 'assign' ? 'Assign' : 'Unassign' }} Department
            </h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark-20-solid"
              class="-my-1"
              @click="closeBulkAssignmentModal"
            />
          </div>
        </template>

        <div class="space-y-4">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {{ bulkActionMode === 'assign' ? 'Assign' : 'Unassign' }}
              {{ selectedUsers.size }} user{{ selectedUsers.size !== 1 ? 's' : '' }}
              {{ bulkActionMode === 'assign' ? 'to' : 'from' }} department(s)
            </p>

            <!-- Department selection -->
            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-900 dark:text-white">
                Select Department{{ selectedBulkDepartments.length !== 1 ? 's' : '' }}
              </label>
              <div class="space-y-3 max-h-72 overflow-y-auto">
                <div v-if="departmentsForBulkModal.length === 0" class="text-center py-4">
                  <p class="text-sm text-gray-500">
                    {{
                      bulkActionMode === 'unassign'
                        ? 'No departments assigned to selected users'
                        : 'No departments available'
                    }}
                  </p>
                </div>
                <div
                  v-for="dept in departmentsForBulkModal"
                  :key="dept.dept_id"
                  @click="toggleBulkDepartment(dept.dept_id)"
                  class="flex items-center justify-between px-4 py-3 rounded-lg border cursor-pointer transition-all"
                  :class="
                    selectedBulkDepartments.includes(dept.dept_id)
                      ? 'bg-blue-900/40 border-blue-500'
                      : 'bg-dark-900 border-dark-700 hover:border-blue-400 hover:bg-dark-800'
                  "
                >
                  <span class="text-sm font-medium">
                    {{ dept.name }}
                  </span>

                  <!-- Right check icon -->
                  <UIcon
                    v-if="selectedBulkDepartments.includes(dept.dept_id)"
                    name="i-heroicons-check"
                    class="w-5 h-5 text-blue-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end space-x-2">
            <UButton
              color="gray"
              @click="closeBulkAssignmentModal"
              :disabled="bulkAssignmentLoading"
            >
              Cancel
            </UButton>
            <UButton
              :color="bulkActionMode === 'assign' ? 'green' : 'orange'"
              @click="executeBulkAssignment"
              :loading="bulkAssignmentLoading"
              :disabled="selectedBulkDepartments.length === 0 || bulkAssignmentLoading"
            >
              {{ bulkActionMode === 'assign' ? 'Assign' : 'Unassign' }}
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { z } from 'zod'
import { useRoute } from 'vue-router'
import PlanUpgradeAlert from '@/components/ui/PlanUpgradeAlert.vue'
import Papa from 'papaparse'
import 'github-markdown-css/github-markdown.css'

// Types
interface ApiUser {
  user_id: string
  name: string
  email: string
  contact_number: string
  role_id: number
  role?: string
  status?: string
  added_by: string
  primary_contact: boolean
  org_name: string
  last_active: string
  updated_at: string
  created_at: string
  source: string
  tokens_used?: number
  added_at?: string
}

interface MappedUser {
  id: string
  name: string
  email: string
  phone: string
  role_id: number
  role: string
  status: string
  initials: string
  username: string
  lastActive: string
  created: string
  tokensUsed: number
  tokensUsedRaw: number
  source: string
  primaryContact?: boolean
  isActive?: boolean
  departments?: string[] // department names for Department Admin users
  rawDepartmentIds?: string[]
}

interface UserStats {
  totalUsers: number
  activeUsers: number
  adminUsers: number
  newThisMonth: number
}

interface UserForm {
  user_id?: string
  name: string
  email: string
  phone: string
  role_id?: number | string // Can be string from USelect or number from defaults
  primaryContact: boolean
  isActive: boolean
  departments?: string[] // for Department Admin role (dept_id array)
}

// Using admin layout
definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

// Store
const usersStore = useUsersStore()
const baseInputClass =
  'block w-full px-3 py-3 border border-dark-700 rounded-lg bg-dark-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
const baseInputWithIcon =
  'block w-full pl-10 pr-3 py-3 border border-dark-700 rounded-lg bg-dark-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
const baseButtonClass = 'px-4 py-2 rounded-lg border border-dark-700 transition-colors'
const profileStore = useProfileStore()
const authStore = useAuthStore()
const integrationsStore = useIntegrationsStore()

const planDetails = computed(() => profileStore.getUserProfile?.plan_details || {})
const usersLimit = computed(() => (planDetails.value as any)?.users || 0)
const selectedDepartment = ref('')

const departmentFilterOptions = computed(() => [
  { label: 'All Departments', value: '' },
  ...departmentsList.value
    .filter((d) => d.id !== 'ALL') // safeguard
    .map((d) => ({
      label: d.name,
      value: String(d.dept_id),
    })),
])

// 🔑 For Department Admin: only show their own departments
const availableDepartmentsForForm = computed(() => {
  if (!isDepartmentAdmin.value) {
    // Non-Department Admin can select from all departments
    return departmentsList.value.filter((d) => d.id !== 'ALL')
  }

  // Department Admin can only select their own departments
  return departmentsList.value.filter(
    (d) => d.id !== 'ALL' && currentUserDepartments.value.includes(String(d.dept_id)),
  )
})

// 🔑 Get departments available for bulk unassign (intersection of DA's depts and selected users' depts)
const departmentsForBulkModal = computed(() => {
  // For assign mode, use all available departments
  if (bulkActionMode.value === 'assign') {
    return availableDepartmentsForForm.value
  }

  // For unassign mode, show only departments that are actually assigned to selected users
  if (selectedUsers.value.size === 0) {
    return []
  }

  // Collect all department IDs from selected users
  const selectedUserDepts = new Set<string>()
  selectedUsers.value.forEach((userId) => {
    const user = usersList.value.find((u) => u.id === userId)
    if (user?.rawDepartmentIds) {
      user.rawDepartmentIds.forEach((deptId) => selectedUserDepts.add(deptId))
    }
  })

  // Filter available departments to only those in selected users
  return availableDepartmentsForForm.value.filter((d) => selectedUserDepts.has(String(d.dept_id)))
})

const authUser = computed(() => authStore.getAuthUser)

// 🔑 DEPARTMENT ADMIN RESTRICTIONS
// Get the current authenticated user's departments
const currentUserDepartments = computed(() => {
  const userId = authUser.value?.user_id
  if (!userId) return []

  const userRecord = usersStore.users.find((u) => u.user_id === userId)
  if (!userRecord) return []

  const deptIds: string[] = Array.isArray((userRecord as any).departments)
    ? (userRecord as any).departments
    : []

  return deptIds
})

// Check if current user is a Department Admin
const isDepartmentAdmin = computed(() => authUser.value?.role_id === 3)

// 🔑 Check if a user can be edited by the current Department Admin
const canEditUser = (user: MappedUser): boolean => {
  // Non-Department Admin can edit anyone (except primary contact restrictions handled elsewhere)
  if (!isDepartmentAdmin.value) return true

  // 🔑 Department Admin cannot edit other Department Admins or Org Admins
  if (user.role_id === 3 || user.role_id === 1) {
    return false
  }

  // Department Admin can only edit users who:
  // 1. Are in their department(s), OR
  // 2. Are unassigned (no departments)
  if (user.rawDepartmentIds && user.rawDepartmentIds.length > 0) {
    // User has departments - check if any overlap with Department Admin's departments
    return user.rawDepartmentIds.some((deptId) => currentUserDepartments.value.includes(deptId))
  }

  // User is unassigned - Department Admin can edit
  return true
}

// 🔑 Get the departments of the user currently being edited
const currentEditingUserAssignedDepartments = computed(() => {
  if (!isEditMode.value || !userForm.user_id) return []
  const user = usersList.value.find((u) => u.id === userForm.user_id)
  return user?.rawDepartmentIds || []
})

// 🔑 Check if user being edited is outside Department Admin's scope
const isUserOutsideDepartmentAdminScope = computed(() => {
  if (!isDepartmentAdmin.value || !isEditMode.value) return false

  // Check if user has any departments
  if (currentEditingUserAssignedDepartments.value.length === 0) return false // unassigned user - can edit

  // Check if user has ANY department that overlaps with Department Admin's departments
  const hasOverlap = currentEditingUserAssignedDepartments.value.some((deptId) =>
    currentUserDepartments.value.includes(deptId),
  )

  // Return true (disable) only if user has NO overlap with Department Admin's departments
  return !hasOverlap
})

// WhatsApp connection status
const isWhatsAppConnected = computed(() => {
  try {
    // Prefer overview status if available and connected
    const status = integrationsStore.getIntegrationStatus('whatsapp')
    if (status === 'connected') return true

    // If overview reports disconnected (or not available) check whatsappDetails directly
    const wd = integrationsStore.whatsappDetails
    if (wd && wd.whatsapp_status && wd.business_whatsapp_number) return true

    // Otherwise not connected
    return false
  } catch (e) {
    return false
  }
})

const usersUsage = computed(() => {
  const current = stats.value.totalUsers
  const limit = usersLimit.value
  const percentage = limit > 0 ? (current / limit) * 100 : 0

  return {
    name: 'Users',
    current,
    limit,
    percentage: percentage,
  }
})

const usageAlertData = computed(() => {
  const metrics = [usersUsage.value]

  return {
    metrics,
    exceededMetrics: metrics.filter((m) => m.percentage >= 100),
    highMetrics: metrics.filter((m) => m.percentage >= 80 && m.percentage < 100),
    hasExceeded: metrics.some((m) => m.percentage >= 100),
    hasHigh: metrics.some((m) => m.percentage >= 80 && m.percentage < 100),
  }
})

const disableUserActions = computed(() => usageAlertData.value.hasExceeded)

const goToPlans = () => {
  navigateTo('/admin/plans')
}

const getUsageColor = (current: number, limit?: number) => {
  if (!limit) return 'text-white'
  const percent = (current / limit) * 100
  if (percent >= 100) return 'text-red-400'
  if (percent >= 80) return 'text-orange-400'
  return 'text-white'
}

const selectedDepartmentsLabel = computed(() => {
  if (!userForm.departments.length) return ''

  const selected = departmentsList.value.filter((d) =>
    userForm.departments.includes(String(d.dept_id)),
  )

  const names = selected.map((d) => d.name)

  if (names.length <= 2) {
    return names.join(', ')
  }

  const visible = names.slice(0, 2).join(', ')
  const remaining = names.length - 2

  return `${visible} +${remaining} more`
})

const usersTextColor = computed(() => getUsageColor(stats.value.totalUsers, usersLimit.value))

// Reactive state
const phoneRef = ref(null)
const phoneValidation = ref({ status: true, message: '' })
const route = useRoute()
const searchQuery = ref('')
const selectedRole = ref('')
const selectedStatus = ref('')
const showUserModal = ref(false)
const showDeleteUserModal = ref(false)
const loading = ref(false)
const addingUser = ref(false)
const updatingUser = ref(false)
const deletingUser = ref(false)
const error = ref<string | null>(null)

const usersList = ref<MappedUser[]>([])
const selectedUser = ref<MappedUser | null>(null)
const isEditMode = ref(false)
const departmentsList = ref<any[]>([]) // stores organization departments

const showPrimaryContactConfirm = ref(false)
const pendingPrimaryContactChange = ref(false)
const primaryContactConfirmMessage = ref('')
const isPrimaryContactConfirming = ref(false)

// Toggle confirm modal state
const showToggleConfirmModal = ref(false)
const togglingUser = ref(false)

// Bulk assignment state
const selectedUsers = ref<Set<string>>(new Set())
const showBulkAssignmentModal = ref(false)
const bulkActionMode = ref<'assign' | 'unassign'>('assign')
const selectedBulkDepartments = ref<string[]>([])
const bulkAssignmentLoading = ref(false)

const confirmPrimaryContactChange = async () => {
  userForm.primaryContact = true
  showUserModal.value = true
  showPrimaryContactConfirm.value = false
  pendingPrimaryContactChange.value = false
  isPrimaryContactConfirming.value = false
}

const userForm = reactive<UserForm>({
  user_id: '',
  name: '',
  email: '',
  phone: '',
  role_id: 2, // default to 'user'
  primaryContact: false,
  isActive: true,
  departments: [],
})

const { showSuccess, showError } = useNotification()

// Table columns with sorting enabled
const columns = [
  { key: 'select', label: '', sortable: false, class: 'w-12' },
  { key: 'name', label: 'User', sortable: true },
  { key: 'contact', label: 'Contact', sortable: false },
  { key: 'role', label: 'Role', sortable: true },
  { key: 'departments', label: 'Department', sortable: false },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'lastActive', label: 'Last Active', sortable: true },
  { key: 'created', label: 'Created', sortable: true },
  { key: 'source', label: 'Source', sortable: true },
  { key: 'tokensUsed', label: 'Tokens Used', sortable: true },
  { key: 'actions', label: 'Actions' },
]

const filteredUsers = computed(() => {
  return usersList.value.filter((user) => {
    const matchesSearch =
      !searchQuery.value ||
      user.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesRole = !selectedRole.value || String(user.role_id) === String(selectedRole.value)

    const matchesStatus = !selectedStatus.value || user.status === selectedStatus.value

    const matchesDepartment =
      !selectedDepartment.value || user.rawDepartmentIds?.includes(String(selectedDepartment.value))

    return matchesSearch && matchesRole && matchesStatus && matchesDepartment
  })
})

const sort = ref<{ column: string; direction: 'asc' | 'desc' | null }>({
  column: 'name',
  direction: 'asc',
})

// UI model for the sort select control
const sortOption = ref('name_asc')

const applySort = () => {
  const [col, dir] = sortOption.value.split('_')
  sort.value = { column: col, direction: dir as 'asc' | 'desc' }
}

// Ensure initial sort is applied
applySort()

const sortedRows = computed(() => {
  if (!sort.value.column || !sort.value.direction) return filteredUsers.value

  const colKey = sort.value.column
  const dir = sort.value.direction === 'asc' ? 1 : -1

  const fieldMap: Record<string, string> = {
    lastActive: 'lastActive',
    created: 'created',
    tokensUsed: 'tokensUsedRaw',
    name: 'name',
    contact: 'email',
    role: 'role',
    status: 'status',
    source: 'source',
  }

  const field = fieldMap[colKey] || colKey

  return [...filteredUsers.value].sort((a, b) => {
    let aVal = (a as any)[field]
    let bVal = (b as any)[field]

    // For date fields
    if (field === 'lastActive' || field === 'created') {
      const parseDate = (dateStr: string) => {
        if (!dateStr) return new Date(0)
        const parts = dateStr.split('/')
        if (parts.length !== 3) return new Date(0)
        const [day, month, year] = parts.map(Number)
        return new Date(year, month - 1, day)
      }

      const aDate = parseDate(aVal)
      const bDate = parseDate(bVal)

      if (aDate < bDate) return -1 * dir
      if (aDate > bDate) return 1 * dir
      return 0
    }

    // Fallback to other fields without changes
    aVal = aVal ? String(aVal).toLowerCase() : ''
    bVal = bVal ? String(bVal).toLowerCase() : ''
    if (aVal < bVal) return -1 * dir
    if (aVal > bVal) return 1 * dir
    return 0
  })
})

const page = ref(1)
const perPage = ref(5) // rows per page
const perPageOptions = [
  { label: '5', value: 5 },
  { label: '10', value: 10 },
  { label: '20', value: 20 },
  { label: '50', value: 50 },
  { label: 'All', value: 'all' },
]
const computedPageCount = computed(() =>
  perPage.value === 'all' ? Math.max(sortedRows.value.length, 1) : (perPage.value as number),
)
watch(perPage, () => {
  page.value = 1
})

const paginatedUsers = computed(() => {
  if (perPage.value === 'all') return sortedRows.value
  const start = (page.value - 1) * perPage.value
  const end = start + perPage.value
  return sortedRows.value.slice(start, end)
})

const roleOptions = computed(() => {
  const allRoles = usersStore.roles.map((role: any) => ({
    label: role.role_name,
    value: String(role.role_id),
  }))

  // role_id = 2 → normal user → LAST
  const userRole = allRoles.find((r) => r.value === '2')
  const others = allRoles.filter((r) => r.value !== '2')

  return [...others, ...(userRole ? [userRole] : [])]
})

// 🔑 For form: Include current user's role even if not in available roleOptions
// This ensures Department Admins can see their own role when editing themselves
const roleOptionsForForm = computed(() => {
  const baseOptions = roleOptions.value

  // If we're editing a user and their current role is not in the available options, add it
  if (isEditMode.value && userForm.role_id) {
    const currentRoleId = String(userForm.role_id)
    const roleExists = baseOptions.some((r) => r.value === currentRoleId)

    if (!roleExists) {
      // Find the role from all available roles (including restricted ones)
      const allRoles = usersStore.roles.map((role: any) => ({
        label: role.role_name,
        value: String(role.role_id),
      }))
      const currentRole = allRoles.find((r) => r.value === currentRoleId)

      if (currentRole) {
        return [...baseOptions, currentRole]
      }
    }
  }

  return baseOptions
})

watch([selectedRole, selectedStatus, searchQuery, selectedDepartment], () => {
  page.value = 1
})

watch([sort], () => {
  page.value = 1
})

const userSchema = z
  .object({
    name: z
      .string()
      .nonempty('Name is required')
      .min(5, 'Name should be at least 5 characters long'),
    email: z.string().email('Invalid email address'),
    role_id: z.union([z.string(), z.number()]).refine((val) => val !== '', {
      message: 'Role is required',
    }),
    primaryContact: z.boolean().optional(), // optional
    isActive: z.boolean().default(true),
    departments: z.array(z.string()).optional().default([]),
  })
  .refine(
    (data) => {
      // 🔑 Departments are REQUIRED for both USER (role_id = 2) and DEPARTMENT ADMIN (role_id = 3)
      const roleId = Number(data.role_id)
      if (roleId === 2 || roleId === 3) {
        return data.departments && data.departments.length > 0
      }
      return true
    },
    {
      message: 'At least one department must be assigned',
      path: ['departments'],
    },
  )

// Function to validate phone and update UI
function validatePhoneField() {
  const phoneValidation = phoneRef.value?.handlePhoneValidation?.(true)
  return phoneValidation?.status || false
}
// Computed properties
const stats = computed<UserStats>(() => {
  const totalUsers = usersList.value.length
  const activeUsers = usersList.value.filter((user) => user.status === 'active').length
  const adminUsers = usersList.value.filter((user) => user.role === 'admin').length
  const newThisMonth = usersList.value.filter((user) => {
    const now = new Date()
    const createdStr = user.created || ''
    let createdDate: Date | null = null

    // If date is in MM/DD/YYYY format (from server), parse accordingly
    if (createdStr.includes('/')) {
      const parts = createdStr.split('/').map(Number)
      if (parts.length === 3) {
        const [month, day, year] = parts
        createdDate = new Date(year, month - 1, day)
      }
    } else {
      // Fallback to native parsing for ISO or other formats
      const d = new Date(createdStr)
      if (!isNaN(d.getTime())) createdDate = d
    }

    if (!createdDate) return false
    return (
      createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear()
    )
  }).length

  return { totalUsers, activeUsers, adminUsers, newThisMonth }
})

const getInitials = (name: string): string => {
  if (!name) return 'UU'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const formatTokenCount = (tokens: number | string): string => {
  const n = Number(tokens) || 0
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`
  return n.toLocaleString()
}

const parseFormattedTokens = (val: number | string | undefined): number => {
  if (val === undefined || val === null) return 0
  if (typeof val === 'number') return val
  let s = String(val).trim()
  if (!s) return 0
  // Remove commas and spaces
  s = s.replace(/,/g, '').replace(/\s+/g, '')
  const lastChar = s.slice(-1).toUpperCase()
  if (lastChar === 'M') {
    const num = parseFloat(s.slice(0, -1))
    return Number.isFinite(num) ? Math.round(num * 1000000) : 0
  }
  if (lastChar === 'K') {
    const num = parseFloat(s.slice(0, -1))
    return Number.isFinite(num) ? Math.round(num * 1000) : 0
  }
  // fallback parse number
  const num = parseFloat(s)
  return Number.isFinite(num) ? Math.round(num) : 0
}

const mapRole = (roleId: number, roleName?: string): string => {
  if (roleName) return roleName.toLowerCase()

  const roleMap: { [key: number]: string } = {
    0: 'super admin',
    1: 'admin',
    2: 'user',
  }
  return roleMap[roleId] || 'user'
}

const mapApiUserToMappedUser = (user: ApiUser, userDepartments?: string[]): MappedUser => ({
  id: user.user_id,
  name: user.name,
  email: user.email,
  phone: user.contact_number || '',
  role_id: user.role_id,
  role: mapRole(user.role_id, user.role),
  status: user.status || 'active',
  initials: getInitials(user.name),
  isActive: (user.status || 'active') === 'active',
  username: user.email.split('@')[0],
  lastActive: user.last_active || user.updated_at || user.created_at,
  created: user.added_at || user.created_at,
  tokensUsedRaw: parseFormattedTokens(user.tokens_used),
  tokensUsed: parseFormattedTokens(user.tokens_used),
  source: user.source,
  primaryContact: user.primary_contact,
  departments: userDepartments,
})

// API functions
const loadUsers = async (showLoading = true) => {
  // Only show the global loading spinner on the first (explicit) load
  if (showLoading) {
    loading.value = true
    error.value = null
  }

  try {
    // If superadmin is viewing org-scoped page, pass org query param to store
    const orgIdFromQuery =
      route.query?.org || route.query?.org_id
        ? String(route.query?.org || route.query?.org_id)
        : null
    await usersStore.fetchUsers(orgIdFromQuery)
    if (usersStore.users?.length) {
      // Map users with their department names (converted from IDs) for display
      const mappedUsers = usersStore.users.map((user) => {
        const deptIds: string[] = Array.isArray((user as any).departments)
          ? (user as any).departments
          : []

        return {
          ...mapApiUserToMappedUser(user),
          rawDepartmentIds: deptIds.map(String), // 🔑 important
          departments: deptIds.map((id: string) => departmentMapForDisplay.value[String(id)]).filter(Boolean),
        }
      })

      usersList.value = mappedUsers
    }
  } catch (err: any) {
    console.error('Failed to load users:', err)
    // Only surface the error to UI if it was the initial load
    if (showLoading) {
      error.value = usersStore.getUserError || err.message || 'Failed to load users'
    }
  } finally {
    if (showLoading) loading.value = false
  }
}

const loadDepartments = async () => {
  const orgIdFromQuery =
    route.query?.org || route.query?.org_id ? String(route.query?.org || route.query?.org_id) : null
  await usersStore.fetchDepartments(orgIdFromQuery)
  departmentsList.value = usersStore.getDepartments
}

// 🔑 Load ALL departments for display purposes (no role-based filtering)
const loadAllDepartmentsForDisplay = async () => {
  const orgIdFromQuery =
    route.query?.org || route.query?.org_id ? String(route.query?.org || route.query?.org_id) : null
  await usersStore.fetchAllDepartments(orgIdFromQuery)
}

// 🔑 Department map for display purposes (uses all departments, not just managed ones)
const departmentMapForDisplay = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  usersStore.allDepartments.forEach((d) => {
    map[String(d.dept_id)] = d.name
  })
  return map
})

const departmentMap = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  departmentsList.value.forEach((d) => {
    map[String(d.dept_id)] = d.name
  })
  return map
})

const handlePrimaryContactUpdate = async () => {
  if (!userForm.primaryContact) return

  // Find current primary contact in the organization
  const currentPrimaryContact = usersStore.users.find((u) => u.primary_contact)

  // If the logged-in user is currently primary, unset them
  const orgIdFromQuery =
    route.query?.org || route.query?.org_id ? String(route.query?.org || route.query?.org_id) : null
  if (profileStore.userProfile.primary_contact) {
    await usersStore.editUser(
      profileStore.userProfile.user_id,
      { primary_contact: false },
      true,
      orgIdFromQuery,
    )
  }
  // If another user is primary, unset them
  else if (currentPrimaryContact && currentPrimaryContact.user_id !== userForm.user_id) {
    await usersStore.editUser(
      currentPrimaryContact.user_id,
      { primary_contact: false },
      true,
      orgIdFromQuery,
    )
  }

  // Optionally refresh profile or users list
  await usersStore.fetchUsers()
  await profileStore.fetchUserProfile()
}

const saveUser = async () => {
  if (!validatePhoneField()) {
    return
  }

  const phoneData = phoneRef.value?.phoneData
  const phoneNumberWithCountryCode = phoneData?.number || userForm.phone || ''

  const payload: any = {
    user_id: userForm.user_id,
    name: userForm.name,
    email: userForm.email,
    contact_number: phoneNumberWithCountryCode,
    role_id: Number(userForm.role_id), // Ensure role_id is sent as number to API
    primary_contact: userForm.primaryContact || false,
    status: userForm.isActive ? 'active' : 'inactive',
  }

  // 🔑 Include departments for both USER (2) and DEPARTMENT ADMIN (3) roles
  if (
    userForm.role_id === 2 ||
    userForm.role_id === 3 ||
    String(userForm.role_id) === '2' ||
    String(userForm.role_id) === '3'
  ) {
    payload.departments = userForm.departments || []
  }

  // Set appropriate loading flag to prevent duplicate submissions
  if (isEditMode.value) {
    updatingUser.value = true
  } else {
    addingUser.value = true
  }

  try {
    let result

    if (isEditMode.value && userForm.primaryContact) {
      await handlePrimaryContactUpdate()
    }

    const orgIdFromQuery =
      route?.query?.org || route?.query?.org_id
        ? String(route.query?.org || route.query?.org_id)
        : null

    if (!isEditMode.value && authUser.value?.role_id === 0 && orgIdFromQuery) {
      // Superadmin creating for selected org — include org_id in payload
      payload['org_id'] = orgIdFromQuery
    }

    if (isEditMode.value && userForm.user_id) {
      const orgIdFromQuery =
        route?.query?.org || route?.query?.org_id
          ? String(route.query?.org || route.query?.org_id)
          : null
      result = await usersStore.editUser(userForm.user_id, payload, false, orgIdFromQuery)
    } else {
      result = await usersStore.createUser(payload)
    }

    if (!result?.success) {
      // show a user-friendly error message from the store
      return
    }

    showUserModal.value = false
    await loadUsers()
  } catch (err) {
    console.error('Unexpected error saving user:', err)
  } finally {
    // reset both flags to be safe
    updatingUser.value = false
    addingUser.value = false
  }
}

// Reset form function
const resetUserForm = () => {
  userForm.user_id = ''
  userForm.name = ''
  userForm.email = ''
  userForm.phone = ''
  userForm.role_id = 2
  userForm.primaryContact = false
  userForm.isActive = true
  userForm.departments = []

  // Reset phone component
  if (phoneRef.value && phoneRef.value.resetPhoneField) {
    phoneRef.value.resetPhoneField()
  }
  phoneValidation.value = { status: true, message: '' }
}

// Unified modal open functions
const openAddUserModal = () => {
  isEditMode.value = false
  resetUserForm()

  // 🔑 For Department Admin: force role to USER (2)
  if (isDepartmentAdmin.value) {
    userForm.role_id = 2
  }

  // Ensure role_id is a string for USelect
  if (userForm.role_id !== undefined && userForm.role_id !== null) {
    userForm.role_id = String(userForm.role_id)
  }

  showUserModal.value = true
}

const openEditUserModal = async (user: any) => {
  isEditMode.value = true

  // Load user's departments if they're a Department Admin
  let userDepartments: string[] = []

  Object.assign(userForm, {
    user_id: user.id,
    name: user.name,
    email: user.email,
    role_id: String(user.role_id), // Convert to string to match USelect option values
    phone: user.phone,
    primaryContact: user.primaryContact || false,
    isActive: user.status === 'active',
    departments: user.rawDepartmentIds || [],
  })

  showUserModal.value = true
}

const closeUserModal = () => {
  showUserModal.value = false
}

// Delete user
const confirmDelete = async () => {
  if (!selectedUser.value) return
  deletingUser.value = true
  try {
    await usersStore.deleteUser(selectedUser.value.id)
    await loadUsers()
    showDeleteUserModal.value = false
  } catch (err: any) {
    console.error('Error deactivating user:', err)
    error.value = usersStore.getUserError || 'Failed to deactivate user'
  } finally {
    deletingUser.value = false
  }
}

// User actions
const editUser = (user: MappedUser) => {
  // 🔑 Prevent Department Admin from editing users outside their department
  if (!canEditUser(user)) {
    showError('You can only edit users in your departments')
    return
  }
  openEditUserModal(user)
}

const deleteUser = (user: MappedUser) => {
  selectedUser.value = user
  showDeleteUserModal.value = true
}

// Toggle active/inactive status for a user (replaces delete action)
const toggleActive = async (user: MappedUser) => {
  try {
    const result = await usersStore.setUserActive(user.id, !user.isActive)
    if (result?.success) {
      // Update local usersList state for immediate UI feedback
      const idx = usersList.value.findIndex((u) => u.id === user.id)
      if (idx !== -1) {
        const current = usersList.value[idx]
        const newActive = !current.isActive
        usersList.value[idx] = {
          ...current,
          isActive: newActive,
          status: newActive ? 'active' : 'inactive',
        }
      }
      // NOTE: success notification is handled by the store. Do not show duplicate toasts here.
    } else {
      showError(result?.message || 'Failed to update user status')
    }
  } catch (err: any) {
    console.error('Toggle active error', err)
    showError('Failed to update user status')
  }
}

const showToggleConfirm = (user: MappedUser) => {
  selectedUser.value = user
  showToggleConfirmModal.value = true
}

const confirmToggleActive = async () => {
  if (!selectedUser.value) return
  try {
    togglingUser.value = true
    // Use the toggleActive helper to perform the action and update local state
    await toggleActive(selectedUser.value)
    showToggleConfirmModal.value = false
  } finally {
    togglingUser.value = false
  }
}

// Handle Primary Contact Toggle
const handlePrimaryContactToggle = () => {
  if (userForm.primaryContact) return // already primary

  const currentPrimaryContact = usersStore.users.find((u) => u.primary_contact)
  let message = `Setting this user as Primary Contact! Do you want to continue?`

  if (profileStore.userProfile.primary_contact) {
    message = `Setting this user as Primary Contact will remove YOU from being Primary Contact. Do you want to continue?`
  } else if (currentPrimaryContact?.user_id !== userForm.user_id) {
    message = `Setting this user as Primary Contact will remove "${currentPrimaryContact.name}" from being Primary Contact. Do you want to continue?`
  }

  isPrimaryContactConfirming.value = true
  pendingPrimaryContactChange.value = true
  primaryContactConfirmMessage.value = message
  showPrimaryContactConfirm.value = true
}

//CSV Template

const downloadCsv = async () => {
  try {
    // Directly get the blob from the store method
    const blob = await profileStore.downloadTemplate()

    if (!blob || blob.size === 0) {
      throw new Error('Received empty or invalid Blob.')
    }

    // Ensure the Blob is of type CSV
    if (blob.type !== 'text/csv') {
      throw new Error('Unexpected Blob type: ' + blob.type)
    }

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'users_template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    window.URL.revokeObjectURL(url)

    showSuccess('CSV template downloaded successfully.')
  } catch (error) {
    showError(`Failed to download CSV template: ${error.message}`)
  }
}

const canBulkAssignUser = (row: MappedUser) => {
  const myRole = authUser.value?.role_id

  // Super Admin / Admin → can assign to dept admins + users
  if (myRole === 0 || myRole === 1) {
    return row.role_id === 2 || row.role_id === 3
  }

  // Department Admin → users only
  if (myRole === 3) {
    return row.role_id === 2
  }

  return false
}

const getBulkAssignDisabledReason = (row: MappedUser) => {
  const myRole = authUser.value?.role_id

  if (myRole === 3 && row.role_id === 3) {
    return 'Department Admins cannot assign departments to other Department Admins'
  }

  if (myRole === 3 && row.role_id === 1) {
    return 'Department Admins cannot assign departments to Admins'
  }

  if ((myRole === 0 || myRole === 1) && row.role_id === 1) {
    return 'Admins cannot bulk-assign other Admins'
  }

  return 'Not allowed'
}

// Bulk assignment methods
const toggleUserSelection = (userId: string) => {
  const user = usersList.value.find((u) => u.id === userId)
  if (!user) return

  if (!canBulkAssignUser(user)) return

  if (selectedUsers.value.has(userId)) {
    selectedUsers.value.delete(userId)
  } else {
    selectedUsers.value.add(userId)
  }
}

const selectAllUsers = () => {
  const selectable = paginatedUsers.value.filter(canBulkAssignUser)

  if (!selectable.length) return

  const allSelected = selectable.every((u) => selectedUsers.value.has(u.id))

  if (allSelected) {
    selectable.forEach((u) => selectedUsers.value.delete(u.id))
  } else {
    selectable.forEach((u) => selectedUsers.value.add(u.id))
  }
}

const openBulkAssignmentModal = (mode: 'assign' | 'unassign') => {
  if (selectedUsers.value.size === 0) {
    showError('Please select at least one user')
    return
  }
  bulkActionMode.value = mode
  selectedBulkDepartments.value = []
  showBulkAssignmentModal.value = true
}

const executeBulkAssignment = async () => {
  if (selectedBulkDepartments.value.length === 0) {
    showError(`Please select at least one department to ${bulkActionMode.value}`)
    return
  }

  bulkAssignmentLoading.value = true
  try {
    const userIdArray = Array.from(selectedUsers.value)

    if (bulkActionMode.value === 'assign') {
      await usersStore.bulkAssignDepartments(userIdArray, selectedBulkDepartments.value)
    } else {
      await usersStore.bulkUnassignDepartments(userIdArray, selectedBulkDepartments.value)
    }

    // Clear selection and close modal
    selectedUsers.value.clear()
    selectedBulkDepartments.value = []
    showBulkAssignmentModal.value = false
    // showSuccess(`Successfully ${bulkActionMode.value}ed ${userIdArray.length} user(s)`)

    // Refresh users list
    await loadUsers()
  } catch (error: any) {
    // showError(error.message || `Failed to ${bulkActionMode.value} departments`)
  } finally {
    bulkAssignmentLoading.value = false
  }
}

const toggleBulkDepartment = (deptId: string) => {
  if (selectedBulkDepartments.value.includes(deptId)) {
    selectedBulkDepartments.value = selectedBulkDepartments.value.filter((d) => d !== deptId)
  } else {
    selectedBulkDepartments.value.push(deptId)
  }
}

const closeBulkAssignmentModal = () => {
  showBulkAssignmentModal.value = false
  selectedBulkDepartments.value = []
}

//Upload

const selectedFile = ref(null)
const userPreview = ref([])
const showPreview = ref(false)
const errors = ref([])
const fileInput = ref(null)
const isViewMode = ref(true)
const previewData = ref([])
const showForm2 = ref(false)
const viewContent = ref('')
// Validation in progress flag
const validating = ref(false)

const openBulkUplaod = () => {
  showForm2.value = true
}

const triggerFileInput = () => {
  fileInput.value?.click() // Trigger file input dialog when clicked
}

const handleFileInput = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  validateFile(file)
}

const handleFileDrop = (event: DragEvent) => {
  event.preventDefault()
  const file = event.dataTransfer?.files?.[0]
  validateFile(file)
}

const validateFile = (file?: File) => {
  if (!file) {
    showError('No file selected.')
    return
  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  const type = file.type.toLowerCase()

  if (!(ext === 'csv' || type.includes('csv'))) {
    showInlineError('Invalid file type. Only CSV is allowed.')
    return
  }

  selectedFile.value = file
  openPreview(file)
}

// Show inline error summary and toast
const showInlineError = (msg: string) => {
  errors.value = [{ errorMessage: msg }]
  // Ensure modal is visible so user sees the inline summary
  showForm2.value = true
  showPreview.value = false
  isViewMode.value = false
  // Re-render previewData without highlights if available
  if (previewData.value && previewData.value.length) {
    viewContent.value = renderCSVToHTML(previewData.value)
  } else {
    viewContent.value = ''
  }

  // Use available notification helper(s)
  try {
    if (typeof showError === 'function') showError(msg)
  } catch (e) {}
}

// Helper to show multiple error toasts sequentially
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms))
const hideInline = ref(false)
const showErrorsSequentially = async (messages: string[], perMs = 3500) => {
  if (!messages || !messages.length) return
  // Show modal context
  showForm2.value = true
  // Hide inline banner while showing sequential toasts
  hideInline.value = true

  for (let i = 0; i < messages.length; i++) {
    try {
      showError(messages[i], { duration: perMs })
    } catch (e) {}
    // wait before showing next
    // eslint-disable-next-line no-await-in-loop
    await sleep(perMs + 200)
  }
}

const openPreview = async (file: File) => {
  // Reset errors array
  errors.value = []
  try {
    const parsedData: any[] = await new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => resolve(result.data),
        error: (err) => reject(err.message),
      })
    })

    if (!parsedData || parsedData.length === 0) {
      throw new Error('The uploaded CSV file is empty. Please upload a file with user data.')
    }

    // Render the data into a preview and display it
    previewData.value = parsedData
    showPreview.value = true
    showForm2.value = true

    // Call validation API
    validating.value = true
    const route = useRoute()
    const orgIdFromQuery =
      route?.query?.org || route?.query?.org_id
        ? String(route.query?.org || route.query?.org_id)
        : null
    const validationResponse = await usersStore.uploadAndValidateJson(
      parsedData as any,
      orgIdFromQuery,
    )

    if (validationResponse.errors && validationResponse.errors.length > 0) {
      errors.value = validationResponse.errors.map(
        (error: { rowNumber: number; invalidFields: any[] }) => ({
          errorMessage: `Row: ${error.rowNumber} - ${error.invalidFields
            .map((field: { field: any; message: any }) => `${field.field}: ${field.message}`)
            .join(', ')}`,
          rowIndex: error.rowNumber - 1,
          invalidFields: error.invalidFields,
        }),
      )

      // Group errors by row so we don't repeat 'Row X' for every field
      const grouped: Record<number, string[]> = {}
      validationResponse.errors.forEach((error: { rowNumber: number; invalidFields: any[] }) => {
        const row = error.rowNumber
        grouped[row] = grouped[row] || []
        error.invalidFields.forEach((field: { field: any; message: any }) => {
          grouped[row].push(`${field.field}: ${field.message}`)
        })
      })

      // Build concatenated message with each message on a new line and rows grouped
      const rowKeys = Object.keys(grouped)
        .map((k) => Number(k))
        .sort((a, b) => a - b)

      // Build per-row blocks where each field appears on a new line.
      // Between rows, insert two new lines (i.e., one blank line) as requested.
      const rowBlocks: string[] = []
      rowKeys.forEach((row) => {
        const fields = grouped[row]
        if (!fields || !fields.length) return

        // Compose block: Row X:\nfield1\nfield2...
        const block = `Row ${row}:\n${fields.join('\n')}`
        rowBlocks.push(block)
      })

      // Join rows with two newlines between them
      const concatenated = rowBlocks.join('\n\n')
      // duration based on number of lines, capped
      const duration = Math.min(20000, rowBlocks.length * 2500)

      // Show single toast with concatenated message
      try {
        showError(concatenated, { duration })
      } catch (e) {}

      const errorRows = validationResponse.errors.map(
        (error: { rowNumber: number }) => error.rowNumber - 1,
      )

      const errorMessages: Record<number, { field: string; message: string }[]> = {}
      validationResponse.errors.forEach((error: { rowNumber: number; invalidFields: any[] }) => {
        errorMessages[error.rowNumber - 1] = error.invalidFields.map(
          (field: { field: any; message: any }) => ({
            field: field.field,
            message: field.message,
          }),
        )
      })

      viewContent.value = renderCSVToHTML(parsedData, errorRows, errorMessages)
      showForm2.value = true
      showPreview.value = true
      isViewMode.value = true
    } else {
      userPreview.value = validationResponse?.data
      isViewMode.value = false
      showForm2.value = true
      viewContent.value = renderCSVToHTML(parsedData)
    }
  } catch (error: any) {
    const errorMsg =
      error.message === 'The uploaded CSV file is empty. Please upload a file with user data.'
        ? error.message
        : 'An error occurred while validating the file. Please check your CSV and try again.'

    showInlineError(errorMsg)
    errors.value = [
      {
        errorMessage: errorMsg,
      },
    ]
    showPreview.value = false // don’t show preview for errors
    isViewMode.value = false
    viewContent.value = renderCSVToHTML(previewData.value)
  } finally {
    validating.value = false
  }
}

const handleUpload = async () => {
  if (!selectedFile.value) {
    showInlineError('Please select a file to upload.')
    return
  }
  if (errors.value.length > 0) {
    showInlineError('Please fix the errors before uploading.')
    return
  }
  if (!previewData.value.length) {
    showInlineError('No data to upload.')
    return
  }
  const route = useRoute()
  const orgIdFromQuery =
    route?.query?.org || route?.query?.org_id
      ? String(route.query?.org || route.query?.org_id)
      : null
  await usersStore.createBulkUsers(previewData.value as any, orgIdFromQuery)
  closePreviewForm()
  await loadUsers()
}

// Render CSV preview with error highlighting
const renderCSVToHTML = (
  parsedData: any[],
  errorRows: number[] = [],
  errorMessages: Record<number, { field: string; message: string }[]> = {},
) => {
  if (!parsedData.length) return '<p>No data available to display.</p>'
  const headers = Object.keys(parsedData[0])
  let tableHTML = `
    <div style="max-height: calc(100vh - 220px); overflow-y: auto;">
      <table class="table-auto border-collapse border border-gray-300 w-full">
        <thead><tr>`
  headers.forEach((h) => {
    tableHTML += `<th class="border border-gray-300 p-2">${h}</th>`
  })
  tableHTML += `</tr></thead><tbody>`

  parsedData.forEach((row, i) => {
    tableHTML += `<tr>`
    headers.forEach((h) => {
      const errorForField = errorMessages[i]?.find((e) => e.field === h)
      const cellClass = errorForField ? 'bg-red-300 relative group' : ''
      const tooltip = errorForField
        ? `<div class="absolute left-0 top-0 mt-[-4px] ml-[-4px] w-max bg-gray-700 text-white text-xs rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
             ${errorForField.message}
           </div>`
        : ''
      const value = row[h] || '&nbsp;'
      tableHTML += `<td class="border border-gray-300 p-2 ${cellClass}">
          <div class="relative group">${value}${tooltip}</div>
        </td>`
    })
    tableHTML += `</tr>`
  })
  tableHTML += `</tbody></table></div>`
  return tableHTML
}

const closePreviewForm = () => {
  showForm2.value = false
  selectedFile.value = null
  previewData.value = []
  viewContent.value = ''
  errors.value = []
  hideInline.value = false
}

// Polling controls
const pollInterval = ref<number | null>(null)

// Lifecycle
onMounted(async () => {
  loading.value = true
  error.value = null

  try {
    const orgId =
      route.query?.org || route.query?.org_id
        ? String(route.query?.org || route.query?.org_id)
        : null

    // 1️⃣ Load dependencies FIRST
    await Promise.all([usersStore.fetchRoles(), loadDepartments(), loadAllDepartmentsForDisplay()])

    // 2️⃣ Load users AFTER departments exist
    await loadUsers(true)

    // integrations can be parallel
    integrationsStore.fetchOverview(orgId, false, false).catch(() => {})
  } finally {
    loading.value = false
  }

  pollInterval.value = window.setInterval(() => {
    loadUsers(false).catch(() => {})
  }, 30000)
})

onBeforeUnmount(() => {
  if (pollInterval.value) {
    clearInterval(pollInterval.value)
    pollInterval.value = null
  }
})

useHead({
  title: 'User Management - Admin Dashboard - provento.ai',
})
</script>

<style scoped>
:deep(.custom-input) {
  background-color: #1e293b !important;
  color: #e2e8f0 !important;
  font-size: 0.875rem !important;
  padding: 0.875rem 2.5rem !important;
  transition: all 0.2s ease-in-out !important;
  width: 100% !important;
  border-radius: 0.5rem !important;
}

:deep(.custom-input:hover) {
  background-color: #1e293b !important;
}

:deep(.custom-input:focus) {
  background-color: #1e293b !important;
  outline: none !important;
}

:deep(.custom-input::placeholder) {
  color: #64748b !important;
}

/* Custom select styles - no border styling to allow UForm errors */
:deep(.custom-select) {
  background-color: #1e293b !important;
  color: #e2e8f0 !important;
  font-size: 0.875rem !important;
  padding: 0.875rem 2.5rem !important;
  transition: all 0.2s ease-in-out !important;
  width: 100% !important;
  cursor: pointer;
  border-radius: 0.5rem !important;
}

:deep(.custom-select:hover) {
  background-color: #1e293b !important;
}

:deep(.custom-select:focus) {
  background-color: #1e293b !important;
  outline: none !important;
}

/* Custom styling for vue3-tel-input to match the design */
:deep(.vue-tel-input) {
  border: 1px solid #334155;
  border-radius: 0.5rem;
  background-color: #1e293b;
  transition: all 0.2s ease-in-out;
  box-shadow: none;
  position: relative;
  overflow: visible;
}

:deep(.vue-tel-input:hover) {
  border-color: #475569;
  background-color: #1e293b;
}

:deep(.vue-tel-input:focus-within) {
  border-color: #3b82f6;
  background-color: #1e293b;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

:deep(.vue-tel-input .vti__dropdown) {
  background-color: #1e293b;
  border-right: 1px solid #334155;
  border-radius: 0.5rem 0 0 0.5rem;
}

:deep(.vue-tel-input .vti__dropdown:hover) {
  background-color: #1e293b;
}

:deep(.vue-tel-input .vti__dropdown-list) {
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

:deep(.vue-tel-input .vti__dropdown-item) {
  color: #e2e8f0;
  padding: 8px 12px;
}

:deep(.vue-tel-input .vti__dropdown-item:hover) {
  background-color: rgba(59, 130, 246, 0.1);
}

:deep(.vue-tel-input .vti__dropdown-item.highlighted) {
  background-color: rgba(59, 130, 246, 0.2);
}

:deep(.vue-tel-input .vti__selection) {
  color: #e2e8f0;
  font-size: 0.875rem;
}

:deep(.vue-tel-input .vti__input) {
  background-color: transparent !important;
  border: none !important;
  color: #e2e8f0 !important;
  font-size: 0.875rem;
  padding: 0.875rem 1rem !important;
}

:deep(.vue-tel-input .vti__input::placeholder) {
  color: #9ca3af;
}

:deep(.vue-tel-input .vti__input:focus) {
  outline: none !important;
  box-shadow: none !important;
}

:deep(.vue-tel-input .vti__dropdown-arrow) {
  color: #9ca3af;
}

/* Search box styling */
:deep(.vti__search-box) {
  background-color: rgba(31, 41, 55, 0.9) !important;
  border: 1px solid rgba(75, 85, 99, 0.7) !important;
  color: #f3f4f6 !important;
  border-radius: 0.5rem !important;
  margin: 8px !important;
  padding: 8px 12px !important;
  font-size: 14px !important;
  width: calc(100% - 16px) !important;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1) !important;
}

:deep(.vti__search-box::placeholder) {
  color: #9ca3af !important;
}

:deep(.vti__search-box:focus) {
  outline: none !important;
  border-color: #3b82f6 !important;
  background-color: rgba(37, 47, 63, 1) !important;
  box-shadow:
    0 0 0 2px rgba(59, 130, 246, 0.1),
    inset 0 1px 2px rgba(0, 0, 0, 0.1) !important;
}

/* Ensure dropdown list is properly positioned and sized */
:deep(.vue-tel-input .vti__dropdown-list) {
  background-color: rgba(17, 24, 39, 0.95) !important;
  border: 1px solid rgba(55, 65, 81, 0.6) !important;
  border-radius: 0.5rem !important;
  backdrop-filter: blur(10px) !important;
  max-height: 250px !important;
  overflow-y: auto !important;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3) !important;
  z-index: 50 !important;
}

select option {
  background-color: #1e293b;
  /* dark background */
  color: #e2e8f0;
  /* light text */
  padding: 10px;
}

/* Hover/selected states (for browsers that support it) */
select option:hover,
select option:checked {
  background-color: #3b82f6;
  /* blue */
  color: white;
}
</style>
