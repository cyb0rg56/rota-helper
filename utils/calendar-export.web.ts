import { addDays, parseISO, setHours, setMinutes } from 'date-fns';

import { Shift, Staff } from '@/types';
import { confirmAlert } from '@/utils/confirm';
import { isOvernight, parseTime } from '@/utils/time';

function hoursAndMinutes(time: string): { hours: number; minutes: number } {
  const total = parseTime(time);
  return { hours: Math.floor(total / 60), minutes: total % 60 };
}

function toIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeIcsText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}

function icsTimestamp(): string {
  return toIcsDate(new Date());
}

function buildIcs(shifts: Shift[], staff: Staff[], calendarName: string): { ics: string; eventsCreated: number } {
  const staffMap = new Map(staff.map((member) => [member.id, member]));
  const stamp = icsTimestamp();
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Rota Helper//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
  ];

  let eventsCreated = 0;

  for (const shift of shifts) {
    const staffMember = staffMap.get(shift.staffId);
    if (!staffMember) {
      continue;
    }

    const { hours: startHours, minutes: startMinutes } = hoursAndMinutes(shift.startTime);
    const { hours: endHours, minutes: endMinutes } = hoursAndMinutes(shift.endTime);
    const overnight = isOvernight(shift.startTime, shift.endTime);
    const shiftDate = parseISO(shift.date);
    const startDate = setMinutes(setHours(shiftDate, startHours), startMinutes);
    const endDate = setMinutes(
      setHours(overnight ? addDays(shiftDate, 1) : shiftDate, endHours),
      endMinutes
    );

    const typeLabel = shift.type === 'primary' ? 'Primary' : 'Secondary';
    const title = `${staffMember.name} - ${typeLabel}${staffMember.role ? ` (${staffMember.role})` : ''}`;
    const description = [
      shift.notes || `${typeLabel} shift for ${staffMember.name}`,
      '',
      `SHIFT_ID:${shift.id}`,
    ].join('\n');

    lines.push(
      'BEGIN:VEVENT',
      `UID:${shift.id}@rota-helper`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${toIcsDate(startDate)}`,
      `DTEND:${toIcsDate(endDate)}`,
      `SUMMARY:${escapeIcsText(title)}`,
      `DESCRIPTION:${escapeIcsText(description)}`,
      'END:VEVENT'
    );
    eventsCreated++;
  }

  lines.push('END:VCALENDAR');
  return { ics: `${lines.join('\r\n')}\r\n`, eventsCreated };
}

function downloadIcs(filename: string, contents: string) {
  const blob = new Blob([contents], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function icsFilename(calendarName: string): string {
  const safe = calendarName.trim().replace(/[^\w\s-]+/g, '').replace(/\s+/g, '-') || 'rota-helper';
  return `${safe}.ics`;
}

export async function exportRotaToCalendar(
  shifts: Shift[],
  staff: Staff[],
  calendarName: string = 'Rota Helper'
): Promise<{
  success: boolean;
  eventsCreated: number;
  eventsSkipped: number;
  calendarUsed?: string;
  error?: string;
}> {
  try {
    const { ics, eventsCreated } = buildIcs(shifts, staff, calendarName);
    downloadIcs(icsFilename(calendarName), ics);
    return {
      success: true,
      eventsCreated,
      eventsSkipped: 0,
      calendarUsed: calendarName,
    };
  } catch (error) {
    console.error('Calendar export error:', error);
    return {
      success: false,
      eventsCreated: 0,
      eventsSkipped: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function clearRotaFromCalendar(
  _calendarName: string = 'Rota Helper'
): Promise<{ success: boolean; eventsDeleted: number; error?: string }> {
  return {
    success: false,
    eventsDeleted: 0,
    error: 'Clearing calendar events is not available on web.',
  };
}

export function showExportConfirmation(onConfirm: () => void, shiftsCount: number) {
  confirmAlert(
    'Export to Calendar',
    `This will download a calendar file (.ics) for ${shiftsCount} shift(s).\n\nContinue?`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Export', onPress: onConfirm },
    ]
  );
}
