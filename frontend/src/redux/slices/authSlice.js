import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import api from "../../services/api";

/* ============================================================
   INITIAL STATE
============================================================ */

const storedAccessToken =
  localStorage.getItem("access_token");

const storedRefreshToken =
  localStorage.getItem("refresh_token");

const initialState = {
  accessToken: storedAccessToken,
  refreshToken: storedRefreshToken,

  user: null,

  isAuthenticated:
    Boolean(storedAccessToken),

  loading: false,
  logoutLoading: false,

  error: null,
};

/* ============================================================
   LOGIN
============================================================ */

export const login = createAsyncThunk(
  "auth/login",

  async (
    { username, password },
    { rejectWithValue }
  ) => {
    try {
      /* --------------------------------------------------------
         VALIDATION
      -------------------------------------------------------- */

      if (!username?.trim()) {
        return rejectWithValue(
          "Username is required."
        );
      }

      if (!password) {
        return rejectWithValue(
          "Password is required."
        );
      }

      /* --------------------------------------------------------
         LOGIN API
      -------------------------------------------------------- */

      const response = await api.post(
        "/auth/login/",
        {
          username: username.trim(),
          password,
        }
      );

      const data = response.data;

      /* --------------------------------------------------------
         TOKENS
      -------------------------------------------------------- */

      const accessToken =
        data?.access ||
        data?.access_token ||
        null;

      const refreshToken =
        data?.refresh ||
        data?.refresh_token ||
        null;

      /* --------------------------------------------------------
         CHECK ACCESS TOKEN
      -------------------------------------------------------- */

      if (!accessToken) {
        return rejectWithValue(
          "Login succeeded but no access token was returned."
        );
      }

      /* --------------------------------------------------------
         SAVE ACCESS TOKEN
      -------------------------------------------------------- */

      localStorage.setItem(
        "access_token",
        accessToken
      );

      /* --------------------------------------------------------
         SAVE REFRESH TOKEN
      -------------------------------------------------------- */

      if (refreshToken) {
        localStorage.setItem(
          "refresh_token",
          refreshToken
        );
      } else {
        localStorage.removeItem(
          "refresh_token"
        );
      }

      /* --------------------------------------------------------
         RETURN NORMALIZED DATA
      -------------------------------------------------------- */

      return {
        ...data,

        access: accessToken,

        refresh:
          refreshToken || null,

        user:
          data?.user || null,
      };
    } catch (error) {
      return rejectWithValue(
        error?.message ||
          "Unable to login. Please try again."
      );
    }
  }
);

/* ============================================================
   LOGOUT
============================================================ */

export const logout = createAsyncThunk(
  "auth/logout",

  async (_, { rejectWithValue }) => {
    try {
      /* --------------------------------------------------------
         LOGOUT NOTIFICATION API
      -------------------------------------------------------- */

      const response = await api.post(
        "/notifications/logout-notification/"
      );

      return response.data;
    } catch (error) {
      /*
        Even if the backend logout notification fails,
        local authentication will still be cleared.
      */

      return rejectWithValue(
        error?.message ||
          "Logout notification failed."
      );
    }
  }
);

/* ============================================================
   AUTH SLICE
============================================================ */

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    /* ========================================================
       CLEAR AUTH ERROR
    ======================================================== */

    clearAuthError: (state) => {
      state.error = null;
    },

    /* ========================================================
       RESTORE AUTH
    ======================================================== */

    restoreAuth: (state) => {
      const accessToken =
        localStorage.getItem(
          "access_token"
        );

      const refreshToken =
        localStorage.getItem(
          "refresh_token"
        );

      state.accessToken =
        accessToken;

      state.refreshToken =
        refreshToken;

      state.isAuthenticated =
        Boolean(accessToken);

      state.error = null;
    },

    /* ========================================================
       CLEAR LOCAL AUTH
    ======================================================== */

    clearLocalAuth: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;

      state.isAuthenticated = false;

      state.loading = false;
      state.logoutLoading = false;

      state.error = null;

      localStorage.removeItem(
        "access_token"
      );

      localStorage.removeItem(
        "refresh_token"
      );
    },
  },

  /* ==========================================================
     ASYNC ACTIONS
  ========================================================== */

  extraReducers: (builder) => {
    builder

      /* ======================================================
         LOGIN PENDING
      ====================================================== */

      .addCase(
        login.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      /* ======================================================
         LOGIN SUCCESS
      ====================================================== */

      .addCase(
        login.fulfilled,
        (state, action) => {
          state.loading = false;

          state.accessToken =
            action.payload.access;

          state.refreshToken =
            action.payload.refresh;

          state.user =
            action.payload.user;

          state.isAuthenticated = true;

          state.error = null;
        }
      )

      /* ======================================================
         LOGIN FAILED
      ====================================================== */

      .addCase(
        login.rejected,
        (state, action) => {
          state.loading = false;

          state.accessToken = null;
          state.refreshToken = null;

          state.user = null;

          state.isAuthenticated = false;

          state.error =
            action.payload ||
            "Login failed.";

          localStorage.removeItem(
            "access_token"
          );

          localStorage.removeItem(
            "refresh_token"
          );
        }
      )

      /* ======================================================
         LOGOUT PENDING
      ====================================================== */

      .addCase(
        logout.pending,
        (state) => {
          state.logoutLoading = true;
          state.error = null;
        }
      )

      /* ======================================================
         LOGOUT SUCCESS
      ====================================================== */

      .addCase(
        logout.fulfilled,
        (state) => {
          state.accessToken = null;
          state.refreshToken = null;

          state.user = null;

          state.isAuthenticated = false;

          state.loading = false;
          state.logoutLoading = false;

          state.error = null;

          localStorage.removeItem(
            "access_token"
          );

          localStorage.removeItem(
            "refresh_token"
          );
        }
      )

      /* ======================================================
         LOGOUT FAILED
      ====================================================== */

      .addCase(
        logout.rejected,
        (state, action) => {
          /*
            Clear local authentication even when
            the notification API fails.
          */

          state.accessToken = null;
          state.refreshToken = null;

          state.user = null;

          state.isAuthenticated = false;

          state.loading = false;
          state.logoutLoading = false;

          state.error =
            action.payload ||
            "Logout notification failed.";

          localStorage.removeItem(
            "access_token"
          );

          localStorage.removeItem(
            "refresh_token"
          );
        }
      );
  },
});

/* ============================================================
   ACTIONS
============================================================ */

export const {
  clearAuthError,
  restoreAuth,
  clearLocalAuth,
} = authSlice.actions;

/* ============================================================
   SELECTORS
============================================================ */

export const selectAuth = (state) =>
  state.auth;

export const selectIsAuthenticated = (
  state
) =>
  state.auth.isAuthenticated;

export const selectAccessToken = (
  state
) =>
  state.auth.accessToken;

export const selectRefreshToken = (
  state
) =>
  state.auth.refreshToken;

export const selectCurrentUser = (
  state
) =>
  state.auth.user;

export const selectAuthLoading = (
  state
) =>
  state.auth.loading;

export const selectLogoutLoading = (
  state
) =>
  state.auth.logoutLoading;

export const selectAuthError = (
  state
) =>
  state.auth.error;

/* ============================================================
   REDUCER
============================================================ */

export default authSlice.reducer;