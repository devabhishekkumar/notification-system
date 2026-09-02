import {
  Bell,
  Check,
  Mail,
  MessageCircle,
  Plus,
  Smartphone,
  Trash2,
} from "lucide-react";

import { useEffect, useState } from "react";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import NotificationTable from "../components/notifications/NotificationTable";
import TestSendModal from "../components/notifications/TestSendModal";

import {
  createTemplate,
  fetchTemplates,
  updateTemplate,
} from "../redux/slices/templateSlice";

import {
  createTrigger,
  deleteTrigger,
  fetchTriggers,
  updateTrigger,
} from "../redux/slices/triggerSlice";

import { fetchLogs } from "../redux/slices/logSlice";

import {
  clearTestSend,
  testSendNotification,
} from "../redux/slices/testSendSlice";


/* ============================================================
   PAGE
============================================================ */

function NotificationSettings() {
  const dispatch = useDispatch();
  const {
    items: templates = [],
    loading: templateLoading,
  } = useSelector((state) => state.templates);

  const [showTestSend, setShowTestSend] = useState(false);
  const [selectedTestTemplate, setSelectedTestTemplate] = useState(null);

  const {
    loading: testSendLoading,
    error: testSendError,
  } = useSelector(
    (state) =>
      state.testSend || {
        loading: false,
        error: null,
      }
  );


  const {
    items: triggers = [],
    loading = false,
    error = null,
  } = useSelector(
    (state) =>
      state.triggers || {
        items: [],
        loading: false,
        error: null,
      }
  );

  const [
    showCreate,
    setShowCreate,
  ] = useState(false);

  const [
    actionError,
    setActionError,
  ] = useState("");

  /* ==========================================================
     LOAD TRIGGERS
  ========================================================== */

  useEffect(() => {
    dispatch(fetchTriggers());
    dispatch(fetchTemplates());
  }, [dispatch]);

  /* ==========================================================
     CREATE TRIGGER
  ========================================================== */

  const handleCreate = async (data) => {
    setActionError("");

    try {
      await dispatch(
        createTrigger(data)
      ).unwrap();

      setShowCreate(false);

      /*
        Refresh the list after creation.
        This keeps the table synchronized
        with the backend.
      */
      await dispatch(
        fetchTriggers()
      ).unwrap();

    } catch (err) {
      console.error(
        "Create trigger failed:",
        err
      );

      setActionError(
        typeof err === "string"
          ? err
          : err?.message ||
              "Failed to create trigger."
      );
    }
  };

  /* ==========================================================
     TOGGLE ACTIVE / INACTIVE
  ========================================================== */

  const handleToggleTrigger = async (
    trigger
  ) => {
    setActionError("");

    try {
      await dispatch(
        updateTrigger({
          id: trigger.id,
          data: {
            is_active:
              !trigger.is_active,
          },
        })
      ).unwrap();

    } catch (err) {
      console.error(
        "Toggle trigger failed:",
        err
      );

      setActionError(
        typeof err === "string"
          ? err
          : err?.message ||
              "Failed to update trigger."
      );

      /*
        Re-fetch in case the local Redux
        state and backend state differ.
      */
      dispatch(fetchTriggers());
    }
  };

  /* ==========================================================
     DELETE
  ========================================================== */

  const handleDeleteTrigger = async (
    id
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this trigger?"
      );

    if (!confirmed) {
      return;
    }

    setActionError("");

    try {
      await dispatch(
        deleteTrigger(id)
      ).unwrap();

    } catch (err) {
      console.error(
        "Delete trigger failed:",
        err
      );

      setActionError(
        typeof err === "string"
          ? err
          : err?.message ||
              "Failed to delete trigger."
      );
    }
  };

  /* ==========================================================
     TEMPLATE ACTIONS
  ========================================================== */

  const handleCreateTemplate = async (trigger, channel) => {
    setActionError("");

    try {
      const result = await dispatch(
        createTemplate({
          trigger: trigger.id,
          channel,
          title: `${trigger.name} ${channel} Notification`,
          subject: channel === "EMAIL" ? `${trigger.name} Notification` : "",
          body: `Hello {{user_name}}, this is a ${trigger.name} notification.`,
          is_active: true,
        })
      );

      if (!createTemplate.fulfilled.match(result)) {
        throw new Error(
          typeof result.payload === "string"
            ? result.payload
            : "Failed to create template."
        );
      }

      await dispatch(fetchTemplates());
    } catch (err) {
      setActionError(err?.message || "Failed to create template.");
    }
  };

  const handleEditTemplate = (template) => {
    setSelectedTestTemplate(null);
    setActionError("Template editing is available from the Templates page.");
  };

  const handleToggleTemplate = async (template, isActive) => {
    setActionError("");

    try {
      await dispatch(
        updateTemplate({
          id: template.id,
          data: { is_active: isActive },
        })
      ).unwrap();

      await dispatch(fetchTemplates());
    } catch (err) {
      setActionError(err?.message || "Failed to update template.");
    }
  };

  const handleTestSend = async ({
    templateId,
    channel,
    recipient,
  }) => {
    setActionError("");

    try {
      const result = await dispatch(
        testSendNotification({
          templateId,
          channel,
          recipient,
        })
      ).unwrap();

      await dispatch(fetchTemplates());
      await dispatch(fetchLogs()).unwrap();

      setShowTestSend(false);
      setSelectedTestTemplate(null);
      dispatch(clearTestSend());

      alert(
        result?.message ||
          "Test notification sent successfully."
      );

      return result;
    } catch (err) {
      const message =
        typeof err === "string"
          ? err
          : err?.message ||
            testSendError ||
            "Failed to send test notification.";

      setActionError(message);
      throw new Error(message);
    }
  };

  /* ==========================================================
     ERROR
  ========================================================== */

  const displayError =
    actionError || testSendError || error;

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="mx-auto max-w-7xl">

      <PageHeader
        onCreate={() => {
          setActionError("");
          setShowCreate(true);
        }}
      />

      <ChannelSummary />

      {displayError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {displayError}
        </div>
      )}

      <NotificationTable
        triggers={triggers}
        templates={templates}
        loading={loading || templateLoading}
        onToggleTrigger={handleToggleTrigger}
        onDelete={handleDeleteTrigger}
        onCreateTemplate={handleCreateTemplate}
        onEditTemplate={handleEditTemplate}
        onToggleTemplate={handleToggleTemplate}
        onTestSend={(template) => {
          dispatch(clearTestSend());
          setActionError("");
          setSelectedTestTemplate(template);
          setShowTestSend(true);
        }}
      />

      {showTestSend && selectedTestTemplate && (
        <TestSendModal
          template={selectedTestTemplate}
          channel={selectedTestTemplate.channel}
          loading={testSendLoading}
          onClose={() => {
            if (!testSendLoading) {
              setShowTestSend(false);
              setSelectedTestTemplate(null);
              dispatch(clearTestSend());
            }
          }}
          onSend={handleTestSend}
        />
      )}

      {showCreate && (
        <CreateTriggerModal
          loading={loading}
          onClose={() => {
            if (!loading) {
              setShowCreate(false);
              setActionError("");
            }
          }}
          onSubmit={handleCreate}
        />
      )}

    </div>
  );
}


