import { describe, expect, it } from 'bun:test';
import { isAnalyticsPath } from '../PlausibleScript';

describe('isAnalyticsPath', () => {
  it('keeps analytics on public pages', () => {
    for (const path of ['/', '/register', '/alumni-connect', '/administration']) {
      expect(isAnalyticsPath(path)).toBe(true);
    }
  });

  it('keeps analytics off admin and registration review pages', () => {
    for (const path of [
      '/admin',
      '/admin/login',
      '/admin/setup',
      '/admin/alumni-stories',
      '/registrations',
    ]) {
      expect(isAnalyticsPath(path)).toBe(false);
    }
  });
});
