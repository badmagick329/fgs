import { IRegistrationRepository } from '@/features/registration/domain/i-registration-repository';
import {
  EmailWorkerStatus,
  Registration,
  RegistrationPage,
} from '@/features/registration/domain/registration';
import {
  emailWorkerStatusSchema,
  registrationListSchema,
  registrationSchema,
} from '@/features/registration/domain/registration';
import { Pool } from 'pg';
import 'server-only';
import { Result, errorsFromZod } from '@/lib/result';

export class RegistrationRepository implements IRegistrationRepository {
  constructor(private readonly pool: Pool) {}

  async getRegistrations({
    page,
    pageSize,
  }: {
    page: number;
    pageSize: number;
  }): Promise<Result<RegistrationPage>> {
    // One extra row tells us whether a next page exists without a COUNT(*).
    const res = await this.pool.query(
      `
      SELECT *
      FROM registration_requests
      ORDER BY registered_at DESC, id DESC
      LIMIT $1 OFFSET $2
    `,
      [pageSize + 1, (page - 1) * pageSize]
    );
    const parsed = registrationListSchema.safeParse(
      res.rows.slice(0, pageSize)
    );
    if (!parsed.success) {
      console.error('getRegistrations validation error', parsed.error);
      return {
        ok: false,
        message: 'There was an error fetching the data.',
        errors: errorsFromZod(parsed.error),
      };
    }

    return {
      ok: true,
      data: {
        registrations: parsed.data,
        page,
        pageSize,
        hasNextPage: res.rows.length > pageSize,
      },
    };
  }

  async getEmailWorkerStatus(): Promise<Result<EmailWorkerStatus | null>> {
    const res = await this.pool.query(`
      SELECT *
      FROM email_worker_status
      WHERE id = 1
    `);
    const row = res.rows[0] ?? null;

    if (row == null) {
      return { ok: true, data: null };
    }

    const parsed = emailWorkerStatusSchema.safeParse(row);
    if (!parsed.success) {
      console.error('getEmailWorkerStatus validation error', parsed.error);
      return {
        ok: false,
        message: 'There was an error fetching the email worker status.',
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
