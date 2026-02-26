import validateEnvs from "./envs/env.validator";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  runtimeConfig: {
    // Private keys (only available on server-side)
    dbUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    public: {
      siteKey: process.env.NUXT_PUBLIC_SITE_KEY || '',
      appUrl: process.env.NUXT_PUBLIC_APP_URL || '',
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID,
      slackClientId: process.env.NUXT_PUBLIC_SLACK_CLIENT_ID,
      slackRedirectUri: process.env.NUXT_PUBLIC_SLACK_REDIRECT_URI,
      botEndpoint: process.env.NUXT_PUBLIC_BOT_ENDPOINT,
      microsoftAppId: process.env.NUXT_PUBLIC_MICROSOFT_APP_ID,
      microsoftRedirectUri: process.env.NUXT_PUBLIC_MICROSOFT_REDIRECT_URI,
      chargebeePublishableKey: process.env.NUXT_PUBLIC_CHARGEBEE_PUBLISHABLE_KEY,
      apiBase: process.env.API_BASE_URL || '/api',
      awsMarketplaceLink: process.env.NUXT_PUBLIC_AWS_MARKETPLACE_LINK || '',
      // Umami Analytics
      umamiHost: process.env.NUXT_PUBLIC_UMAMI_HOST || '',
      umamiId: process.env.NUXT_PUBLIC_UMAMI_ID || '',
    },
    dbUser: process.env.NUXT_DB_USER,
    dbPassword: process.env.NUXT_DB_PASSWORD,
    dbHost: process.env.NUXT_DB_HOST,
    dbName: process.env.NUXT_DB_NAME,
    dbPort: process.env.NUXT_DB_PORT,
    sesFromEmailId: process.env.NUXT_SES_FROM_EMAIL_ID,
    salesTeamEmails: process.env.NUXT_SALES_TEAM_EMAILS,
    googleCaptchaSecretKey: process.env.NUXT_GOOGLE_CAPTCHA_SECRET_KEY,
    jwtToken: process.env.NUXT_JWT_TOKEN,
    googleClientSecret: process.env.NUXT_GOOGLE_CLIENT_SECRET,
    googleApplicationCredentialsBase64: process.env.NUXT_GOOGLE_APPLICATION_CREDENTIALS_BASE64,
    slackClientSecret: process.env.NUXT_SLACK_CLIENT_SECRET,
    awsRegion: process.env.NUXT_AWS_REGION,
    awsAccessKeyId: process.env.NUXT_AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: process.env.NUXT_AWS_SECRET_ACCESS_KEY,
    awsBucketName: process.env.NUXT_AWS_BUCKET_NAME,
    featuresAwsBucketName: process.env.NUXT_FEATURES_AWS_BUCKET_NAME,
    awsFolderName: process.env.NUXT_AWS_FOLDER_NAME,
    // Chargebee
    chargebeeSite: process.env.NUXT_CHARGEBEE_SITE,
    chargebeeApiKey: process.env.NUXT_CHARGEBEE_API_KEY,
    chargebeeFamily: process.env.NUXT_CHARGEBEE_FAMILY,
    chargebeeProductCatalogVersion: process.env.NUXT_CHARGEBEE_CATALOG_VERSION || '2',
    chargebeeGatewayKey: process.env.NUXT_CHARGEBEE_GATEWAY_KEY,
    // Braintree
    braintreeEnvironment: process.env.NUXT_BRAINTREE_ENVIRONMENT,
    braintreeMerchantId: process.env.NUXT_BRAINTREE_MERCHANT_ID,
    braintreePublicKey: process.env.NUXT_BRAINTREE_PUBLIC_KEY,
    braintreePrivateKey: process.env.NUXT_BRAINTREE_PRIVATE_KEY,
    // Cloudflare
    cloudfrontDomain: process.env.NUXT_CF_DOMAIN,
    cloudfrontKeyPairId: process.env.NUXT_CF_KEY_PAIR_ID,
    cloudfrontPrivateKey: process.env.NUXT_CF_PRIVATE_KEY
  },
  hooks: {
    listen: () => validateEnvs(),
  },

  vite: {
    ssr: { external: ['@headlessui/vue'] },
    optimizeDeps: { exclude: ['@headlessui/vue'] },
    server: {
      allowedHosts: [
        'eufemia-umbiliform-ardelle.ngrok-free.dev'
      ]
    }
  },

  build: {
    chunkSizeWarningLimit: 2000
  },

  // Development server configuration
  devServer: {
    port: 3000
  },

  // Modules
  modules: ['@nuxt/ui', '@nuxt/icon', '@pinia/nuxt', '@nuxtjs/tailwindcss', 'nuxt-umami'],

  // CSS
  css: ['~/assets/css/main.css'],

  // UI Configuration
  ui: {
    global: true,
    icons: ['heroicons', 'mdi'],
    safelistColors: ['primary', 'brand'],
  },

  // Icon Configuration
  icon: {
    autoInstall: true,
    serverBundle: {
      collections: ['heroicons', 'mdi'],
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

  // UMAMI Analytics
  umami: {
    autoTrack: false,
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
    routeRules: {
      // Prevent caching for HTML pages (SSR or static)
      '/**': { headers: { 'cache-control': 'no-cache, no-store, must-revalidate' } },
      // Allow caching of assets (hashed filenames change on each build)
      '/_nuxt/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } }
    }
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
    typedPages: true,
  },

  // App Config
  app: {
    head: {
      title: 'provento.ai - Your AI Partner for Smarter Interactions',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          hid: 'provento.ai',
          name: 'provento.ai',
          content: 'Your AI Partner for Smarter Interactions',
        },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },
})
