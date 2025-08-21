<template>
  <div v-if="solution">
    <section class="pt-16 pb-24 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <!-- Filter Tabs -->
        <div class="flex flex-wrap justify-center gap-2 mb-12">
          <NuxtLink
            to="/solutions"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-dark-800 text-gray-300 hover:bg-dark-700 hover:text-white"
          >
            All Industries
          </NuxtLink>
          <button
            v-for="industry in allIndustries"
            :key="industry.slug"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="
              industry.slug === slug
                ? 'bg-primary-500 text-white'
                : 'bg-dark-800 text-gray-300 hover:bg-dark-700 hover:text-white'
            "
            @click="navigateTo(`/solutions/${industry.slug}`)"
          >
            {{ industry.name }}
          </button>
        </div>

        <!-- Main Content Grid -->
        <div class="grid lg:grid-cols-12 gap-8 mb-20">
          <!-- Left Sidebar -->
          <div class="lg:col-span-4">
            <div class="bg-dark-800 rounded-xl p-6 border border-dark-700">
              <div class="flex items-center space-x-3 mb-6">
                <div
                  class="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center"
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
                      :d="solution.icon"
                    ></path>
                  </svg>
                </div>
                <h1 class="text-2xl font-bold text-white">{{ solution.name }}</h1>
              </div>

              <p class="text-gray-300 mb-6">{{ solution.description }}</p>

              <div class="space-y-3 mb-6">
                <div v-for="point in solution.keyPoints" :key="point" class="flex items-start">
                  <div class="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span class="text-gray-300 text-sm">{{ point }}</span>
                </div>
              </div>

              <NuxtLink to="/book-meeting" class="btn-primary w-full mt-6"> Learn More → </NuxtLink>
            </div>
          </div>

          <!-- Right Content -->
          <div class="lg:col-span-8">
            <!-- How Provento.ai Helps -->
            <div class="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h2 class="text-2xl font-bold text-white mb-6">How Provento.ai Helps</h2>
              <div class="space-y-4">
                <div v-for="help in solution.helps" :key="help" class="flex items-center space-x-3">
                  <div
                    class="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0"
                  >
                    <svg
                      class="w-4 h-4 text-white"
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
                  <span class="text-gray-300">{{ help }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Common Use Cases - Full Width Section -->
        <div class="mb-20">
          <h2 class="text-2xl font-bold text-white text-center mb-8">Common Use Cases</h2>
          <div class="grid md:grid-cols-3 gap-6">
            <div
              v-for="useCase in solution.useCases"
              :key="useCase.title"
              class="bg-dark-800 rounded-xl p-6 border border-dark-700"
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-white mb-3">{{ useCase.title }}</h3>
              <p class="text-gray-300 text-sm mb-4">{{ useCase.description }}</p>
              <p class="text-primary-400 text-sm font-medium">{{ useCase.question }}</p>
            </div>
          </div>
        </div>

        <!-- Success Story -->
        <div class="bg-dark-800 rounded-xl p-8 border border-dark-700 mb-20">
          <h2 class="text-2xl font-bold text-white text-center mb-8">Success Story</h2>
          <div class="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <blockquote class="text-gray-300 text-lg italic mb-6">
                "{{ solution.testimonial.quote }}"
              </blockquote>
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                  <span class="text-white font-semibold">{{
                    solution.testimonial.author
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                  }}</span>
                </div>
                <div>
                  <div class="text-white font-semibold">{{ solution.testimonial.author }}</div>
                  <div class="text-gray-400 text-sm">{{ solution.testimonial.title }}</div>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-6">
              <div v-for="stat in solution.stats" :key="stat.label" class="text-center">
                <div class="text-3xl font-bold text-primary-400 mb-2">{{ stat.value }}</div>
                <div class="text-gray-300 text-sm">{{ stat.label }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Key Features -->
        <div class="mb-20">
          <h2 class="text-2xl font-bold text-white text-center mb-8">
            Key Features for {{ solution.name }}
          </h2>
          <div class="grid md:grid-cols-2 gap-6">
            <div
              v-for="feature in solution.keyFeatures"
              :key="feature.title"
              class="bg-dark-800 rounded-xl p-6 border border-dark-700"
            >
              <div class="flex items-start space-x-4">
                <div
                  class="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0"
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
                      :d="feature.icon"
                    ></path>
                  </svg>
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-white mb-2">{{ feature.title }}</h3>
                  <p class="text-gray-300 text-sm">{{ feature.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- CTA Section -->
        <div
          class="text-center bg-gradient-to-r from-primary-900/20 to-primary-800/20 rounded-xl p-8"
        >
          <h2 class="text-3xl font-bold text-white mb-4">
            Ready to Transform Your {{ solution.name }} Workflow?
          </h2>
          <p class="text-xl text-gray-300 mb-8">
            See how Provento.ai can streamline your {{ solution.name.toLowerCase() }} document
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
  <div v-else class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-white mb-4">Solution Not Found</h1>
      <p class="text-gray-300 mb-4">The solution "{{ slug }}" doesn't exist.</p>
      <p class="text-gray-400 mb-8 text-sm">
        Available solutions: {{ Object.keys(solutions).join(', ') }}
      </p>
      <NuxtLink to="/solutions" class="btn-primary"> View All Solutions </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
// Using default layout

const route = useRoute()
const slug = route.params.slug as string

const allIndustries = [
  { name: 'Education', slug: 'education' },
  { name: 'Finance & Banking', slug: 'finance-banking' },
  { name: 'Government', slug: 'government' },
  { name: 'Healthcare', slug: 'healthcare' },
  { name: 'Insurance', slug: 'insurance' },
  { name: 'Legal', slug: 'legal' },
  { name: 'Manufacturing', slug: 'manufacturing' },
  { name: 'Real Estate', slug: 'real-estate' },
]

const solutions: Record<string, any> = {
  education: {
    name: 'Education',
    description:
      'Enhance learning experiences and administrative efficiency with intelligent document management for educational institutions.',
    icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
    keyPoints: [
      'Time-consuming manual document review',
      'Difficulty finding relevant case precedents',
      'Complex contract analysis requirements',
      'Regulatory compliance tracking',
    ],
    helps: [
      'Instant case law and precedent search',
      'Automated contract clause analysis',
      'Regulatory compliance monitoring',
      'Legal research acceleration',
    ],
    useCases: [
      {
        title: 'Curriculum Management',
        description:
          'Organize and search through course materials, syllabi, and educational resources.',
        question: 'Ask: "Find all materials related to quantum physics in advanced courses"',
      },
      {
        title: 'Research Support',
        description:
          'Help students and faculty quickly find relevant research papers and citations.',
        question: 'Ask: "What are the key findings about climate change in recent studies?"',
      },
      {
        title: 'Student Services',
        description: 'Quickly access student records, policies, and procedural information.',
        question: 'Ask: "What are the requirements for graduate program admission?"',
      },
    ],
    testimonial: {
      quote:
        'Our faculty can now instantly access relevant research materials and course content. Student services has become much more efficient with quick policy lookups.',
      author: 'Dr. Michael Chen',
      title: 'Dean of Academic Affairs, State University',
    },
    stats: [
      { value: '60%', label: 'Research Time Saved' },
      { value: '85%', label: 'Student Queries Resolved' },
      { value: '95%', label: 'Faculty Satisfaction' },
    ],
    keyFeatures: [
      {
        title: 'Academic Content Search',
        description:
          'Search across syllabi, lecture notes, research papers, and academic databases with intelligent content recognition.',
        icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
      },
      {
        title: 'Citation Management',
        description:
          'Automatically format and verify academic citations across different style guides like APA, MLA, and Chicago.',
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      },
      {
        title: 'Plagiarism Detection',
        description:
          'Identify potential plagiarism and citation issues in student submissions and research papers.',
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      },
      {
        title: 'Learning Analytics',
        description:
          'Track document usage patterns to understand learning preferences and improve curriculum design.',
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      },
    ],
  },
  'finance-banking': {
    name: 'Finance & Banking',
    description:
      'Transform financial research, contract analysis, and case preparation with AI-powered document intelligence. Quickly find relevant precedents, analyze contracts, and extract key legal insights.',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
    keyPoints: [
      'Complex financial document analysis',
      'Risk assessment requirements',
      'Regulatory compliance challenges',
      'Credit and loan processing',
    ],
    helps: [
      'Automated financial document analysis',
      'Risk assessment acceleration',
      'Compliance monitoring',
      'Credit decision support',
    ],
    useCases: [
      {
        title: 'Credit Analysis',
        description:
          'Quickly analyze financial statements, credit reports, and supporting documents.',
        question: 'Ask: "What are the key financial ratios in this loan application?"',
      },
      {
        title: 'Risk Assessment',
        description: 'Identify potential risks and compliance issues in financial documents.',
        question: 'Ask: "Find any red flags related to data privacy violations in healthcare"',
      },
      {
        title: 'Regulatory Compliance',
        description: 'Ensure all financial products meet current regulatory requirements.',
        question: 'Ask: "What are the intellectual property risks in these documents?"',
      },
    ],
    testimonial: {
      quote:
        'Our credit review process has been revolutionized. What used to take days now takes hours, and we catch more potential issues than ever before.',
      author: 'Michael Rodriguez',
      title: 'Risk Manager, First National Bank',
    },
    stats: [
      { value: '65%', label: 'Analysis Time Reduced' },
      { value: '88%', label: 'Risk Detection Rate' },
      { value: '96%', label: 'Compliance Accuracy' },
    ],
    keyFeatures: [
      {
        title: 'Financial Intelligence',
        description:
          'Extract and analyze key financial metrics, ratios, and risk indicators with AI-powered analysis.',
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      },
      {
        title: 'Risk Assessment',
        description:
          'Automatically identify and categorize financial risks from document analysis.',
        icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
      },
      {
        title: 'Regulatory Compliance',
        description:
          'Ensure documents meet current financial regulations and compliance standards.',
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      },
      {
        title: 'Document Classification',
        description: 'Automatically categorize and tag financial documents by type and importance.',
        icon: 'M7 7h10l4 12H3l4-12z',
      },
    ],
  },
  government: {
    name: 'Government',
    description:
      'Modernize public sector document management and citizen services with intelligent document processing for policy documents, public records, and regulatory compliance.',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    keyPoints: [
      'Complex policy document management',
      'Public records accessibility',
      'Regulatory compliance tracking',
      'Inter-department coordination',
    ],
    helps: [
      'Policy document organization',
      'Public record search capabilities',
      'Compliance automation',
      'Citizen service enhancement',
    ],
    useCases: [
      {
        title: 'Policy Research',
        description:
          'Quickly search through policy documents, regulations, and historical records.',
        question: 'Ask: "Find all policies related to environmental regulations from 2020-2023"',
      },
      {
        title: 'Public Records',
        description: 'Efficiently locate and analyze public records for citizen requests.',
        question: 'Ask: "What building permits were issued in downtown district last year?"',
      },
      {
        title: 'Compliance Monitoring',
        description: 'Ensure department activities comply with current regulations and policies.',
        question: 'Ask: "Check compliance status for all environmental impact assessments"',
      },
    ],
    testimonial: {
      quote:
        'Our policy research and public records management has been transformed. Citizens get faster responses and our staff can focus on higher-value activities.',
      author: 'Jennifer Walsh',
      title: 'Director of Public Services, City Administration',
    },
    stats: [
      { value: '55%', label: 'Response Time Reduced' },
      { value: '90%', label: 'Records Accuracy' },
      { value: '85%', label: 'Citizen Satisfaction' },
    ],
    keyFeatures: [
      {
        title: 'Policy Intelligence',
        description:
          'Search and analyze complex policy documents with intelligent content understanding.',
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      },
      {
        title: 'Records Management',
        description:
          'Organize and search public records with advanced indexing and categorization.',
        icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
      },
      {
        title: 'Compliance Tracking',
        description: 'Monitor and ensure adherence to government regulations and policies.',
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      },
      {
        title: 'Citizen Services',
        description:
          'Enhance citizen services with faster document processing and information retrieval.',
        icon: 'M7 7h10l4 12H3l4-12z',
      },
    ],
  },
  insurance: {
    name: 'Insurance',
    description:
      'Streamline claims processing and risk assessment workflows with intelligent document analysis for faster, more accurate insurance operations.',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    keyPoints: [
      'Complex claims processing workflows',
      'Risk assessment documentation',
      'Policy analysis requirements',
      'Fraud detection challenges',
    ],
    helps: [
      'Automated claims processing',
      'Risk assessment acceleration',
      'Policy analysis automation',
      'Fraud detection enhancement',
    ],
    useCases: [
      {
        title: 'Claims Processing',
        description:
          'Automatically extract and analyze information from claims documents and supporting materials.',
        question: 'Ask: "What are the key details from this auto accident claim?"',
      },
      {
        title: 'Risk Assessment',
        description: 'Analyze applications and supporting documents to assess risk factors.',
        question: 'Ask: "Identify risk factors in this property insurance application"',
      },
      {
        title: 'Policy Analysis',
        description: 'Review policy documents for coverage details and exclusions.',
        question: 'Ask: "What coverage exclusions apply to this water damage claim?"',
      },
    ],
    testimonial: {
      quote:
        'Our claims processing speed has increased dramatically while maintaining accuracy. Our customers are much happier with faster claim resolutions.',
      author: 'Robert Chen',
      title: 'Claims Director, Liberty Insurance Group',
    },
    stats: [
      { value: '68%', label: 'Processing Time Reduced' },
      { value: '94%', label: 'Accuracy Rate' },
      { value: '89%', label: 'Customer Satisfaction' },
    ],
    keyFeatures: [
      {
        title: 'Claims Intelligence',
        description:
          'Extract key information from claims documents with intelligent document processing.',
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      },
      {
        title: 'Risk Analysis',
        description:
          'Automatically assess risk factors from application documents and supporting materials.',
        icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
      },
      {
        title: 'Fraud Detection',
        description:
          'Identify potential fraud indicators through document analysis and pattern recognition.',
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      },
      {
        title: 'Policy Management',
        description: 'Organize and search policy documents with intelligent categorization.',
        icon: 'M7 7h10l4 12H3l4-12z',
      },
    ],
  },
  legal: {
    name: 'Legal',
    description:
      'Transform legal research, contract analysis, and case preparation with AI-powered document intelligence. Quickly find relevant precedents, analyze contracts, and extract key legal insights.',
    icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16l-3-3m3 3l3-3',
    keyPoints: [
      'Time-consuming manual document review',
      'Difficulty finding relevant case precedents',
      'Complex contract analysis requirements',
      'Regulatory compliance tracking',
    ],
    helps: [
      'Instant case law and precedent search',
      'Automated contract clause analysis',
      'Regulatory compliance monitoring',
      'Legal research acceleration',
    ],
    useCases: [
      {
        title: 'Contract Analysis',
        description: 'Quickly identify key clauses, obligations, and potential risks in contracts.',
        question: 'Ask: "What are the termination clauses in this agreement?"',
      },
      {
        title: 'Legal Research',
        description: 'Find relevant case law, statutes, and legal precedents instantly.',
        question:
          'Ask: "Find cases similar to intellectual property disputes in technology sector"',
      },
      {
        title: 'Due Diligence',
        description: 'Accelerate due diligence processes with comprehensive document analysis.',
        question: 'Ask: "What are the intellectual property risks in these documents?"',
      },
    ],
    testimonial: {
      quote:
        'Our contract review process has been revolutionized. What used to take days now takes hours, and we catch more potential issues than ever before.',
      author: 'Sarah Williams',
      title: 'Partner, Morrison & Associates Law Firm',
    },
    stats: [
      { value: '70%', label: 'Review Time Reduced' },
      { value: '92%', label: 'Issue Detection Rate' },
      { value: '98%', label: 'Client Satisfaction' },
    ],
    keyFeatures: [
      {
        title: 'Contract Intelligence',
        description:
          'Extract and analyze key contract terms, obligations, and potential risks with AI-powered legal analysis.',
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      },
      {
        title: 'Legal Precedent Search',
        description:
          'Find relevant case law and legal precedents from vast legal databases and case libraries.',
        icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
      },
      {
        title: 'Compliance Monitoring',
        description:
          'Ensure documents meet current legal standards and regulatory requirements across jurisdictions.',
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      },
      {
        title: 'Document Classification',
        description:
          'Automatically categorize and tag legal documents by type, jurisdiction, and practice area.',
        icon: 'M7 7h10l4 12H3l4-12z',
      },
    ],
  },
  manufacturing: {
    name: 'Manufacturing',
    description:
      'Optimize technical documentation and quality processes with intelligent document management for manufacturing operations and compliance.',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    keyPoints: [
      'Complex technical documentation',
      'Quality control processes',
      'Compliance requirements',
      'Process optimization needs',
    ],
    helps: [
      'Technical document organization',
      'Quality process automation',
      'Compliance monitoring',
      'Process optimization insights',
    ],
    useCases: [
      {
        title: 'Technical Specifications',
        description:
          'Quickly search and analyze technical specifications and engineering documents.',
        question: 'Ask: "Find all specifications for steel grade requirements in automotive parts"',
      },
      {
        title: 'Quality Documentation',
        description: 'Organize and search quality control documents and inspection records.',
        question: 'Ask: "What are the quality standards for this product line?"',
      },
      {
        title: 'Process Manuals',
        description: 'Access and analyze process documentation for operational efficiency.',
        question: 'Ask: "Find safety procedures for handling hazardous materials in production"',
      },
    ],
    testimonial: {
      quote:
        'Our technical documentation is now easily searchable and our quality processes are much more efficient. Compliance audits are no longer a headache.',
      author: 'David Kumar',
      title: 'Quality Manager, Precision Manufacturing Inc.',
    },
    stats: [
      { value: '50%', label: 'Documentation Access Time' },
      { value: '85%', label: 'Process Efficiency' },
      { value: '95%', label: 'Compliance Rate' },
    ],
    keyFeatures: [
      {
        title: 'Technical Intelligence',
        description:
          'Search and analyze complex technical specifications with intelligent document processing.',
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      },
      {
        title: 'Quality Management',
        description: 'Organize and track quality control documents and inspection records.',
        icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
      },
      {
        title: 'Process Optimization',
        description: 'Analyze process documentation to identify optimization opportunities.',
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      },
      {
        title: 'Compliance Tracking',
        description: 'Monitor and ensure compliance with manufacturing standards and regulations.',
        icon: 'M7 7h10l4 12H3l4-12z',
      },
    ],
  },
  'real-estate': {
    name: 'Real Estate',
    description:
      'Simplify property documentation and transaction management with intelligent document processing for contracts, leases, and market analysis.',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    keyPoints: [
      'Complex property documentation',
      'Contract and lease management',
      'Market analysis requirements',
      'Due diligence processes',
    ],
    helps: [
      'Property document organization',
      'Contract analysis automation',
      'Market data insights',
      'Due diligence acceleration',
    ],
    useCases: [
      {
        title: 'Property Documents',
        description: 'Organize and search property documents, deeds, and ownership records.',
        question: 'Ask: "Find all property documents for 123 Main Street including deed history"',
      },
      {
        title: 'Contracts & Leases',
        description: 'Analyze purchase agreements, leases, and rental contracts for key terms.',
        question: 'Ask: "What are the key terms in this commercial lease agreement?"',
      },
      {
        title: 'Market Analysis',
        description: 'Review market reports and comparative analyses for investment decisions.',
        question: 'Ask: "What are the market trends for commercial properties in downtown?"',
      },
    ],
    testimonial: {
      quote:
        'Our property transaction process is now much faster and more accurate. We can quickly analyze contracts and identify potential issues before they become problems.',
      author: 'Lisa Thompson',
      title: 'Senior Broker, Metropolitan Realty Group',
    },
    stats: [
      { value: '45%', label: 'Transaction Time Reduced' },
      { value: '88%', label: 'Document Accuracy' },
      { value: '92%', label: 'Client Satisfaction' },
    ],
    keyFeatures: [
      {
        title: 'Property Intelligence',
        description: 'Search and analyze property documents with intelligent content recognition.',
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      },
      {
        title: 'Contract Analysis',
        description: 'Automatically extract and analyze key terms from contracts and leases.',
        icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
      },
      {
        title: 'Market Insights',
        description: 'Analyze market data and reports for informed investment decisions.',
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      },
      {
        title: 'Due Diligence',
        description: 'Streamline due diligence processes with comprehensive document analysis.',
        icon: 'M7 7h10l4 12H3l4-12z',
      },
    ],
  },
  healthcare: {
    name: 'Healthcare',
    description:
      'Improve patient care with intelligent medical document analysis for research studies, treatment protocols, and patient documentation.',
    icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    keyPoints: [
      'Complex medical documentation',
      'Research data management',
      'Treatment protocol organization',
      'Patient record accessibility',
    ],
    helps: [
      'Medical document organization',
      'Research data insights',
      'Protocol standardization',
      'Patient care enhancement',
    ],
    useCases: [
      {
        title: 'Medical Records',
        description: 'Quickly search and analyze patient medical records and history.',
        question: 'Ask: "Find all patients with similar symptoms to hypertension in the last year"',
      },
      {
        title: 'Research Studies',
        description: 'Organize and analyze medical research studies and clinical trial data.',
        question: 'Ask: "What are the latest findings on diabetes treatment protocols?"',
      },
      {
        title: 'Treatment Protocols',
        description: 'Access and compare treatment protocols for specific conditions.',
        question: 'Ask: "What is the standard treatment protocol for cardiac surgery patients?"',
      },
    ],
    testimonial: {
      quote:
        'Our medical research capabilities have been enhanced significantly. We can now quickly access relevant studies and patient data to improve treatment outcomes.',
      author: 'Dr. Rachel Martinez',
      title: 'Chief of Medicine, General Hospital',
    },
    stats: [
      { value: '58%', label: 'Research Time Saved' },
      { value: '91%', label: 'Data Accuracy' },
      { value: '94%', label: 'Care Quality Score' },
    ],
    keyFeatures: [
      {
        title: 'Medical Intelligence',
        description: 'Search and analyze medical documents with healthcare-specific understanding.',
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      },
      {
        title: 'Research Support',
        description: 'Organize and analyze medical research studies and clinical trial data.',
        icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
      },
      {
        title: 'Protocol Management',
        description: 'Access and compare treatment protocols with intelligent categorization.',
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      },
      {
        title: 'Patient Care',
        description: 'Enhance patient care with quick access to relevant medical information.',
        icon: 'M7 7h10l4 12H3l4-12z',
      },
    ],
  },
}

const solution = computed(() => solutions[slug] || null)

useHead({
  title: solution.value
    ? `${solution.value.name} Solutions - Provento.ai`
    : 'Solution Not Found - Provento.ai',
})
</script>
