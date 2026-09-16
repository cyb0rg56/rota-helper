import { addDays, format, parseISO } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { SheetScreen } from '@/components/header-actions';
import { Icon } from '@/components/icon';
import { SheetBodyTitle } from '@/components/sheet-body-title';
import { SegmentedShiftType } from '@/components/segmented-shift-type';
import { ThemedText } from '@/components/themed-text';
import { TimeField } from '@/components/time-field';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppDispatch, useAppSelector } from '@/store';
import { removeShift, updateShift } from '@/store/slices/shiftSlice';
import { ShiftType, Staff } from '@/types';
import { confirmAlert } from '@/utils/confirm';
import { isOvernight } from '@/utils/time';

export default function EditShiftScreen() {
  const isDark = useColorScheme() === 'dark';
  const dispatch = useAppDispatch();
  const { id } = useLocalSearchParams<{ id: string }>();

  const shift = useAppSelector((state) => state.shifts.items.find((item) => item.id === id));
  const staffList = useAppSelector((state) => state.staff.items);

  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(
    () => staffList.find((member) => member.id === shift?.staffId) ?? null
  );
  const [startTime, setStartTime] = useState(shift?.startTime ?? '09:00');
  const [endTime, setEndTime] = useState(shift?.endTime ?? '17:00');
  const [shiftType, setShiftType] = useState<ShiftType>(shift?.type ?? 'primary');
  const [notes, setNotes] = useState(shift?.notes ?? '');
  const [showStaffPicker, setShowStaffPicker] = useState(false);

  const overnight = useMemo(() => isOvernight(startTime, endTime), [startTime, endTime]);

  if (!shift) {
    return (
      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 20 }}
      >
        <ThemedText selectable>Shift not found</ThemedText>
      </ScrollView>
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
    confirmAlert('Delete Shift', 'Are you sure you want to delete this shift?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          dispatch(removeShift(shift.id));
          router.back();
        },
      },
    ]);
  };

  const pickerButtonStyle = {
    padding: 16,
    borderRadius: 12,
    borderCurve: 'continuous' as const,
    backgroundColor: isDark ? '#2d2d44' : '#f8f9fa',
  };

  return (
    <SheetScreen
      left={[{ key: 'cancel', label: 'Cancel', onPress: () => router.back() }]}
      right={[
        {
          key: 'delete',
          label: 'Delete Shift',
          sf: 'trash',
          md: 'trash-can-outline',
          destructive: true,
          onPress: handleDelete,
        },
        {
          key: 'save',
          label: 'Save',
          prominent: true,
          disabled: !selectedStaff,
          onPress: handleSave,
        },
      ]}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 20, gap: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <SheetBodyTitle title="Edit Shift" />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            padding: 16,
            borderRadius: 12,
            borderCurve: 'continuous',
            backgroundColor: isDark ? '#2d2d44' : '#e8f4f8',
          }}
        >
          <Icon sf="calendar" md="calendar" size={20} color="#4ECDC4" />
          <ThemedText selectable style={{ fontSize: 16, fontWeight: '600' }}>
            {format(shiftDate, 'EEEE, MMMM d, yyyy')}
          </ThemedText>
        </View>

        <View style={{ gap: 8 }}>
          <ThemedText style={{ fontSize: 14, fontWeight: '600', opacity: 0.8 }}>
            Staff Member *
          </ThemedText>
          <Pressable style={pickerButtonStyle} onPress={() => setShowStaffPicker((prev) => !prev)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              {selectedStaff ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: selectedStaff.color,
                    }}
                  />
                  <ThemedText style={{ fontSize: 16 }}>{selectedStaff.name}</ThemedText>
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
                  style={{
                    padding: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
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
                  <ThemedText>{member.name}</ThemedText>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', gap: 16 }}>
          <TimeField label="Start Time *" value={startTime} onChange={setStartTime} isDark={isDark} />
          <TimeField label="End Time *" value={endTime} onChange={setEndTime} isDark={isDark} />
        </View>

        <View style={{ gap: 8 }}>
          <ThemedText style={{ fontSize: 14, fontWeight: '600', opacity: 0.8 }}>
            Shift Type *
          </ThemedText>
          <SegmentedShiftType value={shiftType} onChange={setShiftType} isDark={isDark} />
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
              Overnight shift - ends {format(nextDay, 'EEE, MMM d')}
            </ThemedText>
          </View>
        ) : null}

        <View style={{ gap: 8 }}>
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
            placeholder="Optional notes for this shift"
            placeholderTextColor={isDark ? '#666' : '#999'}
            multiline
            numberOfLines={3}
          />
        </View>
      </ScrollView>
    </SheetScreen>
  );
}
