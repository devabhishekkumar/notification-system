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
  creating: false,
  updating: false,
  deleting: false,

  error: null,
};

/* ============================================================
   FETCH TRIGGERS
   GET /notifications/triggers/
============================================================ */

export const fetchTriggers = createAsyncThunk(
  "triggers/fetchTriggers",

  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(
        "/notifications/triggers/"
      );

      const data = response.data;

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
          "Failed to load triggers."
      );
    }
  }
);

/* ============================================================
   CREATE TRIGGER
   POST /notifications/triggers/
============================================================ */

export const createTrigger = createAsyncThunk(
  "triggers/createTrigger",

  async (
    trigger,
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post(
        "/notifications/triggers/",
        trigger
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.message ||
          "Failed to create trigger."
      );
    }
  }
);

/* ============================================================
   UPDATE TRIGGER
   PATCH /notifications/triggers/:id/
============================================================ */

export const updateTrigger = createAsyncThunk(
  "triggers/updateTrigger",

  async (
    { id, data },
    { rejectWithValue }
  ) => {
    try {
      if (!id) {
        return rejectWithValue(
          "Trigger ID is required."
        );
      }

      const response = await api.patch(
        `/notifications/triggers/${id}/`,
        data
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.message ||
          "Failed to update trigger."
      );
    }
  }
);

/* ============================================================
   DELETE TRIGGER
   DELETE /notifications/triggers/:id/
============================================================ */

export const deleteTrigger = createAsyncThunk(
  "triggers/deleteTrigger",

  async (
    id,
    { rejectWithValue }
  ) => {
    try {
      if (!id) {
        return rejectWithValue(
          "Trigger ID is required."
        );
      }

      await api.delete(
        `/notifications/triggers/${id}/`
      );

      return id;
    } catch (error) {
      return rejectWithValue(
        error?.message ||
          "Failed to delete trigger."
      );
    }
  }
);

/* ============================================================
   SLICE
============================================================ */

const triggerSlice = createSlice({
  name: "triggers",

  initialState,

  reducers: {
    /* --------------------------------------------------------
       CLEAR ERROR
    -------------------------------------------------------- */

    clearTriggerError: (state) => {
      state.error = null;
    },

    /* --------------------------------------------------------
       CLEAR TRIGGERS
    -------------------------------------------------------- */

    clearTriggers: (state) => {
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
         FETCH TRIGGERS
      ====================================================== */

      .addCase(
        fetchTriggers.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      .addCase(
        fetchTriggers.fulfilled,
        (state, action) => {
          state.loading = false;

          state.items =
            Array.isArray(action.payload)
              ? action.payload
              : [];

          state.error = null;
        }
      )

      .addCase(
        fetchTriggers.rejected,
        (state, action) => {
          state.loading = false;

          state.error =
            action.payload ||
            "Failed to load triggers.";
        }
      )

      /* ======================================================
         CREATE TRIGGER
      ====================================================== */

      .addCase(
        createTrigger.pending,
        (state) => {
          state.creating = true;
          state.error = null;
        }
      )

      .addCase(
        createTrigger.fulfilled,
        (state, action) => {
          state.creating = false;

          if (action.payload) {
            state.items.unshift(
              action.payload
            );
          }

          state.error = null;
        }
      )

      .addCase(
        createTrigger.rejected,
        (state, action) => {
          state.creating = false;

          state.error =
            action.payload ||
            "Failed to create trigger.";
        }
      )

      /* ======================================================
         UPDATE TRIGGER
      ====================================================== */

      .addCase(
        updateTrigger.pending,
        (state) => {
          state.updating = true;
          state.error = null;
        }
      )

      .addCase(
        updateTrigger.fulfilled,
        (state, action) => {
          state.updating = false;

          const updatedTrigger =
            action.payload;

          const index =
            state.items.findIndex(
              (item) =>
                item.id ===
                updatedTrigger?.id
            );

          if (index !== -1) {
            state.items[index] =
              updatedTrigger;
          }

          state.error = null;
        }
      )

      .addCase(
        updateTrigger.rejected,
        (state, action) => {
          state.updating = false;

          state.error =
            action.payload ||
            "Failed to update trigger.";
        }
      )

      /* ======================================================
         DELETE TRIGGER
      ====================================================== */

      .addCase(
        deleteTrigger.pending,
        (state) => {
          state.deleting = true;
          state.error = null;
        }
      )

      .addCase(
        deleteTrigger.fulfilled,
        (state, action) => {
          state.deleting = false;

          state.items =
            state.items.filter(
              (item) =>
                item.id !==
                action.payload
            );

          state.error = null;
        }
      )

      .addCase(
        deleteTrigger.rejected,
        (state, action) => {
          state.deleting = false;

          state.error =
            action.payload ||
            "Failed to delete trigger.";
        }
      );
  },
});

/* ============================================================
   ACTIONS
============================================================ */

export const {
  clearTriggerError,
  clearTriggers,
} = triggerSlice.actions;

/* ============================================================
   SELECTORS
============================================================ */

export const selectTriggers = (state) =>
  state.triggers.items;

export const selectTriggersLoading = (
  state
) =>
  state.triggers.loading;

export const selectTriggersCreating = (
  state
) =>
  state.triggers.creating;

export const selectTriggersUpdating = (
  state
) =>
  state.triggers.updating;

export const selectTriggersDeleting = (
  state
) =>
  state.triggers.deleting;

export const selectTriggersError = (
  state
) =>
  state.triggers.error;

/* ============================================================
   REDUCER
============================================================ */

export default triggerSlice.reducer;