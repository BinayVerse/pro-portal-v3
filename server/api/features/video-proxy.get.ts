import { defineEventHandler, setHeader } from 'h3'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const videoUrl = query.url as string

  if (!videoUrl) {
    setResponseStatus(event, 400)
    throw new Error('Video URL is required')
  }

  try {
    // Decode the URL if it's encoded
    const decodedUrl = decodeURIComponent(videoUrl)

    // Fetch the video from CloudFront
    const response = await fetch(decodedUrl, {
      method: 'GET',
      headers: {
        'Accept-Ranges': 'bytes',
      },
    })

    if (!response.ok) {
      console.error(`Failed to fetch video: ${response.status} ${response.statusText}`)
      setResponseStatus(event, response.status)
      throw new Error(`Failed to fetch video: ${response.statusText}`)
    }

    // Set CORS headers and media type
    setHeader(event, 'Access-Control-Allow-Origin', '*')
    setHeader(event, 'Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
    setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Range')
    setHeader(event, 'Content-Type', response.headers.get('Content-Type') || 'video/mp4')
    setHeader(event, 'Accept-Ranges', 'bytes')
    setHeader(event, 'Cache-Control', 'public, max-age=3600')

    // Copy content length if available
    const contentLength = response.headers.get('Content-Length')
    if (contentLength) {
      setHeader(event, 'Content-Length', contentLength)
    }

    // Stream the video response
    return response.arrayBuffer()
  } catch (err: any) {
    console.error('Video proxy error:', err.message)
    setResponseStatus(event, 500)
    throw err
  }
})
