function NotificationTable({
  triggers,
  templates = [],
  loading,
  onToggleTrigger,
  onDelete,
  onCreateTemplate,
  onEditTemplate,
  onToggleTemplate,
  onTestSend,
}) {
  const getTemplate = (triggerId, channel) => {
    return (
      templates.find(
        (template) =>
          Number(template.trigger) === Number(triggerId) &&
          template.channel === channel
      ) || null
    );
  };

  const ChannelCell = ({ trigger, channel }) => {
    const template = getTemplate(trigger.id, channel);

    if (!template) {
      return (
        <td className="px-4 py-5 align-top">
          <button
            type="button"
            onClick={() => onCreateTemplate?.(trigger, channel)}
            disabled={!trigger.is_active}
            className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            + Create Template
          </button>
        </td>
      );
    }

    return (
      <td className="px-4 py-5 align-top">
        <div className="min-w-[180px] space-y-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {template.title ||
                template.subject ||
                "Template"}
            </p>

            <p className="mt-1 line-clamp-2 text-xs text-slate-500">
              {template.body}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              onToggleTemplate?.(
                template,
                !template.is_active
              )
            }
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              template.is_active
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {template.is_active ? "ON" : "OFF"}
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onEditTemplate?.(template)}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Edit
            </button>

            <button
              type="button"
              onClick={() => onTestSend?.(template)}
              disabled={!template.is_active}
              className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Test
            </button>
          </div>
        </div>
      </td>
    );
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm text-slate-500">
          Loading notification triggers...
        </p>
      </div>
    );
  }

  if (!triggers?.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="font-semibold text-slate-900">
          No notification triggers
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Create a trigger to configure notifications.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="font-bold text-slate-900">
          Notification Triggers
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Manage notification templates and channels.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1250px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                Trigger
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                Event Key
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                WhatsApp
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                Email
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                Web Push
              </th>

              <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-slate-500">
                Status
              </th>

              <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-slate-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {triggers.map((trigger) => (
              <tr
                key={trigger.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
              >
                <td className="px-4 py-5 align-top">
                  <p className="font-semibold text-slate-900">
                    {trigger.name}
                  </p>

                  {trigger.description && (
                    <p className="mt-1 max-w-[200px] text-xs text-slate-500">
                      {trigger.description}
                    </p>
                  )}
                </td>

                <td className="px-4 py-5 align-top">
                  <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
                    {trigger.event_key}
                  </code>
                </td>

                <ChannelCell
                  trigger={trigger}
                  channel="WHATSAPP"
                />

                <ChannelCell
                  trigger={trigger}
                  channel="EMAIL"
                />

                <ChannelCell
                  trigger={trigger}
                  channel="WEB_PUSH"
                />

                <td className="px-4 py-5 text-center align-top">
                  <button
                    type="button"
                    onClick={() =>
                      onToggleTrigger?.(
                        trigger,
                        !trigger.is_active
                      )
                    }
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      trigger.is_active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {trigger.is_active
                      ? "Active"
                      : "Inactive"}
                  </button>
                </td>

                <td className="px-4 py-5 text-center align-top">
                  <div className="flex flex-col items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onToggleTrigger?.(
                          trigger,
                          !trigger.is_active
                        )
                      }
                      className="text-xs font-medium text-slate-600 hover:text-slate-900"
                    >
                      {trigger.is_active
                        ? "Disable"
                        : "Enable"}
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete?.(trigger)}
                      className="text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default NotificationTable;