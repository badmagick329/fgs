import type { Notification } from '@/domain';

export function EmailTemplate({ payload }: Notification) {
  return (
    <div>
      <h1>New Student Registrations</h1>
      <p>
        The following registrations were made today:{' '}
        {new Date().toLocaleDateString()}
      </p>
      {payload.map((data) => (
        <div key={data.id}>
          <ul>
            <li>
              <strong>First Name:</strong> {data.first_name}
            </li>
            <li>
              <strong>Last Name:</strong> {data.last_name}
            </li>
          </ul>
          <p>{data.registration_message}</p>
          <p>email: {data.email}</p>
          <p>
            registered at:{' '}
            {data.registered_at &&
              new Date(data.registered_at).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
