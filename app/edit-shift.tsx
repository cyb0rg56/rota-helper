import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, addDays } from 'date-fns';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateShift, removeShift } from '@/store/slices/shiftSlice';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Staff, ShiftType } from '@/types';

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = (i % 2) * 30;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

export default function EditShiftScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const dispatch = useAppDispatch();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const shift = useAppSelector((state) =>
    state.shifts.items.find((s) => s.id === id)
  );
  const staffList = useAppSelector((state) => state.staff.items);

  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [shiftType, setShiftType] = useState<ShiftType>('primary');
  const [notes, setNotes] = useState('');
  const [showStaffPicker, setShowStaffPicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Check if this is an overnight shift
  const isOvernightShift = useMemo(() => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    return endH < startH || (endH === startH && endM < startM);
  }, [startTime, endTime]);

  useEffect(() => {
    if (shift) {
      const staff = staffList.find((s) => s.id === shift.staffId);
      setSelectedStaff(staff || null);
      setStartTime(shift.startTime);
      setEndTime(shift.endTime);
      setShiftType(shift.type);
      setNotes(shift.notes || '');
    }
  }, [shift, staffList]);

  if (!shift) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText>Shift not found</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const shiftDate = parseISO(shift.date);
  const nextDay = addDays(shiftDate, 1);

  const handleSave = () => {
    if (!selectedStaff) {
      return;
    }

    dispatch(
      updateShift({
        id: shift.id,
        staffId: selectedStaff.id,
        date: shift.date,
        startTime,
        endTime,
        type: shiftType,
        notes: notes.trim() || undefined,
      })
    );

    router.back();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Shift',
      'Are you sure you want to delete this shift?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            dispatch(removeShift(shift.id));
            router.back();
          },
        },
      ]
    );
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

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Date Display (read-only) */}
          <View style={[styles.dateDisplay, { backgroundColor: isDark ? '#2d2d44' : '#e8f4f8' }]}>
            <Ionicons name="calendar" size={20} color="#4ECDC4" />
            <ThemedText style={styles.dateText}>
              {format(shiftDate, 'EEEE, MMMM d, yyyy')}
            </ThemedText>
          </View>

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

          {/* Shift Type Selection */}
          <View style={styles.field}>
            <ThemedText style={styles.label}>Shift Type *</ThemedText>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  {
                    backgroundColor: shiftType === 'primary'
                      ? '#4ECDC4'
                      : isDark
                      ? '#2d2d44'
                      : '#f8f9fa',
                    borderColor: shiftType === 'primary'
                      ? '#4ECDC4'
                      : isDark
                      ? '#3a3a5a'
                      : '#e0e0e0',
                  },
                ]}
                onPress={() => setShiftType('primary')}
              >
                <ThemedText
                  style={[
                    styles.typeButtonText,
                    shiftType === 'primary' && { color: '#fff', fontWeight: '600' },
                  ]}
                >
                  Primary
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  {
                    backgroundColor: shiftType === 'secondary'
                      ? '#F7DC6F'
                      : isDark
                      ? '#2d2d44'
                      : '#f8f9fa',
                    borderColor: shiftType === 'secondary'
                      ? '#F7DC6F'
                      : isDark
                      ? '#3a3a5a'
                      : '#e0e0e0',
                  },
                ]}
                onPress={() => setShiftType('secondary')}
              >
                <ThemedText
                  style={[
                    styles.typeButtonText,
                    shiftType === 'secondary' && { color: '#000', fontWeight: '600' },
                  ]}
                >
                  Secondary
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Overnight Shift Indicator */}
          {isOvernightShift && (
            <View style={[styles.overnightBanner, { backgroundColor: isDark ? '#3d3a2e' : '#fff8e1' }]}>
              <Ionicons name="moon" size={18} color="#F7DC6F" />
              <ThemedText style={styles.overnightText}>
                Overnight shift - ends {format(nextDay, 'EEE, MMM d')}
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
              placeholder="Optional notes for this shift"
              placeholderTextColor={isDark ? '#666' : '#999'}
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: selectedStaff ? '#4ECDC4' : '#999' },
            ]}
            onPress={handleSave}
            disabled={!selectedStaff}
          >
            <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteButton, { borderColor: '#FF6B6B' }]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
            <ThemedText style={styles.deleteButtonText}>Delete Shift</ThemedText>
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
    paddingBottom: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
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
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
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
  typeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 16,
  },
});
