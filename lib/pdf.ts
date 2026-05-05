"use client";

import { jsPDF } from "jspdf";
import { formatCurrency, formatDate } from "./calculations";
import type {
  ClientRow,
  ProfileRow,
  QuoteItemRow,
  QuoteRow,
} from "@/types/database";

type GenerateQuotePdfInput = {
  client: ClientRow | null;
  items: QuoteItemRow[];
  profile: ProfileRow | null;
  quote: QuoteRow;
};

function textOrDash(value: string | null | undefined) {
  return value && value.trim().length > 0 ? value : "-";
}

function addWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight = 6,
) {
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  lines.forEach((line, index) => {
    doc.text(line, x, y + index * lineHeight);
  });

  return y + lines.length * lineHeight;
}

function ensureSpace(doc: jsPDF, y: number, needed = 30) {
  if (y + needed < 282) {
    return y;
  }

  doc.addPage();
  return 22;
}

export function generateQuotePdf({
  client,
  items,
  profile,
  quote,
}: GenerateQuotePdfInput) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  const rightEdge = pageWidth - margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(profile?.company_name || "Harddelete's CRM", margin, 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const companyLines = [
    profile?.owner_name,
    profile?.address,
    profile?.tax_number ? `Adószám: ${profile.tax_number}` : null,
    profile?.bank_account ? `Bankszámla: ${profile.bank_account}` : null,
    profile?.email,
    profile?.phone,
  ].filter((line): line is string => Boolean(line));

  companyLines.forEach((line, index) => {
    doc.text(line, margin, 30 + index * 5);
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Árajánlat", rightEdge, 22, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Ajánlatszám: ${quote.quote_number}`, rightEdge, 31, {
    align: "right",
  });
  doc.text(`Dátum: ${formatDate(quote.created_at)}`, rightEdge, 37, {
    align: "right",
  });
  doc.text(`Érvényes: ${formatDate(quote.valid_until)}`, rightEdge, 43, {
    align: "right",
  });

  doc.setDrawColor(203, 213, 225);
  doc.line(margin, 58, rightEdge, 58);

  let y = 70;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Ügyfél adatai", margin, y);
  doc.text("Ajánlat", 112, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y += 8;

  const clientLines = [
    client?.company_name,
    client?.name,
    client?.address,
    client?.tax_number ? `Adószám: ${client.tax_number}` : null,
    client?.email,
    client?.phone,
  ].filter((line): line is string => Boolean(line));

  clientLines.forEach((line, index) => {
    doc.text(line, margin, y + index * 5);
  });

  doc.setFont("helvetica", "bold");
  doc.text(quote.title, 112, y);
  doc.setFont("helvetica", "normal");
  const quoteDescription = quote.description || "";
  if (quoteDescription) {
    addWrappedText(doc, quoteDescription, 112, y + 7, 80, 5);
  }

  y = Math.max(y + clientLines.length * 5, y + 28) + 12;
  y = ensureSpace(doc, y, 45);

  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, rightEdge - margin, 9, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Megnevezés", margin + 2, y + 6);
  doc.text("Menny.", 94, y + 6, { align: "right" });
  doc.text("Egység", 109, y + 6, { align: "right" });
  doc.text("Egységár", 148, y + 6, { align: "right" });
  doc.text("Összeg", rightEdge - 2, y + 6, { align: "right" });
  doc.setTextColor(15, 23, 42);
  y += 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  items.forEach((item) => {
    y = ensureSpace(doc, y, 24);
    const description = item.description ? `\n${item.description}` : "";
    const nameLines = doc.splitTextToSize(
      `${item.name}${description}`,
      68,
    ) as string[];
    const rowHeight = Math.max(12, nameLines.length * 5 + 4);

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y - 3, rightEdge, y - 3);
    nameLines.forEach((line, index) => {
      doc.text(line, margin + 2, y + index * 5);
    });
    doc.text(String(item.quantity), 94, y, { align: "right" });
    doc.text(item.unit, 109, y, { align: "right" });
    doc.text(formatCurrency(item.unit_price), 148, y, { align: "right" });
    doc.text(formatCurrency(item.line_total), rightEdge - 2, y, {
      align: "right",
    });
    y += rowHeight;
  });

  y = ensureSpace(doc, y, 45);
  y += 6;
  doc.setDrawColor(203, 213, 225);
  doc.line(112, y, rightEdge, y);
  y += 8;

  doc.setFontSize(10);
  doc.text("Nettó összeg", 122, y);
  doc.text(formatCurrency(quote.subtotal), rightEdge, y, { align: "right" });
  y += 7;
  doc.text(`ÁFA (${quote.vat_rate}%)`, 122, y);
  doc.text(formatCurrency(quote.vat_amount), rightEdge, y, {
    align: "right",
  });
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Bruttó végösszeg", 122, y);
  doc.text(formatCurrency(quote.total), rightEdge, y, { align: "right" });

  y += 22;
  y = ensureSpace(doc, y, 45);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Megjegyzés", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y = addWrappedText(
    doc,
    textOrDash(profile?.quote_footer_text),
    margin,
    y + 8,
    178,
    5,
  );

  y += 24;
  y = ensureSpace(doc, y, 25);
  doc.line(132, y, rightEdge, y);
  doc.text("Aláírás", 157, y + 6);

  doc.save(`${quote.quote_number}.pdf`);
}
