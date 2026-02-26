<template>
  <div class="space-y-6">
    <!-- Profile + Billing Card -->
    <UCard class="mb-12">
      <!-- Card Header -->
      <template #header>
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
          <div class="flex items-center gap-3 min-w-0">
            <UAvatar :text="initials" size="lg" color="primary" class="flex-shrink-0" />
            <div class="leading-tight min-w-0">
              <p class="text-sm sm:text-base font-semibold truncate">
                {{ isEditing ? state.name || state.email : profile.name || profile.email }}
              </p>
              <p class="text-xs text-gray-400 truncate">
                {{ isEditing ? state.company || 'No company' : profile.company || 'No company' }}
              </p>
            </div>
          </div>
          <div v-if="!isEditing" class="flex-shrink-0">
            <UButton color="primary" icon="i-heroicons-pencil-square" @click="startEdit" class="w-full sm:w-auto">
              Edit Profile
            </UButton>
          </div>
        </div>
      </template>

      <!-- Profile completion alert -->
      <UAlert
        v-if="!isProfileComplete"
        icon="i-heroicons-exclamation-triangle"
        color="yellow"
        variant="subtle"
        class="mb-4"
        title="Completing your profile is mandatory to access the application."
      >
        Completing your profile is mandatory to access the application.
      </UAlert>

      <!-- VIEW MODE -->
      <div v-if="!isEditing" class="space-y-6 sm:space-y-8">
        <!-- Profile section -->
        <section class="space-y-4">
          <h3 class="text-base sm:text-lg font-semibold">Profile Details</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <p class="text-xs text-gray-400">Full name</p>
              <p class="mt-1">{{ profile.name || '-' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400">Email</p>
              <p class="mt-1">{{ profile.email || '-' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400">Contact number</p>
              <p class="mt-1">{{ profile.contact_number || '-' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400">Primary contact</p>
              <p class="mt-1">{{ profile.primary_contact ? 'Yes' : 'No' }}</p>
            </div>
          </div>
        </section>

        <!-- Organization Details section -->
        <section class="space-y-4 mt-6 sm:mt-8">
          <div class="border-t border-gray-700" />
          <div class="flex items-center justify-between">
            <h3 class="text-base sm:text-lg font-semibold">Organization Details</h3>
          </div>
          <div class="border-t border-gray-700" />
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <p class="text-xs text-gray-400">Country</p>
              <p class="mt-1">{{ (profile as any).org_country ? COUNTRY_OPTIONS.find(c => c.value === (profile as any).org_country)?.label || (profile as any).org_country : '-' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400">{{ (profile as any).org_country ? getCountryTaxInfo((profile as any).org_country)?.taxIdLabel || 'Tax ID' : 'Tax ID' }}</p>
              <p class="mt-1">{{ (profile as any).org_tax_id || '-' }}</p>
            </div>
          </div>
        </section>

        <!-- Billing section -->
        <section class="space-y-4 mt-6 sm:mt-8">
          <div class="border-t border-gray-700" />
          <div class="flex items-center justify-between">
            <h3 class="text-base sm:text-lg font-semibold">Billing Address</h3>
          </div>
          <div class="border-t border-gray-700" />

          <div v-if="hasBillingAddress" class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <p class="text-xs text-gray-400">Address line 1</p>
              <p class="mt-1">{{ profile.billing_address?.address_line1 || '-' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400">Address line 2</p>
              <p class="mt-1">{{ profile.billing_address?.address_line2 || '-' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400">City</p>
              <p class="mt-1">{{ profile.billing_address?.address_city || '-' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400">State</p>
              <p class="mt-1">{{ billingStateName || '-' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400">Zip Code</p>
              <p class="mt-1">{{ profile.billing_address?.address_zip || '-' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400">Country</p>
              <p class="mt-1">{{ billingCountryName || '-' }}</p>
            </div>
          </div>
          <div v-else>
            <p class="text-gray-400 text-sm">No billing address added yet.</p>
          </div>
        </section>
      </div>

      <!-- EDIT MODE -->
      <div v-else>
        <UForm ref="formRef" :schema="schema" :state="state" @submit="onSubmit">
          <!-- Profile section -->
          <section class="space-y-4">
            <h3 class="text-base sm:text-lg font-semibold">Profile Details</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <UFormGroup name="name" label="Full name" required>
                <UInput
                  v-model="state.name"
                  eager-validation
                  inputClass="custom-input"
                  placeholder="Enter full name"
                  icon="i-heroicons-user"
                />
              </UFormGroup>

              <UFormGroup name="email" label="Email" required>
                <UInput
                  v-model="state.email"
                  type="email"
                  eager-validation
                  inputClass="custom-input"
                  placeholder="Enter email address"
                  icon="i-heroicons-envelope"
                />
              </UFormGroup>

              <UFormGroup name="company" label="Company" required>
                <UInput
                  v-model="state.company"
                  :disabled="!!profile.company"
                  eager-validation
                  inputClass="custom-input"
                  placeholder="Enter company name"
                  icon="i-heroicons-building-office"
                />
                <p v-if="profile.company" class="text-gray-400 text-xs mt-1">
                  Company cannot be changed for existing organization
                </p>
              </UFormGroup>

              <UFormGroup name="contact_number" label="Contact number" required>
                <LibVueTelInput
                  ref="phoneRef"
                  v-model="state.contact_number"
                  :propPhone="state.contact_number || profile.contact_number"
                  placeholder="Your phone number"
                  defaultCountry="in"
                />
              </UFormGroup>
            </div>
          </section>

          <!-- Organization Details section -->
          <section class="space-y-4 mt-6 sm:mt-8">
            <div class="border-t border-gray-700" />
            <div class="flex items-center justify-between">
              <h3 class="text-base sm:text-lg font-semibold">Organization Details</h3>
            </div>
            <div class="border-t border-gray-700" />

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <UFormGroup name="org_country" label="Country" required>
                <USelect
                  icon="i-heroicons-globe-alt"
                  v-model="state.org_country"
                  :options="COUNTRY_OPTIONS"
                  placeholder="Select country"
                  selectClass="custom-input"
                  option-attribute="label"
                />
              </UFormGroup>

              <UFormGroup
                v-if="state.org_country && currentOrgCountryTaxInfo"
                name="org_tax_id"
                :label="currentOrgCountryTaxInfo.taxIdLabel"
                required
              >
                <UInput
                  v-model="state.org_tax_id"
                  eager-validation
                  inputClass="custom-input"
                  :placeholder="currentOrgCountryTaxInfo.taxIdPlaceholder"
                />
              </UFormGroup>
            </div>
          </section>

          <!-- Billing section -->
          <section class="space-y-4 mt-6 sm:mt-8">
            <div class="border-t border-gray-700" />
            <div class="flex items-center justify-between">
              <h3 class="text-base sm:text-lg font-semibold">Billing Address</h3>
            </div>
            <div class="border-t border-gray-700" />

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <UFormGroup name="address_line1" label="Address line 1" required>
                <UInput
                  v-model="state.address_line1"
                  eager-validation
                  inputClass="custom-input"
                  placeholder="Enter address line 1"
                  icon="i-heroicons-map-pin"
                />
              </UFormGroup>

              <UFormGroup name="address_line2" label="Address line 2 (optional)">
                <UInput
                  v-model="state.address_line2"
                  inputClass="custom-input"
                  placeholder="Enter address line 2"
                  icon="i-heroicons-map-pin"
                />
              </UFormGroup>

              <UFormGroup name="address_country" label="Country" required>
                <USelect
                  icon="i-heroicons-globe-alt"
                  v-model="state.address_country"
                  :options="countryOptions"
                  placeholder="Select country"
                  selectClass="custom-input"
                />
              </UFormGroup>

              <UFormGroup name="address_state" label="State" required>
                <USelect
                  icon="i-heroicons-map"
                  v-model="state.address_state"
                  :options="stateOptions"
                  :disabled="!state.address_country"
                  placeholder="Select state"
                  selectClass="custom-input"
                />
              </UFormGroup>

              <UFormGroup name="address_city" label="City" required>
                <USelect
                  icon="i-heroicons-building-office-2"
                  v-model="state.address_city"
                  :options="cityOptions"
                  :disabled="!state.address_state"
                  placeholder="Select city"
                  selectClass="custom-input"
                />
              </UFormGroup>

              <UFormGroup name="address_zip" label="Zip Code" required>
                <UInput
                  v-model="state.address_zip"
                  eager-validation
                  inputClass="custom-input"
                  placeholder="Enter zip code"
                  icon="i-heroicons-hashtag"
                />
              </UFormGroup>
            </div>
          </section>

          <div class="flex justify-end gap-2 mt-6">
            <UButton type="button" variant="ghost" icon="i-heroicons-x-mark" @click="cancelEdit">
              Cancel
            </UButton>
            <UButton
              type="submit"
              color="primary"
              :loading="submitting"
              icon="i-heroicons-check-circle"
            >
              Update Profile
            </UButton>
          </div>
        </UForm>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, reactive, watch } from 'vue'
import { z } from 'zod'
import { useRoute } from '#imports'
import { useProfileStore } from '~/stores/profile'
import LibVueTelInput from '~/components/lib/VueTelInput/Index.vue'
import {
  getAllCountries,
  getStatesByCountry,
  getCitiesByState,
  getCountryName,
  getStateName,
  type CSCOption,
} from '../../utils/csc'
import { COUNTRY_OPTIONS, validateTaxId, getCountryTaxInfo } from '~/utils/countries'

useHead({ title: 'Profile - Admin Dashboard - provento.ai' })
definePageMeta({ layout: 'admin', middleware: 'auth' })

const profileStore = useProfileStore()
const profile = computed(() => profileStore.userProfile)

const isEditing = ref(false)
const route = useRoute()
const submitting = ref(false)
const phoneRef = ref<any>(null)
const formRef = ref<any>(null)

// Zod schema: profile + organization + billing fields with country-specific tax ID messages
const getSchema = (selectedOrgCountry: string) => {
  const countryTaxInfo = getCountryTaxInfo(selectedOrgCountry)
  const taxIdLabel = countryTaxInfo?.taxIdLabel || 'Tax ID'
  const isOthersCountry = selectedOrgCountry === 'others'

  return z
    .object({
      name: z.string().min(3, 'Name must be at least 3 characters'),
      email: z.string().email('Please enter a valid email'),
      company: z.string().min(3, 'Company must be at least 3 characters'),
      org_country: z.string().min(1, 'Country is required'),
      org_tax_id: isOthersCountry
        ? z.string().min(5, `${taxIdLabel} must be at least 5 characters`).max(50, 'Tax ID too long')
        : z.string().min(1, `${taxIdLabel} is required`).max(50, 'Tax ID too long'),
      address_line1: z.string().min(3, 'Address line 1 is required'),
      address_line2: z.string().optional(),
      address_city: z.string().min(1, 'City is required'),
      address_state: z.string().min(1, 'State is required'),
      address_zip: z.string().min(2, 'Zip code is required'),
      address_country: z.string().min(2, 'Country is required'),
    })
    .refine((data) => validateTaxId(data.org_country, data.org_tax_id), {
      message: `Invalid ${taxIdLabel} format`,
      path: ['org_tax_id'],
    })
}

const schema = computed(() => getSchema(state.org_country))

type Schema = z.infer<ReturnType<typeof getSchema>>

const state = reactive<
  Partial<
    Schema & {
      user_id?: string | number
      contact_number?: string
    }
  >
>({
  user_id: '',
  name: '',
  email: '',
  company: '',
  contact_number: '',
  org_country: 'usa',
  org_tax_id: '',
  address_line1: '',
  address_line2: '',
  address_city: '',
  address_state: '',
  address_zip: '',
  address_country: '',
})

// CSC dropdown options for billing address
const countryOptions = ref<CSCOption[]>([])
const stateOptions = ref<CSCOption[]>([])
const cityOptions = ref<CSCOption[]>([])

// Organization country tax info
const currentOrgCountryTaxInfo = computed(() => {
  return getCountryTaxInfo(state.org_country)
})

const initials = computed(() => {
  const name =
    (isEditing.value ? state.name : profile.value.name) ||
    (isEditing.value ? state.email : profile.value.email) ||
    ''
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
})

const hasBillingAddress = computed(() => {
  const ba: any = profile.value.billing_address
  return !!(ba && ba.address_line1)
})

// View labels for ISO → names
const billingCountryName = computed(() => {
  const iso = profile.value.billing_address?.address_country
  return iso ? getCountryName(iso) : ''
})

const billingStateName = computed(() => {
  const countryIso = profile.value.billing_address?.address_country
  const stateIso = profile.value.billing_address?.address_state
  return countryIso && stateIso ? getStateName(countryIso, stateIso) : ''
})

const isProfileComplete = computed(() => {
  const up: any = profile.value || {}
  return !!(up && up.name && up.contact_number && up.company)
})

// ----- EDIT FLOW -----

const startEdit = async () => {
  isEditing.value = true

  // Load ALL countries first (must be awaited)
  countryOptions.value = getAllCountries()

  // Fill profile fields
  state.user_id = profile.value.user_id || ''
  state.name = profile.value.name || ''
  state.email = profile.value.email || ''
  state.company = profile.value.company || ''
  state.contact_number = profile.value.contact_number || ''

  // Organization fields
  state.org_country = (profile.value as any).org_country || 'usa'
  state.org_tax_id = (profile.value as any).org_tax_id || ''

  // Billing fields from backend
  const ba: any = profile.value.billing_address || {}

  const savedCountry = ba.address_country || ''
  const savedState = ba.address_state || ''
  const savedCity = ba.address_city || ''

  // ------------------------------
  // STEP 1 — SET COUNTRY FIRST
  // ------------------------------
  state.address_country = savedCountry

  // Wait 1 microtask to let Vue bind v-model before loading states
  await nextTick()

  // ------------------------------
  // STEP 2 — LOAD STATES OF COUNTRY
  // ------------------------------
  if (savedCountry) {
    stateOptions.value = getStatesByCountry(savedCountry)
  }

  // Set state
  state.address_state = savedState

  await nextTick()

  // ------------------------------
  // STEP 3 — LOAD CITIES OF STATE
  // ------------------------------
  if (savedCountry && savedState) {
    cityOptions.value = getCitiesByState(savedCountry, savedState)
  }

  // Set city
  state.address_city = savedCity

  // Set address lines
  state.address_line1 = ba.address_line1 || ''
  state.address_line2 = ba.address_line2 || ''
  state.address_zip = ba.address_zip || ''
}

const cancelEdit = () => {
  isEditing.value = false
}

// Phone validation helper
function validatePhoneField() {
  const res = phoneRef.value?.handlePhoneValidation?.(true)
  return res?.status || false
}

// Watchers for CSC
watch(
  () => state.address_country,
  (newCountry, oldCountry) => {
    if (!newCountry) {
      stateOptions.value = []
      cityOptions.value = []
      state.address_state = ''
      state.address_city = ''
      return
    }

    stateOptions.value = getStatesByCountry(newCountry)

    if (newCountry !== oldCountry) {
      state.address_state = ''
      state.address_city = ''
      cityOptions.value = []
    }
  },
)

watch(
  () => state.address_state,
  (newState, oldState) => {
    if (!newState || !state.address_country) {
      cityOptions.value = []
      state.address_city = ''
      return
    }

    cityOptions.value = getCitiesByState(state.address_country, newState)

    if (newState !== oldState) {
      state.address_city = ''
    }
  },
)

// Clear tax ID and validation errors when organization country changes
watch(
  () => state.org_country,
  () => {
    state.org_tax_id = ''
    formRef.value?.clear('org_tax_id')
  },
)

// Single submit for profile + billing
const onSubmit = async () => {
  submitting.value = true
  try {
    if (!validatePhoneField()) {
      throw new Error('Please enter a valid phone number')
    }

    let phoneData = phoneRef.value?.phoneData
    if (phoneData && typeof phoneData === 'object' && 'value' in phoneData) {
      phoneData = phoneData.value
    }

    state.contact_number = (phoneData && phoneData.number) || state.contact_number || ''

    await profileStore.updateProfile({
      user_id: state.user_id,
      name: state.name,
      email: state.email,
      company: state.company,
      contact_number: state.contact_number,
      org_country: state.org_country,
      org_tax_id: state.org_tax_id,
      billing_address: {
        address_line1: state.address_line1,
        address_line2: state.address_line2,
        address_city: state.address_city, // city name
        address_state: state.address_state, // ISO code
        address_zip: state.address_zip,
        address_country: state.address_country, // ISO code
      },
    })

    isEditing.value = false
    await profileStore.fetchUserProfile()
  } catch (err: any) {
    console.error('Unexpected error saving profile & billing:', err)
  } finally {
    submitting.value = false
  }
}

// ----- INIT -----

onMounted(async () => {
  try {
    await profileStore.fetchUserProfile()
  } catch {}

  // Load all countries once
  countryOptions.value = getAllCountries()

  const qEdit = route.query.edit === '1' || route.query.edit === 'true'
  if (qEdit || !isProfileComplete.value) {
    startEdit()
  }
})
</script>

<style scoped>
:deep(.custom-input) {
  background-color: #1e293b !important;
  color: #e2e8f0 !important;
  font-size: 0.875rem !important;
  padding: 0.875rem 2.5rem !important;
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

/* Custom select styles */
:deep(.custom-select) {
  background-color: #1e293b !important;
  color: #e2e8f0 !important;
  font-size: 0.875rem !important;
  padding: 0.875rem 2.5rem !important;
  transition: all 0.2s ease-in-out !important;
  width: 100% !important;
  cursor: pointer !important;
  border-radius: 0.5rem !important;
}

:deep(.custom-select:hover) {
  background-color: #1e293b !important;
}

:deep(.custom-select:focus) {
  background-color: #1e293b !important;
  outline: none !important;
}

/* Textarea styles (kept from your original) */
:deep(.custom-textarea) {
  background-color: #1e293b !important;
  color: #e2e8f0 !important;
  font-size: 0.875rem !important;
  padding: 0.875rem 2.5rem !important;
  transition: all 0.2s ease-in-out !important;
  width: 100% !important;
  resize: none !important;
  border-radius: 0.5rem !important;
}

:deep(.custom-textarea:hover) {
  background-color: #1e293b !important;
}

:deep(.custom-textarea:focus) {
  background-color: #1e293b !important;
  outline: none !important;
}

:deep(.custom-textarea::placeholder) {
  color: #64748b !important;
}

/* vue-tel-input styles – same as you had */
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

:deep(.vue-tel-input.errorState:focus-within) {
  border-color: #ef4444 !important;
  background-color: #1e293b;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2) !important;
}

:deep(.vue-tel-input .vti__dropdown) {
  background-color: #1e293b;
  border-right: 1px solid #334155;
  border-radius: 0.5rem 0 0 0.5rem;
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
  -webkit-user-select: text !important;
  -moz-user-select: text !important;
  -ms-user-select: text !important;
}

:deep(.vue-tel-input::before),
:deep(.vue-tel-input::after) {
  display: none !important;
}

:deep(.vue-tel-input) {
  pointer-events: all !important;
}

:deep(.vue-tel-input *) {
  z-index: auto !important;
}

:deep(.vue-tel-input .vti__dropdown-arrow) {
  color: #9ca3af;
}

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