/* ============================================================
   PAGE HEADER
============================================================ */

function PageHeader({
  onCreate,
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-center">

      <div>

        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Bell size={22} />
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Notification Settings
          </h1>

        </div>

        <p className="mt-3 text-sm text-slate-500">
          Manage notification triggers and delivery channels.
        </p>

      </div>

      <button
        type="button"
        onClick={onCreate}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
      >
        <Plus size={18} />
        Create Trigger
      </button>

    </div>
  );
}


/* ============================================================
   CHANNEL SUMMARY
============================================================ */

function ChannelSummary() {
  return (
    <div className="mb-8 grid gap-5 md:grid-cols-3">

      <ChannelCard
        icon={Mail}
        name="Email"
        provider="Brevo"
      />

      <ChannelCard
        icon={MessageCircle}
        name="WhatsApp"
        provider="Twilio"
      />

      <ChannelCard
        icon={Smartphone}
        name="Web Push"
        provider="Browser Push"
      />

    </div>
  );
}


/* ============================================================
   CHANNEL CARD
============================================================ */

function ChannelCard({
  icon: Icon,
  name,
  provider,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Icon size={21} />
        </div>

        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Connected
        </span>

      </div>

      <h3 className="mt-5 font-bold text-slate-900">
        {name}
      </h3>

      <p className="mt-1 text-sm text-slate-400">
        {provider}
      </p>

    </div>
  );
}


