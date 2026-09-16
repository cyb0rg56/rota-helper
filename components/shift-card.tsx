import { format, isToday } from 'date-fns';
import { Link, router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Shift, Staff } from '@/types';
import { blurActiveElement } from '@/utils/focus';
import { isOvernight } from '@/utils/time';

export function ShiftCard({
  shift,
  day,
  staffMember,
  onDelete,
}: {
  shift: Shift;
  day: Date;
  staffMember: Staff;
  onDelete: () => void;
}) {
  const isDark = useColorScheme() === 'dark';
  const isPrimary = shift.type === 'primary';
  const overnight = isOvernight(shift.startTime, shift.endTime);
  const isCurrentDay = isToday(day);

  return (
    <Link
      href={{ pathname: '/edit-shift', params: { id: shift.id } }}
      asChild
      onPress={blurActiveElement}
    >
      <Link.Trigger>
        <Pressable
          // Link.Menu is iOS-only, so Android needs its own delete gesture.
          onLongPress={process.env.EXPO_OS === 'ios' ? undefined : onDelete}
          style={{
            backgroundColor: isDark ? '#2d2d44' : '#fff',
            borderLeftWidth: 4,
            borderLeftColor: staffMember.color,
            borderRadius: 12,
            borderCurve: 'continuous',
            padding: 16,
            gap: 12,
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            position: 'relative',
          }}
        >
          {overnight ? (
            <View
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
                backgroundColor: '#4a4a6a',
                zIndex: 1,
              }}
            >
              <Icon sf="moon.fill" md="weather-night" size={14} color="#F7DC6F" />
            </View>
          ) : null}

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                borderCurve: 'continuous',
                alignItems: 'center',
                minWidth: 50,
                backgroundColor: isCurrentDay ? '#4ECDC4' : isDark ? '#3a3a5a' : '#f0f0f0',
              }}
            >
              <ThemedText
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  color: isCurrentDay ? '#fff' : isDark ? '#fff' : '#333',
                }}
              >
                {format(day, 'EEE')}
              </ThemedText>
              <ThemedText
                selectable
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  fontVariant: ['tabular-nums'],
                  color: isCurrentDay ? '#fff' : isDark ? '#aaa' : '#666',
                }}
              >
                {format(day, 'd')}
              </ThemedText>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                flex: 1,
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <ThemedText
                selectable
                style={{ fontSize: 20, fontWeight: '600', fontVariant: ['tabular-nums'] }}
              >
                {shift.startTime}
              </ThemedText>
              <ThemedText style={{ fontSize: 20, color: isDark ? '#666' : '#999' }}>
                -
              </ThemedText>
              <ThemedText
                selectable
                style={{ fontSize: 20, fontWeight: '600', fontVariant: ['tabular-nums'] }}
              >
                {shift.endTime}
              </ThemedText>
            </View>
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <ThemedText selectable style={{ fontSize: 16, fontWeight: '600', flex: 1 }}>
              {staffMember.name}
            </ThemedText>
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
                marginLeft: 8,
                backgroundColor: isPrimary ? '#4ECDC4' : '#F7DC6F',
              }}
            >
              <ThemedText
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: isPrimary ? '#fff' : '#333',
                }}
              >
                {isPrimary ? 'Primary' : 'Secondary'}
              </ThemedText>
            </View>
          </View>
        </Pressable>
      </Link.Trigger>
      <Link.Preview />
      <Link.Menu>
        <Link.MenuAction
          icon="pencil"
          onPress={() => {
            blurActiveElement();
            router.push({ pathname: '/edit-shift', params: { id: shift.id } });
          }}
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
