<!-- /pages/features/[slug].vue -->
<template>
  <div class="min-h-screen bg-black text-white">
    <!-- Top Menu Navigation Tabs -->
    <div class="flex flex-wrap justify-center gap-2 pt-12 pb-8">
      <template v-for="feature in allFeatures" :key="feature.slug">
        <NuxtLink
          v-if="!feature.disabled"
          :to="`/features/${feature.slug}`"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="
            feature.slug === slug
              ? 'bg-primary-500 text-white'
              : 'bg-dark-800 text-gray-300 hover:bg-dark-700 hover:text-white'
          "
        >
          {{ feature.name }}
        </NuxtLink>
        <span
          v-else
          class="px-4 py-2 rounded-lg text-sm font-medium bg-dark-800 text-gray-500 cursor-not-allowed"
        >
          {{ feature.name }}
        </span>
      </template>
    </div>

    <!-- Main Content -->
    <section class="pb-24 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <!-- Use Cases Page - Show detailed features content -->
        <div v-if="slug === 'use-cases'">
          <!-- Header -->
          <div class="text-center mb-16">
            <h1 class="text-4xl sm:text-5xl font-bold text-white mb-6">
              Powerful Features for
              <span class="text-primary-400">Smart Artifacts Management</span>
            </h1>
            <p class="text-xl text-gray-300 max-w-3xl mx-auto">
              Discover how provento.ai transforms your artifacts workflow with cutting-edge AI
              technology and seamless integrations.
            </p>
          </div>

          <!-- Intelligent Artifacts Conversations -->
          <div class="mb-20">
            <h2 class="text-3xl font-bold text-white mb-12">Intelligent Artifacts Conversations</h2>
            <div class="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <p class="text-gray-300 text-lg mb-8">
                  Transform static artifacts into interactive conversations. Ask questions in
                  natural language and get instant, accurate answers from your artifacts library.
                </p>
                <div class="space-y-4">
                  <div class="flex items-center space-x-3">
                    <div
                      class="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0"
                    >
                      <UIcon name="i-heroicons-check" class="w-4 h-4 text-white" />
                    </div>
                    <span class="text-gray-300"
                      >Natural language processing for complex queries</span
                    >
                  </div>
                  <div class="flex items-center space-x-3">
                    <div
                      class="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0"
                    >
                      <UIcon name="i-heroicons-check" class="w-4 h-4 text-white" />
                    </div>
                    <span class="text-gray-300">Context-aware responses with source citations</span>
                  </div>
                  <div class="flex items-center space-x-3">
                    <div
                      class="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0"
                    >
                      <UIcon name="i-heroicons-check" class="w-4 h-4 text-white" />
                    </div>
                    <span class="text-gray-300">Multi-artifacts knowledge synthesis</span>
                  </div>
                </div>
              </div>
              <div class="bg-dark-800 rounded-xl p-6 border border-dark-700">
                <div class="bg-dark-900 rounded-lg p-4 mb-4">
                  <div class="flex items-center space-x-2 mb-3">
                    <div class="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div class="space-y-2">
                    <div class="text-gray-300 text-sm">
                      <span class="text-primary-400">User:</span> What are the key risks mentioned
                      in the Q3 financial report?
                    </div>
                    <div class="text-gray-300 text-sm">
                      <span class="text-green-400">provento.ai:</span> Based on the Q3 financial
                      report, the key risks identified are: 1) Market volatility affecting revenue
                      projections...
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Seamless Artifacts Upload -->
          <div class="mb-20">
            <div class="grid lg:grid-cols-2 gap-12 items-center">
              <div class="bg-dark-800 rounded-xl p-8 border border-dark-700">
                <h3 class="text-xl font-bold text-white mb-6">Supported File Types</h3>
                <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-red-500/20 rounded flex items-center justify-center">
                      <UIcon name="mdi:file-pdf-box" class="w-4 h-4 text-red-400" />
                    </div>
                    <span class="text-gray-300">PDF</span>
                  </div>
                  <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-blue-500/20 rounded flex items-center justify-center">
                      <UIcon name="mdi:text-box-outline" class="w-4 h-4 text-blue-400" />
                    </div>
                    <span class="text-gray-300">DOC</span>
                  </div>
                  <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-green-500/20 rounded flex items-center justify-center">
                      <UIcon name="i-heroicons-table-cells" class="w-4 h-4 text-green-400" />
                    </div>
                    <span class="text-gray-300">CSV</span>
                  </div>
                  <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-purple-500/20 rounded flex items-center justify-center">
                      <UIcon name="i-heroicons-code-bracket" class="w-4 h-4 text-purple-400" />
                    </div>
                    <span class="text-gray-300">Markdown</span>
                  </div>
                  <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-yellow-500/20 rounded flex items-center justify-center">
                      <UIcon name="mdi:text-recognition" class="w-4 h-4 text-yellow-400" />
                    </div>
                    <span class="text-gray-300">TXT</span>
                  </div>
                  <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-pink-500/20 rounded flex items-center justify-center">
                      <UIcon name="i-heroicons-photo" class="w-4 h-4 text-pink-400" />
                    </div>
                    <span class="text-gray-300">Image</span>
                  </div>
                  <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-indigo-500/20 rounded flex items-center justify-center">
                      <UIcon name="i-heroicons-circle-stack" class="w-4 h-4 text-indigo-400" />
                    </div>
                    <span class="text-gray-300">Database</span>
                  </div>
                </div>
              </div>
              <div>
                <h2 class="text-3xl font-bold text-white mb-6">Seamless Artifacts Upload</h2>
                <p class="text-gray-300 text-lg mb-8">
                  Upload artifacts from multiple sources with support for all major file formats.
                  Our intelligent processing ensures your content is ready for conversations in
                  seconds.
                </p>
                <div class="space-y-4">
                  <div class="flex items-center space-x-3">
                    <div
                      class="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0"
                    >
                      <UIcon name="i-heroicons-check" class="w-4 h-4 text-white" />
                    </div>
                    <span class="text-gray-300">Manual file upload with drag & drop</span>
                  </div>
                  <div class="flex items-center space-x-3">
                    <div
                      class="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0"
                    >
                      <UIcon name="i-heroicons-check" class="w-4 h-4 text-white" />
                    </div>
                    <span class="text-gray-300">Google Drive integration</span>
                  </div>
                  <div class="flex items-center space-x-3">
                    <div
                      class="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0"
                    >
                      <UIcon name="i-heroicons-check" class="w-4 h-4 text-white" />
                    </div>
                    <span class="text-gray-300">Smart categorization and tagging</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Integrations -->
          <div class="mb-20">
            <div class="grid md:grid-cols-3 gap-8">
              <div class="bg-dark-800 rounded-xl p-8 border border-dark-700 text-center">
                <div
                  class="w-16 h-16 bg-primary-500/20 rounded-xl flex items-center justify-center mx-auto mb-6"
                >
                  <UIcon name="mdi:slack" class="w-8 h-8 text-primary-400" />
                </div>
                <h3 class="text-xl font-bold text-white mb-4">Slack Integration</h3>
                <p class="text-gray-300 mb-6">
                  Get artifacts insights directly in your Slack channels. Ask questions and receive
                  answers without leaving your workflow.
                </p>
              </div>
              <div class="bg-dark-800 rounded-xl p-8 border border-dark-700 text-center">
                <div
                  class="w-16 h-16 bg-primary-500/20 rounded-xl flex items-center justify-center mx-auto mb-6"
                >
                  <UIcon name="mdi:microsoft-teams" class="w-8 h-8 text-primary-400" />
                </div>
                <h3 class="text-xl font-bold text-white mb-4">Teams Integration</h3>
                <p class="text-gray-300 mb-6">
                  Seamlessly connect with Microsoft Teams for collaborative artifacts analysis and
                  real-time knowledge sharing.
                </p>
              </div>
              <div class="bg-dark-800 rounded-xl p-8 border border-dark-700 text-center">
                <div
                  class="w-16 h-16 bg-primary-500/20 rounded-xl flex items-center justify-center mx-auto mb-6"
                >
                  <UIcon name="i-heroicons-device-phone-mobile" class="w-8 h-8 text-primary-400" />
                </div>
                <h3 class="text-xl font-bold text-white mb-4">Mobile Integration</h3>
                <p class="text-gray-300 mb-6">
                  Access your artifacts on WhatsApp for on-the-go insights and quick artifacts
                  queries.
                </p>
              </div>
            </div>
          </div>

          <!-- Advanced Analytics & Insights -->
          <div class="mb-20">
            <h2 class="text-3xl font-bold text-white text-center mb-6">
              Advanced Analytics & Insights
            </h2>
            <p class="text-xl text-gray-300 text-center mb-12 max-w-3xl mx-auto">
              Track usage patterns, monitor performance, and gain insights into how your team
              interacts with artifacts.
            </p>
            <div class="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              <div class="text-center">
                <div
                  class="w-16 h-16 bg-primary-500/20 rounded-xl flex items-center justify-center mx-auto mb-4"
                >
                  <UIcon name="i-heroicons-chart-bar" class="w-8 h-8 text-primary-400" />
                </div>
                <h3 class="text-lg font-bold text-white mb-3">Usage Analytics</h3>
                <p class="text-gray-300 text-sm">
                  Track user engagement and common interaction patterns.
                </p>
              </div>
              <div class="text-center">
                <div
                  class="w-16 h-16 bg-primary-500/20 rounded-xl flex items-center justify-center mx-auto mb-4"
                >
                  <UIcon
                    name="i-heroicons-presentation-chart-line"
                    class="w-8 h-8 text-primary-400"
                  />
                </div>
                <h3 class="text-lg font-bold text-white mb-3">Trend Analysis</h3>
                <p class="text-gray-300 text-sm">Identify popular artifacts and query patterns.</p>
              </div>
            </div>
          </div>

          <!-- CTA Section -->
          <div
            class="text-center bg-gradient-to-r from-primary-900/20 to-primary-800/20 rounded-xl p-12"
          >
            <h2 class="text-3xl font-bold text-white mb-4">Ready to Experience These Features?</h2>
            <p class="text-xl text-gray-300 mb-8">
              Join thousands of teams already using provento.ai to transform their artifacts
              workflows.
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <NuxtLink to="/book-meeting" class="btn-primary text-lg px-8 py-4">
                Book a Demo
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- How It Works Content -->
        <div v-else-if="slug === 'how-it-works'">
          <div class="text-center mb-16">
            <h1 class="text-4xl sm:text-5xl font-bold text-white mb-6">How It Works</h1>
            <p class="text-xl text-gray-300 max-w-3xl mx-auto">
              Learn how provento.ai works through a simple, step-by-step process.
            </p>
          </div>

          <!-- Simple Process -->
          <div class="space-y-12">
            <!-- Feature Videos -->
            <div>
              <h2 class="text-3xl font-bold text-white text-center mb-12">Feature Videos</h2>

              <!-- Loading State -->
              <div v-if="howToStore.isLoading" class="text-center py-12">
                <div class="flex justify-center mb-4">
                  <div
                    class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"
                  ></div>
                </div>
                <p class="text-gray-300">Loading videos...</p>
              </div>

              <!-- Error State -->
              <div
                v-else-if="howToStore.error"
                class="bg-red-900/20 border border-red-500 rounded-xl p-6 mb-8"
              >
                <h3 class="text-lg font-bold text-red-400 mb-2">Unable to Load Videos</h3>
                <p class="text-red-300 text-sm mb-4">{{ howToStore.error }}</p>
                <!-- <button
                  @click="howToStore.fetchHowToVideos()"
                  class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors text-sm"
                >
                  Retry
                </button> -->
              </div>

              <!-- Empty State -->
              <div v-else-if="howToStore.videos.length === 0" class="text-center py-12">
                <p class="text-gray-300 mb-4">No videos available</p>
                <!-- <button
                  @click="howToStore.fetchHowToVideos()"
                  class="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded transition-colors text-sm"
                >
                  Load Videos
                </button> -->
              </div>

              <!-- Videos Grid -->
              <div v-else class="grid md:grid-cols-3 gap-8">
                <div
                  v-for="video in howToStore.videos"
                  :key="video.id"
                  class="bg-dark-800 rounded-xl p-6 border border-dark-700 text-center"
                >
                  <div class="relative w-full pt-[56.25%] overflow-hidden rounded-xl mb-4 bg-black">
                    <video
                      :src="video.url"
                      controls
                      preload="metadata"
                      playsinline
                      class="absolute inset-0 w-full h-full object-contain rounded-xl"
                      @error="handleVideoError"
                      @canplay="handleVideoCanPlay"
                    />
                  </div>

                  <h3 class="text-xl font-bold text-white mb-4">
                    {{ video.title }}
                  </h3>

                  <p class="text-gray-300 text-sm">
                    Watch and learn how this feature works in provento.ai
                  </p>
                </div>
              </div>
            </div>

            <div
              class="mt-20 text-center bg-gradient-to-r from-primary-900/20 to-primary-800/20 rounded-xl p-12"
            >
              <h2 class="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
              <p class="text-xl text-gray-300 mb-8">
                Experience the power of provento.ai with your own artifacts.
              </p>
              <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <NuxtLink to="/book-meeting" class="btn-primary text-lg px-8 py-4">
                  Book a Demo
                </NuxtLink>
                <NuxtLink to="/signup" class="btn-outline text-lg px-8 py-4">
                  Start Free Trial
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>

        <!-- Data Privacy Page -->
        <div v-else-if="slug === 'data-privacy'">
          <!-- Header -->
          <div class="grid lg:grid-cols-2 gap-12 items-start mb-20">
            <div>
              <h1 class="text-4xl sm:text-5xl font-bold text-white mb-6">
                Your Data Privacy
                <br />
                <span class="text-primary-400">Is Our Priority</span>
              </h1>
              <p class="text-gray-300 text-base mb-8">
                Provento is committed to safeguarding your data with industry-leading security and
                strict compliance standards.
              </p>
            </div>
            <div class="flex items-start justify-center relative">
              <img
                src="~/assets/media/Features-GDPR-AWS.png"
                alt="GDPR and AWS Security Standards"
                class="w-full h-auto rounded-2xl"
                style="
                  box-shadow:
                    inset 0 0 50px rgba(0, 0, 0, 0.3),
                    inset 0 0 100px rgba(0, 0, 0, 0.15);
                "
              />
            </div>
          </div>

          <!-- Data Privacy & Compliance Section -->
          <div class="mb-20">
            <h2 class="text-3xl font-bold text-white mb-8">
              <span class="text-primary-400">Data Privacy & </span>
              <span class="font-normal">Compliance</span>
            </h2>
            <div class="space-y-6 text-gray-300">
              <p class="text-base leading-relaxed">
                <strong class="text-white">Provento is an</strong> AWS Marketplace–approved
                <strong class="text-white">SaaS platform</strong> built with security and privacy by
                design. We host our services on Amazon Web Services (AWS) and follow industry best
                practices for data protection, access control, and encryption.
              </p>
              <p class="text-base leading-relaxed">
                <strong class="text-white"
                  >Provento is designed to comply with the General Data Protection Regulation
                  (GDPR)</strong
                >
                and supports customer rights related to data access, correction, deletion, and
                portability. Customer data is processed securely and only for the purposes required
                to provide the service.
              </p>
            </div>
          </div>

          <!-- CTA Section -->
          <div
            class="text-center bg-gradient-to-r from-primary-900/20 to-primary-800/20 rounded-xl p-12"
          >
            <h2 class="text-3xl font-bold text-white mb-4">Ready to Protect Your Data?</h2>
            <p class="text-xl text-gray-300 mb-8">
              Join thousands of teams trusting Provento with their sensitive data.
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <NuxtLink to="/book-meeting" class="btn-primary text-lg px-8 py-4">
                Book a Demo
              </NuxtLink>
              <NuxtLink to="/signup" class="btn-outline text-lg px-8 py-4">
                Start Free Trial
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Feature Not Found -->
        <div v-else-if="feature">
          <div class="text-center py-12">
            <div
              class="w-24 h-24 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <UIcon name="i-heroicons-clock" class="w-12 h-12 text-gray-500" />
            </div>
            <h1 class="text-4xl font-bold text-white mb-6">{{ feature.title }}</h1>
            <p class="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              {{ feature.description }}
            </p>
            <h2 class="text-2xl font-bold text-white mb-4">Coming Soon</h2>
            <p class="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
              {{ feature.comingSoonMessage }}
            </p>
            <NuxtLink to="/features/use-cases" class="btn-primary mt-8 inline-block">
              Explore Available Features
            </NuxtLink>
          </div>
        </div>

        <!-- Feature Not Found -->
        <div v-else class="min-h-[60vh] flex items-center justify-center">
          <div class="text-center">
            <h1 class="text-4xl font-bold text-white mb-4">Feature Not Found</h1>
            <p class="text-gray-300 mb-4">The feature "{{ slug }}" doesn't exist.</p>
            <div class="flex flex-wrap justify-center gap-4">
              <NuxtLink
                v-for="item in enabledFeatures"
                :key="item.slug"
                :to="`/features/${item.slug}`"
                class="bg-dark-800 text-gray-300 hover:text-white hover:bg-dark-700 px-4 py-2 rounded-lg transition-colors"
              >
                {{ item.name }}
              </NuxtLink>
            </div>
            <NuxtLink to="/features" class="btn-primary mt-8 inline-block">
              Back to Features
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()

