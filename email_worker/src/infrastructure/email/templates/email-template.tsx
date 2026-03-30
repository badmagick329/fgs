import type { Notification } from '@/domain/interfaces';

const PAKISTAN_DATE_FORMAT = new Intl.DateTimeFormat('en-PK', {
  dateStyle: 'short',
  timeZone: 'Asia/Karachi',
});

const PAKISTAN_DATE_TIME_FORMAT = new Intl.DateTimeFormat('en-PK', {
  dateStyle: 'short',
  timeStyle: 'medium',
  timeZone: 'Asia/Karachi',
});

export function EmailTemplate({ payload }: Notification) {
  return (
    <div>
      <h1>New Student Registration Requests</h1>
      <p>
        The following registration requests were received today:{' '}
        {PAKISTAN_DATE_FORMAT.format(new Date())}
      </p>
      {payload.map((data) => (
        <div key={data.id}>
          <ul>
            <li>
              <strong>Student Name:</strong> {data.student_name}
            </li>
            <li>
              <strong>Parent Name:</strong> {data.parent_name}
            </li>
            <li>
              <strong>Class:</strong> {data.class_name}
            </li>
            <li>
              <strong>Mobile Number:</strong> {data.mobile_number}
            </li>
            <li>
              <strong>Campus:</strong> {data.campus}
            </li>
            <li>
              <strong>Preferred Appointment:</strong>{' '}
              {PAKISTAN_DATE_TIME_FORMAT.format(
                new Date(data.preferred_appointment_at)
              )}
            </li>
          </ul>
          {data.registration_message && <p>{data.registration_message}</p>}
          <p>
            registered at:{' '}
            {data.registered_at &&
              PAKISTAN_DATE_TIME_FORMAT.format(new Date(data.registered_at))}
          </p>
        </div>
      ))}
    </div>
  );
}
