<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white mb-2">Document Management</h1>
        <p class="text-gray-400">
          Upload, organize, and manage documents for AI processing and chat capabilities.
        </p>
      </div>
      <div>
        <button
          @click="showUploadModal = true"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            ></path>
          </svg>
          <span>Upload Document</span>
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Total Documents -->
      <div class="bg-dark-800 rounded-lg p-6 border border-dark-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm font-medium">Total Documents</p>
            <p class="text-3xl font-bold text-white mt-2">{{ totalDocuments }}</p>
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              ></path>
            </svg>
          </div>
        </div>
      </div>

      <!-- Processed -->
      <div class="bg-dark-800 rounded-lg p-6 border border-dark-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm font-medium">Processed</p>
            <p class="text-3xl font-bold text-white mt-2">{{ processedDocuments }}</p>
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

      <!-- Categories -->
      <div class="bg-dark-800 rounded-lg p-6 border border-dark-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm font-medium">Categories</p>
            <p class="text-3xl font-bold text-white mt-2">{{ totalCategories }}</p>
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
                d="M7 7h10l4 12H3l4-12z"
              ></path>
            </svg>
          </div>
        </div>
      </div>

      <!-- Total Size -->
      <div class="bg-dark-800 rounded-lg p-6 border border-dark-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm font-medium">Total Size</p>
            <p class="text-3xl font-bold text-white mt-2">{{ totalSize }}</p>
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
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
              ></path>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="bg-dark-800 rounded-lg p-6 border border-dark-700">
      <div class="flex flex-col lg:flex-row gap-4">
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
              placeholder="Search documents..."
              class="block w-full pl-10 pr-3 py-3 border border-dark-700 rounded-lg bg-dark-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <!-- Category Filter -->
        <div class="lg:w-48">
          <select
            v-model="selectedCategory"
            class="block w-full px-3 py-3 border border-dark-700 rounded-lg bg-dark-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">All Categories</option>
            <option value="HR Policy">HR Policy</option>
            <option value="Financial">Financial</option>
            <option value="Technical">Technical</option>
            <option value="Analytics">Analytics</option>
          </select>
        </div>

        <!-- Type Filter -->
        <div class="lg:w-48">
          <select
            v-model="selectedType"
            class="block w-full px-3 py-3 border border-dark-700 rounded-lg bg-dark-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">All Types</option>
            <option value="PDF">PDF</option>
            <option value="Word">Word</option>
            <option value="Markdown">Markdown</option>
            <option value="CSV">CSV</option>
          </select>
        </div>

        <!-- Status Filter -->
        <div class="lg:w-48">
          <select
            v-model="selectedStatus"
            class="block w-full px-3 py-3 border border-dark-700 rounded-lg bg-dark-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">All Status</option>
            <option value="processed">Processed</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Documents Table -->
    <div class="bg-dark-800 rounded-lg border border-dark-700 overflow-hidden">
      <!-- Table Header -->
      <div class="px-6 py-4 border-b border-dark-700">
        <h2 class="text-lg font-semibold text-white">All Documents</h2>
        <p class="text-gray-400 text-sm">
          Manage your uploaded documents and view their processing status and AI-generated
          summaries.
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
                Document
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
              >
                Category
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
              >
                Type & Size
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
              >
                Uploaded By
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
              >
                Date
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
              v-for="document in filteredDocuments"
              :key="document.id"
              class="hover:bg-dark-700/50 transition-colors"
            >
              <!-- Document -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <svg
                      class="w-5 h-5 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      ></path>
                    </svg>
                  </div>
                  <div class="ml-3">
                    <div class="text-sm font-medium text-white">{{ document.name }}</div>
                    <div class="text-sm text-gray-400">{{ document.description }}</div>
                  </div>
                </div>
              </td>

              <!-- Category -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex px-2 py-1 text-xs font-medium rounded-full"
                  :class="getCategoryColor(document.category)"
                >
                  {{ document.category }}
                </span>
              </td>

              <!-- Type & Size -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-white">{{ document.type }}</div>
                <div class="text-sm text-gray-400">{{ document.size }}</div>
              </td>

              <!-- Status -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full"
                  :class="getStatusColor(document.status)"
                >
                  <div
                    class="w-1.5 h-1.5 rounded-full mr-1"
                    :class="getStatusDotColor(document.status)"
                  ></div>
                  {{ document.status }}
                </span>
              </td>

              <!-- Uploaded By -->
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {{ document.uploadedBy }}
              </td>

              <!-- Date -->
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {{ document.date }}
              </td>

              <!-- Actions -->
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center space-x-2">
                  <button
                    @click="viewDocument(document)"
                    class="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      ></path>
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      ></path>
                    </svg>
                  </button>
                  <button
                    @click="downloadDocument(document)"
                    class="text-green-400 hover:text-green-300 transition-colors"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      ></path>
                    </svg>
                  </button>
                  <button
                    @click="deleteDocument(document)"
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
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Upload Modal -->
    <div
      v-if="showUploadModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div class="bg-dark-800 rounded-lg border border-dark-700 p-6 w-full max-w-md mx-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-white">Upload Document</h3>
          <button @click="showUploadModal = false" class="text-gray-400 hover:text-white">
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

        <form @submit.prevent="uploadDocument" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">File</label>
            <input
              type="file"
              required
              class="w-full px-3 py-2 border border-dark-700 rounded-lg bg-dark-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Category</label>
            <select
              v-model="newDocument.category"
              required
              class="w-full px-3 py-2 border border-dark-700 rounded-lg bg-dark-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Category</option>
              <option value="HR Policy">HR Policy</option>
              <option value="Financial">Financial</option>
              <option value="Technical">Technical</option>
              <option value="Analytics">Analytics</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea
              v-model="newDocument.description"
              rows="3"
              class="w-full px-3 py-2 border border-dark-700 rounded-lg bg-dark-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of the document..."
            ></textarea>
          </div>

          <div class="flex space-x-3 pt-4">
            <button
              type="submit"
              class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Upload
            </button>
            <button
              type="button"
              @click="showUploadModal = false"
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
const selectedCategory = ref('')
const selectedType = ref('')
const selectedStatus = ref('')
const showUploadModal = ref(false)