const howToStore = useFeaturesHowToStore()

const handleVideoError = (event: Event) => {
  const video = event.target as HTMLVideoElement
  console.error('Video error:', video.error?.message, 'for src:', video.src)
}

const handleVideoCanPlay = (event: Event) => {
  const video = event.target as HTMLVideoElement
  // console.log('Video can play:', video.src)
}

onMounted(() => {
  howToStore.fetchHowToVideos()
})

// Fix: Handle both string and array cases for slug
const slug = computed(() => {
  const params = route.params as { slug?: string | string[] }
  return Array.isArray(params.slug) ? (params.slug[0] ?? '') : (params.slug ?? '')
})

// Define proper TypeScript interface
interface FeatureItem {
  name: string
  slug: string
  enabled: boolean
  disabled: boolean
}

const allFeatures: FeatureItem[] = [
  { name: 'Use Cases', slug: 'use-cases', enabled: true, disabled: false },
  { name: 'How It Works', slug: 'how-it-works', enabled: true, disabled: false },
  { name: 'Data Privacy', slug: 'data-privacy', enabled: true, disabled: false },
]

const enabledFeatures = computed(() => allFeatures.filter((f) => f.enabled))

// Define interface for feature data
interface FeatureData {
  title: string
  description: string
  enabled: boolean
  comingSoonMessage?: string
}

const featuresData: Record<string, FeatureData> = {
  'use-cases': {
    title: 'Use Cases',
    description:
      'Explore real-world applications and industry scenarios where provento.ai transforms artifact workflows.',
    enabled: true,
  },
  'how-it-works': {
    title: 'How It Works',
    description:
      'Learn about our simple process to transform your artifact workflows with AI-powered intelligence.',
    enabled: true,
  },
  'data-privacy': {
    title: 'Data Privacy & Compliance',
    description: 'Enterprise-grade security and compliance standards for your peace of mind.',
    enabled: true,
  },
}

const feature = computed(() => featuresData[slug.value] || null)

useHead({
  title: feature.value
    ? `${feature.value.title} - Features - provento.ai`
    : 'Feature Not Found - provento.ai',
  meta: [
    {
      name: 'description',
      content: feature.value?.description || 'Explore features of provento.ai',
    },
  ],
})
</script>