/* ============================================================
   TRIGGER TABLE
============================================================ */

function TriggerTable({
  triggers,
  loading,
  onToggleTrigger,
  onDelete,
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      <div className="border-b border-slate-200 px-6 py-5">

        <h2 className="font-bold text-slate-900">
          Notification Triggers
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Manage the events that can send notifications.
        </p>

      </div>

      {loading ? (
        <LoadingState />
      ) : triggers.length === 0 ? (
        <EmptyTriggerState />
      ) : (
        <>
          {/* Desktop */}

          <div className="hidden overflow-x-auto lg:block">

            <table className="w-full">

              <thead>

                <tr className="border-b border-slate-200 bg-slate-50">

                  <TableHeader>
                    Trigger
                  </TableHeader>

                  <TableHeader>
                    Event Key
                  </TableHeader>

                  <TableHeader>
                    Description
                  </TableHeader>

                  <TableHeader center>
                    Status
                  </TableHeader>

                  <TableHeader center>
                    Actions
                  </TableHeader>

                </tr>

              </thead>

              <tbody>

                {triggers.map(
                  (trigger) => (
                    <TriggerRow
                      key={trigger.id}
                      trigger={trigger}
                      onToggleTrigger={
                        onToggleTrigger
                      }
                      onDelete={
                        onDelete
                      }
                    />
                  )
                )}

              </tbody>

            </table>

          </div>

          {/* Mobile */}

          <div className="divide-y divide-slate-100 lg:hidden">

            {triggers.map(
              (trigger) => (
                <MobileTriggerCard
                  key={trigger.id}
                  trigger={trigger}
                  onToggleTrigger={
                    onToggleTrigger
                  }
                  onDelete={
                    onDelete
                  }
                />
              )
            )}

          </div>
        </>
      )}

    </div>
  );
}


/* ============================================================
   TABLE HEADER
============================================================ */

function TableHeader({
  children,
  center = false,
}) {
  return (
    <th
      className={[
        "px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500",
        center
          ? "text-center"
          : "text-left",
      ].join(" ")}
    >
      {children}
    </th>
  );
}


/* ============================================================
   TRIGGER ROW
============================================================ */

function TriggerRow({
  trigger,
  onToggleTrigger,
  onDelete,
}) {
  return (
    <tr className="border-b border-slate-100 last:border-0">

      <td className="px-6 py-5">
        <p className="font-semibold text-slate-800">
          {trigger.name}
        </p>
      </td>

      <td className="px-6 py-5">
        <code className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-600">
          {trigger.event_key}
        </code>
      </td>

      <td className="max-w-sm px-6 py-5">
        <p className="truncate text-sm text-slate-500">
          {trigger.description ||
            "No description"}
        </p>
      </td>

      <td className="px-6 py-5 text-center">
        <StatusBadge
          active={trigger.is_active}
        />
      </td>

      <td className="px-6 py-5">

        <div className="flex justify-center gap-2">

          <button
            type="button"
            onClick={() =>
              onToggleTrigger(
                trigger
              )
            }
            className="rounded-lg px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50"
          >
            {trigger.is_active
              ? "Disable"
              : "Enable"}
          </button>

          <button
            type="button"
            onClick={() =>
              onDelete(
                trigger.id
              )
            }
            className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={17} />
          </button>

        </div>

      </td>

    </tr>
  );
}


/* ============================================================
   MOBILE TRIGGER
============================================================ */

