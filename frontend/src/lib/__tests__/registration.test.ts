import { describe, expect, it } from 'bun:test';
import { normalizeRegistrationCampus } from '@/lib/registration';

describe('normalizeRegistrationCampus', () => {
  it('maps every legacy campus name to its canonical value', () => {
    expect(normalizeRegistrationCampus('Boys Campus')).toBe(
      'FGS Ravi Road Boys Campus'
    );
    expect(normalizeRegistrationCampus('Girls Campus')).toBe(
      'FGS Ravi Road Girls Campus'
    );
    expect(normalizeRegistrationCampus('Kids Campus')).toBe(
      'FGS Ravi Road Kids Campus'
    );
    expect(normalizeRegistrationCampus('Edward Road Campus')).toBe(
      'FGS Edward Road (PG to Matric)'
    );
  });
});
