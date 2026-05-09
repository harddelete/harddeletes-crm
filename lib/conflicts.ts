import type {
  EmployeeRow,
  EquipmentRow,
  JobAssignmentRow,
  JobEquipmentRow,
  JobRow,
} from "@/types/database";

export type ConflictSeverity = "date" | "time";

export type ConflictItem = {
  conflictingJob: JobRow;
  message: string;
  name: string;
  severity: ConflictSeverity;
};

function normalizeTime(value: string | null | undefined) {
  return value ? value.slice(0, 5) : null;
}

export function hasTimeOverlap(
  startA: string | null | undefined,
  endA: string | null | undefined,
  startB: string | null | undefined,
  endB: string | null | undefined,
) {
  const aStart = normalizeTime(startA);
  const aEnd = normalizeTime(endA);
  const bStart = normalizeTime(startB);
  const bEnd = normalizeTime(endB);

  if (!aStart || !aEnd || !bStart || !bEnd) {
    return true;
  }

  return aStart < bEnd && bStart < aEnd;
}

function buildJobMap(jobs: JobRow[]) {
  return new Map(jobs.map((job) => [job.id, job]));
}

export function detectEmployeeConflicts({
  assignments,
  currentJob,
  employees,
  jobs,
}: {
  assignments: JobAssignmentRow[];
  currentJob: JobRow;
  employees: EmployeeRow[];
  jobs: JobRow[];
}) {
  const jobMap = buildJobMap(jobs);
  const employeeMap = new Map(employees.map((employee) => [employee.id, employee]));
  const currentAssignments = assignments.filter(
    (assignment) => assignment.job_id === currentJob.id,
  );

  return currentAssignments.flatMap<ConflictItem>((assignment) => {
    const employee = employeeMap.get(assignment.employee_id);

    return assignments
      .filter(
        (candidate) =>
          candidate.employee_id === assignment.employee_id &&
          candidate.job_id !== currentJob.id,
      )
      .map((candidate) => ({
        assignment: candidate,
        job: jobMap.get(candidate.job_id),
      }))
      .filter((candidate): candidate is { assignment: JobAssignmentRow; job: JobRow } =>
        Boolean(candidate.job),
      )
      .filter(({ job }) => job.event_date === currentJob.event_date)
      .filter(({ job }) =>
        hasTimeOverlap(
          assignment.planned_start_time ?? currentJob.start_time,
          assignment.planned_end_time ?? currentJob.end_time,
          job.start_time,
          job.end_time,
        ),
      )
      .map(({ job }) => {
        const hasExactTime =
          Boolean(currentJob.start_time && currentJob.end_time && job.start_time && job.end_time);

        return {
          conflictingJob: job,
          message: hasExactTime
            ? "Lehetséges dolgozói ütközés azonos időintervallumban."
            : "Lehetséges dolgozói ütközés azonos napon.",
          name: employee?.name ?? "Ismeretlen dolgozó",
          severity: hasExactTime ? "time" : "date",
        };
      });
  });
}

export function detectEquipmentConflicts({
  currentJob,
  equipment,
  jobEquipment,
  jobs,
}: {
  currentJob: JobRow;
  equipment: EquipmentRow[];
  jobEquipment: JobEquipmentRow[];
  jobs: JobRow[];
}) {
  const jobMap = buildJobMap(jobs);
  const equipmentMap = new Map(equipment.map((item) => [item.id, item]));
  const currentEquipment = jobEquipment.filter(
    (assignment) => assignment.job_id === currentJob.id,
  );

  return currentEquipment.flatMap<ConflictItem>((assignment) => {
    const item = equipmentMap.get(assignment.equipment_id);

    return jobEquipment
      .filter(
        (candidate) =>
          candidate.equipment_id === assignment.equipment_id &&
          candidate.job_id !== currentJob.id,
      )
      .map((candidate) => ({
        assignment: candidate,
        job: jobMap.get(candidate.job_id),
      }))
      .filter((candidate): candidate is { assignment: JobEquipmentRow; job: JobRow } =>
        Boolean(candidate.job),
      )
      .filter(({ job }) => job.event_date === currentJob.event_date)
      .filter(({ job }) =>
        hasTimeOverlap(
          currentJob.start_time,
          currentJob.end_time,
          job.start_time,
          job.end_time,
        ),
      )
      .map(({ job }) => {
        const hasExactTime =
          Boolean(currentJob.start_time && currentJob.end_time && job.start_time && job.end_time);

        return {
          conflictingJob: job,
          message: hasExactTime
            ? "Lehetséges eszközütközés azonos időintervallumban."
            : "Lehetséges eszközütközés azonos napon.",
          name: item?.name ?? "Ismeretlen eszköz",
          severity: hasExactTime ? "time" : "date",
        };
      });
  });
}
