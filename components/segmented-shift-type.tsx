import SegmentedControl from '@react-native-segmented-control/segmented-control';

import { ShiftType } from '@/types';

export function SegmentedShiftType({
  value,
  onChange,
}: {
  value: ShiftType;
  onChange: (type: ShiftType) => void;
  isDark?: boolean;
}) {
  return (
    <SegmentedControl
      values={['Primary', 'Secondary']}
      selectedIndex={value === 'primary' ? 0 : 1}
      onChange={({ nativeEvent }) => {
        onChange(nativeEvent.selectedSegmentIndex === 0 ? 'primary' : 'secondary');
      }}
    />
  );
}
