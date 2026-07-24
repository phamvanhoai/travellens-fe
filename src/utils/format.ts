export function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric"
  }).format(new Date(value));
}

export function formatVietnamDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh"
  }).format(date);
}

export function vietnamDateTimeLocalToIso(value: string) {
  if (!value) return "";
  const normalized = value.length === 16 ? `${value}:00` : value;
  const date = new Date(`${normalized}+07:00`);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

export function toVietnamDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh"
  }).format(date).replace(" ", "T");
}
