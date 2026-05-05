export type EmploymentType =
  | "full_time"
  | "part_time"
  | "occasional"
  | "contractor"
  | "student"
  | "other";

export type EmployeeFormValues = {
  name: string;
  email: string;
  phone: string;
  job_title: string;
  position: string;
  employment_type: EmploymentType;
  hourly_rate: number;
  notes: string;
  is_active: boolean;
};
