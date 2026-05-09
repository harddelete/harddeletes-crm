"use client";

import type { Workbook, Worksheet } from "exceljs";
import { CheckCircle2, Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { employmentTypeLabels } from "@/lib/employee";
import { equipmentStatusLabels } from "@/lib/equipmentStatus";
import { jobStatusLabels } from "@/lib/jobStatus";
import { quoteStatusLabels } from "@/lib/status";
import { supabase } from "@/lib/supabaseClient";
import type {
  ClientRow,
  EmployeeRow,
  EquipmentRow,
  JobAssignmentRow,
  JobEquipmentRow,
  JobRow,
  QuoteItemRow,
  QuoteRow,
} from "@/types/database";

type ExportCell = string | number;
type ExportRow = Record<string, ExportCell>;

type ExportColumn = {
  header: string;
  key: string;
  width: number;
};

type ExportSheet = {
  columns: ExportColumn[];
  name: string;
  rows: ExportRow[];
};

type BackupData = {
  clients: ClientRow[];
  employees: EmployeeRow[];
  equipment: EquipmentRow[];
  jobAssignments: JobAssignmentRow[];
  jobEquipment: JobEquipmentRow[];
  jobs: JobRow[];
  quoteItems: QuoteItemRow[];
  quotes: QuoteRow[];
};

function currentIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function valueOrDash(value: string | number | null | undefined): ExportCell {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return value;
}

function yesNo(value: boolean) {
  return value ? "Igen" : "Nem";
}

function formatDateValue(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const datePart = value.slice(0, 10);
  const parts = datePart.split("-");

  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${year}. ${month}. ${day}.`;
  }

  return value;
}

function formatDateTimeValue(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("hu-HU", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsed);
}

function formatTimeValue(value: string | null | undefined) {
  return value ? value.slice(0, 5) : "-";
}

function addSheet(workbook: Workbook, sheet: ExportSheet) {
  const worksheet = workbook.addWorksheet(sheet.name, {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  worksheet.columns = sheet.columns.map((column) => ({
    header: column.header,
    key: column.key,
    width: column.width,
  }));

  if (sheet.rows.length === 0) {
    worksheet.addRow(
      sheet.columns.reduce<ExportRow>((row, column, index) => {
        row[column.key] = index === 0 ? "Nincs adat" : "-";
        return row;
      }, {}),
    );
  } else {
    worksheet.addRows(sheet.rows);
  }

  styleWorksheet(worksheet);
}

function styleWorksheet(worksheet: Worksheet) {
  const header = worksheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = {
    fgColor: { argb: "FF0F766E" },
    pattern: "solid",
    type: "pattern",
  };
  header.alignment = { vertical: "middle" };

  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.alignment = {
        vertical: "top",
        wrapText: true,
      };
      cell.border = {
        bottom: { color: { argb: "FFE2E8F0" }, style: "thin" },
      };
    });
  });
}

async function loadBackupData(): Promise<BackupData> {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error("Az adatmentéshez be kell jelentkezni.");
  }

  const userId = userData.user.id;
  const [
    clientsResult,
    jobsResult,
    employeesResult,
    equipmentResult,
    quotesResult,
    assignmentsResult,
    jobEquipmentResult,
  ] = await Promise.all([
    supabase.from("clients").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("jobs").select("*").eq("user_id", userId).order("event_date"),
    supabase.from("employees").select("*").eq("user_id", userId).order("name"),
    supabase.from("equipment").select("*").eq("user_id", userId).order("name"),
    supabase.from("quotes").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("job_assignments").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("job_equipment").select("*").eq("user_id", userId).order("created_at"),
  ]);

  const firstError =
    clientsResult.error ??
    jobsResult.error ??
    employeesResult.error ??
    equipmentResult.error ??
    quotesResult.error ??
    assignmentsResult.error ??
    jobEquipmentResult.error;

  if (firstError) {
    throw new Error(firstError.message);
  }

  const quotes = quotesResult.data ?? [];
  let quoteItems: QuoteItemRow[] = [];

  if (quotes.length > 0) {
    const quoteItemsResult = await supabase
      .from("quote_items")
      .select("*")
      .in(
        "quote_id",
        quotes.map((quote) => quote.id),
      )
      .order("created_at");

    if (quoteItemsResult.error) {
      throw new Error(quoteItemsResult.error.message);
    }

    quoteItems = quoteItemsResult.data ?? [];
  }

  return {
    clients: clientsResult.data ?? [],
    employees: employeesResult.data ?? [],
    equipment: equipmentResult.data ?? [],
    jobAssignments: assignmentsResult.data ?? [],
    jobEquipment: jobEquipmentResult.data ?? [],
    jobs: jobsResult.data ?? [],
    quoteItems,
    quotes,
  };
}

function buildSheets(data: BackupData): ExportSheet[] {
  const clientMap = new Map(
    data.clients.map((client) => [client.id, client.company_name || client.name]),
  );
  const jobMap = new Map(data.jobs.map((job) => [job.id, job.title]));
  const employeeMap = new Map(data.employees.map((employee) => [employee.id, employee.name]));
  const equipmentMap = new Map(data.equipment.map((item) => [item.id, item.name]));
  const quoteMap = new Map(data.quotes.map((quote) => [quote.id, quote.quote_number]));

  return [
    {
      columns: [
        { header: "Mutató", key: "metric", width: 34 },
        { header: "Érték", key: "value", width: 28 },
      ],
      name: "Összefoglaló",
      rows: [
        { metric: "Export dátuma", value: formatDateValue(currentIsoDate()) },
        { metric: "Ügyfelek száma", value: data.clients.length },
        { metric: "Munkák száma", value: data.jobs.length },
        { metric: "Dolgozók száma", value: data.employees.length },
        { metric: "Eszközök száma", value: data.equipment.length },
        { metric: "Árajánlatok száma", value: data.quotes.length },
        { metric: "A fájl típusa", value: "Harddelete's CRM adatmentés" },
      ],
    },
    {
      columns: [
        { header: "Név", key: "name", width: 26 },
        { header: "Cégnév", key: "company_name", width: 28 },
        { header: "Email", key: "email", width: 28 },
        { header: "Telefon", key: "phone", width: 18 },
        { header: "Cím", key: "address", width: 34 },
        { header: "Adószám", key: "tax_number", width: 20 },
        { header: "Megjegyzés", key: "notes", width: 38 },
        { header: "Létrehozva", key: "created_at", width: 20 },
      ],
      name: "Ügyfelek",
      rows: data.clients.map((client) => ({
        address: valueOrDash(client.address),
        company_name: valueOrDash(client.company_name),
        created_at: formatDateTimeValue(client.created_at),
        email: valueOrDash(client.email),
        name: valueOrDash(client.name),
        notes: valueOrDash(client.notes),
        phone: valueOrDash(client.phone),
        tax_number: valueOrDash(client.tax_number),
      })),
    },
    {
      columns: [
        { header: "Munka / rendezvény", key: "title", width: 30 },
        { header: "Ügyfél", key: "client", width: 28 },
        { header: "Kapcsolódó ajánlat", key: "quote", width: 20 },
        { header: "Rendezvény típusa", key: "event_type", width: 22 },
        { header: "Helyszín", key: "location_name", width: 28 },
        { header: "Település", key: "city", width: 20 },
        { header: "Cím", key: "address", width: 34 },
        { header: "Dátum", key: "event_date", width: 16 },
        { header: "Kezdés", key: "start_time", width: 12 },
        { header: "Befejezés", key: "end_time", width: 12 },
        { header: "Kapcsolattartó", key: "contact_name", width: 24 },
        { header: "Kapcsolattartó telefon", key: "contact_phone", width: 22 },
        { header: "Kapcsolattartó email", key: "contact_email", width: 28 },
        { header: "Várható résztvevők", key: "expected_participants", width: 18 },
        { header: "Vállalási ár", key: "price", width: 16 },
        { header: "Státusz", key: "status", width: 20 },
        { header: "Leírás", key: "description", width: 38 },
        { header: "Belső megjegyzés", key: "internal_notes", width: 38 },
      ],
      name: "Munkák",
      rows: data.jobs.map((job) => ({
        address: valueOrDash(job.address),
        city: valueOrDash(job.city),
        client: valueOrDash(job.client_id ? clientMap.get(job.client_id) : null),
        contact_email: valueOrDash(job.contact_email),
        contact_name: valueOrDash(job.contact_name),
        contact_phone: valueOrDash(job.contact_phone),
        description: valueOrDash(job.description),
        end_time: formatTimeValue(job.end_time),
        event_date: formatDateValue(job.event_date),
        event_type: valueOrDash(job.event_type),
        expected_participants: valueOrDash(job.expected_participants),
        internal_notes: valueOrDash(job.internal_notes),
        location_name: valueOrDash(job.location_name),
        price: job.price,
        quote: valueOrDash(job.quote_id ? quoteMap.get(job.quote_id) : null),
        start_time: formatTimeValue(job.start_time),
        status: jobStatusLabels[job.status],
        title: valueOrDash(job.title),
      })),
    },
    {
      columns: [
        { header: "Név", key: "name", width: 26 },
        { header: "Email", key: "email", width: 28 },
        { header: "Telefon", key: "phone", width: 18 },
        { header: "Munkakör", key: "job_title", width: 22 },
        { header: "Pozíció / szerepkör", key: "position", width: 24 },
        { header: "Foglalkoztatás típusa", key: "employment_type", width: 24 },
        { header: "Óradíj", key: "hourly_rate", width: 14 },
        { header: "Aktív", key: "is_active", width: 12 },
        { header: "Megjegyzés", key: "notes", width: 38 },
      ],
      name: "Dolgozók",
      rows: data.employees.map((employee) => ({
        email: valueOrDash(employee.email),
        employment_type: employmentTypeLabels[employee.employment_type],
        hourly_rate: employee.hourly_rate,
        is_active: yesNo(employee.is_active),
        job_title: valueOrDash(employee.job_title),
        name: valueOrDash(employee.name),
        notes: valueOrDash(employee.notes),
        phone: valueOrDash(employee.phone),
        position: valueOrDash(employee.position),
      })),
    },
    {
      columns: [
        { header: "Név", key: "name", width: 28 },
        { header: "Típus", key: "type", width: 22 },
        { header: "Azonosító", key: "identifier", width: 20 },
        { header: "Kapacitás", key: "capacity", width: 14 },
        { header: "Státusz", key: "status", width: 22 },
        { header: "Aktív", key: "is_active", width: 12 },
        { header: "Megjegyzés", key: "notes", width: 38 },
      ],
      name: "Eszközök",
      rows: data.equipment.map((item) => ({
        capacity: valueOrDash(item.capacity),
        identifier: valueOrDash(item.identifier),
        is_active: yesNo(item.is_active),
        name: valueOrDash(item.name),
        notes: valueOrDash(item.notes),
        status: equipmentStatusLabels[item.status],
        type: valueOrDash(item.type),
      })),
    },
    {
      columns: [
        { header: "Ajánlatszám", key: "quote_number", width: 18 },
        { header: "Cím", key: "title", width: 30 },
        { header: "Ügyfél", key: "client", width: 28 },
        { header: "Státusz", key: "status", width: 18 },
        { header: "ÁFA %", key: "vat_rate", width: 12 },
        { header: "Nettó", key: "subtotal", width: 16 },
        { header: "ÁFA összeg", key: "vat_amount", width: 16 },
        { header: "Bruttó", key: "total", width: 16 },
        { header: "Érvényes eddig", key: "valid_until", width: 18 },
        { header: "Leírás", key: "description", width: 38 },
        { header: "Létrehozva", key: "created_at", width: 20 },
      ],
      name: "Árajánlatok",
      rows: data.quotes.map((quote) => ({
        client: valueOrDash(quote.client_id ? clientMap.get(quote.client_id) : null),
        created_at: formatDateTimeValue(quote.created_at),
        description: valueOrDash(quote.description),
        quote_number: valueOrDash(quote.quote_number),
        status: quoteStatusLabels[quote.status],
        subtotal: quote.subtotal,
        title: valueOrDash(quote.title),
        total: quote.total,
        valid_until: formatDateValue(quote.valid_until),
        vat_amount: quote.vat_amount,
        vat_rate: quote.vat_rate,
      })),
    },
    {
      columns: [
        { header: "Ajánlatszám", key: "quote_number", width: 18 },
        { header: "Megnevezés", key: "name", width: 30 },
        { header: "Leírás", key: "description", width: 38 },
        { header: "Mennyiség", key: "quantity", width: 14 },
        { header: "Egység", key: "unit", width: 12 },
        { header: "Egységár", key: "unit_price", width: 16 },
        { header: "Sorösszeg", key: "line_total", width: 16 },
      ],
      name: "Ajánlat tételek",
      rows: data.quoteItems.map((item) => ({
        description: valueOrDash(item.description),
        line_total: item.line_total,
        name: valueOrDash(item.name),
        quantity: item.quantity,
        quote_number: valueOrDash(quoteMap.get(item.quote_id)),
        unit: valueOrDash(item.unit),
        unit_price: item.unit_price,
      })),
    },
    {
      columns: [
        { header: "Munka", key: "job", width: 30 },
        { header: "Dolgozó", key: "employee", width: 26 },
        { header: "Szerep", key: "assignment_role", width: 22 },
        { header: "Tervezett kezdés", key: "planned_start_time", width: 18 },
        { header: "Tervezett befejezés", key: "planned_end_time", width: 20 },
        { header: "Tényleges kezdés", key: "actual_start_time", width: 18 },
        { header: "Tényleges befejezés", key: "actual_end_time", width: 20 },
        { header: "Megjegyzés", key: "notes", width: 38 },
      ],
      name: "Munka beosztások",
      rows: data.jobAssignments.map((assignment) => ({
        actual_end_time: formatTimeValue(assignment.actual_end_time),
        actual_start_time: formatTimeValue(assignment.actual_start_time),
        assignment_role: valueOrDash(assignment.assignment_role),
        employee: valueOrDash(employeeMap.get(assignment.employee_id)),
        job: valueOrDash(jobMap.get(assignment.job_id)),
        notes: valueOrDash(assignment.notes),
        planned_end_time: formatTimeValue(assignment.planned_end_time),
        planned_start_time: formatTimeValue(assignment.planned_start_time),
      })),
    },
    {
      columns: [
        { header: "Munka", key: "job", width: 30 },
        { header: "Eszköz", key: "equipment", width: 28 },
        { header: "Mennyiség", key: "quantity", width: 14 },
        { header: "Megjegyzés", key: "notes", width: 38 },
      ],
      name: "Munka eszközök",
      rows: data.jobEquipment.map((assignment) => ({
        equipment: valueOrDash(equipmentMap.get(assignment.equipment_id)),
        job: valueOrDash(jobMap.get(assignment.job_id)),
        notes: valueOrDash(assignment.notes),
        quantity: assignment.quantity,
      })),
    },
  ];
}

async function createWorkbook(data: BackupData) {
  const { Workbook } = await import("exceljs");
  const workbook = new Workbook();

  workbook.creator = "Harddelete's CRM";
  workbook.created = new Date();
  workbook.modified = new Date();

  buildSheets(data).forEach((sheet) => addSheet(workbook, sheet));

  return workbook;
}

function downloadBuffer(buffer: BlobPart, filename: string) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function ExcelBackupButton() {
  const [error, setError] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [success, setSuccess] = useState("");

  async function handleExport() {
    setError("");
    setSuccess("");
    setIsExporting(true);

    try {
      const data = await loadBackupData();
      const workbook = await createWorkbook(data);
      const buffer = await workbook.xlsx.writeBuffer();
      const filename = `harddeletes-crm-backup-${currentIsoDate()}.xlsx`;

      downloadBuffer(buffer, filename);
      setSuccess("Az Excel mentés elkészült.");
    } catch {
      setError("Az Excel mentés elkészítése sikertelen.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="grid gap-3">
      {error ? <ErrorMessage message={error} /> : null}
      {success ? (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={18} />
          {success}
        </div>
      ) : null}
      <Button className="w-full sm:w-fit" isLoading={isExporting} onClick={handleExport}>
        <Download size={18} />
        Excel mentés letöltése
      </Button>
    </div>
  );
}
