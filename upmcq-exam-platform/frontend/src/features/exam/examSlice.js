import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axiosClient';

const API_URL = '/exams';

// FETCH THUNKS
export const fetchExams = createAsyncThunk('exam/fetchExams', async (_, { rejectWithValue }) => {
  try {
    const r = await axios.get(API_URL);
    return r.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed');
  }
});

export const fetchMyExams = createAsyncThunk('exam/fetchMyExams', async (_, { rejectWithValue }) => {
  try {
    // ব্যাকএন্ডে GET /api/exams (getMyExams) রুটই লগইন করা টিচারের নিজের এক্সাম লিস্ট দেয়
    const r = await axios.get(API_URL);
    return r.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed');
  }
});

export const fetchExamById = createAsyncThunk('exam/fetchExamById', async (id, { rejectWithValue }) => {
  try {
    const r = await axios.get(`${API_URL}/${id}`);
    return r.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed');
  }
});

export const fetchExamResults = createAsyncThunk('exam/fetchExamResults', async (examId, { rejectWithValue }) => {
  try {
    const r = await axios.get(`${API_URL}/${examId}/results`);
    return r.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to fetch results');
  }
});

// CREATE / UPLOAD THUNKS
export const createExam = createAsyncThunk('exam/createExam', async (data, { rejectWithValue }) => {
  try {
    const r = await axios.post(API_URL, data);
    return r.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed');
  }
});

// ⚠️ আপলোড থাংক সংশোধন (Content-Type ম্যানুয়ালি দেওয়া বাদ দেওয়া হয়েছে)
export const uploadExamPdf = createAsyncThunk('exam/uploadExamPdf', async (formDataPayload, { rejectWithValue }) => {
  try {
    const r = await axios.post(`${API_URL}/upload`, formDataPayload);
    return r.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'PDF upload failed');
  }
});

export const uploadExam = uploadExamPdf;

// UPDATE / DELETE THUNKS
export const updateExam = createAsyncThunk('exam/updateExam', async ({ id, examData }, { rejectWithValue }) => {
  try {
    const r = await axios.put(`${API_URL}/${id}`, examData);
    return r.data;
  } catch (e) {
    return rejectWithValue('Failed');
  }
});

export const deleteExam = createAsyncThunk('exam/deleteExam', async (id, { rejectWithValue }) => {
  try {
    await axios.delete(`${API_URL}/${id}`);
    return id;
  } catch (e) {
    return rejectWithValue('Failed');
  }
});

export const updateExamSettings = createAsyncThunk('exam/updateExamSettings', async ({ id, payload }, { rejectWithValue }) => {
  try {
    const r = await axios.put(`${API_URL}/${id}`, payload);
    return r.data;
  } catch (e) {
    return rejectWithValue('Failed');
  }
});

export const publishExam = createAsyncThunk('exam/publishExam', async (id, { rejectWithValue }) => {
  try {
    const r = await axios.post(`${API_URL}/${id}/publish`);
    return r.data;
  } catch (e) {
    return rejectWithValue('Failed');
  }
});

export const setResourceLink = createAsyncThunk('exam/setResourceLink', async ({ id, link }, { rejectWithValue }) => {
  try {
    const r = await axios.put(`${API_URL}/${id}/resource`, { link });
    return r.data;
  } catch (e) {
    return rejectWithValue('Failed');
  }
});

export const uploadResourcePdf = createAsyncThunk('exam/uploadResourcePdf', async ({ id, formData }, { rejectWithValue }) => {
  try {
    const r = await axios.post(`${API_URL}/${id}/resource/pdf`, formData);
    return r.data;
  } catch (e) {
    return rejectWithValue('Failed');
  }
});

export const removeResource = createAsyncThunk('exam/removeResource', async (id, { rejectWithValue }) => {
  try {
    const r = await axios.delete(`${API_URL}/${id}/resource`);
    return r.data;
  } catch (e) {
    return rejectWithValue('Failed');
  }
});

