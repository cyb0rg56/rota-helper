import { generateId } from '@/utils/id';
import { Ionicons } from '@expo/vector-icons';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  format,
  getDay,
  isSameDay,
  isToday,
  startOfMonth,
  subMonths
} from 'date-fns';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppDispatch, useAppSelector } from '@/store';
import { addShift } from '@/store/slices/shiftSlice';
import { ShiftType, Staff } from '@/types';

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = (i % 2) * 30;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

interface SelectedDate {
  date: Date;
  type: ShiftType;
}

export default function AddShiftsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
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
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Get calendar days for current month
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const startDay = getDay(monthStart);
    
    // Adjust for Monday start (getDay returns 0=Sunday)
    const daysToShow = (startDay === 0 ? 6 : startDay - 1);
    const calendarStart = addDays(monthStart, -daysToShow);
    
    // Show 6 weeks to cover all possibilities
    const calendarEnd = addDays(calendarStart, 41);
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Check if this is an overnight shift
  const isOvernightShift = useMemo(() => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    return endH < startH || (endH === startH && endM < startM);
  }, [startTime, endTime]);

  const toggleDateSelection = (date: Date, type: ShiftType) => {
    setSelectedDates((prev) => {
      const existingIndex = prev.findIndex((d) => isSameDay(d.date, date));
      
      if (existingIndex !== -1) {
        const existing = prev[existingIndex];
        // If same type, remove it. If different type, update it
        if (existing.type === type) {
          return prev.filter((_, i) => i !== existingIndex);
        } else {
          const updated = [...prev];
          updated[existingIndex] = { date, type };
          return updated;
        }
      } else {
        return [...prev, { date, type }].sort((a, b) => a.date.getTime() - b.date.getTime());
      }
    });
  };

  const getDateSelection = (date: Date): SelectedDate | undefined => {
    return selectedDates.find((d) => isSameDay(d.date, date));
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) =>
      direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1)
    );
  };

  const handleSave = () => {
    if (!selectedStaff || selectedDates.length === 0) {
      return;
    }

    // Create a shift for each selected date
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

  const inputStyle = [
    styles.input,
    {
      backgroundColor: isDark ? '#2d2d44' : '#f8f9fa',
      borderColor: isDark ? '#3a3a5a' : '#e0e0e0',
    },
  ];

  const pickerStyle = [
    styles.picker,
    {
      backgroundColor: isDark ? '#1a1a2e' : '#fff',
      borderColor: isDark ? '#3a3a5a' : '#e0e0e0',
    },
  ];

  const primaryCount = selectedDates.filter(d => d.type === 'primary').length;
  const secondaryCount = selectedDates.filter(d => d.type === 'secondary').length;

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Staff Selection */}
          <View style={styles.field}>
            <ThemedText style={styles.label}>Staff Member *</ThemedText>
            <TouchableOpacity
              style={inputStyle}
              onPress={() => setShowStaffPicker(!showStaffPicker)}
            >
              <View style={styles.pickerButton}>
                {selectedStaff ? (
                  <View style={styles.selectedStaff}>
                    <View
                      style={[styles.staffColor, { backgroundColor: selectedStaff.color }]}
                    />
                    <ThemedText style={styles.pickerText}>{selectedStaff.name}</ThemedText>
                  </View>
                ) : (
                  <ThemedText style={styles.placeholderText}>Select staff member</ThemedText>
                )}
                <Ionicons
                  name={showStaffPicker ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={isDark ? '#666' : '#999'}
                />
              </View>
            </TouchableOpacity>
            
            {showStaffPicker && (
              <View style={pickerStyle}>
                {staffList.map((staff) => (
                  <TouchableOpacity
                    key={staff.id}
                    style={[
                      styles.pickerOption,
                      selectedStaff?.id === staff.id && {
                        backgroundColor: isDark ? '#3a3a5a' : '#e8f4f8',
                      },
                    ]}
                    onPress={() => {
                      setSelectedStaff(staff);
                      setShowStaffPicker(false);
                    }}
                  >
                    <View style={[styles.staffColor, { backgroundColor: staff.color }]} />
                    <ThemedText>{staff.name}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Calendar Selection */}
          <View style={styles.field}>
            <ThemedText style={styles.label}>Select Dates *</ThemedText>
            <ThemedText style={[styles.helpText, { color: isDark ? '#888' : '#666' }]}>
              Press = Primary • Long press = Secondary
            </ThemedText>
            
            {/* Month Navigator */}
            <View style={[styles.monthNavigator, { backgroundColor: isDark ? '#2d2d44' : '#f0f0f0' }]}>
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => navigateMonth('prev')}
              >
                <Ionicons name="chevron-back" size={24} color={isDark ? '#fff' : '#333'} />
              </TouchableOpacity>
              
              <View style={styles.monthLabel}>
                <ThemedText style={styles.monthText}>
                  {format(currentMonth, 'MMMM yyyy')}
                </ThemedText>
              </View>
              
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => navigateMonth('next')}
              >
                <Ionicons name="chevron-forward" size={24} color={isDark ? '#fff' : '#333'} />
              </TouchableOpacity>
            </View>

            {/* Weekday Headers */}
            <View style={styles.weekdayRow}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <View key={day} style={styles.weekdayCell}>
                  <ThemedText style={styles.weekdayText}>{day}</ThemedText>
                </View>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {calendarDays.map((day, index) => {
                const selection = getDateSelection(day);
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                const isCurrentDay = isToday(day);
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayCell,
                      {
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
                        opacity: isCurrentMonth ? 1 : 0.3,
                      },
                    ]}
                    onPress={() => toggleDateSelection(day, 'primary')}
                    onLongPress={() => toggleDateSelection(day, 'secondary')}
                    delayLongPress={500}
                    activeOpacity={0.7}
                  >
                    <ThemedText
                      style={[
                        styles.dayNumber,
                        selection && { color: '#fff', fontWeight: '600' },
                      ]}
                    >
                      {format(day, 'd')}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedDates.length > 0 && (
              <View style={[styles.selectionSummary, { backgroundColor: isDark ? '#2d2d44' : '#e8f4f8' }]}>
                <ThemedText style={styles.summaryText}>
                  {primaryCount > 0 && `${primaryCount} Primary`}
                  {primaryCount > 0 && secondaryCount > 0 && ' • '}
                  {secondaryCount > 0 && `${secondaryCount} Secondary`}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Time Selection */}
          <View style={styles.timeRow}>
            <View style={[styles.field, { flex: 1 }]}>
              <ThemedText style={styles.label}>Start Time *</ThemedText>
              <TouchableOpacity
                style={inputStyle}
                onPress={() => {
                  setShowStartTimePicker(!showStartTimePicker);
                  setShowEndTimePicker(false);
                }}
              >
                <View style={styles.pickerButton}>
                  <ThemedText style={styles.pickerText}>{startTime}</ThemedText>
                  <Ionicons
                    name={showStartTimePicker ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={isDark ? '#666' : '#999'}
                  />
                </View>
              </TouchableOpacity>
              
              {showStartTimePicker && (
                <ScrollView style={[pickerStyle, styles.timePicker]} nestedScrollEnabled>
                  {TIME_OPTIONS.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.pickerOption,
                        startTime === time && {
                          backgroundColor: isDark ? '#3a3a5a' : '#e8f4f8',
                        },
                      ]}
                      onPress={() => {
                        setStartTime(time);
                        setShowStartTimePicker(false);
                      }}
                    >
                      <ThemedText>{time}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            <View style={[styles.field, { flex: 1 }]}>
              <ThemedText style={styles.label}>End Time *</ThemedText>
              <TouchableOpacity
                style={inputStyle}
                onPress={() => {
                  setShowEndTimePicker(!showEndTimePicker);
                  setShowStartTimePicker(false);
                }}
              >
                <View style={styles.pickerButton}>
                  <ThemedText style={styles.pickerText}>{endTime}</ThemedText>
                  <Ionicons
                    name={showEndTimePicker ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={isDark ? '#666' : '#999'}
                  />
                </View>
              </TouchableOpacity>
              
              {showEndTimePicker && (
                <ScrollView style={[pickerStyle, styles.timePicker]} nestedScrollEnabled>
                  {TIME_OPTIONS.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.pickerOption,
                        endTime === time && {
                          backgroundColor: isDark ? '#3a3a5a' : '#e8f4f8',
                        },
                      ]}
                      onPress={() => {
                        setEndTime(time);
                        setShowEndTimePicker(false);
                      }}
                    >
                      <ThemedText>{time}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>

          {/* Overnight Shift Indicator */}
          {isOvernightShift && (
            <View style={[styles.overnightBanner, { backgroundColor: isDark ? '#3d3a2e' : '#fff8e1' }]}>
              <Ionicons name="moon" size={18} color="#F7DC6F" />
              <ThemedText style={styles.overnightText}>
                Overnight shifts - each will end the following day
              </ThemedText>
            </View>
          )}

          {/* Notes */}
          <View style={styles.field}>
            <ThemedText style={styles.label}>Notes</ThemedText>
            <TextInput
              style={[
                inputStyle,
                styles.notesInput,
                { color: isDark ? '#fff' : '#000' },
              ]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional notes for these shifts"
              placeholderTextColor={isDark ? '#666' : '#999'}
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.saveButton,
              {
                backgroundColor:
                  selectedStaff && selectedDates.length > 0 ? '#4ECDC4' : '#999',
              },
            ]}
            onPress={handleSave}
            disabled={!selectedStaff || selectedDates.length === 0}
          >
            <ThemedText style={styles.saveButtonText}>
              Create {selectedDates.length > 0 ? selectedDates.length : ''} Shift
              {selectedDates.length !== 1 ? 's' : ''}
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 50,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.8,
  },
  helpText: {
    fontSize: 12,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  input: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: {
    fontSize: 16,
  },
  placeholderText: {
    fontSize: 16,
    opacity: 0.5,
  },
  selectedStaff: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  staffColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  picker: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  timePicker: {
    maxHeight: 200,
  },
  pickerOption: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  monthNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  navButton: {
    padding: 12,
  },
  monthLabel: {
    flex: 1,
    alignItems: 'center',
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.6,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayCell: {
    width: '13.7%',
    aspectRatio: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 14,
  },
  selectionSummary: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 16,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  overnightBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  overnightText: {
    fontSize: 14,
    flex: 1,
  },
});
