import type { JobStatus } from "@/types/job";

export const jobStatusLabels: Record<JobStatus, string> = {
  cancelled: "Lemondva",
  completed: "Teljesítve",
  confirmed: "Visszaigazolva",
  in_progress: "Folyamatban",
  inquiry: "Érdeklődés",
  invoiced: "Számlázva",
  paid: "Fizetve",
  quoted: "Ajánlat elküldve",
  scheduled: "Beütemezve",
};

export const jobStatusOptions: { label: string; value: JobStatus }[] = [
  { label: jobStatusLabels.inquiry, value: "inquiry" },
  { label: jobStatusLabels.quoted, value: "quoted" },
  { label: jobStatusLabels.confirmed, value: "confirmed" },
  { label: jobStatusLabels.scheduled, value: "scheduled" },
  { label: jobStatusLabels.in_progress, value: "in_progress" },
  { label: jobStatusLabels.completed, value: "completed" },
  { label: jobStatusLabels.cancelled, value: "cancelled" },
  { label: jobStatusLabels.invoiced, value: "invoiced" },
  { label: jobStatusLabels.paid, value: "paid" },
];

export function getJobStatusTone(status: JobStatus) {
  switch (status) {
    case "inquiry":
      return "slate";
    case "quoted":
      return "blue";
    case "confirmed":
    case "scheduled":
      return "emerald";
    case "in_progress":
      return "amber";
    case "completed":
    case "paid":
      return "teal";
    case "cancelled":
      return "rose";
    case "invoiced":
      return "purple";
  }
}
