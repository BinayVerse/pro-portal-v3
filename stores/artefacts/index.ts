import { defineStore } from 'pinia'
import type { ArtefactGoogleDriveFile, DocumentCategory } from './types'
import { handleError, handleSuccess, extractErrors } from '../../utils/apiHandler'
import { handleAuthError as handleAuthErrorShared } from '~/composables/useAuthError'

export const useArtefactsStore = defineStore('artefacts', {
  state: () => ({
    googleDriveFiles: [] as ArtefactGoogleDriveFile[],
    isLoadingGoogleDrive: false,
    isUploadingGoogleDrive: false,
    otherFilesCount: 0,
    // Document Categories
    categories: [] as DocumentCategory[],
    newCategory: null as DocumentCategory | null,
    isCategoryLoading: false,
    categoryError: null as string | null,
    // Artifacts list and stats
    artefacts: [] as any[],
    previousArtefacts: [] as any[], // Store previous state to detect changes
    stats: {
      totalArtefacts: 0,
      processedArtefacts: 0,
      totalCategories: 0,
      totalSizeBytes: 0,
      totalSize: '0 Bytes'
    },
    isLoadingArtefacts: false,
    artefactsError: null as string | null,
    // Auto-processing state
    pollingInterval: null as NodeJS.Timeout | null,
    isAutoProcessingEnabled: false,
    summarizingDocs: new Set<number>(),
    attemptedSummarizations: new Set<number>(),
    pollingIntervalMs: 10000, // Start with 10 seconds
    maxPollingIntervalMs: 60000, // Max 60 seconds
    minPollingIntervalMs: 5000, // Min 5 seconds
    // Departments
    departments: [] as any[],
    departmentsLoading: false,
    departmentsError: null as string | null,
    artefactDepartments: {} as Record<number, string[]>,
  }),

  getters: {
    // Category getters
    getCategories: (state): DocumentCategory[] => state.categories || [],
    getCategoryNames: (state): string[] => (state.categories || []).map(cat => cat?.name || '').filter(name => name),
    isCategoryLoadingState: (state): boolean => state.isCategoryLoading,
    getCategoryError: (state): string | null => state.categoryError,
    // Artifacts getters
    getArtefacts: (state): any[] => state.artefacts || [],
    getStats: (state) => state.stats || {
      totalArtefacts: 0,
      processedArtefacts: 0,
      totalCategories: 0,
      totalSizeBytes: 0,
      totalSize: '0 Bytes'
    },
    isArtefactsLoading: (state): boolean => state.isLoadingArtefacts,
    getArtefactsError: (state): string | null => state.artefactsError,
    // Auto-processing getters
    isAutoProcessingActive: (state): boolean => state.isAutoProcessingEnabled && !!state.pollingInterval,
    getSummarizingDocs: (state): Set<number> => state.summarizingDocs,
    isDocumentBeingSummarized: (state) => (docId: number): boolean => state.summarizingDocs.has(docId),
    pendingSummarizations: (state): any[] => {
      return (state.artefacts || []).filter(doc =>
        doc.status === 'processed' &&
        doc.summarized === 'No' &&
        !state.summarizingDocs.has(doc.id) &&
        !state.attemptedSummarizations.has(doc.id)
      )
    },
    allDocumentsProcessed: (state): boolean => {
      const unprocessedDocs = (state.artefacts || []).filter(doc => doc.status !== 'processed')
      return unprocessedDocs.length === 0
    },
    allDocumentsSummarized: (state): boolean => {
      const unsummarizedDocs = (state.artefacts || []).filter(doc =>
        doc.status === 'processed' && doc.summarized === 'No'
      )
      return unsummarizedDocs.length === 0
    },
    processingProgress: (state): { processed: number; total: number; percentage: number } => {
      const total = state.artefacts.length
      const processed = (state.artefacts || []).filter(doc =>
        doc.status === 'processed' && doc.summarized === 'Yes'
      ).length
      return {
        processed,
        total,
        percentage: total > 0 ? Math.round((processed / total) * 100) : 0
      }
    },
    getDepartments: (state) => state.departments,
    isDepartmentsLoading: (state) => state.departmentsLoading,
    getDepartmentsError: (state): string | null => state.departmentsError,
    getArtefactDepartments: (state) => state.artefactDepartments,
  },

  actions: {
    async fetchGoogleDriveFiles(folderUrl: string) {
      this.isLoadingGoogleDrive = true
      this.otherFilesCount = 0

      try {
        const data = await $fetch<{
          data: ArtefactGoogleDriveFile[]
          otherFiles: number
          message: string
        }>(`/api/artefacts/google-drive-fetch?folderUrl=${encodeURIComponent(folderUrl)}`, {
          method: 'GET',
        })

        this.googleDriveFiles = data.data || []
        this.otherFilesCount = data.otherFiles || 0

        return {
          success: true,
          files: this.googleDriveFiles,
          message: data.message || 'Files fetched successfully'
        }
      } catch (error: any) {
        this.googleDriveFiles = []
        return {
          success: false,
          files: [],
          message: handleError(error, 'Failed to fetch Google Drive files')
        }
      } finally {
        this.isLoadingGoogleDrive = false
      }
    },

    async uploadGoogleDriveFiles(selectedFiles: ArtefactGoogleDriveFile[], category: string, orgId?: string | null) {
      this.isUploadingGoogleDrive = true

      try {
        const token = localStorage.getItem('authToken')
        const url = orgId ? `/api/artefacts/google-drive?org=${encodeURIComponent(String(orgId))}` : '/api/artefacts/google-drive'

        const data = await $fetch(url, {
          method: 'POST',
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
          body: {
            selectedFileDetails: selectedFiles,
            category,
          },
        })

        return {
          success: true,
          files: (data as any).files || [],
          message: (data as any).message || 'Files uploaded successfully'
        }
      } catch (error: any) {
        // Handle authentication errors using shared handler
        if (await handleAuthErrorShared(error)) {
          throw new Error('Session expired. Please sign in again.')
        }

        return {
          success: false,
          files: [],
          message: handleError(error, 'Failed to upload Google Drive files', true)
        }
      } finally {
        this.isUploadingGoogleDrive = false
      }
    },

    // Upload Google Drive files with departments support
    async uploadGoogleDriveFilesWithDepartments(payload: { files: ArtefactGoogleDriveFile[]; category: string; departments: string[] }, orgId?: string | null) {
      this.isUploadingGoogleDrive = true

      try {
        const token = localStorage.getItem('authToken')
        const url = orgId ? `/api/artefacts/google-drive?org=${encodeURIComponent(String(orgId))}` : '/api/artefacts/google-drive'

        const data = await $fetch(url, {
          method: 'POST',
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
          body: {
            selectedFileDetails: payload.files,
            category: payload.category,
            departments: payload.departments, // 🔑 important - pass departments array
          },
        })

        return {
          success: true,
          files: (data as any).files || [],
          message: (data as any).message || 'Files uploaded successfully'
        }
      } catch (error: any) {
        // Handle authentication errors using shared handler
        if (await handleAuthErrorShared(error)) {
          throw new Error('Session expired. Please sign in again.')
        }

        return {
          success: false,
          files: [],
          message: handleError(error, 'Failed to upload Google Drive files', true)
        }
      } finally {
        this.isUploadingGoogleDrive = false
      }
    },

    clearGoogleDriveFiles() {
      this.googleDriveFiles = []
      this.otherFilesCount = 0
    },

    async uploadArtefact(formData: FormData, orgId?: string | null) {
      try {
        const token = process.client ? localStorage.getItem('authToken') : null
        if (!token) {
          throw new Error('Authentication required')
        }

        const url = orgId ? `/api/artefacts/upload?org=${encodeURIComponent(String(orgId))}` : '/api/artefacts/upload'

        const response = await $fetch<{
          statusCode: number
          status: string
          message: string
          data: any
        }>(url, {
          method: 'POST',
          body: formData,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.status === 'error') {
          throw new Error(response.message)
        }

        return {
          success: true,
          data: response.data,
          message: response.message
        }
      } catch (error: any) {
        // Handle authentication errors using shared handler
        if (await handleAuthErrorShared(error)) {
          throw new Error('Session expired. Please sign in again.')
        }

        return {
          success: false,
          data: null,
          message: handleError(error, 'Failed to upload artifact', true)
        }
      }
    },

    // Delegate to common handler
    handleError(error: any, fallbackMessage: string, silent: boolean = false): string {
      return handleError(error, fallbackMessage, silent)
    },

    // Helper methods for categories
    handleCategoryError(error: any, defaultMessage: string, silent: boolean = false): string {
      return handleError(error, defaultMessage, silent)
    },

    handleCategorySuccess(message: string): void {
      this.categoryError = null
      handleSuccess(message)
    },

    getAuthHeaders(extra: Record<string, string> = {}) {
      let token: string | null = null
      if (process.client) {
        token = localStorage.getItem('authToken')
      }
      if (!token) {
        const authCookie = useCookie('authToken')
        token = authCookie.value || null
      }

      return {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...extra,
      }
    },

    async handleAuthError(err: any): Promise<boolean> {
      return await handleAuthErrorShared(err)
    },

    // Category Actions
    async fetchCategories(orgId: string) {
      try {
        this.isCategoryLoading = true
        this.categoryError = null

        const { data } = await $fetch<{ data: DocumentCategory[] }>(
          `/api/artefacts/category/${orgId}`,
          {
            headers: this.getAuthHeaders(),
          }
        )

        this.categories = data || []
        this.newCategory = null
      } catch (error: any) {
        if (!await this.handleAuthError(error)) {
          this.categoryError = this.handleCategoryError(error, 'Failed to fetch categories')
        }
      } finally {
        this.isCategoryLoading = false
      }
    },

    async createCategory(categoryName: string, orgId: string) {
      try {
        this.isCategoryLoading = true
        this.categoryError = null

        const { data, message } = await $fetch<{ data: DocumentCategory; message: string }>(
          '/api/artefacts/category/add',
          {
            method: 'POST',
            body: { name: categoryName, org_id: orgId },
            headers: this.getAuthHeaders(),
          }
        )

        this.newCategory = data || null
        this.handleCategorySuccess(message || 'Category added successfully!')

        // Refresh the categories list
        await this.fetchCategories(orgId)
      } catch (error: any) {
        if (!await this.handleAuthError(error)) {
          this.categoryError = this.handleCategoryError(error, 'Error creating category')
        }
      } finally {
        this.isCategoryLoading = false
      }
    },

    async deleteCategory(categoryId: string, orgId: string) {
      try {
        this.isCategoryLoading = true
        this.categoryError = null

        await $fetch(`/api/artefacts/category/${categoryId}`, {
          method: 'DELETE',
          headers: this.getAuthHeaders(),
        })

        this.handleCategorySuccess('Category deleted successfully!')

        // Refresh the categories list
        await this.fetchCategories(orgId)
      } catch (error: any) {
        if (!await this.handleAuthError(error)) {
          this.categoryError = this.handleCategoryError(error, 'Error deleting category')
        }
      } finally {
        this.isCategoryLoading = false
      }
    },

    async getAllCategories() {
      try {
        this.isCategoryLoading = true
        this.categoryError = null

        const { data } = await $fetch<{ data: DocumentCategory[] }>(
          '/api/artefacts/category/all',
          {
            headers: this.getAuthHeaders(),
          }
        )

        this.categories = data || []
        return data || []
      } catch (error: any) {
        if (!await this.handleAuthError(error)) {
          this.categoryError = this.handleCategoryError(error, 'Failed to fetch categories')
        }
        return []
      } finally {
        this.isCategoryLoading = false
      }
    },

    // Clear methods
    clearCategories() {
      this.categories = []
      this.newCategory = null
      this.categoryError = null
    },

    clearCategoryError() {
      this.categoryError = null
    },

    // Artifacts Actions
    async fetchArtefacts(orgId?: string | null) {
      this.isLoadingArtefacts = true
      this.artefactsError = null
      const userTimezone = process.client ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC'

      try {
        const token = process.client ? localStorage.getItem('authToken') : null
        if (!token) {
          throw new Error('Authentication required')
        }

        // If no orgId provided, fall back to route query (useful for superadmin url-based selection)
        if (!orgId && process.client) {
          try {
            const route = useRoute()
            const q = route?.query?.org || route?.query?.org_id
            if (q && String(q).trim()) {
              orgId = String(q)
            }
          } catch (e) {
            // ignore
          }
        }

        let url = `/api/artefacts/list?timezone=${encodeURIComponent(userTimezone)}`
        if (orgId) {
          url += `&org=${encodeURIComponent(String(orgId))}`
        }

        const response = await $fetch<{
          statusCode: number
          status: string
          data: {
            artefacts: any[]
            stats: {
              totalArtefacts: number
              processedArtefacts: number
              totalCategories: number
              totalSizeBytes: number
              totalSize: string
            }
          }
          message: string
        }>(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.status === 'error') {
          throw new Error(response.message)
        }

        // Store previous state before updating
        const previousArtefacts = [...this.artefacts]

        this.artefacts = response.data.artefacts || []
        this.stats = response.data.stats || {
          totalArtefacts: 0,
          processedArtefacts: 0,
          totalCategories: 0,
          totalSizeBytes: 0,
          totalSize: '0 Bytes'
        }

        // Detect newly processed documents and auto-summarize them
        if (previousArtefacts.length > 0) {
          this.checkForNewlyProcessedDocuments(previousArtefacts, this.artefacts)
        }

        this.previousArtefacts = [...this.artefacts]

        return {
          success: true,
          data: response.data,
          message: response.message
        }
      } catch (error: any) {
        // Handle authentication errors using shared handler
        if (await handleAuthErrorShared(error)) {
          throw new Error('Session expired. Please log in again.')
        }

        this.artefactsError = handleError(error, 'Failed to fetch artefacts')
        return {
          success: false,
          data: null,
          message: this.artefactsError
        }
      } finally {
        this.isLoadingArtefacts = false
      }
    },

    clearArtefacts() {
      this.artefacts = []
      this.stats = {
        totalArtefacts: 0,
        processedArtefacts: 0,
        totalCategories: 0,
        totalSizeBytes: 0,
        totalSize: '0 Bytes'
      }
      this.artefactsError = null
    },

    clearArtefactsError() {
      this.artefactsError = null
    },

    // View artifact method
    async viewArtefact(artefactId: number, orgId?: string | null) {
      try {
        const token = process.client ? localStorage.getItem('authToken') : null
        if (!token) {
          throw new Error('Authentication required')
        }

        let url = `/api/artefacts/view?artefactId=${encodeURIComponent(String(artefactId))}`
        if (orgId) {
          url += `&org=${encodeURIComponent(String(orgId))}`
        }

        const response = await $fetch<{
          statusCode: number
          status: string
          fileUrl: string
          fileType: string
          fileCategory: string
          fileName: string
          contentType?: string
          docType?: string
        }>(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.status === 'error') {
          throw new Error('Failed to get document view URL')
        }

        return {
          success: true,
          data: {
            fileUrl: response.fileUrl,
            fileType: response.fileType,
            fileCategory: response.fileCategory,
            fileName: response.fileName,
            contentType: response.contentType,
            docType: response.docType
          }
        }
      } catch (error: any) {
        // Handle authentication errors using shared handler
        if (await handleAuthErrorShared(error)) {
          throw new Error('Session expired. Please log in again.')
        }

        return {
          success: false,
          message: handleError(error, 'Failed to view document')
        }
      }
    },

    // Summarize artifact method
    async summarizeArtefact(artefactId: number, orgId?: string | null) {
      try {
        const token = process.client ? localStorage.getItem('authToken') : null
        if (!token) {
          throw new Error('Authentication required')
        }

        const url = orgId ? `/api/artefacts/summarize/${artefactId}?org=${encodeURIComponent(String(orgId))}` : `/api/artefacts/summarize/${artefactId}`
        const response = await $fetch<{
          statusCode: number
          status: string
          message: string
          data?: any
        }>(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.status === 'error') {
          throw new Error(response.message)
        }

        return {
          success: true,
          message: response.message || 'Document summarized successfully'
        }
      } catch (error: any) {
        // Handle authentication errors using shared handler
        if (await handleAuthErrorShared(error)) {
          throw new Error('Session expired. Please log in again.')
        }

        return {
          success: false,
          message: handleError(error, 'Failed to summarize document')
        }
      }
    },

    // Reprocess artifact method
    async reprocessArtefact(artefactId: number, orgId?: string | null) {
      try {
        const token = process.client ? localStorage.getItem('authToken') : null
        if (!token) {
          throw new Error('Authentication required')
        }

        const url = orgId ? `/api/artefacts/reprocess/${artefactId}?org=${encodeURIComponent(String(orgId))}` : `/api/artefacts/reprocess/${artefactId}`
        const response = await $fetch<{
          statusCode: number
          status: string
          message: string
          data: any
        }>(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.status === 'error') {
          throw new Error(response.message)
        }

        return {
          success: true,
          message: response.message || 'Artifact reprocessing started successfully'
        }
      } catch (error: any) {
        // Handle authentication errors using shared handler
        if (await handleAuthErrorShared(error)) {
          throw new Error('Session expired. Please sign in again.')
        }

        return {
          success: false,
          message: handleError(error, 'Failed to reprocess artifact')
        }
      }
    },

    // Delete artifact method
    async deleteArtefact(artefactId: number, artefactName: string, orgId?: string | null) {
      try {
        const token = process.client ? localStorage.getItem('authToken') : null
        if (!token) {
          throw new Error('Authentication required')
        }

        let url = `/api/artefacts/delete?artefactId=${encodeURIComponent(String(artefactId))}&artefactName=${encodeURIComponent(artefactName)}`
        if (orgId) {
          url += `&org=${encodeURIComponent(String(orgId))}`
        }

        const response = await $fetch<{
          statusCode: number
          status: string
          message: string
          data: any
        }>(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.status === 'error') {
          throw new Error(response.message)
        }

        handleSuccess(response.message || 'Artifact deleted successfully')

        return {
          success: true,
          message: response.message || 'Artifact deleted successfully'
        }

      } catch (error: any) {
        // Handle authentication errors using shared handler
        if (await handleAuthErrorShared(error)) {
          throw new Error('Session expired. Please sign in again.')
        }

        return {
          success: false,
          message: handleError(error, 'Failed to delete artifact')
        }
      }
    },

    // Check if file exists
    async checkFileExists(fileName: string, orgId?: string | null) {
      try {
        const token = process.client ? localStorage.getItem('authToken') : null
        if (!token) {
          throw new Error('Authentication required')
        }

        let url = `/api/artefacts/check-exists?fileName=${encodeURIComponent(fileName)}`
        if (orgId) {
          url += `&org_id=${encodeURIComponent(String(orgId))}`
        }

        const response = await $fetch<{
          statusCode: number
          status: string
          exists: boolean
          fileInfo?: {
            id: number
            name: string
            category: string
            lastUpdated: string
          }
        }>(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.status === 'error') {
          throw new Error('Failed to check file existence')
        }

        return {
          success: true,
          exists: response.exists,
          fileInfo: response.fileInfo
        }
      } catch (error: any) {
        // Handle authentication errors using shared handler
        if (await handleAuthErrorShared(error)) {
          throw new Error('Session expired. Please sign in again.')
        }

        return {
          success: false,
          exists: false,
          message: handleError(error, 'Failed to check file existence')
        }
      }
    },

    // Check if multiple files exist using unified endpoint
    async checkFilesExistBulk(fileNames: string[], orgId?: string | null) {
      try {
        const token = process.client ? localStorage.getItem('authToken') : null
        if (!token) {
          throw new Error('Authentication required')
        }

        const fileNamesParam = fileNames.map(f => encodeURIComponent(f)).join(',')
        let url = `/api/artefacts/check-exists?fileNames=${fileNamesParam}`
        if (orgId) {
          url += `&org_id=${encodeURIComponent(String(orgId))}`
        }

        const response = await $fetch<{
          statusCode: number
          status: string
          results: Array<{
            originalFileName: string
            cleanedFileName: string
            exists: boolean
            fileInfo?: {
              id: number
              name: string
              category: string
              lastUpdated: string
            }
          }>
        }>(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.status === 'error') {
          throw new Error('Failed to check files existence')
        }

        return {
          success: true,
          results: response.results
        }
      } catch (error: any) {
        // Handle authentication errors using shared handler
        if (await handleAuthErrorShared(error)) {
          throw new Error('Session expired. Please sign in again.')
        }

        return {
          success: false,
          results: [],
          message: handleError(error, 'Failed to check files existence')
        }
      }
    },

    // Auto-processing methods
    startAutoProcessing() {
      if (this.pollingInterval) {
        return      // Already running — don’t restart
      }

      this.isAutoProcessingEnabled = true
      this.startPolling()
    },

    stopAutoProcessing() {
      this.isAutoProcessingEnabled = false
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval)
        this.pollingInterval = null
      }

      this.summarizingDocs.clear()
      this.summarizingDocs = new Set<number>()
    },

    startPolling() {
      if (!this.isAutoProcessingEnabled || this.pollingInterval) return

      this.pollingInterval = setInterval(async () => {
        try {
          await this.fetchArtefacts()

          // Stop polling when everything is processed
          if (this.allDocumentsProcessed && this.allDocumentsSummarized) {
            this.stopAutoProcessing()
          } else {
            this.adjustPollingInterval()
          }
        } catch (error) {
          // silent
        }
      }, this.pollingIntervalMs)
    },

    checkForNewlyProcessedDocuments(previousDocs: any[], currentDocs: any[]) {
      if (!this.isAutoProcessingEnabled) return

      // Find documents that became 'processed' in this update
      const newlyProcessedDocs = currentDocs.filter(currentDoc => {
        const previousDoc = previousDocs.find(prev => prev.id === currentDoc.id)
        return previousDoc &&
          previousDoc.status !== 'processed' &&
          currentDoc.status === 'processed' &&
          currentDoc.summarized === 'No' &&
          !this.summarizingDocs.has(currentDoc.id) &&
          !this.attemptedSummarizations.has(currentDoc.id)
      })

      if (newlyProcessedDocs.length > 0) {
        // Start summarization for newly processed documents
        for (const doc of newlyProcessedDocs) {
          this.summarizingDocs.add(doc.id)
          this.attemptedSummarizations.add(doc.id)

          // Mark artifact as summarizing for immediate UI feedback
          const _idx = this.artefacts.findIndex(a => a.id === doc.id)
          if (_idx !== -1) {
            this.artefacts[_idx].isSummarizing = true
            this.artefacts = [...this.artefacts]
          }

          // Show notification when summarization starts
          if (process.client) {
            const { showInfo } = useNotification()
            showInfo(`Auto summarization started for "${doc.name}"`, {
              title: 'Summarization Started',
              duration: 4000
            })
          }

          // Process in background
          this.processSingleSummarization(doc.id).finally(() => {
            this.summarizingDocs.delete(doc.id)
            // Force reactivity update
            this.summarizingDocs = new Set(this.summarizingDocs)
            // Clear artifact isSummarizing flag
            const _idx2 = this.artefacts.findIndex(a => a.id === doc.id)
            if (_idx2 !== -1) {
              this.artefacts[_idx2].isSummarizing = false
              this.artefacts = [...this.artefacts]
            }
          })

          // Add small delay between starting each summarization
          setTimeout(() => { }, 500)
        }
      }
    },


    async processSingleSummarization(docId: number) {
      try {
        const result = await this.summarizeArtefact(docId)

        if (result.success) {
          // Update document status locally for immediate UI feedback
          const docIndex = this.artefacts.findIndex(a => a.id === docId)
          if (docIndex !== -1) {
            this.artefacts[docIndex].summarized = 'Yes'
            this.artefacts[docIndex].summary = 'Summary available'
          }

          // Refresh data to get updated status from server
          await this.fetchArtefacts()

          // Show success notification
          if (process.client) {
            const { showSuccess } = useNotification()
            const doc = this.artefacts.find(a => a.id === docId)
            const docName = doc?.name || `Document ${docId}`
            showSuccess(`${docName} summarized successfully`)
          }
        } else {
          // Show error notification
          if (process.client) {
            const { showError } = useNotification()
            const doc = this.artefacts.find(a => a.id === docId)
            const docName = doc?.name || `Document ${docId}`
            showError(`Failed to summarize ${docName}: ${result.message}`)
          }
        }
      } catch (error: any) {
        // Show error notification
        if (process.client) {
          const { showError } = useNotification()
          const doc = this.artefacts.find(a => a.id === docId)
          const docName = doc?.name || `Document ${docId}`
          showError(`Error summarizing ${docName}: ${error.message || error}`)
        }
      } finally {
        // Ensure UI flag is cleared
        const idx = this.artefacts.findIndex(a => a.id === docId)
        if (idx !== -1) {
          this.artefacts[idx].isSummarizing = false
          this.artefacts = [...this.artefacts]
        }
        // Also ensure summarizing set is cleaned
        if (this.summarizingDocs.has(docId)) {
          this.summarizingDocs.delete(docId)
          this.summarizingDocs = new Set(this.summarizingDocs)
        }
      }
    },

    adjustPollingInterval() {
      const unprocessedCount = this.artefacts.filter(doc => doc.status !== 'processed').length
      const processingCount = this.artefacts.filter(doc => doc.status === 'processing').length

      // Adjust interval based on processing workload
      if (unprocessedCount > 10 || processingCount > 5) {
        // High workload - poll more frequently
        this.pollingIntervalMs = Math.max(this.minPollingIntervalMs, this.pollingIntervalMs - 2000)
      } else if (unprocessedCount < 3 && processingCount === 0) {
        // Low workload - poll less frequently
        this.pollingIntervalMs = Math.min(this.maxPollingIntervalMs, this.pollingIntervalMs + 3000)
      }

      // Restart polling with new interval if it changed significantly
      const currentInterval = this.pollingIntervalMs
      if (this.pollingInterval && Math.abs(currentInterval - this.pollingIntervalMs) > 2000) {
        clearInterval(this.pollingInterval)
        this.pollingInterval = null
        this.startPolling()
      }
    },

    sleep(ms: number): Promise<void> {
      return new Promise(resolve => setTimeout(resolve, ms))
    },

    resetAutoProcessing() {
      this.stopAutoProcessing()
      this.summarizingDocs.clear()
      this.attemptedSummarizations.clear()
      // Clear per-artifact isSummarizing flags
      this.artefacts = (this.artefacts || []).map(a => ({ ...a, isSummarizing: false }))
      this.pollingIntervalMs = 10000 // Reset to default
    },

    // Get processing status for UI
    getProcessingStatus() {
      const unprocessedCount = this.artefacts.filter(doc => doc.status !== 'processed').length
      const pendingSummarizations = this.pendingSummarizations.length

      return {
        isActive: this.isAutoProcessingActive,
        unprocessedCount,
        pendingCount: pendingSummarizations,
        processingCount: this.summarizingDocs.size,
        progress: this.processingProgress,
        pollingInterval: this.pollingIntervalMs / 1000, // in seconds
        allProcessed: this.allDocumentsProcessed,
        allComplete: this.allDocumentsProcessed && this.allDocumentsSummarized,
      }
    },

    // Department fetching actions
    async fetchDepartments(orgId?: string | null) {
      this.departmentsLoading = true
      this.departmentsError = null
      try {
        const token = process.client ? localStorage.getItem('authToken') : null
        if (!token) {
          this.departmentsError = 'No auth token available'
          return
        }

        const url = orgId
          ? `/api/organizations/departments?org_id=${encodeURIComponent(String(orgId))}`
          : '/api/organizations/departments'

        const result = await $fetch<{ data: any[] }>(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        this.departments = result?.data || []
      } catch (err: any) {
        console.error('Failed to load departments:', err)
        if (!await this.handleAuthError(err)) {
          this.departmentsError = this.handleError(err, 'Failed to load departments')
        }
        this.departments = []
      } finally {
        this.departmentsLoading = false
      }
    },

    // 🔑 Fetch ALL departments without role-based filtering
    // Used for display/mapping purposes so Department Admins can see all department names
    async fetchAllDepartments(orgId?: string | null) {
      try {
        const token = process.client ? localStorage.getItem('authToken') : null
        if (!token) {
          console.warn('No auth token available for loading all departments')
          return []
        }

        const url = orgId
          ? `/api/organizations/all-departments?org_id=${encodeURIComponent(String(orgId))}`
          : '/api/organizations/all-departments'

        const result = await $fetch<{ data: any[] }>(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        return result?.data || []
      } catch (err: any) {
        console.error('Failed to load all departments:', err)
        return []
      }
    },

    async fetchArtefactDepartments(artefactIds?: number[]) {
      try {
        const token = process.client ? localStorage.getItem('authToken') : null
        if (!token) {
          console.warn('No auth token available for loading artifact departments')
          return
        }

        const idsToFetch = artefactIds || this.artefacts.map(a => a.id)
        if (idsToFetch.length === 0) return

        // Fetch departments for each artifact in parallel
        await Promise.allSettled(
          idsToFetch.map(async (artefactId) => {
            try {
              const result = await $fetch<{ departments: Array<{ dept_id: string; name: string }> }>(
                `/api/artefacts/${artefactId}/departments`,
                {
                  method: 'GET',
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              )
              // Store department IDs for form binding, not names
              const deptIds = (result?.departments || []).map((d: any) => d.dept_id).filter(Boolean)
              this.artefactDepartments[artefactId] = deptIds
            } catch (err: any) {
              console.error(`Failed to load departments for artifact ${artefactId}:`, err)
              this.artefactDepartments[artefactId] = []
            }
          }),
        )
      } catch (error: any) {
        console.error('Error fetching artifact departments:', error)
      }
    },

    // Helper to get department names from IDs for display
    getDepartmentNames(deptIds: string[]): string[] {
      return deptIds
        .map((deptId: string) => {
          const dept = this.departments.find((d: any) => d.dept_id === deptId)
          return dept?.name || ''
        })
        .filter(Boolean)
    },
  },
})
