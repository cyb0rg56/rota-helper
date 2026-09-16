import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  View,
} from 'react-native';

import { Icon } from '@/components/icon';
import { ScreenContainer } from '@/components/screen-container';
import { SettingsRow } from '@/components/settings-row';
import { ThemedText } from '@/components/themed-text';
import { CALENDAR_NAME_KEY, DEFAULT_CALENDAR_NAME } from '@/constants/storage';
import { isWeb } from '@/constants/navigation';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppDispatch, useAppSelector } from '@/store';
import { clearAllShifts } from '@/store/slices/shiftSlice';
import {
  clearRotaFromCalendar,
  exportRotaToCalendar,
  showExportConfirmation,
} from '@/utils/calendar-export';
import { confirmAlert } from '@/utils/confirm';
import { blurActiveElement } from '@/utils/focus';

export default function SettingsScreen() {
  const isDark = useColorScheme() === 'dark';
  const dispatch = useAppDispatch();
  const staff = useAppSelector((state) => state.staff.items);
  const shifts = useAppSelector((state) => state.shifts.items);

  const [isExporting, setIsExporting] = useState(false);
  const [calendarName, setCalendarName] = useState(DEFAULT_CALENDAR_NAME);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void AsyncStorage.getItem(CALENDAR_NAME_KEY).then((saved) => {
        if (!cancelled && saved) {
          setCalendarName(saved);
        }
      });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const handleExportToCalendar = async () => {
    if (shifts.length === 0) {
      confirmAlert('No Shifts', 'There are no shifts to export.');
      return;
    }

    showExportConfirmation(async () => {
      setIsExporting(true);
      const result = await exportRotaToCalendar(shifts, staff, calendarName);
      setIsExporting(false);

      if (result.success) {
        const calendarUsed = result.calendarUsed || calendarName;
        let message = isWeb
          ? `Downloaded ${result.eventsCreated} shift${result.eventsCreated !== 1 ? 's' : ''} as a calendar file ("${calendarUsed}").`
          : `Successfully created ${result.eventsCreated} calendar event${result.eventsCreated !== 1 ? 's' : ''} in "${calendarUsed}".`;

        if (result.eventsSkipped > 0) {
          message += `\n\n${result.eventsSkipped} event${result.eventsSkipped !== 1 ? 's were' : ' was'} skipped (already exists in calendar).`;
        }

        if (calendarUsed !== calendarName) {
          message += `\n\nNote: Could not create "${calendarName}" calendar, so events were added to "${calendarUsed}" instead.`;
        }

        confirmAlert('Export Complete', message);
      } else {
        confirmAlert('Export Failed', result.error || 'Unknown error occurred.');
      }
    }, shifts.length);
  };

  const handleClearCalendar = () => {
    confirmAlert(
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
              confirmAlert(
                'Calendar Cleared',
                `Successfully deleted ${result.eventsDeleted} event${result.eventsDeleted !== 1 ? 's' : ''} from "${calendarName}".`
              );
            } else {
              confirmAlert('Clear Failed', result.error || 'Unknown error occurred.');
            }
          },
        },
      ]
    );
  };

  const handleClearShifts = () => {
    confirmAlert(
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

  const primaryCount = shifts.filter((shift) => shift.type === 'primary').length;
  const secondaryCount = shifts.filter((shift) => shift.type === 'secondary').length;
  const cardBackground = isDark ? '#2d2d44' : '#f8f9fa';

  return (
    <ScreenContainer>
    <ScrollView
      style={{ flex: 1 }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16, gap: 24, paddingBottom: 40 }}
    >
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {[
          { value: staff.length, label: 'Staff', sf: 'person.fill' as const, md: 'account' as const },
          { value: primaryCount, label: 'Primary', sf: 'person' as const, md: 'account-outline' as const },
          { value: secondaryCount, label: 'Secondary', sf: 'person.2.fill' as const, md: 'account-group' as const },
        ].map((stat) => (
          <View
            key={stat.label}
            style={{
              flex: 1,
              padding: 16,
              borderRadius: 12,
              borderCurve: 'continuous',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              backgroundColor: isDark ? '#2d2d44' : '#e8f4f8',
            }}
          >
            <ThemedText
              selectable
              style={{ fontSize: 32, fontWeight: 'bold', lineHeight: 36, fontVariant: ['tabular-nums'] }}
            >
              {stat.value}
            </ThemedText>
            <Icon sf={stat.sf} md={stat.md} size={20} color="#4ECDC4" />
            <ThemedText style={{ fontSize: 13, opacity: 0.7 }}>{stat.label}</ThemedText>
          </View>
        ))}
      </View>

      <View style={{ gap: 8 }}>
        <ThemedText
          style={{
            fontSize: 13,
            fontWeight: '600',
            textTransform: 'uppercase',
            opacity: 0.6,
            marginLeft: 4,
          }}
        >
          Calendar Management
        </ThemedText>
        <View
          style={{
            borderRadius: 12,
            borderCurve: 'continuous',
            overflow: 'hidden',
            backgroundColor: cardBackground,
          }}
        >
          <SettingsRow
            sf="calendar"
            md="calendar"
            iconColor="#4ECDC4"
            label="Calendar Name"
            value={calendarName}
            onPress={() => {
              blurActiveElement();
              router.push('/calendar-name');
            }}
          />
          <Pressable
            onPress={handleExportToCalendar}
            disabled={isExporting}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: 16,
              margin: 16,
              borderRadius: 12,
              borderCurve: 'continuous',
              backgroundColor: '#4ECDC4',
            }}
          >
            {isExporting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icon sf="calendar" md="calendar-export" size={24} color="#fff" />
                <ThemedText style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>
                  Export All Shifts
                </ThemedText>
              </>
            )}
          </Pressable>
          <ThemedText
            selectable
            style={{
              fontSize: 12,
              opacity: 0.6,
              textAlign: 'center',
              paddingHorizontal: 16,
              paddingBottom: 16,
            }}
          >
            {isWeb
              ? `Downloads an .ics file titled "${calendarName}".`
              : `Exports to "${calendarName}" calendar. Duplicates will be skipped.`}
          </ThemedText>
          {isWeb ? null : (
            <SettingsRow
              sf="trash"
              md="delete-outline"
              iconColor="#FF6B6B"
              label="Clear Calendar Events"
              onPress={handleClearCalendar}
              destructive
              showArrow={false}
            />
          )}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <ThemedText
          style={{
            fontSize: 13,
            fontWeight: '600',
            textTransform: 'uppercase',
            opacity: 0.6,
            marginLeft: 4,
          }}
        >
          Data Management
        </ThemedText>
        <View
          style={{
            borderRadius: 12,
            borderCurve: 'continuous',
            overflow: 'hidden',
            backgroundColor: cardBackground,
          }}
        >
          <SettingsRow
            sf="trash"
            md="delete-outline"
            iconColor="#FF6B6B"
            label="Clear All Shifts"
            onPress={handleClearShifts}
            destructive
            showArrow={false}
          />
        </View>
      </View>
    </ScrollView>
    </ScreenContainer>
  );
}
