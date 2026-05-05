import { formatDate } from "./calculations";

export function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function formatTime(time: string | null | undefined) {
  if (!time) {
    return "-";
  }

  return time.slice(0, 5);
}

export function formatDateTimeLabel(date: string | null, time?: string | null) {
  const dateLabel = formatDate(date);
  const timeLabel = formatTime(time);

  return timeLabel === "-" ? dateLabel : `${dateLabel} ${timeLabel}`;
}
