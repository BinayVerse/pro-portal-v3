<template>
  <div>
    <!-- Hero Section -->
    <section class="pt-12 md:pt-16 pb-20 md:pb-24 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <div class="text-center">
          <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6 animate-fade-in">
            Bring Your Business To Life With The Power Of
            <span class="text-primary-400">Intelligent Conversations</span>
          </h1>
          <p class="text-base sm:text-lg md:text-xl text-gray-300 mb-6 md:mb-8 max-w-3xl mx-auto animate-slide-up">
            Transform your artifacts into interactive conversations. Upload, organize, and chat with
            your files using advanced AI technology.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center items-center animate-scale-up">
            <NuxtLink to="/features" class="btn-outline text-base md:text-lg px-6 md:px-8 py-3 md:py-4"> Learn More </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Preview -->
    <section class="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-dark-950/50">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-12 md:mb-16">
          <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 md:mb-4">Why Choose provento.ai?</h2>
          <p class="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            Powerful features designed to revolutionize how you interact with your artifacts
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          <div class="card text-center group hover:scale-105 transition-transform duration-200">
            <div
              class="w-14 h-14 md:w-16 md:h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 group-hover:bg-primary-500/30 transition-colors"
            >
              <UIcon name="heroicons:chat-bubble-left-ellipsis" class="w-7 h-7 md:w-8 md:h-8 text-primary-400" />
            </div>
            <h3 class="text-lg md:text-xl font-semibold text-white mb-3 md:mb-4">Intelligent Chat</h3>
            <p class="text-sm md:text-base text-gray-300">
              Ask questions about your artifacts and get instant, accurate answers powered by
              advanced AI.
            </p>
          </div>

          <div class="card text-center group hover:scale-105 transition-transform duration-200">
            <div
              class="w-14 h-14 md:w-16 md:h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 group-hover:bg-primary-500/30 transition-colors"
            >
              <UIcon name="heroicons:document-text" class="w-7 h-7 md:w-8 md:h-8 text-primary-400" />
            </div>
            <h3 class="text-lg md:text-xl font-semibold text-white mb-3 md:mb-4">Multi-Format Support</h3>
            <p class="text-sm md:text-base text-gray-300">
              Support for PDF, DOC, CSV, Markdown, TXT, Image, and Database. Upload from local
              storage or Google Drive.
            </p>
          </div>

          <div class="card text-center group hover:scale-105 transition-transform duration-200 md:col-span-2 lg:col-span-1">
            <div
              class="w-14 h-14 md:w-16 md:h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 group-hover:bg-primary-500/30 transition-colors"
            >
              <UIcon name="heroicons:link" class="w-7 h-7 md:w-8 md:h-8 text-primary-400" />
            </div>
            <h3 class="text-lg md:text-xl font-semibold text-white mb-3 md:mb-4">Workplace Connectivity</h3>
            <p class="text-sm md:text-base text-gray-300 mb-3 md:mb-4">
              Integrate with Slack, Microsoft Teams, and WhatsApp for frictionless collaboration and
              support.
            </p>
            <div class="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-3 md:mt-4">
              <div class="flex items-center space-x-2 bg-dark-700/50 rounded-lg px-2 sm:px-3 py-1.5 md:py-2">
                <UIcon name="mdi:slack" class="w-4 sm:w-5 h-4 sm:h-5 text-purple-400" />
                <span class="text-xs sm:text-sm text-gray-300">Slack</span>
              </div>
              <div class="flex items-center space-x-2 bg-dark-700/50 rounded-lg px-2 sm:px-3 py-1.5 md:py-2">
                <UIcon name="mdi:microsoft-teams" class="w-4 sm:w-5 h-4 sm:h-5 text-blue-400" />
                <span class="text-xs sm:text-sm text-gray-300">Teams</span>
              </div>
              <div class="flex items-center space-x-2 bg-dark-700/50 rounded-lg px-2 sm:px-3 py-1.5 md:py-2">
                <UIcon name="mdi:whatsapp" class="w-4 sm:w-5 h-4 sm:h-5 text-green-400" />
                <span class="text-xs sm:text-sm text-gray-300">WhatsApp</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section
      class="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary-900/20 to-primary-800/20"
    >
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 md:mb-6">
          Ready to Transform Your Artifact Workflow?
        </h2>
        <p class="text-base sm:text-lg md:text-xl text-gray-300 mb-6 md:mb-8">
          Start your journey with provento.ai and see how it helps businesses uncover insights
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <NuxtLink to="/book-meeting" class="btn-primary text-base md:text-lg px-6 md:px-8 py-3 md:py-4">
            Book a Demo
          </NuxtLink>
          <NuxtLink to="/pricing" class="btn-outline text-base md:text-lg px-6 md:px-8 py-3 md:py-4"> View Pricing </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Home - provento.ai' })
// Using default layout automatically
</script>
