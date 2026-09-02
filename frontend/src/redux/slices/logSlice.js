import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import api from "../../services/api";

/* ============================================================
   INITIAL STATE
============================================================ */

const initialState = {
  items: [],
  loading: false,
  error: null,
};

/* ============================================================
   FETCH NOTIFICATION LOGS

   GET /notifications/logs/
============================================================ */

export const fetchLogs = createAsyncThunk(
  "logs/fetchLogs",

  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(
        "/notifications/logs/"
      );

      const data = response.data;

      /* --------------------------------------------------------
         SUPPORT DIFFERENT RESPONSE FORMATS
      -------------------------------------------------------- */

      if (Array.isArray(data)) {
        return data;
      }

      if (Array.isArray(data?.results)) {
        return data.results;
      }

      if (Array.isArray(data?.data)) {
        return data.data;
      }

      return [];
    } catch (error) {
      return rejectWithValue(
        error?.message ||
          "Failed to load notification logs."
      );
    }
  }
);

/* ============================================================
   LOG SLICE
============================================================ */

const logSlice = createSlice({
  name: "logs",

  initialState,

  reducers: {
    /* --------------------------------------------------------
       CLEAR ERROR
    -------------------------------------------------------- */

    clearLogError: (state) => {
      state.error = null;
    },

    /* --------------------------------------------------------
       CLEAR LOGS
    -------------------------------------------------------- */

    clearLogs: (state) => {
      state.items = [];
      state.error = null;
    },
  },

  /* ==========================================================
     ASYNC ACTIONS
  ========================================================== */

  extraReducers: (builder) => {
    builder

      /* ======================================================
         FETCH PENDING
      ====================================================== */

      .addCase(
        fetchLogs.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      /* ======================================================
         FETCH SUCCESS
      ====================================================== */

      .addCase(
        fetchLogs.fulfilled,
        (state, action) => {
          state.loading = false;

          state.items =
            Array.isArray(action.payload)
              ? action.payload
              : [];

          state.error = null;
        }
      )

      /* ======================================================
         FETCH FAILED
      ====================================================== */

      .addCase(
        fetchLogs.rejected,
        (state, action) => {
          state.loading = false;

          state.error =
            action.payload ||
            "Failed to load notification logs.";
        }
      );
  },
});

/* ============================================================
   ACTIONS
============================================================ */

export const {
  clearLogError,
  clearLogs,
} = logSlice.actions;

/* ============================================================
   SELECTORS
============================================================ */

export const selectLogs = (state) =>
  state.logs?.items || [];

export const selectLogsLoading = (state) =>
  state.logs?.loading || false;

export const selectLogsError = (state) =>
  state.logs?.error || null;

/* ============================================================
   REDUCER
============================================================ */

export default logSlice.reducer;