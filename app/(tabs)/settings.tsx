import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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
import { clearAllShifts } from '@/store/slices/shiftSlice';
import { clearRotaFromCalendar, exportRotaToCalendar, showExportConfirmation } from '@/utils/calendar-export';

const CALENDAR_NAME_KEY = '@rota_calendar_name';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const dispatch = useAppDispatch();
  
  const staff = useAppSelector((state) => state.staff.items);
  const shifts = useAppSelector((state) => state.shifts.items);
  
  const [isExporting, setIsExporting] = useState(false);
  const [calendarName, setCalendarName] = useState('Rota Helper');
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [tempCalendarName, setTempCalendarName] = useState('Rota Helper');

  // Load calendar name on mount
  useEffect(() => {
    loadCalendarName();
  }, []);

  const loadCalendarName = async () => {
    try {
      const saved = await AsyncStorage.getItem(CALENDAR_NAME_KEY);
      if (saved) {
        setCalendarName(saved);
        setTempCalendarName(saved);
      }
    } catch (error) {
      console.error('Failed to load calendar name:', error);
    }
  };

  const saveCalendarName = async (name: string) => {
    try {
      await AsyncStorage.setItem(CALENDAR_NAME_KEY, name);
      setCalendarName(name);
      setShowCalendarModal(false);
    } catch (error) {
      console.error('Failed to save calendar name:', error);
      Alert.alert('Error', 'Failed to save calendar name');
    }
  };

  const handleExportToCalendar = async () => {
    if (shifts.length === 0) {
      Alert.alert('No Shifts', 'There are no shifts to export.');
      return;
    }

    showExportConfirmation(
      async () => {
        setIsExporting(true);
        const result = await exportRotaToCalendar(shifts, staff, calendarName);
        setIsExporting(false);

        if (result.success) {
          const calendarUsed = result.calendarUsed || calendarName;
          let message = `Successfully created ${result.eventsCreated} calendar event${result.eventsCreated !== 1 ? 's' : ''} in "${calendarUsed}".`;
          
          if (result.eventsSkipped > 0) {
            message += `\n\n${result.eventsSkipped} event${result.eventsSkipped !== 1 ? 's were' : ' was'} skipped (already exists in calendar).`;
          }
          
          // Show a note if we fell back to a different calendar
          if (calendarUsed !== calendarName) {
            message += `\n\nNote: Could not create "${calendarName}" calendar, so events were added to "${calendarUsed}" instead.`;
          }
          
          Alert.alert('Export Complete', message);
        } else {
          Alert.alert('Export Failed', result.error || 'Unknown error occurred.');
        }
      },
      shifts.length
    );
  };

  const handleClearCalendar = async () => {
    Alert.alert(
      'Clear Calendar Events',
      `This will delete all Rota Helper events from the "${calendarName}" calendar. This action cannot be undone.\n\nContinue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Calendar',
          style: 'destructive',
          onPress: async () => {
            setIsExporting(true);
            const result = await clearRotaFromCalendar(calendarName);
            setIsExporting(false);

            if (result.success) {
              Alert.alert(
                'Calendar Cleared',
                `Successfully deleted ${result.eventsDeleted} event${result.eventsDeleted !== 1 ? 's' : ''} from "${calendarName}".`
              );
            } else {
              Alert.alert('Clear Failed', result.error || 'Unknown error occurred.');
            }
          },
        },
      ]
    );
  };

  const handleClearShifts = () => {
    Alert.alert(
      'Clear All Shifts',
      'Are you sure you want to delete all shifts? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => dispatch(clearAllShifts()),
        },
      ]
    );
  };

  const SettingsSection = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      <View style={[styles.sectionContent, { backgroundColor: isDark ? '#2d2d44' : '#f8f9fa' }]}>
        {children}
      </View>
    </View>
  );

  const SettingsRow = ({
    icon,
    iconColor,
    label,
    value,
    onPress,
    showArrow = true,
    destructive = false,
  }: {
    icon: string;
    iconColor?: string;
    label: string;
    value?: string;
    onPress: () => void;
    showArrow?: boolean;
    destructive?: boolean;
  }) => (
    <TouchableOpacity style={styles.settingsRow} onPress={onPress}>
      <View style={styles.rowLeft}>
        <Ionicons
          name={icon as any}
          size={22}
          color={iconColor || (isDark ? '#fff' : '#333')}
        />
        <ThemedText
          style={[styles.rowLabel, destructive && { color: '#FF6B6B' }]}
        >
          {label}
        </ThemedText>
      </View>
      <View style={styles.rowRight}>
        {value && (
          <ThemedText style={styles.rowValue}>{value}</ThemedText>
        )}
        {showArrow && (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={isDark ? '#666' : '#999'}
          />
        )}
      </View>
    </TouchableOpacity>
  );

  const primaryCount = shifts.filter(s => s.type === 'primary').length;
  const secondaryCount = shifts.filter(s => s.type === 'secondary').length;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: isDark ? '#2d2d44' : '#e8f4f8' }]}>
            <ThemedText style={styles.statNumber}>{staff.length}</ThemedText>
            <Ionicons name="man" size={20} color="#4ECDC4" style={styles.statIcon} />
            <ThemedText style={styles.statLabel}>Staff</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: isDark ? '#2d2d44' : '#e8f4f8' }]}>
            <ThemedText style={styles.statNumber}>{primaryCount}</ThemedText>
            <Ionicons name="person" size={20} color="#4ECDC4" style={styles.statIcon} />
            <ThemedText style={styles.statLabel}>Primary</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: isDark ? '#2d2d44' : '#fff8e1' }]}>
            <ThemedText style={styles.statNumber}>{secondaryCount}</ThemedText>
            <Ionicons name="people" size={20} color="#4ECDC4" style={styles.statIcon} />
            <ThemedText style={styles.statLabel}>Secondary</ThemedText>
          </View>
        </View>

        {/* Export */}
        <SettingsSection title="Calendar Management">
          <SettingsRow
            icon="calendar"
            iconColor="#4ECDC4"
            label="Calendar Name"
            value={calendarName}
            onPress={() => {
              setTempCalendarName(calendarName);
              setShowCalendarModal(true);
            }}
          />
          <TouchableOpacity
            style={[styles.exportButton, { backgroundColor: '#4ECDC4' }]}
            onPress={handleExportToCalendar}
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="calendar-outline" size={24} color="#fff" />
                <ThemedText style={styles.exportButtonText}>
                  Export All Shifts
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
          <ThemedText style={styles.exportHint}>
            Exports to "{calendarName}" calendar. Duplicates will be skipped.
          </ThemedText>
          <SettingsRow
            icon="trash-outline"
            iconColor="#FF6B6B"
            label="Clear Calendar Events"
            onPress={handleClearCalendar}
            destructive
            showArrow={false}
          />
        </SettingsSection>

        {/* Data Management */}
        <SettingsSection title="Data Management">
          <SettingsRow
            icon="trash-outline"
            iconColor="#FF6B6B"
            label="Clear All Shifts"
            onPress={handleClearShifts}
            destructive
            showArrow={false}
          />
        </SettingsSection>
      </ScrollView>

      {/* Calendar Name Modal */}
      <Modal
        visible={showCalendarModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1a1a2e' : '#fff' }]}>
            <ThemedText style={styles.modalTitle}>Calendar Name</ThemedText>
            <ThemedText style={styles.modalSubtitle}>
              Events will be created in this calendar
            </ThemedText>
            
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: isDark ? '#2d2d44' : '#f8f9fa',
                  color: isDark ? '#fff' : '#000',
                  borderColor: isDark ? '#3a3a5a' : '#e0e0e0',
                },
              ]}
              value={tempCalendarName}
              onChangeText={setTempCalendarName}
              placeholder="Enter calendar name"
              placeholderTextColor={isDark ? '#666' : '#999'}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: isDark ? '#2d2d44' : '#f0f0f0' }]}
                onPress={() => setShowCalendarModal(false)}
              >
                <ThemedText>Cancel</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#4ECDC4' }]}
                onPress={() => {
                  if (tempCalendarName.trim()) {
                    saveCalendarName(tempCalendarName.trim());
                  }
                }}
                disabled={!tempCalendarName.trim()}
              >
                <ThemedText style={{ color: '#fff', fontWeight: '600' }}>
                  Save
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 36,
  },
  statIcon: {
    marginVertical: 6,
  },
  statLabel: {
    fontSize: 13,
    opacity: 0.7,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    opacity: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowLabel: {
    fontSize: 16,
  },
  rowValue: {
    fontSize: 14,
    opacity: 0.6,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  exportHint: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 20,
  },
  modalInput: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
});
