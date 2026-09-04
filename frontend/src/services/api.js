import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api/v1";

const api = axios.create({
  baseURL: BASE_URL,

  headers: {
    "Content-Type": "application/json",
  },
});

/* ============================================================
   PLAIN AXIOS INSTANCE (no interceptors)
   Used only for the refresh call itself, so a failed refresh
   never gets caught in a retry loop by our own interceptor.
============================================================ */

const refreshClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

/* ============================================================
   REQUEST INTERCEPTOR
============================================================ */

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

/* ============================================================
   HARD LOGOUT
   Clears all auth state and sends the user back to /login.
   Used when the refresh token itself is invalid/expired.
============================================================ */

function forceLogout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");

  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

/* ============================================================
   REFRESH QUEUE
   Prevents multiple simultaneous 401s from firing multiple
   /auth/refresh/ calls at once. Every request that hits a 401
   while a refresh is already in flight waits on the same
   promise and gets retried once it resolves.
============================================================ */

let isRefreshing = false;
let pendingQueue = [];

function resolveQueue(newAccessToken, error) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(newAccessToken);
    }
  });

  pendingQueue = [];
}

/* ============================================================
   RESPONSE INTERCEPTOR
============================================================ */

api.interceptors.response.use(
  (response) => {
    return response;
  },

  async (error) => {
    const originalRequest = error?.config;
    const status = error?.response?.status;

    const isAuthRoute =
      originalRequest?.url?.includes("/auth/login/") ||
      originalRequest?.url?.includes("/auth/refresh/");

    /* --------------------------------------------------------
       TOKEN EXPIRED / INVALID -> TRY TO REFRESH ONCE
    -------------------------------------------------------- */

    if (
      status === 401 &&
      !originalRequest?._retry &&
      !isAuthRoute
    ) {
      const refreshToken = localStorage.getItem("refresh_token");

      if (!refreshToken) {
        forceLogout();
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        // A refresh is already happening — wait for it.
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((newAccessToken) => {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        });
      }

      isRefreshing = true;

      try {
        const { data } = await refreshClient.post("/auth/refresh/", {
          refresh: refreshToken,
        });

        const newAccessToken = data?.access;

        if (!newAccessToken) {
          throw new Error("Refresh response missing access token.");
        }

        localStorage.setItem("access_token", newAccessToken);

        // SIMPLE_JWT has ROTATE_REFRESH_TOKENS enabled, so a new
        // refresh token may come back too — store it if present.
        if (data?.refresh) {
          localStorage.setItem("refresh_token", data.refresh);
        }

        isRefreshing = false;
        resolveQueue(newAccessToken, null);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        resolveQueue(null, refreshError);

        forceLogout();
        return Promise.reject(refreshError);
      }
    }

    /* --------------------------------------------------------
       REFRESH ITSELF FAILED, OR ANY OTHER 401 ON AN AUTH ROUTE
    -------------------------------------------------------- */

    if (status === 401 && (isAuthRoute || originalRequest?._retry)) {
      forceLogout();
    }

    const data = error?.response?.data;

    const message =
      data?.detail ||
      data?.error ||
      error?.message ||
      "Something went wrong.";

    console.error(`API Error ${status || ""}:`, message);

    return Promise.reject(new Error(message));
  }
);

export default api;