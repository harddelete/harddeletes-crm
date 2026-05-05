import type { EmploymentType } from "./employee";
import type { EquipmentStatus } from "./equipment";
import type { JobStatus } from "./job";
import type { QuoteStatus } from "./quote";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProfileRow = {
  id: string;
  company_name: string | null;
  owner_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  tax_number: string | null;
  bank_account: string | null;
  default_vat_rate: number;
  quote_footer_text: string | null;
  created_at: string;
  updated_at: string;
};

export type ClientRow = {
  id: string;
  user_id: string;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  tax_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type QuoteRow = {
  id: string;
  user_id: string;
  client_id: string | null;
  quote_number: string;
  title: string;
  description: string | null;
  status: QuoteStatus;
  vat_rate: number;
  subtotal: number;
  vat_amount: number;
  total: number;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
};

export type QuoteItemRow = {
  id: string;
  quote_id: string;
  name: string;
  description: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  line_total: number;
  created_at: string;
};

export type EmployeeRow = {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  position: string | null;
  employment_type: EmploymentType;
  hourly_rate: number;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type EquipmentRow = {
  id: string;
  user_id: string;
  name: string;
  type: string | null;
  identifier: string | null;
  capacity: number | null;
  status: EquipmentStatus;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type JobRow = {
  id: string;
  user_id: string;
  client_id: string | null;
  quote_id: string | null;
  title: string;
  event_type: string | null;
  location_name: string | null;
  address: string | null;
  city: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  expected_participants: number | null;
  price: number;
  status: JobStatus;
  description: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type JobAssignmentRow = {
  id: string;
  user_id: string;
  job_id: string;
  employee_id: string;
  assignment_role: string | null;
  planned_start_time: string | null;
  planned_end_time: string | null;
  actual_start_time: string | null;
  actual_end_time: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type JobEquipmentRow = {
  id: string;
  user_id: string;
  job_id: string;
  equipment_id: string;
  quantity: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type Insertable<T> = Omit<T, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

type Updatable<T> = Partial<Omit<T, "id" | "created_at">>;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Omit<ProfileRow, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Updatable<ProfileRow>;
        Relationships: [];
      };
      clients: {
        Row: ClientRow;
        Insert: Insertable<ClientRow>;
        Update: Updatable<ClientRow>;
        Relationships: [];
      };
      quotes: {
        Row: QuoteRow;
        Insert: Omit<Insertable<QuoteRow>, "quote_number"> & {
          quote_number?: string | null;
        };
        Update: Updatable<QuoteRow>;
        Relationships: [];
      };
      quote_items: {
        Row: QuoteItemRow;
        Insert: Omit<QuoteItemRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<QuoteItemRow, "id" | "created_at">>;
        Relationships: [];
      };
      employees: {
        Row: EmployeeRow;
        Insert: Insertable<EmployeeRow>;
        Update: Updatable<EmployeeRow>;
        Relationships: [];
      };
      equipment: {
        Row: EquipmentRow;
        Insert: Insertable<EquipmentRow>;
        Update: Updatable<EquipmentRow>;
        Relationships: [];
      };
      jobs: {
        Row: JobRow;
        Insert: Insertable<JobRow>;
        Update: Updatable<JobRow>;
        Relationships: [];
      };
      job_assignments: {
        Row: JobAssignmentRow;
        Insert: Insertable<JobAssignmentRow>;
        Update: Updatable<JobAssignmentRow>;
        Relationships: [];
      };
      job_equipment: {
        Row: JobEquipmentRow;
        Insert: Insertable<JobEquipmentRow>;
        Update: Updatable<JobEquipmentRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_quote_with_items: {
        Args: {
          p_client_id: string;
          p_description: string | null;
          p_items: Json;
          p_status: QuoteStatus;
          p_title: string;
          p_valid_until: string | null;
          p_vat_rate: number;
        };
        Returns: QuoteRow;
      };
      update_quote_with_items: {
        Args: {
          p_client_id: string;
          p_description: string | null;
          p_items: Json;
          p_quote_id: string;
          p_status: QuoteStatus;
          p_title: string;
          p_valid_until: string | null;
          p_vat_rate: number;
        };
        Returns: QuoteRow;
      };
    };
    Enums: {
      quote_status: QuoteStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
