import { useEffect } from "react";
import TemplateForm from "./TemplateForm";

function TemplateModal({
  template,
  triggers = [],
  templates = [],
  loading = false,
  onClose,
  onCreate,
  onUpdate,
}) {
  const isEdit = Boolean(template?.id);

  // Close modal with Escape
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

  // Close when clicking backdrop
  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && !loading) {
      onClose?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-modal-title"
      onMouseDown={handleBackdropClick}
    >
      <div
        className="my-8 w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2
              id="template-modal-title"
              className="text-lg font-bold text-slate-900"
            >
              {isEdit ? "Edit Template" : "Create Template"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {isEdit
                ? "Update the notification message and variables."
                : "Configure the notification message and variables."}
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

        {/* FORM */}
        <TemplateForm
          template={template}
          triggers={triggers}
          templates={templates}
          loading={loading}
          onClose={onClose}
          onCreate={async (data, variables) => {
            await onCreate?.(data, variables);
          }}
          onUpdate={async (
            templateId,
            data,
            variables,
            deletedVariableIds
          ) => {
            await onUpdate?.(
              templateId,
              data,
              variables,
              deletedVariableIds
            );
          }}
        />
      </div>
    </div>
  );
}

export default TemplateModal;