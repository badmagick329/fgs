import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function getRegistrations() {
  const res = await pool.query(`SELECT * from registrations`)
  return res.rows
}

export async function getPendingEmails() {
  const res = await pool.query(`
    SELECT * FROM registrations
    WHERE email_status = 'pending' AND retry_count < 3
  `)
  return res.rows
}

export async function setFailedEmailStatus(id: number) {
  await pool.query(
    `
    UPDATE registrations
    SET email_status = 'failed', retry_count = retry_count + 1
    WHERE id = $1
  `,
    [id],
  )
}

export async function setSuccessEmailStatus(id: number) {
  await pool.query(
    `
    UPDATE registrations
    SET email_status = 'success'
    WHERE id = $1
  `,
    [id],
  )
}

export async function createRegistration({
  firstName,
  lastName,
  email,
}: {
  firstName: string
  lastName: string
  email: string
}) {
  const res = await pool.query(
    `
    INSERT INTO registrations (first_name, last_name, email)
    VALUES ($1, $2, $3)
    RETURNING *`,
    [firstName, lastName, email],
  )
  return res.rows[0]
}
