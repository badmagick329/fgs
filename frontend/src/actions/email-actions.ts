'use server'
import { Resend } from 'resend'
import { EmailTemplate, EmailTemplateProps } from '@/components/email-template'
import { Result, ErrorRecord } from '@/types/result'

const resend = new Resend(process.env.RESEND_API_KEY)
const SENDER = process.env.SENDER_EMAIL_ADDRESS || 'no-replay@example.com'
const DEST = process.env.DESTINATION_EMAIL_ADDRESS

export async function sendEmail({
  firstName = 'Harold',
  lastName = 'Finch',
  message = 'no message provided',
}: EmailTemplateProps): Promise<Result<{ providerId: string }>> {
  if (!DEST) return { ok: false, error: 'no destination email configured' }
  try {
    const { data, error } = await resend.emails.send({
      from: `Registration Form <${SENDER}>`,
      to: `${DEST}`,
      subject: 'New Student Registration',
      react: EmailTemplate({
        firstName,
        lastName,
        message,
      }),
    })

    console.info('Resend response', { data, error })

    if (error) {
      return { ok: false, error: String(error) }
    }
    return { ok: true, data: { providerId: data?.id ?? '' } }
  } catch (err) {
    console.error('Resend error', err)
    const e = err as Error
    const record: ErrorRecord = {
      message: e.message ?? 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? e.stack : undefined,
    }
    return { ok: false, errors: [record] }
  }
}
