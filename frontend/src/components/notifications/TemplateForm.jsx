import {
  Mail,
  MessageCircle,
  Smartphone,
  Plus,
  Trash2,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-50";

const channelConfig = {
  EMAIL: {
    label: "Email",
    icon: Mail,
  },

  WHATSAPP: {
    label: "WhatsApp",
    icon: MessageCircle,
  },

  WEB_PUSH: {
    label: "Web Push",
    icon: Smartphone,
  },
};

function TemplateForm({
  template = null,
  triggers = [],
  templates = [],
  loading = false,
  onClose,
  onCreate,
  onUpdate,
}) {
  const [trigger, setTrigger] = useState("");
  const [channel, setChannel] = useState("EMAIL");
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [active, setActive] = useState(true);

  const [variables, setVariables] = useState([]);
  const [deletedVariableIds, setDeletedVariableIds] = useState([]);

  const [formError, setFormError] = useState("");

  const isEdit = Boolean(template?.id);

  /*
   * ============================================================
   * LOAD / RESET FORM
   * ============================================================
   */

  useEffect(() => {
    if (!template) {
      setTrigger("");
      setChannel("EMAIL");
      setSubject("");
      setTitle("");
      setBody("");
      setActive(true);
      setVariables([]);
      setDeletedVariableIds([]);
      setFormError("");

      return;
    }

    setTrigger(
      template.trigger ??
        template.trigger_id ??
        ""
    );

    setChannel(
      template.channel ||
        "EMAIL"
    );

    setSubject(
      template.subject || ""
    );

    setTitle(
      template.title || ""
    );

    setBody(
      template.body || ""
    );

    setActive(
      template.is_active ??
        true
    );

    /*
     * Convert backend variable format:
     *
     * variable_name
     * variable_value
     *
     * into the local form format.
     */
    setVariables(
      Array.isArray(template.variables)
        ? template.variables.map((item) => ({
            id: item.id,

            name:
              item.variable_name ||
              item.name ||
              "",

            default_value:
              item.variable_value ??
              item.default_value ??
              "",

            description:
              item.description ||
              "",
          }))
        : []
    );

    setDeletedVariableIds([]);
    setFormError("");
  }, [template]);


  /*
   * ============================================================
   * DUPLICATE CHECK
   * ============================================================
   */

  const isChannelAlreadyUsed = (channelValue) => {
    if (!trigger) {
      return false;
    }

    return templates.some(
      (item) =>
        String(item.trigger) ===
          String(trigger) &&
        String(item.channel).toUpperCase() ===
          String(channelValue).toUpperCase() &&
        String(item.id) !==
          String(template?.id)
    );
  };


  /*
   * ============================================================
   * ADD VARIABLE
   * ============================================================
   */

  const addVariable = () => {
    setVariables((current) => [
      ...current,
      {
        name: "",
        default_value: "",
        description: "",
      },
    ]);
  };


  /*
   * ============================================================
   * UPDATE VARIABLE
   * ============================================================
   */

  const updateVariable = (
    index,
    field,
    value
  ) => {
    setVariables((current) =>
      current.map(
        (variable, variableIndex) =>
          variableIndex === index
            ? {
                ...variable,
                [field]: value,
              }
            : variable
      )
    );
  };


  /*
   * ============================================================
   * DELETE VARIABLE
   * ============================================================
   */

  const handleDeleteVariable = (index) => {
    const variable = variables[index];

    /*
     * Existing backend variable:
     * remember its ID so the parent can delete it.
     */
    if (variable?.id) {
      setDeletedVariableIds((current) => {
        if (current.includes(variable.id)) {
          return current;
        }

        return [
          ...current,
          variable.id,
        ];
      });
    }

    /*
     * Remove from local form.
     */
    setVariables((current) =>
      current.filter(
        (_, variableIndex) =>
          variableIndex !== index
      )
    );
  };


  /*
   * ============================================================
   * CHANGE TRIGGER
   * ============================================================
   */

  const handleTriggerChange = (event) => {
    const newTrigger =
      event.target.value;

    setTrigger(newTrigger);
    setFormError("");

    /*
     * Automatically select the first
     * channel which doesn't already
     * have a template.
     */
    const availableChannel =
      Object.keys(channelConfig).find(
        (channelValue) =>
          !templates.some(
            (item) =>
              String(item.trigger) ===
                String(newTrigger) &&
              String(item.channel).toUpperCase() ===
                String(channelValue).toUpperCase() &&
              String(item.id) !==
                String(template?.id)
          )
      );

    if (availableChannel) {
      setChannel(availableChannel);
    }
  };


  /*
   * ============================================================
   * CHANGE CHANNEL
   * ============================================================
   */

  const handleChannelChange = (channelValue) => {
    if (loading) {
      return;
    }

    if (
      isChannelAlreadyUsed(channelValue)
    ) {
      setFormError(
        `A ${
          channelConfig[channelValue]?.label ||
          channelValue
        } template already exists for this trigger.`
      );

      return;
    }

    setChannel(channelValue);
    setFormError("");
  };


  /*
   * ============================================================
   * INSERT VARIABLE
   * ============================================================
   */

  const insertVariable = (variableName) => {
    if (!variableName) {
      return;
    }

    const variableText =
      `{{${variableName}}}`;

    setBody((current) =>
      `${current}${current ? " " : ""}${variableText}`
    );
  };


  /*
   * ============================================================
   * VALIDATE VARIABLES
   * ============================================================
   */

  const validateVariables = () => {
    const names = variables
      .map(
        (variable) =>
          variable?.name
            ?.trim()
            .toLowerCase()
      )
      .filter(Boolean);

    const duplicates = names.filter(
      (name, index) =>
        names.indexOf(name) !== index
    );

    if (duplicates.length > 0) {
      return "Variable names must be unique.";
    }

    for (const variable of variables) {
      const name =
        variable?.name?.trim();

      /*
       * Empty variable rows are allowed
       * and will not be sent to backend.
       */
      if (!name) {
        continue;
      }

      if (
        !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(
          name
        )
      ) {
        return `Invalid variable name "${name}". Use letters, numbers, and underscores only.`;
      }
    }

    return "";
  };


  /*
   * ============================================================
   * SUBMIT
   * ============================================================
   */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setFormError("");


    /*
     * TRIGGER
     */
    if (!trigger) {
      setFormError(
        "Please select a trigger."
      );

      return;
    }


    /*
     * CHANNEL
     */
    if (!channel) {
      setFormError(
        "Please select a channel."
      );

      return;
    }


    /*
     * DUPLICATE
     */
    if (
      isChannelAlreadyUsed(channel)
    ) {
      const channelName =
        channelConfig[channel]?.label ||
        channel;

      setFormError(
        `A ${channelName} template already exists for this trigger. Please edit the existing template instead.`
      );

      return;
    }


    /*
     * MESSAGE
     */
    if (!body.trim()) {
      setFormError(
        "Message is required."
      );

      return;
    }


    /*
     * EMAIL SUBJECT
     */
    if (
      channel === "EMAIL" &&
      !subject.trim()
    ) {
      setFormError(
        "Email subject is required."
      );

      return;
    }


    /*
     * WEB PUSH TITLE
     */
    if (
      channel === "WEB_PUSH" &&
      !title.trim()
    ) {
      setFormError(
        "Web Push title is required."
      );

      return;
    }


    /*
     * VARIABLES
     */
    const variableError =
      validateVariables();

    if (variableError) {
      setFormError(variableError);
      return;
    }


    /*
     * TEMPLATE DATA
     */
    const data = {
      trigger,
      channel,

      subject:
        channel === "EMAIL"
          ? subject.trim()
          : "",

      title:
        channel === "WEB_PUSH"
          ? title.trim()
          : "",

      body: body.trim(),

      is_active: active,
    };


    /*
     * ============================================================
     * IMPORTANT
     *
     * Convert frontend variable fields:
     *
     * name
     * default_value
     *
     * into backend fields:
     *
     * variable_name
     * variable_value
     * ============================================================
     */

    const cleanVariables = variables
      .filter(
        (variable) =>
          variable?.name?.trim()
      )
      .map((variable) => ({
        ...(variable.id
          ? {
              id: variable.id,
            }
          : {}),

        variable_name:
          variable.name.trim(),

        variable_value:
          variable.default_value
            ?.trim() || "",

        description:
          variable.description
            ?.trim() || "",
      }));


    /*
     * ============================================================
     * SAVE
     * ============================================================
     */

    try {
      if (isEdit) {
        await onUpdate(
          template.id,
          data,
          cleanVariables,
          deletedVariableIds
        );

        return;
      }

      await onCreate(
        data,
        cleanVariables
      );
    } catch (error) {
      console.error(
        "Template form submit failed:",
        error
      );

      setFormError(
        error?.message ||
          "Failed to save template."
      );
    }
  };


  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <form
      onSubmit={handleSubmit}
      className="flex max-h-[85vh] flex-col"
    >

      {/* BODY */}
      <div className="flex-1 space-y-6 overflow-y-auto p-6">

        {/* ERROR */}
        {formError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {formError}
          </div>
        )}


        {/* TRIGGER */}
        <FormField label="Trigger">
          <select
            value={trigger}
            onChange={handleTriggerChange}
            className={inputClass}
            disabled={
              loading ||
              triggers.length === 0
            }
          >
            <option value="">
              Select a trigger
            </option>

            {triggers
              .filter(
                (item) =>
                  item.is_active ||
                  String(item.id) ===
                    String(trigger)
              )
              .map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </option>
              ))}
          </select>

          {triggers.length === 0 && (
            <p className="mt-2 text-xs text-amber-600">
              No triggers available.
              Create a trigger first.
            </p>
          )}
        </FormField>


        {/* CHANNEL */}
        <FormField label="Channel">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

            {Object.entries(channelConfig).map(
              ([value, config]) => {
                const Icon =
                  config.icon;

                const selected =
                  channel === value;

                const alreadyUsed =
                  isChannelAlreadyUsed(
                    value
                  );

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      handleChannelChange(
                        value
                      )
                    }
                    disabled={
                      loading ||
                      alreadyUsed
                    }
                    className={[
                      "relative flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition",

                      selected
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",

                      alreadyUsed
                        ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-60"
                        : "",

                      loading
                        ? "cursor-not-allowed opacity-60"
                        : "",
                    ].join(" ")}
                  >
                    <Icon size={18} />

                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">
                        {config.label}
                      </span>

                      {alreadyUsed && (
                        <span className="mt-0.5 text-[10px] font-medium text-red-500">
                          Already exists
                        </span>
                      )}
                    </div>
                  </button>
                );
              }
            )}

          </div>

          {trigger && (
            <p className="mt-3 text-xs text-slate-400">
              One trigger can have one
              template for each channel.
            </p>
          )}
        </FormField>


        {/* EMAIL SUBJECT */}
        {channel === "EMAIL" && (
          <FormField label="Subject">
            <input
              value={subject}
              onChange={(event) =>
                setSubject(
                  event.target.value
                )
              }
              placeholder="Login Successful"
              className={inputClass}
              disabled={loading}
            />
          </FormField>
        )}


        {/* WEB PUSH TITLE */}
        {channel === "WEB_PUSH" && (
          <FormField label="Title">
            <input
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value
                )
              }
              placeholder="Login Successful"
              className={inputClass}
              disabled={loading}
            />
          </FormField>
        )}


        {/* MESSAGE */}
        <FormField label="Message">
          <textarea
            value={body}
            onChange={(event) =>
              setBody(event.target.value)
            }
            rows={6}
            placeholder="Hello {{user_name}}, welcome back!"
            className={`${inputClass} resize-none`}
            disabled={loading}
          />

          <p className="mt-2 text-xs text-slate-400">
            Use variables like{" "}
            <span className="font-semibold text-blue-600">
              {"{{user_name}}"}
            </span>{" "}
            inside your message.
          </p>
        </FormField>


        {/* QUICK VARIABLE INSERT */}
        {variables.length > 0 && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">

            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Insert Variable
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {variables
                .filter(
                  (variable) =>
                    variable?.name?.trim()
                )
                .map(
                  (variable, index) => (
                    <button
                      key={
                        variable.id ||
                        `${variable.name}-${index}`
                      }
                      type="button"
                      disabled={loading}
                      onClick={() =>
                        insertVariable(
                          variable.name.trim()
                        )
                      }
                      className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-blue-600 shadow-sm ring-1 ring-blue-100 transition hover:bg-blue-100 disabled:opacity-50"
                    >
                      {"{{"}
                      {variable.name.trim()}
                      {"}}"}
                    </button>
                  )
                )}
            </div>
          </div>
        )}


        {/* VARIABLES */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800">
                Variables
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Add information that changes
                in each message.
              </p>
            </div>

            <button
              type="button"
              onClick={addVariable}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus size={17} />
              Add Variable
            </button>
          </div>


          {/* EMPTY */}
          {variables.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
              <p className="text-sm text-slate-500">
                No variables added.
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Example: user_name
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

                    {/* HEADER */}
                    <div className="mb-5 flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-700">
                        Variable {index + 1}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteVariable(
                            index
                          )
                        }
                        disabled={loading}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        aria-label="Delete variable"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>


                    {/* NAME + VALUE */}
                    <div className="grid gap-4 md:grid-cols-2">

                      <FormField label="Name">
                        <input
                          value={
                            variable.name || ""
                          }
                          onChange={(event) =>
                            updateVariable(
                              index,
                              "name",
                              event.target.value
                            )
                          }
                          placeholder="user_name"
                          className={inputClass}
                          disabled={loading}
                        />
                      </FormField>


                      <FormField label="Default Value">
                        <input
                          value={
                            variable.default_value ||
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
                          className={inputClass}
                          disabled={loading}
                        />
                      </FormField>

                    </div>


                    {/* DESCRIPTION */}
                    <div className="mt-4">
                      <FormField label="Description">
                        <input
                          value={
                            variable.description ||
                            ""
                          }
                          onChange={(event) =>
                            updateVariable(
                              index,
                              "description",
                              event.target.value
                            )
                          }
                          placeholder="Name of the user"
                          className={inputClass}
                          disabled={loading}
                        />
                      </FormField>
                    </div>


                    {/* PREVIEW */}
                    {variable.name?.trim() && (
                      <div className="mt-4 rounded-xl bg-blue-50 px-4 py-3">

                        <p className="text-xs text-slate-500">
                          Template variable
                        </p>

                        <p className="mt-1 text-sm font-semibold text-blue-600">
                          {"{{"}
                          {variable.name.trim()}
                          {"}}"}
                        </p>

                        {variable.default_value?.trim() && (
                          <p className="mt-1 text-xs text-slate-500">
                            Preview:{" "}
                            <span className="font-medium text-slate-700">
                              {variable.default_value}
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


        {/* ACTIVE */}
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={active}
            onChange={(event) =>
              setActive(
                event.target.checked
              )
            }
            disabled={loading}
            className="h-4 w-4 rounded border-slate-300 text-blue-600"
          />

          <span className="text-sm font-medium text-slate-700">
            Template is active
          </span>
        </label>

      </div>


      {/* FOOTER */}
      <div className="flex shrink-0 justify-end gap-3 border-t border-slate-200 bg-white px-6 py-5">

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
          disabled={
            loading ||
            !trigger ||
            triggers.length === 0
          }
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Saving..."
            : isEdit
            ? "Save Changes"
            : "Create Template"}
        </button>

      </div>

    </form>
  );
}


/*
 * ============================================================
 * FORM FIELD
 * ============================================================
 */

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

export default TemplateForm;