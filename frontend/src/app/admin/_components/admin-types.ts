export type FormState = {
  status: 'idle' | 'submitting' | 'success' | 'error';
  message: string | null;
};

export type AdminConfig = {
  id: number;
  notification_email: string;
  updated_by_admin_user_id: number;
  updated_at: string;
  updated_by_email: string;
} | null;
