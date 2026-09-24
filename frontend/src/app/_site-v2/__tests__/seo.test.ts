import { metadata as adminMetadata } from '@/app/admin/layout';
import { metadata as registrationsMetadata } from '@/app/registrations/layout';
import sitemap from '@/app/sitemap';
import { describe, expect, it } from 'bun:test';
import { contactPageContent, registerContent } from '../content';
import { ADMISSIONS_OFFICE_HOURS } from '../structured-data';

function to12Hour(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

describe('seo', () => {
  it('keeps private admin routes out of search results and the sitemap', () => {
    expect(adminMetadata.robots).toEqual({ index: false, follow: false });
    expect(registrationsMetadata.robots).toEqual({
      index: false,
      follow: false,
    });

    const urls = sitemap().map((entry) => new URL(entry.url).pathname);
    expect(urls).not.toContainEqual(
      expect.stringMatching(/^\/(admin|registrations|archive|api)/)
    );
  });

  it('publishes the same admissions hours in structured data as on the site', () => {
    const shown = registerContent.timings.map((timing) => timing.value);
    const structured = ADMISSIONS_OFFICE_HOURS.map(
      (hours) => `${to12Hour(hours.opens)} - ${to12Hour(hours.closes)}`
    );

    expect(structured).toEqual(shown);
    expect(contactPageContent.timingsParagraphs.join(' ')).toContain(shown[0]);
    expect(contactPageContent.timingsParagraphs.join(' ')).toContain(shown[1]);
  });
});
