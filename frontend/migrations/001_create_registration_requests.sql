CREATE TABLE IF NOT EXISTS registration_requests (
  id SERIAL PRIMARY KEY,
  student_name TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  campus TEXT NOT NULL,
  preferred_appointment_at TIMESTAMPTZ NOT NULL,
  registration_message TEXT NULL,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NULL,
  email_status TEXT NOT NULL DEFAULT 'pending',
  retry_count INTEGER NOT NULL DEFAULT 0
);
