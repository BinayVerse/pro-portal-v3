import { SESClient, SendRawEmailCommand } from '@aws-sdk/client-ses'

export type EmailAttachment = {
  filename: string
  content: string | Buffer
  contentType?: string
}

export type EmailMessage = {
  to: string | string[]
  from: string
  subject: string
  text?: string
  html?: string
  cc?: string | string[]
  bcc?: string | string[]
  replyTo?: string | string[]
  attachments?: EmailAttachment[]
}

function toArray(v?: string | string[]): string[] | undefined {
  if (!v) return undefined
  return Array.isArray(v) ? v : [v]
}

function generateBoundary(): string {
  return `----${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
}

function buildMimeMessage(msg: EmailMessage): string {
  const boundary = generateBoundary()
  const ToAddresses = toArray(msg.to) || []
  const CcAddresses = toArray(msg.cc) || []
  const ReplyToAddresses = toArray(msg.replyTo) || toArray(msg.from) || []

  let headers = `To: ${ToAddresses.join(', ')}\r\n`
  headers += `From: ${msg.from}\r\n`
  if (CcAddresses.length > 0) headers += `Cc: ${CcAddresses.join(', ')}\r\n`
  if (ReplyToAddresses.length > 0) headers += `Reply-To: ${ReplyToAddresses.join(', ')}\r\n`
  headers += `Subject: ${msg.subject}\r\n`
  headers += `MIME-Version: 1.0\r\n`
  headers += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n`

  let body = `\r\n--${boundary}\r\n`
  body += `Content-Type: ${msg.html ? 'text/html' : 'text/plain'}; charset=UTF-8\r\n`
  body += `Content-Transfer-Encoding: 7bit\r\n\r\n`
  body += msg.html || msg.text || ''
  body += `\r\n`

  // Add attachments
  if (msg.attachments && msg.attachments.length > 0) {
    for (const attachment of msg.attachments) {
      const contentType = attachment.contentType || 'application/octet-stream'
      const content = typeof attachment.content === 'string'
        ? Buffer.from(attachment.content, 'utf-8')
        : attachment.content

      const base64Content = content.toString('base64')

      body += `--${boundary}\r\n`
      body += `Content-Type: ${contentType}; name="${attachment.filename}"\r\n`
      body += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n`
      body += `Content-Transfer-Encoding: base64\r\n\r\n`
      body += base64Content
      body += `\r\n`
    }
  }

  body += `--${boundary}--`

  return headers + body
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
  const BccAddresses = toArray(msg.bcc)

  let command

  if (msg.attachments && msg.attachments.length > 0) {
    // Use RawEmail for attachments
    const rawMessage = buildMimeMessage(msg)

    command = new SendRawEmailCommand({
      RawMessage: {
        Data: Buffer.from(rawMessage),
      },
      Destinations: [...ToAddresses, ...(BccAddresses || [])],
      Source: msg.from,
    })
  } else {
    // Use standard SendEmail for simple messages
    const { SendEmailCommand } = await import('@aws-sdk/client-ses')

    command = new SendEmailCommand({
      Destination: {
        ToAddresses,
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
    })
  }

  await client.send(command)
}
