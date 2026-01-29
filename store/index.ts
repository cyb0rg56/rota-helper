import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

import staffReducer from './slices/staffSlice';
import shiftReducer from './slices/shiftSlice';
import periodReducer from './slices/periodSlice';

const rootReducer = combineReducers({
  staff: staffReducer,
  shifts: shiftReducer,
  period: periodReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Persistence helpers
const STORAGE_KEYS = {
  STAFF: '@rota_staff',
  SHIFTS: '@rota_shifts',
  PERIOD: '@rota_period',
};

export const persistState = async () => {
  try {
    const state = store.getState();
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(state.staff.items)),
      AsyncStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(state.shifts.items)),
      AsyncStorage.setItem(
        STORAGE_KEYS.PERIOD,
        JSON.stringify({ current: state.period.current, history: state.period.history })
      ),
    ]);
  } catch (error) {
    console.error('Failed to persist state:', error);
  }
};

export const loadPersistedState = async () => {
  try {
    const [staffData, shiftsData, periodData] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.STAFF),
      AsyncStorage.getItem(STORAGE_KEYS.SHIFTS),
      AsyncStorage.getItem(STORAGE_KEYS.PERIOD),
    ]);

    return {
      staff: staffData ? JSON.parse(staffData) : [],
      shifts: shiftsData ? JSON.parse(shiftsData) : [],
      period: periodData ? JSON.parse(periodData) : { current: null, history: [] },
    };
  } catch (error) {
    console.error('Failed to load persisted state:', error);
    return null;
  }
};
