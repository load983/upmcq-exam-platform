// ================== features/attempt/attemptSlice.js ==================
// Student সাইডে পরীক্ষা দেয়ার সময়কার স্টেট (প্রশ্ন, উত্তর, টাইমার) ম্যানেজ করে
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '../../api/axiosClient';

export const joinExam = createAsyncThunk('attempt/join', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await axiosClient.post('/attempts/join', payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'জয়েন করা যায়নি');
  }
});

export const saveAnswer = createAsyncThunk(
  'attempt/saveAnswer',
  async ({ attemptId, questionId, selectedOptionIndex }, { rejectWithValue }) => {
    try {
      await axiosClient.put(`/attempts/${attemptId}/answer`, { questionId, selectedOptionIndex });
      return { questionId, selectedOptionIndex };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const submitAttempt = createAsyncThunk(
  'attempt/submit',
  async ({ attemptId, autoSubmitted }, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.post(`/attempts/${attemptId}/submit`, { autoSubmitted });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const fetchReview = createAsyncThunk('attempt/fetchReview', async (attemptId, { rejectWithValue }) => {
  try {
    const { data } = await axiosClient.get(`/attempts/${attemptId}/review`);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const attemptSlice = createSlice({
  name: 'attempt',
  initialState: {
    attemptId: null,
    examTitle: '',
    totalTimeMinutes: 0,
    startedAt: null,
    questions: [],
    answersMap: {}, // { questionId: selectedOptionIndex }
    result: null,
    review: null,
    status: 'idle',
    error: null,
  },
  reducers: {
    resetAttempt: (state) => {
      state.attemptId = null;
      state.questions = [];
      state.answersMap = {};
      state.result = null;
      state.review = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(joinExam.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(joinExam.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.attemptId = action.payload.attemptId;
        state.examTitle = action.payload.examTitle;
        state.totalTimeMinutes = action.payload.totalTimeMinutes;
        state.startedAt = action.payload.startedAt;
        state.questions = action.payload.questions;
      })
      .addCase(joinExam.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(saveAnswer.fulfilled, (state, action) => {
        state.answersMap[action.payload.questionId] = action.payload.selectedOptionIndex;
      })
      .addCase(submitAttempt.fulfilled, (state, action) => {
        state.result = action.payload;
      })
      .addCase(fetchReview.fulfilled, (state, action) => {
        state.review = action.payload;
      });
  },
});

export const { resetAttempt } = attemptSlice.actions;
export default attemptSlice.reducer;
