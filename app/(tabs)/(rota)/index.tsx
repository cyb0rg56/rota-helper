import {
  addWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  startOfWeek,
  subWeeks,
} from 'date-fns';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { HeaderActions } from '@/components/header-actions';
import { Icon } from '@/components/icon';
import { ScreenContainer } from '@/components/screen-container';
import { ShiftCard } from '@/components/shift-card';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppDispatch, useAppSelector } from '@/store';
import { removeShift } from '@/store/slices/shiftSlice';
import { Shift } from '@/types';
import { confirmAlert } from '@/utils/confirm';
import { blurActiveElement } from '@/utils/focus';
import { parseTime } from '@/utils/time';

export default function RotaScreen() {
  const isDark = useColorScheme() === 'dark';
  const dispatch = useAppDispatch();
  const staff = useAppSelector((state) => state.staff.items);
  const shifts = useAppSelector((state) => state.shifts.items);

  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const staffMap = useMemo(() => new Map(staff.map((member) => [member.id, member])), [staff]);

  const weekDays = useMemo(() => {
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: currentWeekStart, end: weekEnd });
  }, [currentWeekStart]);

  const shiftsByDate = useMemo(() => {
    const grouped = new Map<string, Shift[]>();
    weekDays.forEach((day) => {
      grouped.set(format(day, 'yyyy-MM-dd'), []);
    });
    shifts.forEach((shift) => {
      grouped.get(shift.date)?.push(shift);
    });
    return grouped;
  }, [shifts, weekDays]);

  const weekShiftCount = useMemo(() => {
    let count = 0;
    shiftsByDate.forEach((dayShifts) => {
      count += dayShifts.length;
    });
    return count;
  }, [shiftsByDate]);

  const handleAddShift = () => {
    blurActiveElement();
    if (staff.length === 0) {
      router.push('/staff');
      return;
    }
    router.push('/add-shifts');
  };

  const handleDeleteShift = (shift: Shift) => {
    confirmAlert('Delete Shift', 'Are you sure you want to delete this shift?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => dispatch(removeShift(shift.id)),
      },
    ]);
  };

  return (
    <>
      <ScreenContainer>
      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 24,
          gap: 12,
          flexGrow: 1,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
          }}
        >
          <Pressable
            onPress={() => setCurrentWeekStart((prev) => subWeeks(prev, 1))}
            accessibilityRole="button"
            accessibilityLabel="Previous week"
            style={{ padding: 12 }}
          >
            <Icon sf="chevron.left" md="chevron-left" size={24} color={isDark ? '#fff' : '#333'} />
          </Pressable>

          <Pressable
            onPress={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            style={{ flex: 1, alignItems: 'center' }}
          >
            <ThemedText selectable style={{ fontSize: 16, fontWeight: '600' }}>
              {format(currentWeekStart, 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
            </ThemedText>
            <ThemedText
              selectable
              style={{ fontSize: 12, color: '#4ECDC4', fontVariant: ['tabular-nums'] }}
            >
              {weekShiftCount} shift{weekShiftCount !== 1 ? 's' : ''}
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => setCurrentWeekStart((prev) => addWeeks(prev, 1))}
            accessibilityRole="button"
            accessibilityLabel="Next week"
            style={{ padding: 12 }}
          >
            <Icon sf="chevron.right" md="chevron-right" size={24} color={isDark ? '#fff' : '#333'} />
          </Pressable>
        </View>

        {weekShiftCount === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 40,
              paddingVertical: 48,
              gap: 8,
            }}
          >
            <Icon sf="calendar" md="calendar-blank-outline" size={80} color={isDark ? '#4a4a6a' : '#ccc'} />
            <ThemedText style={{ fontSize: 20, fontWeight: '600', marginTop: 12 }}>
              No shifts this week
            </ThemedText>
            <ThemedText
              selectable
              style={{ fontSize: 14, textAlign: 'center', color: isDark ? '#888' : '#666' }}
            >
              {staff.length > 0
                ? 'Tap + to add shifts'
                : 'Add staff members first, then create shifts'}
            </ThemedText>
          </View>
        ) : (
          weekDays.flatMap((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            return (shiftsByDate.get(dateKey) ?? [])
              .slice()
              .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime))
              .map((shift) => {
                const staffMember = staffMap.get(shift.staffId);
                if (!staffMember) {
                  return null;
                }
                return (
                  <ShiftCard
                    key={shift.id}
                    shift={shift}
                    day={day}
                    staffMember={staffMember}
                    onDelete={() => handleDeleteShift(shift)}
                  />
                );
              });
          })
        )}
      </ScrollView>
      </ScreenContainer>
      <HeaderActions
        placement="right"
        actions={[
          {
            key: 'add',
            label: 'Add Shift',
            sf: 'plus',
            md: 'plus',
            onPress: handleAddShift,
          },
        ]}
      />
    </>
  );
}
