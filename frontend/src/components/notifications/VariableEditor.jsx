import { Plus, Trash2 } from "lucide-react";

function VariableEditor({
  variables = [],
  onChange,
}) {
  const addVariable = () => {
    onChange([
      ...variables,
      {
        name: "",
        default_value: "",
        description: "",
      },
    ]);
  };

  const updateVariable = (
    index,
    field,
    value
  ) => {
    if (
      !["name", "default_value", "description"].includes(
        field
      )
    ) {
      return;
    }

    const updatedVariables = variables.map(
      (variable, variableIndex) =>
        variableIndex === index
          ? {
              ...variable,
              [field]: value,
            }
          : variable
    );

    onChange(updatedVariables);
  };

  const removeVariable = (index) => {
    onChange(
      variables.filter(
        (_, variableIndex) =>
          variableIndex !== index
      )
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">
            Variables
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Add values that can change for each message.
          </p>
        </div>

        <button
          type="button"
          onClick={addVariable}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus size={15} />
          Add Variable
        </button>
      </div>

      {/* Empty */}
      {variables.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
          <p className="text-sm font-medium text-slate-600">
            No variables added
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Example: user_name, job_title
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {variables.map(
            (variable, index) => (
              <div
                key={
                  variable.id ||
                  `variable-${index}`
                }
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                {/* Variable header */}
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Variable {index + 1}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      removeVariable(index)
                    }
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    aria-label={`Remove variable ${
                      index + 1
                    }`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Fields */}
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor={`variable-name-${index}`}
                      className="mb-2 block text-xs font-semibold text-slate-600"
                    >
                      Name
                    </label>

                    <input
                      id={`variable-name-${index}`}
                      type="text"
                      value={
                        variable.name ?? ""
                      }
                      onChange={(event) =>
                        updateVariable(
                          index,
                          "name",
                          event.target.value
                        )
                      }
                      placeholder="user_name"
                      autoComplete="off"
                      className={inputClass}
                    />
                  </div>

                  {/* Default Value */}
                  <div>
                    <label
                      htmlFor={`variable-default-${index}`}
                      className="mb-2 block text-xs font-semibold text-slate-600"
                    >
                      Value
                    </label>

                    <input
                      id={`variable-default-${index}`}
                      type="text"
                      value={
                        variable.default_value ??
                        ""
                      }
                      onChange={(event) =>
                        updateVariable(
                          index,
                          "default_value",
                          event.target.value
                        )
                      }
                      placeholder="Abhishek"
                      autoComplete="off"
                      className={inputClass}
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label
                      htmlFor={`variable-description-${index}`}
                      className="mb-2 block text-xs font-semibold text-slate-600"
                    >
                      Description
                    </label>

                    <input
                      id={`variable-description-${index}`}
                      type="text"
                      value={
                        variable.description ??
                        ""
                      }
                      onChange={(event) =>
                        updateVariable(
                          index,
                          "description",
                          event.target.value
                        )
                      }
                      placeholder="Name of the applicant"
                      autoComplete="off"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Simple preview */}
                {variable.name?.trim() && (
                  <div className="mt-4 rounded-lg bg-blue-50 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Variable
                    </p>

                    <p className="mt-1 text-sm font-semibold text-blue-600">
                      {variable.name.trim()}
                    </p>

                    {variable.default_value?.trim() && (
                      <p className="mt-1 text-xs text-slate-500">
                        Value:{" "}
                        <span className="font-medium text-slate-700">
                          {
                            variable.default_value
                          }
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50";

export default VariableEditor;