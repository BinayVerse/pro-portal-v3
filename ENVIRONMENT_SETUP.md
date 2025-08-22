# Environment Setup Guide

## Quick Start

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in your actual values** in the `.env` file

3. **Never commit the `.env` file** - it's already in `.gitignore`

## Environment Variables

### Required for Basic Functionality
- `NODE_ENV` - Application environment (dev/test/prod)
- `NUXT_PUBLIC_APP_URL` - Your application URL

### Email Configuration (SendGrid)
- `NUXT_SENDGRID_API_KEY` - SendGrid API key for sending emails
- `NUXT_SENDGRID_FROM_EMAIL_ID` - From email address
- `NUXT_SENDGRID_SALES_TEAM_EMAILS` - Comma-separated sales team emails

### Database Configuration
- `NUXT_DB_HOST` - Database host
- `NUXT_DB_PORT` - Database port
- `NUXT_DB_NAME` - Database name
- `NUXT_DB_USER` - Database username
- `NUXT_DB_PASSWORD` - Database password

### Authentication
- `NUXT_JWT_TOKEN` - JWT secret for authentication
- `NUXT_PUBLIC_GOOGLE_CLIENT_ID` - Google OAuth client ID
- `NUXT_GOOGLE_CLIENT_SECRET` - Google OAuth client secret

### Optional Integrations
- Microsoft Teams integration variables
- Slack integration variables
- AWS S3 storage variables

## Security Notes

⚠️ **NEVER commit sensitive environment variables to version control**

✅ **DO:**
- Use `.env.example` as a template
- Keep `.env` in `.gitignore`
- Use different values for different environments
- Store production secrets securely

❌ **DON'T:**
- Commit actual API keys or passwords
- Share `.env` files via email or chat
- Use production credentials in development
