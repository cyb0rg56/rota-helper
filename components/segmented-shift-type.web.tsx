import { ShiftTypeToggle } from '@/components/shift-type-toggle';
import { ShiftType } from '@/types';

export function SegmentedShiftType({
  value,
  onChange,
  isDark = false,
}: {
  value: ShiftType;
  onChange: (type: ShiftType) => void;
  isDark?: boolean;
}) {
  return <ShiftTypeToggle value={value} onChange={onChange} isDark={isDark} />;
}
