import {
  addDays,
  addMonths,
  eachDayOfInterval,
  format,
  getDay,
  isSameDay,
  isToday,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { SheetScreen } from '@/components/header-actions';
import { Icon } from '@/components/icon';
import { SheetBodyTitle } from '@/components/sheet-body-title';
import { SegmentedShiftType } from '@/components/segmented-shift-type';
import { ShiftTypeToggle } from '@/components/shift-type-toggle';
import { ThemedText } from '@/components/themed-text';
import { TimeField } from '@/components/time-field';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppDispatch, useAppSelector } from '@/store';
import { addShift } from '@/store/slices/shiftSlice';
import { ShiftType, Staff } from '@/types';
import { generateId } from '@/utils/id';
import { isOvernight } from '@/utils/time';

interface SelectedDate {
  date: Date;
  type: ShiftType;
}

export default function AddShiftsScreen() {
  const isDark = useColorScheme() === 'dark';
  const dispatch = useAppDispatch();
  const staffList = useAppSelector((state) => state.staff.items);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(
    staffList.length > 0 ? staffList[0] : null
  );
  const [selectedDates, setSelectedDates] = useState<SelectedDate[]>([]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [notes, setNotes] = useState('');
  const [showStaffPicker, setShowStaffPicker] = useState(false);
  const [selectionMode, setSelectionMode] = useState<ShiftType>('primary');

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const startDay = getDay(monthStart);
    const daysToShow = startDay === 0 ? 6 : startDay - 1;
    const calendarStart = addDays(monthStart, -daysToShow);
    const calendarEnd = addDays(calendarStart, 41);
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const calendarWeeks = useMemo(
    () => Array.from({ length: 6 }, (_, week) => calendarDays.slice(week * 7, week * 7 + 7)),
    [calendarDays]
  );

  const overnight = useMemo(() => isOvernight(startTime, endTime), [startTime, endTime]);

  const toggleDateSelection = (date: Date, type: ShiftType) => {
    setSelectedDates((prev) => {
      const existingIndex = prev.findIndex((item) => isSameDay(item.date, date));
      if (existingIndex !== -1) {
        const existing = prev[existingIndex];
        if (existing.type === type) {
          return prev.filter((_, index) => index !== existingIndex);
        }
        const updated = [...prev];
        updated[existingIndex] = { date, type };
        return updated;
      }
      return [...prev, { date, type }].sort((a, b) => a.date.getTime() - b.date.getTime());
    });
  };

  const getDateSelection = (date: Date) => selectedDates.find((item) => isSameDay(item.date, date));

  const handleSave = () => {
    if (!selectedStaff || selectedDates.length === 0) {
      return;
    }

    selectedDates.forEach(({ date, type }) => {
      dispatch(
        addShift({
          id: generateId(),
          staffId: selectedStaff.id,
          date: format(date, 'yyyy-MM-dd'),
          startTime,
          endTime,
          type,
          notes: notes.trim() || undefined,
        })
      );
    });

    router.back();
  };

  const primaryCount = selectedDates.filter((item) => item.type === 'primary').length;
  const secondaryCount = selectedDates.filter((item) => item.type === 'secondary').length;
  const pickerButtonStyle = {
    padding: 16,
    borderRadius: 12,
    borderCurve: 'continuous' as const,
    backgroundColor: isDark ? '#2d2d44' : '#f8f9fa',
  };
  const sectionStyle = {
    gap: 10,
    padding: 16,
    borderRadius: 16,
    borderCurve: 'continuous' as const,
    backgroundColor: isDark ? '#1a1a2e' : '#fff',
    borderWidth: 1,
    borderColor: isDark ? '#2d2d44' : '#e8eaed',
  };

  return (
    <SheetScreen
      left={[{ key: 'cancel', label: 'Cancel', onPress: () => router.back() }]}
      right={[
        {
          key: 'create',
          label: selectedDates.length > 0 ? `Create ${selectedDates.length}` : 'Create',
          prominent: true,
          disabled: !selectedStaff || selectedDates.length === 0,
          onPress: handleSave,
        },
      ]}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {process.env.EXPO_OS === 'android' ? (
          <View style={{ gap: 2, paddingHorizontal: 4 }}>
            <ThemedText type="title" style={{ fontSize: 28, lineHeight: 34 }}>
              Add Shifts
            </ThemedText>
            <ThemedText style={{ opacity: 0.65 }}>Assign shifts to your team</ThemedText>
          </View>
        ) : null}
        <SheetBodyTitle title="Add Shifts" subtitle="Assign shifts to your team" />

        <View style={sectionStyle}>
          <ThemedText style={{ fontSize: 14, fontWeight: '600', opacity: 0.8 }}>
            Staff Member *
          </ThemedText>
          <Pressable
            style={({ pressed }) => [pickerButtonStyle, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => setShowStaffPicker((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel={selectedStaff ? `Staff member, ${selectedStaff.name}` : 'Staff member'}
            accessibilityValue={selectedStaff ? { text: selectedStaff.name } : undefined}
            accessibilityState={{ expanded: showStaffPicker }}
          >
            <View
              style={{
                flex: 1,
                minWidth: 0,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {selectedStaff ? (
                <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: selectedStaff.color,
                    }}
                  />
                  <ThemedText style={{ flexShrink: 1, fontSize: 16 }}>{selectedStaff.name}</ThemedText>
                </View>
              ) : (
                <ThemedText style={{ fontSize: 16, opacity: 0.5 }}>Select staff member</ThemedText>
              )}
              <Icon
                sf={showStaffPicker ? 'chevron.up' : 'chevron.down'}
                md={showStaffPicker ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={isDark ? '#666' : '#999'}
              />
            </View>
          </Pressable>
          {showStaffPicker ? (
            <View
              style={{
                borderRadius: 12,
                borderCurve: 'continuous',
                overflow: 'hidden',
                backgroundColor: isDark ? '#1a1a2e' : '#fff',
              }}
            >
              {staffList.map((member) => (
                <Pressable
                  key={member.id}
                  onPress={() => {
                    setSelectedStaff(member);
                    setShowStaffPicker(false);
                  }}
                  accessibilityRole="radio"
                  accessibilityLabel={member.name}
                  accessibilityState={{ selected: selectedStaff?.id === member.id, checked: selectedStaff?.id === member.id }}
                  style={{
                    minHeight: 52,
                    paddingHorizontal: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    borderTopWidth: member.id === staffList[0]?.id ? 0 : 1,
                    borderTopColor: isDark ? '#2d2d44' : '#e8eaed',
                    backgroundColor:
                      selectedStaff?.id === member.id ? (isDark ? '#3a3a5a' : '#e8f4f8') : undefined,
                  }}
                >
                  <View
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: member.color,
                    }}
                  />
                  <ThemedText style={{ flex: 1, flexShrink: 1 }}>{member.name}</ThemedText>
                  {selectedStaff?.id === member.id ? (
                    <Icon sf="checkmark" md="check" size={20} color="#4ECDC4" />
                  ) : null}
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <View style={sectionStyle}>
          <ThemedText style={{ fontSize: 14, fontWeight: '600', opacity: 0.8 }}>
            Select Dates *
          </ThemedText>
          {process.env.EXPO_OS === 'ios' ? (
            <SegmentedShiftType value={selectionMode} onChange={setSelectionMode} />
          ) : (
            <ShiftTypeToggle
              value={selectionMode}
              onChange={setSelectionMode}
              isDark={isDark}
            />
          )}
          <ThemedText style={{ fontSize: 12, color: isDark ? '#aaa' : '#666' }}>
            Tap dates to mark them as {selectionMode === 'primary' ? 'Primary' : 'Secondary'}.
          </ThemedText>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: 12,
              borderCurve: 'continuous',
              backgroundColor: isDark ? '#2d2d44' : '#f0f0f0',
            }}
          >
            <Pressable
              onPress={() => setCurrentMonth((prev) => subMonths(prev, 1))}
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              style={{ padding: 12 }}
            >
              <Icon sf="chevron.left" md="chevron-left" size={24} color={isDark ? '#fff' : '#333'} />
            </Pressable>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <ThemedText style={{ fontSize: 16, fontWeight: '600' }}>
                {format(currentMonth, 'MMMM yyyy')}
              </ThemedText>
            </View>
            <Pressable
              onPress={() => setCurrentMonth((prev) => addMonths(prev, 1))}
              accessibilityRole="button"
              accessibilityLabel="Next month"
              style={{ padding: 12 }}
            >
              <Icon sf="chevron.right" md="chevron-right" size={24} color={isDark ? '#fff' : '#333'} />
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row' }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <View key={day} style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}>
                <ThemedText style={{ fontSize: 12, fontWeight: '600', opacity: 0.6 }}>{day}</ThemedText>
              </View>
            ))}
          </View>

          <View style={{ gap: 6 }}>
            {calendarWeeks.map((week, weekIndex) => (
              <View key={`week-${weekIndex}`} style={{ flexDirection: 'row', gap: 6 }}>
                {week.map((day) => {
                  const selection = getDateSelection(day);
                  const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                  const isCurrentDay = isToday(day);
                  return (
                    <Pressable
                      key={day.toISOString()}
                      onPress={() => toggleDateSelection(day, selectionMode)}
                      accessibilityRole="button"
                      accessibilityLabel={`${format(day, 'EEEE, MMMM d')}${selection ? `, ${selection.type}` : ''}`}
                      accessibilityState={{ selected: !!selection }}
                      style={({ pressed }) => ({
                        flex: 1,
                        minHeight: 42,
                        borderRadius: 8,
                        borderCurve: 'continuous',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        backgroundColor: selection
                          ? selection.type === 'primary'
                            ? '#4ECDC4'
                            : '#F7DC6F'
                          : isDark
                            ? '#2d2d44'
                            : '#f8f9fa',
                        borderColor: isCurrentDay
                          ? '#FF6B6B'
                          : selection
                            ? selection.type === 'primary'
                              ? '#4ECDC4'
                              : '#F7DC6F'
                            : isDark
                              ? '#3a3a5a'
                              : '#e0e0e0',
                        borderWidth: isCurrentDay ? 2 : 1,
                        opacity: pressed ? 0.7 : isCurrentMonth ? 1 : 0.3,
                      })}
                    >
                      <View style={{ alignItems: 'center' }}>
                        <ThemedText
                          style={[
                            { fontSize: 14, fontVariant: ['tabular-nums'] },
                            selection
                              ? {
                                  color: selection.type === 'secondary' ? '#342d00' : '#073b3a',
                                  fontWeight: '700',
                                }
                              : null,
                          ]}
                        >
                          {format(day, 'd')}
                        </ThemedText>
                        {selection ? (
                          <ThemedText
                            style={{
                              fontSize: 9,
                              lineHeight: 11,
                              fontWeight: '800',
                              color: selection.type === 'secondary' ? '#342d00' : '#073b3a',
                            }}
                          >
                            {selection.type === 'primary' ? 'P' : 'S'}
                          </ThemedText>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>

          {selectedDates.length > 0 ? (
            <View
              style={{
                padding: 12,
                borderRadius: 10,
                borderCurve: 'continuous',
                alignItems: 'center',
                backgroundColor: isDark ? '#2d2d44' : '#e8f4f8',
              }}
            >
              <ThemedText style={{ fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums'] }}>
                {primaryCount > 0 ? `${primaryCount} Primary` : ''}
                {primaryCount > 0 && secondaryCount > 0 ? ' • ' : ''}
                {secondaryCount > 0 ? `${secondaryCount} Secondary` : ''}
              </ThemedText>
            </View>
          ) : null}
        </View>

        <View style={[sectionStyle, { flexDirection: 'row', gap: 12 }]}>
          <TimeField label="Start Time *" value={startTime} onChange={setStartTime} isDark={isDark} />
          <TimeField label="End Time *" value={endTime} onChange={setEndTime} isDark={isDark} />
        </View>

        {overnight ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              padding: 12,
              borderRadius: 10,
              borderCurve: 'continuous',
              backgroundColor: isDark ? '#3d3a2e' : '#fff8e1',
            }}
          >
            <Icon sf="moon.fill" md="weather-night" size={18} color="#F7DC6F" />
            <ThemedText selectable style={{ fontSize: 14, flex: 1 }}>
              Overnight shifts - each will end the following day
            </ThemedText>
          </View>
        ) : null}

        <View style={sectionStyle}>
          <ThemedText style={{ fontSize: 14, fontWeight: '600', opacity: 0.8 }}>Notes</ThemedText>
          <TextInput
            style={{
              ...pickerButtonStyle,
              minHeight: 80,
              textAlignVertical: 'top',
              color: isDark ? '#fff' : '#000',
              fontSize: 16,
            }}
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional notes for these shifts"
            placeholderTextColor={isDark ? '#666' : '#999'}
            multiline
            numberOfLines={3}
          />
        </View>
      </ScrollView>
    </SheetScreen>
  );
}
