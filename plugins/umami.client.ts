export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig()

    if (!config.public.umamiId || !config.public.umamiHost) {
        console.warn('Umami disabled: missing runtime config')
        console.log('Umami disabled: missing runtime config')
        return
    }

    const script = document.createElement('script')
    script.defer = true
    script.src = `${config.public.umamiHost}/script.js`
    script.setAttribute('data-website-id', config.public.umamiId)
    console.log('Umami plugin loaded')

    document.head.appendChild(script)
})
