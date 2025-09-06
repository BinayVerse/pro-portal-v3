<template>
  <div class="max-w-3xl mx-auto bg-dark-900 p-6 rounded-lg">
    <h1 class="text-2xl font-semibold text-white mb-4">My Profile</h1>

    <!-- View mode -->
    <div v-if="!isEditing">
      <div class="flex items-center space-x-4 mb-6">
        <div class="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center">
          <span class="text-white text-xl font-bold">{{ initials }}</span>
        </div>
        <div>
          <div class="text-lg font-semibold text-white">{{ profile.name || profile.email }}</div>
          <div class="text-sm text-gray-400">{{ profile.company || 'No company' }}</div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label class="text-gray-300 text-sm">Full name</label>
          <div class="mt-1 text-white">{{ profile.name || '-' }}</div>
        </div>
        <div>
          <label class="text-gray-300 text-sm">Email</label>
          <div class="mt-1 text-white">{{ profile.email || '-' }}</div>
        </div>
        <div>
          <label class="text-gray-300 text-sm">Contact number</label>
          <div class="mt-1 text-white">{{ profile.contact_number || '-' }}</div>
        </div>
        <div>
          <label class="text-gray-300 text-sm">Primary contact</label>
          <div class="mt-1 text-white">{{ profile.primary_contact ? 'Yes' : 'No' }}</div>
        </div>
      </div>

      <div>
        <UButton color="primary" @click="startEdit">Edit Profile</UButton>
      </div>
    </div>

    <!-- Edit mode -->
    <div v-else>
      <div class="flex items-center space-x-4 mb-6">
        <div class="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center">
          <span class="text-white text-xl font-bold">{{ initials }}</span>
        </div>
        <div>
          <div class="text-lg font-semibold text-white">Editing: {{ form.name || form.email }}</div>
          <div class="text-sm text-gray-400">{{ form.company || 'No company' }}</div>
        </div>
      </div>

      <form @submit.prevent="onSubmit" class="space-y-4">
        <UFormGroup label="Full name">
          <UInput
            v-model="form.name"
            required
            placeholder="Enter full name"
            icon="heroicons:user"
          />
          <p v-if="errors.name" class="text-red-500 text-sm mt-1">{{ errors.name }}</p>
        </UFormGroup>

        <UFormGroup label="Email">
          <UInput
            v-model="form.email"
            type="email"
            required
            placeholder="Enter email address"
            icon="heroicons:envelope"
          />
          <p v-if="errors.email" class="text-red-500 text-sm mt-1">{{ errors.email }}</p>
        </UFormGroup>

        <UFormGroup label="Company">
          <UInput
            v-model="form.company"
            :disabled="!!profile.company"
            required
            placeholder="Enter company name"
            icon="heroicons:building-office"
          />
          <p v-if="errors.company" class="text-red-500 text-sm mt-1">{{ errors.company }}</p>
          <p v-if="profile.company" class="text-gray-400 text-xs mt-1">
            Company cannot be changed for existing organization
          </p>
        </UFormGroup>

        <UFormGroup label="Contact number">
          <div>
            <VueTelInput
              class="whatsapp-tel-input"
              ref="phoneComponent"
              :propPhone="form.contact_number"
            />
          </div>
          <p v-if="errors.contact_number" class="text-red-500 text-sm mt-1">
            {{ errors.contact_number }}
          </p>
        </UFormGroup>

        <div class="flex space-x-2">
          <UButton type="submit" color="primary" :loading="submitting">Save</UButton>
          <UButton type="button" variant="ghost" @click="cancelEdit">Cancel</UButton>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, reactive } from 'vue'
import { useProfileStore } from '~/stores/profile'
import { useNotification } from '~/composables/useNotification'
import VueTelInput from '~/components/lib/VueTelInput/Index.vue'

definePageMeta({ layout: 'admin' })

const profileStore = useProfileStore()
const { showError } = useNotification()
const profile = computed(() => profileStore.userProfile || {})

const isEditing = ref(false)
const submitting = ref(false)
const phoneComponent = ref<any>(null)

const form = reactive({
  user_id: '',
  name: '',
  email: '',
  company: '',
  contact_number: '',
})

const errors = reactive({
  name: '',
  email: '',
  company: '',
  contact_number: '',
})

const initials = computed(() => {
  const name =
    (isEditing.value ? form.name : profile.value.name) ||
    (isEditing.value ? form.email : profile.value.email) ||
    ''
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
})

const startEdit = () => {
  isEditing.value = true
  form.user_id = profile.value.user_id || ''
  form.name = profile.value.name || ''
  form.email = profile.value.email || ''
  form.company = profile.value.company || ''
  form.contact_number = profile.value.contact_number || ''
  // reset errors
  errors.name = errors.email = errors.company = errors.contact_number = ''
}

const cancelEdit = () => {
  isEditing.value = false
}

