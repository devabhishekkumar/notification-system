import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import api from "../../services/api";

/* ============================================================
   INITIAL STATE
============================================================ */

const initialState = {
  subscription: null,
  subscriptions: [],

  isSubscribed: false,

  loading: false,
  registering: false,
  updating: false,
  deleting: false,

  error: null,
};

/* ============================================================
   FETCH PUBLIC VAPID KEY
   GET /notifications/push/public-key/
============================================================ */

export const fetchPublicKey = createAsyncThunk(
  "push/fetchPublicKey",

  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(
        "/notifications/push/public-key/"
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.message ||
          "Failed to load push public key."
      );
    }
  }
);

/* ============================================================
   FETCH SUBSCRIPTIONS
   GET /notifications/push/subscriptions/
============================================================ */

export const fetchSubscriptions = createAsyncThunk(
  "push/fetchSubscriptions",

  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(
        "/notifications/push/subscriptions/"
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
          "Failed to load push subscriptions."
      );
    }
  }
);

/* ============================================================
   REGISTER SUBSCRIPTION
   POST /notifications/push/subscribe/
============================================================ */

export const registerSubscription = createAsyncThunk(
  "push/registerSubscription",

  async (
    subscription,
    { rejectWithValue }
  ) => {
    try {
      if (!subscription) {
        return rejectWithValue(
          "Push subscription is required."
        );
      }

      const response = await api.post(
        "/notifications/push/subscribe/",
        {
          subscription,
        }
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.message ||
          "Failed to register push subscription."
      );
    }
  }
);

/* ============================================================
   UPDATE SUBSCRIPTION
   PATCH /notifications/push/subscriptions/:id/
============================================================ */

export const updateSubscription = createAsyncThunk(
  "push/updateSubscription",

  async (
    { id, data },
    { rejectWithValue }
  ) => {
    try {
      if (!id) {
        return rejectWithValue(
          "Subscription ID is required."
        );
      }

      const response = await api.patch(
        `/notifications/push/subscriptions/${id}/`,
        data
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.message ||
          "Failed to update push subscription."
      );
    }
  }
);

/* ============================================================
   DELETE SUBSCRIPTION
   DELETE /notifications/push/subscriptions/:id/
============================================================ */

export const deleteSubscription = createAsyncThunk(
  "push/deleteSubscription",

  async (
    id,
    { rejectWithValue }
  ) => {
    try {
      if (!id) {
        return rejectWithValue(
          "Subscription ID is required."
        );
      }

      await api.delete(
        `/notifications/push/subscriptions/${id}/`
      );

      return id;
    } catch (error) {
      return rejectWithValue(
        error?.message ||
          "Failed to delete push subscription."
      );
    }
  }
);

/* ============================================================
   PUSH SLICE
============================================================ */

