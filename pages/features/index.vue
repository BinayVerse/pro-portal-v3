<!-- /pages/features/index.vue -->
<template>
  <div class="min-h-screen bg-black text-white">
    <!-- Top Menu Navigation Tabs -->
    <div class="flex flex-wrap justify-center gap-2 pt-12 pb-8">
      <NuxtLink
        v-for="feature in features"
        :key="feature.slug"
        :to="`/features/${feature.slug}`"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="
          $route.path === `/features/${feature.slug}`
            ? 'bg-primary-500 text-white'
            : feature.disabled
              ? 'bg-dark-800 text-gray-500 cursor-not-allowed'
              : 'bg-dark-800 text-gray-300 hover:bg-dark-700 hover:text-white'
        "
      >
        {{ feature.name }}
      </NuxtLink>
    </div>

    <!-- Features Overview Content -->
    <section class="pt-8 pb-24 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
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

        <!-- Feature Cards Grid -->
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div
            v-for="feature in enabledFeatures"
            :key="feature.slug"
            class="bg-dark-800 border border-dark-700 rounded-xl p-6 hover:bg-dark-700 transition-all duration-200"
          >
            <div
              class="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center mb-4"
            >
              <UIcon :name="feature.icon" class="w-6 h-6 text-primary-400" />
            </div>
            <h3 class="text-xl font-semibold text-white mb-3">{{ feature.name }}</h3>
            <p class="text-gray-300 mb-6">{{ feature.shortDescription }}</p>
            <NuxtLink
              :to="`/features/${feature.slug}`"
              class="inline-flex items-center text-primary-400 hover:text-primary-300 font-medium"
            >
              Learn More
              <UIcon name="i-heroicons-arrow-right" class="ml-2 w-4 h-4" />
            </NuxtLink>
          </div>
        </div>

        <!-- CTA Section -->
        <div
          class="mt-20 text-center bg-gradient-to-r from-primary-900/20 to-primary-800/20 rounded-xl p-16"
        >
          <h2 class="text-3xl font-bold text-white mb-4">Ready to Experience These Features?</h2>
          <p class="text-xl text-gray-300 mb-12">
            Join thousands of teams already using provento.ai to transform their artifacts
            workflows.
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
    </section>
  </div>
</template>

<script setup lang="ts">
interface Feature {
  name: string
  slug: string
  disabled: boolean
  icon: string
  shortDescription: string
}

const features: Feature[] = [
  {
    name: 'Use Cases',
    slug: 'use-cases',
    disabled: false,
    icon: 'i-heroicons-light-bulb',
    shortDescription: 'Explore real-world applications and scenarios',
  },
  {
    name: 'How It Works',
    slug: 'how-it-works',
    disabled: false,
    icon: 'i-heroicons-cog-6-tooth',
    shortDescription: 'Learn about our technology and processes',
  },
  {
    name: 'Data Privacy',
    slug: 'data-privacy',
    disabled: false,
    icon: 'i-heroicons-shield-check',
    shortDescription: 'Data privacy and compliance information',
  },
]

const enabledFeatures = computed(() => features.filter((f) => !f.disabled))

useHead({
  title: 'Features - provento.ai',
  meta: [
    {
      name: 'description',
      content: 'Discover powerful features for smart artifacts management with provento.ai',
    },
  ],
})
</script>