const validateForm = async () => {
  let valid = true
  errors.name = ''
  errors.email = ''
  errors.company = ''
  errors.contact_number = ''

  if (!form.name || form.name.trim().length < 3) {
    errors.name = 'Name must be at least 3 characters'
    valid = false
  }
  if (!form.company || form.company.trim().length < 3) {
    errors.company = 'Company must be at least 3 characters'
    valid = false
  }
  if (!form.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
    errors.email = 'Please enter a valid email'
    valid = false
  }

  // Validate phone via component
  if (phoneComponent.value) {
    const res = phoneComponent.value.handlePhoneValidation()
    if (!res || res.status === false) {
      errors.contact_number = res?.message || 'Please enter a valid phone number'
      valid = false
    } else {
      // pull the normalized number
      form.contact_number =
        phoneComponent.value.phoneData?.number ||
        phoneComponent.value.phoneData?.formatted ||
        form.contact_number
    }
  } else {
    if (!form.contact_number) {
      errors.contact_number = 'Contact number is required'
      valid = false
    }
  }

  return valid
}

const onSubmit = async () => {
  submitting.value = true
  try {
    const ok = await validateForm()
    if (!ok) throw new Error('Validation failed')

    await profileStore.updateProfile({
      user_id: form.user_id,
      name: form.name,
      email: form.email,
      company: form.company,
      contact_number: form.contact_number,
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
  } catch (e) {
    // ignore; store handles errors
  }
})
</script>

<style scoped>
/* Make VueTelInput input visually match other inputs */
::deep(.whatsapp-tel-input .vue-tel-input) {
  border: 2px solid transparent !important;
  border-radius: 0.5rem !important;
  background-color: transparent !important;
  height: 2.5rem !important;
  min-height: 2.5rem !important;
  max-height: 2.5rem !important;
  display: flex !important;
  align-items: center !important;
  transition:
    border-color 0.15s ease-in-out,
    box-shadow 0.15s ease-in-out !important;
  box-shadow: none !important;
  outline: none !important;
}

::deep(.whatsapp-tel-input .vue-tel-input:focus-within) {
  border-color: rgb(59 130 246) !important;
  box-shadow: none !important;
  outline: 2px solid rgb(59 130 246) !important;
  outline-offset: 0 !important;
}

::deep(.whatsapp-tel-input .vti__dropdown) {
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  height: 100% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important;
  margin: 0 !important;
  cursor: pointer !important;
}

::deep(.whatsapp-tel-input .vti__dropdown:hover) {
  background: transparent !important;
}

::deep(.whatsapp-tel-input .vti__dropdown.open) {
  background: transparent !important;
}

::deep(.whatsapp-tel-input .vti__selection) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  height: 100% !important;
  padding: 0 !important;
  margin: 0 !important;
  background: transparent !important;
  border: none !important;
}

/* Ensure the internal input background is transparent */
::deep(.whatsapp-tel-input .vue-tel-input input),
::deep(.whatsapp-tel-input .vti__input) {
  background: transparent !important;
  border: none !important;
  outline: none !important;
  color: rgb(243 244 246) !important;
  font-size: 0.875rem !important;
  line-height: 1.25rem !important;
  padding: 0.5rem 0.75rem !important;
  height: 100% !important;
  flex: 1 !important;
  margin-left: 0.5rem !important;
}

::deep(.whatsapp-tel-input .vue-tel-input input::placeholder),
::deep(.whatsapp-tel-input .vti__input::placeholder) {
  color: rgb(156 163 175) !important;
}

::deep(.whatsapp-tel-input .vue-tel-input input:focus) {
  outline: none !important;
  box-shadow: none !important;
}

::deep(.whatsapp-tel-input .vti__dropdown-list) {
  background-color: rgb(17, 24, 39) !important;
  border: 1px solid rgb(75 85 99) !important;
  border-radius: 0.5rem !important;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.3) !important;
  max-height: 200px !important;
  overflow-y: auto !important;
  z-index: 50 !important;
  margin-top: 0.25rem !important;
}

::deep(.whatsapp-tel-input .vti__dropdown-item) {
  padding: 0.5rem 0.75rem !important;
  color: rgb(243 244 246) !important;
  font-size: 0.875rem !important;
  border-bottom: 1px solid rgb(55 65 81) !important;
  display: flex !important;
  align-items: center !important;
}

::deep(.whatsapp-tel-input .vti__dropdown-item:hover) {
  background-color: rgb(55 65 81) !important;
}

::deep(.whatsapp-tel-input .vti__dropdown-item.highlighted) {
  background-color: rgb(59 130 246) !important;
  color: white !important;
}

::deep(.whatsapp-tel-input .vti__dropdown-item:last-child) {
  border-bottom: none !important;
}

::deep(.whatsapp-tel-input .vti__search_box) {
  background-color: rgb(31 41 55) !important;
  color: rgb(243 244 246) !important;
  border: none !important;
  border-bottom: 1px solid rgb(75 85 99) !important;
  font-size: 0.875rem !important;
  padding: 0.5rem 0.75rem !important;
  margin: 0 !important;
}

::deep(.whatsapp-tel-input .vti__search_box::placeholder) {
  color: rgb(156 163 175) !important;
}

::deep(.whatsapp-tel-input .vti__search_box:focus) {
  outline: none !important;
  border-bottom-color: rgb(59 130 246) !important;
}

/* Ensure proper box sizing */
::deep(.whatsapp-tel-input *) {
  box-sizing: border-box !important;
}
</style>
