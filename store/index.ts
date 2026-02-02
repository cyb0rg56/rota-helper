import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import periodReducer from './slices/periodSlice';
import shiftReducer from './slices/shiftSlice';
import staffReducer from './slices/staffSlice';

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

// Internal types for typed hooks
type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;

// Typed hooks for use throughout the app
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

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
