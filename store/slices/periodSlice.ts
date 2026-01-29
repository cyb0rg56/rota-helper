import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RotaPeriod, PeriodState } from '@/types';

const initialState: PeriodState = {
  current: null,
  history: [],
  loading: false,
  error: null,
};

const periodSlice = createSlice({
  name: 'period',
  initialState,
  reducers: {
    setPeriod: (state, action: PayloadAction<RotaPeriod | null>) => {
      if (state.current && action.payload) {
        // Move current to history if setting a new period
        state.current.isActive = false;
        state.history.push(state.current);
      }
      state.current = action.payload;
      state.loading = false;
      state.error = null;
    },
    updatePeriod: (state, action: PayloadAction<Partial<RotaPeriod>>) => {
      if (state.current) {
        state.current = { ...state.current, ...action.payload };
      }
    },
    loadPersistedPeriod: (state, action: PayloadAction<{ current: RotaPeriod | null; history: RotaPeriod[] }>) => {
      state.current = action.payload.current;
      state.history = action.payload.history;
      state.loading = false;
    },
    clearPeriod: (state) => {
      if (state.current) {
        state.current.isActive = false;
        state.history.push(state.current);
      }
      state.current = null;
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
  setPeriod,
  updatePeriod,
  loadPersistedPeriod,
  clearPeriod,
  setLoading,
  setError,
} = periodSlice.actions;

export default periodSlice.reducer;
