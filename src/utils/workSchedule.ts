import { DailyWorkSchedule, WeeklyWorkSchedule, WorkDayKey, WorkScheduleConfig } from '../types';

export const WORK_DAY_ITEMS: Array<{
  key: WorkDayKey;
  label: string;
  shortLabel: string;
  dayIndex: number;
}> = [
  { key: 'senin', label: 'Senin', shortLabel: 'Sen', dayIndex: 1 },
  { key: 'selasa', label: 'Selasa', shortLabel: 'Sel', dayIndex: 2 },
  { key: 'rabu', label: 'Rabu', shortLabel: 'Rab', dayIndex: 3 },
  { key: 'kamis', label: 'Kamis', shortLabel: 'Kam', dayIndex: 4 },
  { key: 'jumat', label: "Jum'at", shortLabel: 'Jum', dayIndex: 5 }
];

export const DEFAULT_GURU_WEEKLY_SCHEDULE: WeeklyWorkSchedule = {
  senin: { checkIn: '07:30', checkOut: '14:00', enabled: true },
  selasa: { checkIn: '07:30', checkOut: '14:00', enabled: true },
  rabu: { checkIn: '07:30', checkOut: '14:00', enabled: true },
  kamis: { checkIn: '07:30', checkOut: '14:00', enabled: true },
  jumat: { checkIn: '07:30', checkOut: '11:30', enabled: true }
};

export const DEFAULT_KARYAWAN_WEEKLY_SCHEDULE: WeeklyWorkSchedule = {
  senin: { checkIn: '07:00', checkOut: '15:00', enabled: true },
  selasa: { checkIn: '07:00', checkOut: '15:00', enabled: true },
  rabu: { checkIn: '07:00', checkOut: '15:00', enabled: true },
  kamis: { checkIn: '07:00', checkOut: '15:00', enabled: true },
  jumat: { checkIn: '07:00', checkOut: '14:30', enabled: true }
};

export const DEFAULT_WORK_SCHEDULE: WorkScheduleConfig = {
  guru: DEFAULT_GURU_WEEKLY_SCHEDULE,
  karyawan: DEFAULT_KARYAWAN_WEEKLY_SCHEDULE
};

const isValidTime = (value?: string): value is string =>
  typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value.trim());

const normalizeWeeklySchedule = (
  input: Partial<WeeklyWorkSchedule> | undefined,
  fallback: WeeklyWorkSchedule
): WeeklyWorkSchedule => {
  const result = {} as WeeklyWorkSchedule;
  for (const item of WORK_DAY_ITEMS) {
    const raw = input?.[item.key];
    const fb = fallback[item.key];
    result[item.key] = {
      checkIn: isValidTime(raw?.checkIn) ? raw!.checkIn.trim() : fb.checkIn,
      checkOut: isValidTime(raw?.checkOut) ? raw!.checkOut.trim() : fb.checkOut,
      enabled: raw?.enabled !== undefined ? Boolean(raw.enabled) : fb.enabled ?? true
    };
  }
  return result;
};

export const normalizeWorkSchedule = (
  config?: Partial<WorkScheduleConfig> | null
): WorkScheduleConfig => ({
  guru: normalizeWeeklySchedule(config?.guru, DEFAULT_GURU_WEEKLY_SCHEDULE),
  karyawan: normalizeWeeklySchedule(config?.karyawan, DEFAULT_KARYAWAN_WEEKLY_SCHEDULE)
});

export const getWorkDayInfoFromDate = (
  dateInput?: string | Date
): {
  dayKey: WorkDayKey;
  dayLabel: string;
  isWeekend: boolean;
  dayOfWeek: number;
} => {
  let d: Date;
  if (!dateInput) {
    d = new Date();
  } else if (typeof dateInput === 'string') {
    const [year, month, day] = dateInput.split('-').map(Number);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      d = new Date(year, month - 1, day, 12, 0, 0);
    } else {
      d = new Date(dateInput);
    }
  } else {
    d = dateInput;
  }

  const dayOfWeek = isNaN(d.getTime()) ? new Date().getDay() : d.getDay();
  const matched = WORK_DAY_ITEMS.find((item) => item.dayIndex === dayOfWeek);
  if (matched) {
    return {
      dayKey: matched.key,
      dayLabel: matched.label,
      isWeekend: false,
      dayOfWeek
    };
  }

  return {
    dayKey: 'senin',
    dayLabel: dayOfWeek === 6 ? 'Sabtu' : 'Ahad/Minggu',
    isWeekend: true,
    dayOfWeek
  };
};

export const getPersonCategory = (
  personId: string,
  staffIds?: Array<{ id: string }> | Set<string>
): 'guru' | 'karyawan' => {
  if (staffIds instanceof Set) {
    if (staffIds.has(personId)) return 'karyawan';
  } else if (Array.isArray(staffIds)) {
    if (staffIds.some((s) => s.id === personId)) return 'karyawan';
  }
  if (personId.startsWith('stf')) return 'karyawan';
  return 'guru';
};

export const getScheduleForDate = (
  workSchedule: WorkScheduleConfig | undefined,
  category: 'guru' | 'karyawan',
  dateInput?: string | Date
): DailyWorkSchedule & {
  dayKey: WorkDayKey;
  dayLabel: string;
  isWeekend: boolean;
} => {
  const normalized = normalizeWorkSchedule(workSchedule);
  const dayInfo = getWorkDayInfoFromDate(dateInput);
  const daySchedule = normalized[category][dayInfo.dayKey];
  return {
    ...daySchedule,
    dayKey: dayInfo.dayKey,
    dayLabel: dayInfo.dayLabel,
    isWeekend: dayInfo.isWeekend
  };
};

export const timeStringToMinutes = (timeStr?: string): number | null => {
  if (!timeStr) return null;
  const parts = timeStr.trim().split(':').map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
  return parts[0] * 60 + parts[1];
};

export const isCheckInLate = (actualTimeStr: string, scheduledCheckIn: string): boolean => {
  const actual = timeStringToMinutes(actualTimeStr);
  const cutoff = timeStringToMinutes(scheduledCheckIn);
  if (actual === null || cutoff === null) return false;
  return actual > cutoff;
};

export const isCheckOutEarly = (actualTimeStr: string, scheduledCheckOut: string): boolean => {
  const actual = timeStringToMinutes(actualTimeStr);
  const target = timeStringToMinutes(scheduledCheckOut);
  if (actual === null || target === null) return false;
  return actual < target;
};

export const formatWorkDuration = (checkIn: string, checkOut: string): string => {
  const start = timeStringToMinutes(checkIn);
  const end = timeStringToMinutes(checkOut);
  if (start === null || end === null || end <= start) return '-';
  const diff = end - start;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  if (mins === 0) return `${hours} jam`;
  return `${hours} jam ${mins} mnt`;
};
