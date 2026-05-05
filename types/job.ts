export type JobStatus =
  | "inquiry"
  | "quoted"
  | "confirmed"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "invoiced"
  | "paid";

export type JobFormValues = {
  client_id: string;
  quote_id: string;
  title: string;
  event_type: string;
  location_name: string;
  address: string;
  city: string;
  event_date: string;
  start_time: string;
  end_time: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  expected_participants: number | null;
  price: number;
  status: JobStatus;
  description: string;
  internal_notes: string;
};

export type JobAssignmentFormValues = {
  employee_id: string;
  assignment_role: string;
  planned_start_time: string;
  planned_end_time: string;
  notes: string;
};

export type JobEquipmentFormValues = {
  equipment_id: string;
  quantity: number;
  notes: string;
};
