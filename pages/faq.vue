<template>
  <div>
    <section class="pt-16 pb-24 px-4 sm:px-6 lg:px-8">
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-16">
          <h1 class="text-4xl sm:text-5xl font-bold text-white mb-6">
            Frequently Asked
            <span class="text-primary-400">Questions</span>
          </h1>
          <p class="text-xl text-gray-300">Everything you need to know about Provento.ai</p>
        </div>

        <!-- Search Bar -->
        <div class="mb-8">
          <div class="relative max-w-2xl mx-auto">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UIcon name="heroicons:magnifying-glass" class="h-5 w-5 text-gray-400" />
            </div>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search frequently asked questions..."
              class="block w-full pl-10 pr-3 py-3 border border-dark-700 rounded-lg bg-dark-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
            <div v-if="searchQuery" class="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button @click="clearSearch" class="text-gray-400 hover:text-white transition-colors">
                <UIcon name="heroicons:x-mark" class="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <!-- FAQ Categories -->
        <div class="flex flex-wrap justify-center gap-4 mb-12">
          <button
            v-for="category in categories"
            :key="category"
            @click="selectedCategory = category"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="
              selectedCategory === category
                ? 'bg-primary-500 text-white'
                : 'bg-dark-800 text-gray-300 hover:bg-dark-700'
            "
          >
            {{ category }}
            <span v-if="getCategoryCount(category) > 0" class="ml-2 text-xs opacity-75">
              ({{ getCategoryCount(category) }})
            </span>
          </button>
        </div>

        <!-- Search Results Info -->
        <div v-if="searchQuery" class="mb-6 text-center">
          <p class="text-gray-300">
            <span v-if="filteredFaqs.length === 0">No results found for </span>
            <span v-else
              >{{ filteredFaqs.length }} result{{ filteredFaqs.length === 1 ? '' : 's' }} for
            </span>
            <span class="text-primary-400 font-medium">"{{ searchQuery }}"</span>
          </p>
        </div>

        <!-- FAQ Items -->
        <div v-if="filteredFaqs.length > 0" class="space-y-6">
          <div
            v-for="faq in filteredFaqs"
            :key="faq.id"
            class="card cursor-pointer"
            @click="toggleFaq(faq.id)"
          >
            <div class="flex justify-between items-start">
              <h3 class="text-lg font-semibold text-white pr-4">
                <span v-html="highlightSearchTerm(faq.question)"></span>
              </h3>
              <UIcon
                name="heroicons:chevron-down"
                class="w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0"
                :class="openFaqs.includes(faq.id) ? 'rotate-180' : ''"
              />
            </div>
            <div v-show="openFaqs.includes(faq.id)" class="mt-4 text-gray-300 animate-fade-in">
              <span v-html="highlightSearchTerm(faq.answer)"></span>
            </div>
          </div>
        </div>

        <!-- No Results Message -->
        <div v-else-if="searchQuery || selectedCategory !== 'All'" class="text-center py-12">
          <div
            class="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <UIcon name="heroicons:document-magnifying-glass" class="w-8 h-8 text-gray-400" />
          </div>
          <h3 class="text-xl font-semibold text-white mb-2">No FAQs found</h3>
          <p class="text-gray-300 mb-6">
            <span v-if="searchQuery">
              Try adjusting your search terms or
              <button
                @click="clearSearch"
                class="text-primary-400 hover:text-primary-300 underline"
              >
                clear the search
              </button>
            </span>
            <span v-else> No questions available for this category. </span>
          </p>
          <button
            v-if="selectedCategory !== 'All'"
            @click="selectedCategory = 'All'"
            class="btn-outline"
          >
            View All Categories
          </button>
        </div>

        <!-- Contact CTA -->
        <div class="mt-16 text-center card">
          <h2 class="text-2xl font-bold text-white mb-4">Still have questions?</h2>
          <p class="text-gray-300 mb-6">
            Our team is here to help. Get in touch and we'll respond within 24 hours.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <NuxtLink to="/book-meeting" class="btn-primary"> Book a Demo </NuxtLink>
            <a href="mailto:support@provento.ai" class="btn-outline"> Contact Support </a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// Using default layout

const selectedCategory = ref('All')
const openFaqs = ref<number[]>([])
const searchQuery = ref('')

const categories = ['All', 'Getting Started', 'Features', 'Pricing', 'Security', 'Technical']

