// ================== app/store.js ==================
// Redux স্টোর — এখানে সব slice একসাথে যুক্ত করা হয়েছে
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import examReducer from '../features/exam/examSlice';
import attemptReducer from '../features/attempt/attemptSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    exam: examReducer,
    attempt: attemptReducer,
  },
});
