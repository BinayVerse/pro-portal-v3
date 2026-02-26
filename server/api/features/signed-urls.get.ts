import { defineEventHandler, setResponseStatus } from 'h3'
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl as getCfSignedUrl } from '@aws-sdk/cloudfront-signer'
import { CustomError } from '../../utils/custom.error'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const bucketName = config.featuresAwsBucketName
  const region = config.awsRegion

  const privateKey = Buffer
    .from(process.env.NUXT_CF_PRIVATE_KEY!, 'base64')
    .toString('utf8')

  if (!bucketName) {
    setResponseStatus(event, 500)
    throw new CustomError('AWS bucket not configured', 500)
  }

  const s3 = new S3Client({
    region,
    credentials: {
      accessKeyId: config.awsAccessKeyId,
      secretAccessKey: config.awsSecretAccessKey,
    },
  })

  const videos = [
    { id: 'onboarding', title: 'Onboarding & Subscription', key: 'Onboarding-Subscription.mp4' },
    { id: 'artifact', title: 'Artifact & User Management', key: 'Artifact-UserManagement.mp4' },
    { id: 'channel', title: 'Channel Connection & Communication', key: 'ChannelConnection-Communication.mp4' },
    { id: 'analytics', title: 'Analytics & Dashboard', key: 'Analytics-Dashboard.mp4' },
  ]

  const expiresIn = 7200
  const result = []

  for (const video of videos) {
    try {
      // ✅ Still verify object exists in S3
      await s3.send(
        new HeadObjectCommand({
          Bucket: bucketName,
          Key: video.key,
        })
      )

      // ✅ Generate CloudFront signed URL
      let signedUrl
      try {
        signedUrl = getCfSignedUrl({
          url: `https://${process.env.NUXT_CF_DOMAIN!}/${video.key}`,
          keyPairId: process.env.NUXT_CF_KEY_PAIR_ID!,
          privateKey,
          dateLessThan: new Date(Date.now() + expiresIn * 1000),
        })
      } catch (e) {
        console.error("SIGNING FAILED:", e)
        throw e
      }

      result.push({
        ...video,
        url: signedUrl,
        expiresIn,
      })

    } catch (err) {
      console.warn(`Skipping missing video: ${video.key}`)
      console.error('HeadObject failed FULL:', {
        key: video.key,
        name: err?.name,
        message: err?.message,
        code: err?.Code,
        stack: err?.stack,
      })
    }
  }

  setResponseStatus(event, 200)
  return { status: 'success', videos: result }
})
