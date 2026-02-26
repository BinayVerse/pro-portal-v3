<template>
  <div>
    <div v-if="loading" class="flex items-center justify-center py-6">
      <div class="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
    <div v-else>
      <div ref="dropinContainer" data-chargebee-dropin="true" class="w-full h-[70vh] bg-dark-900 rounded border border-dark-700 overflow-hidden"></div>
      <div class="mt-3 text-sm text-gray-400">If native drop-in doesn't initialize, please check the console for errors.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
const props = defineProps<{ siteKey?: string | null, priceId?: string | null, billing?: { name?: string; email?: string; phone?: string } }>()
const emit = defineEmits(['ready', 'error'])

const dropinContainer = ref<HTMLElement | null>(null)
const loading = ref(true)

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (window && (window as any).Chargebee) return resolve()
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Chargebee script'))
    document.head.appendChild(s)
  })
}

async function initDropin() {
  loading.value = true
  try {
    if (!props.siteKey) throw new Error('Chargebee site key not provided')
    if (!props.priceId) throw new Error('Price id not provided for drop-in')
    await loadScript('https://js.chargebee.com/v2/chargebee.js')
    const cb = (window as any).Chargebee
    if (!cb) throw new Error('Chargebee script not available')

    // Initialize with site key
    try { cb.init({ site: props.siteKey }) } catch (e) {}

    const instance = cb.getInstance ? cb.getInstance() : null
    if (!instance || typeof instance.openCheckout !== 'function') {
      throw new Error('Chargebee instance or openCheckout not available')
    }

    // Build checkout options for native Drop-in
    const options: any = {
      subscription: {
        items: [
          { price_id: props.priceId, quantity: 1 }
        ]
      },
      // embed into container
      embed: true,
      container: dropinContainer.value,
      // prefilling customer
      customer: {
        name: props.billing?.name || undefined,
        email: props.billing?.email || undefined,
        phone: props.billing?.phone || undefined,
      },
      // callbacks (Chargebee may support events on instance level)
    }

    // Try to open checkout embedded in the container
    try {
      console.debug('Chargebee openCheckout options:', options)
      instance.openCheckout(options)
      emit('ready')
      loading.value = false
      return
    } catch (e: any) {
      console.error('Chargebee openCheckout failed', e)
      emit('error', e)
      throw e
    }
  } catch (err: any) {
    loading.value = false
    emit('error', err)
  }
}

onMounted(() => {
  initDropin()
})

watch(() => props.priceId, () => initDropin())
watch(() => props.siteKey, () => initDropin())
</script>

<style scoped>
</style>
