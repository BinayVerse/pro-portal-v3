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
                <select id="companySize" v-model="form.companySize" class="input-field w-full">
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
                <select id="useCase" v-model="form.useCase" class="input-field w-full">
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
                  <UIcon
                    name="i-heroicons-arrow-path"
                    class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  />
                  Booking a Demo...
                </span>
                <span v-else>Book a Demo</span>
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
                  <UIcon
                    name="i-heroicons-check"
                    class="w-5 h-5 text-primary-400 mt-0.5 mr-3 flex-shrink-0"
                  />
                  <span class="text-gray-300">{{ item }}</span>
                </li>
              </ul>
            </div>

            <!-- Demo Stats -->
            <div class="card">
              <h3 class="text-xl font-bold text-white mb-4">Demo Details</h3>
              <div class="space-y-4">
                <div class="flex items-center">
                  <UIcon name="i-heroicons-clock" class="w-5 h-5 text-primary-400 mr-3" />
                  <span class="text-gray-300">30-45 minutes</span>
                </div>
                <div class="flex items-center">
                  <UIcon name="i-heroicons-video-camera" class="w-5 h-5 text-primary-400 mr-3" />
                  <span class="text-gray-300">Live video call</span>
                </div>
                <div class="flex items-center">
                  <UIcon name="i-heroicons-document-text" class="w-5 h-5 text-primary-400 mr-3" />
                  <span class="text-gray-300">Custom artefact demo</span>
                </div>
                <div class="flex items-center">
                  <UIcon
                    name="i-heroicons-question-mark-circle"
                    class="w-5 h-5 text-primary-400 mr-3"
                  />
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
                <a
                  href="mailto:sales@provento.ai"
                  class="flex items-center text-primary-400 hover:text-primary-300 transition-colors"
                >
                  <UIcon name="i-heroicons-envelope" class="w-5 h-5 mr-3" />
                  sales@provento.ai
                </a>
                <a
                  href="tel:+1-555-0123"
                  class="flex items-center text-primary-400 hover:text-primary-300 transition-colors"
                >
                  <UIcon name="i-heroicons-phone" class="w-5 h-5 mr-3" />
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
  layout: 'main',
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
  message: '',
})

const demoExpectations = [
  'Personalized demo based on your use case',
  'Live document upload and questioning',
  'Integration walkthrough',
  'Pricing and plan discussion',
  'Next steps and trial setup',
]

const handleSubmit = async () => {
  loading.value = true

  try {
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 2000))

    showNotification(
      "Demo request submitted successfully! We'll contact you within 24 hours to schedule your personalized demo.",
      'success',
      {
        title: 'Demo Requested',
        duration: 8000,
      },
    )

    // Reset form
    form.value = {
      firstName: '',
      lastName: '',
      email: '',
      company: '',
      jobTitle: '',
      companySize: '',
      useCase: '',
      message: '',
    }
  } catch (error) {
    showNotification(
      'Failed to submit demo request. Please try again or contact us directly.',
      'error',
    )
  } finally {
    loading.value = false
  }
}
</script>
