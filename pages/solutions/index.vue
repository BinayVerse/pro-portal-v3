<template>
  <div>
    <section class="pt-16 pb-24 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-16">
          <h1 class="text-4xl sm:text-5xl font-bold text-white mb-6">
            Transforming Industries with
            <span class="text-primary-400">AI-Powered Document Intelligence</span>
          </h1>
          <p class="text-xl text-gray-300 max-w-3xl mx-auto">
            Discover how Provento.ai transforms document workflows across different industries,
            helping organizations streamline document workflow, enhance productivity, and make
            data-driven decisions faster than ever before.
          </p>
        </div>

        <!-- Filter Tabs -->
        <div class="flex flex-wrap justify-center gap-2 mb-12">
          <button
            @click="selectedFilter = 'all'"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="
              selectedFilter === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-dark-800 text-gray-300 hover:bg-dark-700 hover:text-white'
            "
          >
            All Industries
          </button>
          <button
            v-for="industry in industries"
            :key="industry.slug"
            @click="selectedFilter = industry.slug"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="
              selectedFilter === industry.slug
                ? 'bg-primary-500 text-white'
                : 'bg-dark-800 text-gray-300 hover:bg-dark-700 hover:text-white'
            "
          >
            {{ industry.name }}
          </button>
        </div>

        <!-- Industries Grid -->
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <NuxtLink
            v-for="industry in filteredIndustries"
            :key="industry.slug"
            :to="`/solutions/${industry.slug}`"
            class="bg-dark-800 border border-dark-700 rounded-xl p-6 hover:bg-dark-700 transition-all duration-200 cursor-pointer flex flex-col min-h-[280px]"
          >
            <div
              class="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center mb-4"
            >
              <svg
                class="w-6 h-6 text-primary-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  :d="industry.icon"
                ></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-white mb-3">{{ industry.name }}</h3>
            <p class="text-gray-300 mb-6 flex-grow">{{ industry.description }}</p>
            <div class="mt-auto">
              <button
                class="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Learn More →
              </button>
            </div>
          </NuxtLink>
        </div>

        <!-- Universal Benefits Section -->
        <div class="mt-20">
          <h2 class="text-3xl font-bold text-white text-center mb-16">
            Universal Benefits Across All Industries
          </h2>

          <div class="grid md:grid-cols-2 gap-12">
            <!-- Left side - Benefits list -->
            <div class="space-y-8">
              <div
                v-for="benefit in benefits"
                :key="benefit.title"
                class="flex items-start space-x-4"
              >
                <div
                  class="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0"
                >
                  <svg
                    class="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                </div>
                <div>
                  <h3 class="text-xl font-semibold text-white mb-2">{{ benefit.title }}</h3>
                  <p class="text-gray-300">{{ benefit.description }}</p>
                </div>
              </div>
            </div>

            <!-- Right side - Core Capabilities -->
            <div class="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h3 class="text-2xl font-bold text-white mb-8 text-center">Core Capabilities</h3>
              <div class="grid grid-cols-2 gap-8">
                <div class="text-center">
                  <div class="text-4xl font-bold text-primary-400 mb-2">50+</div>
                  <div class="text-gray-300 text-sm">File Types Supported</div>
                </div>
                <div class="text-center">
                  <div class="text-4xl font-bold text-primary-400 mb-2">99.9%</div>
                  <div class="text-gray-300 text-sm">Uptime Guarantee</div>
                </div>
                <div class="text-center">
                  <div class="text-4xl font-bold text-primary-400 mb-2">24/7</div>
                  <div class="text-gray-300 text-sm">AI Processing</div>
                </div>
                <div class="text-center">
                  <div class="text-4xl font-bold text-primary-400 mb-2">SOC 2</div>
                  <div class="text-gray-300 text-sm">Compliant</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- CTA Section -->
        <div
          class="mt-20 text-center bg-gradient-to-r from-primary-900/20 to-primary-800/20 rounded-xl p-12"
        >
          <h2 class="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Industry Workflow?
          </h2>
          <p class="text-xl text-gray-300 mb-8">
            Join industry leaders who are already using Provento.ai to revolutionize their document
            processes.
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
// Using default layout

const selectedFilter = ref('all')

const industries = [
  {
    name: 'Education',
    slug: 'education',
    description: 'Enhance learning experiences with intelligent document interaction.',
    icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
    useCases: ['Research assistance', 'Study materials', 'Academic papers', 'Student support'],
  },
  {
    name: 'Finance & Banking',
    slug: 'finance-banking',
    description: 'Accelerate financial document processing and analysis.',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
    useCases: [
      'Risk assessment',
      'Compliance reports',
      'Financial analysis',
      'Audit documentation',
    ],
  },
  {
    name: 'Government',
    slug: 'government',
    description: 'Modernize public sector document management and citizen services.',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    useCases: ['Policy documents', 'Public records', 'Regulatory compliance', 'Citizen services'],
  },
  {
    name: 'Healthcare',
    slug: 'healthcare',
    description: 'Improve patient care with intelligent medical document analysis.',
    icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    useCases: [
      'Medical records',
      'Research studies',
      'Treatment protocols',
      'Patient documentation',
    ],
  },
  {
    name: 'Insurance',
    slug: 'insurance',
    description: 'Streamline claims processing and risk assessment workflows.',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    useCases: ['Claims processing', 'Policy analysis', 'Risk assessment', 'Underwriting'],
  },
  {
    name: 'Legal',
    slug: 'legal',
    description: 'Streamline legal document analysis and contract review processes.',
    icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16l-3-3m3 3l3-3',
    useCases: ['Contract analysis', 'Due diligence', 'Case research', 'Compliance review'],
  },
  {
    name: 'Manufacturing',
    slug: 'manufacturing',
    description: 'Optimize technical documentation and quality processes.',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    useCases: [
      'Technical specifications',
      'Quality documentation',
      'Process manuals',
      'Compliance records',
    ],
  },
  {
    name: 'Real Estate',
    slug: 'real-estate',
    description: 'Simplify property documentation and transaction management.',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    useCases: ['Property documents', 'Contracts & leases', 'Market analysis', 'Due diligence'],
  },
]

const filteredIndustries = computed(() => {
  if (selectedFilter.value === 'all') {
    return industries
  }
  return industries.filter((industry) => industry.slug === selectedFilter.value)
})

const benefits = [
  {
    title: 'Reduce Processing Time by 75%',
    description: 'Transform hours of manual document review into minutes of intelligent analysis.',
  },
  {
    title: 'Improve Accuracy by 90%',
    description: 'Eliminate human error with AI-powered document analysis and extraction.',
  },
  {
    title: 'Scale Operations Effortlessly',
    description: 'Handle increasing document volumes without proportional staffing increases.',
  },
  {
    title: 'Ensure Compliance & Security',
    description: 'Meet industry regulations with enterprise-grade security and audit trails.',
  },
]
</script>
