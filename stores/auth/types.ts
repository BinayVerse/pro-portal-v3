export interface AuthUser {
  user_id?: string;
  email?: string;
  name?: string;
  contact_number?: string;
  org_id?: string;
  primary_contact?: boolean;
  role_id?: number;
  profile_complete?: boolean;
  added_by?: string;
  created_at?: string;
  updated_at?: string;
  departments?: string[]; // 🔑 User's assigned department IDs
}

export interface ApiResponse<T = any> {
  status: string;
  message?: string;
  data?: T;
  token?: string;
  user?: AuthUser;
  redirect?: string;
}


export type LoginSuccess = {
  status: 'success'
  token: string
  user: AuthUser
  redirect?: string
}

export type Requires2FASetup = {
  status: 'success'
  requires_2fa_setup: true
  temp_token: string
  user?: { email: string; name?: string }
}

export type RequiresOTP = {
  status: 'success'
  requires_otp: true
  temp_token: string
  user?: { email: string; name?: string }
}

export type AuthResponse =
  | LoginSuccess
  | Requires2FASetup
  | RequiresOTP