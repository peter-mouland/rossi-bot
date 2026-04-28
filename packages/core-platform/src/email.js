import { marked } from 'marked'
import { logger } from './logger.js'

export async function sendEmail(from, to, subject, markdown) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('Missing RESEND_API_KEY')

  const html = marked.parse(markdown)

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend error ${res.status}: ${err}`)
  }

  logger.info(`Email sent to ${to}: "${subject}"`)
}
