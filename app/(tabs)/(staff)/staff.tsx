import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, FlatList, TextInput, View } from 'react-native';

import { HeaderActions } from '@/components/header-actions';
import { Icon } from '@/components/icon';
import { StaffRow } from '@/components/staff-row';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppDispatch, useAppSelector } from '@/store';
import { removeShiftsByStaff } from '@/store/slices/shiftSlice';
import { removeStaff } from '@/store/slices/staffSlice';
import { Staff } from '@/types';

export default function StaffScreen() {
  const isDark = useColorScheme() === 'dark';
  const dispatch = useAppDispatch();
  const staff = useAppSelector((state) => state.staff.items);
  const [query, setQuery] = useState('');

  const filteredStaff = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return staff;
    }
    return staff.filter(
      (member) =>
        member.name.toLowerCase().includes(normalized) ||
        member.role?.toLowerCase().includes(normalized) ||
        member.email?.toLowerCase().includes(normalized)
    );
  }, [staff, query]);

  const handleDeleteStaff = (staffMember: Staff) => {
    Alert.alert(
      'Delete Staff Member',
      `Are you sure you want to delete ${staffMember.name}? This will also remove all their shifts.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            dispatch(removeShiftsByStaff(staffMember.id));
            dispatch(removeStaff(staffMember.id));
          },
        },
      ]
    );
  };

  return (
    <>
      <FlatList
        data={filteredStaff}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 24,
          gap: 12,
          paddingTop: 12,
          flexGrow: 1,
        }}
        renderItem={({ item }) => (
          <StaffRow staffMember={item} onDelete={() => handleDeleteStaff(item)} />
        )}
        ListHeaderComponent={
          process.env.EXPO_OS === 'ios' ? null : (
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search staff"
              placeholderTextColor={isDark ? '#666' : '#999'}
              style={{
                padding: 14,
                borderRadius: 12,
                borderCurve: 'continuous',
                fontSize: 16,
                backgroundColor: isDark ? '#2d2d44' : '#f0f0f0',
                color: isDark ? '#fff' : '#000',
                marginBottom: 4,
              }}
            />
          )
        }
        ListEmptyComponent={
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
            <Icon
              sf="person.2"
              md="account-group-outline"
              size={80}
              color={isDark ? '#4a4a6a' : '#ccc'}
            />
            <ThemedText style={{ fontSize: 20, fontWeight: '600', marginTop: 12 }}>
              {staff.length === 0 ? 'No staff members yet' : 'No matching staff'}
            </ThemedText>
            <ThemedText
              selectable
              style={{ fontSize: 14, textAlign: 'center', color: isDark ? '#888' : '#666' }}
            >
              {staff.length === 0 ? 'Tap + to add your first staff member' : 'Try a different search'}
            </ThemedText>
          </View>
        }
      />
      {process.env.EXPO_OS === 'ios' ? (
        <Stack.SearchBar
          placeholder="Search staff"
          onChangeText={(event) => setQuery(event.nativeEvent.text)}
        />
      ) : null}
      <HeaderActions
        placement="right"
        actions={[
          {
            key: 'add',
            label: 'Add Staff',
            sf: 'plus',
            md: 'plus',
            onPress: () => router.push('/add-staff'),
          },
        ]}
      />
    </>
  );
}
