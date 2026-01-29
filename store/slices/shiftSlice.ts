import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Shift, ShiftState } from '@/types';

const initialState: ShiftState = {
  items: [],
  loading: false,
  error: null,
};

const shiftSlice = createSlice({
  name: 'shifts',
  initialState,
  reducers: {
    setShifts: (state, action: PayloadAction<Shift[]>) => {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },
    addShift: (state, action: PayloadAction<Shift>) => {
      state.items.push(action.payload);
    },
    updateShift: (state, action: PayloadAction<Shift>) => {
      const index = state.items.findIndex((s) => s.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    removeShift: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((s) => s.id !== action.payload);
    },
    removeShiftsByStaff: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((s) => s.staffId !== action.payload);
    },
    clearAllShifts: (state) => {
      state.items = [];
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

export const {
  setShifts,
  addShift,
  updateShift,
  removeShift,
  removeShiftsByStaff,
  clearAllShifts,
  setLoading,
  setError,
} = shiftSlice.actions;

export default shiftSlice.reducer;
