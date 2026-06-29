export function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric"
  }).format(new Date(value));
}
