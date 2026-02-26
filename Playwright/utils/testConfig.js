/**
 * Test utility functions for environment configuration
 */

// Load environment variables
const BASE_URL = process.env.BASE_URL || 'https://test.provento.ai';
const TEST_EMAIL = process.env.TEST_EMAIL || 'maheshn+0309@proximabiz.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Mahesh@8904';

/**
 * Get the base URL for the test environment
 */
export function getBaseURL() {
  return BASE_URL;
}

/**
 * Get test credentials
 */
export function getTestCredentials() {
  return {
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  };
}

/**
 * Get common URLs used in tests
 */
export function getURLs() {
  return {
    base: BASE_URL,
    login: `${BASE_URL}/login`,
    signup: `${BASE_URL}/signup`,
    dashboard: `${BASE_URL}/admin/dashboard`,
    users: `${BASE_URL}/admin/users`,
    integrations: `${BASE_URL}/admin/integrations`,
    artefacts: `${BASE_URL}/admin/artefacts`
  };
}

/**
 * Login helper function for tests
 */
export async function loginWithCredentials(page) {
  const urls = getURLs();
  const credentials = getTestCredentials();
  
  await page.goto(urls.login);
  await page.getByRole('textbox').nth(0).fill(credentials.email);
  await page.getByRole('textbox').nth(1).fill(credentials.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  
  // Wait for navigation after login
  await page.waitForURL(url => !url.includes('/login'));
}