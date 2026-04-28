<template>
  <nav>
    <NuxtLink to="/" class="nav-logo">
      <img src="/images/logo.svg" alt="provento.ai" style="height: 32px; width: 32px" />
      <span>provento.ai</span>
    </NuxtLink>
    <ul>
      <li>
        <button
          type="button"
          :class="{ 'is-active': activeSection === 'problem' }"
          @click="goToSection('problem')"
        >
          Why Provento
        </button>
      </li>
      <li>
        <button
          type="button"
          :class="{ 'is-active': activeSection === 'solution' }"
          @click="goToSection('solution')"
        >
          Solution
        </button>
      </li>
      <li>
        <button
          type="button"
          :class="{ 'is-active': activeSection === 'signals' }"
          @click="goToSection('signals')"
        >
          AI Signals
        </button>
      </li>
      <li>
        <button
          type="button"
          :class="{ 'is-active': activeSection === 'pricing' }"
          @click="goToSection('pricing')"
        >
          Pricing
        </button>
      </li>
      <li>
        <button
          type="button"
          :class="{ 'is-active': activeSection === 'team' }"
          @click="goToSection('team')"
        >
          Team
        </button>
      </li>
      <li><NuxtLink to="/book-meeting" class="nav-demo">Book a Demo</NuxtLink></li>
      <li v-if="auth.isAuthenticated">
        <UDropdown :items="profileItems" :popper="{ placement: 'bottom-end' }">
          <template #default="{ open }">
            <UButton
              variant="ghost"
              trailing-icon="heroicons:chevron-down"
              size="sm"
              class="text-xs"
              :class="{ 'bg-dark-800': open }"
            >
              <UAvatar
                src=""
                :alt="profileStore.userProfile?.name?.toUpperCase()"
                size="xs"
                :ui="{ background: 'bg-primary-500' }"
              />
              <span class="ml-2">
                {{ profileStore.userProfile?.name || profileStore.userProfile?.email || 'User' }}
              </span>
            </UButton>
          </template>

          <template #item="{ item }">
            <div style="padding: 10px 16px !important">
              <div class="flex items-center gap-2">
                <UIcon :name="item.icon" class="w-4 h-4" />
                <span>{{ item.label }}</span>
              </div>
            </div>
          </template>
        </UDropdown>
      </li>
      <li v-else><NuxtLink to="/login" class="nav-login">Login</NuxtLink></li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth/index'
import { useProfileStore } from '~/stores/profile/index'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const profileStore = useProfileStore()
const activeSection = ref('')
let sectionObserver: IntersectionObserver | null = null

const isProfileComplete = computed(() => {
  const up: any = profileStore.userProfile || {}
  return !!(up && up.name && up.contact_number && up.company)
})

// const scrollToSection = (sectionId: string) => {
//   activeSection.value = sectionId
//   document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
// }

// const goToSection = async (sectionId: string) => {
//   if (route.path === '/') {
//     scrollToSection(sectionId)
//     return
//   }

//   sessionStorage.setItem('landing-section', sectionId)
//   await navigateTo('/')
// }

function scrollToSection(sectionId: string) {
  activeSection.value = sectionId
  const el = document.getElementById(sectionId)
  if (!el) return

  const top = el.getBoundingClientRect().top + window.pageYOffset

  window.scrollTo({
    top,
    behavior: 'smooth',
  })
}

async function goToSection(sectionId: string) {
  const currentRoute = router.currentRoute.value.path

  if (currentRoute !== '/') {
    await router.push('/')
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  scrollToSection(sectionId)
}

const observeSections = async () => {
  if (import.meta.server) return

  sectionObserver?.disconnect()
  sectionObserver = null

  if (route.path !== '/') {
    activeSection.value = ''
    return
  }

  await nextTick()
  const sections = ['problem', 'solution', 'signals', 'pricing', 'team']
    .map((id) => document.getElementById(id))
    .filter((section): section is HTMLElement => Boolean(section))

  sectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

      if (visible?.target.id) {
        activeSection.value = visible.target.id
      } else {
        activeSection.value = ''
      }
    },
    {
      rootMargin: '-20% 0px -60% 0px',
      threshold: [0.1, 0.25, 0.5, 0.75],
    },
  )

  sections.forEach((section) => sectionObserver?.observe(section))
}

const handleLogout = async () => {
  await auth.signOut()
  await router.push('/login')
}

const profileItems = computed(() => [
  [
    {
      label: 'Dashboard',
      icon: 'i-heroicons-user',
      to: auth.user?.role_id === 0 ? '/admin/superadmin' : '/admin/dashboard',
    },
    {
      label: 'Change Password',
      icon: 'i-heroicons-lock-closed',
      to: '/change-password',
    },
  ],
  [
    {
      label: 'Logout',
      icon: 'i-heroicons-arrow-left-on-rectangle',
      click: handleLogout,
    },
  ],
])

watch(() => route.path, observeSections, { immediate: true })

onBeforeUnmount(() => {
  sectionObserver?.disconnect()
})
</script>
