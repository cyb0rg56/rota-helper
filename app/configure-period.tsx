import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { format, parseISO, addMonths, isValid, getDaysInMonth } from 'date-fns';
import { generateId } from '@/utils/id';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppDispatch, useAppSelector } from '@/store';
import { setPeriod, updatePeriod } from '@/store/slices/periodSlice';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Generate month options for the next 2 years
const generateMonthOptions = () => {
  const options: { label: string; value: string }[] = [];
  const today = new Date();
  
  for (let i = -6; i < 24; i++) {
    const date = addMonths(today, i);
    options.push({
      label: format(date, 'MMMM yyyy'),
      value: format(date, 'yyyy-MM-01'),
    });
  }
  
  return options;
};

const MONTH_OPTIONS = generateMonthOptions();

// Get the number of days in a month from a month value string (yyyy-MM-01)
const getDaysInMonthFromValue = (monthValue: string): number => {
  const date = parseISO(monthValue);
  return isValid(date) ? getDaysInMonth(date) : 31;
};

// Generate day options for a specific month
const generateDayOptions = (maxDays: number) => {
  return Array.from({ length: maxDays }, (_, i) => ({
    label: (i + 1).toString(),
    value: (i + 1).toString().padStart(2, '0'),
  }));
};

export default function ConfigurePeriodScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const dispatch = useAppDispatch();
  
  const existingPeriod = useAppSelector((state) => state.period.current);

  const [name, setName] = useState('');
  const [startMonth, setStartMonth] = useState(MONTH_OPTIONS[6].value);
  const [startDay, setStartDay] = useState('01');
  const [endMonth, setEndMonth] = useState(MONTH_OPTIONS[10].value);
  const [endDay, setEndDay] = useState('31');
  
  const [showStartMonthPicker, setShowStartMonthPicker] = useState(false);
  const [showStartDayPicker, setShowStartDayPicker] = useState(false);
  const [showEndMonthPicker, setShowEndMonthPicker] = useState(false);
  const [showEndDayPicker, setShowEndDayPicker] = useState(false);

  // Calculate max days for each month
  const startMonthDays = useMemo(() => getDaysInMonthFromValue(startMonth), [startMonth]);
  const endMonthDays = useMemo(() => getDaysInMonthFromValue(endMonth), [endMonth]);

  // Generate day options for each month
  const startDayOptions = useMemo(() => generateDayOptions(startMonthDays), [startMonthDays]);
  const endDayOptions = useMemo(() => generateDayOptions(endMonthDays), [endMonthDays]);

  // Adjust days when month changes
  useEffect(() => {
    const dayNum = parseInt(startDay, 10);
    if (dayNum > startMonthDays) {
      setStartDay(startMonthDays.toString().padStart(2, '0'));
    }
  }, [startMonth, startMonthDays, startDay]);

  useEffect(() => {
    const dayNum = parseInt(endDay, 10);
    if (dayNum > endMonthDays) {
      setEndDay(endMonthDays.toString().padStart(2, '0'));
    }
  }, [endMonth, endMonthDays, endDay]);

  useEffect(() => {
    if (existingPeriod) {
      setName(existingPeriod.name);
      const start = parseISO(existingPeriod.startDate);
      const end = parseISO(existingPeriod.endDate);
      
      if (isValid(start)) {
        setStartMonth(format(start, 'yyyy-MM-01'));
        setStartDay(format(start, 'dd'));
      }
      if (isValid(end)) {
        setEndMonth(format(end, 'yyyy-MM-01'));
        setEndDay(format(end, 'dd'));
      }
    }
  }, [existingPeriod]);

  const getStartDate = () => {
    const [year, month] = startMonth.split('-');
    const clampedDay = Math.min(parseInt(startDay, 10), startMonthDays).toString().padStart(2, '0');
    return `${year}-${month}-${clampedDay}`;
  };

  const getEndDate = () => {
    const [year, month] = endMonth.split('-');
    const clampedDay = Math.min(parseInt(endDay, 10), endMonthDays).toString().padStart(2, '0');
    return `${year}-${month}-${clampedDay}`;
  };

  // Safe date formatting for preview
  const formatDateSafe = (dateStr: string): string => {
    try {
      const date = parseISO(dateStr);
      return isValid(date) ? format(date, 'MMMM d, yyyy') : 'Invalid date';
    } catch {
      return 'Invalid date';
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      return;
    }

    const periodData = {
      id: existingPeriod?.id || generateId(),
      name: name.trim(),
      startDate: getStartDate(),
      endDate: getEndDate(),
      isActive: true,
    };

    if (existingPeriod) {
      dispatch(updatePeriod(periodData));
    } else {
      dispatch(setPeriod(periodData));
    }

    router.back();
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: isDark ? '#2d2d44' : '#f8f9fa',
      color: isDark ? '#fff' : '#000',
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

  const getMonthLabel = (value: string) => {
    const option = MONTH_OPTIONS.find((o) => o.value === value);
    return option?.label || value;
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.field}>
            <ThemedText style={styles.label}>Period Name *</ThemedText>
            <TextInput
              style={inputStyle}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Spring Semester 2026"
              placeholderTextColor={isDark ? '#666' : '#999'}
              autoFocus
            />
          </View>

          {/* Start Date */}
          <ThemedText style={styles.sectionLabel}>Start Date</ThemedText>
          <View style={styles.dateRow}>
            <View style={[styles.field, { flex: 2 }]}>
              <ThemedText style={styles.label}>Month</ThemedText>
              <TouchableOpacity
                style={inputStyle}
                onPress={() => {
                  setShowStartMonthPicker(!showStartMonthPicker);
                  setShowStartDayPicker(false);
                  setShowEndMonthPicker(false);
                  setShowEndDayPicker(false);
                }}
              >
                <View style={styles.pickerButton}>
                  <ThemedText style={styles.pickerText}>
                    {getMonthLabel(startMonth)}
                  </ThemedText>
                  <Ionicons
                    name={showStartMonthPicker ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={isDark ? '#666' : '#999'}
                  />
                </View>
              </TouchableOpacity>
              
              {showStartMonthPicker && (
                <ScrollView style={[pickerStyle, styles.monthPicker]} nestedScrollEnabled>
                  {MONTH_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.pickerOption,
                        startMonth === option.value && {
                          backgroundColor: isDark ? '#3a3a5a' : '#e8f4f8',
                        },
                      ]}
                      onPress={() => {
                        setStartMonth(option.value);
                        setShowStartMonthPicker(false);
                      }}
                    >
                      <ThemedText>{option.label}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            <View style={[styles.field, { flex: 1 }]}>
              <ThemedText style={styles.label}>Day</ThemedText>
              <TouchableOpacity
                style={inputStyle}
                onPress={() => {
                  setShowStartDayPicker(!showStartDayPicker);
                  setShowStartMonthPicker(false);
                  setShowEndMonthPicker(false);
                  setShowEndDayPicker(false);
                }}
              >
                <View style={styles.pickerButton}>
                  <ThemedText style={styles.pickerText}>{startDay}</ThemedText>
                  <Ionicons
                    name={showStartDayPicker ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={isDark ? '#666' : '#999'}
                  />
                </View>
              </TouchableOpacity>
              
              {showStartDayPicker && (
                <ScrollView style={[pickerStyle, styles.dayPicker]} nestedScrollEnabled>
                  {startDayOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.pickerOption,
                        startDay === option.value && {
                          backgroundColor: isDark ? '#3a3a5a' : '#e8f4f8',
                        },
                      ]}
                      onPress={() => {
                        setStartDay(option.value);
                        setShowStartDayPicker(false);
                      }}
                    >
                      <ThemedText>{option.label}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>

          {/* End Date */}
          <ThemedText style={styles.sectionLabel}>End Date</ThemedText>
          <View style={styles.dateRow}>
            <View style={[styles.field, { flex: 2 }]}>
              <ThemedText style={styles.label}>Month</ThemedText>
              <TouchableOpacity
                style={inputStyle}
                onPress={() => {
                  setShowEndMonthPicker(!showEndMonthPicker);
                  setShowStartMonthPicker(false);
                  setShowStartDayPicker(false);
                  setShowEndDayPicker(false);
                }}
              >
                <View style={styles.pickerButton}>
                  <ThemedText style={styles.pickerText}>
                    {getMonthLabel(endMonth)}
                  </ThemedText>
                  <Ionicons
                    name={showEndMonthPicker ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={isDark ? '#666' : '#999'}
                  />
                </View>
              </TouchableOpacity>
              
              {showEndMonthPicker && (
                <ScrollView style={[pickerStyle, styles.monthPicker]} nestedScrollEnabled>
                  {MONTH_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.pickerOption,
                        endMonth === option.value && {
                          backgroundColor: isDark ? '#3a3a5a' : '#e8f4f8',
                        },
                      ]}
                      onPress={() => {
                        setEndMonth(option.value);
                        setShowEndMonthPicker(false);
                      }}
                    >
                      <ThemedText>{option.label}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            <View style={[styles.field, { flex: 1 }]}>
              <ThemedText style={styles.label}>Day</ThemedText>
              <TouchableOpacity
                style={inputStyle}
                onPress={() => {
                  setShowEndDayPicker(!showEndDayPicker);
                  setShowStartMonthPicker(false);
                  setShowStartDayPicker(false);
                  setShowEndMonthPicker(false);
                }}
              >
                <View style={styles.pickerButton}>
                  <ThemedText style={styles.pickerText}>{endDay}</ThemedText>
                  <Ionicons
                    name={showEndDayPicker ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={isDark ? '#666' : '#999'}
                  />
                </View>
              </TouchableOpacity>
              
              {showEndDayPicker && (
                <ScrollView style={[pickerStyle, styles.dayPicker]} nestedScrollEnabled>
                  {endDayOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.pickerOption,
                        endDay === option.value && {
                          backgroundColor: isDark ? '#3a3a5a' : '#e8f4f8',
                        },
                      ]}
                      onPress={() => {
                        setEndDay(option.value);
                        setShowEndDayPicker(false);
                      }}
                    >
                      <ThemedText>{option.label}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>

          {/* Preview */}
          <View style={[styles.previewBox, { backgroundColor: isDark ? '#2d2d44' : '#e8f4f8' }]}>
            <ThemedText style={styles.previewLabel}>Period Preview</ThemedText>
            <ThemedText style={styles.previewText}>
              {name || 'Untitled Period'}
            </ThemedText>
            <ThemedText style={styles.previewDates}>
              {formatDateSafe(getStartDate())} - {formatDateSafe(getEndDate())}
            </ThemedText>
          </View>

          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: name.trim() ? '#4ECDC4' : '#999' },
            ]}
            onPress={handleSave}
            disabled={!name.trim()}
          >
            <ThemedText style={styles.saveButtonText}>
              {existingPeriod ? 'Update Period' : 'Create Period'}
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
    paddingBottom: 40,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.8,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 12,
  },
  input: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: {
    fontSize: 16,
  },
  picker: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  monthPicker: {
    maxHeight: 200,
  },
  dayPicker: {
    maxHeight: 150,
  },
  pickerOption: {
    padding: 14,
  },
  previewBox: {
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 8,
  },
  previewText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  previewDates: {
    fontSize: 14,
    opacity: 0.8,
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
});
