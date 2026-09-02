import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

export const testSendNotification = createAsyncThunk(
  "testSend/send",

  async ({ templateId, channel, recipient }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "/notifications/test-send/",
        {
          templateId,
          channel,
          recipient,
        }
      );

      return response.data;
    } catch (error) {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to send test notification.";

      return rejectWithValue(errorMessage);
    }
  }
);

const initialState = {
  loading: false,
  success: false,
  data: null,
  error: null,
};

const testSendSlice = createSlice({
  name: "testSend",

  initialState,

  reducers: {
    clearTestSend: (state) => {
      state.loading = false;
      state.success = false;
      state.data = null;
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // Sending started
      .addCase(testSendNotification.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.data = null;
        state.error = null;
      })

      // Sending successful
      .addCase(testSendNotification.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.data = action.payload;
        state.error = null;
      })

      // Sending failed
      .addCase(testSendNotification.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.data = null;
        state.error =
          action.payload || "Failed to send test notification.";
      });
  },
});

export const { clearTestSend } = testSendSlice.actions;

export default testSendSlice.reducer;