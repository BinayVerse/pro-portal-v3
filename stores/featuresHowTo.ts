import { defineStore } from 'pinia'
import { handleError } from '../utils/apiHandler'

export interface FeatureHowToVideo {
  id: string
  title: string
  url: string
  expiresIn: number
}

export const useFeaturesHowToStore = defineStore('features-how-to', () => {
  const videos = ref<FeatureHowToVideo[]>([])
  const isLoading = ref(true)
  const error = ref<string | null>(null)
  const fetchedAt = ref(0)

  const fetchHowToVideos = async () => {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch('/api/features/signed-urls', {
        method: 'GET'
      })

      const text = await response.text()
      const data = text ? JSON.parse(text) : {}

      if (response.ok && data.status === 'success') {
        videos.value = data.videos
        fetchedAt.value = Date.now()
        return { success: true }
      }

      throw new Error(data.error || 'Failed to fetch feature videos')
    } catch (err: any) {
      const msg = handleError(err, 'Failed to fetch feature videos')
      error.value = msg
      return { success: false, error: msg }
    } finally {
      isLoading.value = false
    }
  }

  const clear = () => {
    videos.value = []
    fetchedAt.value = 0
    error.value = null
  }

  const refreshIfNeeded = async () => {
    if (!fetchedAt.value || !videos.value.length) return

    const expiryMs = videos.value[0].expiresIn * 1000
    const bufferMs = 5 * 60 * 1000

    if (Date.now() - fetchedAt.value > expiryMs - bufferMs) {
      await fetchHowToVideos()
    }
  }

  return {
    videos: readonly(videos),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchHowToVideos,
    refreshIfNeeded,
    clear,
  }
})