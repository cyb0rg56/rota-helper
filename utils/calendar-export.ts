import { Shift, Staff } from '@/types';
import { addDays, parseISO, setHours, setMinutes } from 'date-fns';
import * as Calendar from 'expo-calendar';
import { Alert } from 'react-native';

export async function requestCalendarPermissions(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissions();
  return status === 'granted';
}

export async function getOrCreateCalendar(calendarName: string): Promise<string | null> {
  const calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);

  const existingCalendar = calendars.find(
    (cal) => cal.title === calendarName && cal.allowsModifications
  );

  if (existingCalendar) {
    return existingCalendar.id;
  }

  try {
    const created = await createAppCalendar(calendarName, calendars);
    if (created?.id) {
      return created.id;
    }
  } catch (error) {
    console.error('Failed to create calendar:', error);
  }

  if (process.env.EXPO_OS === 'ios') {
    try {
      const defaultCalendar = Calendar.getDefaultCalendarSync();
      if (defaultCalendar?.allowsModifications) {
        return defaultCalendar.id;
      }
    } catch (error) {
      console.error('Failed to get default calendar:', error);
    }
  }

  return calendars.find((cal) => cal.allowsModifications)?.id ?? null;
}

async function createAppCalendar(
  calendarName: string,
  calendars: Calendar.ExpoCalendar[]
) {
  if (process.env.EXPO_OS === 'ios') {
    const source =
      calendars.find((cal) => cal.source?.type === Calendar.SourceType.LOCAL)?.source ??
      calendars.find((cal) => cal.source?.type === Calendar.SourceType.CALDAV)?.source ??
      calendars.find((cal) => cal.source)?.source;

    if (!source) {
      throw new Error('No calendar source available');
    }

    return Calendar.createCalendar({
      title: calendarName,
      color: '#4ECDC4',
      entityType: Calendar.EntityTypes.EVENT,
      sourceId: source.id,
      source,
      name: calendarName,
      ownerAccount: 'personal',
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });
  }

  // Local account so export works on emulators / devices with no Google account.
  // ownerAccount must match source.name or CalendarContract rejects the insert.
  return Calendar.createCalendar({
    title: calendarName,
    color: '#4ECDC4',
    entityType: Calendar.EntityTypes.EVENT,
    name: calendarName,
    ownerAccount: calendarName,
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
    source: {
      name: calendarName,
      isLocalAccount: true,
      type: 'LOCAL',
    },
  });
}

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

async function shiftExistsInCalendar(
  calendarId: string,
  shift: Shift,
  startDate: Date,
  endDate: Date
): Promise<boolean> {
  try {
    // Search for events on the shift's start date
    const dayStart = new Date(startDate);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(endDate);
    dayEnd.setHours(23, 59, 59, 999);

    const existingEvents = await Calendar.listEvents(
      [calendarId],
      dayStart,
      dayEnd
    );

    // Check if any event matches this shift's unique identifier
    const shiftIdentifier = `SHIFT_ID:${shift.id}`;

    return existingEvents.some(
      (event) => event.notes && event.notes.includes(shiftIdentifier)
    );
  } catch (error) {
    console.error('Error checking for existing event:', error);
    return false; // If we can't check, assume it doesn't exist to avoid skipping
  }
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
    const hasPermission = await requestCalendarPermissions();
    if (!hasPermission) {
      return {
        success: false,
        eventsCreated: 0,
        eventsSkipped: 0,
        error: 'Calendar permission denied. Please enable it in settings.',
      };
    }

    const calendarId = await getOrCreateCalendar(calendarName);
    if (!calendarId) {
      return {
        success: false,
        eventsCreated: 0,
        eventsSkipped: 0,
        error: 'Could not find or create a writable calendar.',
      };
    }

    const usedCalendar = await Calendar.ExpoCalendar.get(calendarId);
    const actualCalendarName = usedCalendar?.title || calendarName;

    const staffMap = new Map(staff.map((s) => [s.id, s]));

    let eventsCreated = 0;
    let eventsSkipped = 0;

    for (const shift of shifts) {
      const staffMember = staffMap.get(shift.staffId);
      if (!staffMember) continue;

      const { hours: startHours, minutes: startMinutes } = parseTime(shift.startTime);
      const { hours: endHours, minutes: endMinutes } = parseTime(shift.endTime);

      const isOvernightShift =
        endHours < startHours ||
        (endHours === startHours && endMinutes < startMinutes);

      const shiftDate = parseISO(shift.date);
      const startDate = setMinutes(setHours(shiftDate, startHours), startMinutes);

      const endDay = isOvernightShift ? addDays(shiftDate, 1) : shiftDate;
      const endDate = setMinutes(setHours(endDay, endHours), endMinutes);

      const alreadyExists = await shiftExistsInCalendar(
        calendarId,
        shift,
        startDate,
        endDate
      );

      if (alreadyExists) {
        eventsSkipped++;
        continue;
      }

      const typeLabel = shift.type === 'primary' ? 'Primary' : 'Secondary';
      const title = `${staffMember.name} - ${typeLabel}${staffMember.role ? ` (${staffMember.role})` : ''}`;

      const notesContent = [
        shift.notes || `${typeLabel} shift for ${staffMember.name}`,
        `\n\nSHIFT_ID:${shift.id}`,
      ].join('');

      await usedCalendar.createEvent({
        title,
        startDate,
        endDate,
        notes: notesContent,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      eventsCreated++;
    }

    return {
      success: true,
      eventsCreated,
      eventsSkipped,
      calendarUsed: actualCalendarName,
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
  calendarName: string = 'Rota Helper'
): Promise<{ success: boolean; eventsDeleted: number; error?: string }> {
  try {
    const hasPermission = await requestCalendarPermissions();
    if (!hasPermission) {
      return {
        success: false,
        eventsDeleted: 0,
        error: 'Calendar permission denied. Please enable it in settings.',
      };
    }

    const calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);

    let calendarsToCheck: string[] = [];

    const targetCalendar = calendars.find(
      (cal) => cal.title === calendarName && cal.allowsModifications
    );

    if (targetCalendar) {
      calendarsToCheck = [targetCalendar.id];
    } else {
      calendarsToCheck = calendars
        .filter((cal) => cal.allowsModifications)
        .map((cal) => cal.id);
    }

    if (calendarsToCheck.length === 0) {
      return {
        success: false,
        eventsDeleted: 0,
        error: 'No writable calendars found.',
      };
    }

    const now = new Date();
    const startDate = new Date(now.getFullYear() - 1, 0, 1);
    const endDate = new Date(now.getFullYear() + 2, 11, 31);

    const events = await Calendar.listEvents(
      calendarsToCheck,
      startDate,
      endDate
    );

    const rotaEvents = events.filter(
      (event) => event.notes && event.notes.includes('SHIFT_ID:')
    );

    if (rotaEvents.length === 0) {
      return {
        success: true,
        eventsDeleted: 0,
      };
    }

    let eventsDeleted = 0;

    for (const event of rotaEvents) {
      try {
        await event.delete();
        eventsDeleted++;
      } catch (error) {
        console.error('Failed to delete event:', event.id, error);
      }
    }

    return {
      success: true,
      eventsDeleted,
    };
  } catch (error) {
    console.error('Calendar clear error:', error);
    return {
      success: false,
      eventsDeleted: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export function showExportConfirmation(
  onConfirm: () => void,
  shiftsCount: number
) {
  Alert.alert(
    'Export to Calendar',
    `This will create calendar events for ${shiftsCount} shift(s). Duplicate events will be skipped automatically.\n\nContinue?`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Export', onPress: onConfirm },
    ]
  );
}
