import { defineNuxtPlugin, useRuntimeConfig, useRoute } from '#app'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const siteKey = config.public?.siteKey || ''

  let scriptLoaded = false
  let loadingPromise: Promise<void> | null = null
  let widgetId: number | null = null
  let pendingResolvers: ((token: string) => void)[] = []

  function loadScript(): Promise<void> {
    if (!siteKey) return Promise.resolve()
    if (scriptLoaded) return Promise.resolve()
    if (loadingPromise) return loadingPromise

    loadingPromise = new Promise((resolve, reject) => {
      if (document.querySelector(`script[data-recaptcha]`)) {
        scriptLoaded = true
        resolve()
        return
      }

      const script = document.createElement('script')
      // explicit render mode for v2 invisible
      script.setAttribute('src', 'https://www.google.com/recaptcha/api.js?render=explicit')
      script.setAttribute('async', '')
      script.setAttribute('defer', '')
      script.setAttribute('data-recaptcha', 'true')

      script.onload = () => {
        scriptLoaded = true
        resolve()
      }
      script.onerror = (err) => {
        // eslint-disable-next-line no-console
        console.error('[recaptcha] failed to load script', err)
        reject(new Error('Failed to load reCAPTCHA script'))
      }

      document.head.appendChild(script)
    })

    return loadingPromise
  }

  async function renderWidgetIfAllowed(): Promise<void> {
    if (!siteKey) return
    const route = useRoute()
    if (route.path.startsWith('/admin')) return

    try {
      await loadScript()
      // @ts-ignore
      if (!window.grecaptcha || typeof window.grecaptcha.render !== 'function') {
        // wait for grecaptcha
        await new Promise((resolve, reject) => {
          let checks = 0
          const id = setInterval(() => {
            // @ts-ignore
            if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
              clearInterval(id)
              resolve(true)
            }
            checks += 1
            if (checks > 50) {
              clearInterval(id)
              reject(new Error('reCAPTCHA not available'))
            }
          }, 100)
        })
      }

      // Create container if not exists
      let container = document.getElementById('recaptcha-widget-container')
      if (!container) {
        container = document.createElement('div')
        container.id = 'recaptcha-widget-container'
        // keep it visually hidden except the badge
        container.style.position = 'fixed'
        container.style.bottom = '0'
        container.style.right = '0'
        container.style.zIndex = '9999'
        document.body.appendChild(container)
      }

      // Render only once
      if (widgetId === null) {
        // @ts-ignore
        widgetId = window.grecaptcha.render(container, {
          sitekey: siteKey,
          size: 'invisible',
          badge: 'bottomright',
          callback: (token: string) => {
            // resolve all pending promises
            pendingResolvers.forEach((r) => r(token))
            pendingResolvers = []
          },
          'error-callback': () => {
            pendingResolvers.forEach((r) => r(''))
            pendingResolvers = []
          },
        })
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[recaptcha] widget not rendered', err)
    }
  }

  async function execute(): Promise<string> {
    if (!siteKey) return ''
    const route = useRoute()
    if (route.path.startsWith('/admin')) return ''

    try {
      await renderWidgetIfAllowed()
      // @ts-ignore
      if (!window.grecaptcha || typeof window.grecaptcha.execute !== 'function') {
        return ''
      }

      return await new Promise<string>((resolve) => {
        // push resolver, will be called by callback
        pendingResolvers.push((token: string) => resolve(token))
        try {
          // @ts-ignore
          window.grecaptcha.execute(widgetId)
        } catch (err) {
          // clear resolver and resolve empty
          pendingResolvers = pendingResolvers.filter((r) => r !== resolve)
          resolve('')
        }
      })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[recaptcha] execute error', err)
      return ''
    }
  }

  // Manage render/hide on route change so admin pages don't show the badge
  if (process.client) {
    const route = useRoute()
    const router = useRouter()

    // Initial render unless on admin
    renderWidgetIfAllowed().catch(() => {})

    // Watch route changes and hide/show badge accordingly
    // Use router.afterEach to avoid SSR issues
    router.afterEach((to) => {
      try {
        const path = to.fullPath || to.path || ''
        const container = document.getElementById('recaptcha-widget-container')
        if (path.startsWith('/admin')) {
          if (container) {
            container.style.display = 'none'
          }
        } else {
          if (container) {
            container.style.display = ''
          }
          // ensure widget exists on non-admin pages
          renderWidgetIfAllowed().catch(() => {})
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[recaptcha] route change handling failed', e)
      }
    })
  }

  return {
    provide: {
      recaptcha: {
        execute,
        load: renderWidgetIfAllowed,
      },
    },
  }
})
