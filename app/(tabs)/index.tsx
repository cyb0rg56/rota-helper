import { Ionicons } from '@expo/vector-icons';
import {
    addDays,
    addWeeks,
    eachDayOfInterval,
    endOfWeek,
    format,
    isToday,
    parseISO,
    startOfWeek,
    subWeeks
} from 'date-fns';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppSelector } from '@/store';
import { Shift } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_WIDTH = (SCREEN_WIDTH - 80) / 7;

// Time slots from 00:00 to 24:00 (full 24 hours)
const TIME_SLOTS = Array.from({ length: 25 }, (_, i) => {
  return `${i.toString().padStart(2, '0')}:00`;
});

// 25 grid blocks to match time labels (00:00 through 24:00)
const GRID_BLOCKS = 25;

function parseTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function getShiftPosition(shift: Shift): { top: number; height: number } {
  const startMinutes = parseTime(shift.startTime);
  const endMinutes = parseTime(shift.endTime);
  
  const top = (startMinutes / 60) * 50; // 50px per hour
  
  // Handle overnight shifts
  const isOvernight = endMinutes < startMinutes;
  
  let height: number;
  if (isOvernight) {
    // Overnight shift - extend to bottom of 24:00 grid line (1250px)
    height = 1250 - top;
  } else {
    // Regular shift
    const duration = endMinutes - startMinutes;
    height = (duration / 60) * 50;
  }
  
  return { top: Math.max(0, top), height: Math.max(25, height) };
}

