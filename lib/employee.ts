import type { EmploymentType } from "@/types/employee";

export const employmentTypeLabels: Record<EmploymentType, string> = {
  contractor: "Külsős",
  full_time: "Teljes munkaidős",
  occasional: "Alkalmi",
  other: "Egyéb",
  part_time: "Részmunkaidős",
  student: "Diákmunka",
};

export const employmentTypeOptions: { label: string; value: EmploymentType }[] =
  [
    { label: employmentTypeLabels.full_time, value: "full_time" },
    { label: employmentTypeLabels.part_time, value: "part_time" },
    { label: employmentTypeLabels.occasional, value: "occasional" },
    { label: employmentTypeLabels.contractor, value: "contractor" },
    { label: employmentTypeLabels.student, value: "student" },
    { label: employmentTypeLabels.other, value: "other" },
  ];
