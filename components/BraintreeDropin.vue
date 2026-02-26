<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import dropin from 'braintree-web-drop-in'
import { usePaymentsStore } from '~/stores/payments'

const paymentsStore = usePaymentsStore()
const allDetails = computed(() => paymentsStore.billingDetails)

const props = defineProps<{
  clientToken?: string | null
  amount?: number | null
  billing?: any
  planId?: string | null
}>()

interface CardDetails {
  cardholderName: string
  cardType: string
  lastFour: string
  expirationMonth: string
  expirationYear: string
}

const emit = defineEmits(['ready', 'error', 'completed'])

const dropinContainer = ref<HTMLElement | null>(null)
const loading = ref(true)
const processing = ref(false)
const error = ref<string | null>(null)
let dropinInstance: dropin.Dropin | null = null

onMounted(async () => {
  loading.value = true
  error.value = null

  try {
    await nextTick() // ensures the template DOM is rendered
    if (!dropinContainer.value) throw new Error('Drop-in container ref not available')

    // Fetch client token from backend
    const response = await paymentsStore.getClientToken()
    const clientToken = response?.clientToken
    if (!clientToken) throw new Error('Client token missing')

    // Initialize Braintree Drop-in UI
    dropinInstance = await dropin.create({
      authorization: clientToken,
      container: dropinContainer.value, // ✅ use ref, not selector
      threeDSecure: true,
      card: {
        cardholderName: { required: true },
        overrides: {
          fields: {
            number: { maskInput: { showLastFour: true } },
            cvv: { maskInput: true },
          },
        },
      },
    })
    emit('ready')
  } catch (err: any) {
    error.value = err.message
    console.error('Error initializing Drop-in UI:', err)
    emit('error', err)
  } finally {
    loading.value = false
  }
})

async function verifyPayment() {
  if (!dropinInstance) throw new Error('Drop-in instance not available')
  processing.value = true
  try {
    console.log('Braintree.verifyPayment: requesting payment method for verification')
    const opts: any = {}
    if (props.amount) opts.threeDSecure = { amount: String(props.amount) }

    const payload = await new Promise((resolve, reject) => {
      dropinInstance!.requestPaymentMethod(opts, (err: any, result: any) => {
        if (err) return reject(err)
        resolve(result)
      })
    })

    const nonce = (payload as any)?.nonce
    if (!nonce) throw new Error('No payment nonce returned for verification')

    const { cardholderName, cardType, lastFour, expirationMonth, expirationYear } = (payload as any)
      .details as CardDetails

    const expiryDate =
      expirationMonth && expirationYear ? `${expirationMonth}/${expirationYear}` : ''
    allDetails.value.cardHolderName = cardholderName
    allDetails.value.cardType = cardType
    allDetails.value.cardNo = '*'.repeat(12) + lastFour
    allDetails.value.expDate = expiryDate
    allDetails.value.cvv = getCvvMask(cardType)

    allDetails.value.gwToken = nonce

    console.log('Braintree.verifyPayment: got nonce', nonce, 'payload:', payload)
    emit('ready')
    return payload
  } catch (e: any) {
    console.error('Braintree verify error', e)
    error.value = e?.message || String(e)
    emit('error', e)
    throw e
  } finally {
    processing.value = false
  }
}

async function submitPayment() {
  if (!dropinInstance) throw new Error('Drop-in instance not available')
  processing.value = true
  try {
    const opts: any = {}
    if (props.amount) opts.threeDSecure = { amount: String(props.amount) }

    const payload = allDetails.value
    console.log('Payment payload:', payload)
    const nonce = payload?.gwToken
    if (!nonce) throw new Error('No payment nonce returned')

    emit('completed', { nonce, payload, planId: props.planId, billing: props.billing })

    if (dropinInstance.clearSelectedPaymentMethod) dropinInstance.clearSelectedPaymentMethod()
  } catch (e: any) {
    console.error('Payment error:', e)
    error.value = e?.message || String(e)
    emit('error', e)
  } finally {
    processing.value = false
  }
}

onBeforeUnmount(async () => {
  if (dropinInstance && typeof dropinInstance.teardown === 'function')
    await dropinInstance.teardown()
})

defineExpose({
  submitPayment,
  verifyPayment,
})
</script>

<template>
  <div class="relative">
    <div
      class="w-full h-[70vh] bg-dark-900 rounded border border-dark-700 overflow-hidden p-4 relative"
    >
      <div ref="dropinContainer" class="w-full h-full"></div>

      <div
        v-if="loading"
        class="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none"
      >
        <div
          class="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"
        ></div>
      </div>
    </div>
  </div>
</template>
