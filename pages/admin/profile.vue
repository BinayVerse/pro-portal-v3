<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <UAvatar :text="initials" size="lg" color="primary" />
          <div class="leading-tight">
            <p class="text-base font-semibold">
              {{ isEditing ? state.name || state.email : profile.name || profile.email }}
            </p>
            <p class="text-xs text-gray-400">
              {{ isEditing ? state.company || 'No company' : profile.company || 'No company' }}
            </p>
          </div>
        </div>
        <div v-if="!isEditing">
          <UButton color="primary" icon="i-heroicons-pencil-square" @click="startEdit"
            >Edit Profile</UButton
          >
        </div>
      </div>
    </template>

    <!-- View mode -->
    <div v-if="!isEditing" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
    </div>

    <!-- Edit mode -->
    <div v-else>
      <UForm :schema="schema" :state="state" @submit="onSubmit">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div class="flex justify-end gap-2 mt-4">
          <UButton type="button" variant="ghost" icon="i-heroicons-x-mark" @click="cancelEdit"
            >Cancel</UButton
          >
          <UButton
            type="submit"
            color="primary"
            :loading="submitting"
            icon="i-heroicons-check-circle"
            >Save</UButton
          >
        </div>
      </UForm>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, reactive } from 'vue'
import { useProfileStore } from '~/stores/profile'
import { useNotification } from '~/composables/useNotification'
import LibVueTelInput from '~/components/lib/VueTelInput/Index.vue'
import { z } from 'zod'

definePageMeta({ layout: 'admin' })

const profileStore = useProfileStore()
const { showError } = useNotification()
const profile = computed(() => profileStore.userProfile || {})

const isEditing = ref(false)
const submitting = ref(false)
const phoneRef = ref<any>(null)

const schema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Please enter a valid email'),
  company: z.string().min(3, 'Company must be at least 3 characters'),
  contact_number: z.string().min(1, 'Contact number is required'),
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema & { user_id: any }>>({
  user_id: '',
  name: '',
  email: '',
  company: '',
  contact_number: '',
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

const startEdit = () => {
  isEditing.value = true
  state.user_id = profile.value.user_id || ''
  state.name = profile.value.name || ''
  state.email = profile.value.email || ''
  state.company = profile.value.company || ''
  state.contact_number = profile.value.contact_number || ''
}

const cancelEdit = () => {
  isEditing.value = false
}

function validatePhoneField() {
  const res = phoneRef.value?.handlePhoneValidation?.(true)
  return res?.status || false
}

const onSubmit = async () => {
  submitting.value = true
  try {
    // Validate phone
    if (!validatePhoneField()) {
      throw new Error('Please enter a valid phone number')
    }

    // Ensure contact_number uses the phone component formatted value if available
    let phoneData = phoneRef.value?.phoneData
    // handle both ref and plain object exposures
    if (phoneData && typeof phoneData === 'object' && 'value' in phoneData)
      phoneData = phoneData.value
    state.contact_number = (phoneData && phoneData.number) || state.contact_number || ''

    await profileStore.updateProfile({
      user_id: state.user_id,
      name: state.name,
      email: state.email,
      company: state.company,
      contact_number: state.contact_number,
    })

    isEditing.value = false
  } catch (err: any) {
    showError(err?.message || 'Failed to update profile')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    await profileStore.fetchUserProfile()
  } catch {}
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

/* Custom select styles - no border styling to allow UForm errors */
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

/* Custom textarea styles - no border styling to allow UForm errors */
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

/* Custom styling for vue3-tel-input to match the design */
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

/* Focused error state - maintain consistent border width */
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

/* Ensure input is clickable and not blocked */
:deep(.vue-tel-input .vti__input) {
  pointer-events: all !important;
  user-select: text !important;
  cursor: text !important;
  -webkit-user-select: text !important;
  -moz-user-select: text !important;
  -ms-user-select: text !important;
}

/* Remove any potential overlays or blocking elements */
:deep(.vue-tel-input::before),
:deep(.vue-tel-input::after) {
  display: none !important;
}

/* Ensure the phone input container is interactive */
:deep(.vue-tel-input) {
  pointer-events: all !important;
}

/* Fix any potential z-index issues */
:deep(.vue-tel-input *) {
  z-index: auto !important;
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

/* Ensure dropdown list is properly positioned and sized */
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
