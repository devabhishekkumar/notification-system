import {
  Activity,
  ArrowRight,
  Bell,
  CheckCircle2,
  FileText,
  Mail,
  MessageCircle,
  Plus,
  ScrollText,
  Settings,
  Smartphone,
  XCircle,
} from "lucide-react";

import { useEffect } from "react";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import { useNavigate } from "react-router-dom";

import {
  fetchTriggers,
} from "../redux/slices/triggerSlice";

import {
  fetchTemplates,
} from "../redux/slices/templateSlice";

import {
  fetchLogs,
} from "../redux/slices/logSlice";


function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  /* ==========================================================
     REDUX STATE
  ========================================================== */

  const {
    items: triggers = [],
    loading: triggerLoading,
    error: triggerError,
  } = useSelector(
    (state) =>
      state.triggers || {
        items: [],
        loading: false,
        error: null,
      }
  );

  const {
    items: templates = [],
    loading: templateLoading,
    error: templateError,
  } = useSelector(
    (state) =>
      state.templates || {
        items: [],
        loading: false,
        error: null,
      }
  );

  const {
    items: logs = [],
    loading: logLoading,
    error: logError,
  } = useSelector(
    (state) =>
      state.logs || {
        items: [],
        loading: false,
        error: null,
      }
  );

  /* ==========================================================
     LOAD DASHBOARD DATA
  ========================================================== */

  useEffect(() => {
    dispatch(fetchTriggers());
    dispatch(fetchTemplates());
    dispatch(fetchLogs());
  }, [dispatch]);

  /* ==========================================================
     COUNTS
  ========================================================== */

  const activeTriggers = triggers.filter(
    (trigger) =>
      Boolean(trigger?.is_active)
  ).length;

  const activeTemplates = templates.filter(
    (template) =>
      Boolean(template?.is_active)
  ).length;

  const successfulLogs = logs.filter(
    (log) =>
      getStatus(log) === "SUCCESS"
  ).length;

  const failedLogs = logs.filter(
    (log) =>
      getStatus(log) === "FAILED"
  ).length;

  const pendingLogs = logs.filter(
    (log) =>
      getStatus(log) === "PENDING"
  ).length;

  const totalLogs = logs.length;

  const successRate =
    totalLogs > 0
      ? Math.round(
          (successfulLogs / totalLogs) *
            100
        )
      : 0;

  const loading =
    triggerLoading ||
    templateLoading ||
    logLoading;

  const error =
    triggerError ||
    templateError ||
    logError;

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="mx-auto max-w-7xl">

      {/* HEADER */}

      <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-center">

        <div>
          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Activity size={22} />
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Dashboard
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Overview of your notification system.
              </p>
            </div>

          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate("/templates")
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Create Template
        </button>

      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          <XCircle
            size={18}
            className="mt-0.5 shrink-0"
          />

          <div>{error}</div>
        </div>
      )}

      {/* LOADING */}

      {loading && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-700">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />

          Loading dashboard data...
        </div>
      )}

      {/* STATS */}

      <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          label="Active Triggers"
          value={activeTriggers}
          icon={Bell}
          iconClass="bg-blue-50 text-blue-600"
          onClick={() =>
            navigate("/settings")
          }
        />

        <StatCard
          label="Active Templates"
          value={activeTemplates}
          icon={FileText}
          iconClass="bg-violet-50 text-violet-600"
          onClick={() =>
            navigate("/templates")
          }
        />

        <StatCard
          label="Successful"
          value={successfulLogs}
          icon={CheckCircle2}
          iconClass="bg-emerald-50 text-emerald-600"
          onClick={() =>
            navigate("/logs")
          }
        />

        <StatCard
          label="Failed"
          value={failedLogs}
          icon={XCircle}
          iconClass="bg-red-50 text-red-600"
          onClick={() =>
            navigate("/logs")
          }
        />

      </div>

      {/* DELIVERY + CHANNELS */}

      <div className="grid gap-6 xl:grid-cols-3">

        {/* DELIVERY */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">

            <div>
              <h2 className="font-bold text-slate-900">
                Delivery Overview
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Current notification delivery performance.
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-emerald-600">
                {successRate}%
              </p>

              <p className="text-[11px] font-medium text-emerald-600">
                Success rate
              </p>
            </div>

          </div>

          <div className="mt-8">

            <div className="mb-2 flex items-center justify-between">

              <span className="text-sm font-medium text-slate-600">
                Successful deliveries
              </span>

              <span className="text-sm font-semibold text-slate-800">
                {successfulLogs} / {totalLogs}
              </span>

            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{
                  width: `${successRate}%`,
                }}
              />
            </div>

          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">

            <DeliveryCard
              icon={CheckCircle2}
              label="Successful"
              value={successfulLogs}
              className="bg-emerald-50 text-emerald-600"
            />

            <DeliveryCard
              icon={XCircle}
              label="Failed"
              value={failedLogs}
              className="bg-red-50 text-red-600"
            />

            <DeliveryCard
              icon={Activity}
              label="Pending"
              value={pendingLogs}
              className="bg-amber-50 text-amber-600"
            />

          </div>

        </div>

        {/* CHANNELS */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="font-bold text-slate-900">
            Channels
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Configured notification channels.
          </p>

          <div className="mt-6 space-y-4">

            <ChannelItem
              icon={Mail}
              label="Email"
              count={getTemplateCount(
                templates,
                "EMAIL"
              )}
              className="bg-blue-50 text-blue-600"
            />

            <ChannelItem
              icon={MessageCircle}
              label="WhatsApp"
              count={getTemplateCount(
                templates,
                "WHATSAPP"
              )}
              className="bg-emerald-50 text-emerald-600"
            />

            <ChannelItem
              icon={Smartphone}
              label="Web Push"
              count={getTemplateCount(
                templates,
                "WEB_PUSH"
              )}
              className="bg-violet-50 text-violet-600"
            />

          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/templates")
            }
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Manage Templates
            <ArrowRight size={16} />
          </button>

        </div>

      </div>

      {/* RECENT ACTIVITY + QUICK ACTIONS */}

      <div className="mt-6 grid gap-6 xl:grid-cols-3">

        {/* RECENT ACTIVITY */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">

          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

            <div>
              <h2 className="font-bold text-slate-900">
                Recent Activity
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Latest notification delivery attempts.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/logs")
              }
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View all
              <ArrowRight size={15} />
            </button>

          </div>

          {logs.length === 0 ? (
            <EmptyActivity />
          ) : (
            <div className="divide-y divide-slate-100">

              {logs
                .slice(0, 5)
                .map((log) => (
                  <RecentLog
                    key={log.id}
                    log={log}
                  />
                ))}

            </div>
          )}

        </div>

        {/* QUICK ACTIONS */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="font-bold text-slate-900">
            Quick Actions
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage your notification system.
          </p>

          <div className="mt-6 space-y-3">

            <QuickAction
              icon={Plus}
              title="Create Template"
              description="Create a new notification"
              onClick={() =>
                navigate("/templates")
              }
            />

            <QuickAction
              icon={Settings}
              title="Notification Settings"
              description="Manage notification triggers"
              onClick={() =>
                navigate("/settings")
              }
            />

            <QuickAction
              icon={ScrollText}
              title="View Logs"
              description="Check delivery activity"
              onClick={() =>
                navigate("/logs")
              }
            />

          </div>

        </div>

      </div>

    </div>
  );
}


