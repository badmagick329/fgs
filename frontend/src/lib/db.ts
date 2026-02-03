import { sql } from 'bun'

export async function getRegistrations() {
  return await sql`
  SELECT * from registrations
`
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
  const res = await sql`
    INSERT INTO registrations (first_name, last_name, email)
    VALUES (${firstName}, ${lastName}, ${email})
    RETURNING *
  `
  return res
}
