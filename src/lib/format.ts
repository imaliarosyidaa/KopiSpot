export function formatRupiah(value: number): string {
  return "Rp " + value.toLocaleString("id-ID");
}

export function timeAgo(dateInput: string | Date): string {
  const date = new Date(dateInput);
  const diff = Date.now() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "baru saja";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} bulan lalu`;
  return `${Math.floor(months / 12)} tahun lalu`;
}

export function formatDate(dateInput: string | Date): string {
  return new Date(dateInput).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function initials(name?: string | null, fallback = "?"): string {
  if (!name) return fallback;
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export function nextLevelXp(level: number): number {
  // level = floor(sqrt(xp / 100)) + 1  =>  xp = ((level - 1)^2) * 100
  return Math.pow(level, 2) * 100;
}

export function levelProgress(xp: number, level: number): number {
  const currentFloor = Math.pow(level - 1, 2) * 100;
  const nextFloor = Math.pow(level, 2) * 100;
  const span = nextFloor - currentFloor;
  if (span <= 0) return 1;
  return Math.min(1, Math.max(0, (xp - currentFloor) / span));
}
