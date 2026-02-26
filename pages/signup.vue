<template>
  <div class="min-h-screen bg-black flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
    <div class="max-w-2xl w-full space-y-8">
      <!-- Logo and header -->
      <div class="text-center">
        <NuxtLink to="/" class="inline-flex items-center space-x-3 mb-6 justify-center">
          <img
            src="~/assets/media/logo.svg"
            alt="Provento Logo"
            class="w-10 h-10"
          />
          <span class="text-white text-2xl font-semibold">provento.ai</span>
        </NuxtLink>
        <h2 class="text-3xl font-bold text-white">Create your account</h2>
        <p class="mt-2 text-gray-400">Join thousands of teams managing their artifacts</p>
      </div>

      <!-- AWS Session Expiry Message -->
      <div
        v-if="isFromAws"
        class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-2"
      >
        <div class="flex items-start space-x-3">
          <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div class="text-sm text-blue-300">
            <p class="font-medium mb-2">AWS Session Expiry Notice</p>
            <p>Your AWS session is valid for 2 hours.</p>
            <p>Please complete your organization registration within this time.</p>
            <p>If the session expires, you will need to restart the setup from the AWS flow.</p>
          </div>
        </div>
      </div>

      <AuthSignInWithOAuth authView="signup" />

      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-dark-700" />
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-black text-gray-400">or proceed with</span>
        </div>
      </div>

      <!-- Signup form using UForm -->
      <UForm ref="formRef" :schema="schema" :state="state" class="space-y-8" @submit="onSubmit">
        <!-- Personal Information Section -->
        <div class="space-y-6">
          <h3 class="text-lg font-semibold text-white">Personal Information</h3>

          <!-- Name and Company Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Full Name -->
            <UFormGroup name="name" label="Full Name" required>
              <UInput
                v-model="state.name"
                eager-validation
                inputClass="custom-input"
                placeholder="John Doe"
              />
            </UFormGroup>

            <!-- Company -->
            <UFormGroup name="company" label="Company" required>
              <UInput
                v-model="state.company"
                eager-validation
                inputClass="custom-input"
                placeholder="Your company name"
              />
            </UFormGroup>
          </div>

          <!-- Email -->
          <UFormGroup name="email" label="Email address" required>
            <UInput
              v-model="state.email"
              type="email"
              eager-validation
              inputClass="custom-input"
              placeholder="john@company.com"
            />
          </UFormGroup>

          <!-- Phone Number -->
          <UFormGroup name="phone" label="Phone Number" required>
            <LibVueTelInput
              ref="phoneRef"
              v-model="state.phone"
              placeholder="Your phone number"
              defaultCountry="us"
            />
          </UFormGroup>
        </div>

        <!-- Organization Details Section -->
        <div class="space-y-6 border-t border-dark-700 pt-8">
          <h3 class="text-lg font-semibold text-white">Organization Details</h3>

          <!-- Country and Tax ID on single line -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Country Selection -->
            <UFormGroup name="country" label="Country" required>
              <USelect
                v-model="state.country"
                :options="countryOptions"
                eager-validation
                selectClass="custom-select"
                placeholder="Select country"
                option-attribute="label"
              />
            </UFormGroup>

            <!-- Dynamic Tax ID Field -->
            <UFormGroup
              v-if="state.country && currentCountryTaxInfo"
              name="taxId"
              :label="currentCountryTaxInfo.taxIdLabel"
              required
            >
              <UInput
                v-model="state.taxId"
                eager-validation
                inputClass="custom-input"
                :placeholder="currentCountryTaxInfo.taxIdPlaceholder"
              />
            </UFormGroup>
          </div>
        </div>

        <!-- Security Section -->
        <div class="space-y-6 border-t border-dark-700 pt-8">
          <h3 class="text-lg font-semibold text-white">Security</h3>

          <!-- Password and Confirm Password Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Password -->
            <div>
              <UFormGroup name="password" label="Password" required>
                <div class="relative">
                  <UInput
                    v-model="state.password"
                    :type="showPassword ? 'text' : 'password'"
                    eager-validation
                    inputClass="custom-input pr-12"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-300 transition-colors"
                    @click="togglePasswordVisibility"
                  >
                    <UIcon
                      :name="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                      class="h-5 w-5"
                    />
                  </button>
                </div>
              </UFormGroup>
            </div>

            <!-- Confirm Password -->
            <div>
              <UFormGroup name="confirmPassword" label="Confirm Password" required>
                <div class="relative">
                  <UInput
                    v-model="state.confirmPassword"
                    :type="showPassword ? 'text' : 'password'"
                    eager-validation
                    inputClass="custom-input pr-12"
                    placeholder="Re-enter your password"
                  />
                  <button
                    type="button"
                    class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-300 transition-colors"
                    @click="togglePasswordVisibility"
                  >
                    <UIcon
                      :name="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                      class="h-5 w-5"
                    />
                  </button>
                </div>
              </UFormGroup>
            </div>
          </div>

          <!-- Password Validation Indicators -->
          <div class="mt-3 space-y-2 p-4 bg-dark-800 rounded-lg">
            <div class="text-xs font-medium text-gray-300 mb-3">Password Requirements:</div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <!-- Length requirement -->
              <div class="flex items-center space-x-2">
                <UIcon
                  :name="
                    passwordValidation.hasMinLength
                      ? 'i-heroicons-check-circle'
                      : 'i-heroicons-x-circle'
                  "
                  :class="passwordValidation.hasMinLength ? 'text-green-400' : 'text-red-400'"
                  class="w-4 h-4 flex-shrink-0"
                />
                <span
                  :class="passwordValidation.hasMinLength ? 'text-green-400' : 'text-gray-400'"
                  class="text-xs"
                >
                  At least 8 characters
                </span>
              </div>

              <!-- Uppercase requirement -->
              <div class="flex items-center space-x-2">
                <UIcon
                  :name="
                    passwordValidation.hasUppercase
                      ? 'i-heroicons-check-circle'
                      : 'i-heroicons-x-circle'
                  "
                  :class="passwordValidation.hasUppercase ? 'text-green-400' : 'text-red-400'"
                  class="w-4 h-4 flex-shrink-0"
                />
                <span
                  :class="passwordValidation.hasUppercase ? 'text-green-400' : 'text-gray-400'"
                  class="text-xs"
                >
                  One uppercase letter
                </span>
              </div>

              <!-- Lowercase requirement -->
              <div class="flex items-center space-x-2">
                <UIcon
                  :name="
                    passwordValidation.hasLowercase
                      ? 'i-heroicons-check-circle'
                      : 'i-heroicons-x-circle'
                  "
                  :class="passwordValidation.hasLowercase ? 'text-green-400' : 'text-red-400'"
                  class="w-4 h-4 flex-shrink-0"
                />
                <span
                  :class="passwordValidation.hasLowercase ? 'text-green-400' : 'text-gray-400'"
                  class="text-xs"
                >
                  One lowercase letter
                </span>
              </div>

              <!-- Number requirement -->
              <div class="flex items-center space-x-2">
                <UIcon
                  :name="
                    passwordValidation.hasNumber
                      ? 'i-heroicons-check-circle'
                      : 'i-heroicons-x-circle'
                  "
                  :class="passwordValidation.hasNumber ? 'text-green-400' : 'text-red-400'"
                  class="w-4 h-4 flex-shrink-0"
                />
                <span
                  :class="passwordValidation.hasNumber ? 'text-green-400' : 'text-gray-400'"
                  class="text-xs"
                >
                  One number
                </span>
              </div>

              <!-- Special character requirement -->
              <div class="flex items-center space-x-2">
                <UIcon
                  :name="
                    passwordValidation.hasSpecialChar
                      ? 'i-heroicons-check-circle'
                      : 'i-heroicons-x-circle'
                  "
                  :class="passwordValidation.hasSpecialChar ? 'text-green-400' : 'text-red-400'"
                  class="w-4 h-4 flex-shrink-0"
                />
                <span
                  :class="passwordValidation.hasSpecialChar ? 'text-green-400' : 'text-gray-400'"
                  class="text-xs"
                >
                  One special character (@$!%*?&)
                </span>
              </div>
            </div>

            <!-- Passwords match indicator -->
            <div class="flex items-center space-x-2 mt-3 pt-3 border-t border-dark-700">
              <UIcon
                :name="passwordsMatch ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                :class="passwordsMatch ? 'text-green-400' : 'text-red-400'"
                class="w-4 h-4 flex-shrink-0"
              />
              <span :class="passwordsMatch ? 'text-green-400' : 'text-gray-400'" class="text-xs">
                Passwords match
              </span>
            </div>

            <!-- Overall strength indicator -->
            <div class="mt-3 pt-3 border-t border-dark-700">
              <div class="flex items-center space-x-2">
                <span class="text-xs font-medium text-gray-300">Strength:</span>
                <div class="flex space-x-1">
                  <div
                    v-for="i in 5"
                    :key="i"
                    class="w-6 h-1 rounded-full"
                    :class="
                      i <= passwordStrength ? getStrengthColor(passwordStrength) : 'bg-gray-600'
                    "
                  ></div>
                </div>
                <span class="text-xs font-medium" :class="getStrengthTextColor(passwordStrength)">
                  {{ getStrengthText(passwordStrength) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Terms Agreement -->
        <div class="flex items-start space-x-3 border-t border-dark-700 pt-8">
          <input
            id="terms"
            v-model="agreeToTerms"
            type="checkbox"
            class="h-4 w-4 mt-1 text-primary-500 bg-dark-800 border-dark-600 rounded focus:ring-primary-500 focus:ring-2"
          />
          <label for="terms" class="text-sm text-gray-300">
            I agree to the
            <NuxtLink to="/terms-of-service" class="text-primary-400 hover:text-primary-300"
              >Terms of Service</NuxtLink
            >
            and
            <NuxtLink to="/privacy-policy" class="text-primary-400 hover:text-primary-300"
              >Privacy Policy</NuxtLink
            >
          </label>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="authStore.loading"
          class="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          @click="validatePhoneField"
        >
          <span v-if="authStore.loading" class="flex items-center justify-center">
            <UIcon
              name="i-heroicons-arrow-path"
              class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            />
            Creating account...
          </span>
          <span v-else>Create Account</span>
        </button>
      </UForm>

      <!-- Divider -->
      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-dark-700" />
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-black text-gray-400">Already have an account?</span>
        </div>
      </div>

      <!-- Login link -->
      <div class="space-y-2">
        <NuxtLink to="/login" class="btn-outline w-full block text-center"> Sign In Instead </NuxtLink>
      </div>
      <ConfirmPopup
        :isOpen="showWelcomeModal"
        title="Thank you for signing up!"
        message="A welcome email has been sent to your email address. Please check your inbox."
        type="success"
        confirmText="Go to Sign in"
        cancelText="Close"
        @confirm="handleWelcomeConfirm"
        @update:isOpen="(val) => (showWelcomeModal = val)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Sign Up - provento.ai' })
import { useAuthStore } from '~/stores/auth/index'
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'
import ConfirmPopup from '~/components/ui/ConfirmPopup.vue'
import { useRoute } from 'vue-router'
import {
  COUNTRY_OPTIONS,
  validateTaxId,
  getTaxIdErrorMessage,
  getCountryTaxInfo,
} from '~/utils/countries'

definePageMeta({
  layout: 'minimal',
  middleware: 'guest',
})

const authStore = useAuthStore()
const { showNotification } = useNotification()
const showWelcomeModal = ref(false)

// Capture marketplace token from query string to send as registrationToken
const route = useRoute()
const registrationToken = ref<string | null>(null)

// initialize from query on mount and watch for changes
onMounted(() => {
  try {
    const token = (route.query['x-amzn-marketplace-token'] ||
      route.query['x_amzn_marketplace_token']) as string | undefined
    if (token) registrationToken.value = String(token)
  } catch (e) {
    registrationToken.value = null
  }
})

// react to query changes (in case token appears after navigation)
watch(
  () => route.query,
  (q) => {
    const token = (q['x-amzn-marketplace-token'] || q['x_amzn_marketplace_token']) as
      | string
      | undefined
    registrationToken.value = token ? String(token) : null
  },
)

// Check if user is coming from AWS flow
const isFromAws = computed(() => {
  return route.query.from === 'aws'
})

// Form reference
const formRef = ref()
const phoneRef = ref()

// Password visibility toggle
const showPassword = ref(false)
const agreeToTerms = ref(false)

// Password validation reactive state
const passwordValidation = computed(() => {
  const password = state.password
  return {
    hasMinLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[@$!%*?&]/.test(password),
  }
})

const passwordsMatch = computed(() => {
  return (
    state.password === state.confirmPassword &&
    state.password.length > 0 &&
    state.confirmPassword.length > 0
  )
})

// Password strength calculation
const passwordStrength = computed(() => {
  const validations = passwordValidation.value
  const checks = [
    validations.hasMinLength,
    validations.hasUppercase,
    validations.hasLowercase,
    validations.hasNumber,
    validations.hasSpecialChar,
  ]
  return checks.filter(Boolean).length
})

// Helper functions for strength display
const getStrengthColor = (strength: number) => {
  if (strength <= 1) return 'bg-red-500'
  if (strength <= 2) return 'bg-orange-500'
  if (strength <= 3) return 'bg-yellow-500'
  if (strength <= 4) return 'bg-blue-500'
  return 'bg-green-500'
}

const getStrengthTextColor = (strength: number) => {
  if (strength <= 1) return 'text-red-400'
  if (strength <= 2) return 'text-orange-400'
  if (strength <= 3) return 'text-yellow-400'
  if (strength <= 4) return 'text-blue-400'
  return 'text-green-400'
}

const getStrengthText = (strength: number) => {
  if (strength <= 1) return 'Very Weak'
  if (strength <= 2) return 'Weak'
  if (strength <= 3) return 'Fair'
  if (strength <= 4) return 'Good'
  return 'Strong'
}

// Zod schema for form validation with country-specific tax ID messages
const getSchema = (selectedCountry: string) => {
  const countryTaxInfo = getCountryTaxInfo(selectedCountry)
  const taxIdLabel = countryTaxInfo?.taxIdLabel || 'Tax ID'
  const isOthersCountry = selectedCountry === 'others'

  return z
    .object({
      name: z.string().min(1, 'Full name is required').max(255, 'Name too long'),
      company: z.string().min(1, 'Company name is required').max(255, 'Company name too long'),
      email: z.string().email('Invalid email address').max(255, 'Email too long'),
      country: z.string().min(1, 'Country is required'),
      taxId: isOthersCountry
        ? z
            .string()
            .min(5, `${taxIdLabel} must be at least 5 characters`)
            .max(50, 'Tax ID too long')
        : z.string().min(1, `${taxIdLabel} is required`).max(50, 'Tax ID too long'),
      password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        ),
      confirmPassword: z.string().min(1, 'Please confirm your password'),
      // phone validation handled at component level
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    })
    .refine((data) => validateTaxId(data.country, data.taxId), {
      message: `Invalid ${taxIdLabel} format`,
      path: ['taxId'],
    })
}

const schema = computed(() => getSchema(state.country))

type Schema = z.infer<ReturnType<typeof getSchema>>

const state = reactive({
  name: '',
  company: '',
  email: '',
  country: 'usa',
  taxId: '',
  password: '',
  confirmPassword: '',
  phone: null as string | null,
})

// Country options computed from countries configuration
const countryOptions = computed(() => COUNTRY_OPTIONS)

// Get current country tax info
const currentCountryTaxInfo = computed(() => {
  return getCountryTaxInfo(state.country)
})

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

// Clear tax ID and validation errors when country changes
watch(
  () => state.country,
  () => {
    state.taxId = ''
    formRef.value?.clear('taxId')
  },
)

// Function to validate phone and update UI
function validatePhoneField() {
  const phoneValidation = phoneRef.value?.handlePhoneValidation?.(true)
  return phoneValidation?.status || false
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  // Validate terms agreement first
  if (!agreeToTerms.value) {
    authStore.setError('Please agree to the terms of service')
    showNotification('Please agree to the terms of service', 'error')
    return
  }

  // Validate phone number
  if (!validatePhoneField()) {
    authStore.setError('Please enter a valid phone number')
    showNotification('Please enter a valid phone number', 'error')
    return
  }

  try {
    // Get the phone number with country code from the phone component
    const phoneData = phoneRef.value?.phoneData
    const phoneNumberWithCountryCode = phoneData?.number || state.phone || ''

    // Prepare signup data
    const signupData: Record<string, any> = {
      name: event.data.name.trim(),
      email: event.data.email.trim().toLowerCase(),
      password: event.data.password,
      wpNumber: phoneNumberWithCountryCode,
      companyName: event.data.company.trim(),
      country: event.data.country,
      taxId: event.data.taxId.trim(),
    }

    // Attach registrationToken if present (from AWS marketplace flow)
    if (registrationToken.value) signupData.registrationToken = registrationToken.value

    // Call auth store signup method
    await authStore.signup(signupData)

    // Show success notification
    showNotification('Account created successfully! Please sign in.', 'success')

    // Show welcome modal with instructions to check email
    showWelcomeModal.value = true

    // Reset form on success
    Object.assign(state, {
      name: '',
      company: '',
      email: '',
      country: 'usa',
      taxId: '',
      password: '',
      confirmPassword: '',
      phone: null,
    })
    agreeToTerms.value = false

    // Reset phone component
    if (phoneRef.value && phoneRef.value.resetPhoneField) {
      phoneRef.value.resetPhoneField()
    }

    // Do not redirect immediately; wait for user to confirm the modal
    // Modal confirm handler will navigate to login
  } catch (error: any) {
    // Show error notification
    console.error('Signup failed:', error?.message)
  }
}

function handleWelcomeConfirm() {
  showWelcomeModal.value = false
  navigateTo('/login')
}
</script>

<style scoped>
/* Custom input styles to match book-meeting page */
:deep(.custom-input) {
  background-color: #1e293b !important;
  color: #e2e8f0 !important;
  font-size: 0.875rem !important;
  padding: 0.875rem 1rem !important;
  transition: all 0.2s ease-in-out !important;
  width: 100% !important;
  border-radius: 0.5rem !important;
}

:deep(.custom-input:hover) {
  background-color: #1e293b !important;
}

:deep(.custom-input:focus) {
  background-color: #1e293b !important;
  outline: none !important;
}

:deep(.custom-input::placeholder) {
  color: #64748b !important;
}

/* Custom select styles to match input fields */
:deep(.custom-select) {
  background-color: #1e293b !important;
  color: #e2e8f0 !important;
  font-size: 0.875rem !important;
  padding: 0.875rem 1rem !important;
  transition: all 0.2s ease-in-out !important;
  width: 100% !important;
  border-radius: 0.5rem !important;
}

:deep(.custom-select:hover) {
  background-color: #1e293b !important;
}

:deep(.custom-select:focus) {
  background-color: #1e293b !important;
  outline: none !important;
}

/* Vue-tel-input custom styling to match design */
:deep(.vue-tel-input) {
  border: 1px solid #334155;
  border-radius: 0.5rem;
  background-color: #1e293b;
  transition: all 0.2s ease-in-out;
  box-shadow: none;
  position: relative;
  overflow: visible;
}

:deep(.vue-tel-input:hover) {
  border-color: #475569;
  background-color: #1e293b;
}

:deep(.vue-tel-input:focus-within) {
  border-color: #3b82f6;
  background-color: #1e293b;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

:deep(.vue-tel-input.errorState) {
  border: 2px solid #ef4444 !important;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2) !important;
}

:deep(.vue-tel-input .vti__dropdown) {
  background-color: #1e293b;
  border-right: 1px solid #334155;
  border-radius: 0.5rem 0 0 0.5rem;
}

:deep(.vue-tel-input .vti__dropdown:hover) {
  background-color: #1e293b;
}

:deep(.vue-tel-input .vti__dropdown-list) {
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

:deep(.vue-tel-input .vti__dropdown-item) {
  color: #e2e8f0;
  padding: 8px 12px;
}

:deep(.vue-tel-input .vti__dropdown-item:hover) {
  background-color: rgba(59, 130, 246, 0.1);
}

:deep(.vue-tel-input .vti__dropdown-item.highlighted) {
  background-color: rgba(59, 130, 246, 0.2);
}

:deep(.vue-tel-input .vti__selection) {
  color: #e2e8f0;
  font-size: 0.875rem;
}

:deep(.vue-tel-input .vti__input) {
  background-color: transparent !important;
  border: none !important;
  color: #e2e8f0 !important;
  font-size: 0.875rem;
  padding: 0.875rem 1rem !important;
}

:deep(.vue-tel-input .vti__input::placeholder) {
  color: #9ca3af;
}

:deep(.vue-tel-input .vti__input:focus) {
  outline: none !important;
  box-shadow: none !important;
}

:deep(.vue-tel-input .vti__input) {
  pointer-events: all !important;
  user-select: text !important;
  cursor: text !important;
}

:deep(.vue-tel-input .vti__dropdown-arrow) {
  color: #9ca3af;
}

/* Search box styling */
:deep(.vti__search-box) {
  background-color: rgba(31, 41, 55, 0.9) !important;
  border: 1px solid rgba(75, 85, 99, 0.7) !important;
  color: #f3f4f6 !important;
  border-radius: 0.5rem !important;
  margin: 8px !important;
  padding: 8px 12px !important;
  font-size: 14px !important;
  width: calc(100% - 16px) !important;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1) !important;
}

:deep(.vti__search-box::placeholder) {
  color: #9ca3af !important;
}

:deep(.vti__search-box:focus) {
  outline: none !important;
  border-color: #3b82f6 !important;
  background-color: rgba(37, 47, 63, 1) !important;
  box-shadow:
    0 0 0 2px rgba(59, 130, 246, 0.1),
    inset 0 1px 2px rgba(0, 0, 0, 0.1) !important;
}

:deep(.vue-tel-input .vti__dropdown-list) {
  background-color: rgba(17, 24, 39, 0.95) !important;
  border: 1px solid rgba(55, 65, 81, 0.6) !important;
  border-radius: 0.5rem !important;
  backdrop-filter: blur(10px) !important;
  max-height: 250px !important;
  overflow-y: auto !important;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3) !important;
  z-index: 50 !important;
}
</style>
