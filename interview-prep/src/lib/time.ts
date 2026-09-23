/**
 * Countdown helpers.
 *
 * The interview time is a LOCAL wall-clock time in Hanoi and he is in Hanoi, so
 * the local parse is correct here. Parsed by hand rather than via `new Date(str)`
 * because Safari and older engines disagree about bare "YYYY-MM-DDTHH:MM".
 */

export function parseLocal(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(iso.trim());
  if (!m) return new Date(iso);
  return new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    Number(m[4]),
    Number(m[5]),
    0,
    0,
  );
}

export interface Remaining {
  past: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMinutes: number;
}

export function remaining(target: Date, now: Date): Remaining {
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) {
    return { past: true, days: 0, hours: 0, minutes: 0, seconds: 0, totalMinutes: 0 };
  }
  const totalSeconds = Math.floor(diff / 1000);
  return {
    past: false,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalMinutes: Math.floor(totalSeconds / 60),
  };
}

/** "2 ngày 14 giờ" / "6 giờ 12 phút" / "18 phút" */
export function humanise(r: Remaining): string {
  if (r.past) return 'đã bắt đầu';
  if (r.days > 0) return `${r.days} ngày ${r.hours} giờ`;
  if (r.hours > 0) return `${r.hours} giờ ${r.minutes} phút`;
  return `${r.minutes} phút`;
}

/** Minutes since midnight for "HH:MM". */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function formatMinutes(total: number): string {
  if (total < 60) return `${total} phút`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h} giờ`;
}
