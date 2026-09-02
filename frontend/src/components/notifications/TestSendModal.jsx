import { useEffect, useState } from "react";

const CHANNEL_CONFIG = {
  WHATSAPP: {
    label: "WhatsApp",
    icon: "💬",
    recipientLabel: "WhatsApp Number",
    placeholder: "+919XXXXXXXXX",
    type: "tel",
  },
  EMAIL: {
    label: "Email",
    icon: "✉️",
    recipientLabel: "Email Address",
    placeholder: "example@gmail.com",
    type: "email",
  },
  WEB_PUSH: {
    label: "Web Push",
    icon: "🔔",
    recipientLabel: "Push Recipient",
    placeholder: "Current subscribed browser",
    type: "text",
  },
};

function TestSendModal({
  template,
  channel,
  loading = false,
  onClose,
  onSend,
}) {
  const [recipient, setRecipient] = useState("");
  const [error, setError] = useState("");

  const config = CHANNEL_CONFIG[channel] || {
    label: channel || "Notification",
    icon: "🔔",
    recipientLabel: "Recipient",
    placeholder: "Enter recipient",
    type: "text",
  };

  useEffect(() => {
    setError("");

    if (channel === "WEB_PUSH") {
      setRecipient("current-browser");
    } else {
      setRecipient("");
    }
  }, [channel, template]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !loading) {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [loading, onClose]);

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && !loading) {
      onClose?.();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!template?.id) {
      setError("Template not found.");
      return;
    }

    if (channel !== "WEB_PUSH" && !recipient.trim()) {
      setError(`Please enter a ${config.recipientLabel.toLowerCase()}.`);
      return;
    }

    try {
      await onSend?.({
        templateId: template.id,
        channel,
        recipient:
          channel === "WEB_PUSH" ? null : recipient.trim(),
      });
    } catch (err) {
      setError(
        err?.message ||
          "Unable to send the test notification."
      );
    }
  };

  const title = template?.title || template?.subject || "Notification Template";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="test-send-modal-title"
      onMouseDown={handleBackdropClick}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2
              id="test-send-modal-title"
              className="text-lg font-bold text-slate-900"
            >
              Send Test Notification
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Test your {config.label} notification template.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close modal"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-2xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-6 py-6">
            {/* Channel */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                  {config.icon}
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {config.label}
                  </p>

                  <p className="text-xs text-slate-500">
                    Test channel
                  </p>
                </div>
              </div>
            </div>

            {/* Template */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Template
              </label>

              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="font-medium text-slate-900">
                  {title}
                </p>

                {template?.body && (
                  <p className="mt-1 line-clamp-3 text-sm text-slate-500">
                    {template.body}
                  </p>
                )}
              </div>
            </div>

            {/* Recipient */}
            {channel === "WEB_PUSH" ? (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Recipient
                </label>

                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  This test will be sent to the current browser's
                  active Web Push subscription.
                </div>
              </div>
            ) : (
              <div>
                <label
                  htmlFor="test-recipient"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  {config.recipientLabel}
                </label>

                <input
                  id="test-recipient"
                  type={config.type}
                  value={recipient}
                  onChange={(event) =>
                    setRecipient(event.target.value)
                  }
                  placeholder={config.placeholder}
                  disabled={loading}
                  autoFocus
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                />

                {channel === "WHATSAPP" && (
                  <p className="mt-2 text-xs text-slate-500">
                    Enter the number in international format,
                    for example +919XXXXXXXXX.
                  </p>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Warning */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
              This sends a real test notification through the
              configured provider. Sandbox restrictions may apply.
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Test"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TestSendModal;