export default function RotaScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const staff = useAppSelector((state) => state.staff.items);
  const shifts = useAppSelector((state) => state.shifts.items);

  // Current week being viewed
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const staffMap = useMemo(
    () => new Map(staff.map((s) => [s.id, s])),
    [staff]
  );

  // Get the days of the current week
  const weekDays = useMemo(() => {
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: currentWeekStart, end: weekEnd });
  }, [currentWeekStart]);

  // Group shifts by date for the current week
  const shiftsByDate = useMemo(() => {
    const grouped: Map<string, Shift[]> = new Map();
    
    weekDays.forEach((day) => {
      const dateKey = format(day, 'yyyy-MM-dd');
      grouped.set(dateKey, []);
    });
    
    shifts.forEach((shift) => {
      const existing = grouped.get(shift.date);
      if (existing) {
        existing.push(shift);
      }
      
      // Check if this is an overnight shift (end time < start time)
      const startMinutes = parseTime(shift.startTime);
      const endMinutes = parseTime(shift.endTime);
      const isOvernightShift = endMinutes < startMinutes;
      
      if (isOvernightShift) {
        // Add a continuation shift for the next day
        const nextDate = format(addDays(parseISO(shift.date), 1), 'yyyy-MM-dd');
        const nextDayShifts = grouped.get(nextDate);
        if (nextDayShifts) {
          // Create a continuation shift that starts at 00:00
          nextDayShifts.push({
            ...shift,
            id: `${shift.id}-continuation`,
            startTime: '00:00',
            // Keep the original end time
          });
        }
      }
    });
    
    return grouped;
  }, [shifts, weekDays]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeekStart((prev) =>
      direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1)
    );
  };

  const goToToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const handleAddShift = () => {
    if (staff.length === 0) {
      router.push('/staff');
      return;
    }
    router.push('/add-shifts');
  };

  const handleEditShift = (shift: Shift) => {
    // Extract original shift ID if this is a continuation shift
    const originalId = shift.id.endsWith('-continuation') 
      ? shift.id.replace('-continuation', '') 
      : shift.id;
    
    router.push({
      pathname: '/edit-shift',
      params: { id: originalId },
    });
  };

  const renderShiftBlock = (shift: Shift, index: number) => {
    const staffMember = staffMap.get(shift.staffId);
    if (!staffMember) return null;

    const { top, height } = getShiftPosition(shift);
    const isPrimary = shift.type === 'primary';

    return (
      <TouchableOpacity
        key={shift.id}
        style={[
          styles.shiftBlock,
          {
            backgroundColor: staffMember.color,
            top,
            height,
            left: index * 2,
            width: COLUMN_WIDTH - 8 - index * 2,
            borderLeftWidth: 3,
            borderLeftColor: isPrimary ? '#fff' : '#F7DC6F',
          },
        ]}
        onPress={() => handleEditShift(shift)}
        activeOpacity={0.8}
      >
        <ThemedText style={styles.shiftName} numberOfLines={1}>
          {staffMember.name}
        </ThemedText>
        {height > 40 && (
          <ThemedText style={styles.shiftTime} numberOfLines={1}>
            {shift.startTime}-{shift.endTime}
          </ThemedText>
        )}
      </TouchableOpacity>
    );
  };

  // Count total shifts this week (excluding continuation shifts from overnight shifts)
  const weekShiftCount = useMemo(() => {
    let count = 0;
    shiftsByDate.forEach((dayShifts) => {
      // Only count shifts that aren't continuation shifts
      const uniqueShifts = dayShifts.filter(shift => !shift.id.endsWith('-continuation'));
      count += uniqueShifts.length;
    });
    return count;
  }, [shiftsByDate]);

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="calendar-outline"
        size={80}
        color={isDark ? '#4a4a6a' : '#ccc'}
      />
      <ThemedText style={styles.emptyText}>No shifts this week</ThemedText>
      <ThemedText style={[styles.emptySubtext, { color: isDark ? '#888' : '#666' }]}>
        {staff.length === 0
          ? 'Add staff members first, then create shifts'
          : 'Tap the + button to add shifts'}
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Week Navigator */}
      <View style={[styles.weekNavigator, { backgroundColor: isDark ? '#1a1a2e' : '#f8f9fa' }]}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigateWeek('prev')}>
          <Ionicons name="chevron-back" size={24} color={isDark ? '#fff' : '#333'} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.weekLabelContainer} onPress={goToToday}>
          <ThemedText style={styles.weekLabel}>
            {format(currentWeekStart, 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
          </ThemedText>
          <ThemedText style={[styles.weekShiftCount, { color: '#4ECDC4' }]}>
            {weekShiftCount} shift{weekShiftCount !== 1 ? 's' : ''}
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navButton} onPress={() => navigateWeek('next')}>
          <Ionicons name="chevron-forward" size={24} color={isDark ? '#fff' : '#333'} />
        </TouchableOpacity>
      </View>

      {weekShiftCount === 0 ? (
        <EmptyState />
      ) : (
        <ScrollView style={styles.scrollContainer}>
          {/* Day Headers */}
          <View style={styles.headerRow}>
            <View style={styles.timeColumn} />
            {weekDays.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayShifts = shiftsByDate.get(dateKey) || [];
              const isCurrentDay = isToday(day);
              
              return (
                <View
                  key={dateKey}
                  style={[
                    styles.dayHeader,
                    {
                      backgroundColor: isCurrentDay
                        ? '#4ECDC4'
                        : isDark
                        ? '#2d2d44'
                        : '#f0f0f0',
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.dayName,
                      isCurrentDay && { color: '#fff' },
                    ]}
                  >
                    {format(day, 'EEE')}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.dayNumber,
                      isCurrentDay && { color: '#fff' },
                    ]}
                  >
                    {format(day, 'd')}
                  </ThemedText>
                  {dayShifts.length > 0 && (
                    <View
                      style={[
                        styles.shiftDot,
                        { backgroundColor: isCurrentDay ? '#fff' : '#4ECDC4' },
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>

          {/* Time Grid */}
          <View style={styles.gridContainer}>
            {/* Time Labels */}
            <View style={styles.timeColumn}>
              {TIME_SLOTS.map((time) => (
                <View key={time} style={styles.timeSlot}>
                  <ThemedText style={styles.timeLabel}>{time}</ThemedText>
                </View>
              ))}
            </View>

            {/* Day Columns */}
            {weekDays.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayShifts = shiftsByDate.get(dateKey) || [];
              
              return (
                <View
                  key={dateKey}
                  style={[
                    styles.dayColumn,
                    { borderColor: isDark ? '#3a3a5a' : '#e0e0e0' },
                  ]}
                >
                  {/* Grid blocks */}
                  {Array.from({ length: GRID_BLOCKS }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.gridLine,
                        { borderColor: isDark ? '#3a3a5a' : '#f0f0f0' },
                      ]}
                    />
                  ))}
                  
                  {/* Shift blocks */}
                  {dayShifts.map((shift, index) => renderShiftBlock(shift, index))}
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: '#4ECDC4' }]}
        onPress={handleAddShift}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  weekNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.3)',
  },
  navButton: {
    padding: 12,
  },
  weekLabelContainer: {
    flex: 1,
    alignItems: 'center',
  },
  weekLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  weekShiftCount: {
    fontSize: 12,
    marginTop: 2,
  },
  scrollContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  timeColumn: {
    width: 50,
  },
  dayHeader: {
    width: COLUMN_WIDTH,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 2,
  },
  dayName: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.7,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  shiftDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingBottom: 100,
  },
  timeSlot: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 10,
    opacity: 0.6,
  },
  dayColumn: {
    width: COLUMN_WIDTH,
    position: 'relative',
    borderLeftWidth: 1,
    marginHorizontal: 2,
    height: 1250, // Match time column: 25 slots × 50px
    overflow: 'visible',
  },
  gridLine: {
    height: 50,
    borderBottomWidth: 1,
  },
  shiftBlock: {
    position: 'absolute',
    right: 4,
    left: 0,
    borderRadius: 6,
    padding: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  shiftName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  shiftTime: {
    fontSize: 8,
    color: '#fff',
    opacity: 0.9,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});
