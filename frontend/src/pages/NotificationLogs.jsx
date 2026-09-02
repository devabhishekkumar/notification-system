import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCw,
  ScrollText,
  XCircle,
} from "lucide-react";

import { useEffect } from "react";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import {
  fetchLogs,
} from "../redux/slices/logSlice";


/* ============================================================
   PAGE
============================================================ */

function NotificationLogs() {
  const dispatch = useDispatch();

  const {
    items: logs = [],
    loading = false,
    error = null,
  } = useSelector(
    (state) =>
      state.logs || {
        items: [],
        loading: false,
        error: null,
      }
  );

  /* ==========================================================
     LOAD LOGS
  ========================================================== */

  useEffect(() => {
    dispatch(fetchLogs());
  }, [dispatch]);

  /* ==========================================================
     REFRESH
  ========================================================== */

  const handleRefresh = () => {
    dispatch(fetchLogs());
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="mx-auto max-w-7xl">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-center">

        <div>

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ScrollText size={22} />
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Notification Logs
            </h1>

          </div>

          <p className="mt-3 text-sm text-slate-500">
            Monitor notification delivery activity and status.
          </p>

        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={
              loading
                ? "animate-spin"
                : ""
            }
          />

          Refresh
        </button>

      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">

          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0"
          />

          <span>
            {typeof error === "string"
              ? error
              : error?.message ||
                "Failed to load notification logs."}
          </span>

        </div>
      )}

      {/* ======================================================
          STATS
      ====================================================== */}

      <LogStats logs={logs} />

      {/* ======================================================
          TABLE
      ====================================================== */}

      <LogsTable
        logs={logs}
        loading={loading}
      />

    </div>
  );
}


/* ============================================================
   STATS
============================================================ */

