export interface Clinic {
  id: number;
  name: string;
  nit: string;
  address: string;
  email: string;
  phone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClinicMinimal {
  id: number;
  name: string;
  nit: string;
}

export interface DataPolicy {
  id: number;
  clinic: number;
  clinic_name: string;
  version: string;
  content: string;
  effective_date: string;
  is_active: boolean;
  created_at: string;
}

export interface DataAuthorization {
  id: number;
  clinic: number;
  clinic_name: string;
  version: string;
  content: string;
  effective_date: string;
  is_active: boolean;
  created_at: string;
}

export interface PendingTermsResponse {
  clinic: ClinicMinimal;
  needs_acceptance: boolean;
  policy: DataPolicy | null;
  authorization: DataAuthorization | null;
}

export interface AcceptTermsPayload {
  clinic_id: number;
  policy_id?: number;
  authorization_id?: number;
}

export interface AcceptTermsResponse {
  message: string;
  acceptance: {
    clinic_id: number;
    accepted_at: string;
    policy_version: string | null;
    authorization_version: string | null;
  };
}
