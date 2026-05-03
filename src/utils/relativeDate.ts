const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto', style: 'long' });
const dtf = new Intl.DateTimeFormat('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

export function formatRelativeDate(date: Date): string {
  const diffMs = date.getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60000);
  const diffHour = Math.round(diffMs / 3600000);
  const diffDay = Math.round(diffMs / 86400000);
  const diffMonth = Math.round(diffDay / 30);
  const diffYear = Math.round(diffDay / 365);

  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour');
  if (Math.abs(diffDay) < 30) return rtf.format(diffDay, 'day');
  if (Math.abs(diffMonth) < 18) return rtf.format(diffMonth, 'month');
  return rtf.format(diffYear, 'year');
}

export function formatAbsoluteDate(date: Date): string {
  return dtf.format(date);
}

export function readTimeMinutes(text: string, wordsPerMinute = 220): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / wordsPerMinute));
}

export function formatPlantedTended(planted: Date, tended?: Date | null): string {
  const plantedStr = `Planté ${formatRelativeDate(planted)}`;
  if (!tended) return plantedStr;
  if (tended.getTime() === planted.getTime()) return plantedStr;
  return `${plantedStr} · arrosé ${formatRelativeDate(tended)}`;
}
