// Staff member type
export interface Staff {
  id: string;
  name: string;
  email?: string;
  role?: string;
  color: string; // For visual identification in the rota grid
}

// Days of the week
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

// Shift type - primary or secondary
export type ShiftType = 'primary' | 'secondary';

// A shift represents a staff assignment for a specific date and time
export interface Shift {
  id: string;
  staffId: string;
  date: string; // ISO date string (YYYY-MM-DD) - specific date for this shift
  startTime: string; // Format: "HH:mm"
  endTime: string; // Format: "HH:mm"
  type: ShiftType; // Primary or secondary shift
  notes?: string;
}

// The rota period (semester) configuration
export interface RotaPeriod {
  id: string;
  name: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  isActive: boolean;
}

// Calendar event for export
export interface CalendarEvent {
  title: string;
  startDate: Date;
  endDate: Date;
  notes?: string;
  location?: string;
}

// State types for Redux
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

// Root state type
export interface RootState {
  staff: StaffState;
  shifts: ShiftState;
  period: PeriodState;
}

// Staff colors for visual identification
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
