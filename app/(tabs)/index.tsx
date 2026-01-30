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

function parseTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
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

  const renderShiftCard = (shift: Shift, day: Date) => {
    const staffMember = staffMap.get(shift.staffId);
    if (!staffMember) return null;

    const isPrimary = shift.type === 'primary';
    const startMinutes = parseTime(shift.startTime);
    const endMinutes = parseTime(shift.endTime);
    const isOvernight = endMinutes < startMinutes;
    const isCurrentDay = isToday(day);

    return (
      <TouchableOpacity
        key={shift.id}
        style={[
          styles.shiftCard,
          { 
            backgroundColor: isDark ? '#2d2d44' : '#fff',
            borderLeftWidth: 4,
            borderLeftColor: staffMember.color,
          },
        ]}
        onPress={() => handleEditShift(shift)}
        activeOpacity={0.7}
      >
        {/* Overnight Badge - Top Right Corner */}
        {isOvernight && (
          <View style={[styles.overnightBadge, { backgroundColor: '#4a4a6a' }]}>
            <Ionicons name="moon" size={14} color='#F7DC6F' />
          </View>
        )}
        
        {/* Row 1: Day and Time */}
        <View style={styles.shiftCardTopRow}>
          <View style={[
            styles.dayBadge,
            { 
              backgroundColor: isCurrentDay ? '#4ECDC4' : isDark ? '#3a3a5a' : '#f0f0f0'
            }
          ]}>
            <ThemedText style={[
              styles.dayBadgeDay,
              { color: isCurrentDay ? '#fff' : isDark ? '#fff' : '#333' }
            ]}>
              {format(day, 'EEE')}
            </ThemedText>
            <ThemedText style={[
              styles.dayBadgeDate,
              { color: isCurrentDay ? '#fff' : isDark ? '#aaa' : '#666' }
            ]}>
              {format(day, 'd')}
            </ThemedText>
          </View>
          <View style={styles.timeContainer}>
            <ThemedText style={styles.shiftCardTime}>
              {shift.startTime}
            </ThemedText>
            <ThemedText style={[styles.shiftCardTimeSeparator, { color: isDark ? '#666' : '#999' }]}>
              -
            </ThemedText>
            <ThemedText style={styles.shiftCardTime}>
              {shift.endTime}
            </ThemedText>
          </View>
        </View>
        
        {/* Row 2: Staff Name and Shift Type */}
        <View style={styles.shiftCardBottomRow}>
          <ThemedText style={styles.shiftCardName}>
            {staffMember.name}
          </ThemedText>
          <View style={[
            styles.shiftTypeBadge,
            { backgroundColor: isPrimary ? '#4ECDC4' : '#F7DC6F' }
          ]}>
            <ThemedText style={[styles.shiftTypeBadgeText, { color: isPrimary ? '#fff' : '#333' }]}>
              {isPrimary ? 'Primary' : 'Secondary'}
            </ThemedText>
          </View>
        </View>
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
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.listContent}
        >
          {weekDays.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayShifts = shiftsByDate.get(dateKey) || [];
            
            // Filter out continuation shifts and sort by start time
            const uniqueShifts = dayShifts
              .filter(shift => !shift.id.endsWith('-continuation'))
              .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));
            
            return uniqueShifts.map((shift) => renderShiftCard(shift, day));
          })}
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
  listContent: {
    paddingBottom: 100,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  shiftCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  shiftCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  shiftCardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 50,
  },
  dayBadgeDay: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dayBadgeDate: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  shiftCardTime: {
    fontSize: 20,
    fontWeight: '600',
  },
  shiftCardTimeSeparator: {
    fontSize: 20,
    marginHorizontal: 6,
  },
  overnightBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  shiftCardName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  shiftTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  shiftTypeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
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
