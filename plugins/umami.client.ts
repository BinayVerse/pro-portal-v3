export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig()

    if (!config.public.umamiId || !config.public.umamiHost) {
        return
    }

    const script = document.createElement('script')
    script.defer = true
    script.src = `${config.public.umamiHost}/script.js`
    script.setAttribute('data-website-id', config.public.umamiId)

    document.head.appendChild(script)
})