function MobileTriggerCard({
  trigger,
  onToggleTrigger,
  onDelete,
}) {
  return (
    <div className="p-5">

      <div className="flex items-start justify-between gap-4">

        <div className="min-w-0">

          <h3 className="font-semibold text-slate-800">
            {trigger.name}
          </h3>

          <code className="mt-2 inline-block rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-500">
            {trigger.event_key}
          </code>

        </div>

        <StatusBadge
          active={trigger.is_active}
        />

      </div>

      <p className="mt-4 text-sm leading-6 text-slate-500">
        {trigger.description ||
          "No description"}
      </p>

      <div className="mt-5 flex gap-2">

        <button
          type="button"
          onClick={() =>
            onToggleTrigger(
              trigger
            )
          }
          className="rounded-xl bg-blue-50 px-4 py-2.5 text-xs font-semibold text-blue-600"
        >
          {trigger.is_active
            ? "Disable"
            : "Enable"}
        </button>

        <button
          type="button"
          onClick={() =>
            onDelete(
              trigger.id
            )
          }
          className="rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600"
        >
          Delete
        </button>

      </div>

    </div>
  );
}


/* ============================================================
   STATUS
============================================================ */

function StatusBadge({
  active,
}) {
  return (
    <span
      className={[
        "inline-flex rounded-full px-3 py-1.5 text-xs font-semibold",
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500",
      ].join(" ")}
    >
      {active
        ? "Active"
        : "Inactive"}
    </span>
  );
}


/* ============================================================
   LOADING
============================================================ */

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16">

      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

      <p className="mt-4 text-sm text-slate-500">
        Loading triggers...
      </p>

    </div>
  );
}


/* ============================================================
   EMPTY
============================================================ */

function EmptyTriggerState() {
  return (
    <div className="px-6 py-16 text-center">

      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Bell size={24} />
      </div>

      <h3 className="mt-5 text-lg font-semibold text-slate-800">
        No notification triggers
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        Create your first trigger to start configuring notifications.
      </p>

    </div>
  );
}


/* ============================================================
   CREATE TRIGGER MODAL
============================================================ */

function CreateTriggerModal({
  loading,
  onClose,
  onSubmit,
}) {
  const [name, setName] =
    useState("");

  const [eventKey, setEventKey] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [active, setActive] =
    useState(true);

  const [formError, setFormError] =
    useState("");

  const handleSubmit = (
    event
  ) => {
    event.preventDefault();

    setFormError("");

    if (!name.trim()) {
      setFormError(
        "Trigger name is required."
      );
      return;
    }

    if (!eventKey.trim()) {
      setFormError(
        "Event key is required."
      );
      return;
    }

    onSubmit({
      name: name.trim(),
      event_key: eventKey.trim(),
      description:
        description.trim(),
      is_active: active,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">

      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

        {/* Header */}

        <div className="border-b border-slate-200 px-6 py-5">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-lg font-bold text-slate-900">
                Create Trigger
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Add a new notification event.
              </p>

            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="text-2xl text-slate-400 hover:text-slate-700 disabled:opacity-50"
            >
              ×
            </button>

          </div>

        </div>

        {/* Form */}

        <form
          onSubmit={handleSubmit}
        >

          <div className="space-y-5 p-6">

            {formError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            <FormField label="Name">

              <input
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                placeholder="User Login"
                className={
                  inputClass
                }
              />

            </FormField>

            <FormField label="Event Key">

              <input
                value={eventKey}
                onChange={(event) =>
                  setEventKey(
                    event.target.value
                  )
                }
                placeholder="login"
                className={
                  inputClass
                }
              />

              <p className="mt-2 text-xs text-slate-400">
                Example: login, registration, job_applied
              </p>

            </FormField>

            <FormField label="Description">

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                rows={3}
                placeholder="Describe this notification event..."
                className={`${inputClass} resize-none`}
              />

            </FormField>

            <label className="flex cursor-pointer items-center gap-3">

              <input
                type="checkbox"
                checked={active}
                onChange={(event) =>
                  setActive(
                    event.target.checked
                  )
                }
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />

              <span className="text-sm font-medium text-slate-700">
                Activate trigger immediately
              </span>

            </label>

          </div>

          {/* Footer */}

          <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-5">

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Creating..."
                : "Create Trigger"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}


/* ============================================================
   FORM FIELD
============================================================ */

function FormField({
  label,
  children,
}) {
  return (
    <label className="block">

      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <div className="mt-2">
        {children}
      </div>

    </label>
  );
}


/* ============================================================
   INPUT STYLE
============================================================ */

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50";


export default NotificationSettings;