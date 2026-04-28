import { Env } from './env.schema'
import { logError, logWarn } from '../server/utils/logger'

export default function validateEnvs() {
  try {
    const envs = { ...process.env }
    const validation = Env.safeParse(envs)
    if (!validation.success) {
      validation.error.issues.forEach((issue) => {
        logWarn(`Missing env ${issue.path.join('.')} ${issue.message}`)
      })
      // Don't exit in development mode, just warn
      if (process.env.NODE_ENV === 'production') {
        process.exit(1)
      }
    }
  }
  catch (error) {
    logError('Unable to parse .env. validation error', error)
    // Don't exit in development mode
    if (process.env.NODE_ENV === 'production') {
      process.exit(1)
    }
  }
}
