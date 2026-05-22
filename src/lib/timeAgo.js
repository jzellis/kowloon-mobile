// Compact relative-time formatter for feed timestamps: "now", "4m", "3h",
// "2d", "5w", then an absolute date for anything older.

export function timeAgo(input) {
  if (!input) return "";
  const then = new Date(input).getTime();
  if (Number.isNaN(then)) return "";

  const diffMs = Date.now() - then;
  const sec = Math.round(diffMs / 1000);
  if (sec < 45) return "now";

  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m`;

  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h`;

  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d`;

  const wk = Math.round(day / 7);
  if (wk < 5) return `${wk}w`;

  const d = new Date(then);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}
