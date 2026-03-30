import { Registration } from '@/types';
import { registrationListSchema, registrationSchema } from '@/types';
import { Pool } from 'pg';
import 'server-only';
import { Result, errorsFromZod } from '@/lib/result';
import { IRegistrationRepository } from '@/lib/serveronly/domain/interfaces';

export class RegistrationRepository implements IRegistrationRepository {
  constructor(private readonly pool: Pool) {}

  async getRegistrations(): Promise<Result<Registration[]>> {
    const res = await this.pool.query(`
      SELECT *
      FROM registration_requests
      ORDER BY registered_at DESC, id DESC
    `);
    const parsed = registrationListSchema.safeParse(res.rows);
    if (!parsed.success) {
      console.error('getRegistrations validation error', parsed.error);
      return {
        ok: false,
        message: 'There was an error fetching the data.',
        errors: errorsFromZod(parsed.error),
      };
    }

    return { ok: true, data: parsed.data };
  }

  async createRegistration(input: {
    studentName: string;
    parentName: string;
    className: string;
    mobileNumber: string;
    campus: string;
    preferredAppointmentAt: string;
  }): Promise<Result<Registration>> {
    const {
      studentName,
      parentName,
      className,
      mobileNumber,
      campus,
      preferredAppointmentAt,
    } = input;
    const res = await this.pool.query(
      `
      INSERT INTO registration_requests (
        student_name,
        parent_name,
        class_name,
        mobile_number,
        campus,
        preferred_appointment_at
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        studentName,
        parentName,
        className,
        mobileNumber,
        campus,
        preferredAppointmentAt,
      ]
    );

    const parsed = registrationSchema.safeParse(res.rows[0]);
    if (!parsed.success) {
      console.error('createRegistration validation error', parsed.error);
      return {
        ok: false,
        message: `There was an error creating registration with data: ${JSON.stringify(input)}`,
        errors: errorsFromZod(parsed.error),
      };
    }

    return { ok: true, data: parsed.data };
  }
}
