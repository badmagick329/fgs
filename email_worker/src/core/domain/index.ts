export type STATUS = 'success' | 'pending' | 'failed';

export interface IdResult {
  id: number;
}

export type Registration = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  registration_message: string;
  registered_at: string;
  updated_at: string | null;
  email_status: STATUS;
  retry_count: number;
};
export interface Notification {
  payload: Registration[];
}
