<template>
  <div>
    <!-- Hero Section -->
    <section class="pt-16 pb-24 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <div class="text-center">
          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 animate-fade-in">
            Bring Your Business To Life With The Power Of
            <span class="text-primary-400">Intelligent Conversations</span>
          </h1>
          <p class="text-xl text-gray-300 mb-8 max-w-3xl mx-auto animate-slide-up">
            Transform your documents into interactive conversations. Upload, organize, and chat with
            your files using advanced AI technology.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center items-center animate-scale-up">
            <NuxtLink to="/features" class="btn-outline text-lg px-8 py-4"> Learn More </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Preview -->
    <section class="py-20 px-4 sm:px-6 lg:px-8 bg-dark-950/50">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-3xl sm:text-4xl font-bold text-white mb-4">Why Choose Provento.ai?</h2>
          <p class="text-xl text-gray-300 max-w-2xl mx-auto">
            Powerful features designed to revolutionize how you interact with your documents
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
          <div class="card text-center group hover:scale-105 transition-transform duration-200">
            <div
              class="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary-500/30 transition-colors"
            >
              <svg
                class="w-8 h-8 text-primary-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                ></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-white mb-4">Intelligent Chat</h3>
            <p class="text-gray-300">
              Ask questions about your documents and get instant, accurate answers powered by
              advanced AI.
            </p>
          </div>

          <div class="card text-center group hover:scale-105 transition-transform duration-200">
            <div
              class="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary-500/30 transition-colors"
            >
              <svg
                class="w-8 h-8 text-primary-400"
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
            <h3 class="text-xl font-semibold text-white mb-4">Multi-Format Support</h3>
            <p class="text-gray-300">
              Support for PDF, Word, CSV, Markdown, and more. Upload from local storage or Google
              Drive.
            </p>
          </div>

          <div class="card text-center group hover:scale-105 transition-transform duration-200">
            <div
              class="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary-500/30 transition-colors"
            >
              <svg
                class="w-8 h-8 text-primary-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                ></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-white mb-4">Workplace Connectivity</h3>
            <p class="text-gray-300">
              Integrate with Slack, Microsoft Teams, WhatsApp, and iMessage for frictionless
              collaboration and support.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Industry Solutions Preview -->
    <section class="py-20 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-3xl sm:text-4xl font-bold text-white mb-4">
            Tailored for Every Industry
          </h2>
          <p class="text-xl text-gray-300 max-w-2xl mx-auto">
            Specialized solutions designed for your industry's unique document challenges
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="industry in industries"
            :key="industry.slug"
            class="card group cursor-pointer hover:scale-105 transition-transform duration-200"
          >
            <div class="text-center">
              <div
                class="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-500/30 transition-colors"
              >
                <svg
                  class="w-6 h-6 text-primary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    v-if="industry.slug === 'legal'"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16l-3-3m3 3l3-3"
                  ></path>
                  <path
                    v-else-if="industry.slug === 'education'"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                  ></path>
                  <path
                    v-else-if="industry.slug === 'finance-banking'"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  ></path>
                  <path
                    v-else-if="industry.slug === 'healthcare'"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  ></path>
                  <path
                    v-else-if="industry.slug === 'real-estate'"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  ></path>
                  <path
                    v-else-if="industry.slug === 'government'"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  ></path>
                  <path
                    v-else-if="industry.slug === 'insurance'"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  ></path>
                  <path
                    v-else-if="industry.slug === 'manufacturing'"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  ></path>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-white mb-2">{{ industry.name }}</h3>
              <p class="text-gray-400 text-sm">{{ industry.description }}</p>
            </div>
          </div>
        </div>

        <div class="text-center mt-12">
          <NuxtLink to="/solutions" class="btn-primary"> Explore All Solutions </NuxtLink>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section
      class="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary-900/20 to-primary-800/20"
    >
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="text-3xl sm:text-4xl font-bold text-white mb-6">
          Ready to Transform Your Document Workflow?
        </h2>
        <p class="text-xl text-gray-300 mb-8">
          Join thousands of businesses already using Provento.ai to unlock the power of their
          documents.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <NuxtLink to="/book-meeting" class="btn-primary text-lg px-8 py-4">
            Book a Demo
          </NuxtLink>
          <NuxtLink to="/pricing" class="btn-outline text-lg px-8 py-4"> View Pricing </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// Using default layout automatically

const industries = [
  {
    name: 'Education',
    slug: 'education',
    description: 'Course materials, research papers, student resources',
    icon: 'AcademicCapIcon',
  },
  {
    name: 'Finance & Banking',
    slug: 'finance-banking',
    description: 'Financial reports, compliance docs, risk assessments',
    icon: 'CurrencyDollarIcon',
  },
  {
    name: 'Government',
    slug: 'government',
    description: 'Policy documents, public records, regulatory compliance',
    icon: 'BuildingLibraryIcon',
  },
  {
    name: 'Healthcare',
    slug: 'healthcare',
    description: 'Medical records, research studies, patient documentation',
    icon: 'HeartIcon',
  },
  {
    name: 'Insurance',
    slug: 'insurance',
    description: 'Claims processing, policy documents, risk assessment',
    icon: 'ShieldCheckIcon',
  },
  {
    name: 'Legal',
    slug: 'legal',
    description: 'Contract analysis, case research, compliance documentation',
    icon: 'ScaleIcon',
  },
  {
    name: 'Manufacturing',
    slug: 'manufacturing',
    description: 'Technical specs, quality docs, process documentation',
    icon: 'CogIcon',
  },
  {
    name: 'Real Estate',
    slug: 'real-estate',
    description: 'Property docs, contracts, market analysis',
    icon: 'HomeIcon',
  },
]
</script>
