export type EMAIL_STATUS = 'success' | 'pending' | 'failed';

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
  email_status: EMAIL_STATUS;
  retry_count: number;
};
export interface EmailData {
  email_data: Registration[];
}