function LogStats({ logs = [] }) {
  const total = logs.length;

  const success = logs.filter(
    (log) =>
      getStatus(log) ===
      "SUCCESS"
  ).length;

  const failed = logs.filter(
    (log) =>
      getStatus(log) ===
      "FAILED"
  ).length;

  const pending = logs.filter(
    (log) =>
      getStatus(log) ===
      "PENDING"
  ).length;

  const stats = [
    {
      label: "Total",
      value: total,
      icon: FileText,
      className:
        "bg-blue-50 text-blue-600",
    },
    {
      label: "Successful",
      value: success,
      icon: CheckCircle2,
      className:
        "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Failed",
      value: failed,
      icon: XCircle,
      className:
        "bg-red-50 text-red-600",
    },
    {
      label: "Pending",
      value: pending,
      icon: Clock3,
      className:
        "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >

            <div className="flex items-center justify-between">

              <p className="text-sm font-medium text-slate-500">
                {stat.label}
              </p>

              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.className}`}
              >
                <Icon size={19} />
              </div>

            </div>

            <p className="mt-4 text-3xl font-bold text-slate-900">
              {stat.value}
            </p>

          </div>
        );
      })}

    </div>
  );
}


/* ============================================================
   TABLE
============================================================ */

function LogsTable({
  logs = [],
  loading = false,
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      <div className="border-b border-slate-200 px-6 py-5">

        <h2 className="font-bold text-slate-900">
          Delivery Activity
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Recent notification delivery attempts.
        </p>

      </div>

      {loading && logs.length === 0 ? (
        <LoadingState />
      ) : logs.length === 0 ? (
        <EmptyLogs />
      ) : (
        <>
          {/* ==================================================
              DESKTOP
          ================================================== */}

          <div className="hidden overflow-x-auto lg:block">

            <table className="w-full">

              <thead>

                <tr className="border-b border-slate-200 bg-slate-50">

                  <TableHeader>
                    Trigger
                  </TableHeader>

                  <TableHeader>
                    Channel
                  </TableHeader>

                  <TableHeader>
                    Recipient
                  </TableHeader>

                  <TableHeader>
                    Status
                  </TableHeader>

                  <TableHeader>
                    Message
                  </TableHeader>

                  <TableHeader>
                    Created
                  </TableHeader>

                </tr>

              </thead>

              <tbody>

                {logs.map((log) => (
                  <LogRow
                    key={log.id}
                    log={log}
                  />
                ))}

              </tbody>

            </table>

          </div>

          {/* ==================================================
              MOBILE
          ================================================== */}

          <div className="divide-y divide-slate-100 lg:hidden">

            {logs.map((log) => (
              <LogCard
                key={log.id}
                log={log}
              />
            ))}

          </div>

        </>
      )}

    </div>
  );
}


/* ============================================================
   DESKTOP ROW
============================================================ */

function LogRow({ log }) {
  const status = getStatus(log);

  return (
    <tr className="border-b border-slate-100 last:border-0">

      <td className="px-6 py-5">

        <p className="font-semibold text-slate-800">
          {log?.trigger_name ||
            log?.trigger ||
            "—"}
        </p>

      </td>

      <td className="px-6 py-5">

        <ChannelBadge
          channel={log?.channel}
        />

      </td>

      <td className="px-6 py-5">

        <p className="text-sm text-slate-700">
          {log?.recipient ||
            log?.recipient_email ||
            log?.phone_number ||
            "—"}
        </p>

      </td>

      <td className="px-6 py-5">

        <StatusBadge
          status={status}
        />

      </td>

      <td className="max-w-sm px-6 py-5">

        <p className="truncate text-sm text-slate-500">
          {log?.message ||
            log?.body ||
            log?.subject ||
            "—"}
        </p>

      </td>

      <td className="px-6 py-5">

        <p className="whitespace-nowrap text-sm text-slate-500">
          {formatDate(
            log?.created_at
          )}
        </p>

      </td>

    </tr>
  );
}


/* ============================================================
   MOBILE CARD
============================================================ */

function LogCard({ log }) {
  const status = getStatus(log);

  return (
    <div className="p-5">

      <div className="flex items-start justify-between gap-4">

        <div className="min-w-0">

          <p className="font-semibold text-slate-800">
            {log?.trigger_name ||
              log?.trigger ||
              "Notification"}
          </p>

          <div className="mt-2">

            <ChannelBadge
              channel={log?.channel}
            />

          </div>

        </div>

        <StatusBadge
          status={status}
        />

      </div>

      <div className="mt-5 space-y-3">

        <div>

          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Recipient
          </p>

          <p className="mt-1 text-sm text-slate-700">
            {log?.recipient ||
              log?.recipient_email ||
              log?.phone_number ||
              "—"}
          </p>

        </div>

        <div>

          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Message
          </p>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            {log?.message ||
              log?.body ||
              log?.subject ||
              "—"}
          </p>

        </div>

        <div>

          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Created
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {formatDate(
              log?.created_at
            )}
          </p>

        </div>

      </div>

    </div>
  );
}


/* ============================================================
   TABLE HEADER
============================================================ */

function TableHeader({
  children,
}) {
  return (
    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
      {children}
    </th>
  );
}


/* ============================================================
   CHANNEL BADGE
============================================================ */

function ChannelBadge({
  channel,
}) {
  const value =
    String(
      channel || "UNKNOWN"
    ).toUpperCase();

  const config = {
    EMAIL: {
      label: "Email",
      className:
        "bg-blue-50 text-blue-600",
    },

    WHATSAPP: {
      label: "WhatsApp",
      className:
        "bg-emerald-50 text-emerald-600",
    },

    WEB_PUSH: {
      label: "Web Push",
      className:
        "bg-violet-50 text-violet-600",
    },
  };

  const item =
    config[value] || {
      label: channel || "Unknown",
      className:
        "bg-slate-100 text-slate-600",
    };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${item.className}`}
    >
      {item.label}
    </span>
  );
}


/* ============================================================
   STATUS BADGE
============================================================ */

function StatusBadge({
  status,
}) {
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
      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${item.className}`}
    >
      {item.label}
    </span>
  );
}


/* ============================================================
   STATUS NORMALIZER
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
    Django NotificationLog uses:
      PENDING
      SENT
      FAILED

    The UI represents SENT as SUCCESS.
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


/* ============================================================
   DATE
============================================================ */

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleString();
}


/* ============================================================
   LOADING
============================================================ */

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16">

      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

      <p className="mt-4 text-sm text-slate-500">
        Loading notification logs...
      </p>

    </div>
  );
}


/* ============================================================
   EMPTY
============================================================ */

function EmptyLogs() {
  return (
    <div className="px-6 py-16 text-center">

      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <ScrollText size={24} />
      </div>

      <h3 className="mt-5 text-lg font-semibold text-slate-800">
        No notification logs
      </h3>

      <p className="mt-2 text-sm text-slate-500">
        Notification delivery activity will appear here.
      </p>

    </div>
  );
}


export default NotificationLogs;