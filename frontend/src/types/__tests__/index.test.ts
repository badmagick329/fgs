import { describe, expect, it } from 'bun:test';
import { createRegistrationSchema } from '@/types';
import { createFutureRegistrationAppointmentAt } from '@/test/registration-test-utils';

function createValidRegistration(overrides: Record<string, unknown> = {}) {
  return {
    studentName: 'Student Name',
    parentName: 'Parent Name',
    className: 'Class 5',
    mobileNumber: '03001234567',
    campus: 'FGS Ravi Road Boys Campus',
    preferredAppointmentAt: createFutureRegistrationAppointmentAt(),
    ...overrides,
  };
}

describe('createRegistrationSchema mobileNumber', () => {
  it('accepts a valid local Pakistani mobile number', () => {
    const parsed = createRegistrationSchema.safeParse(createValidRegistration());

    expect(parsed.success).toBe(true);
  });

  it('rejects an empty mobile number with the required message', () => {
    const parsed = createRegistrationSchema.safeParse(
      createValidRegistration({ mobileNumber: '' })
    );

    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    expect(parsed.error.issues[0]?.message).toBe('Mobile number is required');
  });

  for (const mobileNumber of [
    '999',
    '0300123456',
    '030012345678',
    '04001234567',
    '0300ABCDEFG',
  ]) {
    it(`rejects malformed mobile number ${mobileNumber}`, () => {
      const parsed = createRegistrationSchema.safeParse(
        createValidRegistration({ mobileNumber })
      );

      expect(parsed.success).toBe(false);
      if (parsed.success) return;
      expect(parsed.error.issues[0]?.message).toBe(
        'Enter a valid mobile number in the format 03XXXXXXXXX.'
      );
    });
  }
});
