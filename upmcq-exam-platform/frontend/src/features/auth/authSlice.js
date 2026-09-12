// ================== features/auth/authSlice.js ==================
// লগইন/লগআউট এবং ইউজার স্টেট ম্যানেজ করার Redux slice
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '../../api/axiosClient';

// LocalStorage থেকে নিরাপদভাবে ডেটা পার্স করার হেলপার ফাংশন
const getInitialUser = () => {
  try {
    const rawUser = localStorage.getItem('user');
    if (!rawUser || rawUser === 'undefined') return null;
    return JSON.parse(rawUser);
  } catch (error) {
    console.error('LocalStorage parsing error:', error);
    localStorage.removeItem('user');
    return null;
  }
};

const savedUser = getInitialUser();
const savedToken = localStorage.getItem('token') && localStorage.getItem('token') !== 'undefined'
  ? localStorage.getItem('token')
  : null;

export const teacherLogin = createAsyncThunk('auth/teacherLogin', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await axiosClient.post('/auth/teacher/login', payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'লগইন ব্যর্থ হয়েছে');
  }
});

export const teacherRegister = createAsyncThunk('auth/teacherRegister', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await axiosClient.post('/auth/teacher/register', payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে');
  }
});

export const studentLogin = createAsyncThunk('auth/studentLogin', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await axiosClient.post('/auth/student/login', payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'লগইন ব্যর্থ হয়েছে');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: savedUser, token: savedToken, status: 'idle', error: null },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
  extraReducers: (builder) => {
    const onSuccess = (state, action) => {
      state.status = 'succeeded';
      // ব্যাকএন্ড রেসপন্স ফ্ল্যাট অবজেক্ট হিসেবে আসে ({ _id, name, email, role, token }),
      // এখানে আলাদা 'user' নামে কোনো ফিল্ড থাকে না — তাই token বাদ দিয়ে বাকি সব ফিল্ড দিয়ে user বানানো হচ্ছে
      const { token, ...user } = action.payload;
      state.user = user;
      state.token = token;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    };
    const onPending = (state) => {
      state.status = 'loading';
      state.error = null;
    };
    const onFailed = (state, action) => {
      state.status = 'failed';
      state.error = action.payload;
    };

    builder
      .addCase(teacherLogin.pending, onPending)
      .addCase(teacherLogin.fulfilled, onSuccess)
      .addCase(teacherLogin.rejected, onFailed)
      .addCase(teacherRegister.pending, onPending)
      .addCase(teacherRegister.fulfilled, onSuccess)
      .addCase(teacherRegister.rejected, onFailed)
      .addCase(studentLogin.pending, onPending)
      .addCase(studentLogin.fulfilled, onSuccess)
      .addCase(studentLogin.rejected, onFailed);
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;