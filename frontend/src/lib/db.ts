import { Registration } from "@/types";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function getRegistrations() {
  const res = await pool.query(`SELECT * from registrations`);
  return res.rows as Registration[];
}

export async function createRegistration({
  firstName,
  lastName,
  email,
}: {
  firstName: string;
  lastName: string;
  email: string;
}) {
  const res = await pool.query(
    `
    INSERT INTO registrations (first_name, last_name, email)
    VALUES ($1, $2, $3)
    RETURNING *`,
    [firstName, lastName, email],
  );
  return res.rows[0] as {
    firstName: string;
    lastName: string;
    email: string;
  };
}