// QUESTIONS THUNKS
export const addQuestion = createAsyncThunk('exam/addQuestion', async ({ examId, questionData }, { rejectWithValue }) => {
  try {
    const r = await axios.post(`${API_URL}/${examId}/questions`, questionData);
    return r.data;
  } catch (e) {
    return rejectWithValue('Failed');
  }
});

export const updateQuestion = createAsyncThunk('exam/updateQuestion', async ({ questionId, payload }, { rejectWithValue }) => {
  try {
    const r = await axios.put(`${API_URL}/questions/${questionId}`, payload);
    return r.data;
  } catch (e) {
    return rejectWithValue('Failed');
  }
});

export const deleteQuestion = createAsyncThunk('exam/deleteQuestion', async (arg, { rejectWithValue }) => {
  try {
    const qId = typeof arg === 'string' ? arg : arg.questionId || arg._id;
    await axios.delete(`${API_URL}/questions/${qId}`);
    return qId;
  } catch (e) {
    return rejectWithValue('Failed');
  }
});

const initialState = { 
  exams: [], 
  currentExam: null, 
  questions: [], 
  results: [], 
  shareLink: null, 
  loading: false, 
  error: null 
};

const examSlice = createSlice({
  name: 'exam',
  initialState,
  reducers: {
    clearCurrentExam: (s) => { s.currentExam = null; s.questions = []; s.shareLink = null; },
    clearError: (s) => { s.error = null; },
  },
  extraReducers: (b) => {
    b.addCase(fetchExams.fulfilled, (s, a) => { s.exams = a.payload; })
     .addCase(fetchMyExams.fulfilled, (s, a) => { s.exams = a.payload; })
     .addCase(fetchExamById.fulfilled, (s, a) => { 
        s.currentExam = a.payload.exam || a.payload; 
        s.questions = a.payload.questions || a.payload.exam?.questions || []; 
        s.shareLink = a.payload.shareLink || null; 
      })
     .addCase(fetchExamResults.fulfilled, (s, a) => { s.results = a.payload.results || a.payload; })
     .addCase(createExam.fulfilled, (s, a) => { s.exams.push(a.payload.exam || a.payload); })
     .addCase(uploadExamPdf.fulfilled, (s, a) => { 
        const ex = a.payload.exam || a.payload; 
        if (ex?._id) s.exams.push(ex); 
      })
     .addCase(updateExamSettings.fulfilled, (s, a) => { s.currentExam = a.payload.exam || a.payload; })
     .addCase(publishExam.fulfilled, (s, a) => { 
        s.currentExam = a.payload.exam || a.payload; 
        s.shareLink = a.payload.shareLink || a.payload.link || s.shareLink; 
      })
     .addCase(deleteExam.fulfilled, (s, a) => { s.exams = s.exams.filter(e => e._id !== a.payload); })
     .addCase(setResourceLink.fulfilled, (s, a) => { s.currentExam = a.payload.exam || a.payload; })
     .addCase(uploadResourcePdf.fulfilled, (s, a) => { s.currentExam = a.payload.exam || a.payload; })
     .addCase(removeResource.fulfilled, (s, a) => { s.currentExam = a.payload.exam || a.payload; })
     .addCase(addQuestion.fulfilled, (s, a) => { s.questions.push(a.payload); })
     .addCase(updateQuestion.fulfilled, (s, a) => { 
        const i = s.questions.findIndex(q => q._id === a.payload._id); 
        if (i !== -1) s.questions[i] = a.payload; 
      })
     .addCase(deleteQuestion.fulfilled, (s, a) => { s.questions = s.questions.filter(q => q._id !== a.payload); })
     .addMatcher(ac => ac.type.endsWith('/pending'), s => { s.loading = true; s.error = null; })
     .addMatcher(ac => ac.type.endsWith('/rejected'), (s, ac) => { s.loading = false; s.error = ac.payload; })
     .addMatcher(ac => ac.type.endsWith('/fulfilled'), s => { s.loading = false; });
  },
});

export const { clearCurrentExam, clearError } = examSlice.actions;
export default examSlice.reducer;
