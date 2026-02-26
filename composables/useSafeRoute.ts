export default function useSafeRoute(): any | null {
  try {
    // In SSR or some environments useRoute might not be available as a function
    // Guard and return null if it's not safe to call
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (typeof useRoute === 'function') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return useRoute()
    }
  } catch (e) {
    // swallow — return null to indicate route not available
  }
  return null
}