const newDocument = ref({
  category: '',
  description: '',
})

// Sample documents data
const documents = ref([
  {
    id: 1,
    name: 'Employee Handbook 2024.pdf',
    description: 'Comprehensive guide to company policies',
    category: 'HR Policy',
    type: 'PDF',
    size: '2.3 MB',
    status: 'processed',
    uploadedBy: 'Sarah Johnson',
    date: '1/15/2024',
  },
  {
    id: 2,
    name: 'Q4 Financial Report.docx',
    description: 'Quarterly financial reports including revenue, expenses',
    category: 'Financial',
    type: 'Word',
    size: '1.6 MB',
    status: 'processing',
    uploadedBy: 'Mike Chen',
    date: '1/10/2024',
  },
  {
    id: 3,
    name: 'Product Specifications.md',
    description: 'Detailed technical specifications for the new product',
    category: 'Technical',
    type: 'Markdown',
    size: '512.0 kB',
    status: 'processed',
    uploadedBy: 'Emily Davis',
    date: '1/8/2024',
  },
  {
    id: 4,
    name: 'Customer Data.csv',
    description: 'Customer demographics and behavior analysis data',
    category: 'Analytics',
    type: 'CSV',
    size: '3.1 MB',
    status: 'processed',
    uploadedBy: 'Alex Rodriguez',
    date: '1/20/2024',
  },
])

// Computed properties
const totalDocuments = computed(() => documents.value.length)
const processedDocuments = computed(
  () => documents.value.filter((doc) => doc.status === 'processed').length,
)
const totalCategories = computed(() => {
  const categories = new Set(documents.value.map((doc) => doc.category))
  return categories.size
})
const totalSize = computed(() => '7.8 MB') // This would be calculated from actual file sizes

const filteredDocuments = computed(() => {
  return documents.value.filter((document) => {
    const matchesSearch =
      !searchQuery.value ||
      document.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      document.description.toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesCategory = !selectedCategory.value || document.category === selectedCategory.value
    const matchesType = !selectedType.value || document.type === selectedType.value
    const matchesStatus = !selectedStatus.value || document.status === selectedStatus.value

    return matchesSearch && matchesCategory && matchesType && matchesStatus
  })
})

// Methods
const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'HR Policy': 'bg-blue-500/20 text-blue-400',
    Financial: 'bg-green-500/20 text-green-400',
    Technical: 'bg-purple-500/20 text-purple-400',
    Analytics: 'bg-orange-500/20 text-orange-400',
  }
  return colors[category] || 'bg-gray-500/20 text-gray-400'
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    processed: 'bg-green-500/20 text-green-400',
    processing: 'bg-yellow-500/20 text-yellow-400',
    failed: 'bg-red-500/20 text-red-400',
  }
  return colors[status] || 'bg-gray-500/20 text-gray-400'
}

const getStatusDotColor = (status: string) => {
  const colors: Record<string, string> = {
    processed: 'bg-green-400',
    processing: 'bg-yellow-400',
    failed: 'bg-red-400',
  }
  return colors[status] || 'bg-gray-400'
}

const viewDocument = (document: any) => {
  console.log('View document:', document)
}

const downloadDocument = (document: any) => {
  console.log('Download document:', document)
}

const deleteDocument = (document: any) => {
  if (confirm(`Are you sure you want to delete ${document.name}?`)) {
    const index = documents.value.findIndex((d) => d.id === document.id)
    if (index > -1) {
      documents.value.splice(index, 1)
    }
  }
}

const uploadDocument = () => {
  console.log('Upload document:', newDocument.value)
  showUploadModal.value = false

  // Reset form
  newDocument.value = {
    category: '',
    description: '',
  }
}

useHead({
  title: 'Document Management - Admin Dashboard',
})
</script>
