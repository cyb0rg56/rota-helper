import { Shift, Staff } from '@/types';
import { addDays, parseISO, setHours, setMinutes } from 'date-fns';
import * as Calendar from 'expo-calendar';
import { Alert, Platform } from 'react-native';

export async function requestCalendarPermissions(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

export async function getOrCreateCalendar(calendarName: string): Promise<string | null> {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  
  // Try to find calendar with the specified name
  const existingCalendar = calendars.find(
    (cal) => cal.title === calendarName && cal.allowsModifications
  );
  
  if (existingCalendar) {
    return existingCalendar.id;
  }
  
  // Try to create a new calendar with the specified name
  let newCalendarId: string | null = null;
  
  if (Platform.OS === 'ios') {
    // For iOS, try local source first, then iCloud
    const localSource = calendars.find(
      (cal) => cal.source && cal.source.type === 'local'
    )?.source;
    
    const iCloudSource = calendars.find(
      (cal) => cal.source && cal.source.type === 'caldav'
    )?.source;
    
    const defaultCalendarSource = localSource || iCloudSource || calendars.find((cal) => cal.source)?.source;
    
    if (defaultCalendarSource) {
      try {
        newCalendarId = await Calendar.createCalendarAsync({
          title: calendarName,
          color: '#4ECDC4',
          entityType: Calendar.EntityTypes.EVENT,
          sourceId: defaultCalendarSource.id,
          source: defaultCalendarSource,
          name: calendarName.toLowerCase().replace(/\s+/g, '-'),
          ownerAccount: 'personal',
          accessLevel: Calendar.CalendarAccessLevel.OWNER,
        });
        return newCalendarId;
      } catch (error) {
        console.error('Failed to create calendar:', error);
        // If creation failed, fall through to use default calendar
      }
    }
  } else if (Platform.OS === 'android') {
    // Android calendar creation
    const defaultCalendarSource = calendars.find(
      (cal) => cal.source && cal.allowsModifications
    )?.source || calendars.find((cal) => cal.source)?.source;
    
    if (defaultCalendarSource) {
      try {
        newCalendarId = await Calendar.createCalendarAsync({
          title: calendarName,
          color: '#4ECDC4',
          entityType: Calendar.EntityTypes.EVENT,
          sourceId: defaultCalendarSource.id,
          source: defaultCalendarSource,
          name: calendarName.toLowerCase().replace(/\s+/g, '-'),
          ownerAccount: 'personal',
          accessLevel: Calendar.CalendarAccessLevel.OWNER,
        });
        return newCalendarId;
      } catch (error) {
        console.error('Failed to create calendar:', error);
        // If creation failed, fall through to use default calendar
      }
    }
  }
  
  // If we couldn't create a calendar, use the default writable calendar
  const defaultCalendar = await Calendar.getDefaultCalendarAsync();
  if (defaultCalendar && defaultCalendar.allowsModifications) {
    console.log('Using default calendar:', defaultCalendar.title);
    return defaultCalendar.id;
  }
  
  // Last resort: find any writable calendar
  const writableCalendar = calendars.find((cal) => cal.allowsModifications);
  if (writableCalendar) {
    console.log('Using first writable calendar:', writableCalendar.title);
    return writableCalendar.id;
  }
  
  return null;
}

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

/**
 * Find existing calendar event for a shift
 * Returns the event if found, null otherwise
 */
async function findExistingShiftEvent(
  calendarId: string,
  shift: Shift,
  startDate: Date,
  endDate: Date
): Promise<Calendar.Event | null> {
  try {
    // Search for events on the shift's start date
    const dayStart = new Date(startDate);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(endDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    const existingEvents = await Calendar.getEventsAsync(
      [calendarId],
      dayStart,
      dayEnd
    );
    
    // Find event that matches this shift's unique identifier
    const shiftIdentifier = `SHIFT_ID:${shift.id}`;
    
    const matchingEvent = existingEvents.find(
      (event) => event.notes && event.notes.includes(shiftIdentifier)
    );
    
    return matchingEvent || null;
  } catch (error) {
    console.error('Error checking for existing event:', error);
    return null; // If we can't check, assume it doesn't exist to avoid skipping
  }
}

/**
 * Check if event details match the shift
 */
function eventMatchesShift(
  event: Calendar.Event,
  title: string,
  startDate: Date,
  endDate: Date,
  notes: string
): boolean {
  const timeTolerance = 1000; // 1 second tolerance for time comparison
  
  // Convert event dates to Date objects if they're strings
  const eventStartDate = typeof event.startDate === 'string' 
    ? new Date(event.startDate) 
    : event.startDate;
  const eventEndDate = typeof event.endDate === 'string' 
    ? new Date(event.endDate) 
    : event.endDate;
  
  return (
    event.title === title &&
    Math.abs(eventStartDate.getTime() - startDate.getTime()) < timeTolerance &&
    Math.abs(eventEndDate.getTime() - endDate.getTime()) < timeTolerance &&
    event.notes === notes
  );
}

export async function exportRotaToCalendar(
  shifts: Shift[],
  staff: Staff[],
  calendarName: string = 'Rota Helper'
): Promise<{ 
  success: boolean; 
  eventsCreated: number; 
  eventsUpdated: number;
  eventsSkipped: number;
  calendarUsed?: string;
  error?: string;
}> {
  try {
    // Request permissions
    const hasPermission = await requestCalendarPermissions();
    if (!hasPermission) {
      return {
        success: false,
        eventsCreated: 0,
        eventsUpdated: 0,
        eventsSkipped: 0,
        error: 'Calendar permission denied. Please enable it in settings.',
      };
    }
    
    // Get or create calendar
    const calendarId = await getOrCreateCalendar(calendarName);
    if (!calendarId) {
      return {
        success: false,
        eventsCreated: 0,
        eventsUpdated: 0,
        eventsSkipped: 0,
        error: 'Could not find or create a writable calendar.',
      };
    }
    
    // Get the actual calendar name being used
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const usedCalendar = calendars.find((cal) => cal.id === calendarId);
    const actualCalendarName = usedCalendar?.title || calendarName;
    
    // Create staff lookup
    const staffMap = new Map(staff.map((s) => [s.id, s]));
    
    let eventsCreated = 0;
    let eventsUpdated = 0;
    let eventsSkipped = 0;
    
    // Create calendar event for each shift
    for (const shift of shifts) {
      const staffMember = staffMap.get(shift.staffId);
      if (!staffMember) continue;
      
      const { hours: startHours, minutes: startMinutes } = parseTime(shift.startTime);
      const { hours: endHours, minutes: endMinutes } = parseTime(shift.endTime);
      
      // Check if this is an overnight shift (end time is before start time)
      const isOvernightShift = 
        endHours < startHours || 
        (endHours === startHours && endMinutes < startMinutes);
      
      const shiftDate = parseISO(shift.date);
      const startDate = setMinutes(setHours(shiftDate, startHours), startMinutes);
      
      // If overnight shift, add a day to the end date
      const endDay = isOvernightShift ? addDays(shiftDate, 1) : shiftDate;
      const endDate = setMinutes(setHours(endDay, endHours), endMinutes);
      
      // Create title with shift type
      const typeLabel = shift.type === 'primary' ? 'Primary' : 'Secondary';
      const title = `${staffMember.name} - ${typeLabel}${staffMember.role ? ` (${staffMember.role})` : ''}`;
      
      // Create notes with unique identifier
      const notesContent = [
        shift.notes || `${typeLabel} shift for ${staffMember.name}`,
        `\n\nSHIFT_ID:${shift.id}`,
      ].join('');
      
      // Check if this shift already exists in the calendar
      const existingEvent = await findExistingShiftEvent(
        calendarId,
        shift,
        startDate,
        endDate
      );
      
      if (existingEvent) {
        // Check if event details match
        const detailsMatch = eventMatchesShift(
          existingEvent,
          title,
          startDate,
          endDate,
          notesContent
        );
        
        if (detailsMatch) {
          // Event exists and is up to date, skip it
          eventsSkipped++;
          continue;
        } else {
          // Event exists but details have changed, update it
          try {
            await Calendar.updateEventAsync(existingEvent.id, {
              title,
              startDate,
              endDate,
              notes: notesContent,
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            });
            eventsUpdated++;
          } catch (updateError) {
            console.error('Failed to update event:', updateError);
            // If update fails, try to delete and recreate
            try {
              await Calendar.deleteEventAsync(existingEvent.id);
              await Calendar.createEventAsync(calendarId, {
                title,
                startDate,
                endDate,
                notes: notesContent,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              });
              eventsUpdated++;
            } catch (recreateError) {
              console.error('Failed to recreate event:', recreateError);
            }
          }
        }
      } else {
        // Event doesn't exist, create it
        await Calendar.createEventAsync(calendarId, {
          title,
          startDate,
          endDate,
          notes: notesContent,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        eventsCreated++;
      }
    }
    
    return {
      success: true,
      eventsCreated,
      eventsUpdated,
      eventsSkipped,
      calendarUsed: actualCalendarName,
    };
  } catch (error) {
    console.error('Calendar export error:', error);
    return {
      success: false,
      eventsCreated: 0,
      eventsUpdated: 0,
      eventsSkipped: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Delete all rota events from the calendar
 */
export async function clearRotaFromCalendar(
  calendarName: string = 'Rota Helper'
): Promise<{ success: boolean; eventsDeleted: number; error?: string }> {
  try {
    // Request permissions
    const hasPermission = await requestCalendarPermissions();
    if (!hasPermission) {
      return {
        success: false,
        eventsDeleted: 0,
        error: 'Calendar permission denied. Please enable it in settings.',
      };
    }
    
    // Get all calendars
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    
    // Try to find the specified calendar, or fall back to checking all writable calendars
    let calendarsToCheck: string[] = [];
    
    const targetCalendar = calendars.find(
      (cal) => cal.title === calendarName && cal.allowsModifications
    );
    
    if (targetCalendar) {
      calendarsToCheck = [targetCalendar.id];
    } else {
      // If named calendar doesn't exist, check all writable calendars
      // (in case events were added to default calendar)
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
    
    // Get all events from the calendars (search over a wide range)
    const now = new Date();
    const startDate = new Date(now.getFullYear() - 1, 0, 1); // 1 year ago
    const endDate = new Date(now.getFullYear() + 2, 11, 31); // 2 years ahead
    
    const events = await Calendar.getEventsAsync(
      calendarsToCheck,
      startDate,
      endDate
    );
    
    // Filter events that have our shift identifier
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
    
    // Delete each rota event
    for (const event of rotaEvents) {
      try {
        await Calendar.deleteEventAsync(event.id);
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
