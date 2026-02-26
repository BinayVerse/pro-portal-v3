import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

export type EmailMessage = {
  to: string | string[]
  from: string
  subject: string
  text?: string
  html?: string
  cc?: string | string[]
  bcc?: string | string[]
  replyTo?: string | string[]
}

function toArray(v?: string | string[]): string[] | undefined {
  if (!v) return undefined
  return Array.isArray(v) ? v : [v]
}

export async function sendEmail(msg: EmailMessage): Promise<void> {
  const config = useRuntimeConfig()
  const client = new SESClient({
    region: config.awsRegion,
    credentials: {
      accessKeyId: config.awsAccessKeyId as string,
      secretAccessKey: config.awsSecretAccessKey as string,
    },
  })

  const ToAddresses = toArray(msg.to) || []
  const CcAddresses = toArray(msg.cc)
  const BccAddresses = toArray(msg.bcc)
  const ReplyToAddresses = toArray(msg.replyTo) || toArray(msg.from)

  const command = new SendEmailCommand({
    Destination: {
      ToAddresses,
      CcAddresses,
      BccAddresses,
    },
    Message: {
      Subject: { Data: msg.subject, Charset: 'UTF-8' },
      Body: {
        Html: msg.html ? { Data: msg.html, Charset: 'UTF-8' } : undefined,
        Text: msg.text ? { Data: msg.text, Charset: 'UTF-8' } : undefined,
      },
    },
    Source: msg.from,
    ReplyToAddresses,
  })

  await client.send(command)
}
