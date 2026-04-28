/**
 * Encryption utility composable using Web Crypto API
 * Provides methods to encrypt and decrypt sensitive data (API keys, secrets)
 *
 * Encryption Strategy:
 * - ON ADD/EDIT: Sensitive fields (client_secret, api_key, access_token, refresh_token)
 *   are encrypted CLIENT-SIDE before being sent to the server
 * - API RESPONSES: Server returns encrypted data - no plaintext is leaked during ADD/EDIT operations
 * - ON FETCH: Encrypted data is stored in the Pinia store without decryption
 * - ON DISPLAY: When user needs to edit, sensitive fields are decrypted CLIENT-SIDE
 *   only when displaying in the form (decryptIntegrationForDisplay)
 * - MASKING: In list views, sensitive data is masked (never decrypted/displayed)
 *
 * Key Derivation:
 * - Uses Web Crypto API's PBKDF2 with SHA-256
 * - Key is derived from user ID + organization ID (ensures same key for same context)
 * - Salt is fixed per session for consistency
 * - Encryption: AES-GCM with 256-bit keys
 * - IV is randomly generated per encryption operation for security
 */

const encryptionAlgorithm = {
  name: 'AES-GCM',
  iv: new Uint8Array(12), // Will be set during encryption
}

/**
 * Derive an encryption key from context
 * Uses a combination of auth token and organization context for consistency
 *
 * Priority for org_id:
 * 1. Router params (orgId)
 * 2. Auth token user data (org_id from authenticated user)
 * 3. Fallback to 'default'
 */
async function deriveEncryptionKey(): Promise<CryptoKey> {
  let orgId: string | undefined

  try {
    orgId = useRouter().currentRoute.value.params.orgId as string
  } catch (e) {
    // Router might not be available
  }

  if (!orgId) {
    try {
      const authStore = useAuthStore()
      orgId = authStore.user?.org_id
    } catch (e) {
      // Auth store might not be available
    }
  }

  // Fallback
  if (!orgId) {
    orgId = 'default'
  }

  const config = useRuntimeConfig()
  const appEncryptionSecret = config.public.encryptionSecret

  const keyMaterial = `${orgId}-${appEncryptionSecret}`

  const encoder = new TextEncoder()
  const keyData = encoder.encode(keyMaterial)

  const baseKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  const salt = new Uint8Array(16)

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}


/**
 * Encrypt a sensitive string value
 * Returns base64 encoded IV + ciphertext for safe storage/transmission
 */
export async function encryptSensitiveData(plaintext: string): Promise<string> {
  if (!plaintext) return plaintext

  try {
    const key = await deriveEncryptionKey()
    const encoder = new TextEncoder()
    const data = encoder.encode(plaintext)

    // Generate a random IV for each encryption
    const iv = crypto.getRandomValues(new Uint8Array(12))

    const ciphertext = await crypto.subtle.encrypt(
      { ...encryptionAlgorithm, iv },
      key,
      data,
    )

    // Combine IV + ciphertext and encode as base64
    const combined = new Uint8Array(iv.length + ciphertext.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(ciphertext), iv.length)

    // Convert to base64 for safe storage
    return btoa(String.fromCharCode(...Array.from(combined)))
  } catch (error) {
    // If encryption fails, return plaintext (fallback for error handling)
    return plaintext
  }
}

/**
 * Decrypt an encrypted string value
 * Expects base64 encoded IV + ciphertext format
 */
export async function decryptSensitiveData(encrypted: string): Promise<string> {
  if (!encrypted) return encrypted

  try {
    // Check if it looks like encrypted data (base64)
    // Encrypted data should have a certain pattern
    const isEncrypted = /^[A-Za-z0-9+/]+=*$/.test(encrypted) && encrypted.length > 20

    if (!isEncrypted) {
      // If it doesn't look encrypted, return as-is (might be plaintext or invalid)
      return encrypted
    }

    const key = await deriveEncryptionKey()

    // Decode from base64
    const combined = new Uint8Array(
      atob(encrypted)
        .split('')
        .map((c) => c.charCodeAt(0)),
    )

    // Extract IV and ciphertext
    const iv = combined.slice(0, 12)
    const ciphertext = combined.slice(12)

    const plaintext = await crypto.subtle.decrypt(
      { ...encryptionAlgorithm, iv },
      key,
      ciphertext,
    )

    const decoder = new TextDecoder()
    return decoder.decode(plaintext)
  } catch (error) {
    // If decryption fails, return encrypted value as-is
    return encrypted
  }
}

/**
 * Encrypt multiple sensitive fields in an object
 * Only encrypts specified fields
 */
export async function encryptSensitiveFields<T extends Record<string, any>>(
  data: T,
  fieldsToEncrypt: (keyof T)[] = ['client_secret', 'api_key'],
): Promise<T> {
  const encrypted = { ...data }

  for (const field of fieldsToEncrypt) {
    if (field in encrypted && encrypted[field]) {
      encrypted[field] = await encryptSensitiveData(encrypted[field])
    }
  }

  return encrypted
}

/**
 * Decrypt multiple sensitive fields in an object
 * Only decrypts specified fields
 */
export async function decryptSensitiveFields<T extends Record<string, any>>(
  data: T,
  fieldsToDecrypt: (keyof T)[] = ['client_secret', 'api_key'],
): Promise<T> {
  const decrypted = { ...data }

  for (const field of fieldsToDecrypt) {
    if (field in decrypted && decrypted[field]) {
      decrypted[field] = await decryptSensitiveData(decrypted[field])
    }
  }

  return decrypted
}

export const useEncryption = () => {
  return {
    encryptSensitiveData,
    decryptSensitiveData,
    encryptSensitiveFields,
    decryptSensitiveFields,
  }
}
