import { Link, router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Staff } from '@/types';

export function StaffRow({
  staffMember,
  onDelete,
}: {
  staffMember: Staff;
  onDelete: () => void;
}) {
  const isDark = useColorScheme() === 'dark';

  return (
    <Link
      href={{ pathname: '/edit-staff', params: { id: staffMember.id } }}
      asChild
    >
      <Link.Trigger>
        <Pressable
          // Link.Menu is iOS-only, so Android needs its own delete gesture.
          onLongPress={process.env.EXPO_OS === 'ios' ? undefined : onDelete}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            borderRadius: 12,
            borderCurve: 'continuous',
            backgroundColor: isDark ? '#2d2d44' : '#f8f9fa',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            gap: 16,
          }}
        >
          <View
            style={{
              width: 8,
              minHeight: 50,
              alignSelf: 'stretch',
              borderRadius: 4,
              backgroundColor: staffMember.color,
            }}
          />
          <View style={{ flex: 1, gap: 2 }}>
            <ThemedText selectable style={{ fontSize: 18, fontWeight: '600' }}>
              {staffMember.name}
            </ThemedText>
            {staffMember.role ? (
              <ThemedText selectable style={{ fontSize: 14, opacity: 0.7 }}>
                {staffMember.role}
              </ThemedText>
            ) : null}
            {staffMember.email ? (
              <ThemedText selectable style={{ fontSize: 12, opacity: 0.5 }}>
                {staffMember.email}
              </ThemedText>
            ) : null}
          </View>
        </Pressable>
      </Link.Trigger>
      <Link.Preview />
      <Link.Menu>
        <Link.MenuAction
          icon="pencil"
          onPress={() =>
            router.push({ pathname: '/edit-staff', params: { id: staffMember.id } })
          }
        >
          Edit
        </Link.MenuAction>
        <Link.MenuAction icon="trash" destructive onPress={onDelete}>
          Delete
        </Link.MenuAction>
      </Link.Menu>
    </Link>
  );
}
