import type { EquipmentStatus } from "@/types/equipment";

export const equipmentStatusLabels: Record<EquipmentStatus, string> = {
  available: "Elérhető",
  broken: "Hibás",
  inactive: "Inaktív",
  in_use: "Használatban",
  maintenance: "Karbantartás alatt",
};

export const equipmentStatusOptions: {
  label: string;
  value: EquipmentStatus;
}[] = [
  { label: equipmentStatusLabels.available, value: "available" },
  { label: equipmentStatusLabels.in_use, value: "in_use" },
  { label: equipmentStatusLabels.maintenance, value: "maintenance" },
  { label: equipmentStatusLabels.broken, value: "broken" },
  { label: equipmentStatusLabels.inactive, value: "inactive" },
];

export function getEquipmentStatusTone(status: EquipmentStatus) {
  switch (status) {
    case "available":
      return "emerald";
    case "in_use":
      return "blue";
    case "maintenance":
      return "amber";
    case "broken":
      return "rose";
    case "inactive":
      return "slate";
  }
}