/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  label,
  value,
  icon: Icon,
  iconClass,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center justify-between">

        <p className="text-sm font-medium text-slate-500">
          {label}
        </p>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={19} />
        </div>

      </div>

      <p className="mt-4 text-3xl font-bold text-slate-900">
        {value}
      </p>
    </button>
  );
}


/* ============================================================
   DELIVERY CARD
============================================================ */

function DeliveryCard({
  icon: Icon,
  label,
  value,
  className,
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-100 p-4">

      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${className}`}
      >
        <Icon size={19} />
      </div>

      <div>
        <p className="text-xs font-medium text-slate-500">
          {label}
        </p>

        <p className="mt-1 text-xl font-bold text-slate-900">
          {value}
        </p>
      </div>

    </div>
  );
}


/* ============================================================
   CHANNEL ITEM
============================================================ */

function ChannelItem({
  icon: Icon,
  label,
  count,
  className,
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 p-3">

      <div className="flex items-center gap-3">

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${className}`}
        >
          <Icon size={18} />
        </div>

        <span className="text-sm font-semibold text-slate-700">
          {label}
        </span>

      </div>

      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
        {count}
      </span>

    </div>
  );
}


/* ============================================================
   RECENT LOG
============================================================ */

function RecentLog({ log }) {
  const status = getStatus(log);

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4">

      <div className="min-w-0">

        <p className="truncate text-sm font-semibold text-slate-800">
          {log?.trigger_name ||
            log?.trigger ||
            "Notification"}
        </p>

        <p className="mt-1 truncate text-xs text-slate-500">
          {log?.recipient ||
            log?.recipient_email ||
            log?.phone_number ||
            "Unknown recipient"}
        </p>

      </div>

      <StatusBadge status={status} />

    </div>
  );
}


