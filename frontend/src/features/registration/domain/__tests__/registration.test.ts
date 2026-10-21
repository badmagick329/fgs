import {
  REGISTRATIONS_MAX_PAGE,
  REGISTRATION_CLASS_MAX_LENGTH,
  REGISTRATION_NAME_MAX_LENGTH,
  createRegistrationSchema,
  registrationPageNumberSchema,
} from '@/features/registration/domain/registration';
import { createFutureRegistrationAppointmentAt } from '@/test/registration-test-utils';
import { describe, expect, it } from 'bun:test';

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
    const parsed = createRegistrationSchema.safeParse(
      createValidRegistration()
    );

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

describe('createRegistrationSchema length limits', () => {
  for (const [field, max] of [
    ['studentName', REGISTRATION_NAME_MAX_LENGTH],
    ['parentName', REGISTRATION_NAME_MAX_LENGTH],
    ['className', REGISTRATION_CLASS_MAX_LENGTH],
  ] as const) {
    it(`accepts ${field} at ${max} characters and rejects ${max + 1}`, () => {
      expect(
        createRegistrationSchema.safeParse(
          createValidRegistration({ [field]: 'x'.repeat(max) })
        ).success
      ).toBe(true);

      const parsed = createRegistrationSchema.safeParse(
        createValidRegistration({ [field]: 'x'.repeat(max + 1) })
      );
      expect(parsed.success).toBe(false);
      if (parsed.success) return;
      expect(parsed.error.issues[0]?.path).toEqual([field]);
    });
  }

  it('measures the limit after trimming surrounding whitespace', () => {
    const parsed = createRegistrationSchema.safeParse(
      createValidRegistration({
        studentName: `  ${'x'.repeat(REGISTRATION_NAME_MAX_LENGTH)}  `,
      })
    );

    expect(parsed.success).toBe(true);
  });

  it('rejects an oversize honeypot value', () => {
    const parsed = createRegistrationSchema.safeParse(
      createValidRegistration({ honeypot: 'x'.repeat(10_000) })
    );

    expect(parsed.success).toBe(false);
  });
});

describe('registrationPageNumberSchema', () => {
  it('coerces a numeric query value', () => {
    expect(registrationPageNumberSchema.parse('2')).toBe(2);
  });

  for (const value of [
    '0',
    '-3',
    '2.5',
    'two',
    String(REGISTRATIONS_MAX_PAGE + 1),
  ]) {
    it(`rejects ${value}`, () => {
      expect(registrationPageNumberSchema.safeParse(value).success).toBe(false);
    });
  }
});
