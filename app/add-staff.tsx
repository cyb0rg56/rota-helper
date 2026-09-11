import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { SheetScreen } from '@/components/header-actions';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppDispatch, useAppSelector } from '@/store';
import { addStaff, getNextStaffColor } from '@/store/slices/staffSlice';
import { STAFF_COLORS } from '@/types';
import { generateId } from '@/utils/id';

export default function AddStaffScreen() {
  const isDark = useColorScheme() === 'dark';
  const dispatch = useAppDispatch();
  const existingStaff = useAppSelector((state) => state.staff.items);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [selectedColor, setSelectedColor] = useState(getNextStaffColor(existingStaff));

  const handleSave = () => {
    if (!name.trim()) {
      return;
    }

    dispatch(
      addStaff({
        id: generateId(),
        name: name.trim(),
        email: email.trim() || undefined,
        role: role.trim() || undefined,
        color: selectedColor,
      })
    );

    router.back();
  };

  const inputStyle = {
    padding: 16,
    borderRadius: 12,
    borderCurve: 'continuous' as const,
    fontSize: 16,
    backgroundColor: isDark ? '#2d2d44' : '#f8f9fa',
    color: isDark ? '#fff' : '#000',
  };

  return (
    <SheetScreen
      left={[{ key: 'cancel', label: 'Cancel', onPress: () => router.back() }]}
      right={[
        {
          key: 'save',
          label: 'Save',
          prominent: true,
          disabled: !name.trim(),
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
        <View style={{ gap: 8 }}>
          <ThemedText style={{ fontSize: 14, fontWeight: '600', opacity: 0.8 }}>Name *</ThemedText>
          <TextInput
            style={inputStyle}
            value={name}
            onChangeText={setName}
            placeholder="Enter staff name"
            placeholderTextColor={isDark ? '#666' : '#999'}
            autoFocus
          />
        </View>

        <View style={{ gap: 8 }}>
          <ThemedText style={{ fontSize: 14, fontWeight: '600', opacity: 0.8 }}>Role</ThemedText>
          <TextInput
            style={inputStyle}
            value={role}
            onChangeText={setRole}
            placeholder="e.g., Manager, Supervisor"
            placeholderTextColor={isDark ? '#666' : '#999'}
          />
        </View>

        <View style={{ gap: 8 }}>
          <ThemedText style={{ fontSize: 14, fontWeight: '600', opacity: 0.8 }}>Email</ThemedText>
          <TextInput
            style={inputStyle}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter email address"
            placeholderTextColor={isDark ? '#666' : '#999'}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={{ gap: 8 }}>
          <ThemedText style={{ fontSize: 14, fontWeight: '600', opacity: 0.8 }}>Color</ThemedText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {STAFF_COLORS.map((color) => (
              <Pressable
                key={color}
                onPress={() => setSelectedColor(color)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: color,
                  borderWidth: selectedColor === color ? 3 : 0,
                  borderColor: '#fff',
                }}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SheetScreen>
  );
}
