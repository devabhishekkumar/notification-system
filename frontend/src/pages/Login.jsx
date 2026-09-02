import {
  Bell,
  Eye,
  EyeOff,
  LockKeyhole,
  User,
  ShieldCheck,
} from "lucide-react";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { login } from "../redux/slices/authSlice";

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    loading,
    error,
  } = useSelector(
    (state) => state.auth
  );

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [formError, setFormError] =
    useState("");

  /* ==========================================================
     SUBMIT
  ========================================================== */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");

    if (!username.trim()) {
      setFormError(
        "Username is required."
      );
      return;
    }

    if (!password) {
      setFormError(
        "Password is required."
      );
      return;
    }

    const result = await dispatch(
      login({
        username: username.trim(),
        password,
      })
    );

    if (
      login.fulfilled.match(result)
    ) {
      navigate("/dashboard", {
        replace: true,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* ==================================================
            LEFT SIDE
        ================================================== */}

        <div className="hidden bg-[#111827] lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">

          <div>

            {/* BRAND */}

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <Bell size={25} />
              </div>

              <div>
                <h1 className="text-xl font-bold text-white">
                  NotifyHub
                </h1>

                <p className="mt-1 text-xs text-slate-400">
                  Notification System
                </p>
              </div>
            </div>

            {/* HERO */}

            <div className="mt-24 max-w-xl">

              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
                Admin Portal
              </p>

              <h2 className="mt-5 text-5xl font-bold leading-tight text-white">
                Manage every notification
                from one place.
              </h2>

              <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">
                Create notification triggers,
                manage templates, configure
                delivery channels, and monitor
                notification activity.
              </p>

            </div>
          </div>

          {/* SECURITY */}

          <div className="flex items-center gap-3 text-sm text-slate-400">
            <ShieldCheck
              size={18}
              className="text-emerald-400"
            />

            Secure administrator access
          </div>

        </div>

        {/* ==================================================
            RIGHT SIDE
        ================================================== */}

        <div className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">

          <div className="w-full max-w-md">

            {/* MOBILE BRAND */}

            <div className="mb-10 flex items-center justify-center gap-3 lg:hidden">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Bell size={22} />
              </div>

              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  NotifyHub
                </h1>

                <p className="text-xs text-slate-400">
                  Notification System
                </p>
              </div>

            </div>

            {/* HEADER */}

            <div className="mb-8">

              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Welcome back
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Sign in to your administrator
                account.
              </p>

            </div>

            {/* ERROR */}

            {(formError || error) && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
                {formError || error}
              </div>
            )}

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* USERNAME */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Username
                </label>

                <div className="relative">

                  <User
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={username}
                    onChange={(event) =>
                      setUsername(
                        event.target.value
                      )
                    }
                    placeholder="abhishek"
                    autoComplete="username"
                    autoFocus
                    className="w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />

                </div>

              </div>

              {/* PASSWORD */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Password
                </label>

                <div className="relative">

                  <LockKeyhole
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-11 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (value) => !value
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>

                </div>

              </div>

              {/* LOGIN BUTTON */}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {loading ? (
                  <span className="flex items-center gap-3">

                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                    Signing in...

                  </span>
                ) : (
                  "Sign in"
                )}

              </button>

            </form>

            {/* FOOTER */}

            <p className="mt-8 text-center text-xs leading-5 text-slate-400">
              Authorized administrators only.
            </p>

          </div>

        </div>

      </div>
    </div>
  );
}

export default Login;