<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white mb-2">User Management</h1>
        <p class="text-gray-400">
          Manage user accounts, roles, and permissions across your organization.
        </p>
      </div>
      <div class="flex items-center space-x-3">
        <button
          class="bg-dark-800 hover:bg-dark-700 text-white px-4 py-2 rounded-lg border border-dark-700 transition-colors flex items-center space-x-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            ></path>
          </svg>
          <span>Bulk Upload</span>
        </button>
        <button
          @click="showAddUserModal = true"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            ></path>
          </svg>
          <span>Add User</span>
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Total Users -->
      <div class="bg-dark-800 rounded-lg p-6 border border-dark-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm font-medium">Total Users</p>
            <p class="text-3xl font-bold text-white mt-2">5</p>
          </div>
          <div class="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <svg
              class="w-6 h-6 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
              ></path>
            </svg>
          </div>
        </div>
      </div>

      <!-- Active Users -->
      <div class="bg-dark-800 rounded-lg p-6 border border-dark-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm font-medium">Active Users</p>
            <p class="text-3xl font-bold text-white mt-2">4</p>
          </div>
          <div class="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
            <svg
              class="w-6 h-6 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
        </div>
      </div>

      <!-- Admins -->
      <div class="bg-dark-800 rounded-lg p-6 border border-dark-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm font-medium">Admins</p>
            <p class="text-3xl font-bold text-white mt-2">1</p>
          </div>
          <div class="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <svg
              class="w-6 h-6 text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              ></path>
            </svg>
          </div>
        </div>
      </div>

      <!-- New This Month -->
      <div class="bg-dark-800 rounded-lg p-6 border border-dark-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm font-medium">New This Month</p>
            <p class="text-3xl font-bold text-white mt-2">0</p>
          </div>
          <div class="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
            <svg
              class="w-6 h-6 text-orange-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              ></path>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="bg-dark-800 rounded-lg p-6 border border-dark-700">
      <div class="flex flex-col sm:flex-row gap-4">
        <!-- Search Input -->
        <div class="flex-1">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                class="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
            </div>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search users..."
              class="block w-full pl-10 pr-3 py-3 border border-dark-700 rounded-lg bg-dark-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <!-- Role Filter -->
        <div class="sm:w-48">
          <select
            v-model="selectedRole"
            class="block w-full px-3 py-3 border border-dark-700 rounded-lg bg-dark-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="user">User</option>
          </select>
        </div>

        <!-- Status Filter -->
        <div class="sm:w-48">
          <select
            v-model="selectedStatus"
            class="block w-full px-3 py-3 border border-dark-700 rounded-lg bg-dark-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Users Table -->
    <div class="bg-dark-800 rounded-lg border border-dark-700 overflow-hidden">
      <!-- Table Header -->
      <div class="px-6 py-4 border-b border-dark-700">
        <h2 class="text-lg font-semibold text-white">All Users</h2>
        <p class="text-gray-400 text-sm">
          A list of all users in your organization including their contact information and roles.
        </p>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-dark-900">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
              >
                User
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
              >
                Contact
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
              >
                Role
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
              >
                Last Active
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
              >
                Created
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
              >
                Tokens Used
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-dark-700">
            <tr
              v-for="user in filteredUsers"
              :key="user.id"
              class="hover:bg-dark-700/50 transition-colors"
            >
              <!-- User -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div
                    class="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center"
                  >
                    <span class="text-blue-400 font-medium text-sm">{{ user.initials }}</span>
                  </div>
                  <div class="ml-3">
                    <div class="text-sm font-medium text-white">{{ user.name }}</div>
                    <div class="text-sm text-gray-400">{{ user.username }}</div>
                  </div>
                </div>
              </td>

              <!-- Contact -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-white">{{ user.email }}</div>
                <div class="text-sm text-gray-400">{{ user.phone }}</div>
              </td>

              <!-- Role -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex px-2 py-1 text-xs font-medium rounded-full"
                  :class="{
                    'bg-purple-500/20 text-purple-400': user.role === 'admin',
                    'bg-blue-500/20 text-blue-400': user.role === 'manager',
                    'bg-gray-500/20 text-gray-400': user.role === 'user',
                  }"
                >
                  {{ user.role }}
                </span>
              </td>

              <!-- Status -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full"
                  :class="{
                    'bg-green-500/20 text-green-400': user.status === 'active',
                    'bg-red-500/20 text-red-400': user.status === 'inactive',
                  }"
                >
                  <div
                    class="w-1.5 h-1.5 rounded-full mr-1"
                    :class="{
                      'bg-green-400': user.status === 'active',
                      'bg-red-400': user.status === 'inactive',
                    }"
                  ></div>
                  {{ user.status }}
                </span>
              </td>

              <!-- Last Active -->
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {{ user.lastActive }}
              </td>

              <!-- Created -->
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {{ user.created }}
              </td>

              <!-- Tokens Used -->
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {{ user.tokensUsed?.toLocaleString() }}
              </td>

              <!-- Actions -->
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center space-x-2">
                  <button
                    @click="editUser(user)"
                    class="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      ></path>
                    </svg>
                  </button>
                  <button
                    @click="deleteUser(user)"
                    class="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      ></path>
                    </svg>
                  </button>
                  <button
                    @click="toggleActions(user.id)"
                    class="text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                      ></path>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add User Modal -->
    <div
      v-if="showAddUserModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div class="bg-dark-800 rounded-lg border border-dark-700 p-6 w-full max-w-md mx-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-white">Add New User</h3>
          <button @click="showAddUserModal = false" class="text-gray-400 hover:text-white">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        <form @submit.prevent="addUser" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Name</label>
            <input
              v-model="newUser.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-dark-700 rounded-lg bg-dark-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              v-model="newUser.email"
              type="email"
              required
              class="w-full px-3 py-2 border border-dark-700 rounded-lg bg-dark-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Role</label>
            <select
              v-model="newUser.role"
              required
              class="w-full px-3 py-2 border border-dark-700 rounded-lg bg-dark-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Role</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="user">User</option>
            </select>
          </div>

          <div class="flex space-x-3 pt-4">
            <button
              type="submit"
              class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Add User
            </button>
            <button
              type="button"
              @click="showAddUserModal = false"
              class="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Using admin layout
