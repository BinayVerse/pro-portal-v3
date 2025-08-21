<template>
  <div>
    <section class="pt-16 pb-24 px-4 sm:px-6 lg:px-8">
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-16">
          <h1 class="text-4xl sm:text-5xl font-bold text-white mb-6">
            Book a
            <span class="text-primary-400">Demo</span>
          </h1>
          <p class="text-xl text-gray-300">
            See Provento.ai in action and discover how it can transform your document workflow
          </p>
        </div>

        <div class="grid lg:grid-cols-2 gap-12">
          <!-- Demo Form -->
          <div class="card">
            <h2 class="text-2xl font-bold text-white mb-6">Schedule Your Demo</h2>
            <form @submit.prevent="handleSubmit" class="space-y-6">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label for="firstName" class="block text-sm font-medium text-gray-300 mb-2">
                    First Name *
                  </label>
                  <input
                    id="firstName"
                    v-model="form.firstName"
                    type="text"
                    required
                    class="input-field w-full"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label for="lastName" class="block text-sm font-medium text-gray-300 mb-2">
                    Last Name *
                  </label>
                  <input
                    id="lastName"
                    v-model="form.lastName"
                    type="text"
                    required
                    class="input-field w-full"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label for="email" class="block text-sm font-medium text-gray-300 mb-2">
                  Work Email *
                </label>
                <input
                  id="email"
                  v-model="form.email"
                  type="email"
                  required
                  class="input-field w-full"
                  placeholder="john@company.com"
                />
              </div>

              <div>
                <label for="company" class="block text-sm font-medium text-gray-300 mb-2">
                  Company *
                </label>
                <input
                  id="company"
                  v-model="form.company"
                  type="text"
                  required
                  class="input-field w-full"
                  placeholder="Your company name"
                />
              </div>

              <div>
                <label for="jobTitle" class="block text-sm font-medium text-gray-300 mb-2">
                  Job Title
                </label>
                <input
                  id="jobTitle"
                  v-model="form.jobTitle"
                  type="text"
                  class="input-field w-full"
                  placeholder="Your role"
                />
              </div>

              <div>
                <label for="companySize" class="block text-sm font-medium text-gray-300 mb-2">
                  Company Size
                </label>
                <select
                  id="companySize"
                  v-model="form.companySize"
                  class="input-field w-full"
                >
                  <option value="">Select company size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-1000">201-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>

              <div>
                <label for="useCase" class="block text-sm font-medium text-gray-300 mb-2">
                  Primary Use Case
                </label>
                <select
                  id="useCase"
                  v-model="form.useCase"
                  class="input-field w-full"
                >
                  <option value="">Select use case</option>
                  <option value="legal">Legal document analysis</option>
                  <option value="hr">HR documentation</option>
                  <option value="finance">Financial documents</option>
                  <option value="research">Research and analysis</option>
                  <option value="customer-support">Customer support</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label for="message" class="block text-sm font-medium text-gray-300 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  id="message"
                  v-model="form.message"
                  rows="4"
                  class="input-field w-full"
                  placeholder="Tell us about your specific needs or questions..."
                ></textarea>
              </div>

              <button
                type="submit"
                :disabled="loading"
                class="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="loading" class="flex items-center justify-center">
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Booking Demo...
                </span>
                <span v-else>Book Demo</span>
              </button>
            </form>
          </div>

          <!-- Demo Information -->
          <div class="space-y-8">
            <!-- What to Expect -->
            <div class="card">
              <h3 class="text-xl font-bold text-white mb-4">What to Expect</h3>
              <ul class="space-y-3">
                <li v-for="item in demoExpectations" :key="item" class="flex items-start">
                  <svg class="w-5 h-5 text-primary-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span class="text-gray-300">{{ item }}</span>
                </li>
              </ul>
            </div>

            <!-- Demo Stats -->
            <div class="card">
              <h3 class="text-xl font-bold text-white mb-4">Demo Details</h3>
              <div class="space-y-4">
                <div class="flex items-center">
                  <svg class="w-5 h-5 text-primary-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span class="text-gray-300">30-45 minutes</span>
                </div>
                <div class="flex items-center">
                  <svg class="w-5 h-5 text-primary-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                  <span class="text-gray-300">Live video call</span>
                </div>
                <div class="flex items-center">
                  <svg class="w-5 h-5 text-primary-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <span class="text-gray-300">Custom document demo</span>
                </div>
                <div class="flex items-center">
                  <svg class="w-5 h-5 text-primary-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span class="text-gray-300">Q&A session</span>
                </div>
              </div>
            </div>

            <!-- Contact Alternative -->
            <div class="card">
              <h3 class="text-xl font-bold text-white mb-4">Prefer to Talk First?</h3>
              <p class="text-gray-300 mb-4">
                Have questions before booking? Our sales team is happy to help.
              </p>
              <div class="space-y-3">
                <a href="mailto:sales@provento.ai" class="flex items-center text-primary-400 hover:text-primary-300 transition-colors">
                  <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  sales@provento.ai
                </a>
                <a href="tel:+1-555-0123" class="flex items-center text-primary-400 hover:text-primary-300 transition-colors">
                  <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                  </svg>
                  +1 (555) 012-3456
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'main'
})

const { showNotification } = useNotification()
const loading = ref(false)

const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  company: '',
  jobTitle: '',
  companySize: '',
  useCase: '',
  message: ''
})

const demoExpectations = [
  'Personalized demo based on your use case',
  'Live document upload and questioning',
  'Integration walkthrough',
  'Pricing and plan discussion',
  'Next steps and trial setup'
]

const handleSubmit = async () => {
  loading.value = true
  
  try {
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    showNotification('Demo request submitted successfully! We\'ll contact you within 24 hours to schedule your personalized demo.', 'success', {
      title: 'Demo Requested',
      duration: 8000
    })
    
    // Reset form
    form.value = {
      firstName: '',
      lastName: '',
      email: '',
      company: '',
      jobTitle: '',
      companySize: '',
      useCase: '',
      message: ''
    }
  } catch (error) {
    showNotification('Failed to submit demo request. Please try again or contact us directly.', 'error')
  } finally {
    loading.value = false
  }
}
</script>
