import { z } from 'zod'

export const BaseSchema = z.object({
  NUXT_HOST: z.string().optional(),
  NUXT_PORT: z.string().optional(),
})

const PrivateSchema = z.object({
  NODE_ENV: z.string(),
  NUXT_PUBLIC_APP_URL: z.string(),
  NUXT_PUBLIC_SITE_KEY: z.string().default('http://localhost:3000/'),
  NUXT_SES_FROM_EMAIL_ID: z.string().optional(),
  NUXT_SALES_TEAM_EMAILS: z.string().optional(),
  NUXT_GOOGLE_CAPTCHA_SECRET_KEY: z.string(),
  NUXT_JWT_TOKEN: z.string(),
  NUXT_PUBLIC_GOOGLE_CLIENT_ID: z.string(),
  NUXT_GOOGLE_CLIENT_SECRET: z.string(),
  NUXT_PUBLIC_MICROSOFT_APP_ID: z.string(),
  NUXT_PUBLIC_MICROSOFT_REDIRECT_URI: z.string(),
  NUXT_GOOGLE_APPLICATION_CREDENTIALS_BASE64: z.string(),
  NUXT_PUBLIC_SLACK_CLIENT_ID: z.string(),
  NUXT_SLACK_CLIENT_SECRET: z.string(),
  NUXT_PUBLIC_SLACK_REDIRECT_URI: z.string(),
  NUXT_PUBLIC_BOT_ENDPOINT: z.string(),
  NUXT_AWS_REGION: z.string(),
  NUXT_AWS_ACCESS_KEY_ID: z.string(),
  NUXT_AWS_SECRET_ACCESS_KEY: z.string(),
  NUXT_AWS_BUCKET_NAME: z.string(),
  NUXT_FEATURES_AWS_BUCKET_NAME: z.string(),
  NUXT_AWS_FOLDER_NAME: z.string(),
  // NUXT_PUBLIC_UMAMI_HOST: z.string(),
  // NUXT_PUBLIC_UMAMI_ID: z.string(),
  // NUXT_CHARGEBEE_API_KEY: z.string(),
  // NUXT_CHARGEBEE_SITE: z.string(),
  // NUXT_CHARGEBEE_PRODUCT_CATALOG_VERSION: z.string(),
  // NUXT_CHARGEBEE_FAMILY: z.string(),
  // NUXT_CHARGEBEE_GATEWAY_KEY: z.string(),
  // // Braintree
  // NUXT_BRAINTREE_ENVIRONMENT: z.string(),
  // NUXT_BRAINTREE_MERCHANT_ID: z.string(),
  // NUXT_BRAINTREE_PUBLIC_KEY: z.string(),
  // NUXT_BRAINTREE_PRIVATE_KEY: z.string(),
  // Cloudflare
  NUXT_CF_DOMAIN: z.string(),
  NUXT_CF_KEY_PAIR_ID: z.string(),
  NUXT_CF_PRIVATE_KEY: z.string(),
  // Database
  NUXT_DB_HOST: z.string(),
  NUXT_DB_PORT: z.string(),
  NUXT_DB_NAME: z.string(),
  NUXT_DB_USER: z.string(),
  NUXT_DB_PASSWORD: z.string(),
})

export const Env = BaseSchema.merge(PrivateSchema)