const faqs = [
  {
    id: 1,
    category: 'Getting Started',
    question: 'How do I get started with Provento.ai?',
    answer:
      'Simply sign up for a free trial, upload your first document, and start asking questions. Our onboarding process will guide you through the key features.',
  },
  {
    id: 2,
    category: 'Features',
    question: 'What file formats does Provento.ai support?',
    answer:
      'We support PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx), CSV, plain text (.txt), Markdown (.md), and many other common document formats.',
  },
  {
    id: 3,
    category: 'Pricing',
    question: 'Is there a free trial available?',
    answer:
      'Yes! We offer a 14-day free trial with full access to all features. No credit card required to start.',
  },
  {
    id: 4,
    category: 'Security',
    question: 'How secure is my data with Provento.ai?',
    answer:
      'We use enterprise-grade security with AES-256 encryption, SOC 2 compliance, and GDPR compliance. Your documents are processed securely and never used to train our models.',
  },
  {
    id: 5,
    category: 'Features',
    question: 'Can I integrate Provento.ai with other tools?',
    answer:
      'Yes, we offer integrations with Slack, Microsoft Teams, Google Drive, Dropbox, and many other popular business tools. We also provide a REST API for custom integrations.',
  },
  {
    id: 6,
    category: 'Technical',
    question: 'What languages does Provento.ai support?',
    answer:
      'Provento.ai supports over 50 languages for document processing and questioning, including English, Spanish, French, German, Chinese, Japanese, and many more.',
  },
  {
    id: 7,
    category: 'Pricing',
    question: 'Can I change my plan anytime?',
    answer:
      'Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and billing is prorated accordingly.',
  },
  {
    id: 8,
    category: 'Features',
    question: 'How accurate are the AI responses?',
    answer:
      'Our AI is highly accurate, built on state-of-the-art language models. However, we always recommend reviewing AI responses for critical decisions. The accuracy improves with document quality and question specificity.',
  },
  {
    id: 9,
    category: 'Getting Started',
    question: 'Do you offer training or support?',
    answer:
      'Yes! We provide comprehensive documentation, video tutorials, and email support for all users. Enterprise customers also get dedicated support and training sessions.',
  },
  {
    id: 10,
    category: 'Technical',
    question: 'What are the system requirements?',
    answer:
      'Provento.ai is a cloud-based platform that works in any modern web browser. No special software or hardware requirements needed.',
  },
  {
    id: 11,
    category: 'Security',
    question: 'Where is my data stored?',
    answer:
      'Your data is stored in secure, encrypted cloud servers with redundancy across multiple data centers. We offer data residency options for enterprise customers.',
  },
  {
    id: 12,
    category: 'Pricing',
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit cards, bank transfers, and can accommodate purchase orders for enterprise customers.',
  },
]

const filteredFaqs = computed(() => {
  let filtered = faqs

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(
      (faq) =>
        faq.question.toLowerCase().includes(query) || faq.answer.toLowerCase().includes(query),
    )
  }

  // Filter by category
  if (selectedCategory.value !== 'All') {
    filtered = filtered.filter((faq) => faq.category === selectedCategory.value)
  }

  return filtered
})

const getCategoryCount = (category: string) => {
  if (category === 'All') {
    return searchQuery.value ? filteredFaqs.value.length : faqs.length
  }

  let categoryFaqs = faqs.filter((faq) => faq.category === category)

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    categoryFaqs = categoryFaqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(query) || faq.answer.toLowerCase().includes(query),
    )
  }

  return categoryFaqs.length
}

const highlightSearchTerm = (text: string) => {
  if (!searchQuery.value.trim()) return text

  const query = searchQuery.value.trim()
  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(
    regex,
    '<mark class="bg-primary-400/30 text-primary-100 px-1 rounded">$1</mark>',
  )
}

const clearSearch = () => {
  searchQuery.value = ''
}

const toggleFaq = (id: number) => {
  const index = openFaqs.value.indexOf(id)
  if (index > -1) {
    openFaqs.value.splice(index, 1)
  } else {
    openFaqs.value.push(id)
  }
}

// Auto-expand FAQs when searching
watch(searchQuery, (newQuery) => {
  if (newQuery.trim()) {
    // Open all matching FAQs when searching
    openFaqs.value = filteredFaqs.value.map((faq) => faq.id)
  } else {
    // Close all FAQs when clearing search
    openFaqs.value = []
  }
})

useHead({
  title: 'FAQ - Provento.ai',
})
</script>
