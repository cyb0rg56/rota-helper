import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { updateStaff } from '@/store/slices/staffSlice';
import { STAFF_COLORS } from '@/types';

export default function EditStaffScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const dispatch = useAppDispatch();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const staffMember = useAppSelector((state) =>
    state.staff.items.find((s) => s.id === id)
  );

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  useEffect(() => {
    if (staffMember) {
      setName(staffMember.name);
      setEmail(staffMember.email || '');
      setRole(staffMember.role || '');
      setSelectedColor(staffMember.color);
    }
  }, [staffMember]);

  if (!staffMember) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Staff member not found</ThemedText>
      </ThemedView>
    );
  }

  const handleSave = () => {
    if (!name.trim()) {
      return;
    }

    dispatch(
      updateStaff({
        id: staffMember.id,
        name: name.trim(),
        email: email.trim() || undefined,
        role: role.trim() || undefined,
        color: selectedColor,
      })
    );

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

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.field}>
            <ThemedText style={styles.label}>Name *</ThemedText>
            <TextInput
              style={inputStyle}
              value={name}
              onChangeText={setName}
              placeholder="Enter staff name"
              placeholderTextColor={isDark ? '#666' : '#999'}
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>Role</ThemedText>
            <TextInput
              style={inputStyle}
              value={role}
              onChangeText={setRole}
              placeholder="e.g., Manager, Supervisor"
              placeholderTextColor={isDark ? '#666' : '#999'}
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>Email</ThemedText>
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

          <View style={styles.field}>
            <ThemedText style={styles.label}>Color</ThemedText>
            <View style={styles.colorGrid}>
              {STAFF_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: name.trim() ? '#4ECDC4' : '#999' },
            ]}
            onPress={handleSave}
            disabled={!name.trim()}
          >
            <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
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
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
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