/* ============================================================
   QUICK ACTION
============================================================ */

function QuickAction({
  icon: Icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/50"
    >

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon size={18} />
      </div>

      <div className="min-w-0">

        <p className="text-sm font-semibold text-slate-800">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>

      </div>

      <ArrowRight
        size={16}
        className="ml-auto shrink-0 text-slate-400"
      />

    </button>
  );
}


/* ============================================================
   STATUS BADGE
============================================================ */

function StatusBadge({ status }) {
  const config = {
    SUCCESS: {
      label: "Success",
      className:
        "bg-emerald-50 text-emerald-700",
    },

    FAILED: {
      label: "Failed",
      className:
        "bg-red-50 text-red-700",
    },

    PENDING: {
      label: "Pending",
      className:
        "bg-amber-50 text-amber-700",
    },

    UNKNOWN: {
      label: "Unknown",
      className:
        "bg-slate-100 text-slate-600",
    },
  };

  const item =
    config[status] ||
    config.UNKNOWN;

  return (
    <span
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${item.className}`}
    >
      {item.label}
    </span>
  );
}


/* ============================================================
   EMPTY ACTIVITY
============================================================ */

function EmptyActivity() {
  return (
    <div className="px-6 py-14 text-center">

      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <ScrollText size={24} />
      </div>

      <h3 className="mt-5 text-sm font-semibold text-slate-800">
        No notification activity
      </h3>

      <p className="mt-2 text-sm text-slate-500">
        Notification delivery activity will appear here.
      </p>

    </div>
  );
}


/* ============================================================
   HELPERS
============================================================ */

function getStatus(log) {
  const value =
    log?.status ||
    log?.delivery_status ||
    log?.state ||
    "";

  const normalized =
    String(value).toUpperCase();

  /*
    Backend returns SENT.
    Dashboard displays it as SUCCESS.
  */

  if (
    [
      "SUCCESS",
      "SENT",
      "DELIVERED",
      "COMPLETED",
    ].includes(normalized)
  ) {
    return "SUCCESS";
  }

  if (
    [
      "FAILED",
      "FAILURE",
      "ERROR",
      "BOUNCED",
    ].includes(normalized)
  ) {
    return "FAILED";
  }

  if (
    [
      "PENDING",
      "QUEUED",
      "PROCESSING",
    ].includes(normalized)
  ) {
    return "PENDING";
  }

  return "UNKNOWN";
}


function getTemplateCount(
  templates,
  channel
) {
  return templates.filter(
    (template) =>
      String(
        template?.channel || ""
      ).toUpperCase() === channel
  ).length;
}


export default Dashboard;