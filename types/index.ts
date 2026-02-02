export interface Staff {
  id: string;
  name: string;
  email?: string;
  role?: string;
  color: string;
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

export type ShiftType = 'primary' | 'secondary';

export interface Shift {
  id: string;
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  type: ShiftType;
  notes?: string;
}

export interface RotaPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface CalendarEvent {
  title: string;
  startDate: Date;
  endDate: Date;
  notes?: string;
  location?: string;
}

export interface StaffState {
  items: Staff[];
  loading: boolean;
  error: string | null;
}

export interface ShiftState {
  items: Shift[];
  loading: boolean;
  error: string | null;
}

export interface PeriodState {
  current: RotaPeriod | null;
  history: RotaPeriod[];
  loading: boolean;
  error: string | null;
}

export const STAFF_COLORS = [
  '#FF6B6B', // Coral Red
  '#4ECDC4', // Teal
  '#45B7D1', // Sky Blue
  '#96CEB4', // Sage Green
  '#FFEAA7', // Soft Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Mustard
  '#BB8FCE', // Lavender
  '#85C1E9', // Light Blue
  '#F8B500', // Golden
  '#00CED1', // Dark Cyan
];
