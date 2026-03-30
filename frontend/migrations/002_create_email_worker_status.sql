CREATE TABLE IF NOT EXISTS email_worker_status (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  last_started_at TIMESTAMPTZ NULL,
  last_finished_at TIMESTAMPTZ NULL,
  next_run_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
