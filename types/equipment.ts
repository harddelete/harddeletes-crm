export type EquipmentStatus =
  | "available"
  | "in_use"
  | "maintenance"
  | "broken"
  | "inactive";

export type EquipmentFormValues = {
  name: string;
  type: string;
  identifier: string;
  capacity: number | null;
  status: EquipmentStatus;
  notes: string;
  is_active: boolean;
};