definePageMeta({
  layout: 'admin',
})

// Reactive data
const searchQuery = ref('')
const selectedRole = ref('')
const selectedStatus = ref('')
const showAddUserModal = ref(false)

const newUser = ref({
  name: '',
  email: '',
  role: '',
})

// Sample users data
const users = ref([
  {
    id: 1,
    name: 'Sarah Johnson',
    username: 'sarah@company.com',
    email: 'sarah@company.com',
    phone: '+1 (555) 234-5678',
    role: 'admin',
    status: 'active',
    lastActive: '2 hours ago',
    created: '1/15/2024',
    tokensUsed: 15420,
    initials: 'SJ',
  },
  {
    id: 2,
    name: 'Mike Chen',
    username: 'mike@company.com',
    email: 'mike@company.com',
    phone: '+1 (555) 234-5678',
    role: 'user',
    status: 'active',
    lastActive: '1 day ago',
    created: '1/10/2024',
    tokensUsed: 12390,
    initials: 'MC',
  },
  {
    id: 3,
    name: 'Emily Davis',
    username: 'emily@company.com',
    email: 'emily@company.com',
    phone: '+1 (555) 234-5678',
    role: 'manager',
    status: 'inactive',
    lastActive: '7 days ago',
    created: '1/8/2024',
    tokensUsed: 9800,
    initials: 'ED',
  },
  {
    id: 4,
    name: 'Alex Rodriguez',
    username: 'alex@company.com',
    email: 'alex@company.com',
    phone: '+1 (555) 456-7890',
    role: 'user',
    status: 'active',
    lastActive: '5 minutes ago',
    created: '1/20/2024',
    tokensUsed: 8600,
    initials: 'AR',
  },
  {
    id: 5,
    name: 'Lisa Wong',
    username: 'lisa@company.com',
    email: 'lisa@company.com',
    phone: '+1 (555) 456-7890',
    role: 'manager',
    status: 'active',
    lastActive: '3 hours ago',
    created: '1/12/2024',
    tokensUsed: 7200,
    initials: 'LW',
  },
])

// Computed filtered users
const filteredUsers = computed(() => {
  return users.value.filter((user) => {
    const matchesSearch =
      !searchQuery.value ||
      user.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesRole = !selectedRole.value || user.role === selectedRole.value
    const matchesStatus = !selectedStatus.value || user.status === selectedStatus.value

    return matchesSearch && matchesRole && matchesStatus
  })
})

// Methods
const editUser = (user: any) => {
  console.log('Edit user:', user)
  // Implement edit functionality
}

const deleteUser = (user: any) => {
  if (confirm(`Are you sure you want to delete ${user.name}?`)) {
    const index = users.value.findIndex((u) => u.id === user.id)
    if (index > -1) {
      users.value.splice(index, 1)
    }
  }
}

const toggleActions = (userId: number) => {
  console.log('Toggle actions for user:', userId)
  // Implement actions menu
}

const addUser = () => {
  const user = {
    id: users.value.length + 1,
    name: newUser.value.name,
    username: newUser.value.email,
    email: newUser.value.email,
    phone: '+1 (555) 234-5678',
    role: newUser.value.role,
    status: 'active',
    lastActive: 'Just now',
    created: new Date().toLocaleDateString(),
    tokensUsed: 0,
    initials: newUser.value.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase(),
  }

  users.value.push(user)
  showAddUserModal.value = false

  // Reset form
  newUser.value = {
    name: '',
    email: '',
    role: '',
  }
}

useHead({
  title: 'User Management - Admin Dashboard',
})
</script>
