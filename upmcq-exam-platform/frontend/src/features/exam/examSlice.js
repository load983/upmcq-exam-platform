import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axiosClient';

const API_URL = '/exams';

// FETCH THUNKS
export const fetchExams = createAsyncThunk('exam/fetchExams', async (_, { rejectWithValue }) => {
  try {
    const r = await axios.get(API_URL);
    return r.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to fetch exams');
  }
});

export const fetchMyExams = createAsyncThunk('exam/fetchMyExams', async (_, { rejectWithValue }) => {
  try {
    const r = await axios.get(API_URL);
    return r.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to fetch my exams');
  }
});

export const fetchExamById = createAsyncThunk('exam/fetchExamById', async (id, { rejectWithValue }) => {
  try {
    const r = await axios.get(`${API_URL}/${id}`);
    return r.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to fetch exam details');
  }
});

// EXAM CODE দিয়ে পরীক্ষা খোঁজার Async Thunk
export const fetchExamByCode = createAsyncThunk('exam/fetchExamByCode', async (examCode, { rejectWithValue }) => {
  try {
    const r = await axios.get(`${API_URL}/code/${examCode}`);
    return r.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Exam not found');
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
    return rejectWithValue(e.response?.data?.message || 'Failed to create exam');
  }
});

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
    return rejectWithValue(e.response?.data?.message || 'Failed to update exam');
  }
});

export const deleteExam = createAsyncThunk('exam/deleteExam', async (id, { rejectWithValue }) => {
  try {
    await axios.delete(`${API_URL}/${id}`);
    return id;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to delete exam');
  }
});

export const updateExamSettings = createAsyncThunk('exam/updateExamSettings', async ({ id, payload }, { rejectWithValue }) => {
  try {
    const r = await axios.put(`${API_URL}/${id}/settings`, payload);
    return r.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to update settings');
  }
});

export const publishExam = createAsyncThunk('exam/publishExam', async (id, { rejectWithValue }) => {
  try {
    const r = await axios.post(`${API_URL}/${id}/publish`);
    return r.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to publish exam');
  }
});

export const setResourceLink = createAsyncThunk('exam/setResourceLink', async ({ id, link }, { rejectWithValue }) => {
  try {
    const r = await axios.put(`${API_URL}/${id}/resource-link`, { link });
    return r.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to set resource link');
  }
});

export const uploadResourcePdf = createAsyncThunk('exam/uploadResourcePdf', async ({ id, formData }, { rejectWithValue }) => {
  try {
    const r = await axios.post(`${API_URL}/${id}/resource-pdf`, formData);
    return r.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to upload resource PDF');
  }
});

export const removeResource = createAsyncThunk('exam/removeResource', async (id, { rejectWithValue }) => {
  try {
    const r = await axios.delete(`${API_URL}/${id}/resource`);
    return r.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to remove resource');
  }
});

// QUESTIONS THUNKS
export const addQuestion = createAsyncThunk('exam/addQuestion', async ({ examId, questionData }, { rejectWithValue }) => {
  try {
    const r = await axios.post(`${API_URL}/${examId}/questions`, questionData);
    return r.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to add question');
  }
});

export const updateQuestion = createAsyncThunk('exam/updateQuestion', async ({ questionId, payload }, { rejectWithValue }) => {
  try {
    const r = await axios.put(`${API_URL}/questions/${questionId}`, payload);
    return r.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to update question');
  }
});

export const deleteQuestion = createAsyncThunk('exam/deleteQuestion', async (arg, { rejectWithValue }) => {
  try {
    const qId = typeof arg === 'string' ? arg : arg.questionId || arg._id;
    await axios.delete(`${API_URL}/questions/${qId}`);
    return qId;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to delete question');
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
    clearCurrentExam: (s) => { 
      s.currentExam = null; 
      s.questions = []; 
      s.shareLink = null; 
    },
    clearError: (s) => { 
      s.error = null; 
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchExams.fulfilled, (s, a) => { s.exams = Array.isArray(a.payload) ? a.payload : a.payload.exams || []; })
     .addCase(fetchMyExams.fulfilled, (s, a) => { s.exams = Array.isArray(a.payload) ? a.payload : a.payload.exams || []; })
     .addCase(fetchExamById.fulfilled, (s, a) => { 
        const ex = a.payload?.exam || a.payload?.data || a.payload;
        s.currentExam = ex; 
        s.questions = a.payload?.questions || ex?.questions || []; 
        s.shareLink = a.payload?.shareLink || null; 
      })
     .addCase(fetchExamByCode.fulfilled, (s, a) => {
        // ফ্লেক্সিবল ডাটা পার্সিং (a.payload.exam / a.payload.data / a.payload)
        const ex = a.payload?.exam || a.payload?.data || a.payload;
        s.currentExam = ex;
        s.questions = a.payload?.questions || ex?.questions || [];
      })
     .addCase(fetchExamResults.fulfilled, (s, a) => { s.results = a.payload.results || a.payload; })
     .addCase(createExam.fulfilled, (s, a) => { 
        const ex = a.payload.exam || a.payload;
        if (ex?._id || ex?.id) s.exams.push(ex);
      })
     .addCase(uploadExamPdf.fulfilled, (s, a) => { 
        const ex = a.payload.exam || a.payload; 
        if (ex?._id || ex?.id) s.exams.push(ex); 
      })
     .addCase(updateExamSettings.fulfilled, (s, a) => { s.currentExam = a.payload.exam || a.payload; })
     .addCase(publishExam.fulfilled, (s, a) => { 
        s.currentExam = a.payload.exam || a.payload; 
        s.shareLink = a.payload.shareLink || a.payload.link || s.shareLink; 
      })
     .addCase(deleteExam.fulfilled, (s, a) => { s.exams = s.exams.filter(e => (e._id || e.id) !== a.payload); })
     .addCase(setResourceLink.fulfilled, (s, a) => { s.currentExam = a.payload.exam || a.payload; })
     .addCase(uploadResourcePdf.fulfilled, (s, a) => { s.currentExam = a.payload.exam || a.payload; })
     .addCase(removeResource.fulfilled, (s, a) => { s.currentExam = a.payload.exam || a.payload; })
     .addCase(addQuestion.fulfilled, (s, a) => { 
        const q = a.payload.question || a.payload;
        if (q) s.questions.push(q); 
      })
     .addCase(updateQuestion.fulfilled, (s, a) => { 
        const q = a.payload.question || a.payload;
        const i = s.questions.findIndex(item => (item._id || item.id) === (q._id || q.id)); 
        if (i !== -1) s.questions[i] = q; 
      })
     .addCase(deleteQuestion.fulfilled, (s, a) => { s.questions = s.questions.filter(q => (q._id || q.id) !== a.payload); })
     .addMatcher(ac => ac.type.endsWith('/pending'), s => { s.loading = true; s.error = null; })
     .addMatcher(ac => ac.type.endsWith('/rejected'), (s, ac) => { s.loading = false; s.error = ac.payload; })
     .addMatcher(ac => ac.type.endsWith('/fulfilled'), s => { s.loading = false; });
  },
});

export const { clearCurrentExam, clearError } = examSlice.actions;
export default examSlice.reducer;