const pushSlice = createSlice({
  name: "push",

  initialState,

  reducers: {
    /* --------------------------------------------------------
       SET SUBSCRIPTION
    -------------------------------------------------------- */

    setSubscription: (
      state,
      action
    ) => {
      state.subscription =
        action.payload;

      state.isSubscribed =
        Boolean(action.payload);
    },

    /* --------------------------------------------------------
       CLEAR SUBSCRIPTION
    -------------------------------------------------------- */

    clearSubscription: (
      state
    ) => {
      state.subscription = null;
      state.isSubscribed = false;
    },

    /* --------------------------------------------------------
       CLEAR ERROR
    -------------------------------------------------------- */

    clearPushError: (
      state
    ) => {
      state.error = null;
    },

    /* --------------------------------------------------------
       CLEAR ALL SUBSCRIPTIONS
    -------------------------------------------------------- */

    clearSubscriptions: (
      state
    ) => {
      state.subscriptions = [];
      state.subscription = null;
      state.isSubscribed = false;
      state.error = null;
    },
  },

  /* ==========================================================
     ASYNC ACTIONS
  ========================================================== */

  extraReducers: (builder) => {
    builder

      /* ======================================================
         FETCH PUBLIC KEY
      ====================================================== */

      .addCase(
        fetchPublicKey.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      .addCase(
        fetchPublicKey.fulfilled,
        (state) => {
          state.loading = false;
          state.error = null;
        }
      )

      .addCase(
        fetchPublicKey.rejected,
        (state, action) => {
          state.loading = false;

          state.error =
            action.payload ||
            "Failed to load push public key.";
        }
      )

      /* ======================================================
         FETCH SUBSCRIPTIONS
      ====================================================== */

      .addCase(
        fetchSubscriptions.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      .addCase(
        fetchSubscriptions.fulfilled,
        (state, action) => {
          state.loading = false;

          state.subscriptions =
            Array.isArray(action.payload)
              ? action.payload
              : [];

          /*
            Find active subscription.
          */

          const activeSubscription =
            state.subscriptions.find(
              (item) =>
                item.is_active !== false
            );

          if (activeSubscription) {
            state.subscription =
              activeSubscription;

            state.isSubscribed = true;
          }

          state.error = null;
        }
      )

      .addCase(
        fetchSubscriptions.rejected,
        (state, action) => {
          state.loading = false;

          state.error =
            action.payload ||
            "Failed to load subscriptions.";
        }
      )

      /* ======================================================
         REGISTER SUBSCRIPTION
      ====================================================== */

      .addCase(
        registerSubscription.pending,
        (state) => {
          state.registering = true;
          state.error = null;
        }
      )

      .addCase(
        registerSubscription.fulfilled,
        (state, action) => {
          state.registering = false;

          state.subscription =
            action.payload;

          state.isSubscribed = true;

          /*
            Add to subscriptions if returned
            from backend.
          */

          if (action.payload) {
            const exists =
              state.subscriptions.some(
                (item) =>
                  String(item.id) ===
                  String(action.payload.id)
              );

            if (!exists) {
              state.subscriptions.push(
                action.payload
              );
            }
          }

          state.error = null;
        }
      )

      .addCase(
        registerSubscription.rejected,
        (state, action) => {
          state.registering = false;

          state.error =
            action.payload ||
            "Failed to register push subscription.";
        }
      )

      /* ======================================================
         UPDATE SUBSCRIPTION
      ====================================================== */

      .addCase(
        updateSubscription.pending,
        (state) => {
          state.updating = true;
          state.error = null;
        }
      )

      .addCase(
        updateSubscription.fulfilled,
        (state, action) => {
          state.updating = false;

          const updated =
            action.payload;

          const index =
            state.subscriptions.findIndex(
              (item) =>
                String(item.id) ===
                String(updated?.id)
            );

          if (index !== -1) {
            state.subscriptions[index] =
              updated;
          }

          if (
            state.subscription &&
            String(state.subscription.id) ===
              String(updated?.id)
          ) {
            state.subscription =
              updated;

            state.isSubscribed =
              updated?.is_active !== false;
          }

          state.error = null;
        }
      )

      .addCase(
        updateSubscription.rejected,
        (state, action) => {
          state.updating = false;

          state.error =
            action.payload ||
            "Failed to update push subscription.";
        }
      )

      /* ======================================================
         DELETE SUBSCRIPTION
      ====================================================== */

      .addCase(
        deleteSubscription.pending,
        (state) => {
          state.deleting = true;
          state.error = null;
        }
      )

      .addCase(
        deleteSubscription.fulfilled,
        (state, action) => {
          state.deleting = false;

          state.subscriptions =
            state.subscriptions.filter(
              (item) =>
                String(item.id) !==
                String(action.payload)
            );

          if (
            state.subscription &&
            String(state.subscription.id) ===
              String(action.payload)
          ) {
            state.subscription = null;
            state.isSubscribed = false;
          }

          state.error = null;
        }
      )

      .addCase(
        deleteSubscription.rejected,
        (state, action) => {
          state.deleting = false;

          state.error =
            action.payload ||
            "Failed to delete push subscription.";
        }
      );
  },
});

/* ============================================================
   ACTIONS
============================================================ */

export const {
  setSubscription,
  clearSubscription,
  clearPushError,
  clearSubscriptions,
} = pushSlice.actions;

/* ============================================================
   SELECTORS
============================================================ */

export const selectPush = (state) =>
  state.push;

export const selectSubscription = (
  state
) =>
  state.push?.subscription || null;

export const selectIsSubscribed = (
  state
) =>
  state.push?.isSubscribed || false;

export const selectSubscriptions = (
  state
) =>
  state.push?.subscriptions || [];

export const selectPushLoading = (
  state
) =>
  state.push?.loading || false;

export const selectPushRegistering = (
  state
) =>
  state.push?.registering || false;

export const selectPushUpdating = (
  state
) =>
  state.push?.updating || false;

export const selectPushDeleting = (
  state
) =>
  state.push?.deleting || false;

export const selectPushError = (
  state
) =>
  state.push?.error || null;

/* ============================================================
   REDUCER
============================================================ */

export default pushSlice.reducer;