import { getPendingEmails } from '../frontend/src/lib/db.ts'
import { sendEmail } from '../frontend/src/actions/email-actions.ts'

async function main() {
  console.log(`[${new Date().toISOString()}] - Starting email worker`)
  const interval = setInterval(() => {
    try {
      getPendingEmails().then((emails) => {
        console.log(
          `[${new Date().toISOString()}] - Fetched ${emails.length} pending emails`,
        )
        sendEmail({ email_data: emails })
      })
    } catch (error) {
      console.error('Error in getPendingEmails interval:', error)
    }
  }, 60 * 1000) // every 60 seconds at the moment !!!!!! CHANGE THIS FOR LIVE !!!!!!!!!
}

main()
