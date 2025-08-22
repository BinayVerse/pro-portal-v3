// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },

  // Modules
  modules: ['@nuxt/ui', '@nuxt/icon', '@pinia/nuxt', '@nuxtjs/tailwindcss'],

  // CSS
  css: ['~/assets/css/main.css'],

  // UI Configuration
  ui: {
    global: true,
    icons: ['heroicons', 'simple-icons'],
    safelistColors: ['primary', 'brand'],
  },

  // Icon Configuration
  icon: {
    serverBundle: {
      collections: ['heroicons', 'simple-icons'],
    },
  },

  // Color Mode (Dark theme by default)
  colorMode: {
    preference: 'dark',
    fallback: 'dark',
    classPrefix: '',
    classSuffix: '',
    storageKey: 'color-mode',
  },

  // TypeScript
  typescript: {
    strict: false,
    typeCheck: false,
  },

  // TailwindCSS
  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
    configPath: 'tailwind.config.ts',
  },

  // Nitro (Server)
  nitro: {
    experimental: {
      wasm: true,
    },
    storage: {
      dev: {
        driver: 'fs',
        base: './.data',
      },
    },
  },

  // Router options to fix manifest issues
  router: {
    options: {
      hashMode: false,
    },
  },

  // Experimental features to fix manifest conflicts
  experimental: {
    payloadExtraction: false,
    writeEarlyHints: false,
  },

  // App Config
  app: {
    head: {
      title: 'provento.ai - Your AI Partner for Smarter Interactions',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          hid: 'description',
          name: 'description',
          content: 'A modern Vue 3 dashboard with Nuxt UI',
        },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },

  // Runtime Config
  runtimeConfig: {
    // Private keys (only available on server-side)
    dbUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,

    // Public keys (exposed to client-side)
    public: {
      apiBase: process.env.API_BASE_URL || '/api',
    },
  },

  // Build
  build: {
    transpile: ['@headlessui/vue'],
  },

  // Disable SSR for easier development
  ssr: false,
})
