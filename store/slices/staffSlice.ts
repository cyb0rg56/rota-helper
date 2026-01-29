import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Staff, StaffState, STAFF_COLORS } from '@/types';

const initialState: StaffState = {
  items: [],
  loading: false,
  error: null,
};

const staffSlice = createSlice({
  name: 'staff',
  initialState,
  reducers: {
    setStaff: (state, action: PayloadAction<Staff[]>) => {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },
    addStaff: (state, action: PayloadAction<Staff>) => {
      state.items.push(action.payload);
    },
    updateStaff: (state, action: PayloadAction<Staff>) => {
      const index = state.items.findIndex((s) => s.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    removeStaff: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((s) => s.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setStaff, addStaff, updateStaff, removeStaff, setLoading, setError } =
  staffSlice.actions;

export default staffSlice.reducer;

// Helper function to get next available color
export const getNextStaffColor = (existingStaff: Staff[]): string => {
  const usedColors = new Set(existingStaff.map((s) => s.color));
  const availableColor = STAFF_COLORS.find((c) => !usedColors.has(c));
  return availableColor || STAFF_COLORS[existingStaff.length % STAFF_COLORS.length];
};
