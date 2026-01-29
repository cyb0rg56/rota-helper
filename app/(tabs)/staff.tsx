import React from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppSelector, useAppDispatch } from '@/store';
import { removeStaff } from '@/store/slices/staffSlice';
import { removeShiftsByStaff } from '@/store/slices/shiftSlice';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Staff } from '@/types';

export default function StaffScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const dispatch = useAppDispatch();
  const staff = useAppSelector((state) => state.staff.items);

  const handleAddStaff = () => {
    router.push('/add-staff');
  };

  const handleEditStaff = (staffMember: Staff) => {
    router.push({
      pathname: '/edit-staff',
      params: { id: staffMember.id },
    });
  };

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

  const renderStaffItem = ({ item }: { item: Staff }) => (
    <Pressable
      style={[
        styles.staffCard,
        { backgroundColor: isDark ? '#2d2d44' : '#f8f9fa' },
      ]}
      onPress={() => handleEditStaff(item)}
    >
      <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
      <View style={styles.staffInfo}>
        <ThemedText style={styles.staffName}>{item.name}</ThemedText>
        {item.role && (
          <ThemedText style={styles.staffRole}>{item.role}</ThemedText>
        )}
        {item.email && (
          <ThemedText style={styles.staffEmail}>{item.email}</ThemedText>
        )}
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteStaff(item)}
      >
        <Ionicons name="trash-outline" size={22} color="#FF6B6B" />
      </TouchableOpacity>
    </Pressable>
  );

  const EmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="people-outline"
        size={80}
        color={isDark ? '#4a4a6a' : '#ccc'}
      />
      <ThemedText style={styles.emptyText}>No staff members yet</ThemedText>
      <ThemedText style={[styles.emptySubtext, { color: isDark ? '#888' : '#666' }]}>
        Tap the + button to add your first staff member
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={staff}
        keyExtractor={(item) => item.id}
        renderItem={renderStaffItem}
        contentContainerStyle={[
          styles.listContent,
          staff.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={EmptyList}
      />
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: '#4ECDC4' }]}
        onPress={handleAddStaff}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  colorIndicator: {
    width: 8,
    height: '100%',
    minHeight: 50,
    borderRadius: 4,
    marginRight: 16,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  staffRole: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 2,
  },
  staffEmail: {
    fontSize: 12,
    opacity: 0.5,
  },
  deleteButton: {
    padding: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});
