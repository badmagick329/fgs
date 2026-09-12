import { afterEach, describe, expect, it, spyOn } from 'bun:test';
import { getRegistrationEmailStatus, getRegistrations } from '../registration';

describe('registration client', () => {
  let fetchSpy: ReturnType<typeof spyOn<typeof globalThis, 'fetch'>>;

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it.each([getRegistrations, getRegistrationEmailStatus])(
    'preserves the authentication error for protected queries',
    async (query) => {
      fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
        Response.json({ message: 'Unauthorized.' }, { status: 401 })
      );

      await expect(query()).rejects.toThrow('Authentication required.');
    }
  );

  it.each([getRegistrations, getRegistrationEmailStatus])(
    'rejects an unsuccessful result even when HTTP status is successful',
    async (query) => {
      fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
        Response.json({ ok: false, message: 'Unable to read records.' })
      );

      await expect(query()).rejects.toThrow('Unable to read records.');
    }
  );

  it('converts registration dates and normalizes stored campus names', async () => {
    const appointment = '2026-09-14T04:00:00.000Z';
    const registeredAt = '2026-09-12T09:00:00.000Z';
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({
        ok: true,
        data: [
          {
            id: 1,
            student_name: 'Student',
            parent_name: 'Parent',
            class_name: 'Class 5',
            mobile_number: '03001234567',
            campus: 'Boys Campus',
            preferred_appointment_at: appointment,
            registration_message: null,
            registered_at: registeredAt,
            updated_at: null,
            email_status: 'pending',
            retry_count: 0,
          },
        ],
      })
    );

    const registrations = await getRegistrations();

    expect(registrations[0]).toMatchObject({
      campus: 'FGS Ravi Road Boys Campus',
      preferred_appointment_at: new Date(appointment),
      registered_at: new Date(registeredAt),
      updated_at: null,
    });
  });

  it('converts worker timestamps for the countdown and preserves null dates', async () => {
    const nextRunAt = '2026-09-12T09:05:00.000Z';
    const updatedAt = '2026-09-12T09:00:00.000Z';
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({
        ok: true,
        data: {
          id: 1,
          last_started_at: null,
          last_finished_at: null,
          next_run_at: nextRunAt,
          updated_at: updatedAt,
        },
      })
    );

    expect(await getRegistrationEmailStatus()).toEqual({
      id: 1,
      last_started_at: null,
      last_finished_at: null,
      next_run_at: new Date(nextRunAt),
      updated_at: new Date(updatedAt),
    });
  });

  it('preserves an absent worker schedule', async () => {
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({ ok: true, data: null })
    );

    expect(await getRegistrationEmailStatus()).toBeNull();
  });
});
